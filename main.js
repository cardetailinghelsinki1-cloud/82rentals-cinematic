(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  // Huom: animaatiot ja video toimivat myös 'Vähennä liikettä' -asetuksella (asiakkaan toive).

  /* ---------- Kieli (FI / EN) ---------- */
  const store = {
    get: k => { try { return localStorage.getItem(k); } catch { return null; } },
    set: (k, v) => { try { localStorage.setItem(k, v); } catch {} }
  };
  function setLang(lang) {
    const dict = window.I18N[lang] || window.I18N.fi;
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(el => { const v = dict[el.dataset.i18n]; if (v != null) el.textContent = v; });
    $$('[data-i18n-html]').forEach(el => { const v = dict[el.dataset.i18nHtml]; if (v != null) el.innerHTML = v; });
    $$('.lang button').forEach(b => b.classList.toggle('is-active', b.dataset.lang === lang));
    store.set('lang', lang);
    if (window.ScrollTrigger) $$('.hl').forEach(h => h.style.setProperty('--hl', 1));
  }
  $$('.lang button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  const saved = store.get('lang');
  if (saved && saved !== 'fi') setLang(saved);

  /* ---------- Navi ---------- */
  const nav = $('#nav');
  const burger = $('.nav__burger');
  const menu = $('#mobileMenu');
  const onScroll = () => nav.classList.toggle('is-solid', window.scrollY > window.innerHeight * 0.75);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  burger.addEventListener('click', () => {
    const open = burger.getAttribute('aria-expanded') !== 'true';
    burger.setAttribute('aria-expanded', open);
    menu.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  });
  $$('a', menu).forEach(a => a.addEventListener('click', () => burger.click()));

  /* ---------- Infonauha: monistetaan saumatonta looppia varten ---------- */
  const track = $('#tickerTrack');
  const list = $('.ticker__list', track);
  for (let i = 0; i < 3; i++) { const c = list.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.appendChild(c); }

  /* ---------- Hero-video ---------- */
  const heroVideo = $('#heroVideo');
  const heroSrc = heroVideo.dataset[window.innerWidth < 820 ? 'srcMobile' : 'src'];
  if (heroSrc) {
    heroVideo.muted = true;
    heroVideo.defaultMuted = true;
    heroVideo.setAttribute('muted', '');
    heroVideo.src = heroSrc;
    heroVideo.classList.add('has-video');
    const tryPlay = () => { const p = heroVideo.play(); if (p && p.catch) p.catch(() => {}); };
    tryPlay();
    heroVideo.addEventListener('canplay', tryPlay, { once: true });
    // Jos selain esti automaattisen toiston (esim. virransäästötila), käynnistä ensimmäisestä vuorovaikutuksesta
    const kick = () => {
      if (heroVideo.paused && !heroVideo.ended) tryPlay();
      ['touchstart', 'pointerdown', 'scroll', 'keydown'].forEach(e => window.removeEventListener(e, kick));
    };
    ['touchstart', 'pointerdown', 'scroll', 'keydown'].forEach(e => window.addEventListener(e, kick, { passive: true }));
  }

  /* ---------- Laskurit ---------- */
  function runCounter(el) {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const fmt = v => v.toFixed(dec).replace('.', ',') + suffix;
    if (!window.gsap) { el.textContent = fmt(target); return; }
    const o = { v: 0 };
    gsap.to(o, { v: target, duration: 2, ease: 'power3.out', onUpdate: () => (el.textContent = fmt(o.v)) });
  }

  if (!window.gsap || !window.ScrollTrigger) {
    $$('[data-count]').forEach(runCounter);
    return;
  }

  /* ---------- Skrollaukseen sidottu video (lataus vasta lähellä, pehmeä haku) ---------- */
  function scrubVideo(v, triggerSel) {
    let target = 0, loaded = false;
    const load = () => {
      if (loaded) return; loaded = true;
      v.muted = true; v.src = v.dataset.src; v.load();
      v.addEventListener('loadeddata', () => {
        // iOS: video pitää "herättää" ennen kuin currentTime-haku piirtää ruudun
        const p = v.play(); if (p && p.then) p.then(() => v.pause()).catch(() => {}); else v.pause();
        v.classList.add('is-ready');
      }, { once: true });
    };
    ScrollTrigger.create({ trigger: triggerSel, start: 'top 250%', once: true, onEnter: load });
    gsap.ticker.add(() => {
      if (!loaded || !v.duration || v.readyState < 2) return;
      const t = target * (v.duration - 0.05);
      const d = t - v.currentTime;
      if (Math.abs(d) > 0.015 && !v.seeking) v.currentTime = v.currentTime + d * 0.35;
    });
    return p => { target = Math.min(1, Math.max(0, p)); };
  }

  /* ---------- Sulava skrollaus ---------- */
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) {
    const lenis = new Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const t = $(a.getAttribute('href')); if (t) { e.preventDefault(); lenis.scrollTo(t, { offset: t.id === 'jet' || t.id === 'top' ? 0 : -90 }); }
    }));
  }

  /* ---------- 1. Hero: avausnäytös ---------- */
  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro
    .from('.hero__video', { scale: 1.25, filter: 'brightness(0.2) blur(6px)', duration: 2.6, ease: 'power3.out' }, 0)
    .from('.letterbox--top', { yPercent: 100, scaleY: 3, duration: 1.6 }, 0)
    .from('.letterbox--bottom', { yPercent: -100, scaleY: 3, duration: 1.6 }, 0)
    .from('.hero .intro', { y: 60, autoAlpha: 0, duration: 1.6, stagger: 0.12 }, 0.45)
    .from('.hero__num', { autoAlpha: 0, x: 120, duration: 2.4 }, 0.4)
    .fromTo('.hero .hl', { '--hl': 0 }, { '--hl': 1, duration: 1.2, ease: 'power3.inOut' }, 1.1);

  /* Hero: skrollatessa kamera "ajaa sisään" ja mustat palkit vetäytyvät */
  gsap.timeline({ scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } })
    .to('.hero__media', { scale: 1.15, yPercent: 12, ease: 'none' }, 0)
    .to('.letterbox--top', { yPercent: -100, ease: 'none', duration: 0.3 }, 0)
    .to('.letterbox--bottom', { yPercent: 100, ease: 'none', duration: 0.3 }, 0)
    .to('.hero__copy', { yPercent: -18, autoAlpha: 0.1, ease: 'none' }, 0)
    .to('.offer', { yPercent: -35, ease: 'none' }, 0)
    .to('.hero__num', { yPercent: -30, ease: 'none' }, 0)
    .to('.hero__shade', { opacity: 1.0, ease: 'none' }, 0);

  /* ---------- Yleiset paljastukset (erä kerrallaan, kun elementti tulee näkyviin) ---------- */
  ScrollTrigger.config({ ignoreMobileResize: true });
  gsap.set('.reveal', { y: 70, autoAlpha: 0 });
  ScrollTrigger.batch('.reveal', {
    start: 'top 88%', once: true,
    onEnter: b => gsap.to(b, { y: 0, autoAlpha: 1, duration: 1.4, ease: 'expo.out', stagger: 0.1, overwrite: true })
  });
  $$('.section .hl, .team .hl').forEach(h => {
    gsap.fromTo(h, { '--hl': 0 }, { '--hl': 1, duration: 1.2, ease: 'power3.inOut', delay: 0.5, scrollTrigger: { trigger: h, start: 'top 85%' } });
  });

  /* Isot taustanumerot liikkuvat eri tahdissa (syvyys) */
  $$('.ghost-num, .team__num, .cta__num, .footer__num').forEach(n => {
    gsap.fromTo(n, { yPercent: 25 }, { yPercent: -25, ease: 'none', scrollTrigger: { trigger: n.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ---------- 2. Infonauha liukuu sisään ---------- */
  gsap.from('.ticker', { clipPath: 'inset(0 0 100% 0)', duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.ticker', start: 'top 95%' } });

  /* ---------- 3. Laitteisto: piirros → värit → osat 01–04 → tekniset tiedot ---------- */
  const jetSec = $('#jet');
  if (jetSec) {
    const slides = $$('.jp-slide', jetSec);
    const spots = $$('.hs', jetSec);
    const countEl = $('#jetCount');
    const steps = [0, 0.25, 0.343, 0.436, 0.53, 0.615]; // intro, 01, 02, 03, 04, tekniset tiedot (aikajanan 3.5 / 4.8 / 6.1 / 7.4 / 8.6 ÷ 14)
    let active = -1;
    gsap.set(slides, { autoAlpha: 0, y: 24 });
    const setActive = i => {
      if (i === active) return;
      const prev = active; active = i;
      if (prev > -1) gsap.to(slides[prev], { autoAlpha: 0, y: i > prev ? -24 : 24, duration: 0.45, ease: 'power2.in', overwrite: true });
      gsap.fromTo(slides[i], { autoAlpha: 0, y: i > prev ? 24 : -24 }, { autoAlpha: 1, y: 0, duration: 0.7, delay: prev > -1 ? 0.2 : 0, ease: 'expo.out', overwrite: true });
      spots.forEach((s, k) => {
        s.classList.toggle('is-on', k === i - 1);
        gsap.to(s, { autoAlpha: i >= k + 1 && i <= 4 ? 1 : (i === 5 ? 0.5 : 0), scale: i >= k + 1 ? 1 : 0.4, transformOrigin: 'center', duration: 0.5, ease: 'back.out(2)', overwrite: true });
      });
      countEl.textContent = String(Math.min(Math.max(i, 0), 4)).padStart(2, '0');
    };
    setActive(0);

    // Kameran kohdepisteet (svg:n suhteelliset koordinaatit) jokaiselle osalle
    const focus = [[0.618, 0.18], [0.457, 0.378], [0.5, 0.71], [0.716, 0.67]];
    const small = window.matchMedia('(max-width: 820px)').matches;
    const z = small ? 1.35 : 1.22;
    const jt = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: jetSec, pin: true, start: 'top top', anticipatePin: 1,
        end: () => '+=' + Math.round(window.innerHeight * (small ? 4.6 : 5.2)),
        scrub: 0.8,
        onUpdate: self => {
          const p = self.progress;
          let i = 0; steps.forEach((t, k) => { if (p >= t) i = k; });
          setActive(i);
          gsap.set('#jetBar', { scaleX: p });
        }
      }
    });
    jt.to('.jet__word', { xPercent: -70, duration: 14 }, 0)
      .fromTo('.jet__stage', { scale: 0.82, rotate: -3 }, { scale: 1, rotate: 0, duration: 3 }, 0)
      .to('.jet__svg .jl, .jet__svg .jp', { strokeDashoffset: 0, duration: 1.4, stagger: 0.12 }, 0)
      .to('.jet__body', { '--fill': 1, duration: 0.9 }, 2.3)
      .to('.jet__spot', { opacity: 1, duration: 1 }, 2.3)
      .fromTo('.jet__shine', { attr: { x: -200 } }, { attr: { x: 1100 }, duration: 1.1 }, 2.6)
      .to('.jet__head', { autoAlpha: small ? 0 : 0.1, y: -30, duration: 0.6 }, 3.2);
    focus.forEach(([fx, fy], k) => {
      jt.to('.jet__svg', { scale: z, xPercent: (0.5 - fx) * 100 * (z - 0.6), yPercent: (0.5 - fy) * 100 * (z - 0.7), duration: 1.1, ease: 'power2.inOut' }, 3.5 + k * 1.3);
    });
    jt.to('.jet__svg', { scale: 1, xPercent: 0, yPercent: 0, duration: 1.1, ease: 'power2.inOut' }, 8.6)
      .to('.jet__head', { autoAlpha: 1, y: 0, duration: 0.6 }, 8.8);

    // Piirros muuttuu oikeaksi jetiksi (Higgsfield-studiokuva) ja jetti pyörähtää skrollatessa
    const spin = $('.jet__spin');
    const setSpin = spin ? scrubVideo(spin, '#jet') : () => {};
    const spinP = { p: 0 };
    jt.fromTo('.jet__real', { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power2.inOut' }, 9.1)
      .to('.jet__svg', { autoAlpha: 0, duration: 0.7 }, 9.5)
      .to('.jet__spot', { scale: 1.25, duration: 1 }, 9.1)
      .to(spinP, { p: 1, duration: 3.4, onUpdate: () => setSpin(spinP.p) }, 10.1)
      .to({}, { duration: 0.6 }, 13.5);
  }

  /* ---------- 4. Kalusto: kuva avautuu ja kortit liukuvat ---------- */
  gsap.fromTo('#featsPhoto', { '--ci': '10%', '--pz': 1.3 }, { '--ci': '0%', '--pz': 1, ease: 'none',
    scrollTrigger: { trigger: '#featsPhoto', start: 'top bottom', end: 'top 25%', scrub: true } });
  gsap.from('.feat', { x: 80, autoAlpha: 0, duration: 1.3, ease: 'expo.out', stagger: 0.12,
    scrollTrigger: { trigger: '.feats__list', start: 'top 80%' } });

  /* ---------- 5. Hinnasto: kortit levittyvät pakasta ---------- */
  const mmTiers = gsap.matchMedia();
  mmTiers.add('(min-width: 1025px)', () => {
    gsap.fromTo('.tier',
      { y: 160, rotateY: i => [28, 0, -28][i], rotateX: 12, xPercent: i => [60, 0, -60][i], z: -200, autoAlpha: 0.2 },
      { y: 0, rotateY: 0, rotateX: 0, xPercent: 0, z: 0, autoAlpha: 1, ease: 'none',
        scrollTrigger: { trigger: '#tiers', start: 'top bottom', end: 'top 35%', scrub: 1 } });
  });
  mmTiers.add('(max-width: 1024px)', () => {
    gsap.utils.toArray('.tier').forEach(t => gsap.from(t, { y: 90, rotateX: 18, autoAlpha: 0, duration: 1.3, ease: 'expo.out',
      scrollTrigger: { trigger: t, start: 'top 88%' } }));
  });

  /* Hinnaston taustavideo: saaristolento etenee skrollauksen mukana */
  const archVideo = $('.pricing__video');
  if (archVideo) {
    const setArch = scrubVideo(archVideo, '#hinnasto');
    ScrollTrigger.create({ trigger: '#hinnasto', start: 'top bottom', end: 'bottom top', onUpdate: s => setArch(s.progress) });
    gsap.fromTo('.pricing__video', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '#hinnasto', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---------- Tiimi + yhteystiedot ---------- */
  gsap.from('.person', { y: 70, autoAlpha: 0, duration: 1.3, ease: 'expo.out', stagger: 0.12, scrollTrigger: { trigger: '.crew__grid', start: 'top 85%' } });
  gsap.fromTo('.map__svg', { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '#map', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.map__card', { y: 60, autoAlpha: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '#map', start: 'top 70%' } });

  /* ---------- Puhelin kääntyy esiin ---------- */
  gsap.fromTo('.phone__frame',
    { rotateY: -22, rotateX: 10, rotateZ: -4, y: 140, scale: 0.9 },
    { rotateY: 0, rotateX: 0, rotateZ: 0, y: -30, scale: 1, ease: 'none',
      scrollTrigger: { trigger: '.social', start: 'top bottom', end: 'bottom 40%', scrub: 1 } });

  /* ---------- 5. Tiimikuva avautuu koko ruudulle ---------- */
  const tm = $('#teamMedia');
  gsap.fromTo(tm, { '--inset': '7%', '--round': '36px', '--zoom': 1.3 },
    { '--inset': '0%', '--round': '0px', '--zoom': 1, ease: 'none',
      scrollTrigger: { trigger: tm, start: 'top bottom', end: 'top top', scrub: true } });
  gsap.from('.stats', { y: 80, autoAlpha: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.stats', start: 'top 92%' } });
  ScrollTrigger.create({ trigger: '#stats', start: 'top 85%', once: true, onEnter: () => $$('[data-count]').forEach(runCounter) });

  /* ---------- 6. CTA-laatikko kasvaa ---------- */
  gsap.fromTo('#ctaBox', { scale: 0.88, borderRadius: '64px', y: 60 },
    { scale: 1, borderRadius: '32px', y: 0, ease: 'none', scrollTrigger: { trigger: '#ctaBox', start: 'top bottom', end: 'center 60%', scrub: true } });
  gsap.from('#ctaBox > div > *, #ctaBox .btn', { y: 40, autoAlpha: 0, stagger: 0.1, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '#ctaBox', start: 'top 75%' } });

  /* Footer nousee esiin */
  gsap.from('.footer__grid > *', { y: 50, autoAlpha: 0, stagger: 0.12, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 85%' } });

  /* Sivun korkeus muuttuu (arvostelu-widget, fontit, kuvat) → päivitetään laukaisupisteet */
  let rT;
  const refresh = () => { clearTimeout(rT); rT = setTimeout(() => ScrollTrigger.refresh(), 250); };
  if ('ResizeObserver' in window) {
    let lastH = document.body.scrollHeight;
    new ResizeObserver(() => { const h = document.body.scrollHeight; if (Math.abs(h - lastH) > 40) { lastH = h; refresh(); } }).observe(document.body);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(refresh);
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
