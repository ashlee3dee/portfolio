/* Apply the saved palette before styles load to avoid a light flash. */
(() => {
  const root = document.documentElement;
  const preference = matchMedia('(prefers-color-scheme: dark)');
  const key = 'art-systems-color-mode';
  let saved;
  try { saved = localStorage.getItem(key); } catch (_) { /* Storage may be disabled. */ }
  if (!['light', 'dark'].includes(saved)) saved = null;

  function apply(mode) {
    root.dataset.theme = mode;
    const dark = mode === 'dark';
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#191a18' : '#f1f0eb');
    document.querySelectorAll('.theme-toggle').forEach(button => {
      button.setAttribute('aria-pressed', String(dark));
    });
    root.dispatchEvent(new Event('color-mode-change'));
  }

  apply(saved || (preference.matches ? 'dark' : 'light'));
  preference.addEventListener('change', () => {
    if (!saved) apply(preference.matches ? 'dark' : 'light');
  });
  document.addEventListener('DOMContentLoaded', () => {
    apply(root.dataset.theme);
    document.querySelectorAll('.theme-toggle').forEach(button => {
      button.addEventListener('click', () => {
        saved = root.dataset.theme === 'dark' ? 'light' : 'dark';
        try { localStorage.setItem(key, saved); } catch (_) { /* Still works for this visit. */ }
        apply(saved);
      });
    });
  });
})();
