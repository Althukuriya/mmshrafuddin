// js/animations.js
// Additional animation effects
document.addEventListener('DOMContentLoaded', () => {
    // Parallax effect for hero
    window.addEventListener('scroll', () => {
        const hero = document.querySelector('.hero-banner-slider');
        if (hero) {
            const scrolled = window.pageYOffset;
            hero.style.transform = `translateY(${scrolled * 0.1}px)`;
        }
    });

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});