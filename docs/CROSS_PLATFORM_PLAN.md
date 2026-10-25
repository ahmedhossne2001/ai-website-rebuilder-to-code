# Cross-platform development plan (macOS + Windows)

## Goal
Make AI Website Rebuilder usable on macOS and Windows from its first MVP. The initial product is a browser-based local application; native installers are optional future scope.

## Existing baseline
- React/Vite frontend (port 5173)
- Python/FastAPI backend (port 7001)
- Existing Docker Compose configuration and Dockerfiles
- Poetry for backend dependencies and pnpm for frontend dependencies

## Deliverables
- [ ] Audit Dockerfiles and compose configuration for platform-specific assumptions
- [ ] Provide .env.example with placeholders and no secrets
- [ ] Document Docker Desktop install and first run on macOS (Apple Silicon/Intel)
- [ ] Document Docker Desktop/WSL2 setup and first run on Windows 11
- [ ] Confirm compatibility with Docker Compose v2
- [ ] Verify Playwright/Chromium capture within containers
- [ ] Add smoke tests for screenshot -> code -> preview -> export on both OSes
- [ ] Add CI for lint, build, and automated tests
- [ ] Document security, API usage costs, troubleshooting and limitations

## Acceptance criteria
1. Fresh checkout starts via documented `docker compose up --build` on both platforms.
2. UI can be accessed at http://localhost:5173.
3. No secrets are checked into git.
4. Screenshot-to-code, preview and export work on both platforms after verification.
5. Platform differences and known issues are explicitly documented.

## Future enhancement
After local application is stable, evaluate packaging into optional macOS .dmg and Windows .exe distributions.

## Attribution
Based on https://github.com/abi/screenshot-to-code ; keep the upstream MIT LICENSE and copyright notice.
