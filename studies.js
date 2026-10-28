/* Study video playback. */
window.PortfolioUI = window.PortfolioUI || {};
PortfolioUI.setupStudies = function () {
  const reels = [...document.querySelectorAll('.reel-video')];
  reels.forEach(reel => reel.addEventListener('play', () => {
    reels.forEach(other => { if (other !== reel) other.pause(); });
  }));
  const reelObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (!entry.isIntersecting) entry.target.pause(); });
  });
  reels.forEach(reel => reelObserver.observe(reel));
  const geometryVideos = [...document.querySelectorAll('.geometry-video')];
  if (!matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const videoObserver = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.play().catch(() => {});
          videoObserver.unobserve(entry.target);
        }
      }
    }, { threshold: 0.35 });
    geometryVideos.forEach(video => videoObserver.observe(video));
  }
  const pause = () => geometryVideos.forEach(video => video.pause());
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      pause();
      reels.forEach(reel => reel.pause());
    }
  });
  return pause;
};
