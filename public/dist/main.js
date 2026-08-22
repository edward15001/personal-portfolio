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
    /* ——— GSAP experience (homepage only) ——— */
    const gsap = win.gsap;
    const ScrollTrigger = win.ScrollTrigger;
    if (gsap && ScrollTrigger) {
        gsap.registerPlugin(ScrollTrigger);
        /* ——— Lenis smooth scroll ——— */
        if (typeof win.Lenis !== 'undefined') {
            lenis = new win.Lenis({ lerp: 0.12, smoothWheel: true });
            lenis.on('scroll', ScrollTrigger.update);
            gsap.ticker.add((time) => lenis.raf(time * 1000));
            gsap.ticker.lagSmoothing(0);
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
        /* ——— Hero intro timeline ——— */
        const heroLetters = gsap.utils.toArray('.hero__letter');
        const heroTl = gsap.timeline({ defaults: { ease: 'power4.out' } });
        heroTl
            .from('.hero__tech-meta', { y: 24, opacity: 0, duration: 0.8 }, 0.1)
            .from('.hero__greeting', { y: 24, opacity: 0, duration: 0.7 }, 0.25)
            .from(heroLetters, { yPercent: 120, opacity: 0, duration: 1.1, stagger: 0.07 }, 0.35)
            .from('.hero__tagline', { y: 24, opacity: 0, duration: 0.8 }, 0.95)
            .from('.hero__sub', { y: 24, opacity: 0, duration: 0.8 }, 1.05)
            .from('.hero__cta', { y: 24, opacity: 0, duration: 0.8 }, 1.15)
            .from('.hero__cue', { opacity: 0, duration: 0.6 }, 1.5);
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
        /* ——— Animated counters ——— */
        gsap.utils.toArray('.counter').forEach((el) => {
            const end = Number(el.dataset.count ?? 0);
            const obj = { v: 0 };
            gsap.to(obj, {
                v: end,
                duration: 1.6,
                ease: 'power2.out',
                onUpdate: () => {
                    el.textContent = String(Math.round(obj.v));
                },
                scrollTrigger: { trigger: el, start: 'top 85%', once: true },
            });
        });
        /* ——— Project showcase: pinned full-screen sections, varied per item ———
           scrub: 1 smooths the pin animation so sections reveal progressively
           instead of snapping; direction/scale alternate so no two projects
           animate the same way. */
        gsap.utils.toArray('.showcase-item').forEach((item, i) => {
            const even = i % 2 === 1;
            const content = item.querySelector('.showcase-item__content');
            const media = item.querySelector('.showcase-item__media');
            const num = item.querySelector('.showcase-item__num');
            const img = media?.querySelector('img') ?? null;
            const parts = [
                item.querySelector('.showcase-item__title'),
                item.querySelector('.showcase-item__desc'),
                item.querySelector('.showcase-item__meta'),
                item.querySelector('.showcase-item__link'),
            ].filter((el) => el !== null);
            if (content) {
                gsap.fromTo(content, { xPercent: even ? 8 : -8, opacity: 0 }, {
                    xPercent: 0,
                    opacity: 1,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: item,
                        start: 'top top',
                        end: '+=120%',
                        scrub: 1,
                        pin: true,
                        anticipatePin: 1,
                    },
                });
            }
            if (parts.length > 0) {
                gsap.fromTo(parts, { yPercent: 44, opacity: 0 }, {
                    yPercent: 0,
                    opacity: 1,
                    stagger: 0.14,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: item,
                        start: 'top top',
                        end: '+=95%',
                        scrub: 1,
                    },
                });
            }
            if (img) {
                gsap.fromTo(img, { scale: even ? 1.22 : 1.12, xPercent: even ? 4 : -4 }, {
                    scale: 1,
                    xPercent: 0,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: item,
                        start: 'top bottom',
                        end: 'bottom top',
                        scrub: 1,
                    },
                });
            }
            if (num) {
                gsap.fromTo(num, { opacity: 0.08, xPercent: even ? 14 : -14 }, {
                    opacity: 0.9,
                    xPercent: 0,
                    ease: 'none',
                    scrollTrigger: {
                        trigger: item,
                        start: 'top 95%',
                        end: 'top top',
                        scrub: 1,
                    },
                });
            }
        });
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