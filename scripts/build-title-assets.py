from pathlib import Path
import re
from fontTools import subset
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parent.parent
DEST = ROOT / 'public/assets/fonts'
DEST.mkdir(parents=True, exist_ok=True)
source = (ROOT / 'public/content.js').read_text(encoding='utf-8')
chinese = re.search(r"title: '([^']+)'", source).group(1)
voynich = next((ROOT / '沉沦者的黑流树海PPT模板').rglob('voynich-1.ttf'))

for path, filename, text in [
    (voynich, 'voynich.woff2', None),
    (Path('C:/Windows/Fonts/STKAITI.TTF'), 'manuscript-zh.woff2', chinese),
]:
    font = TTFont(path)
    options = subset.Options()
    options.flavor = 'woff2'
    subsetter = subset.Subsetter(options=options)
    subsetter.populate(unicodes=font.getBestCmap().keys() if text is None else [ord(c) for c in text])
    subsetter.subset(font)
    font.flavor = 'woff2'
    font.save(DEST / filename)
    print(filename, (DEST / filename).stat().st_size, 'bytes')
