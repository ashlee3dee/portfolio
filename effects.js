/* Image, headline, and heart animations. */
window.PortfolioUI = window.PortfolioUI || {};
PortfolioUI.setupEffects = function () {
  // Delegate hover events across gallery updates.
  const markMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let activeMark = null;
  function stopImageMark() {
    if (!activeMark) return;
    clearInterval(activeMark.timer);
    activeMark = null;
  }
  document.addEventListener('pointerover', event => {
    const container = event.target.closest('.project-image, .feature-button');
    const mark = container?.querySelector('.image-mark');
    if (!mark || markMotion.matches || event.pointerType === 'touch' || activeMark?.element === mark) return;
    stopImageMark();
    const fonts = ['"IBM Plex Mono", monospace', 'Georgia, serif', 'Impact, sans-serif',
      '"Times New Roman", serif', '"Trebuchet MS", sans-serif', '"Space Grotesk", sans-serif'];
    let last = fonts.length - 1;
    function changeFont() {
      last = (last + 1 + Math.floor(Math.random() * (fonts.length - 1))) % fonts.length;
      mark.style.fontFamily = fonts[last];
    }
    changeFont();
    activeMark = { element: mark, container, timer: setInterval(changeFont, 110) };
  });
  document.addEventListener('pointerout', event => {
    if (activeMark && activeMark.container.contains(event.target) &&
        !activeMark.container.contains(event.relatedTarget)) stopImageMark();
  });
  window.addEventListener('blur', stopImageMark);
  window.addEventListener('pagehide', stopImageMark);
  markMotion.addEventListener('change', stopImageMark);

  // Preserve glyph widths during font changes.
  function setupHeadlineGlitch() {
    const heading = document.querySelector('#hero-title');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const canHover = matchMedia('(hover: hover) and (pointer: fine)');
    const fonts = ['"IBM Plex Mono", monospace', 'Arial, sans-serif',
      'Georgia, serif', 'Impact, sans-serif', '"Times New Roman", serif',
      '"Trebuchet MS", sans-serif', '"Space Grotesk", sans-serif'];
    // Each letter runs its own sequence in milliseconds.
    const timing = { delay: 100, duration: 1200, fastest: 45, slowest: 260 };
    const active = new Map();
    function resetGlyph(glyph) {
      const state = active.get(glyph);
      if (!state) return;
      clearTimeout(state.tick);
      clearTimeout(state.finish);
      glyph.style.fontFamily = '';
      active.delete(glyph);
    }
    function stop() {
      for (const glyph of active.keys()) resetGlyph(glyph);
    }
    function trigger(glyph) {
      if (reduceMotion.matches || !canHover.matches || active.has(glyph)) return;
      const state = { tick: null, finish: null, lastFont: fonts.length - 1 };
      active.set(glyph, state);
      state.tick = setTimeout(() => {
        const start = performance.now();
        state.finish = setTimeout(() => resetGlyph(glyph), timing.duration);
        function switchFont() {
          const elapsed = performance.now() - start;
          if (elapsed >= timing.duration) { resetGlyph(glyph); return; }
          // Avoid consecutive font repeats.
          const next = (state.lastFont + 1 + Math.floor(Math.random() * (fonts.length - 1))) % fonts.length;
          state.lastFont = next;
          glyph.style.fontFamily = fonts[next];
          const progress = elapsed / timing.duration;
          const interval = timing.fastest + (timing.slowest - timing.fastest) * progress ** 2;
          state.tick = setTimeout(switchFont, Math.min(interval, timing.duration - elapsed));
        }
        switchFont();
      }, timing.delay);
    }
    // Measure glyph widths before replacing text.
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const entries = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (node.parentElement.closest('.hero-cross')) continue;
      const size = parseFloat(getComputedStyle(node.parentElement).fontSize);
      const characters = Array.from(node.textContent);
      let offset = 0;
      const widths = characters.map(character => {
        const range = document.createRange();
        range.setStart(node, offset);
        offset += character.length;
        range.setEnd(node, offset);
        return range.getBoundingClientRect().width / size;
      });
      entries.push({ node, characters, widths });
    }
    heading.setAttribute('aria-label', 'Art × Systems');
    for (const { node, characters, widths } of entries) {
      const fragment = document.createDocumentFragment();
      characters.forEach((character, index) => {
        const cell = document.createElement('span');
        cell.className = 'glitch-character';
        cell.style.width = `${widths[index]}em`;
        cell.setAttribute('aria-hidden', 'true');
        const original = document.createElement('span');
        original.className = 'glitch-original';
        original.textContent = character;
        const glyph = document.createElement('span');
        glyph.className = 'glitch-glyph';
        glyph.textContent = character;
        cell.append(original, glyph);
        cell.addEventListener('pointerenter', () => trigger(glyph));
        cell.addEventListener('pointercancel', () => resetGlyph(glyph));
        fragment.append(cell);
      });
      node.replaceWith(fragment);
    }
    window.addEventListener('blur', stop);
    window.addEventListener('pagehide', stop);
    reduceMotion.addEventListener('change', stop);
    canHover.addEventListener('change', stop);
  }
  document.fonts.ready.then(setupHeadlineGlitch);
  const heartButton = document.querySelector('.hero-cross');
  const heartSymbol = heartButton?.querySelector('.hero-cross-symbol');
  let heartPulse;
  heartButton?.addEventListener('click', () => {
    if (!heartSymbol || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    heartPulse?.cancel();
    heartPulse = heartSymbol.animate([
      { transform: 'scale(1)' },
      { transform: 'scale(1.2)', offset: .25 },
      { transform: 'scale(.95)', offset: .55 },
      { transform: 'scale(1)' }
    ], { duration: 600, easing: 'cubic-bezier(.22,1,.36,1)' });
    heartButton.querySelectorAll('.heart-wave').forEach(wave => wave.remove());
    for (let i = 0; i < 3; i++) {
      const wave = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      wave.setAttribute('viewBox', '0 0 100 100');
      wave.setAttribute('aria-hidden', 'true');
      wave.setAttribute('class', 'heart-wave');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', 'M50,23.1066 C45.85786,18.96446 40.42893,16.8934 35,16.8934 C29.57107,16.8934 24.14214,18.96446 20,23.1066 C15.85786,27.24874 13.7868,32.67767 13.7868,38.1066 C13.7868,43.53553 15.85786,48.96446 20,53.1066 C25,58.1066 30,63.1066 35,68.1066 C40,73.1066 45,78.1066 50,83.1066 C55,78.1066 60,73.1066 65,68.1066 C70,63.1066 75,58.1066 80,53.1066 C84.14214,48.96446 86.2132,43.53553 86.2132,38.1066 C86.2132,32.67767 84.14214,27.24874 80,23.1066 C75.85786,18.96446 70.42893,16.8934 65,16.8934 C59.57107,16.8934 54.14214,18.96446 50,23.1066 Z');
      wave.append(path);
      heartButton.append(wave);
      const animation = wave.animate([
        { transform: 'scale(1)', opacity: .5 },
        { transform: 'scale(2.6)', opacity: 0 }
      ], { duration: 1200, delay: i * 160, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' });
      animation.onfinish = () => wave.remove();
    }
  });
  return stopImageMark;
};
