# Saving and reopening AI Website Rebuilder projects

The left toolbar now has **Save** and **Open** buttons, for Mac and Windows.

## Save
After a project finishes generating or after importing code, click **Save**. The app downloads a dated `ai-website-project-YYYY-MM-DD.json` file to the computer. The JSON contains the current project inputs, generated code, selected version, commit/version history, and associated prompt assets. **It does not include API keys or app settings.** The data may contain screenshots and private prompt text; treat the file as sensitive.

## Open
Click **Open** and choose a previously saved project JSON file. Confirm replacement of the active session. The code preview and saved versions reappear without any AI API call.

This is **explicit local backup** rather than automatic browser persistence or cloud synchronization. The user must save before starting a new project, refreshing, closing, or switching machines. Store backups in a secure location and do not upload private backups to public GitHub repositories.

## Mac/Windows testing checklist
- [ ] Import prior `index.html` → Save → Open JSON → compare preview.
- [ ] Generate Test Mode page → Save → click New → Open JSON → verify code and history.
- [ ] Try an invalid JSON file; application should reject it without losing the active project.
- [ ] Test with a project containing screenshot assets; verify the JSON size and privacy implications.
- [ ] Confirm no API requests are sent while opening saved projects.
- [ ] Run `cd frontend && pnpm build` (or `docker compose up -d --build`) and inspect browser console.

## Limits
- JSON size capped at 30 MB on import.
- No background autosave or cloud sync.
- Save is disabled during code generation to avoid incomplete snapshots.
- Project files should be opened only from trusted sources. A restored preview can contain user-generated scripts and should be treated as untrusted.
