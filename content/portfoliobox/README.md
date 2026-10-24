# Portfolio content archive

Source: https://ashlee3dee.portfoliobox.net/

Captured October 24, 2026.

## Files

- `portfolio.json`: normalized owner, biography, navigation, categories, ordered works, media URLs, and asset inventory.
- `projects.csv`: one row per portfolio entry, suitable for a spreadsheet or import.
- `raw-pages.json`: rendered page text, headings, links, image attributes, and embeds for 9 page URLs (homepage and /portfolio are aliases) plus all 53 gallery lightboxes.
- `raw-cards.json`: card markup, captions, links, and page metadata.
- `media/images/`: all 111 downloaded images, including full-size gallery images and thumbnails.
- `media/videos/`: all 10 embedded videos as MP4 files with audio, up to 1080p, plus source metadata sidecars.
- `media-manifest.json`: original URLs, local paths, byte sizes, and SHA-256 checksums.
- `download_media.py` and `download_videos.py`: repeatable download scripts.

## Coverage

55 entries across 6 categories: 53 gallery entries and 2 game projects. 43 gallery images have full-size URLs; 10 gallery entries embed YouTube videos. 111 distinct image URLs include thumbnails, full-size images, portrait, homepage images, and provider branding.

All 111 images and 10 embedded videos have been downloaded. Local paths are relative to this archive folder and are included in `portfolio.json` and `media-manifest.json`. External project destinations and video transcripts are outside this capture. Coverage follows the public navigation and gallery links; unlinked or private pages are not included.

Media binaries and the local `.media-tools/` dependencies are excluded from Git. To repeat video downloads, install `yt-dlp`, `yt-dlp-ejs`, and `imageio-ffmpeg` into `.media-tools/` at the repository root. Node.js must be available. Image downloads use only Python's standard library.

Original wording and spelling are preserved. Untitled entries use null. HTML image dimensions are retained as source dimensions, without verifying the files. Project Gilgamesh uses a scheme-less link attached to a span on the source website; this is preserved in raw_link.

## Biography

### who i am

Hi! I'm a technical artist and 3D generalist with a penchant for sci-fi environments. My passion and skillset lies in empowering artists by developing tools and solving technical problems.

### background

Self-taught with a history of work in additive manufacturing and software engineering, I've worked on projects for Warner Brothers/DC Honkai: Star Rail, and Nike.

### tools

I lean heavily on proceduralism. Blender, Geometry Nodes, Substance Designer, Unity Shader Graph/VFX Graph, and Unreal Blueprints are my primary tools.

### availability

I'm currently available for freelance projects and tutoring/mentorship opportunities. If you need someone who can build systems, solve technical challenges, and translate sci-fi concepts into 3D, please don't hesitate to reach out.

Contact: ashlee3dee@gmail.com

## Portfolio inventory

### Concept Art (26)

- Untitled entry 1 ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=zqakUGo681q0YuDy))
- Untitled entry 2 ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=gMyO8ylgiXiWpniE))
- Untitled entry 3 ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=rIlizPGsely1mFVU))
- Untitled entry 4 ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=i1MTVB7FJaxXerR2))
- Untitled entry 5 ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=lAIMkRZZkYmcUSxK))
- Untitled entry 6 ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=rDvmIxz5pSxHkvBz))
- Offworld Outpost ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=yWGhSOTMmJQbzrgq))
- Untitled entry 8 ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=undNPzNmhcWYNOcF))
- Untitled entry 9 ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=p9vpEaAHQU5pUoOW))
- Megacity III ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=IhOIpzJUFO7OHHsp))
- Untitled entry 11 ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=U5JH2Da65eCvtQ7D))
- Untitled entry 12 ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=PtLhr4eXnS5XNJlB))
- Alien Relics ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=zeqCYmKwpB3fP1hJ))
- Orbital Spaceport I ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=i3xrHnMZIxXWol7e))
- Untitled entry 15 ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=HNQSJn5GVKPwccGN))
- Untitled entry 16 ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=Wx476JKxO9cDddUK))
- Signal Tower ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=oc0tpzKi6ckOgFZW))
- Orbital Space Port I ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=q6UQPNNSf3jnplDc))
- Interstellar Data Carrier ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=C9QRq6qqKxjRRqnQ))
- Arcology I ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=zNiiHFjirEw2zsPr))
- Atmospheric Monitor ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=TM5RRMcoDB2XQkhc))
- Remote Observation Unit ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=nqhhINejfLtpoW3e))
- Untitled entry 23 ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=bKFuGqcyY0rm8xhG))
- Central Processing Core ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=ssJDnYfB3QVejP15))
- Wipeout Inspired Racecraft ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=lUpr8a62r5otkjci))
- Orbital Spaceport I ([source](https://ashlee3dee.portfoliobox.net/concept-art?s=qpqqmwSc0HSaz1KQ&i=pQYxspAjNqd61Hw))

### Technical Direction (3)

- Brookly Broke the Universe — Technical Direction, Lighting, Shading ([source](https://ashlee3dee.portfoliobox.net/technical-direction?s=G5BlZtrkgdtkPtk1&i=pGlTQYbGBigAqdBk))
- DC Heroes United — Technical Director, Junior Look Developer, Lighting, Shaders, VFX, Environments ([source](https://ashlee3dee.portfoliobox.net/technical-direction?s=G5BlZtrkgdtkPtk1&i=vWf1AXEZXGgC5VbV))
- Honkai Star Rail: Your New Reality (Music Video) — Technical Director, Lead Look Developer, Lighting, Shaders, VFX, Environments ([source](https://ashlee3dee.portfoliobox.net/technical-direction?s=G5BlZtrkgdtkPtk1&i=KMWy9RW6jW4In2j2))

### Product Renders (8)

- Untitled entry 1 ([source](https://ashlee3dee.portfoliobox.net/product-design?s=qWWHYv5WGuwUrBLY&i=Cy6ZjDDS0GizMEsR))
- Untitled entry 2 ([source](https://ashlee3dee.portfoliobox.net/product-design?s=qWWHYv5WGuwUrBLY&i=PtV0gSE4pUX5u42I))
- Untitled entry 3 ([source](https://ashlee3dee.portfoliobox.net/product-design?s=qWWHYv5WGuwUrBLY&i=xvGsPKKhzQikwu2U))
- Untitled entry 4 ([source](https://ashlee3dee.portfoliobox.net/product-design?s=qWWHYv5WGuwUrBLY&i=IJTmTjRXNp9zfUOJ))
- Untitled entry 5 ([source](https://ashlee3dee.portfoliobox.net/product-design?s=qWWHYv5WGuwUrBLY&i=SyqT1Rmgtscg6Dve))
- Untitled entry 6 ([source](https://ashlee3dee.portfoliobox.net/product-design?s=qWWHYv5WGuwUrBLY&i=NunD5ep649G516mu))
- Untitled entry 7 ([source](https://ashlee3dee.portfoliobox.net/product-design?s=qWWHYv5WGuwUrBLY&i=dkWjRXK6LlvQztrx))
- Untitled entry 8 ([source](https://ashlee3dee.portfoliobox.net/product-design?s=qWWHYv5WGuwUrBLY&i=sbMroixIeA9BCQ2O))

### Tool Development (3)

- Procedural Generation Toolkit ([source](https://ashlee3dee.portfoliobox.net/tool-development?s=ynOtI5yvncDiUuUG&i=JCGhVFs1EYt6s9sl))
- SplaTool Painterly Addon ([source](https://ashlee3dee.portfoliobox.net/tool-development?s=ynOtI5yvncDiUuUG&i=jagAE166imZzKwMO))
- Hydraulic Terrain Erosion — Simulation done in Blender 4.5 with Geometry Nodes ([source](https://ashlee3dee.portfoliobox.net/tool-development?s=ynOtI5yvncDiUuUG&i=krAkmCQKZRDsBUWT))

### Lookdev (13)

- Untitled entry 1 ([source](https://ashlee3dee.portfoliobox.net/lookdev?s=TuhZVyVLrl2WAY9&i=fZAaVt0ZnN8BohnX))
- Untitled entry 2 ([source](https://ashlee3dee.portfoliobox.net/lookdev?s=TuhZVyVLrl2WAY9&i=ZRhPEaQkX7I1oHs1))
- Untitled entry 3 ([source](https://ashlee3dee.portfoliobox.net/lookdev?s=TuhZVyVLrl2WAY9&i=EMvlee9ALBNnIGiS))
- Untitled entry 4 ([source](https://ashlee3dee.portfoliobox.net/lookdev?s=TuhZVyVLrl2WAY9&i=VLWeXUachmjmk6HM))
- Honkai Stair Rail ([source](https://ashlee3dee.portfoliobox.net/lookdev?s=TuhZVyVLrl2WAY9&i=gANal1OBnuAod7cC))
- Bloom 2 ([source](https://ashlee3dee.portfoliobox.net/lookdev?s=TuhZVyVLrl2WAY9&i=Os9PYDFintTjqOFJ))
- Untitled entry 7 ([source](https://ashlee3dee.portfoliobox.net/lookdev?s=TuhZVyVLrl2WAY9&i=nt1xgioYosFID9hd))
- Untitled entry 8 ([source](https://ashlee3dee.portfoliobox.net/lookdev?s=TuhZVyVLrl2WAY9&i=br4vDoTNLCVaSB3W))
- Untitled entry 9 ([source](https://ashlee3dee.portfoliobox.net/lookdev?s=TuhZVyVLrl2WAY9&i=FOEUodBDLzNMs24P))
- Untitled entry 10 ([source](https://ashlee3dee.portfoliobox.net/lookdev?s=TuhZVyVLrl2WAY9&i=fICj5sinF7N2214j))
- Untitled entry 11 ([source](https://ashlee3dee.portfoliobox.net/lookdev?s=TuhZVyVLrl2WAY9&i=O7Zu8G4rIZi8H8vJ))
- Untitled entry 12 ([source](https://ashlee3dee.portfoliobox.net/lookdev?s=TuhZVyVLrl2WAY9&i=foQMOaBR0mgeRgX6))
- Untitled entry 13 ([source](https://ashlee3dee.portfoliobox.net/lookdev?s=TuhZVyVLrl2WAY9&i=NeLOkvwqEGlQP91T))

### Game Art (2)

- Before Closure — 3D Modeler ([source](https://ashlee3dee.portfoliobox.net/game-art))
- Project Gilgamesh — Environment Art ([source](https://ashlee3dee.portfoliobox.net/game-art))
