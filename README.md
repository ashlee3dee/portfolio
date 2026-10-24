# Portfolio

A simple, responsive personal website built with plain HTML and CSS. No package
installation or build step is required.

## Clone and edit on your desktop

Install [Git](https://git-scm.com/) or use [GitHub Desktop](https://desktop.github.com/)
to clone `https://github.com/ashlee3dee/portfolio`.

```sh
git clone https://github.com/ashlee3dee/portfolio.git
cd portfolio
```

Open the folder in your preferred editor:

- Edit `index.html` to change your name, introduction, projects, and profile links.
- Edit `styles.css` to change colors, fonts, and layout.
- Copy a project `<article class="card">` to add another project.
- Keep local asset links relative (for example, `./styles.css`) so they also work
  under the GitHub Pages `/portfolio/` path.

Open `index.html` in a browser to preview it. Alternatively, if Python 3 is
installed, run this command from the repository folder:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Visit <http://localhost:8000>. Refresh the browser after editing; press Ctrl+C in
the terminal to stop the server.

## Enable automated deployment

1. In this repository on GitHub, open **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Commit and push your changes to `main` (or merge a pull request into `main`).
   The **Deploy website to GitHub Pages** workflow publishes the site automatically.
4. Open the **Actions** tab to follow the deployment. After it succeeds, visit
   <https://ashlee3dee.github.io/portfolio/>.

You can also use **Actions → Deploy website to GitHub Pages → Run workflow** to
deploy manually after enabling Pages. No deployment tokens or other secrets need
to be added. Only `index.html` and `styles.css` are published; add any future
images or other public assets to the workflow's **Prepare website** copy step.

For subsequent updates, commit and push using GitHub Desktop, or run:

```sh
git add index.html styles.css
git commit -m "Update portfolio"
git push origin main
```

If you fork or rename this repository, update the profile links in `index.html`
and the site URL above. If your default branch is not `main`, also update the
branch trigger in `.github/workflows/deploy.yml`.
