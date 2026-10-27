# Portfolio image preparation

Install: `py -m pip install Pillow`

From the website root:

- Prepare a new image and print project metadata: `py tools/prepare_images.py "C:\\Images\\render.png"`
- Prepare a whole folder: `py tools/prepare_images.py "C:\\Images\\Portfolio"`
- Update an existing project automatically: `py tools/prepare_images.py "C:\\Images\\bagacam.png" --project bagacam-osl`
- Rebuild with custom settings: `py tools/prepare_images.py render.png --quality 88 --thumb-width 1200 --full-width 2400 --force`

Windows shortcut: `scripts\\prepare_images.bat "C:\\Images\\render.png" --project bagacam-osl`

Creates `assets/work/<archiveId>.webp`, `assets/work/<archiveId>-full.webp`, and `assets/work/image-manifest.json`. The manifest keeps IDs stable across runs. Existing project IDs are preserved. `--project` updates the matching project entry in `projects.js`; without it, the script prints fields for pasting into a new entry. Existing images are not upscaled. The script does not download remote URLs or alter source images.

**Note:** `archiveId` is a local stable asset identifier, not an actual ID issued by the original Portfoliobox archive. New IDs are generated locally and should not be used to construct Portfoliobox URLs.
