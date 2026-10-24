/* Layout and interactions. Edit projects.js to maintain portfolio content. */
(() => {
  const data = window.PORTFOLIO;
  // Start the overview once it is visible. Native controls retain pause/seeking.
  const geometryVideo = document.querySelector('.geometry-video');
  if (geometryVideo && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const videoObserver = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) {
        geometryVideo.play().catch(() => {});
        videoObserver.disconnect();
      }
    }, { threshold: 0.35 });
    videoObserver.observe(geometryVideo);
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) geometryVideo.pause();
    });
  }
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
    const prefix = full && project.fullImage ? 'fullImage' : 'image';
    if (project[prefix + 'Width'] && project[prefix + 'Height']) {
      img.width = project[prefix + 'Width'];
      img.height = project[prefix + 'Height'];
    }
    img.src = imageURL(project, full);
    img.addEventListener('error', () => { img.src = full ? project.fullImage || project.image : project.image; }, { once: true });
    return img;
  }
  const hero = all.find(p => p.id === data.hero);
  const heroImg = document.querySelector('#hero-image');
  heroImg.src = imageURL(hero, true);
  heroImg.style.objectPosition = data.heroPosition || '50% 50%';
  if (hero.imageWidth && hero.imageHeight) { heroImg.width = hero.imageWidth; heroImg.height = hero.imageHeight; }
  heroImg.alt = hero.alt || hero.title;
  document.querySelector('#hero-project').setAttribute('aria-label', `View ${hero.title}`);
  document.querySelector('#feature-title').textContent = hero.title;
  document.querySelector('#feature-type').textContent = data.categories.find(c => c.id === hero.category).name;
  heroImg.addEventListener('error', () => { heroImg.src = hero.fullImage || hero.image; }, { once: true });
  document.querySelector('#hero-project').addEventListener('click', () => openProject(hero.id));
  const filters = [{ id: 'selected', label: 'Selected' }, { id: 'all', label: 'All work' }, ...data.categories.map(c => ({ id: c.id, label: c.name })), { id: 'computational-geometry', label: 'Computational geometry' }];
  for (const item of filters) {
    const button = document.createElement('button');
    button.className = 'filter'; button.textContent = item.label; button.dataset.filter = item.id;
    button.addEventListener('click', () => { filter = item.id; render(); });
    document.querySelector('#filters').append(button);
  }
  // Justified rows: group images by aspect ratio, then give each row a shared
  // image height. DOM order stays unchanged for keyboard and screen-reader users.
  function layoutProjects() {
    const tiles = [...grid.children];
    const width = Math.floor(grid.getBoundingClientRect().width);
    const gap = parseFloat(getComputedStyle(grid).columnGap) || 22;
    if (!width || !tiles.length) return;
    if (width < 560) {
      for (const tile of tiles) tile.style.setProperty('--tile-width', '100%');
      return;
    }
    const ratios = tiles.map(tile => Number(tile.dataset.ratio) || 1.5);
    const targetHeight = Math.max(220, Math.min(340, width * 0.25));
    const maxPerRow = Math.max(2, Math.min(5, Math.floor(width / 200)));
    const costs = Array(tiles.length + 1).fill(Infinity);
    const breaks = Array(tiles.length);
    costs[tiles.length] = 0;
    // Choose row breaks that avoid extreme heights and tiny, unreadable tiles.
    for (let start = tiles.length - 1; start >= 0; start--) {
      let ratioSum = 0;
      for (let count = 1; count <= maxPerRow && start + count <= tiles.length; count++) {
        ratioSum += ratios[start + count - 1];
        const end = start + count;
        const idealHeight = (width - gap * (count - 1)) / ratioSum;
        const last = end === tiles.length;
        const height = last ? Math.min(idealHeight, targetHeight * 1.15) : idealHeight;
        let cost = Math.log(height / targetHeight) ** 2;
        if (count === 1 && tiles.length > 1) cost += 0.65;
        if (height > targetHeight * 1.6) cost += 4;
        for (let index = start; index < end; index++) {
          if (ratios[index] * height < 170) cost += 1;
        }
        if (last) cost += (1 - (height * ratioSum + gap * (count - 1)) / width) * 0.6;
        cost += costs[end];
        if (cost < costs[start]) { costs[start] = cost; breaks[start] = { end, height }; }
      }
    }
    for (let start = 0; start < tiles.length;) {
      const row = breaks[start];
      for (let index = start; index < row.end; index++) {
        // Round downward so fractional pixels cannot push the last tile to a new row.
        const tileWidth = Math.floor(ratios[index] * row.height * 100) / 100;
        tiles[index].style.setProperty('--tile-width', `${tileWidth}px`);
      }
      start = row.end;
    }
  }
  let layoutFrame = 0;
  function scheduleLayout() {
    cancelAnimationFrame(layoutFrame);
    layoutFrame = requestAnimationFrame(layoutProjects);
  }
  new ResizeObserver(scheduleLayout).observe(grid);
  document.fonts.ready.then(scheduleLayout);
  function render() {
    stopImageMark();
    const geometryActive = filter === 'computational-geometry';
    document.querySelector('#geometry').hidden = !geometryActive;
    grid.hidden = geometryActive;
    document.querySelector('.archive-action').hidden = geometryActive;
    const sectionTitle = filter === 'selected' ? 'Selected work' : filters.find(item => item.id === filter).label;
    const workTitle = document.querySelector('#work-title');
    const period = document.createElement('span');
    period.className = 'red';
    period.textContent = '.';
    workTitle.replaceChildren(sectionTitle, period);
    if (!geometryActive) geometryVideo?.pause();
    if (geometryActive) {
      visible = [];
      for (const button of document.querySelectorAll('.filter')) button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
      document.querySelector('#result-count').textContent = '01 / Study';
      return;
    }
    visible = filter === 'selected' ? data.selected.map(id => all.find(p => p.id === id)).filter(Boolean) : all.filter(p => filter === 'all' || p.category === filter);
    for (const button of document.querySelectorAll('.filter')) button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
    grid.replaceChildren();
    for (const project of visible) {
      const article = document.createElement('article'); article.className = 'project';
      article.dataset.ratio = project.imageWidth && project.imageHeight ? project.imageWidth / project.imageHeight : 1.5;
      const button = document.createElement('button'); button.className = 'project-button'; button.setAttribute('aria-label', `View ${project.title}`);
      const imageWrap = document.createElement('div'); imageWrap.className = 'project-image';
      const img = imageElement(project); img.loading = 'lazy'; img.decoding = 'async';
      img.addEventListener('load', () => {
        if (img.naturalWidth && img.naturalHeight) {
          article.dataset.ratio = img.naturalWidth / img.naturalHeight;
          scheduleLayout();
        }
      });
      imageWrap.append(img);
      const arrow = document.createElement('span');
      arrow.className = 'project-zoom';
      arrow.setAttribute('aria-hidden', 'true');
      const mark = document.createElement('span');
      mark.className = 'image-mark';
      mark.textContent = '×';
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
    layoutProjects();
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
  // One delegated hover handler also covers tiles recreated by category filters.
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
