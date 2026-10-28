/* Responsive gallery layout. */
window.PortfolioUI = window.PortfolioUI || {};
PortfolioUI.setupGalleryLayout = function (grid) {
  // Justified rows preserve image ratios and document order.
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
    // Balance row heights and minimum tile widths.
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
        // Round down to prevent row overflow.
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
  return { layoutProjects, scheduleLayout };
};
