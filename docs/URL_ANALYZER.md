# URL Website Analyzer — restricted first milestone

## Status
First implementation committed to the development branch, **not yet verified in Docker**. Mac and Windows behavior must be tested before merging or making a production claim.

## Use
1. Pull branch `feature/hybrid-cross-platform-setup` and run `docker compose up -d --build`.
2. Open http://localhost:5173 and choose **New → URL**.
3. Enter **https://example.com**, which is the only hostname allowed by default.
4. Choose Desktop or Mobile and click **Analyze URL (no AI)**.
5. If it succeeds, inspect screenshot, title, headings, text/background colors, and fonts.
6. Only if desired, click **Generate with selected AI model** (uses the existing image generation flow and can incur Anthropic API charges).
7. The original **Capture & Generate (ScreenshotOne)** remains available if a separate ScreenshotOne API key is configured.

## Security boundaries
- Strict HTTPS-only hostname allowlist, `ANALYZER_ALLOWED_HOSTS`, comma-separated. Default is `example.com`.
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

Known limitation: design summary extracts only visible basic style values and some headings; no multi-page crawling, content similarity score, full DOM tree, or automatic color ranking.
