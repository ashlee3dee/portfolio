"""Integration tests for folder discovery, media handling, and safe rebuilds."""
import json
from pathlib import Path
import shutil
import sys
import tempfile
import unittest

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'tools'))
from build_site import BuildError, build_site, initialize, folders, slug


class SiteTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix='.test-site-', dir=Path(__file__).resolve().parents[1])
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)
        self.write('content/site.json', {'title': 'Test', 'name': 'Artist', 'role': []})
        self.write('content/pages/01-home/page.json', {'id': 'home', 'output': 'index.html'})
        self.page = self.root / 'content/pages/01-home'
        templates = self.root / 'theme/templates'
        templates.mkdir(parents=True)
        (templates / 'document.html').write_text('<html><head>{{scripts}}</head><body><nav>{{navigation}}</nav><main>{{sections}}</main></body></html>', encoding='utf-8')
        (self.root / 'theme/static').mkdir()
        for file in ['gallery-layout.js', 'studies.js', 'effects.js', 'app.js', 'hero-flow.js']:
            (self.root / 'theme/static' / file).write_text('', encoding='utf-8')
        self.write('content/pages/01-home/01-work/section.json', {'id': 'work', 'type': 'gallery', 'navigation': 'Work'})
        self.category = self.page / '01-work/01-art'
        self.write(self.category / 'category.json', {'id': 'art', 'title': 'Art'})
        self.project = self.category / '01-first'
        self.write(self.project / 'project.json', {'id': 'first', 'title': 'First', 'image': 'photo.png', 'selected': True})
        Image.new('RGB', (1800, 900), 'red').save(self.project / 'photo.png')

    def write(self, file, data):
        path = Path(file)
        if not path.is_absolute():
            path = self.root / path
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(json.dumps(data), encoding='utf-8')

    def data(self):
        text = (self.root / 'dist/home-projects.js').read_text(encoding='utf-8')
        return json.loads(text.split('window.PORTFOLIO = ', 1)[1].removesuffix(';\n'))

    def test_images_are_optimized_and_metadata_preserved(self):
        build_site(self.root)
        project = self.data()['projects'][0]
        self.assertEqual((project['imageWidth'], project['imageHeight']), (1400, 700))
        self.assertTrue(project['image'].endswith('.webp'))
        self.assertEqual(self.data()['selected'], ['first'])
        self.assertTrue((self.project / 'photo.png').exists())
        self.assertIn('First', (self.root / 'dist/index.html').read_text())

    def test_numbered_folder_order_controls_layout(self):
        self.write(self.page / '10-last/section.json', {'id': 'last', 'type': 'text', 'title': 'Last'})
        self.write(self.page / '02-middle/section.json', {'id': 'middle', 'type': 'text', 'title': 'Middle'})
        build_site(self.root)
        text = (self.root / 'dist/index.html').read_text()
        self.assertLess(text.index('id="work"'), text.index('id="middle"'))
        self.assertLess(text.index('id="middle"'), text.index('id="last"'))
        (self.page / '10-last').rename(self.page / '00-last')
        build_site(self.root)
        text = (self.root / 'dist/index.html').read_text()
        self.assertLess(text.index('id="last"'), text.index('id="work"'))

    def test_additional_page_and_cross_page_navigation(self):
        self.write('content/pages/02-notes/page.json', {'id': 'notes', 'navigation': 'Notes'})
        self.write('content/pages/02-notes/01-intro/section.json', {'id': 'intro', 'type': 'text', 'title': 'Notes', 'navigation': 'Introduction'})
        build_site(self.root)
        self.assertTrue((self.root / 'dist/notes.html').exists())
        self.assertIn('./notes.html#intro', (self.root / 'dist/index.html').read_text())
        self.assertIn('./index.html#work', (self.root / 'dist/notes.html').read_text())

    def test_initializer_never_overwrites_metadata(self):
        new = self.category / '02-second'
        new.mkdir()
        Image.new('RGB', (20, 20), 'blue').save(new / 'cover.jpg')
        self.assertEqual(initialize(self.root), [new / 'project.json'])
        meta = json.loads((new / 'project.json').read_text())
        self.assertEqual(meta['image'], 'cover.jpg')
        self.assertEqual(meta['id'], 'second')
        (new / 'project.json').write_text('{"title":"Do not overwrite"}')
        self.assertEqual(initialize(self.root), [])
        self.assertEqual(json.loads((new / 'project.json').read_text())['title'], 'Do not overwrite')

    def test_failed_build_preserves_last_successful_output(self):
        build_site(self.root)
        before = (self.root / 'dist/index.html').read_bytes()
        self.write(self.project / 'project.json', {'id': 'first', 'title': 'Broken', 'image': 'missing.png'})
        with self.assertRaisesRegex(BuildError, 'missing media'):
            build_site(self.root)
        self.assertEqual(before, (self.root / 'dist/index.html').read_bytes())

    def test_source_path_traversal_rejected(self):
        self.write(self.project / 'project.json', {'id': 'first', 'title': 'First', 'image': '../photo.png'})
        with self.assertRaisesRegex(BuildError, 'outside this folder'):
            build_site(self.root)

    def test_duplicate_ids_rejected(self):
        other = self.category / '02-second'
        shutil.copytree(self.project, other)
        with self.assertRaisesRegex(BuildError, 'duplicate project ID'):
            build_site(self.root)

    def test_duplicate_page_outputs_rejected(self):
        self.write('content/pages/02-extra/page.json', {'id': 'extra', 'output': 'index.html'})
        with self.assertRaisesRegex(BuildError, 'duplicate page'):
            build_site(self.root)

    def test_safe_output_and_check_mode(self):
        with self.assertRaises(BuildError):
            build_site(self.root, self.root)
        unmanaged = self.root / 'unmanaged'
        unmanaged.mkdir()
        (unmanaged / 'keep.txt').write_text('keep')
        with self.assertRaisesRegex(BuildError, 'non-generated'):
            build_site(self.root, unmanaged)
        build_site(self.root, check=True)
        self.assertFalse((self.root / 'dist').exists())
        self.assertTrue((unmanaged / 'keep.txt').exists())

    def test_stale_generated_files_removed_and_output_deterministic(self):
        build_site(self.root)
        before = (self.root / 'dist/index.html').read_bytes()
        (self.root / 'dist/stale.jpg').write_bytes(b'unused')
        build_site(self.root)
        self.assertFalse((self.root / 'dist/stale.jpg').exists())
        self.assertEqual(before, (self.root / 'dist/index.html').read_bytes())

    def test_metadata_escaping_and_link_validation(self):
        self.write(self.project / 'project.json', {'id': 'first', 'title': '<script>alert(1)</script>', 'image': 'photo.png', 'description': '<b>Text</b>'})
        build_site(self.root)
        text = (self.root / 'dist/index.html').read_text()
        self.assertNotIn('<script>alert(1)</script>', text)
        self.assertIn('&lt;script&gt;', text)
        self.write(self.project / 'project.json', {'id': 'first', 'title': 'First', 'image': 'photo.png', 'link': 'javascript:alert(1)'})
        with self.assertRaisesRegex(BuildError, 'links must use'):
            build_site(self.root)

    def test_disabled_sections_and_description_file(self):
        self.write(self.page / '00-hidden/section.json', {'id': 'hidden', 'type': 'unknown', 'enabled': False})
        (self.project / 'description.md').write_text('A description from its own file.', encoding='utf-8')
        build_site(self.root)
        self.assertNotIn('id="hidden"', (self.root / 'dist/index.html').read_text())
        self.assertEqual(self.data()['projects'][0]['description'], 'A description from its own file.')

    def test_numeric_slug_gets_valid_prefix(self):
        self.assertEqual(slug('01-3d-study'), 'item-3d-study')


if __name__ == '__main__':
    unittest.main()
