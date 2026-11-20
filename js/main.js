/* Kate Hospital v4 – site behaviour (no external dependencies) */
(function () {
  'use strict';

  const HOSPITAL_WA = '919075360600';

  /* Approved patient testimonials only. Add entries only with written consent:
     { quote: '...', name: 'First name or approved display name', date: 'YYYY-MM-DD', rating: 5 } */
  const TESTIMONIALS = [];

  const $ = (sel, root = document) => root.querySelector(sel);
  const clear = (el) => { while (el.firstChild) el.removeChild(el.firstChild); };
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  function setIcon(el, id) {
    const use = el && el.querySelector('use');
    if (use) use.setAttribute('href', id);
  }

  /* ---------- Footer year ---------- */
  const yearEl = $('#year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- Mobile navigation ---------- */
  const navToggle = $('.nav__toggle');
  const navLinks = $('#primary-nav');

  function setMenu(open) {
    navLinks.classList.toggle('is-open', open);
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    setIcon(navToggle, open ? '#i-close' : '#i-menu');
  }

  if (navToggle && navLinks) {
    navToggle.addEventListener('click', () => setMenu(!navLinks.classList.contains('is-open')));
    navLinks.addEventListener('click', (e) => { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && navLinks.classList.contains('is-open')) {
        setMenu(false);
        navToggle.focus();
      }
    });
    const desktopQuery = window.matchMedia('(min-width: 1180px)');
    const onDesktop = (mq) => { if (mq.matches) setMenu(false); };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener('change', onDesktop);
    else if (desktopQuery.addListener) desktopQuery.addListener(onDesktop);
  }

  /* ---------- Hero video: muted autoplay, explicit play/sound controls ---------- */
  const hero = $('#hero-video');
  const playBtn = $('#video-play');
  const soundBtn = $('#video-sound');
  let userPaused = reduceMotion.matches; // reduced motion: start paused, show poster

  function syncPlay() {
    const playing = !hero.paused;
    playBtn.setAttribute('aria-label', playing ? 'Pause video' : 'Play video');
    playBtn.querySelector('span').textContent = playing ? 'Pause' : 'Play';
    setIcon(playBtn, playing ? '#i-pause' : '#i-play');
  }

  function syncSound() {
    const on = !hero.muted;
    soundBtn.querySelector('span').textContent = on ? 'Sound on' : 'Sound off';
    setIcon(soundBtn, on ? '#i-volume' : '#i-mute');
  }

  if (hero && playBtn && soundBtn) {
    playBtn.addEventListener('click', () => {
      if (hero.paused) {
        userPaused = false;
        hero.play().catch(() => {});
      } else {
        userPaused = true;
        hero.pause();
      }
      syncPlay();
    });

    // Sound is only enabled by this explicit click (browser autoplay policy).
    soundBtn.addEventListener('click', () => {
      hero.muted = !hero.muted;
      if (!hero.muted) {
        hero.volume = 1;
        hero.play().catch(() => {});
        userPaused = false;
      }
      syncSound();
      syncPlay();
    });

    hero.addEventListener('play', syncPlay);
    hero.addEventListener('pause', syncPlay);

    if (!reduceMotion.matches) {
      hero.play().catch(() => { userPaused = true; syncPlay(); });
    }

    // Pause when scrolled out of view to save battery and data; resume if the user hasn't paused.
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) hero.pause();
          else if (!userPaused && !reduceMotion.matches) hero.play().catch(() => {});
        });
      }, { threshold: 0.25 });
      io.observe(hero);
    }

    syncPlay();
    syncSound();
  }

  /* ---------- Filters (facilities and gallery) ---------- */
  function setupFilter(buttonSelector, itemSelector, dataAttr) {
    const buttons = $$(buttonSelector);
    const items = $$(itemSelector);
    if (!buttons.length) return;
    buttons.forEach((btn) => {
      btn.addEventListener('click', () => {
        const value = btn.getAttribute(dataAttr.button);
        buttons.forEach((b) => {
          const active = b === btn;
          b.classList.toggle('is-active', active);
          b.setAttribute('aria-pressed', String(active));
        });
        items.forEach((item) => {
          const cat = item.getAttribute(dataAttr.item);
          item.hidden = !(value === 'all' || cat === value);
        });
      });
    });
  }
  setupFilter('[data-filter]', '.facility-card', { button: 'data-filter', item: 'data-category' });
  setupFilter('[data-gfilter]', '.gallery-item', { button: 'data-gfilter', item: 'data-gcat' });

  /* ---------- Lightbox ---------- */
  const lb = $('#lightbox');
  const lbStage = $('#lb-stage');
  const lbCaption = $('#lb-caption');
  const lbPrev = $('#lb-prev');
  const lbNext = $('#lb-next');
  const lbClose = $('#lb-close');
  let lbItems = [];
  let lbIndex = 0;
  let lbTrigger = null;

  function visibleItemsFor(btn) {
    const group = btn.closest('[data-lightbox-group]');
    if (!group) return [btn];
    return $$('[data-lightbox], [data-lightbox-video]', group).filter((b) => {
      const card = b.closest('.facility-card, .gallery-item');
      return !card || !card.hidden;
    });
  }

  function buildImage(base, alt) {
    const hasExt = /\.[a-z]+$/i.test(base);
    if (hasExt) {
      const img = document.createElement('img');
      img.src = base;
      img.alt = alt;
      return img;
    }
    const picture = document.createElement('picture');
    const source = document.createElement('source');
    source.type = 'image/webp';
    source.srcset = base + '.webp';
    const img = document.createElement('img');
    img.src = base + '.jpg';
    img.alt = alt;
    picture.append(source, img);
    return picture;
  }

  function buildVideo(base) {
    const video = document.createElement('video');
    video.controls = true;
    video.playsInline = true;
    video.preload = 'metadata';
    video.poster = 'assets/kate-video-poster.jpg';
    const webm = document.createElement('source');
    webm.src = base + '.webm';
    webm.type = 'video/webm';
    const mp4 = document.createElement('source');
    mp4.src = base + '.mp4';
    mp4.type = 'video/mp4';
    video.append(webm, mp4);
    return video;
  }

  function renderLightbox() {
    const item = lbItems[lbIndex];
    if (!item) return;
    clear(lbStage);
    const caption = item.getAttribute('data-caption') || '';
    const videoBase = item.getAttribute('data-lightbox-video');
    if (videoBase) {
      lbStage.append(buildVideo(videoBase));
    } else {
      lbStage.append(buildImage(item.getAttribute('data-lightbox'), caption));
    }
    lbCaption.textContent = caption + (lbItems.length > 1 ? ` (${lbIndex + 1} of ${lbItems.length})` : '');
    const multi = lbItems.length > 1;
    lbPrev.hidden = !multi;
    lbNext.hidden = !multi;
  }

  function openLightbox(btn) {
    lbItems = visibleItemsFor(btn);
    lbIndex = Math.max(0, lbItems.indexOf(btn));
    lbTrigger = btn;
    renderLightbox();
    if (typeof lb.showModal === 'function') lb.showModal();
    else lb.setAttribute('open', '');
    lbClose.focus();
  }

  function closeLightbox() {
    const v = lbStage.querySelector('video');
    if (v) v.pause();
    clear(lbStage);
    if (typeof lb.close === 'function') lb.close();
    else lb.removeAttribute('open');
    if (lbTrigger) lbTrigger.focus();
  }

  function step(delta) {
    if (lbItems.length < 2) return;
    lbIndex = (lbIndex + delta + lbItems.length) % lbItems.length;
    renderLightbox();
  }

  $$('[data-lightbox], [data-lightbox-video]').forEach((btn) => {
    btn.addEventListener('click', () => openLightbox(btn));
  });
  if (lb) {
    lbClose.addEventListener('click', closeLightbox);
    lbPrev.addEventListener('click', () => step(-1));
    lbNext.addEventListener('click', () => step(1));
    lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
    lb.addEventListener('close', () => { clear(lbStage); });
    lb.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === 'ArrowRight') step(1);
    });
  }

  /* ---------- Specialty and doctor buttons pre-select the booking form ---------- */
  const deptSelect = $('#f-dept');
  const doctorSelect = $('#f-doctor');

  $$('[data-dept]').forEach((btn) => {
    btn.addEventListener('click', () => {
      deptSelect.value = btn.getAttribute('data-dept');
      doctorSelect.value = '';
      goToAppointment(deptSelect);
    });
  });
  const DOCTOR_DEPT = {
    'Dr. Atul Kate': 'General Medicine & Diabetes Care',
    'Dr. Mahesh Kate': "Women's Health",
    'Dr. Sneha Kate': 'Pregnancy & Maternity Care'
  };
  $$('[data-doctor]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const name = btn.getAttribute('data-doctor');
      doctorSelect.value = name;
      deptSelect.value = DOCTOR_DEPT[name] || '';
      goToAppointment(deptSelect);
    });
  });

  function goToAppointment(focusEl) {
    const target = $('#appointment');
    target.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'start' });
    setTimeout(() => focusEl && focusEl.focus({ preventScroll: true }), 450);
  }

  /* ---------- Testimonials (renders only approved entries) ---------- */
  const testimonialList = $('#testimonial-list');
  if (testimonialList && TESTIMONIALS.length) {
    clear(testimonialList);
    TESTIMONIALS.forEach((t) => {
      const fig = document.createElement('figure');
      fig.className = 'testimonial';
      const quote = document.createElement('blockquote');
      quote.textContent = '“' + t.quote + '”';
      const cap = document.createElement('figcaption');
      cap.textContent = t.name + (t.date ? ' · ' + new Date(t.date + 'T00:00').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : '');
      fig.append(quote, cap);
      testimonialList.append(fig);
    });
  }

  /* ---------- Appointment form ---------- */
  const form = $('#appointment-form');
  if (form) {
    const fields = {
      name: { el: $('#f-name'), err: $('#e-name') },
      phone: { el: $('#f-phone'), err: $('#e-phone') },
      department: { el: $('#f-dept'), err: $('#e-dept') },
      date: { el: $('#f-date'), err: $('#e-date') },
      message: { el: $('#f-msg'), err: $('#e-msg') },
      consent: { el: $('#f-consent'), err: $('#e-consent') }
    };
    const doctorEl = $('#f-doctor');
    const timeEl = $('#f-time');
    const summary = $('#summary');
    const summaryList = $('#summary-list');
    const refEl = $('#ref-code');
    const statusEl = $('#form-status');
    const reviewBtn = $('#review-btn');
    const waBtn = $('#wa-btn');
    const editBtn = $('#edit-btn');
    const honeypot = form.elements.website;

    let pending = null; // { ref, message, data } after review

    // Today's date in local time, used as the earliest bookable date.
    const today = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;
    fields.date.el.min = todayStr;

    function setError(key, msg) {
      const f = fields[key];
      f.err.textContent = msg || '';
      if (msg) f.el.setAttribute('aria-invalid', 'true');
      else f.el.removeAttribute('aria-invalid');
    }

    function clearErrors() {
      Object.keys(fields).forEach((k) => setError(k, ''));
      statusEl.textContent = '';
      statusEl.className = 'form-status';
    }

    function normalisePhone(raw) {
      let d = String(raw || '').replace(/[\s\-()]/g, '');
      if (d.startsWith('+91')) d = d.slice(3);
      else if (d.startsWith('91') && d.length === 12) d = d.slice(2);
      else if (d.startsWith('0') && d.length === 11) d = d.slice(1);
      return d;
    }

    function validate() {
      const data = {
        name: fields.name.el.value.trim().replace(/\s+/g, ' '),
        phone: normalisePhone(fields.phone.el.value),
        department: fields.department.el.value,
        doctor: doctorEl.value,
        date: fields.date.el.value,
        time: timeEl.value,
        message: fields.message.el.value.trim().replace(/\s+/g, ' '),
        consent: fields.consent.el.checked
      };
      const errors = {};
      if (data.name.length < 2 || !/^[\p{L}\p{M} .'-]+$/u.test(data.name)) {
        errors.name = 'Please enter the patient’s full name (letters only).';
      }
      if (!/^[6-9]\d{9}$/.test(data.phone)) {
        errors.phone = 'Enter a valid 10-digit Indian mobile number.';
      }
      if (!data.department) {
        errors.department = 'Please choose a department.';
      }
      if (!data.date) {
        errors.date = 'Please choose a preferred date.';
      } else if (data.date < todayStr) {
        errors.date = 'Please choose today or a future date.';
      }
      if (data.message.length > 300) {
        errors.message = 'Please keep the enquiry to 300 characters or fewer.';
      }
      if (!data.consent) {
        errors.consent = 'Please tick the box to agree before sending.';
      }
      return { data, errors };
    }

    function makeRef() {
      const stamp = Date.now().toString(36).toUpperCase().slice(-4);
      const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
      return `KH-${stamp}${rnd}`;
    }

    function formatDate(iso) {
      if (!iso) return 'Not specified';
      return new Date(iso + 'T00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    }

    function buildWhatsAppMessage(data, ref) {
      const lines = [
        'Appointment request – Kate Hospital',
        `Reference: ${ref}`,
        `Name: ${data.name}`,
        `Department: ${data.department}`,
        `Doctor: ${data.doctor || 'Any available doctor'}`,
        `Preferred date: ${formatDate(data.date)}`,
        `Preferred time: ${data.time || 'Any time'}`
      ];
      if (data.message) lines.push(`Enquiry: ${data.message}`);
      lines.push('', 'Please confirm the appointment with me. (No medical details sent here.)');
      return lines.join('\n');
    }

    function showSummary(data) {
      clear(summaryList);
      const rows = [
        ['Patient name', data.name],
        ['Mobile', data.phone.replace(/(\d{5})(\d{5})/, '$1 $2')],
        ['Department', data.department],
        ['Doctor', data.doctor || 'Any available doctor'],
        ['Preferred date', formatDate(data.date)],
        ['Preferred time', data.time || 'Any time'],
        ['Enquiry', data.message || '—']
      ];
      rows.forEach(([k, v]) => {
        const div = document.createElement('div');
        const dt = document.createElement('dt');
        dt.textContent = k;
        const dd = document.createElement('dd');
        dd.textContent = v;
        div.append(dt, dd);
        summaryList.append(div);
      });
      summary.hidden = false;
      refEl.textContent = pending.ref;
      reviewBtn.hidden = true;
      waBtn.textContent = 'Send request on WhatsApp';
      summary.scrollIntoView({ behavior: reduceMotion.matches ? 'auto' : 'smooth', block: 'nearest' });
      waBtn.focus({ preventScroll: true });
    }

    function hideSummary() {
      summary.hidden = true;
      reviewBtn.hidden = false;
      pending = null;
    }

    // Changing any field after review invalidates the summary and reference.
    form.addEventListener('input', (e) => {
      // Clear only the error for the field being edited.
      const key = Object.keys(fields).find((k) => fields[k].el === e.target);
      if (key) setError(key, '');
      if (!summary.hidden) hideSummary();
    });
    form.addEventListener('change', () => {
      if (!summary.hidden) hideSummary();
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (honeypot && honeypot.value) return; // silently drop bot submissions

      clearErrors();
      const { data, errors } = validate();
      const keys = Object.keys(errors);
      if (keys.length) {
        keys.forEach((k) => setError(k, errors[k]));
        statusEl.textContent = 'Please correct the highlighted fields.';
        statusEl.className = 'form-status is-error';
        fields[keys[0]].el.focus();
        return;
      }

      if (!summary.hidden && pending) return; // already reviewed: avoid a second reference
      pending = { ref: makeRef(), data };
      pending.message = buildWhatsAppMessage(data, pending.ref);
      showSummary(data);
      statusEl.textContent = 'Check your details, then send the request on WhatsApp.';
      statusEl.className = 'form-status is-ok';
    });

    editBtn.addEventListener('click', () => {
      hideSummary();
      fields.name.el.focus();
    });

    // Opens WhatsApp only on this explicit click. Re-clicking reuses the same reference.
    waBtn.addEventListener('click', () => {
      if (!pending || waBtn.disabled) return;
      const url = `https://wa.me/${HOSPITAL_WA}?text=${encodeURIComponent(pending.message)}`;

      // Brief cooldown prevents accidental double-clicks opening two chats.
      waBtn.disabled = true;
      setTimeout(() => { waBtn.disabled = false; }, 1500);

      // Note: 'noopener' in the features string makes window.open() return null even on success,
      // so it is not used here. The opener reference is cleared manually instead.
      const win = window.open(url, '_blank');
      if (win) {
        try { win.opener = null; } catch (err) { /* cross-origin guard; ignore */ }
        statusEl.className = 'form-status is-ok';
        statusEl.textContent = `Request ${pending.ref} is ready in WhatsApp. Send the message to complete it. The hospital will confirm your appointment with you.`;
        waBtn.textContent = 'Reopen WhatsApp';
      } else {
        // Pop-up blocked: give a direct link instead of claiming the message was sent.
        clear(statusEl);
        const text = document.createTextNode(`Your browser blocked the WhatsApp window. Request ${pending.ref} is not sent yet. `);
        const link = document.createElement('a');
        link.href = url;
        link.target = '_blank';
        link.rel = 'noopener';
        link.textContent = 'Open WhatsApp to send it';
        statusEl.append(text, link);
        statusEl.className = 'form-status is-error';
      }
    });
  }
})();
