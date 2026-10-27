# Hybrid AI architecture — implementation baseline

## Intended model

- **Local**: Vite/React browser UI; FastAPI backend, project source and generated code; preview via Playwright/Chromium in Docker.
- **Cloud on demand**: OpenAI, Anthropic, or Gemini model APIs for screenshot understanding and code generation; Replicate optional for image operations.
- **Future optional**: local-model inference via Ollama after tests confirm model compatibility and acceptable output. Offline AI generation is **not currently implemented**.

## First-release contract

1. Preserve existing multiple-provider model selection; do not hardcode a sole provider.
2. Read provider credentials from local untracked environment configuration (or existing upstream UI settings when explicitly chosen).
3. Never commit actual credentials or copy them into documentation/screenshots.
4. Display a clear notice that requests may be sent to the selected external provider.
5. Evaluate budget limits and per-request cost estimates before offering any enforced spend cap.
6. Focus on browser-based Mac/Windows parity before packaging desktop installers.

## Acceptance backlog

- [ ] Verify `docker compose up --build` on macOS (Intel and Apple Silicon as available).
- [ ] Verify the same on Windows 11 using WSL2.
- [ ] Confirm successful generation using only one provider key.
- [ ] Test screenshot → code → preview → export on each OS.
- [ ] Add a visible per-provider privacy disclosure before submission.
- [ ] Implement optional, testable budget tracking and user-controlled caps (provider-side billing limits recommended).
- [ ] Investigate Ollama as a later **opt-in** feature, not a prerequisite.

## Limits

This plan does not claim finished platform compatibility, offline generation, billing controls, or standalone installers.
