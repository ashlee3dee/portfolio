"""Download the image URLs captured in portfolio.json; safe to rerun."""
import concurrent.futures
import hashlib
import json
from pathlib import Path
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent


def download(asset):
    url = asset['url']
    parsed = urllib.parse.urlparse(url)
    if parsed.scheme != 'https' or parsed.hostname not in {
        'dkemhji6i1k0x.cloudfront.net', 'cdn.portfolioboxdns.com'
    }:
        return dict(asset, status='failed', error='Unexpected media host')
    name = Path(parsed.path).name
    target = ROOT / 'media' / 'images' / name
    result = dict(asset, local_path=target.relative_to(ROOT).as_posix())
    try:
        if not target.exists():
            request = urllib.request.Request(url, headers={'User-Agent': 'PortfolioArchive/1.0'})
            with urllib.request.urlopen(request, timeout=60) as response:
                content_type = response.headers.get_content_type()
                if not content_type.startswith('image/'):
                    raise ValueError(f'Expected image, received {content_type}')
                payload = response.read()
            if not payload:
                raise ValueError('Empty response')
            target.write_bytes(payload)
        payload = target.read_bytes()
        result.update(status='downloaded', bytes=len(payload), sha256=hashlib.sha256(payload).hexdigest())
    except Exception as error:
        result.update(status='failed', error=str(error))
    return result


def main():
    portfolio_path = ROOT / 'portfolio.json'
    portfolio = json.loads(portfolio_path.read_text(encoding='utf-8'))
    (ROOT / 'media' / 'images').mkdir(parents=True, exist_ok=True)
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        results = list(pool.map(download, portfolio['assets']))
    manifest_path = ROOT / 'media-manifest.json'
    manifest = json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {}
    manifest.update(source=portfolio['source'], images=results)
    (ROOT / 'media-manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
    by_url = {r['url']: r for r in results}
    for asset in portfolio['assets']:
        result = by_url[asset['url']]
        if result['status'] == 'downloaded':
            asset.update({k: result[k] for k in ('local_path', 'bytes', 'sha256')})
    for category in portfolio['categories']:
        for item in category['items']:
            for field in ('thumbnail', 'image'):
                result = by_url.get(item.get(field + '_url'))
                if result and result['status'] == 'downloaded':
                    item[field + '_local_path'] = result['local_path']
    portrait = by_url.get(portfolio['owner']['portrait_url'])
    if portrait and portrait['status'] == 'downloaded':
        portfolio['owner']['portrait_local_path'] = portrait['local_path']
    portfolio['scope'] = 'Public linked portfolio pages and all 53 linked gallery lightboxes. Images downloaded locally; embedded video downloads are tracked separately in media-manifest.json.'
    portfolio_path.write_text(json.dumps(portfolio, indent=2, ensure_ascii=False), encoding='utf-8')
    print(json.dumps({'downloaded': sum(r['status'] == 'downloaded' for r in results), 'failed': [r for r in results if r['status'] != 'downloaded'], 'bytes': sum(r.get('bytes', 0) for r in results)}))


if __name__ == '__main__':
    main()
