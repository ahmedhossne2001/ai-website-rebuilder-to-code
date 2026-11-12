"""Conservative public-page analyzer using the installed local Chromium.

SECURITY: Intended only for local trusted installations. A hostname allowlist is
mandatory. DNS and redirect checks reduce SSRF risk; browser network isolation
must additionally be enforced before enabling arbitrary domains on public servers.
"""
import asyncio
import base64
import ipaddress
import os
import socket
from urllib.parse import urlsplit

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from playwright.async_api import async_playwright

router = APIRouter()


class AnalyzeRequest(BaseModel):
    url: str = Field(min_length=8, max_length=2048)
    device: str = "desktop"
    fullPage: bool = False


def approved_hosts() -> set[str]:
    return {
        h.strip().lower().rstrip(".")
        for h in os.getenv("ANALYZER_ALLOWED_HOSTS", "example.com").split(",")
        if h.strip()
    }


def verify_url(url: str) -> str:
    value = url.strip()
    parsed = urlsplit(value)
    hostname = (parsed.hostname or "").lower().rstrip(".")
    try:
        port = parsed.port
    except ValueError as exc:
        raise ValueError("Invalid URL port.") from exc
    if (
        parsed.scheme != "https"
        or not hostname
        or hostname not in approved_hosts()
        or parsed.username is not None or parsed.password is not None
        or port not in (None, 443)
        or "\\\\" in value or any(ord(c) < 32 for c in value)
    ):
        raise ValueError("URL must be HTTPS on an explicitly approved public hostname.")
    try:
        ipaddress.ip_address(hostname)
    except ValueError:
        return value
    raise ValueError("IP-address targets are not allowed.")


async def verify_public_dns(url: str) -> None:
    hostname = urlsplit(verify_url(url)).hostname
    assert hostname is not None
    try:
        addresses = await asyncio.wait_for(
            asyncio.to_thread(socket.getaddrinfo, hostname, 443, 0, socket.SOCK_STREAM),
            timeout=5,
        )
    except (OSError, asyncio.TimeoutError) as exc:
        raise ValueError("Could not resolve the approved hostname.") from exc
    if not addresses:
        raise ValueError("Hostname has no DNS addresses.")
    for record in addresses:
        address = ipaddress.ip_address(record[4][0])
        if not address.is_global:
            raise ValueError("Hostname resolves to a non-public network address.")


@router.post("/api/analyze-url")
async def analyze_url(body: AnalyzeRequest):
    if body.device not in ("desktop", "mobile"):
        raise HTTPException(status_code=422, detail="Device must be desktop or mobile.")
    try:
        url = verify_url(body.url)
        await verify_public_dns(url)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    viewport = {"width": 1366, "height": 850} if body.device == "desktop" else {"width": 375, "height": 812}
    try:
        async with async_playwright() as playwright:
            browser = await playwright.chromium.launch(
                headless=True,
                args=["--no-sandbox", "--disable-dev-shm-usage", "--disable-background-networking"],
            )
            context = await browser.new_context(
                viewport=viewport, device_scale_factor=1,
                service_workers="block", accept_downloads=False,
                java_script_enabled=False, ignore_https_errors=False,
            )
            page = await context.new_page()
            # All requests are denied unless their URL and DNS pass the policy,
            # including third-party resources, redirects, and iframe requests.
            async def route_request(route):
                try:
                    target = route.request.url
                    verify_url(target)
                    await verify_public_dns(target)
                    await route.continue_()
                except Exception:
                    await route.abort()
            await page.route("**/*", route_request)
            response = await page.goto(url, wait_until="domcontentloaded", timeout=15000)
            if not response or response.status >= 400:
                raise ValueError("Page failed to load successfully.")
            final_url = verify_url(page.url)
            await verify_public_dns(final_url)
            # Let allowed stylesheet/font resources settle before sampling.
            try:
                await page.wait_for_load_state("networkidle", timeout=3500)
            except Exception:
                pass  # Some pages keep connections open; inspect what rendered.
            try:
                await page.evaluate("() => document.fonts.ready")
            except Exception:
                pass
            details = await page.evaluate("""() => {
              const visible = (e) => {
                const r = e.getBoundingClientRect();
                const cs = getComputedStyle(e);
                return r.width > 0 && r.height > 0 &&
                    cs.display !== 'none' && cs.visibility !== 'hidden';
              };
              const sample = (e) => {
                const cs = getComputedStyle(e), r = e.getBoundingClientRect();
                return {
                  tag: e.tagName.toLowerCase(),
                  text: (e.innerText || e.textContent || '').trim().slice(0, 120),
                  x: Math.round(r.x), y: Math.round(r.y),
                  width: Math.round(r.width), height: Math.round(r.height),
                  color: cs.color, background: cs.backgroundColor,
                  font: cs.fontFamily.slice(0, 120), fontSize: cs.fontSize,
                  weight: cs.fontWeight
                };
              };
              const all = [...document.querySelectorAll('h1,h2,h3,p,button,a,header,nav,section,main,img')];
              const items = all.filter(visible).slice(0, 250);
              const headings = items.filter(e => /^H[1-3]$/.test(e.tagName))
                  .slice(0, 25).map(e => (e.innerText || e.textContent || '').trim().slice(0, 160));
              const colors = [...new Set(items.map(e => getComputedStyle(e).color))].slice(0, 16);
              const backgrounds = [...new Set([document.body, ...items].map(e => getComputedStyle(e).backgroundColor))].slice(0, 16);
              const fonts = [...new Set(items.map(e => getComputedStyle(e).fontFamily))].slice(0, 16);
              const rects = items.filter(e => /^(H1|H2|H3|BUTTON|HEADER|NAV|MAIN|SECTION)$/.test(e.tagName))
                .slice(0, 40).map(sample);
              const bodyText = (document.body?.innerText || document.body?.textContent || '').trim();
              return {
                title: document.title.slice(0, 160), headings, colors, backgrounds, fonts,
                language: document.documentElement.lang || null,
                direction: getComputedStyle(document.body).direction,
                bodyTextSample: bodyText.slice(0, 450),
                visibleElementCount: items.length,
                linkCount: document.querySelectorAll('a[href]').length,
                imageCount: document.querySelectorAll('img').length,
                sections: rects,
                documentHeight: document.documentElement.scrollHeight,
                // Metadata only: never fetch assets from the analyzer backend.
                assetCandidates: [...document.querySelectorAll('img, picture source, header, section, div')]
                  .slice(0, 500).flatMap((el) => {
                    const sources = [];
                    if (el.tagName === 'IMG' && el.getAttribute('src')) {
                      sources.push({ source: el.currentSrc || el.src, kind: 'image', alt: el.alt || '', width: el.naturalWidth || el.width, height: el.naturalHeight || el.height });
                    }
                    if (el.tagName === 'SOURCE' && el.getAttribute('srcset')) {
                      const first = (el.getAttribute('srcset') || '').split(',')[0].trim().split(/\\s+/)[0];
                      if (first) sources.push({ source: new URL(first, document.baseURI).href, kind: 'picture', alt: '', width: 0, height: 0 });
                    }
                    const bg = getComputedStyle(el).backgroundImage;
                    if (bg && bg !== 'none') {
                      const m = bg.match(/^url\\(["']?(.*?)["']?\\)$/);
                      if (m) sources.push({ source: new URL(m[1], document.baseURI).href, kind: 'background', alt: '', width: 0, height: 0 });
                    }
                    return sources;
                  }).filter((item) => {
                    try {
                      const url = new URL(item.source);
                      return url.protocol === 'https:' && url.hostname === location.hostname &&
                        !url.username && !url.password && (url.port === '' || url.port === '443') &&
                        !/[<>]/.test(item.source);
                    } catch { return false; }
                  }).filter((item, i, all) => all.findIndex((other) => other.source === item.source) === i)
                    .slice(0, 24),
              };
            }""")
            warnings = []
            if not details["headings"]:
                warnings.append("No visible H1-H3 headings detected; page content may be incomplete.")
            if details["visibleElementCount"] < 8:
                warnings.append("Very few visible elements detected; inspect screenshot before generating.")
            max_full_height = 4500
            captured_full_page = False
            if body.fullPage and details["documentHeight"] <= max_full_height and details["documentHeight"] * viewport["width"] <= 6_000_000:
                captured_full_page = True
            elif body.fullPage:
                warnings.append("Page exceeds safe full-page capture limits (4500px height or 6MP); first viewport captured instead.")
            if not captured_full_page and details["documentHeight"] > viewport["height"]:
                warnings.append("Screenshot shows the first viewport only; more content exists below.")
            screenshot = await page.screenshot(type="png", full_page=captured_full_page, timeout=15000)
            tiles = []
            if body.fullPage and not captured_full_page:
                # Bounded sectional capture: preserve the original viewport image and
                # collect additional screenshots without producing a huge bitmap.
                # A tile never exceeds the viewport resolution. No scrolling scripts
                # from the target website are executed (page JS remains disabled).
                total_height = min(int(details["documentHeight"]), 20_000)
                step = viewport["height"]
                positions = list(range(step, total_height, step))
                if positions:
                    # Sample up to 3 additional positions across long documents.
                    if len(positions) > 3:
                        indices = [0, len(positions) // 2, len(positions) - 1]
                        positions = [positions[i] for i in sorted(set(indices))]
                    for y in positions:
                        await page.evaluate("(y) => window.scrollTo(0, y)", y)
                        await page.wait_for_timeout(180)
                        tile = await page.screenshot(type="png", full_page=False, timeout=12000)
                        if len(tile) > 2_500_000:
                            warnings.append("A lower-page section was skipped because its image exceeded the per-tile size limit.")
                            continue
                        tiles.append({
                            "y": y,
                            "image": "data:image/png;base64," + base64.b64encode(tile).decode(),
                        })
                    if tiles:
                        warnings.append(f"Long page: captured first viewport plus {len(tiles)} additional section(s), not a continuous full-page image.")
                    else:
                        warnings.append("Long page: additional section capture was not possible within safety limits.")
                    await page.evaluate("() => window.scrollTo(0, 0)")
            if len(screenshot) > 5_000_000:
                raise ValueError("Screenshot is too large.")
            await browser.close()
        return {
            "url": final_url,
            "device": body.device,
            "viewport": viewport,
            "capturedFullPage": captured_full_page,
            "sectionsCaptured": tiles,
            "screenshot": "data:image/png;base64," + base64.b64encode(screenshot).decode(),
            "design": details,
            "warnings": warnings,
            "limitations": "JavaScript disabled; remote third-party assets blocked unless explicitly allowlisted. Layout may be incomplete.",
        }
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        print(f"Analyze URL failed: {type(exc).__name__}", flush=True)
        raise HTTPException(status_code=502, detail="Could not inspect this page safely.") from exc
