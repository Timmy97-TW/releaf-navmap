# ReLEAF navigation picture

A painting at the foot of every ReLEAF wiki subpage. Seven things in it each open a page:

| In the picture | Page |
|---|---|
| Crops in the field | Plants |
| The farmer | Integrated Human Practices |
| The student in a lab coat | Team Members |
| The notebook in the student's hand | Results |
| The bioreactor | Hardware |
| The screen on the bioreactor | Digital Twin |
| The warning label on the bioreactor | Safety and Security |

`index.html` is the review page for the team (three options, how it looks inside a subpage, open questions).

## Putting it in a wiki page

Copy `navmap/` to `assets/navmap/` in the wiki, then add this after a page's last section and before Previous / Next:

```html
<link rel="stylesheet" href="/assets/navmap/navmap.css">
<section class="navmap" data-variant="a"></section>
<script src="/assets/navmap/layout.js"></script>
<script src="/assets/navmap/navmap.js"></script>
```

`data-variant` is `a`, `b` or `c`. `data-root` sets the wiki root (default `/`). The page the reader is on is found from the URL and marked "You are here". No request leaves the site.

## The art

The ground (sky, ridge, far fields) is the student painting from the homepage's vision section. The field, the people and the reactor are drawn by code in her manner (`build/paint.py`, using the wiki's `build/vision_details.py` Painter). That part is AI-assisted and must be disclosed on the wiki. To rebuild:

    python build/paint.py "<folder with the five vision PNGs>" navmap/img

Needs numpy, scipy and Pillow.
