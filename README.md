# Art × Systems portfolio

The site is built from numbered folders. Edit the content sources, then run the
builder to generate a standalone static site. The existing single-page layout
remains Art × Systems → Reels → Work → About → Contact.

## Build and preview

Install Python 3.10+ and the image dependency once:

```sh
python -m pip install -r requirements.txt
```

Build:

```sh
python tools/build_site.py
```

On Windows, `build.bat` runs the same command using `py`.

Open `dist/index.html`, or serve the output:

```sh
python -m http.server 8000 --bind localhost --directory dist
```

The repository-root `index.html` is only a convenience link to the local build.
Upload **the contents of `dist/`** to your host, not the source repository.

The previous root files are retained in `.legacy-before-folder-build/` as a
reversible migration archive. The builder and deployment do not use that folder.

## Content structure

```text
content/
  site.json                       Name, role, email, site title
  pages/
    01-home/
      page.json                   Output filename and page title
      01-hero/section.json
      02-reels/
        section.json
        01-concept-art/
          item.json
          reel.mp4
          poster.webp
        02-technical-art/...
      03-work/
        section.json
        01-concept-art/
          category.json
          01-concept-art-study-01/
            project.json
            image.webp
            full_image.webp
        04-tool-development/...
        07-computational-geometry/...
      04-about/section.json
      05-contact/section.json
theme/
  templates/                      Reusable HTML layout
  static/                         CSS, JavaScript, fonts and licenses
tools/build_site.py               Builder
dist/                             Generated HTML, data, and media (ignored)
```

Number prefixes control order at every level. Rename `02-reels` to `04-reels`
to move the section; renaming does not change IDs stored in JSON. Use unique
prefixes for predictable ordering. Folders beginning with `_` or `.` are ignored.

## Add a project

1. Create a numbered folder inside the desired Work category, such as
   `content/pages/01-home/03-work/04-tool-development/05-new-tool/`.
2. Drop an image into it. JPG, PNG, WebP, GIF, TIFF, and BMP are supported.
3. Run `python tools/build_site.py --init` to create missing metadata.
4. Edit the generated `project.json` title, description, and alt text. Set
   `selected` to a positive number to include it in the curated selection.
5. Run `python tools/build_site.py` again.

Sources stay untouched. The builder creates appropriately sized WebP images,
records dimensions, copies video, and emits only media referenced by metadata.
For videos, supply a poster image and an MP4 or WebM; there is no video encoding
step. See [CONTENT_GUIDE.md](CONTENT_GUIDE.md) for complete metadata examples,
reels, studies, new pages, and custom sections.

## Validation

```sh
python tools/build_site.py --check
python -m unittest discover -s tests -v
```

Build errors report missing media, invalid metadata, duplicate IDs, unsafe paths,
and broken internal links. A failed build leaves the previous output intact.
Successful rebuilds remove stale generated assets. Never manually edit `dist/`.

## Publish

For GitHub Pages, set **Settings → Pages → Source → GitHub Actions**, then push
to `main`. The workflow installs Pillow, runs the builder tests, builds `_site/`,
and deploys it. Source content and build tools are excluded from the published site.

## Design

Edit `theme/static/styles.css` and `theme/static/layout.css` for appearance.
Major Mono Display is used for ART, Orbitron for SYSTEMS and headings, Barlow for
body text, and IBM Plex Mono for metadata. The fonts and licenses are self-hosted
under `theme/static/assets/fonts/`. Heart, cursor-field, and gallery interactions
live in `theme/static/` and remain part of every generated page.
