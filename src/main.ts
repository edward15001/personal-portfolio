/**
 * Portfolio — Main TypeScript
 * Scroll-driven experience: GSAP + ScrollTrigger + Lenis smooth scroll on the
 * homepage, with an IntersectionObserver fallback so detail pages (which don't
 * load the GSAP bundle) still get fade-in reveals. The contact modal works
 * regardless of whether GSAP loads.
 */

(() => {
    const win = window as unknown as { gsap?: any; ScrollTrigger?: any; Lenis?: any };
    let lenis: any = null;

    /* ——— Fade-in on scroll via IntersectionObserver (fallback / detail pages) ——— */
    const fadeElements = document.querySelectorAll<HTMLElement>('.fade-in');

    const observerOptions: IntersectionObserverInit = {
        root: null,
        rootMargin: '0px 0px -60px 0px',
        threshold: 0.15,
    };

    const onIntersect: IntersectionObserverCallback = (entries, observer) => {
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
    const splitLetters = (el: HTMLElement): void => {
        const text = el.textContent ?? '';
        el.textContent = '';
        [...text].forEach((ch) => {
            if (ch === ' ') {
                el.appendChild(document.createTextNode(' '));
            } else {
                const s = document.createElement('span');
                s.className = 'l';
                s.textContent = ch;
                el.appendChild(s);
            }
        });
    };

    document
        .querySelectorAll<HTMLElement>(
            '.tw--lift, .tw--dissolve, .tw--magnetic, .tw--glitch, .tw--weight, .tw--wave, .tw--tilt',
        )
        .forEach((el) => {
            splitLetters(el);
            /* Elevation keeps a left-to-right stagger; the cursor-driven
               effects must respond without per-letter delay. */
            if (el.classList.contains('tw--lift')) {
                el.querySelectorAll<HTMLElement>('.l').forEach((l, i) => {
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
    const initCursorEffects = (): void => {
        const modes = ['dissolve', 'magnetic', 'glitch', 'weight', 'wave', 'tilt', 'liquid'] as const;
        const selector = modes.map((m) => `.tw--${m}`).join(', ');
        const liquidFilter = document.getElementById('liquid');
        const turbulence = liquidFilter?.querySelector('feTurbulence') ?? null;
        const displacement = liquidFilter?.querySelector('feDisplacementMap') ?? null;

        document.querySelectorAll<HTMLElement>(selector).forEach((word) => {
            const mode = (modes.find((m) => word.classList.contains(`tw--${m}`)) ?? 'dissolve') as (typeof modes)[number];
            const fontPx = parseFloat(getComputedStyle(word).fontSize) || 32;
            const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#7ee08f';

            /* ——— Liquid: word-level SVG displacement (no letter split needed) ———
               The word always carries filter: url(#liquid); on hover the JS
               eases the displacement scale up (with per-frame noise jitter =
               "bubbling") and back down to 0 on exit. */
            if (mode === 'liquid') {
                if (!turbulence || !displacement) return;
                const liquidRadius = fontPx * 3;
                let currentScale = 0;
                let targetScale = 0;
                let liquidRaf = 0;
                const tick = (time: number): void => {
                    currentScale += (targetScale - currentScale) * 0.1;
                    if (Math.abs(currentScale) < 0.05 && Math.abs(targetScale) < 0.05) {
                        displacement.setAttribute('scale', '0');
                        liquidRaf = 0;
                        return;
                    }
                    if (currentScale > 0.4) {
                        /* bubbling: shift the noise pattern every frame */
                        turbulence.setAttribute(
                            'baseFrequency',
                            `${(0.012 + Math.random() * 0.012).toFixed(4)} ${(0.02 + Math.random() * 0.02).toFixed(4)}`,
                        );
                    }
                    const osc = 1 + Math.sin(time / 260) * 0.18;
                    displacement.setAttribute('scale', String(Math.max(0, currentScale * osc)));
                    liquidRaf = requestAnimationFrame(tick);
                };
                const setIntensity = (int: number): void => {
                    targetScale = int * 16;
                    if (!liquidRaf) liquidRaf = requestAnimationFrame(tick);
                };
                word.addEventListener('mousemove', (e: MouseEvent) => {
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

            const letters = Array.from(word.querySelectorAll<HTMLElement>('.l'));
            if (letters.length === 0) return;
            const radius = fontPx * 2.6;

            const apply = (clientX: number, clientY: number): void => {
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

            const reset = (): void => {
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
                word.addEventListener('mouseenter', (e: MouseEvent) => {
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
            } else {
                word.addEventListener('mousemove', (e: MouseEvent) => apply(e.clientX, e.clientY));
                word.addEventListener('mouseleave', reset);
            }
        });
    };

    initCursorEffects();

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
                easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
                smoothWheel: true,
            });
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time: number) => lenis.raf(time * 1000));
        }

        /* ——— Smooth scroll for anchor links (through Lenis when available) ——— */
        document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', (e: Event) => {
                const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
                if (!href || href === '#') return;
                const target = document.querySelector(href);
                if (!target) return;
                e.preventDefault();
                if (lenis) {
                    lenis.scrollTo(target as Element, { offset: 0 });
                } else {
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
                onUpdate: (self: { progress: number }) => gsap.set(progress, { scaleX: self.progress }),
            });
        }

        /* ——— Nav background on scroll ——— */
        const nav = document.getElementById('main-nav');
        ScrollTrigger.create({
            trigger: document.documentElement,
            start: 80,
            end: 999999,
            onUpdate: (self: { scroll: () => number }) => {
                if (!nav) return;
                nav.classList.toggle('nav--scrolled', self.scroll() > 60);
            },
        });

        /* ——— Hero intro timeline (the title itself is a cursor-driven
           magnetic word handled by initCursorEffects) ——— */
        const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });
        heroTl
            .from('.hero__tech-meta', { y: 24, opacity: 0, duration: 0.8 }, 0.1)
            .from('.hero__greeting', { y: 24, opacity: 0, duration: 0.7 }, 0.25)
            .from('.hero__tagline', { y: 24, opacity: 0, duration: 0.8 }, 0.95)
            .from('.hero__sub', { y: 24, opacity: 0, duration: 0.8 }, 1.05)
            .from('.hero__cta', { y: 24, opacity: 0, duration: 0.8 }, 1.15)
            .from('.hero__cue', { opacity: 0, duration: 0.6 }, 1.5);

        /* ——— Hero parallax fade-out on scroll ——— */
        const heroContent = document.querySelector<HTMLElement>('.hero__content');
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
        (gsap.utils.toArray('.reveal') as HTMLElement[]).forEach((el) => {
            gsap.from(el, {
                y: 48,
                opacity: 0,
                duration: 1,
                ease: 'power3.out',
                scrollTrigger: { trigger: el, start: 'top 85%' },
            });
        });

        /* ——— Split-title word reveals (sobre mí / proyectos / contacto) ——— */
        (gsap.utils.toArray('.split-title') as HTMLElement[]).forEach((title) => {
            const words = title.querySelectorAll<HTMLElement>('.tw');
            if (words.length === 0) return;
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
        const story = document.querySelector<HTMLElement>('.about__story');
        const phrases = story ? (gsap.utils.toArray('.about__phrase') as HTMLElement[]) : [];
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

        /* ——— Stacked project cards (GSAP pin, like lunchbox.io) ———
           The .stack-pin gets pinned while each card slides up from below
           (yPercent 100 → 0) covering the previous one, like a deck being
           revealed. Cards only become absolutely positioned when GSAP is
           available; otherwise they stay in a normal vertical flow. */
        const pinWrap = document.querySelector<HTMLElement>('.stack-pin');
        const stackCards = pinWrap ? (gsap.utils.toArray('.stack-card') as HTMLElement[]) : [];
        if (pinWrap && stackCards.length > 1 && !prefersReducedMotion) {
            gsap.set(pinWrap, { height: '100vh' });
            gsap.set(stackCards, { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', margin: 0 });
            gsap.set(stackCards.slice(1), { yPercent: 100 });
            const stackTl = gsap.timeline({
                scrollTrigger: {
                    trigger: pinWrap,
                    start: 'top top',
                    end: `+=${(stackCards.length - 1) * 80}%`,
                    scrub: 1,
                    pin: true,
                    anticipatePin: 1,
                },
            });
            stackCards.slice(1).forEach((card, i) => {
                stackTl.fromTo(card, { yPercent: 100 }, { yPercent: 0, ease: 'none', duration: 1 }, i);
            });
        }

        /* ——— Refresh trigger positions once media has loaded ——— */
        window.addEventListener('load', () => ScrollTrigger.refresh());
        window.addEventListener('load', () => ScrollTrigger.refresh());
    } else {
        /* ——— No GSAP: keep native smooth-scroll behavior for anchors ——— */
        document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
            anchor.addEventListener('click', (e: Event) => {
                const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
                if (!href) return;
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

    const openModal = (): void => {
        if (!modal) return;
        modal.classList.add('modal--open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        if (lenis) lenis.stop();
    };

    const closeModal = (): void => {
        if (!modal) return;
        modal.classList.remove('modal--open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('modal-open');
        if (lenis) lenis.start();
    };

    if (modal && contactBtn) {
        contactBtn.addEventListener('click', (e: Event) => {
            e.preventDefault();
            openModal();
        });

        modal.querySelectorAll('[data-modal-close]').forEach((el) => {
            el.addEventListener('click', () => closeModal());
        });

        document.addEventListener('keydown', (e: KeyboardEvent) => {
            if (e.key === 'Escape' && modal.classList.contains('modal--open')) {
                closeModal();
            }
        });
    }

    if (modalForm) {
        const accessKey = (win as { WEB3FORMS_ACCESS_KEY?: string }).WEB3FORMS_ACCESS_KEY ?? '';
        const statusEl = modalForm.querySelector<HTMLElement>('.modal__status');
        const configured = accessKey.length > 0 && !accessKey.startsWith('PEGA_AQUI');

        modalForm.addEventListener('submit', (e: Event) => {
            e.preventDefault();
            if (!statusEl) return;

            const fd = new FormData(modalForm as HTMLFormElement);
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
                .then((res: Response) => res.json())
                .then((data: { success?: boolean }) => {
                    if (!data || data.success !== true) {
                        throw new Error('Web3Forms rejected the submission');
                    }
                    statusEl.textContent = '¡Mensaje enviado! Te responderé pronto.';
                    (modalForm as HTMLFormElement).reset();
                    window.setTimeout(closeModal, 1800);
                })
                .catch(() => {
                    statusEl.textContent =
                        'No se pudo enviar. Inténtalo de nuevo o escríbeme por email.';
                });
        });
    }
})();
