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
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const t = $(a.getAttribute('href')); if (t) { e.preventDefault(); if (window.__heroFinish) window.__heroFinish(); lenis.scrollTo(t, { offset: t.id === 'jet' || t.id === 'top' ? 0 : -90 }); }
    }));
  }

  /* ---------- 1. Hero: tarina käynnistyy ensimmäisestä skrollauksesta ja etenee itsestään loppuun ----------
     Sivulle tultaessa näkyy videon 1. ruutu + otsikko. Pieni skrollaus alaspäin → sivu pysyy herossa,
     video toistuu ja tekstivaiheet etenevät videon tahdissa. Lopussa video jää viimeiseen ruutuun ja
     skrollaus vapautuu. "Ohita" ja navigaatiolinkit vievät suoraan loppuun. */
  const heroVideo = $('#heroVideo');
  const heroMobile = window.innerWidth < 820;
  if (heroMobile) { heroVideo.dataset.src = heroVideo.dataset.srcMobile; heroVideo.poster = heroVideo.dataset.posterMobile; }
  heroVideo.muted = true; heroVideo.defaultMuted = true; heroVideo.setAttribute('muted', '');
  heroVideo.src = heroVideo.dataset.src; heroVideo.preload = 'auto'; heroVideo.load();
  gsap.set('.beat--2, .beat--3, .beat--4', { autoAlpha: 0 });

  const intro = gsap.timeline({ defaults: { ease: 'expo.out' } });
  intro
    .from('.hero__media', { scale: 1.12, filter: 'brightness(0.4) blur(6px)', duration: 2.2, ease: 'power3.out' }, 0)
    .from('.beat--1 .intro', { y: 60, autoAlpha: 0, duration: 1.6, stagger: 0.12 }, 0.3)
    .from('.hero__num', { autoAlpha: 0, x: 120, duration: 2.4 }, 0.3)
    .from('.hero__scroll', { autoAlpha: 0, duration: 1 }, 1.2);

  // Tarina 10 aikayksikössä; edistymä seuraa videon toistokohtaa
  const story = gsap.timeline({ paused: true, defaults: { ease: 'none' } });
  story.to('.hero__num', { xPercent: -30, duration: 10 }, 0)
    .to('.hero__scroll', { autoAlpha: 0, duration: 0.3 }, 0)
    .to('#heroBar', { scaleX: 1, duration: 10 }, 0)
    .to('.beat--1', { y: -80, autoAlpha: 0, filter: 'blur(8px)', duration: 0.9 }, 1.5)
    .fromTo('.hero__shade:not(.hero__shade--r)', { opacity: heroMobile ? 0.85 : 0 }, { opacity: 0.85, duration: 0.9 }, 1.6)
    .to('.hero__shade--r', { opacity: 0, duration: 0.9 }, 1.6)
    .fromTo('.beat--2', { y: 80, autoAlpha: 0, filter: 'blur(8px)' }, { y: 0, autoAlpha: 1, filter: 'blur(0px)', duration: 0.9 }, 2.3)
    .to('.beat--2', { y: -80, autoAlpha: 0, filter: 'blur(8px)', duration: 0.8 }, 4.4)
    .set('.beat--3', { autoAlpha: 1 }, 5.1)
    .fromTo('.beat--3 li', { x: 120, autoAlpha: 0, rotateY: -35 }, { x: 0, autoAlpha: 1, rotateY: 0, duration: 0.7, stagger: 0.55, ease: 'power2.out' }, 5.1)
    .to('.beat--3 li', { x: -80, autoAlpha: 0, duration: 0.6, stagger: 0.1 }, 7.3)
    .fromTo('.beat--4', { autoAlpha: 0, x: 160, rotateY: -38, scale: 0.9, transformPerspective: 1200 }, { autoAlpha: 1, x: 0, rotateY: 0, scale: 1, duration: 1.1, ease: 'power2.out' }, 7.9)
    .to('.hero__shade', { opacity: 1, duration: 2 }, 8)
    .to('.hero__skip', { autoAlpha: 0, duration: 0.4 }, 9.4);

  let state = 'idle'; // idle → playing → done
  const RATE = 1.15;
  const fallback = gsap.to(story, { progress: 1, duration: 15 / RATE, ease: 'none', paused: true });
  const keys = ['ArrowDown', 'PageDown', 'End', ' ', 'Spacebar'];
  const block = e => {
    if (state !== 'playing') return;
    if (e.type === 'keydown' && !keys.includes(e.key)) return;
    e.preventDefault();
  };
  window.addEventListener('wheel', block, { passive: false });
  window.addEventListener('touchmove', block, { passive: false });
  window.addEventListener('keydown', block);
  const lock = on => {
    document.documentElement.classList.toggle('hero-locked', on);
    if (lenis) on ? lenis.stop() : lenis.start();
  };
  const finish = () => {
    if (state === 'done') return;
    state = 'done';
    fallback.kill(); story.progress(1);
    if (heroVideo.duration) { heroVideo.pause(); heroVideo.currentTime = heroVideo.duration - 0.05; }
    lock(false);
  };
  window.__heroFinish = finish;
  const start = () => {
    if (state !== 'idle') return;
    state = 'playing';
    intro.progress(1);
    if (lenis) lenis.scrollTo(0, { immediate: true }); else window.scrollTo(0, 0);
    lock(true);
    heroVideo.playbackRate = RATE;
    const p = heroVideo.play();
    if (p && p.catch) p.catch(() => fallback.play()); // jos toisto estetään, tekstit etenevät silti
    setTimeout(() => { if (state === 'playing' && heroVideo.paused) fallback.play(); }, 1200);
  };
  heroVideo.addEventListener('ended', finish);
  gsap.ticker.add(() => {
    if (state === 'playing' && heroVideo.duration && !heroVideo.paused) story.progress(heroVideo.currentTime / heroVideo.duration);
  });
  fallback.eventCallback('onComplete', finish);
  $('.hero__skip').addEventListener('click', finish);

  // Käynnistys: ensimmäinen eleen suunta alaspäin, kun ollaan sivun alussa
  if (window.scrollY > window.innerHeight * 0.5) finish();
  let ty = null;
  window.addEventListener('wheel', e => { if (state === 'idle' && e.deltaY > 0 && window.scrollY < 40) { e.preventDefault(); start(); } }, { passive: false });
  window.addEventListener('touchstart', e => { ty = e.touches[0].clientY; }, { passive: true });
  window.addEventListener('touchmove', e => {
    if (state === 'idle' && ty !== null && ty - e.touches[0].clientY > 8 && window.scrollY < 40) { e.preventDefault(); start(); }
  }, { passive: false });
  window.addEventListener('keydown', e => { if (state === 'idle' && keys.includes(e.key) && window.scrollY < 40) { e.preventDefault(); start(); } });
  window.addEventListener('scroll', () => { if (state === 'idle' && window.scrollY > 4 && window.scrollY < window.innerHeight * 0.5) start(); }, { passive: true });

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

  /* ---------- 3. Laitteisto: valo paljastaa jetin → kamera osiin 01–04 → tekniset tiedot + 360° ---------- */
  const jetSec = $('#jet');
  const small = window.matchMedia('(max-width: 820px)').matches;
  if (jetSec) {
    const slides = $$('.jp-slide', jetSec);
    const spots = $$('.hs', jetSec);
    const countEl = $('#jetCount');
    const steps = [0, 0.25, 0.343, 0.436, 0.53, 0.615]; // intro, 01, 02, 03, 04, tekniset tiedot (aikajana 3.5 / 4.8 / 6.1 / 7.4 / 8.6 ÷ 14)
    let active = -1;
    gsap.set(slides, { autoAlpha: 0, y: 24 });
    const setActive = i => {
      if (i === active) return;
      const prev = active; active = i;
      if (prev > -1) gsap.to(slides[prev], { autoAlpha: 0, y: i > prev ? -24 : 24, duration: 0.45, ease: 'power2.in', overwrite: true });
      gsap.fromTo(slides[i], { autoAlpha: 0, y: i > prev ? 24 : -24 }, { autoAlpha: 1, y: 0, duration: 0.7, delay: prev > -1 ? 0.2 : 0, ease: 'expo.out', overwrite: true });
      spots.forEach((s, k) => {
        s.classList.toggle('is-on', k === i - 1);
        gsap.to(s, { autoAlpha: i >= k + 1 && i <= 4 ? 1 : 0, scale: i >= k + 1 ? 1 : 0.3, duration: 0.5, ease: 'back.out(2)', overwrite: true });
      });
      countEl.textContent = String(Math.min(Math.max(i, 0), 4)).padStart(2, '0');
    };
    setActive(0);

    // Kohdepisteet Higgsfield-videon ensimmäisessä ruudussa (suhteelliset koordinaatit)
    const focus = [[0.574, 0.2], [0.453, 0.325], [0.37, 0.435], [0.725, 0.48]];
    const z = small ? 2.1 : 1.75;
    const spin = $('.jet__spin');
    const setSpin = spin ? scrubVideo(spin, '#jet') : () => {};
    const spinP = { p: 0 };
    const jt = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: {
        trigger: jetSec, pin: true, start: 'top top', anticipatePin: 1,
        end: () => '+=' + Math.round(window.innerHeight * (small ? 4.6 : 5.2)),
        scrub: 0.8,
        onUpdate: self => {
          let i = 0; steps.forEach((t, k) => { if (self.progress >= t) i = k; });
          setActive(i);
          gsap.set('#jetBar', { scaleX: self.progress });
        }
      }
    });
    jt.to('.jet__word', { xPercent: -70, duration: 14 }, 0)
      .fromTo('.jet__frame', { scale: 1.3, filter: 'brightness(0) contrast(1.6)' }, { scale: 1, filter: 'brightness(1) contrast(1)', duration: 2.6, ease: 'power2.out' }, 0)
      .fromTo('.jet__beam', { opacity: 0, scaleX: 0.4 }, { opacity: 1, scaleX: 1, duration: 1.6 }, 0.2)
      .to('.jet__spot', { opacity: 1, duration: 1.4 }, 1)
      .fromTo('.jet__flare', { xPercent: -120 }, { xPercent: 120, duration: 1.4, ease: 'power1.inOut' }, 1.6)
      .to('.jet__beam', { opacity: 0.35, duration: 1 }, 3)
      .to('.jet__head', { autoAlpha: small ? 0 : 0.1, y: -30, duration: 0.6 }, 3.1);
    focus.forEach(([fx, fy], k) => {
      jt.to('.jet__frame', { scale: z, xPercent: (0.5 - fx) * 100 * z, yPercent: (0.5 - fy) * 100 * z, duration: 1.1, ease: 'power2.inOut' }, 3.5 + k * 1.3);
    });
    jt.to('.jet__frame', { scale: 1, xPercent: 0, yPercent: 0, duration: 1.1, ease: 'power2.inOut' }, 8.6)
      .to('.jet__head', { autoAlpha: 1, y: 0, duration: 0.6 }, 8.8)
      .fromTo('.jet__flare', { xPercent: -120 }, { xPercent: 120, duration: 1, immediateRender: false }, 9.2)
      .to(spinP, { p: 1, duration: 3.6, onUpdate: () => setSpin(spinP.p) }, 9.8)
      .to('.jet__frame', { scale: small ? 1.05 : 1.08, duration: 3.6 }, 9.8)
      .to({}, { duration: 0.6 }, 13.4);
  }

  /* ---------- 4. Kalusto: kiinnitetty vaakarulla, kortit kääntyvät syvyydestä esiin ---------- */
  const fTrack = $('#featsTrack');
  if (fTrack) {
    const dist = () => Math.max(0, fTrack.scrollWidth - window.innerWidth);
    const ft = gsap.timeline({
      defaults: { ease: 'none' },
      scrollTrigger: { trigger: '#kalusto', pin: true, start: 'top top', anticipatePin: 1, scrub: 0.8, invalidateOnRefresh: true,
        end: () => '+=' + Math.round(dist() + window.innerHeight * 0.6),
        onUpdate: s => gsap.set('#featsBar', { scaleX: s.progress }) }
    });
    ft.to(fTrack, { x: () => -dist(), duration: 1 }, 0)
      .to('.feats__word', { xPercent: -40, duration: 1 }, 0)
      .fromTo('.feats__head', { autoAlpha: 1 }, { autoAlpha: small ? 0.15 : 1, duration: 0.3 }, 0);
    // Jokainen kortti kääntyy esiin oikealta ja kuva liukuu kortin sisällä (parallaksi)
    $$('.fcard', fTrack).forEach(card => {
      const img = $('img', card);
      gsap.fromTo(card, { rotateY: -28, z: -160, autoAlpha: 0.35 }, { rotateY: 0, z: 0, autoAlpha: 1, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: ft, start: 'left 105%', end: 'left 55%', scrub: true } });
      if (img) gsap.fromTo(img, { xPercent: -18 }, { xPercent: 0, ease: 'none',
        scrollTrigger: { trigger: card, containerAnimation: ft, start: 'left right', end: 'right left', scrub: true } });
    });
  }

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
  const archVideo = $('.pricing__video');
  if (archVideo) {
    const setArch = scrubVideo(archVideo, '#hinnasto');
    ScrollTrigger.create({ trigger: '#hinnasto', start: 'top bottom', end: 'bottom top', onUpdate: s => setArch(s.progress) });
    gsap.fromTo('.pricing__video', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '#hinnasto', start: 'top bottom', end: 'bottom top', scrub: true } });
  }

  /* ---------- 6. Some: oikea iPhone pyörähtää (Higgsfield), lopuksi näytöllä pyörii oikea somevideo ---------- */
  const pSpin = $('.phone3d__spin');
  const setPhone = pSpin ? scrubVideo(pSpin, '#social') : () => {};
  const phoneVideo = $('.phone__video');
  const phoneP = { p: 0 };
  const st = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: small
      ? { trigger: '.phone', start: 'top 90%', end: 'bottom 25%', scrub: 0.6 }
      : { trigger: '#social', pin: true, start: 'top top', end: '+=160%', scrub: 0.6, anticipatePin: 1 }
  });
  st.to(phoneP, { p: 1, duration: 1, onUpdate: () => setPhone(phoneP.p) }, 0)
    .fromTo('.phone3d', { scale: 0.85, y: 40 }, { scale: 1, y: 0, duration: 1 }, 0)
    .fromTo('.phone3d__screen', { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12 }, 0.95)
    .from('.ptag', { autoAlpha: 0, scale: 0.4, y: 40, stagger: 0.1, duration: 0.25, ease: 'back.out(2)' }, 0.7)
    .to('.ptag--1', { y: -40, duration: 0.3 }, 1).to('.ptag--2', { y: 30, duration: 0.3 }, 1).to('.ptag--3', { y: -24, duration: 0.3 }, 1);
  if (phoneVideo) ScrollTrigger.create({ trigger: '#social', start: 'top 60%', end: 'bottom top',
    onEnter: () => { phoneVideo.preload = 'auto'; const p = phoneVideo.play(); if (p && p.catch) p.catch(() => {}); },
    onLeave: () => phoneVideo.pause(), onEnterBack: () => { const p = phoneVideo.play(); if (p && p.catch) p.catch(() => {}); } });

  /* ---------- 7. Arvostelut: tähdet täyttyvät ja luku laskee 4,9:ään ---------- */
  const rNum = $('#ratingNum');
  const rObj = { v: 0 };
  gsap.timeline({ scrollTrigger: { trigger: '#rating', start: 'top 85%', end: 'top 35%', scrub: 0.6 } })
    .fromTo('#ratingFill', { width: '0%' }, { width: '98%', ease: 'none' }, 0)
    .to(rObj, { v: 4.9, ease: 'none', onUpdate: () => { rNum.textContent = rObj.v.toFixed(1).replace('.', (window.I18N[document.documentElement.lang] || {}).decimal || ','); } }, 0)
    .from('#rating', { rotateX: 30, y: 60, autoAlpha: 0.2, transformPerspective: 900, ease: 'none' }, 0);

  const uw = $('.reviews__video');
  if (uw) ScrollTrigger.create({ trigger: '#reviews', start: 'top 150%', end: 'bottom -50%',
    onToggle: s => {
      if (s.isActive) { if (!uw.src) uw.src = uw.dataset.src; const p = uw.play(); if (p && p.catch) p.catch(() => {}); }
      else uw.pause();
    } });

  /* ---------- 8. Tiimi: kuva avautuu, kortit kääntyvät 3D:nä ---------- */
  const tm = $('#teamMedia');
  gsap.fromTo(tm, { '--inset': '7%', '--round': '36px', '--zoom': 1.3 },
    { '--inset': '0%', '--round': '0px', '--zoom': 1, ease: 'none',
      scrollTrigger: { trigger: tm, start: 'top bottom', end: 'top top', scrub: true } });
  gsap.from('.stats', { y: 80, autoAlpha: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.stats', start: 'top 92%' } });
  ScrollTrigger.create({ trigger: '#stats', start: 'top 85%', once: true, onEnter: () => $$('[data-count]').forEach(runCounter) });
  gsap.utils.toArray('.person').forEach((p, i) => {
    gsap.fromTo(p, { rotateX: 55, rotateY: (i - 1) * -18, y: 120, z: -120, autoAlpha: 0 },
      { rotateX: 0, rotateY: 0, y: 0, z: 0, autoAlpha: 1, ease: 'none',
        scrollTrigger: { trigger: '.crew__grid', start: 'top 95%', end: 'top 45%', scrub: 1 } });
  });

  /* ---------- 9. UKK: kysymysmerkki kelluu, kysymykset nousevat porrastetusti ---------- */
  gsap.fromTo('.faq__q', { yPercent: 30, rotate: -12 }, { yPercent: -20, rotate: 8, ease: 'none',
    scrollTrigger: { trigger: '#ukk', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.utils.toArray('.qa').forEach((q, i) => {
    gsap.fromTo(q, { x: 80 + i * 10, rotateY: -16, transformPerspective: 1000, transformOrigin: 'right center' },
      { x: 0, rotateY: 0, ease: 'none', scrollTrigger: { trigger: q, start: 'top bottom', end: 'top 70%', scrub: true } });
  });

  /* ---------- 10. Yhteystiedot ---------- */
  gsap.fromTo('.map__svg', { scale: 1.25 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '#map', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from('.map__card', { y: 60, autoAlpha: 0, duration: 1.3, ease: 'expo.out', scrollTrigger: { trigger: '#map', start: 'top 70%' } });
  gsap.fromTo('#map', { rotateX: 22, transformPerspective: 1400, transformOrigin: 'center bottom' }, { rotateX: 0, ease: 'none',
    scrollTrigger: { trigger: '#map', start: 'top bottom', end: 'top 40%', scrub: true } });

  /* ---------- 11. Finaali: kuva avautuu koko ruudulle, otsikko kasvaa ---------- */
  const finV = $('.finale__video');
  const setFin = finV ? scrubVideo(finV, '#finale') : () => {};
  const fin = gsap.timeline({ defaults: { ease: 'none' },
    scrollTrigger: { trigger: '#finale', pin: true, start: 'top top', end: '+=130%', scrub: 1, anticipatePin: 1 } });
  ScrollTrigger.create({ trigger: '#finale', start: 'top bottom', end: () => '+=' + Math.round(window.innerHeight * 2.3), onUpdate: s => setFin(s.progress) });
  fin.fromTo('#finaleMedia', { '--fi': '22%', '--fx': '26%', '--fr': '40px', '--fz': 1.35 }, { '--fi': '0%', '--fx': '0%', '--fr': '0px', '--fz': 1, duration: 1 }, 0)
    .fromTo('.finale__title', { scale: 0.55, autoAlpha: 0.2, letterSpacing: '0.04em' }, { scale: 1, autoAlpha: 1, letterSpacing: '-0.04em', duration: 1 }, 0)
    .from('.finale__copy .eyebrow, .finale__copy .lead, .finale__copy .btn', { y: 50, autoAlpha: 0, stagger: 0.1, duration: 0.4 }, 0.55)
    .fromTo('.finale__num', { scale: 0.6, autoAlpha: 0 }, { scale: 1.1, autoAlpha: 1, duration: 1 }, 0);

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
