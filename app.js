/* Layout and interactions. Edit projects.js to maintain portfolio content. */
(() => {
  const data = window.PORTFOLIO;
  const grid = document.querySelector('#project-grid');
  const dialog = document.querySelector('#project-dialog');
  const media = document.querySelector('#dialog-media');
  const all = data.projects;
  let filter = 'selected';
  let visible = [];
  let activeIndex = 0;
  let viewerProjects = [];
  const local = ['localhost', '127.0.0.1', ''].includes(location.hostname);

  function imageURL(project, full = false) {
    const path = full ? project.localFull || project.localImage : project.localImage;
    return local && path ? path : (full ? project.fullImage || project.image : project.image);
  }
  function imageElement(project, full = false) {
    const img = document.createElement('img');
    img.alt = project.alt || project.title;
    img.src = imageURL(project, full);
    img.addEventListener('error', () => { img.src = full ? project.fullImage || project.image : project.image; }, { once: true });
    return img;
  }
  const hero = all.find(p => p.id === data.hero);
  const heroImg = document.querySelector('#hero-image');
  heroImg.src = imageURL(hero);
  heroImg.alt = hero.alt || hero.title;
  document.querySelector('#hero-project').setAttribute('aria-label', `View ${hero.title}`);
  document.querySelector('#feature-title').textContent = hero.title;
  document.querySelector('#feature-type').textContent = data.categories.find(c => c.id === hero.category).name;
  heroImg.addEventListener('error', () => { heroImg.src = hero.image; }, { once: true });
  document.querySelector('#hero-project').addEventListener('click', () => openProject(hero.id));
  const filters = [{ id: 'selected', label: 'Selected' }, { id: 'all', label: 'All work' }, ...data.categories.map(c => ({ id: c.id, label: c.name }))];
  for (const item of filters) {
    const button = document.createElement('button');
    button.className = 'filter'; button.textContent = item.label; button.dataset.filter = item.id;
    button.addEventListener('click', () => { filter = item.id; render(); });
    document.querySelector('#filters').append(button);
  }
  function render() {
    visible = filter === 'selected' ? data.selected.map(id => all.find(p => p.id === id)).filter(Boolean) : all.filter(p => filter === 'all' || p.category === filter);
    for (const button of document.querySelectorAll('.filter')) button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
    grid.replaceChildren();
    for (const project of visible) {
      const article = document.createElement('article'); article.className = 'project';
      const button = document.createElement('button'); button.className = 'project-button'; button.setAttribute('aria-label', `View ${project.title}`);
      const imageWrap = document.createElement('div'); imageWrap.className = 'project-image';
      const img = imageElement(project); img.loading = 'lazy'; img.decoding = 'async'; imageWrap.append(img);
      const arrow = document.createElement('span');
      arrow.className = 'project-zoom';
      arrow.setAttribute('aria-hidden', 'true');
      const mark = document.createElement('sup');
      mark.className = 'dimension-mark';
      mark.textContent = '3d';
      arrow.append(mark);
      imageWrap.append(arrow);
      if (project.video) { const label = document.createElement('span'); label.className = 'media-label'; label.textContent = '▶ Motion'; imageWrap.append(label); }
      const caption = document.createElement('div'); caption.className = 'project-caption';
      const text = document.createElement('div'); const title = document.createElement('h3'); title.textContent = project.title;
      const category = document.createElement('p'); category.className = 'mono'; category.textContent = data.categories.find(c => c.id === project.category).name;
      const number = document.createElement('span'); number.className = 'mono'; number.textContent = String(all.indexOf(project) + 1).padStart(2, '0');
      text.append(title, category); caption.append(text, number); button.append(imageWrap, caption);
      button.addEventListener('click', () => openProject(project.id)); article.append(button); grid.append(article);
    }
    document.querySelector('#result-count').textContent = `${String(visible.length).padStart(2, '0')} / ${all.length} works`;
    document.querySelector('#archive-toggle').innerHTML = filter === 'selected' ? 'View all work <sup class="dimension-mark" aria-hidden="true">3d</sup>' : 'Back to selected work <sup class="dimension-mark" aria-hidden="true">3d</sup>';
  }
  function openProject(id) {
    viewerProjects = visible.some(p => p.id === id) ? visible : [all.find(p => p.id === id), ...visible];
    activeIndex = viewerProjects.findIndex(p => p.id === id);
    updateDialog();
    if (!dialog.open) dialog.showModal();
  }
  function updateDialog() {
    const project = viewerProjects[activeIndex];
    media.replaceChildren();
    document.querySelector('#dialog-title').textContent = project.title;
    document.querySelector('#dialog-subtitle').textContent = project.description || '';
    document.querySelector('#dialog-category').textContent = data.categories.find(c => c.id === project.category).name;
    document.querySelector('#dialog-position').textContent = `${activeIndex + 1} / ${viewerProjects.length}`;
    const link = document.querySelector('#dialog-external'); link.hidden = !project.link; if (project.link) link.href = project.link;
    if (project.video) {
      if (local && project.localVideo) {
        const video = document.createElement('video'); video.controls = true; video.playsInline = true; video.preload = 'metadata'; video.poster = imageURL(project); video.src = project.localVideo; media.append(video);
      } else {
        const iframe = document.createElement('iframe'); iframe.src = `https://www.youtube-nocookie.com/embed/${project.video}`; iframe.title = project.title; iframe.allow = 'fullscreen; picture-in-picture; encrypted-media'; iframe.allowFullscreen = true; media.append(iframe);
      }
    } else media.append(imageElement(project, true));
  }
  const changeProject = direction => { activeIndex = (activeIndex + direction + viewerProjects.length) % viewerProjects.length; updateDialog(); };
  document.querySelector('#previous-project').addEventListener('click', () => changeProject(-1));
  document.querySelector('#next-project').addEventListener('click', () => changeProject(1));
  document.querySelector('#dialog-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => media.replaceChildren());
  dialog.addEventListener('click', event => { if (event.target === dialog) { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close(); } });
  dialog.addEventListener('keydown', event => { if (event.target.tagName === 'VIDEO') return; if (event.key === 'ArrowRight') { event.preventDefault(); changeProject(1); } if (event.key === 'ArrowLeft') { event.preventDefault(); changeProject(-1); } });
  document.querySelector('#archive-toggle').addEventListener('click', () => { filter = filter === 'selected' ? 'all' : 'selected'; render(); document.querySelector('#work').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); });
  // Per-character font glitch. Invisible original glyphs keep the layout stable.
  function setupHeadlineGlitch() {
    const heading = document.querySelector('#hero-title');
    const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
    const canHover = matchMedia('(hover: hover) and (pointer: fine)');
    const fonts = ['"IBM Plex Mono", monospace', 'Arial, sans-serif',
      'Georgia, serif', 'Impact, sans-serif', '"Times New Roman", serif',
      '"Trebuchet MS", sans-serif', '"Space Grotesk", sans-serif'];
    // Timing in milliseconds. Each letter owns its sequence independently.
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
          // No repeats, including the original family on the first change.
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
    // Measure every original character before changing the DOM, retaining tracking.
    const walker = document.createTreeWalker(heading, NodeFilter.SHOW_TEXT);
    const entries = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
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
  document.querySelector('#year').textContent = new Date().getFullYear();
  render();
})();
