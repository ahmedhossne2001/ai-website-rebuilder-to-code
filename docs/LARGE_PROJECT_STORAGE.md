# Large Project Storage — IndexedDB

Updated 2026-10-27. Branch `feature/hybrid-cross-platform-setup`.

## Why this exists

A user-generated three-screenshot Arabic website rebuild exceeded the old Project Manager's hard `localStorage` threshold of **3,000,000 JSON characters**, yielding: `This project is too large for browser storage. Use Save JSON for a full backup.`

**First safeguard: use Project Manager → Backup current JSON before doing any updates, navigation or new generations. Confirm a valid downloaded file exists.** Do not delete local data.

## Change

The Project Manager now stores new/updated named snapshots in browser **IndexedDB**, which typically has a much higher storage budget than localStorage. A larger project is no longer automatically rejected at 3 million characters.

- Existing localStorage-named projects remain listed, readable, renamable and removable.
- On save, an existing named project is written to IndexedDB first; only after successful database transaction is its prior localStorage copy removed.
- New named snapshots are saved to IndexedDB using the same validated `SavedProject` JSON format.
- Saves, opens, backups, rename and deletion are asynchronous; errors are reported without claiming success.
- There is still a **30 million character JSON document limit** inherited from backup/import validation; browser quota may also vary by device and available space.
- Stored data includes screenshot data URLs and potentially substantial version history, so JSON backups remain essential. IndexedDB is **device- and browser-profile-local**, not synced to Windows or GitHub.
- No existing JSON backup format was changed.

## Mac acceptance test

1. **Before updating Docker:** download **Backup current JSON** for the generated Alhashmyah page, verify the file exists and is not 0 bytes.
2. Pull the feature branch and rebuild Docker: `git pull origin feature/hybrid-cross-platform-setup && docker compose up -d --build`.
3. Keep the generated page open if possible and open Project Manager → Save current; expect no 3 MB error.
4. If the page was reset, import the saved JSON via **Open**, then Projects → Save current.
5. Save as `Alhashmyah Website Rebuild V1`, verify it appears in the list, open a different project and reopen V1 to verify images and versions.
6. Test the original small saved project `My First AI Website` still opens; do not delete it.
7. If storage is denied or full, use JSON backup and report the exact message.
8. Windows and real storage quota tests remain outstanding.

**Status:** code committed; no browser/Docker regression test yet. Do not mark passed until user confirms.
