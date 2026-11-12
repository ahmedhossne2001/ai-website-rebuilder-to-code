# AI Website Rebuilder: Test Mode

This feature is on the development branch `feature/hybrid-cross-platform-setup` until reviewed and merged.

## What it does
- **Settings → Test Mode — One Variant**: enable the toggle.
- Choose exactly one model:
  - **OpenAI** → GPT-5.4 Mini Low (requires OPENAI_API_KEY)
  - **Anthropic** → Claude Sonnet 4.6 (requires ANTHROPIC_API_KEY)
  - **Gemini** → Gemini 3 Flash Minimal (requires GEMINI_API_KEY)
- When enabled, the frontend initializes **one variant** and the backend sends **one model** to code generation.
- The backend will not silently switch to another provider if the selected API key is missing.
- Existing multi-variant behavior remains available by disabling the toggle.

## Quick start on Mac or Windows
1. In your existing checkout, run `git pull origin feature/hybrid-cross-platform-setup`.
2. Rebuild the backend and frontend to load the changes: `docker compose up -d --build`.
3. Open http://localhost:5173; open Settings (bottom-left).
4. Enable **Test Mode — One Variant**; select **GPT-5.4 Mini Low (OpenAI)** if OpenAI key is configured.
5. Turn off **Placeholder Images** for a simpler test.
6. Test with a minimal Hello World prompt using **Text → React + Tailwind**.
7. If generation fails, do not retry blindly. Read `docker compose logs --tail=120 backend` and the browser developer console.

## Cost and privacy
Test Mode limits **parallel variants**, not the number of internal AI tool calls or tokens. Charges can still occur. No enforced budget cap is implemented; set billing limits with your API provider. Prompt and generated content may be transmitted to the selected model provider.

## Verification
Automated regression tests have been added but have **not been run on your Mac/Windows device by this change**. Verify on a local installation before merging the draft PR.
