"""Create deployable images from the downloaded archive; run once or after reimport.

Requires Pillow: python -m pip install --target .media-tools Pillow
This updates image paths in projects.js; it preserves hand-edited titles and order.
"""
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / '.media-tools'))
from PIL import Image, ImageOps

path = ROOT / 'projects.js'
text = path.read_text(encoding='utf-8')
header, payload = text.split('window.PORTFOLIO = ', 1)
data = json.loads(payload.strip().removesuffix(';'))
archive = json.loads((ROOT/'content/portfoliobox/portfolio.json').read_text(encoding='utf-8'))
source_items = {i['id']: i for c in archive['categories'] for i in c['items']}
out = ROOT / 'assets' / 'work'
out.mkdir(parents=True, exist_ok=True)
for project in data['projects']:
    source = source_items[project.get('archiveId', project['id'])]
    for field, local_key, max_size, quality in [('image','thumbnail_local_path',1400,85), ('fullImage','image_local_path',2400,90)]:
        local_path = source.get(local_key) or source['thumbnail_local_path']
        with Image.open(ROOT/'content/portfoliobox'/local_path) as original:
            image = ImageOps.exif_transpose(original).convert('RGB')
            image.thumbnail((max_size,max_size),Image.Resampling.LANCZOS)
            name = project.get('archiveId', project['id']) + ('-full' if field == 'fullImage' else '') + '.webp'
            image.save(out/name,'WEBP',quality=quality,method=6)
        project[field] = './assets/work/' + name
    project.pop('localImage',None)
    project.pop('localFull',None)
path.write_text(header+'window.PORTFOLIO = '+json.dumps(data,indent=2,ensure_ascii=False)+';\n',encoding='utf-8')
print(f"Prepared {len(data['projects'])} projects; {sum(p.stat().st_size for p in out.glob('*.webp')) / 1024**2:.1f} MiB of self-hosted images")
