# Editing content

Edit files under `content/`, then run `python tools/build_site.py`. The complete
publishable website is generated in `dist/`. Sources are never modified by a
normal build. Do not edit generated HTML or JavaScript.

## Order and visibility

Number prefixes control order for pages, sections, categories, projects, reels,
and studies. `02-…` sorts before `10-…`; folders without prefixes sort afterward
alphabetically. Rename folders to reorder them. Keep the metadata `id` unchanged
to preserve anchors and project references. Use unique prefixes.

`"enabled": false` hides a page, section, category, or item without deleting it.
Folders beginning with `_` or `.` are ignored completely.

## Add a project

Create a numbered folder under an existing Work category. Drop media into it,
then run `python tools/build_site.py --init`. Missing `project.json` files are
created; existing metadata is never overwritten. Edit the scaffold and rebuild.

Example folder:

```text
content/pages/01-home/03-work/04-tool-development/05-lens-study/
  project.json
  cover.jpg
  render.png
  description.md       optional
```

Example `project.json`:

```json
{
  "id": "lens-study",
  "title": "Lens Study",
  "description": "The technical problem and how the tool addresses it.",
  "alt": "A scene showing lens distortion around the frame edges.",
  "image": "cover.jpg",
  "full_image": "render.png",
  "selected": 4,
  "link": "https://example.com/project"
}
```

Only `title` and `image` are required. An omitted ID is derived from the folder,
but explicit IDs are recommended. Paths are relative to this project folder;
subfolders such as `media/cover.jpg` work. Absolute paths and paths escaping the
folder are rejected.

| Field | Meaning |
| --- | --- |
| `full_image` | Optional larger source for the expanded viewer; defaults to `image` |
| `selected` | `false` excludes it from Selected; `true` uses folder order; a positive number specifies curated order |
| `video` | Local `clip.mp4` or `clip.webm`, played in the project viewer |
| `youtube` | Optional 11-character YouTube ID; local video takes precedence |
| `link` | External project URL for View project |
| `alt` | Meaningful description of the image; defaults to title |

If no projects are selected, Selected shows all projects. Category and All work
order always follow folders. The current selected projects have numbers that
preserve their existing curated order.

An optional `description.md` supplies plain-text paragraphs instead of the JSON
description. Markdown formatting characters are displayed as text; HTML is
escaped. JSON descriptions are also plain text.

The initializer prefers an image named `image`, `cover`, or `poster`, then the
first image alphabetically. With multiple images, review the generated `image`
field. Files named `full`, `full-image`, or `full_image` are recognized as the
expanded image. Video-only folders get a placeholder `poster.jpg` path: add a
poster or change the path before the build can succeed. The initializer also
runs a build, so a missing poster will be reported immediately.

## Images and video

JPG, PNG, WebP, GIF, TIFF, and BMP sources are accepted. The builder applies EXIF
orientation, creates WebP thumbnails fitting 1400 × 1400 and expanded images
fitting 2400 × 2400, and records their dimensions. Images are not upscaled.
Existing WebP files that already fit are copied without another lossy encode.
Animated images are copied intact. Original sources are never changed or deleted.

MP4 and WebM files are copied without encoding. Export browser-compatible video
(for example H.264 MP4) before adding it. Supply a still poster for video entries.

Only referenced media is emitted. Successful rebuilds remove stale generated
assets. Moving or renaming a source does not leave old copies in the output.

## Categories and studies

Create a numbered folder under a gallery section with `category.json`:

```json
{
  "id": "shader-tools",
  "title": "Shader tools",
  "type": "projects"
}
```

Projects inside it automatically receive this category, and its filter is
generated. IDs `selected` and `all` are reserved.

Use `"type": "studies"` for video studies. Its numbered children use `item.json`
and automatically use the existing study presentation. There is no hardcoded
Computational geometry category in the runtime anymore.

## Reels and study items

Each numbered child folder contains video, poster, and `item.json`:

```json
{
  "id": "technical-art",
  "title": "Technical Art",
  "description": "Technical explanation for a study; optional for reels.",
  "video": "reel.mp4",
  "poster": "poster.webp",
  "alt": "Technical art demo reel.",
  "duration": "00:40",
  "width": 1920,
  "height": 1080
}
```

`title`, `video`, and `poster` are required. Duration is an optional display
label, not an automatic measurement. Video dimensions default to the poster
dimensions; set them explicitly when their aspect ratios differ. `--init` also
scaffolds missing `item.json` files in reels and study folders.

## Sections

Each numbered section directly inside a page has `section.json`:

```json
{
  "type": "text",
  "id": "process",
  "title": "Process",
  "navigation": "Process",
  "paragraphs": ["First paragraph.", "Second paragraph."]
}
```

`navigation` adds a sidebar link. Omit it for sections without a link. Optional
`index` adds the small number beside that link. The existing section metadata
files are working examples of each main layout.

| Type | Sources |
| --- | --- |
| `hero` | Existing title and interactive canvas; `eyebrow`, `availability`, `heart_url` |
| `reels` | Numbered `item.json` folders; `title`, `eyebrow` |
| `gallery` | Numbered category folders; `title`, `eyebrow` |
| `about` | `title`, `name`, `eyebrow`, `paragraphs`, `toolkit`, `availability` |
| `contact` | `title`, `eyebrow`, `line_one`, `line_two`, `availability`; optional `email` |
| `text` | `title` and `paragraphs`, or `body.md` containing blank-line-separated plain-text paragraphs |
| `html` | Advanced: a `body.html` file containing your own trusted HTML |

Use hero, gallery, about, and contact at most once each per page: their
interactive templates use fixed internal element IDs. A gallery can contain
as many project or study categories as needed. Text sections can be repeated.

## Additional pages

The migrated site remains one page. To add another real page:

```text
content/pages/
  01-home/...
  02-experiments/
    page.json
    01-introduction/
      section.json
      body.md
```

`page.json`:

```json
{
  "id": "experiments",
  "title": "Experiments — Ashlee Alaniz",
  "output": "experiments.html",
  "navigation": "Experiments"
}
```

`output` is optional: the first enabled page defaults to `index.html`, subsequent
pages to `<id>.html`. The migrated home explicitly pins `index.html`, so renaming
its folder does not change the URL. Output names must be flat lowercase `.html`
filenames, and an enabled page must output `index.html`.

Navigation follows page order, then section order. It links to the current
page's anchors or another page automatically. Use page-level `navigation` for a
single link to a whole page; omit its child section navigation if their anchors
do not also need sidebar entries. Pages with no gallery or title are supported.

## Build commands and safety

```sh
python tools/build_site.py                  # Build dist/
python tools/build_site.py --init           # Scaffold item metadata, then build
python tools/build_site.py --check          # Validate without replacing dist/
python tools/build_site.py --output _site   # Build another dedicated output
python -m unittest discover -s tests -v     # Test the builder
```

The builder stages and validates the whole site before replacing the previous
output. Invalid JSON, missing media, duplicate IDs, unsafe paths, and broken
local links fail the build and preserve the last successful version. It refuses
to replace source folders or non-generated directories. Hashed media names and
versioned styles/scripts refresh browser caches after edits. Gallery images are
present in generated HTML even without JavaScript; filters and the viewer are
enhancements.

Commit `content/`, `theme/`, build tools, tests, and requirements. Do not commit
`dist/` or `_site/`. Publish only the contents of the generated folder.
