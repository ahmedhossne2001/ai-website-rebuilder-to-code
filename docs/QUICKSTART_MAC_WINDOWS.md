# AI Website Rebuilder — macOS and Windows quick start

This fork currently runs a **local browser-based application** using React/Vite + Python/FastAPI. It is **not yet a standalone .dmg/.exe desktop application**. AI code generation uses external provider APIs and therefore requires an internet connection; local browsing, reviewing source code, and project files need not send data to those APIs.

## Prerequisites

- Git
- Docker Desktop with Docker Compose v2
- **macOS**: Docker Desktop for your Apple Silicon or Intel Mac
- **Windows 11**: Docker Desktop with WSL2 backend enabled (enable virtualization/WSL2 if prompted)
- At least one valid API key from OpenAI, Anthropic, or Gemini. API usage may incur charges independently of ChatGPT subscriptions.

## Setup (same instructions on macOS and Windows)

1. Clone your repository:

   ```sh
   git clone https://github.com/ahmedhossne2001/ai-website-rebuilder-to-code.git
   cd ai-website-rebuilder-to-code
   ```

2. Copy the template to `.env` in the **repository root**:

   **macOS Terminal:**
   ```sh
   cp .env.example .env
   ```

   **Windows PowerShell:**
   ```powershell
   Copy-Item .env.example .env
   ```

3. Open `.env` in your editor. Fill in **at least one** of `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, or `GEMINI_API_KEY`. Leave unused keys blank. Do not share or commit this file.

4. Make sure Docker Desktop is running, then from the repository root:

   ```sh
   docker compose up --build -d
   ```

5. Open **http://localhost:5173**. API runs locally at **http://localhost:7001**.

6. To inspect logs:

   ```sh
   docker compose logs -f
   ```

   To stop:

   ```sh
   docker compose down
   ```

## Development mode (alternative)

This upstream project also supports the separate frontend/backend development flow. Review the root README for Poetry, pnpm, and Playwright commands. Docker is the recommended **first-run** path for both platforms; the current Docker configuration doesn't hot-reload code changes.

## Privacy and cost

- Screenshots, prompts and other inputs submitted for generation can be sent to whichever external model provider you select. Do not submit sensitive information without authorization.
- API charges depend on the provider and model; no budget cap or automatic cost limiter has yet been implemented.
- This version does **not** provide offline AI generation. Ollama/local model support is a future option requiring separate compatibility and quality evaluation.
- Do not attempt to inspect private sites or bypass access controls. Only work with sites you own or are authorized to inspect.

## Troubleshooting

- **Port occupied**: close any program using ports 5173/7001. The existing Compose file uses these ports.
- **Docker does not start on Windows**: confirm WSL2 and virtualization are enabled; restart Docker Desktop.
- **No model available**: confirm `.env` contains a valid provider key; then restart with `docker compose up -d --build`.
- **Preview unavailable**: inspect `docker compose logs backend` for Playwright/Chromium initialization errors.
- **Architecture/build issues**: collect `docker compose logs` and your CPU architecture before reporting.

## Verification status

Instructions and configuration are committed as an **initial cross-platform setup**, but end-to-end execution has **not** been verified on actual Mac and Windows hardware in this change. Required follow-up: execute screenshot → code → preview → export smoke tests on each platform.
