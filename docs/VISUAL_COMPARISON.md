# Visual Comparison (first implementation)

The **Compare** tab lets you visually compare a reference screenshot against the current generated preview.

## Features
- **Side by side** shows the original screenshot and the generated site simultaneously.
- **Overlay** superimposes the screenshot on the live preview; adjust opacity (0–100%) with the slider.
- **Desktop/Mobile** controls change the generated preview viewport.
- If the current creation version has a reference image, it is selected automatically.
- For projects created from text or imported HTML, choose a local **PNG/JPEG/WebP** screenshot (up to 10 MB).
- Comparison uses browser rendering only and **does not make a Claude API request**. The manually selected screenshot is held only for the current comparison session and is not uploaded to the server by this feature.

## Manual verification on macOS and Windows
1. Pull `feature/hybrid-cross-platform-setup`; rebuild with `docker compose up -d --build`.
2. Open a saved or imported project at http://localhost:5173.
3. Click **Compare** near Desktop/Mobile/Code.
4. Choose a reference screenshot; confirm the side-by-side view.
5. Switch to **Overlay** and drag the opacity slider.
6. Switch Desktop/Mobile; confirm the preview adapts.
7. Reopen a project or change versions; verify behavior.
8. Confirm there are no errors in browser console.

## Current limitations
- Manual screenshots chosen in Compare are not automatically saved with named projects or JSON backup.
- No pixel-diff score, automatic resizing/alignment, URL capture, or AI-based visual assessment in this first release.
- Different source screenshot dimensions and viewport sizes can make overlays visually misleading.
- The live preview can run generated scripts: only import trusted generated code.
- This implementation is committed to the development branch but has **not yet been rebuilt or UI-tested on the user's Mac or Windows PC**.
