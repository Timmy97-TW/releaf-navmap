#!/usr/bin/env python3
"""Export every place drawing as a transparent PNG, write the manifest, and build
the hand-over deck (our drawing on the left, a blank frame of the same size on the right).

    python3 build/export.py            # needs Google Chrome, python-pptx and Pillow

Writes exports/places/<slug>.png (1000 x 1000, transparent), exports/manifest.json
and exports/ReLEAF-navmap-places.pptx. A server must be running on
http://localhost:8864 serving the repository root (any static server will do).
"""
import json, os, subprocess, sys, time, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, 'exports'); PL = os.path.join(OUT, 'places')
os.makedirs(PL, exist_ok=True)
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
BASE = os.environ.get('NAVMAP_URL', 'http://localhost:8864')

def shot(url, out, size):
    subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--hide-scrollbars', '--default-background-color=00000000',
                    '--window-size=%d,%d' % size, '--virtual-time-budget=2500', '--screenshot=' + out, url],
                   capture_output=True, check=True)

def dump_dom(url):
    r = subprocess.run([CHROME, '--headless=new', '--disable-gpu', '--virtual-time-budget=2500', '--dump-dom', url], capture_output=True, text=True, check=True)
    return r.stdout

# 1. the manifest, from the page's own measurements
html = dump_dom(BASE + '/build/export.html?p=manifest')
start = html.index('<pre id="m">') + len('<pre id="m">'); end = html.index('</pre>', start)
import html as H
manifest = json.loads(H.unescape(html[start:end]))
raw = open(os.path.join(ROOT, 'assets', 'navmap', 'navmap-data.js')).read().split('window.NAVMAP_DATA = ', 1)[1].rstrip().rstrip(';')
data = json.loads(raw)
sections = {s['id']: s for s in data['sections']}
manifest['sections'] = data['sections']
manifest['note'] = ('Each PNG is one place drawn on a 1000 x 1000 transparent canvas, standing on the baseline y=940 and centred at x=500. '
                    'A hand-drawn replacement must use the same canvas, baseline and footprint; scale/tx/ty map the drawing units back onto the canvas.')
json.dump(manifest, open(os.path.join(OUT, 'manifest.json'), 'w'), indent=1)
print('manifest:', len(manifest['places']), 'places')

# 2. the PNGs
for slug in manifest['places']:
    shot(BASE + '/build/export.html?p=' + slug, os.path.join(PL, slug + '.png'), (1000, 1000))
    print('  ', slug)

# 3. the deck
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE, MSO_CONNECTOR
from pptx.enum.text import PP_ALIGN

def rgb(hexs): hexs = hexs.lstrip('#'); return RGBColor(int(hexs[0:2], 16), int(hexs[2:4], 16), int(hexs[4:6], 16))
prs = Presentation(); prs.slide_width = Inches(13.333); prs.slide_height = Inches(7.5)
blank = prs.slide_layouts[6]
INK = rgb('#171717'); GREY = rgb('#6b6b6b'); LINE = rgb('#d4d4d4')

def text(slide, x, y, w, h, s, size, bold=False, color=INK, align=PP_ALIGN.LEFT):
    tb = slide.shapes.add_textbox(x, y, w, h); tf = tb.text_frame; tf.word_wrap = True
    p = tf.paragraphs[0]; p.alignment = align; r = p.add_run(); r.text = s
    r.font.size = Pt(size); r.font.bold = bold; r.font.color.rgb = color; r.font.name = 'Inter'
    return tb

# title slide
s0 = prs.slides.add_slide(blank)
text(s0, Inches(.8), Inches(1.4), Inches(11.5), Inches(1.0), 'ReLEAF navigation map · the 27 places', 34, True)
text(s0, Inches(.8), Inches(2.7), Inches(11.5), Inches(3.4),
     'Every page of the wiki is a place in one painted valley. Each slide shows the current drawing on the left and an empty frame of exactly the same size on the right. '
     'Redraw the place in the right frame, in the style of the vision painting: flat shapes in two or three tones, no outlines, the sun high on the right (lit side right, shadow to the lower left), no words. '
     'Keep the thing standing on the dotted baseline and inside the frame; the frame is 1000 x 1000 and is exported as a transparent PNG at that size. '
     'The small label under each frame is the page the place stands for and what it must still be recognisable as.', 16, False, GREY)
text(s0, Inches(.8), Inches(6.4), Inches(11), Inches(.5), 'github.com/Timmy97-TW/releaf-navmap · exports/manifest.json holds the canvas, baseline and footprint of every place.', 12, False, GREY)

SIDE = Inches(5.3); TOP = Inches(1.35); LX = Inches(0.9); RX = Inches(13.333) - Inches(0.9) - SIDE; MID = Inches(13.333 / 2)
for slug, m in manifest['places'].items():
    sec = sections[m['section']]
    sl = prs.slides.add_slide(blank)
    # header
    text(sl, Inches(.9), Inches(.35), Inches(8), Inches(.4), sec['name'].upper(), 11, True, rgb(sec['ink']))
    text(sl, Inches(.9), Inches(.62), Inches(8), Inches(.6), m['name'], 26, True)
    # left: our drawing in a frame
    fr = sl.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, LX, TOP, SIDE, SIDE); fr.adjustments[0] = 0.03
    fr.fill.background(); fr.line.color.rgb = LINE; fr.line.width = Pt(1)
    sl.shapes.add_picture(os.path.join(PL, slug + '.png'), LX, TOP, SIDE, SIDE)
    text(sl, LX, TOP + SIDE + Inches(.06), SIDE, Inches(.3), 'Current drawing · drawn in code, AI-assisted', 11, False, GREY, PP_ALIGN.CENTER)
    # middle line
    ln = sl.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, MID, TOP - Inches(.1), MID, TOP + SIDE + Inches(.5)); ln.line.color.rgb = LINE; ln.line.width = Pt(1.25)
    # right: the empty frame, same size, with the baseline
    fr2 = sl.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, RX, TOP, SIDE, SIDE); fr2.adjustments[0] = 0.03
    fr2.fill.background(); fr2.line.color.rgb = rgb(sec['line']); fr2.line.width = Pt(1.5); fr2.line.dash_style = 4  # dash
    by = TOP + int(SIDE * (manifest['baseline'] / manifest['canvas']))
    bl = sl.shapes.add_connector(MSO_CONNECTOR.STRAIGHT, RX + Inches(.3), by, RX + SIDE - Inches(.3), by); bl.line.color.rgb = rgb(sec['line']); bl.line.width = Pt(1); bl.line.dash_style = 7  # round dot
    text(sl, RX, TOP + SIDE + Inches(.06), SIDE, Inches(.3), 'Your drawing · same frame, same baseline, no words', 11, False, rgb(sec['ink']), PP_ALIGN.CENTER)
    # footer: page and footprint
    text(sl, Inches(.9), Inches(7.08), Inches(11.5), Inches(.35), '/' + slug + '/ · 1000 x 1000 px, transparent · export the right frame as PNG with the same name: ' + slug + '.png', 10, False, GREY)
prs.save(os.path.join(OUT, 'ReLEAF-navmap-places.pptx'))
print('deck written')
