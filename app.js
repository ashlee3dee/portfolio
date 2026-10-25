/* Portfolio rendering and viewer controls. */
(() => {
  const data = window.PORTFOLIO;
  const pauseStudies = PortfolioUI.setupStudies();
  const grid = document.querySelector('#project-grid');
  const dialog = document.querySelector('#project-dialog');
  const media = document.querySelector('#dialog-media');
  const all = data.projects;
  const projectsById = new Map(all.map(project => [project.id, project]));
  const categoriesById = new Map(data.categories.map(category => [category.id, category.name]));
  const stopImageMark = PortfolioUI.setupEffects();
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
  const hero = projectsById.get(data.hero);
  const heroImg = document.querySelector('#hero-image');
  heroImg.src = imageURL(hero, true);
  heroImg.style.objectPosition = data.heroPosition || '50% 50%';
  if (hero.imageWidth && hero.imageHeight) { heroImg.width = hero.imageWidth; heroImg.height = hero.imageHeight; }
  heroImg.alt = hero.alt || hero.title;
  document.querySelector('#hero-project').setAttribute('aria-label', `View ${hero.title}`);
  document.querySelector('#feature-title').textContent = hero.title;
  document.querySelector('#feature-type').textContent = categoriesById.get(hero.category);
  heroImg.addEventListener('error', () => { heroImg.src = hero.fullImage || hero.image; }, { once: true });
  document.querySelector('#hero-project').addEventListener('click', () => openProject(hero.id));
  const filters = [{ id: 'selected', label: 'Selected' }, { id: 'all', label: 'All work' }, ...data.categories.map(c => ({ id: c.id, label: c.name })), { id: 'computational-geometry', label: 'Computational geometry' }];
  for (const item of filters) {
    const button = document.createElement('button');
    button.className = 'filter'; button.textContent = item.label; button.dataset.filter = item.id;
    button.addEventListener('click', () => { filter = item.id; render(); });
    document.querySelector('#filters').append(button);
  }
  const { layoutProjects, scheduleLayout } = PortfolioUI.setupGalleryLayout(grid);

  function render() {
    stopImageMark();
    const geometryActive = filter === 'computational-geometry';
    document.querySelector('#geometry').hidden = !geometryActive;
    grid.hidden = geometryActive;
    for (const button of document.querySelectorAll('.filter')) button.setAttribute('aria-pressed', String(button.dataset.filter === filter));
    document.querySelector('.archive-action').hidden = geometryActive;
    const sectionTitle = filter === 'selected' ? 'Selected work' : filters.find(item => item.id === filter).label;
    const workTitle = document.querySelector('#work-title');
    const period = document.createElement('span');
    period.className = 'red';
    period.textContent = '.';
    workTitle.replaceChildren(sectionTitle, period);
    if (!geometryActive) pauseStudies();
    if (geometryActive) {
      visible = [];
      const studies = document.querySelectorAll('.geometry-study').length;
      document.querySelector('#result-count').textContent = `${String(studies).padStart(2, '0')} / Studies`;
      return;
    }
    visible = filter === 'selected' ? data.selected.map(id => projectsById.get(id)).filter(Boolean) : all.filter(p => filter === 'all' || p.category === filter);
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
      const category = document.createElement('p'); category.className = 'mono'; category.textContent = categoriesById.get(project.category);
      const number = document.createElement('span'); number.className = 'mono'; number.textContent = String(all.indexOf(project) + 1).padStart(2, '0');
      text.append(title, category); caption.append(text, number); button.append(imageWrap, caption);
      button.addEventListener('click', () => openProject(project.id)); article.append(button); grid.append(article);
    }
    layoutProjects();
    document.querySelector('#result-count').textContent = `${String(visible.length).padStart(2, '0')} / ${all.length} works`;
    document.querySelector('#archive-toggle').innerHTML = filter === 'selected' ? 'View all work <sup class="dimension-mark" aria-hidden="true">3d</sup>' : 'Back to selected work <sup class="dimension-mark" aria-hidden="true">3d</sup>';
  }
  function openProject(id) {
    viewerProjects = visible.some(p => p.id === id) ? visible : [projectsById.get(id), ...visible];
    activeIndex = viewerProjects.findIndex(p => p.id === id);
    updateDialog();
    if (!dialog.open) dialog.showModal();
  }
  function updateDialog() {
    const project = viewerProjects[activeIndex];
    media.replaceChildren();
    document.querySelector('#dialog-title').textContent = project.title;
    document.querySelector('#dialog-subtitle').textContent = project.description || '';
    document.querySelector('#dialog-category').textContent = categoriesById.get(project.category);
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
