/* ========== Timeline Interactivity ========== */
(function initTimeline() {
  const section  = document.getElementById('timeline-sec');
  const container = document.getElementById('timeline-container');
  const progress  = document.getElementById('timeline-progress');
  if (!section || !container || !progress) return;

  /* Inject SVG gradient */
  const svg = progress.ownerSVGElement;
  if (svg) {
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    defs.innerHTML = `
      <linearGradient id="timeline-grad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%"   stop-color="#c084fc"/>
        <stop offset="40%"  stop-color="#f43f5e"/>
        <stop offset="100%" stop-color="#38bdf8"/>
      </linearGradient>`;
    svg.insertBefore(defs, svg.firstChild);
  }

  /* Path length for dash animation */
  let pathLen = progress.getTotalLength();
  progress.style.strokeDasharray  = pathLen;
  progress.style.strokeDashoffset = pathLen;

  function tick() {
    const rect   = section.getBoundingClientRect();
    const vh     = window.innerHeight;
    const scroll = -(rect.top - vh * 0.4);
    const max    = rect.height - vh * 0.4;
    const t      = Math.max(0, Math.min(1, scroll / (max || 1)));

    /* Draw progress line */
    progress.style.strokeDashoffset = pathLen - t * pathLen;

    /* Pivot threshold (~35 % = around node 5) */
    if (t >= 0.35) {
      container.style.transform = 'translateX(200px)';
      section.classList.add('state-blue');
    } else {
      container.style.transform = 'translateX(0)';
      section.classList.remove('state-blue');
    }
  }

  window.addEventListener('scroll', tick, { passive: true });
  window.addEventListener('resize', () => {
    pathLen = progress.getTotalLength();
    progress.style.strokeDasharray = pathLen;
    tick();
  });
  tick();
})();
