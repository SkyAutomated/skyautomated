// Header scroll effect
const header = document.getElementById('header');
window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 50);
});

// Mobile navigation toggle
const mobileToggle = document.getElementById('mobileToggle');
const navLinks = document.getElementById('navLinks');

mobileToggle.addEventListener('click', () => {
    mobileToggle.classList.toggle('active');
    navLinks.classList.toggle('open');
});

// Close mobile nav on link click
navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
        mobileToggle.classList.remove('active');
        navLinks.classList.remove('open');
    });
});

// Intersection Observer for scroll animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll('.animate-in').forEach(el => {
    observer.observe(el);
});

// Contact form submission
const contactForm = document.getElementById('contactForm');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btnText = contactForm.querySelector('.btn-text');
        const btnLoading = contactForm.querySelector('.btn-loading');
        const submitBtn = contactForm.querySelector('button[type="submit"]');

        btnText.style.display = 'none';
        btnLoading.style.display = 'inline-flex';
        submitBtn.disabled = true;

        try {
            const response = await fetch(contactForm.action, {
                method: 'POST',
                body: new FormData(contactForm),
                headers: { 'Accept': 'application/json' }
            });

            if (response.ok) {
                contactForm.classList.add('success');
                contactForm.innerHTML = `
                    <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
                        <circle cx="32" cy="32" r="28" stroke="#00d4ff" stroke-width="2"/>
                        <path d="M20 32l8 8 16-18" stroke="#00d4ff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <h3 style="margin-top:24px;font-size:1.5rem;">Message Sent!</h3>
                    <p style="color:rgba(255,255,255,0.7);margin-top:8px;">We'll get back to you within 24 hours.</p>
                `;
            } else {
                throw new Error('Form submission failed');
            }
        } catch (err) {
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
            submitBtn.disabled = false;
            alert('Something went wrong. Please try again or email us directly.');
        }
    });
}
