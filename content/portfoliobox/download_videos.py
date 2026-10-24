"""Download playable single-file copies of the archived YouTube embeds."""
import hashlib
import json
from pathlib import Path
import sys
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT.parents[1] / '.media-tools'))
import yt_dlp
import imageio_ffmpeg

portfolio = json.loads((ROOT / 'portfolio.json').read_text(encoding='utf-8'))
manifest = json.loads((ROOT / 'media-manifest.json').read_text(encoding='utf-8'))
output = ROOT / 'media' / 'videos'
output.mkdir(parents=True, exist_ok=True)
results = []
for category in portfolio['categories']:
    for item in category['items']:
        for embed in item['embeds']:
            video_id = urlparse(embed['src']).path.rsplit('/', 1)[-1]
            url = 'https://www.youtube.com/watch?v=' + video_id
            result = {'id': video_id, 'url': url, 'portfolio_item_id': item['id']}
            try:
                options = {
                    'format': 'bestvideo[height<=1080][ext=mp4]+bestaudio[ext=m4a]/bestvideo[height<=1080]+bestaudio/best',
                    'merge_output_format': 'mp4',
                    'ffmpeg_location': imageio_ffmpeg.get_ffmpeg_exe(),
                    'js_runtimes': {'node': {}},
                    'outtmpl': str(output / (video_id + '.%(ext)s')),
                    'noplaylist': True, 'socket_timeout': 25, 'retries': 1,
                    'quiet': True, 'noprogress': True,
                    'writeinfojson': True,
                }
                with yt_dlp.YoutubeDL(options) as downloader:
                    info = downloader.extract_info(url, download=True)
                    path = Path(downloader.prepare_filename(info))
                result.update(status='downloaded', local_path=path.relative_to(ROOT).as_posix(),
                              bytes=path.stat().st_size, title=info.get('title'),
                              height=info.get('height'), duration=info.get('duration'),
                              sha256=hashlib.file_digest(path.open('rb'), 'sha256').hexdigest()
                              if hasattr(hashlib, 'file_digest') else hashlib.sha256(path.read_bytes()).hexdigest())
                embed['local_path'] = result['local_path']
            except Exception as error:
                result.update(status='failed', error=str(error))
            results.append(result)
            manifest['videos'] = results
            (ROOT / 'media-manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
            (ROOT / 'portfolio.json').write_text(json.dumps(portfolio, indent=2, ensure_ascii=False), encoding='utf-8')
            print(json.dumps(result), flush=True)
