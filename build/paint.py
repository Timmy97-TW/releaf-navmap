"""Paint the navigation picture in the manner of the student's valley (the
homepage #vision painting): flat shapes in two or three tones, dry-brush
edges, no outlines, her olive / ochre / lime / blue-grey palette.

    python paint.py "<folder with the five vision PNGs>" <out dir>

Writes, per option (a, b, c):
    plate.webp            the ground: her sky and ridge, the near plain, shadows
    <key>.webp            one sprite per clickable thing, cut to its own box
    <key>-day.webp        (option c only) the same sprite in daylight, shown on hover
and layout.js: every sprite's box, a hit outline, and the picture size.

The ground is her painting. Everything standing on it is drawn by code after
her style (AI-assisted, not hers), and the page must say so.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont
from scipy import ndimage
from scipy.spatial import ConvexHull

sys.path.insert(0, str(Path(__file__).parent))
from vision_details import Painter  # noqa: E402

SRC = Path(sys.argv[1])
OUT = Path(sys.argv[2])
FONT = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"

# her colours, sampled from the painting (see build/safe-route.py)
PALE = (178, 178, 122); PALE_L = (192, 190, 134); OLIVE = (152, 168, 96)
SOIL = (122, 90, 42); SOIL_L = (150, 116, 64)
GREEN_D = (56, 102, 46); GREEN_M = (92, 146, 62); GREEN_L = (128, 178, 80)
ROAD = (172, 140, 88); ROAD_D = (138, 106, 58)
SHADOW = (118, 132, 120)
SKIN = (214, 170, 130); SKIN_D = (188, 140, 104)


# ------------------------------------------------------------ the ground ----
def desun(img):
    """Her sky without the disc (from build/safe-route.py)."""
    h, w = img.shape[:2]
    lum = img.mean(-1)
    top = lum[:60].mean(0)
    below = lum < (top - 28)[None, :]
    first = np.where(below.any(0), below.argmax(0), h)
    yy_, xx_ = np.mgrid[0:h, 0:w]
    sky = yy_ < first[None, :]
    hot = (lum >= 250) & sky
    lab, n = ndimage.label(hot)
    if not n:
        return img
    k = 1 + int(np.argmax(ndimage.sum(hot, lab, range(1, n + 1))))
    ys, xs = np.where(lab == k)
    cx, cy = xs.mean(), ys.mean()
    r = max(np.ptp(xs), np.ptp(ys)) / 2
    d = np.hypot(xx_ - cx, yy_ - cy)
    glow = (d < r * 5.0) & sky
    keep = (d > r * 6.2) & sky
    out = img.copy()
    for y in range(h):
        if not glow[y].any():
            continue
        s = img[y][keep[y]]
        if len(s) < 24:
            continue
        out[y][glow[y]] = np.median(s, axis=0)
    a = ndimage.gaussian_filter(np.clip((r * 5.0 - d) / (r * 1.3), 0, 1) * sky, 11)[..., None]
    return img * (1 - a) + out * a


VALLEY = desun(np.asarray(Image.open(SRC / "Zoomed out w_o green dots.PNG").convert("RGB"), dtype=np.float64))


def ground(W, H, y0):
    """A W x H window of her valley, her row y0 at the top."""
    K = W / VALLEY.shape[1]
    crop = Image.fromarray(VALLEY[y0:y0 + int(round(H / K))].astype(np.uint8)).resize((W, H), Image.LANCZOS)
    return np.asarray(crop, dtype=np.float64).copy()


# ------------------------------------------------------- sprite painter ----
class Sprite(Painter):
    """Paints onto a transparent canvas: premultiplied colour plus coverage.
    `emit=True` marks what still shines at dusk (screens, the culture)."""

    def __init__(self, W, H):
        super().__init__(np.zeros((H, W, 3)), 0, 0, 1)
        self.a = np.zeros((H, W))
        self.e = np.zeros((H, W))

    def poly(self, pts, color, rough=0.45, alpha=1.0, mul=False, light=None, width=None, closed=True, emit=False):
        r = self._mask(pts, rough, closed, width)
        if r is None:
            return
        a, (bx0, by0, bx1, by1) = r
        a = a * alpha
        col = np.asarray(color, dtype=np.float64)
        self.c[by0:by1, bx0:bx1] = self.c[by0:by1, bx0:bx1] * (1 - a[..., None]) + col * a[..., None]
        self.a[by0:by1, bx0:bx1] = self.a[by0:by1, bx0:bx1] * (1 - a) + a
        e = self.e[by0:by1, bx0:bx1]
        self.e[by0:by1, bx0:bx1] = e * (1 - a) + (a if emit else 0)

    def text(self, s, cx, cy, size, color, rot=0.0):
        im = Image.new("L", (int(size * len(s) * 1.2) + 20, int(size * 2)), 0)
        d = ImageDraw.Draw(im)
        f = ImageFont.truetype(FONT, int(size))
        bb = d.textbbox((0, 0), s, font=f)
        d.text(((im.width - (bb[2] - bb[0])) / 2 - bb[0], (im.height - (bb[3] - bb[1])) / 2 - bb[1]), s, fill=255, font=f)
        im = im.rotate(np.degrees(-rot), resample=Image.BICUBIC, expand=True)
        x0, y0 = int(round(cx - im.width / 2)), int(round(cy - im.height / 2))
        a = np.asarray(im, dtype=np.float64) / 255
        sl = (slice(y0, y0 + im.height), slice(x0, x0 + im.width))
        col = np.asarray(color, dtype=np.float64)
        self.c[sl] = self.c[sl] * (1 - a[..., None]) + col * a[..., None]
        self.a[sl] = self.a[sl] * (1 - a) + a

    def rgba(self, grade=None):
        rgb = self.c / np.maximum(self.a, 1e-6)[..., None]
        if grade is not None:
            rgb = grade(rgb) * (1 - self.e[..., None]) + rgb * self.e[..., None]
        return np.dstack([np.clip(rgb, 0, 255), np.clip(self.a * 255, 0, 255)]).astype(np.uint8)


def rect(x0, y0, x1, y1):
    return [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]


def rot(pts, cx, cy, ang):
    c, s = np.cos(ang), np.sin(ang)
    return [(cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c) for x, y in pts]


# --------------------------------------------------------------- things ----
def field(P, top, bot, x0t, x1t, x0b, x1b, rows, seed=3):
    """A crop field seen at a slant: soil, furrows, and rows of plants that
    grow as they come nearer."""
    rng = np.random.default_rng(seed)
    P.poly([(x0t, top), (x1t, top), (x1b, bot), (x0b, bot)], SOIL_L, rough=2.2)
    for i in range(rows):
        t = (i + 0.5) / rows
        tt = t ** 1.25
        y = top + (bot - top) * tt
        xl = x0t + (x0b - x0t) * tt + 14
        xr = x1t + (x1b - x1t) * tt - 14
        s = 0.42 + 1.0 * tt
        P.stroke([(xl, y + 9 * s), (xr, y + 9 * s)], 7 * s, SOIL, rough=1.2, alpha=0.55)
        n = int((xr - xl) / (38 * s))
        step = (xr - xl) / max(n, 1)
        for j in range(n):
            cx = xl + step * (j + 0.5) + rng.normal(0, 2 * s)
            cy = y + rng.normal(0, 1.2 * s)
            k = s * (0.9 + 0.2 * rng.random())
            P.ellipse(cx, cy, 15 * k, 9 * k, GREEN_D, rough=0.7, n=11)
            P.ellipse(cx + 4 * k, cy - 4 * k, 8 * k, 5.5 * k, GREEN_M, rough=0.5, n=9)
            P.ellipse(cx - 3 * k, cy - 8 * k, 5.5 * k, 7 * k, GREEN_L, rough=0.4, n=9)


def shadow(G, cx, cy, rx, ry, alpha=0.6):
    G.ellipse(cx, cy, rx, ry, SHADOW, mul=True, alpha=alpha, rough=1.0)


def farmer(P, x, y, h):
    """A farmer in a conical hat, a hoe in one hand, the other raised."""
    trousers, shirt, shirt_d = (58, 64, 82), (76, 108, 160), (60, 88, 136)
    # hoe, behind the body
    P.stroke([(x - 0.34 * h, y - 0.82 * h), (x - 0.17 * h, y - 0.02 * h)], 0.03 * h, (126, 96, 60), rough=0.15)
    P.poly([(x - 0.24 * h, y - 0.05 * h), (x - 0.08 * h, y - 0.04 * h), (x - 0.09 * h, y + 0.02 * h), (x - 0.23 * h, y + 0.01 * h)], (100, 104, 108), rough=0.2)
    for d in (-1, 1):
        P.poly([(x + d * 0.015 * h, y - 0.43 * h), (x + d * 0.135 * h, y - 0.43 * h), (x + d * 0.125 * h, y - 0.03 * h), (x + d * 0.025 * h, y - 0.03 * h)], trousers, rough=0.25)
        P.ellipse(x + d * 0.08 * h, y - 0.015 * h, 0.07 * h, 0.03 * h, (74, 58, 44), rough=0.2)
    P.poly([(x - 0.175 * h, y - 0.76 * h), (x + 0.175 * h, y - 0.76 * h), (x + 0.17 * h, y - 0.4 * h), (x - 0.17 * h, y - 0.4 * h)], shirt, rough=0.35)
    P.poly([(x + 0.07 * h, y - 0.76 * h), (x + 0.175 * h, y - 0.76 * h), (x + 0.17 * h, y - 0.4 * h), (x + 0.09 * h, y - 0.4 * h)], shirt_d, rough=0.3)
    P.stroke([(x - 0.19 * h, y - 0.72 * h), (x - 0.25 * h, y - 0.48 * h)], 0.085 * h, shirt, rough=0.2)
    P.ellipse(x - 0.25 * h, y - 0.46 * h, 0.042 * h, 0.042 * h, SKIN, rough=0.2, n=10)
    P.stroke([(x + 0.19 * h, y - 0.72 * h), (x + 0.32 * h, y - 0.84 * h), (x + 0.34 * h, y - 0.97 * h)], 0.085 * h, shirt, rough=0.2)
    P.ellipse(x + 0.345 * h, y - 1.0 * h, 0.045 * h, 0.05 * h, SKIN, rough=0.2, n=10)
    P.ellipse(x, y - 0.845 * h, 0.1 * h, 0.105 * h, SKIN, rough=0.25, n=14)
    P.ellipse(x + 0.04 * h, y - 0.83 * h, 0.05 * h, 0.07 * h, SKIN_D, rough=0.2, alpha=0.5, n=10)
    for d in (-1, 1):
        P.ellipse(x + d * 0.035 * h, y - 0.84 * h, 0.011 * h, 0.013 * h, (64, 48, 40), rough=0.05, n=8)
    P.stroke([(x - 0.03 * h, y - 0.8 * h), (x, y - 0.79 * h), (x + 0.03 * h, y - 0.8 * h)], 0.009 * h, (150, 92, 72), rough=0.05)
    P.poly([(x - 0.31 * h, y - 0.885 * h), (x + 0.31 * h, y - 0.885 * h), (x, y - 1.13 * h)], (226, 200, 134), rough=0.3)
    P.poly([(x - 0.31 * h, y - 0.885 * h), (x - 0.02 * h, y - 0.885 * h), (x, y - 1.13 * h)], (238, 218, 162), rough=0.25)
    P.poly([(x - 0.31 * h, y - 0.885 * h), (x + 0.31 * h, y - 0.885 * h), (x + 0.21 * h, y - 0.85 * h), (x - 0.21 * h, y - 0.85 * h)], (186, 158, 98), rough=0.2)


def student(P, x, y, h):
    """A student in an open lab coat over the team's green ReLEAF shirt."""
    coat, coat_d = (242, 242, 234), (212, 216, 208)
    shirt = (58, 124, 72)
    for d in (-1, 1):
        P.poly([(x + d * 0.015 * h, y - 0.45 * h), (x + d * 0.12 * h, y - 0.45 * h), (x + d * 0.115 * h, y - 0.03 * h), (x + d * 0.025 * h, y - 0.03 * h)], (52, 60, 84), rough=0.25)
        P.ellipse(x + d * 0.075 * h, y - 0.015 * h, 0.07 * h, 0.03 * h, (66, 66, 72), rough=0.2)
    P.poly([(x - 0.2 * h, y - 0.77 * h), (x + 0.2 * h, y - 0.77 * h), (x + 0.235 * h, y - 0.3 * h), (x - 0.235 * h, y - 0.3 * h)], coat, rough=0.35)
    P.poly([(x + 0.1 * h, y - 0.77 * h), (x + 0.2 * h, y - 0.77 * h), (x + 0.235 * h, y - 0.3 * h), (x + 0.12 * h, y - 0.3 * h)], coat_d, rough=0.3)
    P.poly([(x - 0.095 * h, y - 0.77 * h), (x + 0.095 * h, y - 0.77 * h), (x + 0.085 * h, y - 0.32 * h), (x - 0.085 * h, y - 0.32 * h)], shirt, rough=0.3)
    P.text("ReLEAF", x, y - 0.635 * h, 0.034 * h, (236, 244, 220))
    P.poly([(x, y - 0.48 * h), (x - 0.04 * h, y - 0.525 * h), (x - 0.01 * h, y - 0.57 * h)], (176, 214, 110), rough=0.15)
    P.poly([(x, y - 0.48 * h), (x + 0.04 * h, y - 0.525 * h), (x + 0.01 * h, y - 0.57 * h)], (150, 196, 92), rough=0.15)
    P.poly([(x - 0.095 * h, y - 0.77 * h), (x - 0.04 * h, y - 0.77 * h), (x - 0.09 * h, y - 0.68 * h)], coat, rough=0.15)
    P.poly([(x + 0.095 * h, y - 0.77 * h), (x + 0.04 * h, y - 0.77 * h), (x + 0.09 * h, y - 0.68 * h)], coat_d, rough=0.15)
    P.stroke([(x - 0.21 * h, y - 0.73 * h), (x - 0.27 * h, y - 0.44 * h)], 0.09 * h, coat, rough=0.2)
    P.ellipse(x - 0.27 * h, y - 0.42 * h, 0.042 * h, 0.042 * h, SKIN, rough=0.2, n=10)
    P.stroke([(x + 0.21 * h, y - 0.73 * h), (x + 0.27 * h, y - 0.56 * h), (x + 0.15 * h, y - 0.5 * h)], 0.09 * h, coat_d, rough=0.2)
    P.ellipse(x, y - 0.865 * h, 0.1 * h, 0.11 * h, SKIN, rough=0.25, n=14)
    P.poly([(x - 0.105 * h, y - 0.85 * h), (x - 0.11 * h, y - 0.93 * h), (x - 0.06 * h, y - 0.985 * h), (x + 0.04 * h, y - 0.99 * h),
            (x + 0.105 * h, y - 0.94 * h), (x + 0.105 * h, y - 0.86 * h), (x + 0.07 * h, y - 0.91 * h), (x - 0.03 * h, y - 0.92 * h), (x - 0.08 * h, y - 0.88 * h)],
           (58, 44, 36), rough=0.3)
    for d in (-1, 1):
        P.ellipse(x + d * 0.037 * h, y - 0.86 * h, 0.011 * h, 0.013 * h, (64, 48, 40), rough=0.05, n=8)
    P.stroke([(x - 0.03 * h, y - 0.815 * h), (x, y - 0.805 * h), (x + 0.03 * h, y - 0.815 * h)], 0.009 * h, (150, 92, 72), rough=0.05)


def notebook(P, x, y, h):
    """The notebook in the student's hand (h is the student's height)."""
    cx, cy, a = x + 0.17 * h, y - 0.54 * h, -0.16
    w, t = 0.17 * h, 0.22 * h
    P.poly(rot(rect(cx - w / 2 + 0.012 * h, cy - t / 2 + 0.01 * h, cx + w / 2 + 0.012 * h, cy + t / 2 + 0.01 * h), cx, cy, a), (246, 238, 214), rough=0.2)
    P.poly(rot(rect(cx - w / 2, cy - t / 2, cx + w / 2, cy + t / 2), cx, cy, a), (206, 88, 54), rough=0.25)
    P.poly(rot(rect(cx - w / 2, cy - t / 2, cx - w / 2 + 0.025 * h, cy + t / 2), cx, cy, a), (168, 64, 40), rough=0.15)
    P.poly(rot(rect(cx - 0.04 * h, cy - 0.07 * h, cx + 0.06 * h, cy - 0.03 * h), cx, cy, a), (246, 238, 214), rough=0.12)
    P.ellipse(x + 0.14 * h, y - 0.5 * h, 0.04 * h, 0.04 * h, SKIN, rough=0.2, n=10)


def reactor_body(P, x, y, h):
    """Her reactor, bigger: a green cabinet seen three-quarter on, the
    culture glowing through its window."""
    w = 0.7 * h
    dx, dy = 0.24 * w, -0.11 * w
    P.poly([(x + w / 2, y), (x + w / 2, y - h), (x + w / 2 + dx, y - h + dy), (x + w / 2 + dx, y + dy)], (40, 98, 62), rough=0.5)
    P.poly([(x - w / 2, y - h), (x + w / 2, y - h), (x + w / 2 + dx, y - h + dy), (x - w / 2 + dx, y - h + dy)], (96, 166, 108), rough=0.45)
    P.poly(rect(x - w / 2, y - h, x + w / 2, y), (64, 138, 86), rough=0.5)
    P.poly(rect(x - w / 2, y - 0.06 * h, x + w / 2, y), (46, 106, 66), rough=0.3)
    wx0, wx1, wy0, wy1 = x - 0.37 * w, x + 0.17 * w, y - 0.88 * h, y - 0.16 * h
    P.poly(rect(wx0 - 0.02 * w, wy0 - 0.02 * w, wx1 + 0.02 * w, wy1 + 0.02 * w), (52, 118, 74), rough=0.3)
    P.poly(rect(wx0, wy0, wx1, wy1), (150, 210, 162), rough=0.35, emit=True)
    P.ellipse((wx0 + wx1) / 2, (wy0 + wy1) / 2, 0.24 * w, 0.3 * h, (198, 240, 200), rough=0.8, alpha=0.55, emit=True)
    for vx in (wx0 + 0.13 * w, wx0 + 0.36 * w):
        P.poly(rect(vx - 0.07 * w, wy0 + 0.14 * h, vx + 0.07 * w, wy1 - 0.05 * h), (214, 240, 214), rough=0.3, emit=True)
        P.poly(rect(vx - 0.065 * w, wy0 + 0.33 * h, vx + 0.065 * w, wy1 - 0.055 * h), (170, 214, 96), rough=0.35, emit=True)
        P.poly(rect(vx - 0.08 * w, wy0 + 0.11 * h, vx + 0.08 * w, wy0 + 0.15 * h), (120, 150, 136), rough=0.15)
    P.stroke([(wx0 + 0.13 * w, wy0 + 0.11 * h), (wx0 + 0.13 * w, wy0 + 0.05 * h), (wx0 + 0.36 * w, wy0 + 0.05 * h), (wx0 + 0.36 * w, wy0 + 0.11 * h)],
             0.018 * w, (236, 170, 90), rough=0.2)
    for i in range(4):
        vy = y - 0.3 * h + i * 0.045 * h
        P.stroke([(x + 0.25 * w, vy), (x + 0.43 * w, vy)], 0.018 * w, (46, 106, 66), rough=0.2)
    P.ellipse(x + 0.3 * w, y - 0.48 * h, 0.035 * w, 0.035 * w, (210, 226, 200), rough=0.1, n=10)
    P.ellipse(x + 0.39 * w, y - 0.48 * h, 0.035 * w, 0.035 * w, (230, 180, 80), rough=0.1, n=10, emit=True)


def reactor_screen(P, x, y, h):
    """The small tilted screen on top, a chart on it, as in her drawing."""
    w = 0.7 * h
    top = y - h - 0.05 * w
    P.stroke([(x - 0.1 * w, top + 0.03 * w), (x - 0.1 * w, top - 0.04 * w)], 0.05 * w, (40, 86, 58), rough=0.1)
    fr = [(x - 0.4 * w, top), (x + 0.2 * w, top), (x + 0.25 * w, top - 0.38 * w), (x - 0.35 * w, top - 0.38 * w)]
    P.poly(fr, (36, 80, 54), rough=0.3)
    sc = [(x - 0.36 * w, top - 0.035 * w), (x + 0.16 * w, top - 0.035 * w), (x + 0.205 * w, top - 0.345 * w), (x - 0.315 * w, top - 0.345 * w)]
    P.poly(sc, (24, 50, 42), rough=0.2, emit=True)
    pts = [(-0.3, 0.09), (-0.2, 0.13), (-0.1, 0.12), (0.0, 0.2), (0.08, 0.22), (0.16, 0.3)]
    P.stroke([(x + px * w, top - py * w) for px, py in pts], 0.02 * w, (176, 236, 120), rough=0.1, emit=True)
    P.stroke([(x - 0.31 * w, top - 0.065 * w), (x + 0.15 * w, top - 0.065 * w)], 0.008 * w, (90, 140, 110), rough=0.05, emit=True)


def reactor_label(P, x, y, h):
    """The biohazard warning label on the cabinet's front."""
    w = 0.7 * h
    cx, cy, r = x + 0.34 * w, y - 0.7 * h, 0.115 * w
    tri = [(cx, cy - r), (cx + 0.92 * r, cy + 0.66 * r), (cx - 0.92 * r, cy + 0.66 * r)]
    P.poly(tri, (246, 204, 58), rough=0.3)
    ink = (52, 46, 36)
    for ang in (-np.pi / 2, np.pi / 6, 5 * np.pi / 6):
        P.ellipse(cx + np.cos(ang) * 0.2 * r, cy + 0.12 * r + np.sin(ang) * 0.2 * r, 0.17 * r, 0.17 * r, ink, rough=0.05, n=12)
    P.ellipse(cx, cy + 0.12 * r, 0.08 * r, 0.08 * r, (246, 204, 58), rough=0.0, n=10)


# ----------------------------------------------------------------- scenes ----
def plain(G, W, H, y_top, tone=PALE):
    """Her near plain painted over the lower part of the valley."""
    G.poly([(-20, y_top + 8), (W * 0.3, y_top), (W * 0.62, y_top + 6), (W + 20, y_top - 2), (W + 20, H + 20), (-20, H + 20)], tone, rough=1.6)
    G.poly([(-20, y_top + 8), (W * 0.3, y_top), (W * 0.45, y_top + 30), (-20, y_top + 44)], PALE_L, rough=1.4, alpha=0.8)
    G.poly([(W * 0.55, H * 0.86), (W + 20, H * 0.82), (W + 20, H + 20), (W * 0.5, H + 20)], OLIVE, rough=1.6, alpha=0.5)
    rng = np.random.default_rng(W + H)
    for _ in range(9):
        cx, cy = rng.uniform(0.35, 1.0) * W, y_top + rng.uniform(0.08, 0.5) * (H - y_top)
        w, d = rng.uniform(90, 220), rng.uniform(16, 34) * (0.6 + (cy - y_top) / (H - y_top))
        col = [OLIVE, PALE_L, (170, 160, 104), (160, 172, 100)][int(rng.integers(4))]
        G.poly([(cx - w, cy), (cx + w * 0.9, cy - 4), (cx + w, cy + d), (cx - w * 1.05, cy + d + 3)], col, rough=1.4, alpha=0.55)


def bushes(G, pts):
    for bx, by, br in pts:
        G.ellipse(bx, by, br, br * 0.75, GREEN_D, rough=0.9)
        G.ellipse(bx + br * 0.35, by - br * 0.3, br * 0.5, br * 0.38, GREEN_M, rough=0.6)


SCENES = {
    # A: the wide valley, everything in a row from the field to the reactor
    "a": dict(W=2400, H=800, y0=200, plain=470,
              field=(560, 800, -20, 700, -20, 960, 6),
              farmer=(1060, 712, 270), student=(1330, 724, 226), reactor=(1800, 730, 360),
              road=[(-20, 760), (900, 742), (1500, 744), (2420, 736)],
              bushes=[(560, 492, 14), (590, 498, 10), (2140, 500, 16), (2170, 506, 11), (1250, 488, 12)]),
    # B and C: closer, the reactor standing at the edge of the field it serves
    "b": dict(W=2400, H=1000, y0=300, plain=470,
              field=(520, 1000, -20, 1020, -20, 1360, 7),
              farmer=(650, 840, 360), reactor=(1430, 880, 470), student=(1960, 920, 330),
              road=None,
              bushes=[(1180, 486, 16), (1212, 494, 11), (2200, 500, 18), (2234, 508, 12)]),
}
SCENES["c"] = SCENES["b"]


def dusk(rgb):
    lum = rgb @ np.array([0.3, 0.55, 0.15])
    tint = np.array([72, 82, 120], dtype=np.float64)
    out = rgb * np.array([0.52, 0.56, 0.74]) + tint * 0.2
    return out * 0.92 + lum[..., None] * 0.08 * np.array([0.6, 0.65, 0.9])


def build(name):
    sc = SCENES[name]
    W, H = sc["W"], sc["H"]
    G = Painter(ground(W, H, sc["y0"]), 0, 0, 1)
    plain(G, W, H, sc["plain"])
    if sc["road"]:
        G.stroke(sc["road"], 70, ROAD_D, rough=1.8, alpha=0.8)
        G.stroke(sc["road"], 52, ROAD, rough=1.3)
    bushes(G, sc["bushes"])
    fx, fy, fh = sc["farmer"]; sx, sy, shh = sc["student"]; rx, ry, rh = sc["reactor"]
    shadow(G, fx - 0.25 * fh, fy + 4, 0.34 * fh, 0.06 * fh)
    shadow(G, sx - 0.25 * shh, sy + 4, 0.34 * shh, 0.06 * shh)
    shadow(G, rx - 0.05 * rh, ry + 6, 0.62 * rh, 0.09 * rh, 0.7)

    sprites = {}

    def sprite(key, fn):
        S = Sprite(W, H)
        fn(S)
        sprites[key] = S

    top, bot, x0t, x1t, x0b, x1b, rows = sc["field"]
    sprite("plants", lambda S: field(S, top, bot, x0t, x1t, x0b, x1b, rows))
    sprite("ihp", lambda S: farmer(S, fx, fy, fh))
    sprite("team", lambda S: student(S, sx, sy, shh))
    sprite("results", lambda S: notebook(S, sx, sy, shh))
    sprite("hardware", lambda S: reactor_body(S, rx, ry, rh))
    sprite("software", lambda S: reactor_screen(S, rx, ry, rh))
    sprite("safety", lambda S: reactor_label(S, rx, ry, rh))

    out = OUT / name
    out.mkdir(parents=True, exist_ok=True)
    plate = G.c
    if name == "c":
        plate = dusk(plate)
        # her sky going to night above, a warm band left at the horizon
        yy = np.linspace(0, 1, H)[:, None, None]
        plate = plate * (1 - 0.25 * np.clip(1 - yy * 2.2, 0, 1)) + np.array([250, 196, 140]) * 0.18 * np.exp(-((yy - 0.47) / 0.05) ** 2)
        # the culture's light on the ground around the reactor
        yy2, xx2 = np.mgrid[0:H, 0:W]
        g = np.exp(-(((xx2 - rx) / (0.9 * rh)) ** 2 + ((yy2 - ry) / (0.28 * rh)) ** 2))
        plate = plate + g[..., None] * np.array([60, 110, 60]) * 0.55
    Image.fromarray(np.clip(plate, 0, 255).astype(np.uint8)).save(out / "plate.webp", "WEBP", quality=82, method=6)

    layout = {"w": W, "h": H, "sprites": {}}
    for key, S in sprites.items():
        ys, xs = np.where(S.a > 0.02)
        x0, x1, y0, y1 = max(xs.min() - 2, 0), min(xs.max() + 3, W), max(ys.min() - 2, 0), min(ys.max() + 3, H)
        im = S.rgba(dusk if name == "c" else None)[y0:y1, x0:x1]
        Image.fromarray(im, "RGBA").save(out / f"{key}.webp", "WEBP", quality=88, method=6)
        if name == "c":
            Image.fromarray(S.rgba()[y0:y1, x0:x1], "RGBA").save(out / f"{key}-day.webp", "WEBP", quality=88, method=6)
        # hit outline: the convex hull of what is painted, a little loose
        m = ndimage.binary_dilation(S.a > 0.5, iterations=4)
        py, px = np.where(m[::4, ::4])
        pts = np.stack([px * 4, py * 4], 1)
        hull = pts[ConvexHull(pts).vertices]
        layout["sprites"][key] = {"x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0),
                                  "hit": " ".join(f"{a},{b}" for a, b in hull.tolist())}
    return layout


all_layouts = {n: build(n) for n in ("a", "b", "c")}
(OUT.parent / "layout.js").write_text("window.NAVMAP_LAYOUT = " + json.dumps(all_layouts) + ";\n")
print("wrote", OUT)
