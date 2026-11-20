# Kate Hospital and Maternity Home – website v4

A single-page, responsive hospital website with the 15 sections in the requested order. It is plain HTML, CSS and JavaScript with no build step and no external libraries.

## Folder structure (required)
The site must keep this layout. If the files are copied into one folder, the page loads with no styles, no images and no scripts.

    index.html  privacy.html  terms.html  robots.txt  sitemap.xml  README.md
    css/styles.css
    js/main.js
    assets/     (logo, video, poster, doctor and facility photos)
    tests/      (automated checks, see tests/README.md)

## Test results (latest build)
- html-validate: 0 errors on all pages
- axe-core accessibility scan: 0 violations on all pages
- Browser suite: 21 / 21 checks passed
- Layout: no horizontal overflow from 320 to 1920 px
- Lighthouse (lab, local build): mobile 96 / 100 / 100 / 100, desktop 100 / 100 / 100 / 100 (Performance / Accessibility / Best Practices / SEO)

Reports are in `reports/`: AUDIT_REPORT.md (issues and status), FINAL_QA_REPORT.md (test results), DEPLOYMENT_GUIDE.md (how to publish).

## Run locally
    python3 -m http.server 8000
    # open http://localhost:8000

## Deploy
Upload this folder to any static host (Netlify, Vercel, cPanel, Apache or Nginx). Use HTTPS. Point the domain at the host. Canonical URLs, `robots.txt` and `sitemap.xml` assume **https://katehospital.in** – change them if the domain is different.

## Sections (in order)
1. Announcement bar (emergency, OPD hours, WhatsApp)
2. Navigation (logo, menu, Book Appointment, emergency call)
3. Hero (hospital video with Play/Pause and explicit Sound control)
4. About (logo, building photograph, mission, care philosophy, key facilities)
5. Medical specialties (maternity, delivery, women's health, general medicine, diagnostics)
6. Doctors (Dr. Atul Kate, Dr. Mahesh Kate, Dr. Sneha Kate)
7. Diagnostic services (clinical pathology, biochemistry and hormones, cardiology and imaging, preventive packages)
8. Facilities (filters, photographs, lightbox)
9. Photo and video gallery (filters, lightbox, video)
10. Why choose us
11. Testimonials
12. Appointment booking (validation, summary, reference number, WhatsApp request)
13. Contact and location (phone, WhatsApp, address, Google Maps, directions)
14. FAQ
15. Footer (departments, doctors, contact, privacy notice, terms)

## Items the hospital must confirm before launch
Shown on the site as "To be confirmed by the hospital":
- OPD timings and visiting hours (announcement bar, contact section)
- Experience and consultation timings for each doctor (`index.html`, doctors section)
- Test availability, sample requirements and report timings (diagnostics; the site asks visitors to enquire)

Needs approval:
- **Privacy notice** (`privacy.html`) and **Terms** (`terms.html`) are drafts. Legal review is required.
- **Patient testimonials**: none were supplied, so none are shown. Add only genuine, consented feedback to the `TESTIMONIALS` array in `js/main.js`. The section then displays them automatically.
- **Social media links**: none were supplied, so none are shown. Add them to the footer when available.
- **Google review link**: add when the Google Business Profile is verified.
- **Doctor specialty for Dr. Atul Kate**: the existing site says "Diabetologist"; the brief said "Surgery & General Care". The site uses the existing site's wording. Confirm which is correct.
- **Service list**: only the services already on the existing site are shown. Surgery, obstetrics and internal medicine appear in the brief but were not confirmed in the supplied material, so they were not published.

## How the appointment request works
The site has no server database, so nothing is stored on a server. The visitor fills in the form, reviews a summary, and then clicks "Send request on WhatsApp". WhatsApp opens with a pre-filled message to the hospital number. The message includes a reference number, the name, department, doctor, date and time, and an optional non-medical enquiry. It does not include the mobile number or medical details. The site never says an appointment is confirmed. Reception confirms it.

If the hospital wants requests saved in a database or emailed automatically, a backend (for example Node.js with Express and PostgreSQL, as in the brief) would need to be added later.

## Not included in this version
- Server-side storage, admin dashboard and audit log
- Analytics (Microsoft Clarity was not approved)
- CAPTCHA (a hidden honeypot field is used instead)
- Automated test suite (Vitest and Playwright). Functional and layout checks were run in a headless browser during the build.

## Media notes
- `assets/kate.mp4` is the original hero video, unchanged. `assets/kate.webm` is a smaller WebM copy (same length and audio) for browsers that prefer it. The original footage contains a small "HARSH GRAFIX" watermark, which should be replaced with a clean edit if the hospital supplies one.
- `assets/hospital.jpeg` is an architectural design render, not a photograph. It is captioned as a design view. It has a cut-off fragment at the right edge.
- `assets/facilities/` images are the optimised WebP and JPG copies from the original project.
- The original project files (`assets/`, `hos/`, `index.html`, `styles.css`, `script.js`, and the other notes) were left unchanged. This folder is a separate build.
# kate_hospital_HMS-parola
# kate_hospital_HMS-parola
