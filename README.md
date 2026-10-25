# Build the site

The site uses plain HTML, CSS, and JavaScript. No dependencies or compilation are required.

## Run locally

Install Python 3, clone this repository, and run from the repository folder:

```sh
python -m http.server 8000 --bind localhost
```

Open [localhost:8000](http://localhost:8000).

## Customize

- Edit `projects.js` for artwork, categories, and the selected project order.
- Edit `index.html` for page content and `styles.css` for appearance.
- Put images, videos, and fonts in `assets/`. Use relative asset paths.

## Publish

Upload `index.html`, `styles.css`, all root JavaScript files, and `assets/` to a static web host.

For GitHub Pages, set **Settings → Pages → Source → GitHub Actions**, then push to `main`. The included workflow packages and deploys the site automatically.
