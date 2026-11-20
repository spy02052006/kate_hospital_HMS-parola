# Tests (no install of the site needed)

Requires Python 3 with `playwright` (`pip install playwright && python -m playwright install chromium`).

    python3 tests/func2.py      # 21 browser checks: video, filters, lightbox, booking, WhatsApp, reduced motion
    python3 tests/axe.py        # axe-core accessibility scan of index, privacy and terms (needs tests/axe.min.js)
    python3 tests/resp.py       # layout check at 320 to 1920px: horizontal overflow and header overlap
    python3 tests/check_html.py index.html   # tag nesting, duplicate IDs, broken in-page links

HTML validation (optional): `npx html-validate index.html privacy.html terms.html`
