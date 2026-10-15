# ReLEAF navigation picture

A painting at the foot of every ReLEAF wiki subpage, under the title "Explore our project". Each thing in it opens a page. It takes the place of the page's Previous / Next row.

Review page for the team (EN / 中文): https://timmy97-tw.github.io/releaf-navmap/

## Two pictures

**`b`, the field edge (chosen):** seven things, seven pages.

| In the picture | Page |
|---|---|
| Crops in the field | Plants |
| The farmer | Integrated Human Practices |
| The student in a lab coat | Team Members |
| The notebook in the student's hand | Results |
| The bioreactor | Hardware |
| The screen on the bioreactor | Digital Twin |
| The warning label on the bioreactor | Safety and Security |

**`w`, the whole wiki:** every page of the five menus (Project, Wet Lab, Dry Lab, Engagement, Team) as one thing in one valley, read left to right: the labs, the road, the team, the farms and the town.

## Putting it in a wiki page

Copy `navmap/` to `assets/navmap/` in the wiki, then add after a page's last section:

```html
<link rel="stylesheet" href="/assets/navmap/navmap.css">
<section class="navmap" data-variant="b"></section>
<script src="/assets/navmap/layout.js"></script>        <!-- for b -->
<script src="/assets/navmap/layout-world.js"></script>  <!-- for w -->
<script src="/assets/navmap/navmap.js"></script>
```

- `data-variant`: `b` or `w`.
- `data-root`: the wiki root, default `/`.
- The page the reader is on is found from the URL and marked "You are here".
- The page's `.pagenav` (Previous / Next) is removed. Add `data-keep-pagenav` to keep it.
- Nothing is fetched from outside the site.

On hover (or the first tap on a phone) the thing is traced in white, a small name tag appears over it, and its line appears in the caption under the picture. The lines live in `navmap.js` (`LIST`) and are drafts for each page's owner to rewrite.

## The art

These are placeholders, to be replaced by hand-drawn art (see the brief on the review page). The ground (sky, ridge, far fields) is the student painting from the homepage's vision section. Everything standing on it is drawn by code in her manner (`build/paint.py`, `build/paint_world.py`, on the wiki's `build/vision_details.py` Painter), AI-assisted. The people are generic, not real people.

    python build/paint.py "<folder with the five vision PNGs>" navmap/img
    python build/paint_world.py "<folder with the five vision PNGs>" navmap/img

Needs numpy, scipy and Pillow.
