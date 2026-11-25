(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

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
  if (heroVideo.querySelector('source') || heroVideo.getAttribute('src')) heroVideo.classList.add('has-video');

  /* ---------- Laskurit ---------- */
  function runCounter(el) {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || '0', 10);
    const suffix = el.dataset.suffix || '';
    const fmt = v => v.toFixed(dec).replace('.', ',') + suffix;
    if (reduce || !window.gsap) { el.textContent = fmt(target); return; }
    const o = { v: 0 };
    gsap.to(o, { v: target, duration: 2, ease: 'power3.out', onUpdate: () => (el.textContent = fmt(o.v)) });
  }

  if (reduce || !window.gsap || !window.ScrollTrigger) {
    $$('[data-count]').forEach(runCounter);
    return;
  }

  /* ---------- Sulava skrollaus ---------- */
  gsap.registerPlugin(ScrollTrigger);
  if (window.Lenis) {
    const lenis = new Lenis({ duration: 1.25, easing: t => Math.min(1, 1.001 - Math.pow(2, -10 * t)), smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const t = $(a.getAttribute('href')); if (t) { e.preventDefault(); lenis.scrollTo(t); }
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

  /* ---------- Yleiset paljastukset ---------- */
  $$('.section, .team').forEach(sec => {
    const items = $$('.reveal', sec);
    if (!items.length) return;
    gsap.from(items, {
      y: 70, autoAlpha: 0, duration: 1.4, ease: 'expo.out', stagger: 0.1,
      scrollTrigger: { trigger: items[0], start: 'top 85%' }
    });
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

  /* ---------- 3. Puhelin kääntyy esiin ---------- */
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

  window.addEventListener('load', () => ScrollTrigger.refresh());
})();
