# Deployment guide – Kate Hospital website

## 1. What you are deploying
A static website. No server code or database is needed. The site is the whole folder `Kate-Hospital-DELIVERY/`, with its folder structure intact:

    index.html  privacy.html  terms.html  robots.txt  sitemap.xml  README.md
    css/styles.css   js/main.js   assets/   tests/   reports/

Do not flatten the folders. If `css/`, `js/` and `assets/` are not in the same place as `index.html`, the page loads with no styles, no images and no scripts.

## 2. Before you publish (content checklist)
1. Replace the "to be confirmed" text: OPD timings, visiting hours, doctor experience and consultation timings (search the HTML for "To be confirmed").
2. Get management and legal approval of `privacy.html` and `terms.html`. Both are drafts.
3. Confirm the domain. The canonical URL, Open Graph tags, `sitemap.xml` and `robots.txt` use `https://katehospital.in`. Change them if the domain differs.
4. Confirm Dr. Atul Kate's specialty wording.
5. Add testimonials only with written consent: edit the `TESTIMONIALS` array in `js/main.js`.

## 3. Hosting options
Any static host works: Netlify, Vercel, GitHub Pages, cPanel / Apache, or Nginx.

### Option A – Netlify or Vercel (simplest)
1. Create a new site from the folder (drag and drop, or connect a Git repository).
2. Publish directory: the folder root (the one containing `index.html`).
3. Add your custom domain in the host's dashboard and let it issue the HTTPS certificate.

### Option B – Apache / cPanel
1. Upload the contents of `Kate-Hospital-DELIVERY/` to `public_html/` (keep the folders).
2. Enable HTTPS (AutoSSL or Let's Encrypt) and force HTTPS with a redirect.

### Option C – Nginx
    server {
      listen 443 ssl http2;
      server_name katehospital.in www.katehospital.in;
      root /var/www/kate-hospital;
      index index.html;
      location ~* \.(css|js|jpg|jpeg|webp|png|mp4|webm)$ { expires 30d; add_header Cache-Control "public"; }
      location / { try_files $uri $uri/ =404; }
    }

## 4. Security headers (recommended)
Add these at the host or web server:
- `Strict-Transport-Security: max-age=31536000`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- A Content-Security-Policy. This site uses inline JSON-LD and a Google Maps iframe, so test the policy before enforcing it.

## 5. Post-launch checks
1. Open the live site on a real phone. Check the hero video, sound button, WhatsApp hand-off and map.
2. Submit a test appointment request and confirm it opens WhatsApp with the reference number. Do not send medical details.
3. Run Lighthouse on the live URL (Chrome DevTools > Lighthouse).
4. Submit `https://<domain>/sitemap.xml` in Google Search Console and check that the page is indexed.
5. Check the social preview with Facebook/Meta and X card validators.

## 6. Updating later
- Replace a photo: keep the same file name and size, then re-run the tests.
- Change hours or doctor details: edit `index.html` only.
- Run the tests before every release (see `tests/README.md`).

## 7. Rollback
Keep the previous version of the folder (or the zip). To roll back, redeploy that folder. Static hosts usually keep previous deployments, so you can also roll back from the host's dashboard.

## 8. Backup
Keep one copy of the whole folder, including `assets/` (the original video and photos are large). The original upload zip should also be kept.

## 9. Not included in this version
No server-side appointment storage, admin dashboard, analytics or CAPTCHA. If these are needed, they are a separate backend project. Do not add analytics that record form contents or medical information.
