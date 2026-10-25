/* Glyph-driven flow field and pointer waves. */
(() => {
  const canvas = document.querySelector('.flow-canvas');
  const hero = canvas?.closest('.hero');
  const ctx = canvas?.getContext('2d');
  if (!ctx || !hero) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const pointer = { x: -1000, y: -1000 };
  let previousPointer = null;
  let rings = [];
  let width = 0, height = 0, cols = 0, rows = 0, field = [];
  let frame = 0, last = 0, time = 0, visible = false;
  const spacing = 15;
  const heading = hero.querySelector('#hero-title');
  function textInfluence() {
    const mask = document.createElement('canvas');
    // Rasterize glyphs at their displayed positions.
    const scale = 2;
    mask.width = Math.ceil(width / scale); mask.height = Math.ceil(height / scale);
    const paint = mask.getContext('2d', { willReadFrequently: true });
    if (!paint || !heading) return () => 0;
    paint.scale(1 / scale, 1 / scale);
    paint.fillStyle = '#fff';
    const origin = hero.getBoundingClientRect();
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.closest('.glitch-glyph, .hero-cross')) continue;
      const style = getComputedStyle(node.parentElement);
      const size = parseFloat(style.fontSize);
      paint.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      paint.textBaseline = 'alphabetic';
      let offset = 0;
      for (const character of node.textContent) {
        const range = document.createRange();
        range.setStart(node, offset); offset += character.length; range.setEnd(node, offset);
        const rect = range.getBoundingClientRect();
        const baseline = rect.top - origin.top + (rect.height - size) / 2 + size * .8;
        paint.fillText(character, rect.left - origin.left, baseline);
      }
    }
    // Blur the mask to extend glyph influence.
    const soft = document.createElement('canvas');
    soft.width = mask.width; soft.height = mask.height;
    const blur = soft.getContext('2d', { willReadFrequently: true });
    if (!blur) return () => 0;
    blur.filter = 'blur(12px)'; blur.drawImage(mask, 0, 0);
    const pixels = blur.getImageData(0, 0, soft.width, soft.height).data;
    return (x, y) => {
      const col = Math.max(0, Math.min(soft.width - 1, Math.round(x / scale)));
      const row = Math.max(0, Math.min(soft.height - 1, Math.round(y / scale)));
      return pixels[(row * soft.width + col) * 4 + 3] / 255;
    };
  }
  function build() {
    cols = Math.ceil(width / spacing) + 1;
    rows = Math.ceil(height / spacing) + 1;
    const ink = textInfluence();
    // Blend glyph gradients with ambient contours.
    const sample = (x, y) => ink(x, y) * 12 + .3 * (Math.sin(x * .012 + Math.sin(y * .009) * 1.7) +
      .65 * Math.cos(y * .016 - x * .004) + .3 * Math.sin((x + y) * .021));
    field = Array.from({ length: cols * rows }, (_, i) => {
      const x = i % cols * spacing, y = Math.floor(i / cols) * spacing;
      const gx = sample(x + spacing, y) - sample(x - spacing, y);
      const gy = sample(x, y + spacing) - sample(x, y - spacing);
      const magnitude = Math.hypot(gx, gy) || 1;
      return { x, y, tx: -gy / magnitude, ty: gx / magnitude, magnitude, response: 0,
        trail: 0, trailX: 1, trailY: 0 };
    });
    // Edge tangent flow refinement: nearby, similarly oriented tangents
    // reinforce each other without cancelling opposite vector directions.
    for (let pass = 0; pass < 3; pass++) {
      const smoothed = field.map((p, i) => {
        let tx = 0, ty = 0;
        const col = i % cols, row = Math.floor(i / cols);
        for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
          if (col + dx < 0 || col + dx >= cols || row + dy < 0 || row + dy >= rows) continue;
          const q = field[(row + dy) * cols + col + dx];
          const dot = p.tx * q.tx + p.ty * q.ty;
          const weight = Math.abs(dot) * (.25 + q.magnitude) / (1 + dx * dx + dy * dy);
          const sign = dot < 0 ? -1 : 1;
          tx += q.tx * weight * sign; ty += q.ty * weight * sign;
        }
        const length = Math.hypot(tx, ty) || 1;
        return { ...p, tx: tx / length, ty: ty / length };
      });
      field = smoothed;
    }
  }
  function draw(delta = 0) {
    rings = reduced.matches ? [] : rings.filter(ring => time - ring.born < 2.2);
    ctx.clearRect(0, 0, width, height);
    ctx.lineWidth = 1;
    ctx.lineCap = 'square';
    for (const p of field) {
      p.trail = reduced.matches ? 0 : p.trail * Math.exp(-delta * 1.15);
      const dx = p.x - pointer.x, dy = p.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      const target = reduced.matches ? 0 : Math.max(0, 1 - distance / 170) ** 2;
      p.response += (target - p.response) * (1 - Math.exp(-delta * 10));
      let vx = -dy / Math.max(distance, 1), vy = dx / Math.max(distance, 1);
      if (vx * p.tx + vy * p.ty < 0) { vx = -vx; vy = -vy; }
      const blend = p.response * .95;
      let tx = p.tx * (1 - blend) + vx * blend;
      let ty = p.ty * (1 - blend) + vy * blend;
      // Align cursor trails with tangent direction.
      const sign = tx * p.trailX + ty * p.trailY < 0 ? -1 : 1;
      const streak = p.trail * .9;
      tx = tx * (1 - streak) + p.trailX * sign * streak;
      ty = ty * (1 - streak) + p.trailY * sign * streak;
      let wave = 0;
      for (const ring of rings) {
        const age = time - ring.born;
        const rx = p.x - ring.x, ry = p.y - ring.y;
        const radius = Math.hypot(rx, ry);
        const band = Math.exp(-(((radius - age * 260) / 28) ** 2)) * (1 - age / 2.2);
        if (band > wave) {
          wave = band;
          // Align strokes with the wavefront.
          let wx = -ry / Math.max(radius, 1), wy = rx / Math.max(radius, 1);
          if (wx * tx + wy * ty < 0) { wx = -wx; wy = -wy; }
          tx = tx * (1 - band * .9) + wx * band * .9;
          ty = ty * (1 - band * .9) + wy * band * .9;
        }
      }
      const length = Math.hypot(tx, ty) || 1;
      const pulse = reduced.matches ? 0 : Math.sin(time * 1.3 + p.x * .009 + p.y * .012);
      const half = (3.5 + p.response * 3 + p.trail * 3 + wave * 5 + pulse * .5) / length;
      const highlight = Math.max(p.response, p.trail, wave);
      ctx.strokeStyle = `rgba(${highlight > .08 ? '237,48,36' : '100,101,94'},${.14 + highlight * .38})`;
      ctx.beginPath();
      ctx.moveTo(p.x - tx * half, p.y - ty * half);
      ctx.lineTo(p.x + tx * half, p.y + ty * half);
      ctx.stroke();
    }
  }
  function tick(now) {
    frame = 0;
    const delta = Math.min((now - (last || now)) / 1000, .05);
    last = now; time += delta; draw(delta);
    if (visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    if (reduced.matches) { field.forEach(p => { p.response = 0; }); draw(); }
    else if (visible && !document.hidden) frame = requestAnimationFrame(tick);
  }
  new ResizeObserver(() => {
    width = hero.clientWidth; height = hero.clientHeight;
    const scale = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * scale); canvas.height = Math.round(height * scale);
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
    build(); draw();
  }).observe(hero);
  new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(hero);
  hero.addEventListener('click', event => {
    if (reduced.matches || event.detail === 0) return;
    const rect = canvas.getBoundingClientRect();
    rings.push({ x: event.clientX - rect.left, y: event.clientY - rect.top, born: time });
    rings = rings.slice(-8);
  });
  hero.addEventListener('pointermove', event => {
    if (event.pointerType === 'touch') return;
    const rect = hero.getBoundingClientRect();
    pointer.x = event.clientX - rect.left; pointer.y = event.clientY - rect.top;
    if (!reduced.matches && previousPointer) {
      const dx = pointer.x - previousPointer.x, dy = pointer.y - previousPointer.y;
      const length = Math.hypot(dx, dy);
      if (length > 1) {
        for (const p of field) {
          const t = Math.max(0, Math.min(1, ((p.x - previousPointer.x) * dx +
            (p.y - previousPointer.y) * dy) / (length * length)));
          const distance = Math.hypot(p.x - previousPointer.x - t * dx,
            p.y - previousPointer.y - t * dy);
          const strength = Math.max(0, 1 - distance / 65) ** 2;
          if (strength > p.trail) {
            p.trail = strength; p.trailX = dx / length; p.trailY = dy / length;
          }
        }
      }
    }
    previousPointer = { x: pointer.x, y: pointer.y };
  });
  hero.addEventListener('pointerleave', () => {
    pointer.x = pointer.y = -1000;
    previousPointer = null;
  });
  reduced.addEventListener('change', sync);
  document.fonts.ready.then(() => { build(); draw(); });
  document.addEventListener('visibilitychange', sync);
})();
