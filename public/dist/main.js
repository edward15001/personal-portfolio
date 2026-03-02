"use strict";
/**
 * Portfolio — Main TypeScript
 * Handles scroll-based fade-in animations and smooth navigation.
 */
(() => {
    /* ——— Fade-in on scroll via IntersectionObserver ——— */
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
    /* ——— Nav background on scroll ——— */
    const nav = document.getElementById('main-nav');
    const handleNavScroll = () => {
        if (!nav)
            return;
        if (window.scrollY > 60) {
            nav.style.background = 'rgba(10, 10, 10, 0.85)';
        }
        else {
            nav.style.background = 'rgba(10, 10, 10, 0.55)';
        }
    };
    window.addEventListener('scroll', handleNavScroll, { passive: true });
    /* ——— Smooth scroll for anchor links ——— */
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', (e) => {
            e.preventDefault();
            const href = e.currentTarget.getAttribute('href');
            if (!href)
                return;
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
    /* ——— Subtle parallax on hero content ——— */
    const heroContent = document.querySelector('.hero__content');
    const handleParallax = () => {
        if (!heroContent)
            return;
        const scrollY = window.scrollY;
        const offset = scrollY * 0.25;
        heroContent.style.transform = `translateY(${offset}px)`;
        heroContent.style.opacity = `${Math.max(1 - scrollY / 600, 0)}`;
    };
    window.addEventListener('scroll', handleParallax, { passive: true });
})();
//# sourceMappingURL=main.js.map