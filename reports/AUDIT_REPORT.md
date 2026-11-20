# Kate Hospital website – audit report (v4.1 fixes)

Scope: all files in `kate-hospital-v4/` (index.html, privacy.html, terms.html, css/styles.css, js/main.js, assets/, tests/) plus the uploaded `files.zip`, `kate-hospital-website-v3_1.zip` and `kate-hospital-website-v3_1_1.zip`.

## Upload check
| Upload | Finding | Status |
|---|---|---|
| files.zip | Flat copy of index.html, styles.css, main.js. Byte-identical to the v4 build, but with no `css/`, `js/` or `assets/` folders. The page loads unstyled and images are broken (see screenshot 1795156514763_image.png). | FIXED in package; **needs you to extract the zip with its folders intact** |
| kate-hospital-website-v3_1_1.zip | Byte-identical to kate-hospital-website-v3_1.zip (same SHA-256). Duplicate upload, no content change. | Info only |
| 1795156514763_image.png | Screenshot of the flat copy: no stylesheet, broken images, huge unstyled icons, honeypot field visible. Root cause is the missing folders. | Diagnosed |

Original upload files were read, not modified.

## Issues
| ID | File / line | Severity | Description | Root cause | Status |
|---|---|---|---|---|---|
| A-01 | index.html ~848 | High | Stray `</main>` closed the main landmark before Contact and FAQ. | Copy error when sections were added | FIXED – VERIFIED (html-validate) |
| A-02 | css/styles.css, buttons | High | White text on `#16A34A` = 3.30:1, below WCAG AA 4.5:1. | Brand green used for button background | FIXED – 5.02:1 with `#15803D`; VERIFIED (axe, Lighthouse) |
| A-03 | index.html honeypot | High | Anti-spam field hidden by CSS only; visible to users if CSS fails. | Reliance on CSS for a security control | FIXED – `hidden` attribute; VERIFIED with CSS blocked |
| A-04 | js/main.js WhatsApp | High | If the browser blocked the pop-up, the page still said the request was "ready in WhatsApp" with no way to continue. | `window.open` result not checked | FIXED – honest message and direct link; VERIFIED with blocked pop-up |
| A-05 | js/main.js WhatsApp | Medium | Double-click opened two WhatsApp windows. | No cooldown | FIXED – 1.5 s cooldown; VERIFIED |
| A-06 | js/main.js review | Medium | Repeat review created a new reference; the `busy` flag did nothing. | Dead code, no real guard | FIXED – repeat review keeps the same reference; VERIFIED |
| A-07 | js/main.js | Medium | Old Safari (<14) lacks `MediaQueryList.addEventListener`; the error stopped the whole script (filters, video, lightbox). | No feature check | FIXED – fallback to `addListener`; VERIFIED with API removed |
| A-08 | js/main.js | Medium | `replaceChildren()` unsupported in older browsers. | Modern API | FIXED – compatible `clear()` helper |
| A-09 | js/main.js doctor buttons | Medium | Dr. Atul's department depended on earlier selections. | Conditional logic | FIXED – fixed mapping; VERIFIED |
| A-10 | index.html brand links | Medium | Accessible name differed from visible text (axe `label-content-name-mismatch`, 3 elements). | `aria-label` overrides | FIXED – VERIFIED (axe 0) |
| A-11 | index.html sound button | Medium | Same name mismatch; `aria-pressed` duplicated the state shown in the text. | Redundant ARIA | FIXED – VERIFIED |
| A-12 | index.html WhatsApp float | Medium | Outside any landmark (axe `region`). | Placed after `</footer>` | FIXED – moved into footer; VERIFIED |
| A-13 | index.html markup | Low | Inline style on the icon sprite; `div role=region`; `aria-label` on `<ul>` and `<dialog>`; `<p>` after `<figcaption>`. | Markup hygiene (html-validate) | FIXED – VERIFIED |
| A-14 | index.html phone numbers | Low | Phone numbers could break across lines. | No non-breaking spaces | FIXED – VERIFIED |
| A-15 | index.html head | Low | No Twitter/X preview tags. | Missing metadata | FIXED |
| A-16 | index.html nav | Low | Unused `mobile-only` class. | Leftover | FIXED |
| A-17 | css footer | Low | On phones the floating WhatsApp button covered the end of the footer text. | No bottom padding | FIXED |
| A-18 | My earlier test suite | Medium | My first 24-check suite passed while A-01 and A-02 existed, and one assertion had an `or True` that could never fail. | Weak tests | FIXED – tests tightened; 21 checks now run in `tests/` |

## Verification results (this build)
- html-validate (index, privacy, terms): **0 errors**
- axe-core WCAG scan: index **0**, privacy **0**, terms **0** violations
- Browser suite (Playwright, Chromium): **21 / 21 passed**
- Responsive widths 320, 360, 375, 390, 430, 640, 768, 900, 1024, 1180, 1366, 1440, 1920 px: no horizontal overflow, no header overlap, no off-screen buttons
- Lighthouse (lab, this sandbox): mobile Performance **96**, Accessibility **100**, Best Practices **100**, SEO **100** (LCP 1.8 s, CLS 0, TBT 190 ms); desktop Performance **100**, Accessibility **100**, Best Practices **100**, SEO **100**

## Limitations and items needing manual testing
- **NEEDS MANUAL TESTING:** real iPhone (Safari) and Android (Chrome) testing, including the video sound behaviour and WhatsApp hand-off.
- **NEEDS MANUAL TESTING:** the Google Maps embed did not load in this sandbox (no internet). Check it on a live site.
- **BLOCKED / hospital action:** OPD timings, visiting hours, doctor experience and consultation timings are not in the supplied material and are still marked "to be confirmed".
- **Hospital action:** Dr. Atul Kate's specialty differs between the brief ("Surgery & General Care") and the existing site ("Diabetologist"). Confirm.
- **Assets, not edited:** the hero video shows a "HARSH GRAFIX" watermark; `hospital.jpeg` is an architectural render with a cut-off edge; the building photo has similar edge fragments.
- **Legal:** privacy and terms pages are drafts. No DPDP Act compliance is claimed; legal review is required.
- **No backend:** requests are not stored on a server. A backend would need separate design.
- **Not verified:** Lighthouse was run on the local build only, not on the live domain.

## Additional findings (delivery build, this session)
| ID | Area | Severity | Finding | Status |
|---|---|---|---|---|
| A-19 | Asset files | High | 23 original images and the video in the output copies had a C2PA provenance block (APP11 / JUMBF) inserted. Pixels were unchanged, but the bytes differed from your originals. | FIXED – all 23 restored byte-for-byte from the original zip and verified |
| A-20 | Project folders | Medium | An older duplicate folder and zip (containing the A-19 copies) sat beside the delivery. | FIXED – removed; the delivery is the only copy |
| A-21 | CSS validation | Info | csstree-validator flags `min()`, `clamp()` and `padding-block` (6 flags). | Verified false positive: Chromium computes the values correctly (see FINAL_QA_REPORT.md) |
| A-22 | Lighthouse | Info | Mobile Performance varies between runs (96 to 99 across runs). | Reported as measured; no regression |

## Status summary
All issues A-01 to A-18 (earlier session) and A-19 to A-22 (this session) are FIXED or verified, except the items listed under "Limitations" below. Full results are in FINAL_QA_REPORT.md.

## Limitations (open)
- Real-device testing (iPhone Safari, Android Chrome) – NEEDS MANUAL TESTING.
- Google Maps embed not loaded in the test environment (no internet) – NEEDS MANUAL TESTING.
- Real screen-reader testing – NEEDS MANUAL TESTING.
- Hospital-supplied content (timings, doctor experience, testimonials, specialty wording) – BLOCKED until supplied.
- Legal review of privacy and terms – BLOCKED until management and legal sign-off.
