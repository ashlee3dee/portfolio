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
  document.querySelector('#year').textContent = new Date().getFullYear();
  render();
})();
