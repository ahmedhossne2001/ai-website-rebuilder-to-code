# Multi-Section Website Generation — development milestone

Updated 2026-10-27. Branch: `feature/hybrid-cross-platform-setup`.

## Goal

Use the **existing** locally captured screenshots of an approved public webpage as multiple reference images for one React reconstruction. No extra Chromium capture or AI spending is required until the user **explicitly confirms** the generation action.

## Usage

1. **New → URL** and enter `https://www.alhashmyahh.com/`.
2. Choose **Desktop** and enable **Full Page (bounded)**.
3. Click **Analyze URL (no AI)**. Review the first viewport and up to three extra bounded screenshots.
4. Choose the screenshots using the checkbox attached to each image; **first viewport is selected by default**, optional sections are initially excluded. Deselect any unwanted shots. At least one is required.
5. Click **Download PNG** per image to save locally without provider charges.
6. Click **Review & Generate with AI**. The confirmation panel previews exactly the selected images, explains API charging and provides **Cancel (no API call)**.
7. Press **Confirm & Generate** only if ready to pay for the configured AI model's API usage. The existing generator receives the selected screenshots in top-to-bottom order and explicit instructions to recreate a **single** responsive RTL-friendly page without duplicating persistent headers.

## Safeguards and limitations

- Multi-image generation can cost more than a single image. Test Mode limits variants but is **not** a spending cap.
- The existing `doCreate` function already accepts arrays of image URLs and stores them as prompt assets; this change reuses that supported path.
- The page-generation model must support the chosen number/size of images. Provider limits may still reject an input; no claim of universal model compatibility.
- Screenshots may have gaps between scroll positions, sticky header repetitions or absent JavaScript/remote assets; they are not a perfect full page.
- Generated UI is an independent reconstruction, **not** an extraction of any private site code, backend or database.
- Generated React is a proposal: visually verify with **Compare**, test exports and remove unsupported/invented functionality before production.
- The target site remains untouched. The URL analyzer is local-only and its browser network egress restrictions are **not** sufficiently hardened for arbitrary production URLs.
- The UI resets image selection whenever URL, device, Full Page selection, or analysis response changes, to avoid sending images from a different capture.

## Verification plan (Mac before Windows)

- [ ] Docker rebuild succeeds and URL panel renders.
- [ ] Analyze the owned site without AI. Confirm four screenshots are available.
- [ ] Verify checkbox selection and exact image count.
- [ ] Download the first and another section to PNG, inspect files.
- [ ] Click Review; verify confirmation preview only contains selected images.
- [ ] Click Cancel and confirm no generation started.
- [ ] If user elects to spend API credits, confirm once with Claude/Test Mode and inspect React output.
- [ ] Save resulting code in Project Manager; export React ZIP and run build.
- [ ] Repeat basic capture/selection workflow on Windows.

**Status:** code committed to development branch. Build/UI tests and paid multi-image generation have **not yet been run**.
