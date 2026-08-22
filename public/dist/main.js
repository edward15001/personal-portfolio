"use strict";
/**
 * Portfolio — Main TypeScript
 * Scroll-driven experience: GSAP + ScrollTrigger + Lenis smooth scroll on the
 * homepage, with an IntersectionObserver fallback so detail pages (which don't
 * load the GSAP bundle) still get fade-in reveals. The contact modal works
 * regardless of whether GSAP loads.
 */
(() => {
    const win = window;
    let lenis = null;
    /* ——— Fade-in on scroll via IntersectionObserver (fallback / detail pages) ——— */
    const fadeElements = document.querySelectorAll('.fade-in');
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.15,
    };
    const onIntersect = (entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    };
    const observer = new IntersectionObserver(onIntersect, observerOptions);
    fadeElements.forEach((el) => observer.observe(el));
    /* ——— Split effect words (.tw--lift / .tw--dissolve) into letters ———
       Each letter gets a transition-delay so the stagger reads left to right.
       Runs with or without GSAP (the effects are pure CSS). */
    const splitLetters = (el) => {
        const text = el.textContent ?? '';
        el.textContent = '';
        [...text].forEach((ch) => {
            if (ch === ' ') {
                el.appendChild(document.createTextNode(' '));
            }
            else {
                const s = document.createElement('span');
                s.className = 'l';
                s.textContent = ch;
                el.appendChild(s);
            }
        });
    };
    document
        .querySelectorAll('.tw--lift, .tw--dissolve, .tw--magnetic, .tw--glitch, .tw--weight, .tw--wave, .tw--tilt')
        .forEach((el) => {
        splitLetters(el);
        /* Elevation keeps a left-to-right stagger; the cursor-driven
           effects must respond without per-letter delay. */
        if (el.classList.contains('tw--lift')) {
            el.querySelectorAll('.l').forEach((l, i) => {
                l.style.transitionDelay = `${i * 22}ms`;
            });
        }
    });
    /* ——— Cursor-driven letter effects ———
       On mousemove, each letter's intensity is mapped from its distance to the
       pointer (smoothstep falloff, horizontal distance dominant). Each effect
       translates that intensity differently: dissolve (fade/drift/blur),
       magnetic (pull toward the cursor), glitch (RGB split + jitter), weight
       (variable font weight) and tilt (3D rotation). The wave effect instead
       ripples outward from the cursor entry point. */
    const initCursorEffects = () => {
        const modes = ['dissolve', 'magnetic', 'glitch', 'weight', 'wave', 'tilt', 'liquid'];
        const selector = modes.map((m) => `.tw--${m}`).join(', ');
        const liquidFilter = document.getElementById('liquid');
        const turbulence = liquidFilter?.querySelector('feTurbulence') ?? null;
        const displacement = liquidFilter?.querySelector('feDisplacementMap') ?? null;
        document.querySelectorAll(selector).forEach((word) => {
            const mode = (modes.find((m) => word.classList.contains(`tw--${m}`)) ?? 'dissolve');
            const fontPx = parseFloat(getComputedStyle(word).fontSize) || 32;
            /* Accent for the wave effect: resolved from the word's own context
               (--accent is overridden per project theme), so the color stays
               inside the palette of the section it lives in. */
            const wordComputed = getComputedStyle(word);
            const accent = wordComputed.getPropertyValue('--accent').trim() || wordComputed.color || '#7ee08f';
            /* ——— Liquid: word-level SVG displacement (no letter split needed) ———
               The word always carries filter: url(#liquid); on hover the JS
               eases the displacement scale up (with per-frame noise jitter =
               "bubbling") and back down to 0 on exit. */
            if (mode === 'liquid') {
                if (!turbulence || !displacement)
                    return;
                const liquidRadius = fontPx * 3;
                let currentScale = 0;
                let targetScale = 0;
                let liquidRaf = 0;
                const tick = (time) => {
                    currentScale += (targetScale - currentScale) * 0.1;
                    if (Math.abs(currentScale) < 0.05 && Math.abs(targetScale) < 0.05) {
                        displacement.setAttribute('scale', '0');
                        liquidRaf = 0;
                        return;
                    }
                    if (currentScale > 0.4) {
                        /* bubbling: shift the noise pattern every frame */
                        turbulence.setAttribute('baseFrequency', `${(0.012 + Math.random() * 0.012).toFixed(4)} ${(0.02 + Math.random() * 0.02).toFixed(4)}`);
                    }
                    const osc = 1 + Math.sin(time / 260) * 0.18;
                    displacement.setAttribute('scale', String(Math.max(0, currentScale * osc)));
                    liquidRaf = requestAnimationFrame(tick);
                };
                const setIntensity = (int) => {
                    targetScale = int * 16;
                    if (!liquidRaf)
                        liquidRaf = requestAnimationFrame(tick);
                };
                word.addEventListener('mousemove', (e) => {
                    const rect = word.getBoundingClientRect();
                    const cx = e.clientX - (rect.left + rect.width / 2);
                    const cy = e.clientY - (rect.top + rect.height / 2);
                    const dist = Math.sqrt(cx * cx + cy * cy * 0.5);
                    const t = Math.max(0, 1 - dist / liquidRadius);
                    setIntensity(t * t * (3 - 2 * t));
                });
                word.addEventListener('mouseleave', () => setIntensity(0));
                return;
            }
            const letters = Array.from(word.querySelectorAll('.l'));
            if (letters.length === 0)
                return;
            const radius = fontPx * 2.6;
            const apply = (clientX, clientY) => {
                const rect = word.getBoundingClientRect();
                const cx = clientX - rect.left;
                const cy = clientY - rect.top;
                for (const l of letters) {
                    const lr = l.getBoundingClientRect();
                    const lx = lr.left + lr.width / 2 - rect.left;
                    const ly = lr.top + lr.height / 2 - rect.top;
                    const dx = cx - lx;
                    const dy = cy - ly;
                    const dist = Math.sqrt(dx * dx + dy * dy * 0.5);
                    const t = Math.max(0, 1 - dist / radius);
                    const int = t * t * (3 - 2 * t); // smoothstep falloff
                    switch (mode) {
                        case 'dissolve':
                            l.style.opacity = String(1 - int);
                            l.style.transform = `translateY(${int * 0.28}em) rotate(${int * 8}deg)`;
                            l.style.filter = `blur(${int * 3}px)`;
                            break;
                        case 'magnetic': {
                            const pull = int * fontPx * 0.18;
                            const nx = dist === 0 ? 0 : dx / dist;
                            const ny = dist === 0 ? 0 : dy / dist;
                            l.style.transform = `translate(${nx * pull}px, ${ny * pull}px)`;
                            break;
                        }
                        case 'glitch': {
                            const split = int * 4;
                            l.style.textShadow =
                                split > 0.3
                                    ? `${split}px 0 rgba(255, 60, 90, 0.85), ${-split}px 0 rgba(0, 230, 255, 0.85)`
                                    : '';
                            l.style.transform =
                                int > 0.5
                                    ? `translate(${(Math.random() - 0.5) * 2}px, ${(Math.random() - 0.5) * 2}px)`
                                    : '';
                            break;
                        }
                        case 'weight':
                            l.style.fontWeight = String(Math.round(300 + int * 400));
                            break;
                        case 'tilt': {
                            const rx = Math.max(-28, Math.min(28, (cy - ly) * 0.35 * (0.4 + int)));
                            const ry = Math.max(-28, Math.min(28, (cx - lx) * 0.35 * (0.4 + int)));
                            l.style.transform = `perspective(600px) rotateX(${rx}deg) rotateY(${ry}deg)`;
                            break;
                        }
                        case 'wave':
                            break; // handled on enter/leave below
                    }
                }
            };
            const reset = () => {
                for (const l of letters) {
                    l.style.opacity = '';
                    l.style.transform = '';
                    l.style.filter = '';
                    l.style.textShadow = '';
                    l.style.fontWeight = '';
                }
            };
            if (mode === 'wave') {
                let entryIdx = 0;
                word.addEventListener('mouseenter', (e) => {
                    const rect = word.getBoundingClientRect();
                    const ex = e.clientX - rect.left;
                    let best = Infinity;
                    letters.forEach((l, i) => {
                        const lr = l.getBoundingClientRect();
                        const c = lr.left + lr.width / 2 - rect.left;
                        const d = Math.abs(c - ex);
                        if (d < best) {
                            best = d;
                            entryIdx = i;
                        }
                    });
                    letters.forEach((l, i) => {
                        l.style.transitionDelay = `${Math.abs(i - entryIdx) * 45}ms`;
                        l.style.transform = 'translateY(-0.3em)';
                        l.style.color = accent;
                    });
                });
                word.addEventListener('mouseleave', () => {
                    letters.forEach((l, i) => {
                        l.style.transitionDelay = `${Math.abs(i - entryIdx) * 45}ms`;
                        l.style.transform = '';
                        l.style.color = '';
                    });
                    window.setTimeout(() => {
                        letters.forEach((l) => {
                            l.style.transitionDelay = '';
                        });
                    }, 700);
                });
            }
            else {
                word.addEventListener('mousemove', (e) => apply(e.clientX, e.clientY));
                word.addEventListener('mouseleave', reset);
            }
        });
    };
    initCursorEffects();
    /* ——— Hero: "EDUARDO" as a particle constellation ———
       The real text stays in the DOM (SEO / a11y) but is hidden while a canvas
       renders the word as a cloud of dots that assembles on load (spring
       physics from a scattered field), disperses under the cursor and
       reassembles on exit. Pure canvas 2D — no extra dependencies. */
    const initHeroParticles = () => {
        const canvas = document.querySelector('.hero__particles');
        const text = document.querySelector('.hero__title-text');
        const hero = document.querySelector('.hero');
        if (!canvas || !text || !hero)
            return;
        if (typeof canvas.getContext !== 'function')
            return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches)
            return;
        const ctx = canvas.getContext('2d');
        if (!ctx)
            return;
        const DPR = Math.min(window.devicePixelRatio || 1, 2);
        const NEON = '#4ade80';
        const FORCE = 3.4;
        const SPRING = 0.085;
        const DAMP = 0.8;
        let particles = [];
        let raf = 0;
        let w = 0;
        let h = 0;
        let radius = 90; // cursor influence radius (px), scaled to the font size
        const mouse = { x: -9999, y: -9999, inside: false };
        const build = () => {
            const h1 = text.parentElement;
            if (!h1)
                return;
            const tr = text.getBoundingClientRect();
            const hr = h1.getBoundingClientRect();
            w = Math.max(10, tr.width);
            h = Math.max(10, tr.height);
            canvas.style.left = `${tr.left - hr.left}px`;
            canvas.style.top = `${tr.top - hr.top}px`;
            canvas.style.width = `${w}px`;
            canvas.style.height = `${h}px`;
            canvas.width = Math.round(w * DPR);
            canvas.height = Math.round(h * DPR);
            ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
            /* sample the word's glyphs on an offscreen canvas */
            const cs = getComputedStyle(text);
            const fs = parseFloat(cs.fontSize) || 96;
            radius = Math.max(80, fs * 0.7);
            const off = document.createElement('canvas');
            off.width = Math.max(4, Math.ceil(w));
            off.height = Math.max(4, Math.ceil(h));
            const octx = off.getContext('2d');
            if (!octx)
                return;
            octx.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
            octx.letterSpacing = cs.letterSpacing;
            octx.textAlign = 'center';
            octx.textBaseline = 'middle';
            octx.fillStyle = '#fff';
            octx.fillText(text.textContent ?? 'EDUARDO', off.width / 2, off.height / 2);
            const data = octx.getImageData(0, 0, off.width, off.height).data;
            const targets = [];
            const gap = 6; // sampling stride — the bigger, the sparser the cloud
            for (let y = 0; y < off.height; y += gap) {
                for (let x = 0; x < off.width; x += gap) {
                    if (data[(y * off.width + x) * 4 + 3] > 120)
                        targets.push({ x, y });
                }
            }
            particles = targets.map((t) => ({
                x: Math.random() * w,
                y: Math.random() * h,
                tx: t.x,
                ty: t.y,
                vx: 0,
                vy: 0,
                s: 1 + Math.random() * 1.7,
                a: 0.3 + Math.random() * 0.7,
                ph: Math.random() * Math.PI * 2,
            }));
            text.classList.add('hero__title-text--hidden');
            canvas.classList.add('is-live');
            canvas.setAttribute('data-particles', String(particles.length));
            if (!raf)
                raf = requestAnimationFrame(tick);
        };
        const tick = (now) => {
            ctx.clearRect(0, 0, w, h);
            for (const p of particles) {
                /* spring toward the glyph target (assembly) */
                p.vx += (p.tx - p.x) * SPRING;
                p.vy += (p.ty - p.y) * SPRING;
                /* cursor repulsion (dispersion) with distance falloff */
                if (mouse.inside) {
                    const dx = p.x - mouse.x;
                    const dy = p.y - mouse.y;
                    const d = Math.sqrt(dx * dx + dy * dy);
                    if (d < radius && d > 0.01) {
                        const f = (1 - d / radius) * FORCE;
                        p.vx += (dx / d) * f;
                        p.vy += (dy / d) * f;
                    }
                }
                p.vx *= DAMP;
                p.vy *= DAMP;
                p.x += p.vx;
                p.y += p.vy;
                const tw = 1 + Math.sin(now / 320 + p.ph) * 0.25; // twinkle
                ctx.globalAlpha = p.a;
                ctx.fillStyle = NEON;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.s * tw, 0, Math.PI * 2);
                ctx.fill();
            }
            raf = requestAnimationFrame(tick);
        };
        hero.addEventListener('mousemove', (e) => {
            const r = canvas.getBoundingClientRect();
            mouse.x = e.clientX - r.left;
            mouse.y = e.clientY - r.top;
            mouse.inside = true;
        });
        hero.addEventListener('mouseleave', () => {
            mouse.inside = false;
            mouse.x = -9999;
            mouse.y = -9999;
        });
        /* Wait for the webfonts: sampling must use the real font metrics */
        if (document.fonts && document.fonts.ready) {
            document.fonts.ready.then(build);
        }
        else {
            build();
        }
        window.addEventListener('resize', build);
    };
    initHeroParticles();
    /* ——— GSAP experience (homepage only) ——— */
    const gsap = win.gsap;
    const ScrollTrigger = win.ScrollTrigger;
    if (gsap && ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        /* ——— Lenis smooth scroll ——— */
        if (typeof win.Lenis !== 'undefined') {
            /* Duration-based smoothing: starts moving on the first wheel tick
               (no startup lag) and keeps a natural momentum, independent of
               frame rate. Native scroll-behavior is kept at `auto` in CSS so
               the two smoothing engines don't fight each other. */
            lenis = new win.Lenis({
                duration: 1.15,
                easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: true,
            });
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => lenis.raf(time * 1000));
        }
        /* ——— Smooth scroll for anchor links (through Lenis when available) ——— */
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', (e) => {
                const href = e.currentTarget.getAttribute('href');
                if (!href || href === '#')
                    return;
                const target = document.querySelector(href);
                if (!target)
                    return;
                e.preventDefault();
                if (lenis) {
                    lenis.scrollTo(target, { offset: 0 });
                }
                else {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
        /* ——— Scroll progress bar ——— */
        const progress = document.getElementById('scroll-progress');
        if (progress) {
            gsap.set(progress, { transformOrigin: 'left center', scaleX: 0 });
            ScrollTrigger.create({
                trigger: document.documentElement,
                start: 'top top',
                end: 'bottom bottom',
                onUpdate: (self) => gsap.set(progress, { scaleX: self.progress }),
            });
        }
        /* ——— Nav background on scroll ——— */
        const nav = document.getElementById('main-nav');
        ScrollTrigger.create({
            trigger: document.documentElement,
            start: 80,
            end: 999999,
            onUpdate: (self) => {
                if (!nav)
                    return;
                nav.classList.toggle('nav--scrolled', self.scroll() > 60);
            },
        });
        /* ——— Hero intro timeline (the title itself is drawn by the particle
           constellation — initHeroParticles) ——— */
        const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });
        heroTl
            .from('.hero__tech-meta', { y: 24, opacity: 0, duration: 0.8 }, 0.1)
            .from('.hero__greeting', { y: 24, opacity: 0, duration: 0.7 }, 0.25)
            .from('.hero__tagline', { y: 24, opacity: 0, duration: 0.8 }, 0.95)
            .from('.hero__sub', { y: 24, opacity: 0, duration: 0.8 }, 1.05);
        /* ——— Hero parallax fade-out on scroll ——— */
        const heroContent = document.querySelector('.hero__content');
        if (heroContent) {
            gsap.to(heroContent, {
                yPercent: 16,
                opacity: 0.15,
                ease: 'none',
                scrollTrigger: {
                    trigger: '.hero',
                    start: 'top top',
                    end: 'bottom top',
                    scrub: true,
                },
            });
        }
        /* ——— Reveal-on-scroll elements ——— */
        gsap.utils.toArray('.reveal').forEach((el) => {
            gsap.from(el, {
                y: 48,
                opacity: 0,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 85%' },
            });
        });
        /* ——— Split-title word reveals (sobre mí / proyectos / contacto) ——— */
        gsap.utils.toArray('.split-title').forEach((title) => {
            const words = title.querySelectorAll('.tw');
            if (words.length === 0)
                return;
            gsap.from(words, {
                yPercent: 110,
                opacity: 0,
                duration: 0.9,
                stagger: 0.06,
                ease: 'power4.out',
                scrollTrigger: { trigger: title, start: 'top 85%' },
            });
        });
        /* ——— About story: one phrase at a time (pinned narrative) ———
           Each phrase fades in from below while the previous one fades out
           above, so scrolling reads as a sequence instead of a static list. */
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        const story = document.querySelector('.about__story');
        const phrases = story ? gsap.utils.toArray('.about__phrase') : [];
        if (story && phrases.length > 1 && !prefersReducedMotion) {
            const storyTl = gsap.timeline({
                scrollTrigger: {
                    trigger: story,
                    start: 'top top',
                    end: `+=${(phrases.length - 1) * 75}%`,
                    scrub: 1,
                    pin: true,
                    anticipatePin: 1,
                },
            });
            phrases.slice(1).forEach((ph, i) => {
                const prev = phrases[i];
                const pos = i; // one timeline unit per phrase swap
                storyTl
                    .set(ph, { visibility: 'visible' }, pos + 0.05)
                    .to(prev, { opacity: 0, yPercent: -25, duration: 0.45 }, pos)
                    .fromTo(ph, { opacity: 0, yPercent: 25 }, { opacity: 1, yPercent: 0, duration: 0.45 }, pos + 0.15);
            });
        }
        /* ——— Refresh trigger positions once media has loaded ——— */
        window.addEventListener('load', () => ScrollTrigger.refresh());
    }
    else {
        /* ——— No GSAP: keep native smooth-scroll behavior for anchors ——— */
        document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', (e) => {
                const href = e.currentTarget.getAttribute('href');
                if (!href)
                    return;
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });
    }
    /* ——— Contact modal + Web3Forms form (works with or without GSAP) ——— */
    const modal = document.getElementById('contact-modal');
    const modalForm = document.getElementById('contact-form');
    const contactBtn = document.getElementById('contact-btn');
    const openModal = () => {
        if (!modal)
            return;
        modal.classList.add('modal--open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        if (lenis)
            lenis.stop();
    };
    const closeModal = () => {
        if (!modal)
            return;
        modal.classList.remove('modal--open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        if (lenis)
            lenis.start();
    };
    if (modal && contactBtn) {
        contactBtn.addEventListener('click', (e) => {
            e.preventDefault();
            openModal();
        });
        modal.querySelectorAll('[data-modal-close]').forEach((el) => {
            el.addEventListener('click', () => closeModal());
        });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.classList.contains('modal--open')) {
                closeModal();
            }
        });
    }
    if (modalForm) {
        const accessKey = win.WEB3FORMS_ACCESS_KEY ?? '';
        const statusEl = modalForm.querySelector('.modal__status');
        const configured = accessKey.length > 0 && !accessKey.startsWith('PEGA_AQUI');
        modalForm.addEventListener('submit', (e) => {
            e.preventDefault();
            if (!statusEl)
                return;
            const fd = new FormData(modalForm);
            const name = String(fd.get('name') ?? '').trim();
            const email = String(fd.get('email') ?? '').trim();
            const message = String(fd.get('message') ?? '').trim();
            if (!name || !email || !message) {
                statusEl.textContent = 'Rellena todos los campos, por favor.';
                return;
            }
            if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
                statusEl.textContent = 'Escribe un email válido.';
                return;
            }
            if (!configured) {
                statusEl.textContent =
                    'El formulario aún no está conectado. Escríbeme a edward.15.holanda@gmail.com';
                return;
            }
            statusEl.textContent = 'Enviando...';
            const botcheck = String(fd.get('botcheck') ?? '');
            fetch('https://api.web3forms.com/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    access_key: accessKey,
                    subject: 'Nuevo mensaje desde el portfolio',
                    from_name: name,
                    replyto: email,
                    email,
                    message,
                    botcheck,
                }),
            })
                .then((res) => res.json())
                .then((data) => {
                if (!data || data.success !== true) {
                    throw new Error('Web3Forms rejected the submission');
                }
                statusEl.textContent = '¡Mensaje enviado! Te responderé pronto.';
                modalForm.reset();
                window.setTimeout(closeModal, 1800);
            })
                .catch(() => {
                statusEl.textContent =
                    'No se pudo enviar. Inténtalo de nuevo o escríbeme por email.';
            });
        });
    }
})();
//# sourceMappingURL=main.js.map