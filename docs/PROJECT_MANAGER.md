# Project Manager — local saved projects

This is an **opt-in named-project library** stored in the browser's localStorage on your computer. It builds on the existing portable JSON Save/Open feature.

## Using it on Mac or Windows

1. Open the app at http://localhost:5173 after updating Docker.
2. Import an HTML file or finish generating a page.
3. Click **Projects** in the left sidebar.
4. Enter a descriptive name such as "Hotel Homepage" and select **Save current**.
5. Click **New**, then **Projects → Open** to reopen the named project without using an AI API.
6. **Rename** changes a project's display name. **Delete** removes the named snapshot from that browser after confirmation.
7. **Backup** downloads a portable JSON snapshot; **Open JSON backup** imports a previously exported one. Keep important backups in a safe folder.

## What is stored
Generated code, version history, selected version, prompt assets, reference images and the initial prompt. **API keys and model provider credentials are not saved** by this feature.

## Constraints and privacy
- These projects are saved **only in this browser profile** on the current computer, not in GitHub or a cloud account.
- Clearing site data, changing browsers/profiles, or removing browser storage may erase them.
- The per-project browser storage limit is **3 million JSON characters**; larger projects should use **Backup current JSON** or the existing Save control. The browser may impose lower total storage limits.
- Saving is disabled during generation. Opening a project prompts before replacing unsaved work.
- Project data may contain sensitive prompt text, images, or scripts; use trusted backups and do not upload them to public repositories.
- No background auto-save and no synchronization between Mac and Windows are claimed.

## Functional checks

- [ ] Import Hello World → Projects → name/save → New → Projects → Open; compare preview.
- [ ] Rename saved project → verify name changes.
- [ ] Backup → Open JSON backup → check preview.
- [ ] Delete an intentionally disposable project → verify removal.
- [ ] Check handling of browser storage full and oversized projects.
- [ ] Confirm existing Save/Open buttons still work independently.
- [ ] Run frontend typecheck/build and test interactions on Mac and Windows.

This initial implementation is committed to the development branch. It requires local integration testing before merging to main.
