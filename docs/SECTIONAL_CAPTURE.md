# Bounded sectional capture of long pages (2026-10-26)

When the URL analyzer's **Full Page (bounded)** option is selected:

1. Capture a full-page screenshot only when it fits the existing limits: at most 4500 CSS pixels tall and 6 million pixels total.
2. Otherwise, retain the first viewport screenshot and capture **up to three further viewport-sized screenshots** at sample scroll positions through the long page.
3. Display additional captures in the URL analysis panel under **Additional page sections**, with their scroll positions.
4. Keep JavaScript disabled and the existing HTTPS hostname allowlist and request restrictions. Captures are read-only and never invoke Claude.
5. **Generate with selected AI model** continues to use the primary screenshot only. Additional sections are for visual inspection; multi-section generation is future work and may require more AI spend.

These sectional captures are *not* a stitched full-page image. Long pages may have gaps between sampled positions, and fixed/sticky elements can repeat. At most four separate screenshots are returned in total. PNG limits remain: 5 MB primary image and 2.5 MB per additional section.

## Verification (Mac)
- Pull the development branch and rebuild Docker.
- Select **URL → Desktop → Full Page (bounded)** and enter `https://www.alhashmyahh.com/`.
- Click **Analyze URL (no AI)**.
- Confirm the hero image appears, the extra section gallery becomes visible if the document exceeds the full-page thresholds, and no Claude requests were made.
- Check that a short `https://example.com` request still returns normally.
- Inspect backend logs if screenshots fail.

**Status:** code committed, but Mac/Windows builds and capture tests remain pending. This endpoint is still not approved for exposure to arbitrary untrusted sites, since application-level restrictions alone do not guarantee network isolation.
