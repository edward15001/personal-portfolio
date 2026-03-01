/**
 * Portfolio — Main TypeScript
 * Handles scroll-based fade-in animations and smooth navigation.
 */

(() => {
    /* ——— Fade-in on scroll via IntersectionObserver ——— */
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

    /* ——— Nav background on scroll ——— */
    const nav = document.getElementById('main-nav');

    const handleNavScroll = (): void => {
        if (!nav) return;
        if (window.scrollY > 60) {
            nav.style.background = 'rgba(10, 10, 10, 0.85)';
        } else {
            nav.style.background = 'rgba(10, 10, 10, 0.55)';
        }
    };

    window.addEventListener('scroll', handleNavScroll, { passive: true });

    /* ——— Smooth scroll for anchor links ——— */
    document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e: Event) => {
            e.preventDefault();
            const href = (e.currentTarget as HTMLAnchorElement).getAttribute('href');
            if (!href) return;
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });

    /* ——— Subtle parallax on hero title ——— */
    const heroTitle = document.querySelector<HTMLElement>('.glass-text');

    const handleParallax = (): void => {
        if (!heroTitle) return;
        const scrollY = window.scrollY;
        const offset = scrollY * 0.25;
        heroTitle.style.transform = `translateY(${offset}px)`;
        heroTitle.style.opacity = `${Math.max(1 - scrollY / 600, 0)}`;
    };

    window.addEventListener('scroll', handleParallax, { passive: true });
})();
