# URL Website Analyzer — restricted first milestone

## Status
First implementation committed to the development branch, **not yet verified in Docker**. Mac and Windows behavior must be tested before merging or making a production claim.

## Use
1. Pull branch `feature/hybrid-cross-platform-setup` and run `docker compose up -d --build`.
2. Open http://localhost:5173 and choose **New → URL**.
3. Enter **https://example.com**, which is approved in the local Docker configuration.
4. Choose Desktop or Mobile and click **Analyze URL (no AI)**.
5. If it succeeds, inspect screenshot, title, headings, text/background colors, fonts, language/RTL direction, basic layout geometry and quality warnings.
6. Only if desired, click **Generate with selected AI model** (uses the existing image generation flow and can incur Anthropic API charges).
7. The original **Capture & Generate (ScreenshotOne)** remains available if a separate ScreenshotOne API key is configured.

## Security boundaries
- Strict HTTPS-only hostname allowlist, `ANALYZER_ALLOWED_HOSTS`, comma-separated. The local development Compose file now allows `example.com`, `www.alhashmyahh.com`, and `alhashmyahh.com` (read-only testing only); the Python endpoint itself defaults to `example.com` when not configured.
- DNS lookup rejects any non-global address; literal IP targets and non-443 ports are rejected.
- Chromium request interception checks each resource request, including redirect destinations. Third-party sites and resources are blocked unless explicitly allowlisted.
- Page JavaScript is disabled, service workers are blocked, downloads are disabled, navigation timeouts are enforced.
- Chromium network isolation is **not fully guaranteed against DNS rebinding or browser-level network bypass** by application logic alone. DO NOT expose this endpoint publicly or enable arbitrary untrusted hostnames. Before production: enforce egress firewall/proxy restrictions at the container/network layer, strong authentication, request quotas, and rate limiting.
- Many websites require JavaScript or third-party resources to render; this first phase can show incomplete layout, particularly on complex websites.

## Configure other sites (only trusted, approved public domains)
Edit Docker environment, e.g. under the backend service:
`ANALYZER_ALLOWED_HOSTS: "example.com,approved-site.com"`
Then recreate the container. This does not override the need for egress controls.

## Manual test checklist
- Analyze `https://example.com` successfully without Claude API calls.
- Verify `http://`, localhost, 127.0.0.1, internal addresses, unknown public domains and nonstandard ports are rejected.
- Toggle desktop/mobile viewport.
- Verify **Generate with selected AI model** is available only after analysis.
- Inspect `docker compose logs --tail=100 backend` if analysis fails.
- Confirm no API key is displayed in the UI/logs.
- Run `cd backend && poetry run pytest tests/test_url_analyzer.py -q`.

Known limitation: the analyzer now samples first-viewport DOM metadata (limited elements) and emits quality warnings; it does not reconstruct the full DOM, crawl multiple pages, measure similarity or support dynamic-JS websites. **Do not interpret a successful HTTP response as a complete capture.**

## 2026-10-26 — owned Arabic website test and richer diagnostics

The user identified `https://www.alhashmyahh.com/` as an organization-owned site suitable for read-only testing. The page publicly describes manufacturing, aluminum/glass, contracting and project sections. This is a useful Arabic/RTL regression fixture. The local Compose configuration adds this host to the explicit allowlist. **External images, scripts, stylesheets and redirects to domains outside the allowlist remain blocked.** Many production website assets therefore will not load correctly; this is not a fidelity guarantee.

New analysis fields: `language`, computed `direction`, `bodyTextSample`, counts of visible sample elements, hyperlinks and images, document height and bounding boxes of selected headings/sections/buttons. A warning appears if no headings are found, few elements are visible, or content extends below the captured viewport. Chromium waits briefly for eligible resources/fonts; JavaScript remains disabled.

**Security warning:** Application-level DNS checks plus Playwright interception are not sufficient isolation for untrusted URLs; network egress restrictions and DNS pinning are still required before any publicly exposed service. Use the development environment locally only.

### Next Mac tests
1. Rebuild Docker; analyze `https://example.com` to verify richer metadata.
2. Analyze `https://www.alhashmyahh.com/` in **Desktop** and **Mobile** modes; check Arabic and RTL, screenshot completeness and warnings.
3. Save screenshots of both results, note blocked assets or layout failures, and refrain from Claude generation until capture quality is acceptable.
4. If navigation fails, inspect backend logs; redirects or third-party resources may be blocked intentionally.
