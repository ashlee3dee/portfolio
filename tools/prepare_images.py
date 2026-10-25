#!/usr/bin/env python3
"""Generate stable archive IDs and optimized WebP images for portfolio projects."""
import argparse
import hashlib
import json
import secrets
import string
from pathlib import Path
from PIL import Image, ImageOps

ALPHABET = string.ascii_letters + string.digits
EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.tif', '.tiff', '.bmp'}


def normalize_js_object(source):
    """Mask JS comments and trailing commas while preserving string offsets."""
    chars = list(source)
    i = 0
    quote = None
    while i < len(chars):
        c = chars[i]
        if quote:
            if c == "\\":
                i += 2
                continue
            if c == quote:
                quote = None
        elif c in ("\"", "'"):
            quote = c
        elif c == "/" and i + 1 < len(chars) and chars[i + 1] == "/":
            j = i
            while j < len(chars) and chars[j] != "\n":
                chars[j] = " "
                j += 1
            i = j
            continue
        elif c == "/" and i + 1 < len(chars) and chars[i + 1] == "*":
            j = i + 2
            while j + 1 < len(chars) and not (chars[j] == "*" and chars[j + 1] == "/"):
                j += 1
            j = min(len(chars), j + 2)
            for k in range(i, j):
                if chars[k] != "\n":
                    chars[k] = " "
            i = j
            continue
        i += 1
    # Ignore commas immediately before ] or }, outside strings.
    i = 0
    quote = None
    while i < len(chars):
        c = chars[i]
        if quote:
            if c == "\\":
                i += 2
                continue
            if c == quote:
                quote = None
        elif c in ("\"", "'"):
            quote = c
        elif c == ",":
            j = i + 1
            while j < len(chars) and chars[j].isspace():
                j += 1
            if j < len(chars) and chars[j] in "}]":
                chars[i] = " "
        i += 1
    return "".join(chars)


def read_portfolio(path):
    text = path.read_text(encoding="utf-8-sig")
    start = text.index("window.PORTFOLIO")
    start = text.index("{", start)
    normalized = normalize_js_object(text[start:])
    try:
        data, end = json.JSONDecoder().raw_decode(normalized)
    except json.JSONDecodeError as exc:
        raise ValueError(
            f"Could not parse {path} at line {text[:start].count(chr(10)) + exc.lineno}, "
            f"column {exc.colno}: {exc.msg}. "
            "The parser supports JSON-style quoted keys, JS comments and trailing commas."
        ) from exc
    return text, data, start, start + end


def save_portfolio(path, raw, data, start, end):
    # Only rewrite the portfolio data; keep surrounding JavaScript intact.
    formatted = json.dumps(data, ensure_ascii=False, indent=2)
    path.write_text(raw[:start] + formatted + raw[end:], encoding='utf-8')


def make_id(used):
    while True:
        candidate = ''.join(secrets.choice(ALPHABET) for _ in range(16))
        if candidate not in used:
            return candidate


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('images', nargs='+', type=Path, help='Input images or directories')
    parser.add_argument('--site', type=Path, default=Path(__file__).resolve().parents[1], help='Website root')
    parser.add_argument('--project', help='Existing project id in projects.js (requires exactly one image)')
    parser.add_argument('--thumb-width', type=int, default=1400)
    parser.add_argument('--full-width', type=int, default=1920)
    parser.add_argument('--quality', type=int, default=82)
    parser.add_argument('--force', action='store_true', help='Rebuild images even if outputs already exist')
    args = parser.parse_args()
    if args.thumb_width < 1 or args.full_width < 1 or not 1 <= args.quality <= 100:
        parser.error('Widths must be positive; quality must be 1..100')
    site = args.site.resolve()
    js_path = site / 'projects.js'
    if not js_path.exists():
        parser.error(f'Cannot find {js_path}')
    raw, portfolio, start, end = read_portfolio(js_path)
    projects = {p['id']: p for p in portfolio['projects']}
    if args.project and args.project not in projects:
        parser.error(f'Unknown project: {args.project}')
    inputs = []
    for item in args.images:
        if item.is_dir():
            inputs.extend(sorted(p for p in item.iterdir() if p.is_file() and p.suffix.lower() in EXTS))
        elif item.is_file() and item.suffix.lower() in EXTS:
            inputs.append(item)
        else:
            parser.error(f'Not a supported image or directory: {item}')
    inputs = list(dict.fromkeys(p.resolve() for p in inputs))
    if args.project and len(inputs) != 1:
        parser.error('--project requires exactly one input image')
    output = site / 'assets' / 'work'
    output.mkdir(parents=True, exist_ok=True)
    manifest_path = output / 'image-manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {}
    used = {p.get('archiveId') for p in portfolio['projects'] if p.get('archiveId')}
    used.update(v['archiveId'] for v in manifest.values())
    changed = False
    for path in inputs:
        # A source path is a stable key; subsequent runs reuse its archive ID.
        key = str(path.relative_to(site)) if path.is_relative_to(site) else str(path)
        record = manifest.get(key)
        project = projects.get(args.project) if args.project else None
        archive_id = (project.get('archiveId') if project else None) or (record or {}).get('archiveId') or make_id(used)
        used.add(archive_id)
        thumb = output / f'{archive_id}.webp'
        full = output / f'{archive_id}-full.webp'
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        rebuild = args.force or not record or record.get('sha256') != digest
        with Image.open(path) as original:
            oriented = ImageOps.exif_transpose(original)
            if oriented.mode not in ('RGB', 'RGBA'):
                oriented = oriented.convert('RGBA' if 'A' in oriented.getbands() else 'RGB')
            dims = []
            for target, max_width in ((thumb, args.thumb_width), (full, args.full_width)):
                ratio = min(1.0, max_width / oriented.width)
                size = (max(1, round(oriented.width * ratio)), max(1, round(oriented.height * ratio)))
                dims.append(size)
                if rebuild or not target.exists():
                    scaled = oriented.resize(size, Image.Resampling.LANCZOS) if size != oriented.size else oriented
                    scaled.save(target, 'WEBP', quality=args.quality, method=6)
        relative_thumb = f'./assets/work/{thumb.name}'
        relative_full = f'./assets/work/{full.name}'
        fields = dict(archiveId=archive_id, image=relative_thumb, fullImage=relative_full,
                      imageWidth=dims[0][0], imageHeight=dims[0][1],
                      fullImageWidth=dims[1][0], fullImageHeight=dims[1][1])
        manifest[key] = {'archiveId': archive_id, 'sha256': digest, **fields}
        if project:
            project.update(fields)
            changed = True
        print(f'\n{path.name} → {thumb.name} / {full.name}')
        print(json.dumps(fields, indent=2))
    manifest_path.write_text(json.dumps(manifest, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
    if changed:
        save_portfolio(js_path, raw, portfolio, start, end)
        print(f'\nUpdated {js_path}')
    else:
        print('\nNo project modified. Copy the displayed fields into a new project entry.')


if __name__ == '__main__':
    main()
