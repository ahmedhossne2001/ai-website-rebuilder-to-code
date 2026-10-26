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


def approved_hosts() -> set[str]:
    return {
        h.strip().lower().rstrip(".")
        for h in os.getenv("ANALYZER_ALLOWED_HOSTS", "example.com").split(",")
        if h.strip()
    }


def verify_url(url: str) -> str:
    value = url.strip()
    try:
        parsed = urlsplit(value)
        hostname = (parsed.hostname or "").lower().rstrip(".")
        if (
            parsed.scheme != "https"
            or not hostname
            or hostname not in approved_hosts()
            or parsed.username is not None or parsed.password is not None
            or parsed.port not in (None, 443)
            or "\\" in value or any(ord(c) < 32 for c in value)
        ):
            raise ValueError("URL must be HTTPS on an explicitly approved public hostname.")
        ipaddress.ip_address(hostname)
        raise ValueError("IP-address targets are not allowed.")
    except ValueError as exc:
        if str(exc) == "IP-address targets are not allowed.":
            raise
        if "URL must be HTTPS" in str(exc):
            raise
        # Literal IP test raises ValueError for ordinary hostnames; expected.
    return value


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
                except (ValueError, Exception):
                    await route.abort()
            await page.route("**/*", route_request)
            response = await page.goto(url, wait_until="domcontentloaded", timeout=15000)
            if not response or response.status >= 400:
                raise ValueError("Page failed to load successfully.")
            final_url = verify_url(page.url)
            await verify_public_dns(final_url)
            screenshot = await page.screenshot(type="png", full_page=False, timeout=12000)
            if len(screenshot) > 5_000_000:
                raise ValueError("Screenshot is too large.")
            # Text-only DOM inspection. No scripts from the target page are executed.
            details = await page.evaluate("""() => {
              const els = [...document.querySelectorAll('h1,h2,p,button,a')].slice(0,120);
              return {
                title: document.title.slice(0, 160),
                headings: [...document.querySelectorAll('h1,h2')].slice(0,15).map(e => (e.textContent || '').trim().slice(0,120)),
                colors: [...new Set(els.map(e => getComputedStyle(e).color))].slice(0,10),
                backgrounds: [...new Set([document.body, ...els].map(e => getComputedStyle(e).backgroundColor))].slice(0,10),
                fonts: [...new Set(els.map(e => getComputedStyle(e).fontFamily))].slice(0,10)
              };
            }""")
            await browser.close()
        return {
            "url": final_url,
            "device": body.device,
            "viewport": viewport,
            "screenshot": "data:image/png;base64," + base64.b64encode(screenshot).decode(),
            "design": details,
            "limitations": "JavaScript disabled; remote third-party assets blocked unless explicitly allowlisted. Layout may be incomplete.",
        }
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:
        print(f"Analyze URL failed: {type(exc).__name__}", flush=True)
        raise HTTPException(status_code=502, detail="Could not inspect this page safely.") from exc
