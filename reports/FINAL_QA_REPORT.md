# Kate Hospital website – final QA report

Tested files: the extracted copy of `Kate-Hospital-DELIVERY.zip` (and the delivery folder, which is identical). Environment: Linux container, Chromium 1243 (Playwright), Lighthouse 12, axe-core 4, html-validate 8, csstree-validator 3. Results below are from the runs recorded in this session. They are not estimates.

## Results
| Test | Tool | Result |
|---|---|---|
| HTML validation (index, privacy, terms) | html-validate 8 | **0 errors** |
| HTML structure (tag nesting, duplicate IDs, in-page links) | custom checker `tests/check_html.py` | duplicate IDs: none; no stray or unclosed tags |
| CSS syntax | csstree-validator 3 | 6 flags, **all false positives** (see below) |
| JavaScript syntax | `node --check` | **OK** |
| Browser behaviour | Playwright, Chromium | **21 / 21 passed** |
| Accessibility (WCAG) | axe-core 4 | index **0**, privacy **0**, terms **0** violations |
| Responsive layout | Playwright, 13 widths | **all clean**: no horizontal overflow, no header overlap, no off-screen buttons at 320, 360, 375, 390, 430, 640, 768, 900, 1024, 1180, 1366, 1440, 1920 px |
| Broken asset references | custom script (HTML, CSS `url()`, JS asset paths) | **none** (one check flag is a false positive: `index.html#appointment` is a valid link) |
| Asset integrity | byte comparison with the original zip | **23 / 23 original assets identical** (kate.webm is new and generated) |
| Lighthouse, mobile | Lighthouse 12 | Performance **99**, Accessibility **100**, Best Practices **100**, SEO **100**; LCP 2.1 s, CLS 0, TBT 40 ms |
| Lighthouse, desktop | Lighthouse 12 | Performance **100**, Accessibility **100**, Best Practices **100**, SEO **100**; LCP 0.5 s, CLS 0, TBT 0 ms |

Lighthouse varies between runs. Earlier mobile runs of the same build scored 96 and 98 for Performance. Scores above are from the final run.

## CSS validator flags (false positives, verified)
The validator flagged `min()`, `clamp()` and `padding-block`. These are standard CSS Values 4 features supported by all current browsers. Its syntax dataset is older and does not include them. Chromium computes them correctly on the live page:
- headline font size 57.6 px (the `clamp()` maximum)
- container 1200 px (`min()` / max-width)
- hero media 340 px (`min(100%, 340px)`)
- hero padding 75.2 px (`clamp()` at 1440 px)

## Issues found and fixed in this session
- Asset metadata: the output copies of 23 original images and the video had a C2PA provenance block (APP11 / JUMBF) inserted. Pixels were identical, but the bytes were not. All 23 were restored from the original zip and verified byte-identical.
- Duplicate build: an older `kate-hospital-v4/` folder and zip, which contained the modified copies, were removed so only this delivery remains.
- The root-level audit report was moved into `reports/`.

## Not verified here (needs manual testing)
- Real iPhone (Safari) and Android (Chrome) devices, including video sound and the WhatsApp hand-off.
- The Google Maps embed. The sandbox has no internet access, so the map iframe did not load.
- Live-domain tests (HTTPS, headers, real caching). Lighthouse ran on a local server.
- Real screen-reader testing (NVDA, VoiceOver, TalkBack). axe covers automated rules only.
- Legal review of the privacy notice and terms. No DPDP Act compliance is claimed.

## Remaining content items (hospital must supply)
- OPD timings and visiting hours.
- Doctor experience and consultation timings.
- Diagnostic test availability and turnaround (the site asks visitors to enquire).
- Patient testimonials (none supplied; none published).
- Dr. Atul Kate's specialty: the brief says "Surgery & General Care", the existing site says "Diabetologist".
- Social media links and the verified Google review link.
