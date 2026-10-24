# Ashlee Alaniz — Art × Systems

A graphic, image-led portfolio with a curated homepage, all 55 archived works,
discipline filters, and an accessible image/video viewer. Plain HTML, CSS, and
JavaScript. No package manager, framework, or build step.

## Preview

Run `python -m http.server 8000 --bind localhost` in this folder and open
<http://localhost:8000>. You can also open `index.html` directly.

## Make it yours

| File | What to edit |
| --- | --- |
| `projects.js` | Project titles, descriptions, images, links, categories, and ordering |
| `index.html` | Introduction, availability, biography, email, and static headings |
| `styles.css` | Colors and spacing in the first `:root` block; layouts below |
| `app.js` | Filters and artwork viewer behavior; usually no need to touch |

### Choose the homepage work

At the top of `projects.js`, `selected` is the ordered list of project IDs shown
on the homepage. Move IDs to reorder the work. Add or remove IDs to change the
selection. The `hero` ID controls the large featured image, title, and category.
Add an `alt` field to its project for a more descriptive image label. The banner
is cropped; `heroPosition` (for example `"50% 60%"`) sets its focal point.
The gallery and expanded viewer continue to show the complete artwork.

### Add or edit a project

Copy an object in the `projects` array in `projects.js`, separated by a comma:

```js
{
  "id": "my-new-project",
  "title": "My new project",
  "category": "concept-art",
  "description": "My role, process, and context.",
  "image": "./assets/my-project.webp",
  "fullImage": "./assets/my-project-full.webp",
  "alt": "A short description of the artwork",
  "link": "https://example.com/project"
}
```

Use a unique permanent ID. Category must match an ID in `categories`.
`fullImage`, `alt`, and `link` are optional. Add `"video": "YOUTUBE_VIDEO_ID"`
to show a video instead of a full-size image. Add the ID to `selected` if you
want it on the curated homepage. All work and category counts update automatically.

Put new public images in `assets/` and commit that folder. Keep paths relative
so they work under GitHub Pages' `/portfolio/` path. Existing artworks use optimized, self-hosted WebP copies in `assets/work/`,
so images do not depend on the old Portfoliobox site. Local video previews live in
`assets/videos/`; hosted videos use YouTube’s privacy-enhanced player and load
only when a project is opened.

Some untitled works have descriptive editorial labels or numbered study labels.

## Publish on GitHub Pages

In GitHub, choose **Settings → Pages → Source → GitHub Actions**. Commit and push
to `main`. The deployment workflow publishes `index.html`, `styles.css`,
`projects.js`, `app.js`, and an optional `assets/` folder. No secrets are needed.
You can also run the workflow manually from the Actions tab.

## Browser cache

The deployment workflow versions the CSS and JavaScript URLs with the commit SHA,
so visitors receive matching files after each update. Keep the `?v=...` query
strings on the asset references in `index.html`. For an already-open page with
stale styles, press Ctrl+Shift+R once to reload all files.

## Writing style

Use Art × Systems as the primary visual identity and Let’s Make Something as
the contact call to action. Keep supporting copy factual
and concise: role, discipline, responsibilities, process, tools, and availability.
Let typography, layout, imagery, and the 3d signature provide personality. Avoid
repeated slogans, promotional claims, and invented studio or department labels.
Preserve original artwork titles.

## Typography

Space Grotesk is used for headings, body copy, and the wordmark. IBM Plex Mono
is used for metadata and the 3d signature. Both families are self-hosted in
`assets/fonts/`, with their open licenses. Edit `--sans` and `--mono` in
`styles.css` to change the pairing.

## Headline hover effect

Hover an individual character in Art × Systems to trigger a timed font sequence.
It starts after 100 ms, changes quickly, then slows down and restores the original
font after 1,200 ms. Each character completes independently, including after the
pointer moves away. Hovering again during a sequence does not restart it.
Character widths stay fixed to prevent layout shifts. The effect is disabled on
touch-only devices and for reduced-motion preferences. Edit `timing` and the
`fonts` list inside `setupHeadlineGlitch()` in `app.js` to adjust it.

Use title case for artwork and project names, sentence case for interface labels,
headings, and role descriptions. Preserve official names, acronyms, and the
intentional lowercase ashlee3dee / 3d branding. Uppercase display treatments
are controlled in CSS.

## Adaptive gallery

The gallery groups images into justified rows using each image’s aspect ratio.
Portraits get narrower tiles; landscapes get wider tiles. Images are never
cropped. Row breaks update automatically when filtering or resizing, with a
single column on narrow screens. `imageWidth` and `imageHeight` reserve space
before images load; new images without these fields are measured on load.
Adjust `targetHeight` and `maxPerRow` in `layoutProjects()` in `app.js` to tune
the tiling. Project order remains the order in `projects.js`.

## Computational geometry

The Computational geometry work tab presents the A3D toolkit's straight skeleton
and wavefront offset as a single video panel with a title and paragraph. It is
hidden on Selected, All work, and the other discipline tabs. Add future studies
as sibling articles inside `#geometry`. Videos in `assets/geometry/` are rendered from the actual
Geometry Nodes outputs, with a gray input boundary, red active wavefront, and
black vertex traces. Native controls support pausing and seeking; the overview
starts on first visibility unless reduced motion is requested.

`scripts/render-geometry.py` builds only the required source groups in a fresh
Blender session. Adjust its `TOOLKIT` path to regenerate from another checkout:

```powershell
& '<blender.exe>' --factory-startup -b --python scripts/render-geometry.py
```

It writes PNG frames, evaluated geometry JSON, and an inspection `.blend` under
ignored `.media-tools/geometry/`, without editing the toolkit or its build.
The published clips use H.264, yuv420p, and fast-start MP4. The overview is 144
frames at 24 fps, with frame 70 used for the poster. The render is a presentation
study, not a benchmark.
