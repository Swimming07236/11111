from pathlib import Path
from zipfile import ZipFile
from lxml import etree as E
from PIL import Image, ImageDraw, ImageFont
import io
import json
import math
import numpy as np
import re

ROOT = Path(__file__).resolve().parent.parent
SOURCE = next(p for p in (ROOT / '沉沦者的黑流树海PPT模板').glob('*.pptx') if '无平滑' not in p.name and not p.name.startswith('~'))
DEST = ROOT / 'public/assets/chapters'
QA = ROOT / 'qa/ppt-inspection'
DEST.mkdir(parents=True, exist_ok=True)
QA.mkdir(parents=True, exist_ok=True)
NS = {'a': 'http://schemas.openxmlformats.org/drawingml/2006/main', 'p': 'http://schemas.openxmlformats.org/presentationml/2006/main', 'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
UNIT = 9525
CHAPTERS = [('home', 4, '玻利瓦尔肤层'), ('fiction', 9, '甜美的伤口'), ('science-fiction', 14, '血色空脉'), ('arts', 18, '受害者腐殖'), ('daily', 21, '卡德霍之颅')]


def translation(x, y):
    return np.array([[1., 0, x], [0, 1., y], [0, 0, 1.]])


def transform(xfrm, grouped=False):
    if xfrm is None:
        return np.eye(3), 1, 1
    off, ext = xfrm.find('a:off', NS), xfrm.find('a:ext', NS)
    x, y = float(off.get('x')), float(off.get('y'))
    w, h = float(ext.get('cx')), float(ext.get('cy'))
    angle = float(xfrm.get('rot', 0)) / 60000 * math.pi / 180
    c, s = math.cos(angle), math.sin(angle)
    rotate = np.array([[c, -s, 0], [s, c, 0], [0, 0, 1.]])
    flip = np.diag([-1 if xfrm.get('flipH') == '1' else 1, -1 if xfrm.get('flipV') == '1' else 1, 1])
    matrix = translation(x + w / 2, y + h / 2) @ rotate @ flip @ translation(-w / 2, -h / 2)
    if grouped:
        child_off, child_ext = xfrm.find('a:chOff', NS), xfrm.find('a:chExt', NS)
        matrix = matrix @ np.diag([w / float(child_ext.get('cx')), h / float(child_ext.get('cy')), 1]) @ translation(-float(child_off.get('x')), -float(child_off.get('y')))
    return matrix, w, h


def color(element, fallback='#000000'):
    if element is None:
        return fallback, 1
    rgb = element.find('.//a:srgbClr', NS)
    scheme = element.find('.//a:schemeClr', NS)
    if rgb is not None:
        value = '#' + rgb.get('val')
    elif scheme is not None:
        value = {'bg1': '#ffffff', 'tx1': '#000000', 'lt1': '#ffffff', 'dk1': '#000000'}.get(scheme.get('val'), fallback)
    else:
        value = fallback
    alpha = element.find('.//a:alpha', NS)
    return value, float(alpha.get('val')) / 100000 if alpha is not None else 1


def shape_svg(pr, width, height):
    defs = []
    def paint(parent, name):
        if parent is None or parent.find('a:noFill', NS) is not None:
            return 'none', 1
        grad = parent.find('a:gradFill', NS)
        if grad is not None:
            stops = []
            for stop in sorted(grad.findall('a:gsLst/a:gs', NS), key=lambda e: int(e.get('pos'))):
                shade, alpha = color(stop)
                stops.append(f'<stop offset="{int(stop.get("pos"))/1000}%" stop-color="{shade}" stop-opacity="{alpha}"/>')
            defs.append(f'<linearGradient id="{name}" x1="0" y1="0" x2="0" y2="1">{"".join(stops)}</linearGradient>')
            return f'url(#{name})', 1
        return color(parent.find('a:solidFill', NS), 'none')
    fill, fill_alpha = paint(pr, 'fill')
    line = pr.find('a:ln', NS)
    stroke, stroke_alpha = paint(line, 'stroke')
    attrs = f'fill="{fill}" fill-opacity="{fill_alpha}" stroke="{stroke}" stroke-opacity="{stroke_alpha}" stroke-width="{line.get("w",12700) if line is not None else 0}"'
    geom = pr.find('a:prstGeom', NS)
    custom = pr.find('a:custGeom', NS)
    body = ''
    if geom is not None:
        kind = geom.get('prst')
        if kind == 'ellipse':
            body = f'<ellipse cx="{width/2}" cy="{height/2}" rx="{width/2}" ry="{height/2}" {attrs}/>'
        elif kind == 'line':
            body = f'<path d="M0 0 L{width} {height}" {attrs}/>'
        elif kind == 'trapezoid':
            body = f'<path d="M{width*.13} 0 H{width*.87} L{width} {height} H0 Z" {attrs}/>'
        else:
            body = f'<rect width="{width}" height="{height}" {attrs}/>'
    elif custom is not None:
        for path in custom.findall('a:pathLst/a:path', NS):
            commands = []
            for command in path:
                tag = E.QName(command).localname
                points = command.findall('a:pt', NS)
                coords = ' '.join(f'{pt.get("x")} {pt.get("y")}' for pt in points)
                if tag in ['moveTo', 'lnTo', 'cubicBezTo', 'quadBezTo']:
                    commands.append({'moveTo': 'M', 'lnTo': 'L', 'cubicBezTo': 'C', 'quadBezTo': 'Q'}[tag] + coords)
                elif tag == 'close':
                    commands.append('Z')
            pw, ph = float(path.get('w', width)), float(path.get('h', height))
            body += f'<path transform="scale({width/pw},{height/ph})" d="{" ".join(commands)}" {attrs}/>'
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {width} {height}"><defs>{"".join(defs)}</defs>{body}</svg>'


manifest = {}
with ZipFile(SOURCE) as archive:
    for slug, slide, title in CHAPTERS:
        root = E.fromstring(archive.read(f'ppt/slides/slide{slide}.xml'))
        rels = E.fromstring(archive.read(f'ppt/slides/_rels/slide{slide}.xml.rels'))
        refs = {r.get('Id'): r.get('Target').replace('../', 'ppt/') for r in rels}
        layers = []
        def visit(tree, parent=np.eye(3)):
            for node in tree:
                kind = E.QName(node).localname
                if kind == 'grpSp':
                    group, _, _ = transform(node.find('p:grpSpPr/a:xfrm', NS), True)
                    visit(node, parent @ group)
                elif kind in ['pic', 'sp', 'cxnSp']:
                    if node.xpath('.//a:t', namespaces=NS):
                        continue
                    pr = node.find('p:spPr', NS)
                    if pr is None or pr.find('a:xfrm', NS) is None:
                        continue
                    # These rectangles are the template's color swatches, not chapter illustrations.
                    geom = pr.find('a:prstGeom', NS)
                    if slug == 'daily' and kind == 'sp' and geom is not None and geom.get('prst') == 'rect':
                        continue
                    local, width, height = transform(pr.find('a:xfrm', NS))
                    matrix = parent @ local @ np.diag([width, height, 1])
                    matrix[:2, :] /= UNIT
                    image = None
                    media = None
                    index = len(layers)
                    if kind == 'pic':
                        blip = node.find('.//a:blip', NS)
                        media = refs[blip.get('{'+NS['r']+'}embed')]
                        image = Image.open(io.BytesIO(archive.read(media))).convert('RGBA')
                        crop = node.find('p:blipFill/a:srcRect', NS)
                        crop_values = [float(crop.get(k, 0))/100000 if crop is not None else 0 for k in ['l', 't', 'r', 'b']]
                        if any(crop_values):
                            l, t, r, b = crop_values
                            image = image.crop((round(image.width*l), round(image.height*t), round(image.width*(1-r)), round(image.height*(1-b))))
                        filename = f'{slug}-{index:02}.png'
                        image.save(DEST / filename, optimize=True)
                    else:
                        filename = f'{slug}-{index:02}.svg'
                        (DEST / filename).write_text(shape_svg(pr, width, height), encoding='utf-8')
                    opacity = node.find('.//a:alphaModFix', NS)
                    layer = {'src': '/assets/chapters/' + filename, 'matrix': [round(float(matrix[a,b]), 5) for a,b in [(0,0),(1,0),(0,1),(1,1),(0,2),(1,2)]], 'opacity': int(opacity.get('amt'))/100000 if opacity is not None and opacity.get('amt') else 1, 'source': media or 'native vector', 'id': node.xpath('.//p:cNvPr/@id', namespaces=NS)[0]}
                    layers.append(layer)
        visit(root.find('p:cSld/p:spTree', NS))
        manifest[slug] = {'title': title, 'slide': slide, 'width': 1280, 'height': 720, 'layers': layers}
        # Raster inspection of original picture placement, without changing the source artwork.
        canvas = Image.new('RGBA', (1280,720), '#000000')
        for layer in layers:
            if not layer['src'].endswith('.png'):
                continue
            im = Image.open(ROOT / 'public' / layer['src'].lstrip('/')).convert('RGBA')
            a,b,c,d,e,f = layer['matrix']
            m = np.array([[a/im.width,c/im.height,e],[b/im.width,d/im.height,f],[0,0,1]])
            inv = np.linalg.inv(m)
            rendered = im.transform((1280,720), Image.Transform.AFFINE, tuple(inv[:2].flatten()), Image.Resampling.BICUBIC)
            if layer['opacity'] < 1:
                rendered.putalpha(rendered.getchannel('A').point(lambda p: int(p*layer['opacity'])))
            canvas = Image.alpha_composite(canvas,rendered)
        canvas.convert('RGB').save(QA / f'{slug}-source.png')
        print(slug, 'slide', slide, 'layers',len(layers))
(DEST / 'scenes.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
used = {Path(layer['src']).name for scene in manifest.values() for layer in scene['layers']}
for asset in DEST.iterdir():
    if re.fullmatch(r'(home|fiction|science-fiction|arts|daily)-\d{2}\.(png|svg)', asset.name) and asset.name not in used:
        asset.unlink()
