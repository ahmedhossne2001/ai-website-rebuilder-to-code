# Visual Comparison (first implementation)

The **Compare** tab lets you visually compare a reference screenshot against the current generated preview.

## Alignment & difference (new)
- In **Overlay**, the screenshot width is initially matched to the current preview viewport (1366px desktop or 375px mobile, scaled to fit the pane).
- Use **Zoom**, **Horizontal** and **Vertical** sliders to manually align the screenshot content if it contains browser chrome, margins, or a different capture viewport.
- **Reset alignment** returns zoom and offsets to defaults.
- The new **Difference** mode uses a CSS difference blend to make divergent regions easier to see. This is a visual aid, **not a quantitative similarity score**, nor a pixel-by-pixel screenshot comparison.
- For accurate comparisons, capture only the target webpage at the same viewport width as the generated preview; crop browser chrome first.

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
5. Switch to **Overlay** and drag the opacity slider; use zoom and offset controls for alignment.\n6. Switch to **Difference** and inspect visible mismatches; reset alignment.
7. Switch Desktop/Mobile; confirm the preview adapts.
8. Reopen a project or change versions; verify behavior.
9. Confirm there are no errors in browser console.

## Current limitations
- Manual screenshots chosen in Compare are not automatically saved with named projects or JSON backup.
- Width auto-fit and manual position/zoom are available. Fully automatic content registration, calibrated pixel-diff scores, URL capture and AI-based visual assessment are not yet implemented.
- Different source screenshot dimensions and viewport sizes can make overlays visually misleading.
- The live preview can run generated scripts: only import trusted generated code.
- This implementation is committed to the development branch but has **not yet been rebuilt or UI-tested on the user's Mac or Windows PC**.
