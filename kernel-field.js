(() => {
  const canvas = document.getElementById('kernelField');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = { x: -1000, y: -1000, active: false };
  const pulses = [];
  let width = 0, height = 0, scale = 1, frame = 0, last = 0;
  let fibers = [], motes = [], palette = {};
  let seed = 731;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const readColor = (name, fallback) => getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
  const refreshPalette = () => {
    palette = { cyan: readColor('--cyan', '#21e6ff'), pink: readColor('--pink', '#ff2f9f'), purple: readColor('--purple', '#b36bff'), acid: readColor('--acid', '#c3ff00') };
  };
  const resize = () => {
    width = innerWidth; height = innerHeight; scale = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    canvas.style.width = `${width}px`; canvas.style.height = `${height}px`;
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    refreshPalette();
    seed = 731; const count = Math.min(105, Math.max(38, Math.round(width / 13)));
    fibers = Array.from({ length: count }, (_, i) => ({ x: rand() * width, y: rand() * height, phase: rand() * Math.PI * 2, length: 42 + rand() * 120, hue: [palette.cyan, palette.purple, palette.pink, palette.acid][i % 4], speed: .12 + rand() * .24 }));
    motes = Array.from({ length: Math.min(90, Math.max(24, Math.round(width / 18))) }, () => ({ x: rand() * width, y: rand() * height, z: rand(), phase: rand() * 9, hue: [palette.cyan, palette.pink, palette.purple][Math.floor(rand() * 3)] }));
  };
  const field = (x, y, t) => {
    const nx = x / Math.max(width, 1), ny = y / Math.max(height, 1);
    let a = Math.sin(ny * 8 + t * .16) * .62 + Math.cos(nx * 7 - t * .11) * .45 + Math.sin((nx + ny) * 12 + t * .08) * .22;
    const dx = x - pointer.x, dy = y - pointer.y, distance = Math.hypot(dx, dy);
    if (pointer.active && distance < 260) a += Math.atan2(dy, dx) * Math.exp(-distance / 105) * 1.4;
    for (const pulse of pulses) { const d = Math.hypot(x - pulse.x, y - pulse.y) - pulse.r; a += Math.exp(-(d * d) / 1800) * .42; }
    return a;
  };
  const drawFiber = (fiber, t) => {
    let x = fiber.x, y = fiber.y; const points = [[x, y]], steps = 18, step = fiber.length / steps;
    for (let n = 0; n < steps; n++) { const angle = field(x, y, t + fiber.phase); x += Math.cos(angle) * step; y += Math.sin(angle) * step; points.push([x, y]); }
    ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
    for (let n = 1; n < points.length; n++) ctx.lineTo(points[n][0], points[n][1]);
    ctx.strokeStyle = fiber.hue; ctx.globalAlpha = .12; ctx.lineWidth = .8; ctx.shadowColor = fiber.hue; ctx.shadowBlur = 7; ctx.stroke();
    const p = points[Math.floor((Math.sin(t * fiber.speed + fiber.phase) * .5 + .5) * (points.length - 1))];
    ctx.beginPath(); ctx.arc(p[0], p[1], 1.1, 0, Math.PI * 2); ctx.globalAlpha = .64; ctx.fillStyle = fiber.hue; ctx.shadowBlur = 9; ctx.fill();
  };
  const draw = time => {
    if (document.hidden || reduced.matches) { frame = 0; return; }
    if (time - last < 32) { frame = requestAnimationFrame(draw); return; }
    last = time; const t = time * .001;
    ctx.clearRect(0, 0, width, height); ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    for (const fiber of fibers) drawFiber(fiber, t);
    for (const mote of motes) {
      const a = field(mote.x, mote.y, t + mote.phase), speed = .13 + mote.z * .35;
      mote.x += Math.cos(a) * speed; mote.y += Math.sin(a) * speed;
      if (mote.x < -4) mote.x = width + 4; if (mote.x > width + 4) mote.x = -4;
      if (mote.y < -4) mote.y = height + 4; if (mote.y > height + 4) mote.y = -4;
      ctx.fillStyle = mote.hue; ctx.globalAlpha = .12 + mote.z * .35; ctx.shadowColor = mote.hue; ctx.shadowBlur = 8;
      ctx.fillRect(mote.x, mote.y, 1 + mote.z * 1.5, 1 + mote.z * 1.5);
    }
    ctx.globalAlpha = 1; ctx.shadowBlur = 0;
    for (const pulse of pulses) {
      pulse.r += 2.2; pulse.life -= .012; ctx.beginPath(); ctx.arc(pulse.x, pulse.y, pulse.r, 0, Math.PI * 2);
      ctx.strokeStyle = pulse.color; ctx.globalAlpha = Math.max(0, pulse.life) * .45; ctx.lineWidth = 1; ctx.shadowColor = pulse.color; ctx.shadowBlur = 12; ctx.stroke();
    }
    for (let i = pulses.length - 1; i >= 0; i--) if (pulses[i].life <= 0) pulses.splice(i, 1);
    ctx.globalAlpha = 1; ctx.shadowBlur = 0; frame = requestAnimationFrame(draw);
  };
  const start = () => { if (!reduced.matches && !document.hidden && !frame) frame = requestAnimationFrame(draw); else if (reduced.matches) { ctx.clearRect(0, 0, width, height); frame = 0; } };
  const move = event => { pointer.x = event.clientX; pointer.y = event.clientY; pointer.active = true; };
  addEventListener('resize', resize, { passive: true });
  addEventListener('pointermove', move, { passive: true });
  addEventListener('pointerleave', () => { pointer.active = false; }, { passive: true });
  addEventListener('pointerdown', event => { pulses.push({ x: event.clientX, y: event.clientY, r: 4, life: 1, color: palette.cyan }); if (pulses.length > 5) pulses.shift(); }, { passive: true });
  document.addEventListener('visibilitychange', start);
  reduced.addEventListener?.('change', start);
  new MutationObserver(refreshPalette).observe(document.documentElement, { attributes: true, attributeFilter: ['style'] });
  resize(); start();
})();
