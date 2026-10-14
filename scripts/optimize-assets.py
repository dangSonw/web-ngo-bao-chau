"""Lossless runtime asset packing. Requires Pillow; archives originals outside Git."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import hashlib
import json
import re
import shutil
import sys
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'public/assets'
ARCHIVE = ROOT.parent / '_local-assets' / ROOT.name / 'originals'
DATA = [ROOT / 'src/data' / (section + 'Pages.json') for section in ('about', 'inquiry', 'community', 'spirituality')]
SOURCES = DATA + list((ROOT / 'src').rglob('*.jsx')) + list((ROOT / 'src').rglob('*.css'))

def references():
    text = '\n'.join(p.read_text(encoding='utf-8') for p in SOURCES)
    paths = set(re.findall(r'(?:/assets/)?((?:about|home|community|inquiry|spirituality|fonts)/[^\s"\'`{}]+\.(?:png|webp|svg|ttf|woff2))', text))
    # Home uses a template path for these four navigation outlines.
    paths.update(f'home/type/{name}.svg' for name in ('about', 'community', 'inquiry', 'spirituality'))
    return paths

def archive(path):
    relative = path.relative_to(ASSETS)
    target = ARCHIVE / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists():
        assert target.read_bytes() == path.read_bytes(), f'Archive conflict: {target}'
    else:
        shutil.copy2(path, target)

def convert(path):
    output = path.with_suffix('.webp')
    assert not output.exists(), f'Unexpected existing destination: {output}'
    with Image.open(path) as source:
        rgba = source.convert('RGBA')
        options = {'icc_profile': source.info['icc_profile']} if source.info.get('icc_profile') else {}
        rgba.save(output, 'WEBP', lossless=True, exact=True, method=6, **options)
        with Image.open(output) as packed:
            assert packed.size == source.size and packed.convert('RGBA').tobytes() == rgba.tobytes(), f'Pixel mismatch: {path}'
    if output.stat().st_size >= path.stat().st_size:
        output.unlink()
        return None
    return str(path.relative_to(ASSETS)).replace('\\', '/'), str(output.relative_to(ASSETS)).replace('\\', '/')

def main():
    used = references()
    assert all((ASSETS / name).is_file() for name in used), 'A source references a missing asset'
    if '--verify' in sys.argv:
        report = json.loads((ROOT / 'design/asset-optimization.json').read_text(encoding='utf-8'))
        for original, packed in report['mapping'].items():
            with Image.open(ARCHIVE / original) as source, Image.open(ASSETS / packed) as target:
                assert source.size == target.size
                assert source.convert('RGBA').tobytes() == target.convert('RGBA').tobytes(), original
                assert source.info.get('icc_profile') == target.info.get('icc_profile'), original
        print(f"Verified {len(used)} runtime references and {len(report['mapping'])} lossless conversions/aliases")
        return
    files = [p for p in ASSETS.rglob('*') if p.is_file()]
    unused = [p for p in files if p.suffix.lower() in ('.png', '.svg', '.webp') and p.relative_to(ASSETS).as_posix() not in used]
    before = sum(p.stat().st_size for p in files)
    if '--apply' not in sys.argv:
        print(json.dumps({'runtimeReferences': len(used), 'unused': [p.relative_to(ASSETS).as_posix() for p in unused], 'bytesBefore': before}, indent=2))
        return
    mapping = {}
    hashes = {}
    for name in sorted(used):
        path = ASSETS / name
        if path.suffix == '.png':
            key = hashlib.sha256(path.read_bytes()).hexdigest()
            if key in hashes:
                mapping[name] = hashes[key]
            else:
                hashes[key] = name
    originals = [ASSETS / name for name in used if name.endswith('.png') and name not in mapping]
    with ThreadPoolExecutor(max_workers=4) as executor:
        for result in executor.map(convert, originals):
            if result:
                old, new = result
                mapping[old] = new
                print(f'{old} -> {new}', flush=True)
    for old, new in list(mapping.items()):
        mapping[old] = mapping.get(new, new)
    for path in SOURCES:
        text = path.read_text(encoding='utf-8')
        updated = text
        for old, new in mapping.items():
            updated = updated.replace(old, new)
        if updated != text:
            path.write_text(updated, encoding='utf-8')
    # Keep the export manifest accurate while retaining original Figma provenance.
    manifest = ASSETS / 'manifest.json'
    data = json.loads(manifest.read_text(encoding='utf-8'))
    def remap(value):
        if isinstance(value, str):
            for old, new in mapping.items():
                value = value.replace(old, new)
            return value
        if isinstance(value, list):
            return [remap(v) for v in value]
        if isinstance(value, dict):
            return {k: remap(v) for k, v in value.items()}
        return value
    data = remap(data)
    def describe(value):
        if isinstance(value, list):
            for child in value:
                describe(child)
        if isinstance(value, dict):
            name = value.get('path')
            if isinstance(name, str) and (ASSETS / name).is_file():
                if ASSETS / name in unused:
                    value['originalPath'] = name
                    value['archived'] = True
                    value['path'] = None
                else:
                    value['bytes'] = (ASSETS / name).stat().st_size
                    if name.endswith('.webp'):
                        value['exportFormat'] = 'WEBP_LOSSLESS'
            for child in value.values():
                if isinstance(child, (dict, list)):
                    describe(child)
    describe(data)
    manifest.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    for path in unused + [ASSETS / old for old in mapping]:
        archive(path)
        path.unlink()
    assert all((ASSETS / name).is_file() for name in references())
    after = sum(p.stat().st_size for p in ASSETS.rglob('*') if p.is_file())
    report = {'beforeBytes': before, 'afterBytes': after, 'savedBytes': before - after, 'mapping': mapping,
              'unusedArchived': [p.relative_to(ASSETS).as_posix() for p in unused],
              'originalArchive': str(ARCHIVE), 'conversion': 'WebP lossless, same dimensions, RGBA pixels verified byte for byte; ICC preserved'}
    (ROOT / 'design/asset-optimization.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: v for k, v in report.items() if k not in ('mapping', 'unusedArchived')}, indent=2))

if __name__ == '__main__':
    main()
