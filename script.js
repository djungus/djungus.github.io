/* ========== Ambient Background ========== */
(function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];

  function resize() {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x = Math.random() * w;
      this.y = Math.random() * h;
      this.r = Math.random() * 1.5 + 0.5;
      this.dx = (Math.random() - 0.5) * 0.3;
      this.dy = (Math.random() - 0.5) * 0.3;
      this.opacity = Math.random() * 0.5 + 0.1;
    }
    update() {
      this.x += this.dx;
      this.y += this.dy;
      if (this.x < 0 || this.x > w || this.y < 0 || this.y > h) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(124, 92, 252, ${this.opacity})`;
      ctx.fill();
    }
  }

  const count = Math.min(80, Math.floor(w * h / 15000));
  for (let i = 0; i < count; i++) particles.push(new Particle());

  function animate() {
    ctx.clearRect(0, 0, w, h);
    particles.forEach(p => { p.update(); p.draw(); });
    requestAnimationFrame(animate);
  }
  animate();
})();

/* ========== Navbar Scroll ========== */
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 50);
  });
}

/* ========== Mobile Menu ========== */
const toggle = document.getElementById('nav-toggle');
const mobileMenu = document.getElementById('mobile-menu');
if (toggle && mobileMenu) {
  toggle.addEventListener('click', () => mobileMenu.classList.toggle('open'));
  document.querySelectorAll('.mobile-link').forEach(link => {
    link.addEventListener('click', () => mobileMenu.classList.remove('open'));
  });
}

/* ========== Scroll Reveal ========== */
const revealEls = document.querySelectorAll('.section-header, .project-card, .code-card, .book-card, .contact-card, .landing-card');
revealEls.forEach(el => el.classList.add('reveal'));

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.1 });

revealEls.forEach(el => observer.observe(el));

/* ========== Smooth anchor scroll ========== */
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    e.preventDefault();
    const target = document.querySelector(a.getAttribute('href'));
    if (target) target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ========== Projects Page Timeline ========== */
(function initTimeline() {
  const section = document.getElementById('timeline-sec');
  const container = document.getElementById('timeline-container');
  const progressPath = document.getElementById('timeline-progress');
  if (!section || !container || !progressPath) return;

  // Initialize SVG path drawing length
  const pathLength = progressPath.getTotalLength();
  progressPath.style.strokeDasharray = pathLength;
  progressPath.style.strokeDashoffset = pathLength;

  // Dynamically inject an SVG gradient definition for the timeline progress line
  const svg = progressPath.ownerSVGElement;
  if (svg) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="timeline-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="var(--accent-2)" />
        <stop offset="40%" stop-color="#f43f5e" />
        <stop offset="100%" stop-color="var(--accent-3)" />
      </linearGradient>
    `;
    svg.insertBefore(defs, svg.firstChild);
  }

  function updateTimeline() {
    const rect = section.getBoundingClientRect();
    const sectionHeight = rect.height;
    const viewHeight = window.innerHeight;

    // Calculate scroll progress through the timeline section
    const sectionTopFromCenter = rect.top - (viewHeight * 0.4);
    const scrollDistance = -sectionTopFromCenter;
    const maxScroll = sectionHeight - (viewHeight * 0.4);

    let progress = Math.max(0, Math.min(1, scrollDistance / (maxScroll || 1)));

    // Update SVG progress line
    progressPath.style.strokeDashoffset = pathLength - (progress * pathLength);

    // Pivot at ~35% scroll depth (roughly at Node 5 position)
    const pivotThreshold = 0.35; 

    if (progress >= pivotThreshold) {
      // Shift container to the right by 200px to center the X=200 vertical track
      container.style.transform = 'translateX(200px)';
      section.classList.add('state-blue');
    } else {
      container.style.transform = 'translateX(0)';
      section.classList.remove('state-blue');
    }
  }

  window.addEventListener('scroll', updateTimeline);
  window.addEventListener('resize', () => {
    const newLength = progressPath.getTotalLength();
    progressPath.style.strokeDasharray = newLength;
    updateTimeline();
  });
  
  updateTimeline();

  // Highlight active nodes as they scroll near the viewport center
  const nodeItems = document.querySelectorAll('.timeline-node-item');
  const nodeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('active');
      } else {
        entry.target.classList.remove('active');
      }
    });
  }, {
    rootMargin: '-25% 0px -25% 0px',
    threshold: 0
  });

  nodeItems.forEach(node => nodeObserver.observe(node));
})();

