"""The whole wiki in one painting: every page of Project, Wet Lab, Dry Lab,
Engagement and Team as one thing in one valley, in the manner of the
student's vision painting.

    python paint_world.py "<folder with the five vision PNGs>" <out dir>

The picture reads left to right the way ReLEAF works: the labs (Dry Lab at
the back, Wet Lab in front), the road the project travels, the team where
the roads meet, and the farms and town it is for (Engagement). Writes
<out>/w/plate.webp, one sprite per page, and <out>/../layout-world.js.
AI-assisted drawing after her style; the wiki must say so.
"""
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy import ndimage
from scipy.spatial import ConvexHull

sys.path.insert(0, str(Path(__file__).parent))
import paint as pt  # noqa: E402
from paint import (Sprite, rect, rot, farmer, student, reactor_body, reactor_screen, reactor_label,  # noqa: E402,F401
                   PALE, PALE_L, OLIVE, SOIL, SOIL_L, GREEN_D, GREEN_M, GREEN_L, ROAD, ROAD_D, SHADOW, SKIN)
from vision_details import Painter  # noqa: E402

W, H = 2400, 1200
GLASS = (218, 230, 232); BROTH = (164, 186, 80); AMBER = (236, 168, 48)
WOOD = (176, 136, 90); WOOD_D = (138, 102, 62); STEEL = (150, 164, 170); STEEL_D = (96, 110, 118)
WHITE = (244, 242, 232); INK = (60, 64, 66); RED = (196, 86, 60); BLUE = (78, 116, 168); TEAL = (70, 150, 150)


# ---------------------------------------------------------------- Wet Lab ----
def experiments(P, x, y, s):
    """Two conical flasks and a test tube rack on the bench."""
    for fx, h, broth in ((x - 34 * s, 92 * s, BROTH), (x + 26 * s, 74 * s, (150, 196, 214))):
        nw, bw = h * 0.13, h * 0.42
        P.poly([(fx - nw, y - h), (fx + nw, y - h), (fx + nw, y - 0.7 * h), (fx + bw, y - 0.05 * h), (fx + 0.94 * bw, y),
                (fx - 0.94 * bw, y), (fx - bw, y - 0.05 * h), (fx - nw, y - 0.7 * h)], GLASS, rough=0.5)
        P.poly([(fx - 0.62 * bw, y - 0.33 * h), (fx + 0.62 * bw, y - 0.33 * h), (fx + bw, y - 0.05 * h), (fx + 0.94 * bw, y),
                (fx - 0.94 * bw, y), (fx - bw, y - 0.05 * h)], broth, rough=0.6)
        P.poly(rect(fx - nw * 1.2, y - h - 6 * s, fx + nw * 1.2, y - h + 2 * s), (200, 190, 160), rough=0.2)


def parts(P, x, y, s):
    """A rack of labelled DNA tubes, each cap a different part."""
    P.poly(rect(x - 52 * s, y - 26 * s, x + 52 * s, y), WOOD, rough=0.4)
    P.poly(rect(x - 52 * s, y - 26 * s, x + 52 * s, y - 20 * s), WOOD_D, rough=0.2)
    for i, col in enumerate([AMBER, (120, 178, 80), BLUE, RED, (214, 140, 190), TEAL]):
        tx = x - 40 * s + i * 16 * s
        P.poly(rect(tx - 5 * s, y - 64 * s, tx + 5 * s, y - 22 * s), (232, 238, 238), rough=0.15)
        P.poly(rect(tx - 4 * s, y - 40 * s, tx + 4 * s, y - 24 * s), (196, 214, 214), rough=0.1)
        P.poly(rect(tx - 6.5 * s, y - 72 * s, tx + 6.5 * s, y - 63 * s), col, rough=0.15)


def measurement(P, x, y, s):
    """A petri dish of seedlings with a ruler laid along their roots."""
    P.ellipse(x, y - 14 * s, 62 * s, 20 * s, (222, 228, 222), rough=0.4, n=24)
    P.ellipse(x, y - 16 * s, 56 * s, 16 * s, (238, 236, 206), rough=0.35, n=24)
    for i in range(5):
        sx = x - 36 * s + i * 18 * s
        ln = (22 - i * 3.5) * s
        P.stroke([(sx, y - 26 * s), (sx + 2 * s, y - 26 * s + ln)], 1.6 * s, (236, 232, 214), rough=0.1)
        P.ellipse(sx, y - 27 * s, 5 * s, 3 * s, (110, 168, 76), rough=0.1, n=8)
    P.poly(rot(rect(x - 70 * s, y - 2 * s, x + 70 * s, y + 10 * s), x, y, -0.05), (238, 206, 92), rough=0.2)
    for i in range(15):
        tx = x - 64 * s + i * 9 * s
        P.stroke([(tx, y - 1 * s), (tx, y + (5 if i % 5 else 8) * s)], 1.2 * s, (120, 96, 50), rough=0.0)


def notebook_wet(P, x, y, s):
    """An open lab notebook and a pen."""
    P.poly([(x - 62 * s, y - 6 * s), (x, y - 14 * s), (x, y + 8 * s), (x - 60 * s, y + 14 * s)], WHITE, rough=0.3)
    P.poly([(x, y - 14 * s), (x + 62 * s, y - 6 * s), (x + 60 * s, y + 14 * s), (x, y + 8 * s)], (234, 232, 220), rough=0.3)
    for i in range(4):
        P.stroke([(x - 52 * s, y - 3 * s + i * 4.5 * s), (x - 8 * s, y - 9 * s + i * 4.5 * s)], 1.3 * s, (150, 160, 180), rough=0.1)
        P.stroke([(x + 8 * s, y - 9 * s + i * 4.5 * s), (x + 52 * s, y - 3 * s + i * 4.5 * s)], 1.3 * s, (150, 160, 180), rough=0.1)
    P.stroke([(x + 30 * s, y + 18 * s), (x + 74 * s, y - 4 * s)], 4 * s, BLUE, rough=0.1)


def _biohazard(P, cx, cy, r):
    tri = [(cx, cy - r), (cx + 0.92 * r, cy + 0.66 * r), (cx - 0.92 * r, cy + 0.66 * r)]
    P.poly(tri, (246, 204, 58), rough=0.3)
    for ang in (-np.pi / 2, np.pi / 6, 5 * np.pi / 6):
        P.ellipse(cx + np.cos(ang) * 0.2 * r, cy + 0.12 * r + np.sin(ang) * 0.2 * r, 0.17 * r, 0.17 * r, (52, 46, 36), rough=0.05, n=12)
    P.ellipse(cx, cy + 0.12 * r, 0.08 * r, 0.08 * r, (246, 204, 58), rough=0.0, n=10)


def safety(P, x, y, s):
    P.poly(rect(x - 46 * s, y - 190 * s, x + 46 * s, y), (96, 120, 108), rough=0.4)
    P.poly(rect(x - 38 * s, y - 182 * s, x + 38 * s, y), (124, 150, 136), rough=0.3)
    P.ellipse(x + 26 * s, y - 92 * s, 4 * s, 4 * s, (220, 200, 140), rough=0.05, n=8)
    _biohazard(P, x, y - 132 * s, 30 * s)
    P.stroke([(x - 24 * s, y - 78 * s), (x - 24 * s, y - 70 * s)], 2 * s, INK, rough=0.0)
    P.stroke([(x - 40 * s, y - 62 * s), (x - 8 * s, y - 62 * s)], 7 * s, (120, 190, 200), rough=0.1)
    P.stroke([(x - 40 * s, y - 64 * s), (x - 24 * s, y - 70 * s), (x - 8 * s, y - 64 * s)], 1.6 * s, INK, rough=0.0)


def plants(P, x, y, s):
    """Arabidopsis in pots on a low stand: rosettes and a flowering stalk."""
    P.poly(rect(x - 90 * s, y - 34 * s, x + 90 * s, y - 24 * s), WOOD, rough=0.3)
    for lx in (x - 80 * s, x + 74 * s):
        P.poly(rect(lx, y - 24 * s, lx + 6 * s, y), WOOD_D, rough=0.1)
    for i, px in enumerate((x - 58 * s, x, x + 58 * s)):
        b = y - 34 * s
        P.poly([(px - 22 * s, b - 36 * s), (px + 22 * s, b - 36 * s), (px + 16 * s, b), (px - 16 * s, b)], (186, 104, 64), rough=0.3)
        P.poly(rect(px - 24 * s, b - 42 * s, px + 24 * s, b - 34 * s), (204, 122, 78), rough=0.2)
        for a in np.linspace(0, 2 * np.pi, 8, endpoint=False):
            P.ellipse(px + np.cos(a) * 12 * s, b - 46 * s + np.sin(a) * 4 * s, 9 * s, 4.5 * s, GREEN_M if i != 1 else GREEN_L, rot=a, rough=0.2, n=9)
        P.ellipse(px, b - 47 * s, 6 * s, 4 * s, GREEN_D, rough=0.1, n=8)
        if i != 2:
            P.stroke([(px, b - 48 * s), (px + 3 * s, b - 92 * s)], 2 * s, (96, 140, 70), rough=0.1)
            for fy in (-92, -84, -78):
                P.ellipse(px + 3 * s + (fy % 7) * 0.4 * s, b + fy * s, 3 * s, 3 * s, WHITE, rough=0.05, n=7)


# ---------------------------------------------------------------- Dry Lab ----
def model(P, x, y, s):
    """A chalkboard on the shed wall: a curve, a threshold, some working."""
    P.poly(rect(x - 86 * s, y - 120 * s, x + 86 * s, y), (110, 82, 52), rough=0.3)
    P.poly(rect(x - 78 * s, y - 112 * s, x + 78 * s, y - 8 * s), (52, 78, 64), rough=0.3)
    xs = np.linspace(-66, 66, 12)
    P.stroke([(x + v * s, y - (24 + 64 / (1 + np.exp(-v / 14))) * s) for v in xs], 2.6 * s, (236, 236, 222), rough=0.1)
    P.stroke([(x - 70 * s, y - 62 * s), (x + 70 * s, y - 62 * s)], 1.6 * s, (238, 200, 110), rough=0.2)
    P.stroke([(x - 70 * s, y - 20 * s), (x - 70 * s, y - 104 * s)], 1.6 * s, (220, 222, 210), rough=0.1)
    for i in range(3):
        P.stroke([(x - 66 * s, y - 100 * s + i * 9 * s), (x - (30 - i * 6) * s, y - 100 * s + i * 9 * s)], 1.5 * s, (200, 206, 196), rough=0.4)


def drylab_notebook(P, x, y, s):
    """A laptop on a small table, a season timeline on its screen."""
    P.poly(rect(x - 54 * s, y - 64 * s, x + 54 * s, y - 56 * s), WOOD, rough=0.3)
    for lx in (x - 48 * s, x + 42 * s):
        P.poly(rect(lx, y - 56 * s, lx + 6 * s, y), WOOD_D, rough=0.1)
    P.poly([(x - 34 * s, y - 64 * s), (x + 34 * s, y - 64 * s), (x + 30 * s, y - 70 * s), (x - 30 * s, y - 70 * s)], (176, 184, 188), rough=0.15)
    P.poly(rect(x - 30 * s, y - 118 * s, x + 30 * s, y - 70 * s), (70, 78, 84), rough=0.2)
    P.poly(rect(x - 26 * s, y - 114 * s, x + 26 * s, y - 74 * s), (226, 236, 230), rough=0.15, emit=True)
    for i, (a, b, c) in enumerate(((-22, 4, BLUE), (-10, 20, (120, 178, 80)), (-18, 12, AMBER), (0, 22, TEAL))):
        P.stroke([(x + a * s, y - 106 * s + i * 8 * s), (x + b * s, y - 106 * s + i * 8 * s)], 4 * s, c, rough=0.05, emit=True)


def protein(P, x, y, s):
    """A ribbon model of a protein on a stand: a coiled helix."""
    P.poly(rect(x - 30 * s, y - 10 * s, x + 30 * s, y), WOOD_D, rough=0.2)
    P.stroke([(x, y - 10 * s), (x, y - 40 * s)], 4 * s, STEEL_D, rough=0.0)
    t = np.linspace(0, 5 * np.pi, 60)
    pts = [(x + 26 * s * np.sin(v), y - 40 * s - v * 8.2 * s) for v in t]
    for i in range(len(pts) - 1):
        front = np.cos(t[i]) > 0
        P.stroke([pts[i], pts[i + 1]], 9 * s, (236, 150, 64) if front else (190, 104, 46), rough=0.0)
    P.stroke([pts[-1], (x - 14 * s, pts[-1][1] - 14 * s), (x + 10 * s, pts[-1][1] - 30 * s)], 5 * s, TEAL, rough=0.1)


# ---------------------------------------------------------------- Project ----
def description(P, x, y, s):
    """The signboard at the start of the road."""
    for px in (x - 74 * s, x + 66 * s):
        P.poly(rect(px, y - 150 * s, px + 9 * s, y), WOOD_D, rough=0.2)
    P.poly(rect(x - 96 * s, y - 158 * s, x + 96 * s, y - 84 * s), (226, 210, 168), rough=0.4)
    P.poly(rect(x - 96 * s, y - 92 * s, x + 96 * s, y - 84 * s), (196, 178, 132), rough=0.2)
    P.text("ReLEAF", x + 8 * s, y - 121 * s, 30 * s, (62, 104, 58))
    P.poly([(x - 64 * s, y - 104 * s), (x - 80 * s, y - 128 * s), (x - 60 * s, y - 140 * s)], (120, 170, 76), rough=0.1)


def biomanufacturing(P, x, y, s):
    """Three small production units in a row, one tube joining them."""
    for i in range(3):
        ux = x + (i - 1) * 74 * s
        P.poly(rect(ux - 26 * s, y - 84 * s, ux + 26 * s, y), (64, 138, 86), rough=0.3)
        P.poly([(ux + 26 * s, y), (ux + 26 * s, y - 84 * s), (ux + 34 * s, y - 88 * s), (ux + 34 * s, y - 4 * s)], (42, 100, 64), rough=0.2)
        P.poly(rect(ux - 18 * s, y - 74 * s, ux + 12 * s, y - 22 * s), (150, 210, 162), rough=0.2, emit=True)
        P.poly(rect(ux - 14 * s, y - 52 * s, ux + 8 * s, y - 26 * s), (170, 214, 96), rough=0.2, emit=True)
    P.stroke([(x - 74 * s, y - 88 * s), (x - 74 * s, y - 100 * s), (x + 74 * s, y - 100 * s), (x + 74 * s, y - 88 * s)], 4 * s, (236, 170, 90), rough=0.1)
    P.stroke([(x, y - 100 * s), (x, y - 88 * s)], 4 * s, (236, 170, 90), rough=0.1)


def engineering(P, x, y, s):
    """A workbench with a big gear and a spanner."""
    P.poly(rect(x - 80 * s, y - 62 * s, x + 80 * s, y - 50 * s), WOOD, rough=0.3)
    for lx in (x - 72 * s, x + 64 * s):
        P.poly(rect(lx, y - 50 * s, lx + 8 * s, y), WOOD_D, rough=0.1)
    gx, gy, r = x - 18 * s, y - 108 * s, 40 * s
    teeth = []
    for k in range(24):
        a = k * np.pi / 12
        rr = r if k % 2 == 0 else r * 0.8
        teeth.append((gx + np.cos(a) * rr, gy + np.sin(a) * rr))
    P.poly(teeth, STEEL, rough=0.2)
    P.ellipse(gx, gy, 0.52 * r, 0.52 * r, STEEL_D, rough=0.1, n=16)
    P.ellipse(gx, gy, 0.22 * r, 0.22 * r, (206, 214, 214), rough=0.05, n=12)
    P.stroke([(x + 22 * s, y - 70 * s), (x + 66 * s, y - 64 * s)], 7 * s, STEEL_D, rough=0.1)
    P.ellipse(x + 70 * s, y - 64 * s, 9 * s, 7 * s, STEEL_D, rough=0.1, n=10)


def development(P, x, y, s):
    """A signpost with four arms, one per stage."""
    P.poly(rect(x - 5 * s, y - 210 * s, x + 5 * s, y), WOOD_D, rough=0.2)
    arms = ((-1, 196, (120, 178, 80)), (1, 168, (236, 190, 70)), (-1, 140, (96, 150, 200)), (1, 112, (206, 112, 80)))
    for d, h, col in arms:
        x0, x1 = x, x + d * 86 * s
        P.poly([(x0, y - h * s - 9 * s), (x1, y - h * s - 9 * s), (x1 + d * 12 * s, y - h * s + 2 * s), (x1, y - h * s + 13 * s), (x0, y - h * s + 13 * s)], col, rough=0.25)


def contribution(P, x, y, s):
    """An open crate of things handed on, tied with a ribbon."""
    P.poly(rect(x - 64 * s, y - 64 * s, x + 64 * s, y), WOOD, rough=0.4)
    for i in range(3):
        P.stroke([(x - 64 * s, y - 16 * s - i * 20 * s), (x + 64 * s, y - 16 * s - i * 20 * s)], 2.2 * s, WOOD_D, rough=0.2)
    P.poly(rect(x - 46 * s, y - 92 * s, x - 2 * s, y - 60 * s), WHITE, rough=0.2)
    for i in range(3):
        for j in range(2):
            P.ellipse(x - 38 * s + i * 14 * s, y - 82 * s + j * 12 * s, 3.5 * s, 3.5 * s, (180, 186, 180), rough=0.05, n=8)
    P.poly(rot(rect(x + 6 * s, y - 100 * s, x + 46 * s, y - 60 * s), x + 26 * s, y - 80 * s, 0.12), (120, 160, 196), rough=0.2)
    P.stroke([(x + 12 * s, y - 64 * s), (x + 40 * s, y - 92 * s)], 2 * s, WHITE, rough=0.1)
    P.poly(rect(x - 6 * s, y - 64 * s, x + 6 * s, y), RED, rough=0.15)
    P.ellipse(x - 12 * s, y - 66 * s, 12 * s, 7 * s, RED, rot=-0.4, rough=0.1, n=10)
    P.ellipse(x + 12 * s, y - 66 * s, 12 * s, 7 * s, RED, rot=0.4, rough=0.1, n=10)


def results(P, x, y, s):
    """An easel with a chart: bars and a line that rise."""
    P.stroke([(x - 40 * s, y), (x - 6 * s, y - 190 * s)], 6 * s, WOOD_D, rough=0.1)
    P.stroke([(x + 40 * s, y), (x + 6 * s, y - 190 * s)], 6 * s, WOOD_D, rough=0.1)
    P.stroke([(x, y - 170 * s), (x + 10 * s, y + 2 * s)], 5 * s, WOOD_D, rough=0.1)
    P.poly(rect(x - 60 * s, y - 176 * s, x + 60 * s, y - 70 * s), WHITE, rough=0.3)
    for i, hgt in enumerate((22, 38, 30, 60, 74)):
        bx = x - 46 * s + i * 21 * s
        P.poly(rect(bx, y - 80 * s - hgt * s, bx + 14 * s, y - 80 * s), [(120, 178, 80), (120, 178, 80), AMBER, (120, 178, 80), (64, 138, 86)][i], rough=0.15)
    P.stroke([(x - 52 * s, y - 80 * s), (x + 52 * s, y - 80 * s)], 1.6 * s, INK, rough=0.05)


# ---------------------------------------------------------------- Team ----
def team(P, x, y, h):
    """Three students of the team, side by side."""
    student(P, x - 0.38 * h, y + 6, h * 0.96, coat=False, hair=(70, 52, 40), shirt=(58, 124, 72))
    student(P, x + 0.38 * h, y + 4, h * 0.98, coat=False, hair=(40, 34, 30), shirt=(58, 124, 72), long_hair=True)
    student(P, x, y + 12, h, coat=True)


def attribution(P, x, y, s):
    """A cork board of photo cards and pins: who did what."""
    for lx in (x - 70 * s, x + 62 * s):
        P.poly(rect(lx, y - 150 * s, lx + 8 * s, y), WOOD_D, rough=0.2)
    P.poly(rect(x - 84 * s, y - 170 * s, x + 84 * s, y - 64 * s), (196, 160, 110), rough=0.4)
    cols = [(240, 236, 220), (226, 236, 246), (246, 230, 214), (232, 244, 224)]
    k = 0
    for j in range(2):
        for i in range(4):
            cx, cy = x - 60 * s + i * 40 * s, y - 140 * s + j * 46 * s
            P.poly(rot(rect(cx - 15 * s, cy - 18 * s, cx + 15 * s, cy + 18 * s), cx, cy, (k % 3 - 1) * 0.08), cols[k % 4], rough=0.15)
            P.ellipse(cx, cy - 4 * s, 6 * s, 6 * s, (190, 150, 120), rough=0.05, n=8)
            P.ellipse(cx, cy + 9 * s, 10 * s, 5 * s, [BLUE, (120, 178, 80), RED, AMBER][k % 4], rough=0.05, n=8)
            P.ellipse(cx, cy - 18 * s, 3 * s, 3 * s, RED, rough=0.0, n=6)
            k += 1


def milestone(P, x, y, s):
    """A flag planted on the hill top."""
    P.stroke([(x, y), (x, y - 190 * s)], 5 * s, (110, 96, 80), rough=0.05)
    P.poly([(x, y - 190 * s), (x + 90 * s, y - 172 * s), (x + 80 * s, y - 150 * s), (x, y - 140 * s)], (120, 178, 80), rough=0.4)
    P.poly([(x, y - 190 * s), (x + 90 * s, y - 172 * s), (x + 86 * s, y - 164 * s), (x, y - 178 * s)], (150, 200, 100), rough=0.2)
    P.ellipse(x, y - 192 * s, 6 * s, 6 * s, (230, 200, 120), rough=0.05, n=8)
    for i, (dx, dy) in enumerate(((-60, 20), (-110, 46), (-170, 60))):
        P.ellipse(x + dx * s, y + dy * s, 12 * s, 5 * s, (200, 190, 150), rough=0.2, n=9)


# ------------------------------------------------------------- Engagement ----
def ihp(P, x, y, h):
    farmer(P, x, y, h)


def education(P, x, y, s):
    """A small schoolhouse with a bell."""
    P.poly(rect(x - 86 * s, y - 104 * s, x + 86 * s, y), (194, 112, 84), rough=0.4)
    P.poly([(x - 98 * s, y - 100 * s), (x + 98 * s, y - 100 * s), (x, y - 166 * s)], (96, 82, 74), rough=0.4)
    P.poly(rect(x - 16 * s, y - 196 * s, x + 16 * s, y - 150 * s), (226, 214, 190), rough=0.2)
    P.poly([(x - 22 * s, y - 192 * s), (x + 22 * s, y - 192 * s), (x, y - 218 * s)], (96, 82, 74), rough=0.2)
    P.ellipse(x, y - 172 * s, 8 * s, 10 * s, (222, 180, 70), rough=0.05, n=10)
    P.poly(rect(x - 16 * s, y - 56 * s, x + 16 * s, y), (110, 80, 56), rough=0.2)
    for wx in (x - 56 * s, x + 56 * s):
        P.poly(rect(wx - 18 * s, y - 80 * s, wx + 18 * s, y - 50 * s), (236, 226, 190), rough=0.2)
        P.stroke([(wx, y - 80 * s), (wx, y - 50 * s)], 2 * s, (194, 112, 84), rough=0.0)


def entrepreneurship(P, x, y, s):
    """A market stall: striped awning, crates of produce."""
    for px in (x - 84 * s, x + 76 * s):
        P.poly(rect(px, y - 150 * s, px + 7 * s, y), WOOD_D, rough=0.15)
    stripes = 6
    for i in range(stripes):
        x0 = x - 96 * s + i * 32 * s
        P.poly([(x0, y - 150 * s), (x0 + 32 * s, y - 150 * s), (x0 + 32 * s, y - 128 * s), (x0 + 16 * s, y - 120 * s), (x0, y - 128 * s)],
               (238, 236, 222) if i % 2 else (120, 178, 80), rough=0.2)
    P.poly(rect(x - 90 * s, y - 60 * s, x + 90 * s, y - 50 * s), WOOD, rough=0.2)
    P.poly(rect(x - 86 * s, y - 50 * s, x + 86 * s, y), (156, 118, 76), rough=0.3)
    for i, col in enumerate(((120, 178, 80), RED, AMBER, (96, 150, 70))):
        cx = x - 66 * s + i * 44 * s
        P.poly(rect(cx - 18 * s, y - 80 * s, cx + 18 * s, y - 60 * s), WOOD_D, rough=0.15)
        for j in range(3):
            P.ellipse(cx - 10 * s + j * 10 * s, y - 82 * s, 7 * s, 6 * s, col, rough=0.1, n=8)


def sustainability(P, x, y, s):
    """A wind turbine and a solar panel."""
    P.poly([(x - 6 * s, y), (x + 6 * s, y), (x + 3 * s, y - 230 * s), (x - 3 * s, y - 230 * s)], WHITE, rough=0.2)
    hx, hy = x, y - 232 * s
    for a in (-np.pi / 2 + 0.3, np.pi / 6 + 0.3, 5 * np.pi / 6 + 0.3):
        tx, ty = hx + np.cos(a) * 96 * s, hy + np.sin(a) * 96 * s
        nx, ny = -np.sin(a) * 7 * s, np.cos(a) * 7 * s
        P.poly([(hx, hy), (hx + (tx - hx) * 0.3 + nx, hy + (ty - hy) * 0.3 + ny), (tx, ty)], (238, 238, 232), rough=0.15)
    P.ellipse(hx, hy, 8 * s, 8 * s, (210, 214, 210), rough=0.05, n=10)
    px, py = x + 90 * s, y
    P.stroke([(px, py), (px, py - 34 * s)], 4 * s, STEEL_D, rough=0.0)
    P.poly([(px - 50 * s, py - 30 * s), (px + 50 * s, py - 30 * s), (px + 40 * s, py - 72 * s), (px - 40 * s, py - 72 * s)], (64, 96, 150), rough=0.2)
    for i in range(1, 4):
        P.stroke([(px - 50 * s + i * 25 * s, py - 30 * s), (px - 40 * s + i * 20 * s, py - 72 * s)], 1.5 * s, (150, 180, 210), rough=0.0)
    P.stroke([(px - 45 * s, py - 51 * s), (px + 45 * s, py - 51 * s)], 1.5 * s, (150, 180, 210), rough=0.0)


def laws(P, x, y, s):
    """The town hall: columns, a pediment, a flag."""
    P.poly(rect(x - 100 * s, y - 14 * s, x + 100 * s, y), (210, 206, 192), rough=0.3)
    P.poly(rect(x - 90 * s, y - 24 * s, x + 90 * s, y - 14 * s), (226, 222, 208), rough=0.2)
    P.poly(rect(x - 84 * s, y - 120 * s, x + 84 * s, y - 24 * s), (226, 222, 210), rough=0.3)
    for i in range(5):
        cx = x - 68 * s + i * 34 * s
        P.poly(rect(cx - 8 * s, y - 116 * s, cx + 8 * s, y - 24 * s), (246, 244, 236), rough=0.15)
    P.poly(rect(x - 94 * s, y - 132 * s, x + 94 * s, y - 118 * s), (236, 232, 220), rough=0.2)
    P.poly([(x - 96 * s, y - 132 * s), (x + 96 * s, y - 132 * s), (x, y - 172 * s)], (214, 208, 192), rough=0.3)
    P.stroke([(x, y - 172 * s), (x, y - 230 * s)], 3 * s, STEEL_D, rough=0.0)
    P.poly([(x, y - 230 * s), (x + 40 * s, y - 222 * s), (x, y - 210 * s)], RED, rough=0.2)


def geospatial(P, x, y, s):
    """A satellite overhead."""
    P.poly(rot(rect(x - 22 * s, y - 18 * s, x + 22 * s, y + 18 * s), x, y, 0.3), (222, 182, 80), rough=0.2)
    for d in (-1, 1):
        cx = x + d * 78 * s
        P.poly(rot(rect(cx - 46 * s, y - 16 * s, cx + 46 * s, y + 16 * s), x, y, 0.3), (64, 96, 150), rough=0.15)
        for i in range(1, 4):
            P.stroke(rot([(cx - 46 * s + i * 23 * s, y - 16 * s), (cx - 46 * s + i * 23 * s, y + 16 * s)], x, y, 0.3), 1.4 * s, (150, 180, 210), rough=0.0)
    P.stroke(rot([(x, y + 18 * s), (x, y + 34 * s)], x, y, 0.3), 3 * s, STEEL_D, rough=0.0)
    P.ellipse(*rot([(x, y + 40 * s)], x, y, 0.3)[0], 14 * s, 6 * s, (230, 230, 226), rot=0.3, rough=0.05, n=12)


def data_phys(P, x, y, s):
    """A table with a paper map of Taiwan and small lights on it."""
    P.poly(rect(x - 80 * s, y - 52 * s, x + 80 * s, y - 42 * s), WOOD, rough=0.25)
    for lx in (x - 72 * s, x + 64 * s):
        P.poly(rect(lx, y - 42 * s, lx + 8 * s, y), WOOD_D, rough=0.1)
    isl = [(x - 8 * s, y - 112 * s), (x + 14 * s, y - 104 * s), (x + 30 * s, y - 86 * s), (x + 26 * s, y - 66 * s),
           (x + 4 * s, y - 52 * s), (x - 10 * s, y - 50 * s), (x - 26 * s, y - 64 * s), (x - 30 * s, y - 84 * s), (x - 22 * s, y - 102 * s)]
    P.poly(rot(isl, x, y - 80 * s, 0.35), (230, 206, 120), rough=0.4)
    P.poly(rot(isl[:5] + [(x, y - 80 * s)], x, y - 80 * s, 0.35), (180, 200, 110), rough=0.3)
    for lx, ly, col in ((-6, -96, RED), (8, -82, AMBER), (-12, -72, RED), (14, -64, (250, 230, 120)), (-4, -60, AMBER)):
        P.ellipse(*rot([(x + lx * s, y + ly * s)], x, y - 80 * s, 0.35)[0], 4 * s, 4 * s, col, rough=0.0, n=8, emit=True)


# ---------------------------------------------------------------- scene ----
# (painter, x, ground y, scale)  scale is the size factor; people take a height
SCENE = {
    # Dry Lab, at the back left
    "model":            (model, 300, 610, 0.78),
    "drylab-notebook":  (drylab_notebook, 520, 660, 0.78),
    "hardware":         (reactor_body, 680, 680, 210),
    "software":         (reactor_screen, 680, 680, 210),
    "protein-design":   (protein, 860, 666, 0.74),
    # Wet Lab, in front
    "experiments":      (experiments, 150, 1046, 1.0),
    "parts":            (parts, 290, 1046, 1.0),
    "measurement":      (measurement, 430, 1046, 1.0),
    "notebook":         (notebook_wet, 570, 1052, 1.0),
    "safety-and-security": (safety, 690, 1100, 1.0),
    "plant":            (plants, 820, 1150, 1.0),
    # Project, along the road from the labs to the farms
    "description":      (description, 1000, 1010, 0.95),
    "engineering":      (engineering, 1110, 1170, 1.0),
    "contribution":     (contribution, 1320, 1172, 1.0),
    "results":          (results, 1520, 1160, 1.0),
    "development":      (development, 1590, 935, 0.9),
    "biomanufacturing": (biomanufacturing, 1800, 1070, 1.0),
    # Team, where the roads meet
    "milestone":        (milestone, 1110, 600, 0.9),
    "team":             (team, 1200, 880, 200),
    "attributions":     (attribution, 1400, 870, 0.9),
    # Engagement, the farms and the town
    "human-practices":  (ihp, 2140, 1110, 230),
    "entrepreneurship": (entrepreneurship, 1880, 860, 0.9),
    "education":        (education, 2270, 760, 0.82),
    "laws-and-regulations": (laws, 1700, 650, 0.78),
    "sustainability":   (sustainability, 2000, 640, 0.78),
    "data-physicalization": (data_phys, 1420, 690, 0.78),
    "geospatial-analysis": (geospatial, 1560, 170, 0.9),
}
ATTACH = {"software": "hardware"}


def plate():
    G = Painter(pt.ground(W, H, 300), 0, 0, 1)
    pt.plain(G, W, H, 470)
    # soft grounds for the five parts, laid over the plain
    G.poly([(-20, 560), (980, 548), (1000, 720), (-20, 740)], OLIVE, rough=2.0, alpha=0.55)                     # dry lab yard
    G.poly([(-20, 1000), (980, 1010), (1010, 1220), (-20, 1220)], (204, 190, 150), rough=2.0, alpha=0.7)        # wet lab yard
    G.poly([(1040, 820), (1520, 800), (1560, 940), (1020, 960)], (150, 176, 92), rough=2.0, alpha=0.55)         # team lawn
    G.poly([(1640, 560), (2420, 540), (2420, 820), (1600, 840)], (170, 184, 104), rough=2.0, alpha=0.45)        # town
    G.poly([(1960, 960), (2420, 930), (2420, 1220), (1900, 1220)], SOIL_L, rough=2.0)                         # farm field
    rng = np.random.default_rng(5)
    for i in range(6):
        yy = 990 + i * 40
        xl = 1960 - i * 12
        G.stroke([(xl, yy), (2420, yy - 30)], 8 + i * 1.5, SOIL, rough=1.2, alpha=0.5)
        for xx in np.arange(xl + 20, 2420, 34 + i * 4):
            k = 0.5 + i * 0.12
            G.ellipse(xx + rng.normal(0, 2), yy - 4 - (xx - xl) * 0.065, 14 * k, 8 * k, GREEN_D, rough=0.6, n=10)
            G.ellipse(xx + 3 * k, yy - 8 - (xx - xl) * 0.065, 7 * k, 5 * k, GREEN_M, rough=0.4, n=8)
    # the milestone hill
    G.poly([(900, 640), (1010, 590), (1110, 570), (1220, 596), (1320, 650)], (128, 170, 84), rough=1.6)
    G.poly([(980, 610), (1060, 584), (1110, 578), (1100, 600)], (150, 190, 100), rough=1.0, alpha=0.8)
    # the road: out of the wet lab, past the team, on to the farms
    road = [(760, 1120), (900, 1060), (1060, 990), (1300, 960), (1560, 990), (1760, 960), (1980, 920), (2420, 880)]
    G.stroke(road, 64, ROAD_D, rough=1.8, alpha=0.8)
    G.stroke(road, 48, ROAD, rough=1.3)
    G.stroke([(1300, 960), (1260, 900), (1220, 760), (1180, 640)], 26, ROAD, rough=1.2, alpha=0.8)   # path up the hill
    # the Wet Lab building, open at the front, and the Dry Lab shed
    G.poly(rect(40, 840, 760, 1120), (232, 228, 214), rough=0.8)
    G.poly([(20, 850), (780, 850), (720, 780), (80, 780)], (92, 140, 96), rough=0.8)
    G.poly(rect(70, 900, 620, 1060), (196, 214, 214), rough=0.6)
    G.poly(rect(70, 1046, 620, 1062), (170, 132, 90), rough=0.4)                      # bench top
    G.poly(rect(70, 1062, 620, 1112), (196, 176, 140), rough=0.4)
    G.poly(rect(170, 420 + 100, 440, 640), (206, 192, 160), rough=0.6)              # dry lab shed
    G.poly([(150, 528), (460, 528), (420, 470), (190, 470)], (150, 96, 66), rough=0.6)
    # shadows under things that stand on the ground
    for key, (fn, x, y, sc) in SCENE.items():
        if key in ("geospatial-analysis", "software", "model", "experiments", "parts", "measurement", "notebook"):
            continue
        r = (sc * 0.42 if sc > 5 else 90 * sc)
        G.ellipse(x - r * 0.3, y + 4, r, r * 0.2, SHADOW, mul=True, alpha=0.55, rough=0.8)
    return G.c


def main():
    pt.load_valley(sys.argv[1])
    out = Path(sys.argv[2]) / "w"
    out.mkdir(parents=True, exist_ok=True)
    Image.fromarray(np.clip(plate(), 0, 255).astype(np.uint8)).save(out / "plate.webp", "WEBP", quality=82, method=6)
    layout = {"w": W, "h": H, "sprites": {}, "attach": ATTACH, "order": list(SCENE)}
    for key, (fn, x, y, sc) in SCENE.items():
        S = Sprite(W, H)
        fn(S, x, y, sc)
        ys, xs = np.where(S.a > 0.02)
        x0, x1, y0, y1 = max(xs.min() - 2, 0), min(xs.max() + 3, W), max(ys.min() - 2, 0), min(ys.max() + 3, H)
        Image.fromarray(S.rgba()[y0:y1, x0:x1], "RGBA").save(out / f"{key}.webp", "WEBP", quality=88, method=6)
        m = ndimage.binary_dilation(S.a > 0.5, iterations=4)
        py, px = np.where(m[::3, ::3])
        pts = np.stack([px * 3, py * 3], 1)
        hull = pts[ConvexHull(pts).vertices]
        layout["sprites"][key] = {"x": int(x0), "y": int(y0), "w": int(x1 - x0), "h": int(y1 - y0),
                                  "hit": " ".join(f"{a},{b}" for a, b in hull.tolist())}
    (Path(sys.argv[2]).parent / "layout-world.js").write_text("window.NAVMAP_WORLD = " + json.dumps(layout) + ";\n")
    print("wrote", out)


if __name__ == "__main__":
    main()
