#!/usr/bin/env python3
"""Build the portfolio from numbered page, section, category, and project folders."""
from __future__ import annotations

import argparse
import hashlib
import html
import json
import re
import shutil
import sys
import tempfile
from pathlib import Path
from urllib.parse import urlsplit
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]
IMAGES = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.tif', '.tiff', '.bmp'}
VIDEOS = {'.mp4', '.webm'}
SCRIPTS = ['gallery-layout.js', 'studies.js', 'effects.js', 'app.js', 'hero-flow.js']
MARKER = '.portfolio-build.json'


class BuildError(Exception):
    pass


def order(path):
    match = re.match(r'^(\d+)[._ -]+', path.name)
    return (int(match[1]) if match else float('inf'), path.name.casefold())


def folders(path):
    if not path.is_dir():
        return []
    return sorted((p for p in path.iterdir() if p.is_dir() and not p.name.startswith(('.', '_'))), key=order)


def slug(name):
    name = re.sub(r'^\d+[._ -]+', '', name)
    value = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-') or 'untitled'
    return value if value[0].isalpha() else 'item-' + value


def read_json(path):
    try:
        value = json.loads(path.read_text(encoding='utf-8-sig'))
    except (OSError, ValueError) as exc:
        raise BuildError(f'{path}: {exc}') from exc
    if not isinstance(value, dict):
        raise BuildError(f'{path}: metadata must be a JSON object')
    return value


def string(meta, key, context, default=None):
    value = meta.get(key, default)
    if not isinstance(value, str) or (default is None and not value.strip()):
        raise BuildError(f'{context}: "{key}" must be a non-empty string')
    return value


def identifier(value, context):
    if not isinstance(value, str) or not re.fullmatch(r'[a-z][a-z0-9-]*', value):
        raise BuildError(f'{context}: ID must start with a letter and contain lowercase letters, digits, or hyphens')
    return value


def esc(value):
    return html.escape(str(value), quote=True)


def link(value, context):
    if not isinstance(value, str) or urlsplit(value).scheme not in {'http', 'https', 'mailto'}:
        raise BuildError(f'{context}: links must use https://, http://, or mailto:')
    return esc(value)


def enabled(meta, context):
    value = meta.get('enabled', True)
    if not isinstance(value, bool):
        raise BuildError(f'{context}: enabled must be true or false')
    return value


class Builder:
    def __init__(self, root, destination):
        self.root = root.resolve()
        self.content = self.root / 'content'
        self.theme = self.root / 'theme'
        self.destination = destination
        self.site = read_json(self.content / 'site.json')
        self.cache = {}
        self.project_count = 0
        self.media_count = 0
        self.pages = self.load_pages()

    def load_pages(self):
        pages, outputs, ids = [], set(), set()
        for folder in folders(self.content / 'pages'):
            meta = read_json(folder / 'page.json')
            if not enabled(meta, folder):
                continue
            page_id = identifier(meta.get('id', slug(folder.name)), folder)
            output = meta.get('output', 'index.html' if not pages else f'{page_id}.html')
            if not isinstance(output, str) or not re.fullmatch(r'[a-z0-9][a-z0-9-]*\.html', output):
                raise BuildError(f'{folder}: output must be a plain lowercase .html filename')
            if output in outputs or page_id in ids:
                raise BuildError(f'{folder}: duplicate page ID or output filename')
            outputs.add(output)
            ids.add(page_id)
            sections, section_ids = [], set()
            for section in folders(folder):
                config = read_json(section / 'section.json')
                if not enabled(config, section):
                    continue
                section_id = identifier(config.get('id', slug(section.name)), section)
                if section_id in section_ids:
                    raise BuildError(f'{section}: duplicate section ID {section_id}')
                section_ids.add(section_id)
                sections.append((section, {**config, 'id': section_id}))
            if not sections:
                raise BuildError(f'{folder}: a page needs at least one enabled section')
            if sum(config.get('type') == 'gallery' for _, config in sections) > 1:
                raise BuildError(f'{folder}: use one gallery per page; add categories inside it')
            pages.append({'folder': folder, 'meta': meta, 'id': page_id, 'output': output, 'sections': sections})
        if not pages or 'index.html' not in outputs:
            raise BuildError('An enabled page must output index.html')
        return pages

    def template(self, name, values):
        source = (self.theme / 'templates' / name).read_text(encoding='utf-8')
        def replace(match):
            key = match[1]
            if key not in values:
                raise BuildError(f'{name}: no value supplied for {{{{{key}}}}}')
            return str(values[key])
        return re.sub(r'\{\{([a-z_]+)\}\}', replace, source)

    def source(self, folder, name):
        if not isinstance(name, str) or not name or '\\' in name or urlsplit(name).scheme:
            raise BuildError(f'{folder}: media paths must be relative filenames using forward slashes')
        source = (folder / name).resolve()
        if not source.is_relative_to(folder.resolve()) or not source.is_file():
            raise BuildError(f'{folder}: missing media or path outside this folder: {name}')
        return source

    def asset(self, folder, name):
        source = self.source(folder, name)
        cache_key = ('copy', source)
        if cache_key not in self.cache:
            digest = hashlib.sha256(source.read_bytes()).hexdigest()[:20]
            destination = Path('assets/content') / f'{digest}{source.suffix.lower()}'
            (self.destination / destination).parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(source, self.destination / destination)
            self.cache[cache_key] = './' + destination.as_posix()
            self.media_count += 1
        return self.cache[cache_key]

    def image(self, folder, name, limit=1400):
        source = self.source(folder, name)
        if source.suffix.lower() not in IMAGES:
            raise BuildError(f'{source}: unsupported image; use JPG, PNG, WebP, GIF, TIFF, or BMP')
        key = ('image', source, limit)
        if key in self.cache:
            return self.cache[key]
        try:
            from PIL import Image, ImageOps
        except ImportError as exc:
            raise BuildError('Install the image dependency: python -m pip install -r requirements.txt') from exc
        try:
            with Image.open(source) as original:
                image = ImageOps.exif_transpose(original)
                if getattr(original, 'is_animated', False) or (source.suffix.lower() == '.webp' and max(image.size) <= limit):
                    result = (self.asset(folder, name), *image.size)
                else:
                    image.thumbnail((limit, limit), Image.Resampling.LANCZOS)
                    if image.mode not in {'RGB', 'RGBA'}:
                        image = image.convert('RGBA' if 'transparency' in image.info else 'RGB')
                    digest = hashlib.sha256(source.read_bytes() + f'webp:{limit}:85'.encode()).hexdigest()[:20]
                    destination = Path('assets/content') / f'{digest}.webp'
                    (self.destination / destination).parent.mkdir(parents=True, exist_ok=True)
                    image.save(self.destination / destination, 'WEBP', quality=85, method=6)
                    result = ('./' + destination.as_posix(), *image.size)
                    self.media_count += 1
        except (OSError, ValueError) as exc:
            raise BuildError(f'{source}: cannot read image: {exc}') from exc
        self.cache[key] = result
        return result

    def video(self, folder, name):
        if Path(name).suffix.lower() not in VIDEOS:
            raise BuildError(f'{folder}: convert video to MP4 or WebM before building')
        return self.asset(folder, name)

    def description(self, folder, meta):
        file = folder / 'description.md'
        return file.read_text(encoding='utf-8').strip() if file.is_file() else string(meta, 'description', folder, '')

    def items(self, folder, filename):
        for item in folders(folder):
            meta = read_json(item / filename)
            if enabled(meta, item):
                yield item, meta

    def video_item(self, folder, meta, study=False):
        item_id = identifier(meta.get('id', slug(folder.name)), folder)
        title = string(meta, 'title', folder)
        video = self.video(folder, string(meta, 'video', folder))
        poster, pw, ph = self.image(folder, string(meta, 'poster', folder))
        width, height = meta.get('width', pw), meta.get('height', ph)
        if not all(isinstance(n, int) and not isinstance(n, bool) and n > 0 for n in (width, height)):
            raise BuildError(f'{folder}: video width and height must be positive integers')
        description = self.description(folder, meta)
        alt = string(meta, 'alt', folder, title)
        video_html = (f'<video class="{"geometry-video" if study else "reel-video"}" width="{width}" height="{height}" '
                      f'controls {"loop muted " if study else ""}playsinline preload="none" poster="{esc(poster)}" aria-label="{esc(alt)}">'
                      f'<source src="{esc(video)}" type="video/{"webm" if video.endswith(".webm") else "mp4"}">'
                      f'<a href="{esc(video)}">Watch {esc(title)}</a>.</video>')
        if study:
            return (f'<article class="geometry-study" aria-labelledby="study-{item_id}">{video_html}'
                    f'<div class="geometry-caption"><h3 id="study-{item_id}">{esc(title)}</h3><p>{esc(description)}</p></div></article>')
        duration = string(meta, 'duration', folder, '')
        return f'<figure class="reel">{video_html}<figcaption><h2>{esc(title)}</h2><span class="mono">{esc(duration)}</span></figcaption></figure>'

    def project(self, folder, meta, category):
        project_id = identifier(meta.get('id', slug(folder.name)), folder)
        title = string(meta, 'title', folder)
        image, width, height = self.image(folder, string(meta, 'image', folder))
        full, fw, fh = self.image(folder, meta.get('full_image', meta['image']), 2400)
        project = {'id': project_id, 'title': title, 'category': category,
                   'description': self.description(folder, meta), 'alt': string(meta, 'alt', folder, title),
                   'image': image, 'fullImage': full, 'imageWidth': width, 'imageHeight': height,
                   'fullImageWidth': fw, 'fullImageHeight': fh}
        if meta.get('video'):
            project['localVideo'] = self.video(folder, meta['video'])
        if meta.get('youtube'):
            if not isinstance(meta['youtube'], str) or not re.fullmatch(r'[\w-]{11}', meta['youtube']):
                raise BuildError(f'{folder}: youtube must be an 11-character video ID')
            project['video'] = meta['youtube']
        if meta.get('link'):
            link(meta['link'], folder)
            project['link'] = meta['link']
        self.project_count += 1
        return project

    def gallery(self, folder, meta, data):
        categories, studies, panels, projects, selected = [], [], [], [], []
        category_ids, project_ids = set(), set()
        for category_folder in folders(folder):
            category = read_json(category_folder / 'category.json')
            if not enabled(category, category_folder):
                continue
            category_id = identifier(category.get('id', slug(category_folder.name)), category_folder)
            if category_id in category_ids or category_id in {'selected', 'all'}:
                raise BuildError(f'{category_folder}: duplicate or reserved category ID {category_id}')
            category_ids.add(category_id)
            label = string(category, 'title', category_folder)
            kind = category.get('type', 'projects')
            if kind == 'studies':
                studies.append({'id': category_id, 'name': label})
                children = list(self.items(category_folder, 'item.json'))
                ids = [identifier(m.get('id', slug(p.name)), p) for p, m in children]
                if len(set(ids)) != len(ids):
                    raise BuildError(f'{category_folder}: duplicate study IDs')
                panels.append(f'<div class="geometry-panel" data-study-panel="{category_id}" hidden>' +
                              '\n'.join(self.video_item(p, m, True) for p, m in children) + '</div>')
            elif kind == 'projects':
                categories.append({'id': category_id, 'name': label})
                for project_folder, project_meta in self.items(category_folder, 'project.json'):
                    project = self.project(project_folder, project_meta, category_id)
                    if project['id'] in project_ids:
                        raise BuildError(f'{project_folder}: duplicate project ID {project["id"]}')
                    project_ids.add(project['id'])
                    projects.append(project)
                    rank = project_meta.get('selected', False)
                    if rank is not False:
                        if not isinstance(rank, (int, float)) or rank <= 0:
                            raise BuildError(f'{project_folder}: selected must be false, true, or a positive order number')
                        selected.append((len(projects) if rank is True else rank, len(projects), project['id']))
            else:
                raise BuildError(f'{category_folder}: unknown category type {kind}')
        data.update(projects=projects, categories=categories, studyCategories=studies,
                    selected=[p[2] for p in sorted(selected)] if selected else [p['id'] for p in projects])
        labels = {c['id']: c['name'] for c in categories}
        by_id = {p['id']: p for p in projects}
        cards = []
        for project_id in data['selected']:
            p = by_id[project_id]
            cards.append(f'<article class="project" data-ratio="{p["imageWidth"] / p["imageHeight"]}">'
                         f'<a class="project-button" href="{esc(p["fullImage"])}"><div class="project-image">'
                         f'<img src="{esc(p["image"])}" alt="{esc(p["alt"])}" width="{p["imageWidth"]}" height="{p["imageHeight"]}" loading="lazy"></div>'
                         f'<div class="project-caption"><div><h3>{esc(p["title"])}</h3><p class="mono">{esc(labels[p["category"]])}</p></div></div></a></article>')
        return (f'<section id="{meta["id"]}" class="work section" aria-labelledby="work-title">'
                f'<div class="section-heading"><div><p class="mono section-index">{esc(meta.get("eyebrow", ""))}</p>'
                f'<h2 id="work-title">{esc(meta.get("title", "Selected work"))}<span class="red">.</span></h2></div></div>'
                '<div class="work-toolbar"><div id="filters" class="filters" aria-label="Filter work by discipline"></div>'
                '<span id="result-count" class="mono" role="status" aria-live="polite"></span></div>'
                '<div id="project-grid" class="project-grid">' + '\n'.join(cards) + '</div>' + '\n'.join(panels) +
                '<div class="archive-action"><button id="archive-toggle" class="text-button">View all work</button></div>'
                '<noscript><p>Open an image to view it. Enable JavaScript for filters and the project viewer.</p></noscript></section>')

    def section(self, folder, meta, data):
        kind = string(meta, 'type', folder)
        values = {key: esc(value) for key, value in meta.items() if isinstance(value, (str, int, float))}
        if kind == 'gallery':
            return self.gallery(folder, meta, data)
        if kind == 'hero':
            values.update(eyebrow=esc(meta.get('eyebrow', '')), availability=esc(meta.get('availability', '')),
                          heart_url=link(meta.get('heart_url', 'https://fund.blender.org/'), folder))
            return self.template('hero.html', values)
        if kind == 'reels':
            items = '\n'.join(self.video_item(p, m) for p, m in self.items(folder, 'item.json'))
            return (f'<section id="{meta["id"]}" class="reels-section" aria-labelledby="{meta["id"]}-title">'
                    f'<div class="reels-heading"><p class="mono section-index">{esc(meta.get("eyebrow", ""))}</p>'
                    f'<h2 id="{meta["id"]}-title">{esc(meta.get("title", "Reels"))}<span class="red">.</span></h2></div>'
                    f'<div class="reels" aria-label="Demo reels">{items}</div></section>')
        if kind == 'about':
            paragraphs = meta.get('paragraphs', [])
            if not isinstance(paragraphs, list) or not all(isinstance(p, str) for p in paragraphs):
                raise BuildError(f'{folder}: paragraphs must be a list of strings')
            values['paragraphs'] = ''.join(('<p class="about-lead">' if i == 0 else '<p>') + esc(p) + '</p>' for i, p in enumerate(paragraphs))
            return self.template('about.html', values)
        if kind == 'contact':
            email = meta.get('email', self.site.get('email', ''))
            link('mailto:' + email, folder)
            values['email'] = esc(email)
            return self.template('contact.html', values)
        if kind == 'text':
            body = folder / 'body.md'
            paragraphs = body.read_text(encoding='utf-8').strip().split('\n\n') if body.is_file() else meta.get('paragraphs', [])
            if not isinstance(paragraphs, list) or not all(isinstance(p, str) for p in paragraphs):
                raise BuildError(f'{folder}: paragraphs must be a list of strings')
            return (f'<section id="{meta["id"]}" class="section text-section"><div class="section-heading">'
                    f'<h2>{esc(meta.get("title", ""))}</h2></div>' + ''.join(f'<p>{esc(p)}</p>' for p in paragraphs) + '</section>')
        if kind == 'html':
            return f'<section id="{meta["id"]}">{(folder / "body.html").read_text(encoding="utf-8")}</section>'
        raise BuildError(f'{folder}: unknown section type {kind}')

    def navigation(self, current):
        links = []
        for page in self.pages:
            if page['meta'].get('navigation'):
                links.append(f'<a href="./{page["output"]}">{esc(page["meta"]["navigation"])}</a>')
            for _, meta in page['sections']:
                if not meta.get('navigation'):
                    continue
                target = f'#{meta["id"]}' if page is current else f'./{page["output"]}#{meta["id"]}'
                number = f'<span>{esc(meta["index"])}</span>' if meta.get('index') else ''
                links.append(f'<a href="{target}">{esc(meta["navigation"])}{number}</a>')
        return ''.join(links)

    def build(self):
        shutil.copytree(self.theme / 'static', self.destination, dirs_exist_ok=True)
        hasher = hashlib.sha256()
        for path in sorted((self.theme / 'static').rglob('*')):
            if path.is_file():
                hasher.update(path.relative_to(self.theme).as_posix().encode())
                hasher.update(path.read_bytes())
        version = hasher.hexdigest()[:12]
        for page in self.pages:
            data = {'projects': [], 'categories': [], 'selected': [], 'studyCategories': []}
            sections = '\n'.join(self.section(p, m, data) for p, m in page['sections'])
            page_version = hashlib.sha256((version + sections + json.dumps(data, sort_keys=True) + json.dumps(self.site, sort_keys=True)).encode()).hexdigest()[:12]
            data_file = f'{page["id"]}-projects.js'
            (self.destination / data_file).write_text('/* Generated from content/. Do not edit. */\nwindow.PORTFOLIO = ' + json.dumps(data, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8', newline='\n')
            role = self.site.get('role', [])
            if not isinstance(role, list) or not all(isinstance(line, str) for line in role):
                raise BuildError('content/site.json: role must be a list of strings')
            values = {k: esc(v) for k, v in self.site.items() if isinstance(v, str)}
            values.update(page_title=esc(page['meta'].get('title', self.site.get('title', 'Portfolio'))),
                          description=esc(page['meta'].get('description', self.site.get('description', ''))),
                          sections=sections, role='<br>'.join(esc(line) for line in role),
                          navigation=self.navigation(page), skip_target='#' + page['sections'][0][1]['id'], version=page_version,
                          home_url='#' if page['output'] == 'index.html' else './index.html',
                          scripts='\n'.join(f'<script src="./{file}?v={page_version}" defer></script>' for file in [data_file] + SCRIPTS))
            document = self.template('document.html', values)
            document = '<!-- Generated by tools/build_site.py; edit content/ and theme/. -->\n' + document
            (self.destination / page['output']).write_text(document, encoding='utf-8', newline='\n')
        (self.destination / MARKER).write_text(json.dumps({'generator': 'portfolio', 'pages': [p['output'] for p in self.pages]}, indent=2), encoding='utf-8', newline='\n')
        validate_links(self.destination)


class References(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids, self.references = set(), []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if attrs.get('id'):
            if attrs['id'] in self.ids:
                raise BuildError(f'Duplicate HTML id: {attrs["id"]}')
            self.ids.add(attrs['id'])
        for attr in ('href', 'src', 'poster'):
            if attrs.get(attr):
                self.references.append(attrs[attr])


def validate_links(destination):
    documents = {}
    for path in destination.glob('*.html'):
        parser = References()
        parser.feed(path.read_text(encoding='utf-8'))
        documents[path.name] = parser
    for filename, parser in documents.items():
        for value in parser.references:
            parsed = urlsplit(value)
            if parsed.scheme or parsed.netloc:
                continue
            target = (destination / parsed.path).resolve() if parsed.path else destination / filename
            if not target.is_relative_to(destination.resolve()) or not target.is_file():
                raise BuildError(f'{filename}: broken local reference {value}')
            if parsed.fragment and target.name in documents and parsed.fragment not in documents[target.name].ids:
                raise BuildError(f'{filename}: missing anchor {value}')


def initialize(root):
    """Create missing metadata in media folders. Never overwrite existing metadata."""
    created = []
    for page in folders(root / 'content/pages'):
        for section in folders(page):
            if not (section / 'section.json').is_file():
                continue
            section_type = read_json(section / 'section.json').get('type')
            containers = [(section, 'item.json')] if section_type == 'reels' else []
            if section_type == 'gallery':
                for category in folders(section):
                    meta = read_json(category / 'category.json')
                    containers.append((category, 'item.json' if meta.get('type') == 'studies' else 'project.json'))
            for container, filename in containers:
                for folder in folders(container):
                    metadata = folder / filename
                    if metadata.exists():
                        continue
                    files = sorted(p for p in folder.iterdir() if p.is_file())
                    images = [p for p in files if p.suffix.lower() in IMAGES]
                    videos = [p for p in files if p.suffix.lower() in VIDEOS]
                    if not images and not videos:
                        continue
                    item_id = slug(folder.name)
                    meta = {'id': item_id, 'title': item_id.replace('-', ' ').title(), 'description': ''}
                    if filename == 'project.json':
                        image = next((p for p in images if p.stem.lower() in {'image', 'cover', 'poster'}), images[0] if images else None)
                        meta.update(image=image.name if image else 'poster.jpg', alt=meta['title'], selected=False)
                        full = next((p for p in images if p.stem.lower() in {'full', 'full-image', 'full_image'}), None)
                        if full:
                            meta['full_image'] = full.name
                    else:
                        meta['poster'] = images[0].name if images else 'poster.jpg'
                    if videos:
                        meta['video'] = videos[0].name
                    metadata.write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
                    created.append(metadata)
    return created


def safe_output(root, output):
    root, output = root.resolve(), output.resolve()
    protected = [root / name for name in ['content', 'theme', 'tools', 'tests', '.git', '.github']]
    if output == root or not output.is_relative_to(root) or any(output.is_relative_to(p) or p.is_relative_to(output) for p in protected):
        raise BuildError('Output must be a dedicated build folder inside the repository, such as dist/ or _site/')
    if output.exists() and (not output.is_dir() or (any(output.iterdir()) and not (output / MARKER).is_file())):
        raise BuildError(f'{output}: refusing to replace a non-generated directory')
    return output


def build_site(root=ROOT, output=None, check=False):
    root = root.resolve()
    output = safe_output(root, output or root / 'dist')
    output.parent.mkdir(parents=True, exist_ok=True)
    # Stage and validate everything before replacing an existing generated site.
    with tempfile.TemporaryDirectory(prefix='.portfolio-build-', dir=output.parent) as temporary:
        stage = Path(temporary) / 'site'
        stage.mkdir()
        builder = Builder(root, stage)
        builder.build()
        if not check:
            backup = Path(temporary) / 'previous'
            if output.exists():
                output.rename(backup)
            try:
                stage.rename(output)
            except OSError:
                if backup.exists():
                    backup.rename(output)
                raise
        return {'pages': len(builder.pages), 'projects': builder.project_count, 'media': builder.media_count}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', type=Path, default=ROOT / 'dist', help='Generated folder inside this repository (default: dist)')
    parser.add_argument('--init', action='store_true', help='Scaffold metadata for new media folders, then build')
    parser.add_argument('--check', action='store_true', help='Validate and render without changing the current generated site')
    args = parser.parse_args()
    try:
        if args.init:
            for path in initialize(ROOT):
                print(f'Created {path.relative_to(ROOT)}')
        counts = build_site(output=args.output.resolve(), check=args.check)
        print(f'{"Validated" if args.check else "Built"} {counts["pages"]} page(s), {counts["projects"]} projects, {counts["media"]} media files' +
              ('' if args.check else f' -> {args.output.resolve()}'))
    except (BuildError, OSError) as exc:
        print(f'Build failed: {exc}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
