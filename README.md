# ReLEAF navigation map

The map at the foot of every ReLEAF wiki subpage. A reader who finishes a page
sees where it sits: the page they are on in the middle, the pages it **builds
on** to the left, the pages it **leads to** on the right, one of them tagged
*Read next*, and under every linked page one line saying what the connection is.

A second picture shows the **whole wiki**: all 27 pages on one ring, grouped
into the five menus, with every link drawn. Point at a page and its links and
neighbours light while the rest dim; the panel beside the ring lists them with
the reason for each link. Point at a section name to see how that section hangs
together.

Review page: https://timmy97-tw.github.io/releaf-navmap/ (the diagram) and
https://timmy97-tw.github.io/releaf-navmap/art.html (the painted version).

## The decision (17 Oct 2026)

The **Description page** ends on the whole valley (`art.html`, `data-art="all"`).
**Every other subpage** ends on its own scene (`scenes.html`, `data-art="scene"`,
`assets/navmap/scene.js`): the page's thing in the middle, what comes before it
to the left, what comes after to the right, a peer at the same size beside it
where one mirrors the other, and a route arcing back where the work learns from
itself. The scene is set where the page lives (lab pavilion, studio, yard, plaza,
village green, field). Which pages appear is Jacquelyn's choice; the order, peers
and loops are `FLOW` in `scene.js`, one line per page. The diagram version stays
as reference.

## Three versions, same data

**Diagram** (`index.html`, `navmap.js`): cards and wires, the wiki's section
colours, the ring for the whole wiki.

**Painted** (`art.html`, `art.js` + `art.css`): the same two maps as one
valley drawn in the manner of the homepage's vision painting. Every page is a
place; the valley reads left to right as the project does: the village (Team),
the lab (Wet Lab), the studio (Dry Lab), the yard where the machine is built
(Project), the field (Plants), the town (Engagement). Pointing at a place turns
the valley to dusk and lights the place and the pages linked to it, with the
routes drawn on the ground. The page map stands the page in the middle of a
road with what it builds on to the left and where it leads to the right, a
signpost under each saying why. All vector, drawn in code after the painting,
AI-assisted; to be disclosed as such on the wiki.

## Where the choices come from

Which pages appear on each page's map is **Jacquelyn's** choice, taken
unchanged from her valley prototype (`reference/jacquelyn-valley/`, October
2026; five or six pages per map). Round 2 redrew the picture: it adds the lane
(builds on / leads to), the one-line reason, the *Read next* tag, and the
whole-wiki ring. Her valley stays in the repository for reference.

## Files

| Path | What it is |
|---|---|
| `assets/navmap/navmap-data.js` | Sections, pages, icons and the links with their lanes and phrases. The only file a page owner needs to edit. |
| `assets/navmap/navmap.js` | Draws both maps. No dependencies. |
| `assets/navmap/navmap.css` | Styles for both. White ground, the wiki's section colours. |
| `assets/navmap/art.js`, `art.css` | The painted version: the 27 place drawings, the valley, the page road, the dusk-and-light behaviour. `data-art="page"` or `data-art="all"` on the section. |
| `art.html` | The review page for the painted version (the whole valley, used on Description). |
| `assets/navmap/scene.js` | The page scenes: `FLOW` (before / peer / after / loop per page), the zone settings, the composition. Needs art.js. |
| `scenes.html` | The review page for the scenes, with a page picker. |
| `index.html` | The review page: a page picker, both maps in a mock subpage, the design logic, how to install. |
| `reference/jacquelyn-valley/` | The prototype whose page choices this follows. |

## Putting it in a wiki page

Copy `assets/navmap/` into the wiki's `assets/`, then add after a page's last
section, before the footer:

```html
<link rel="stylesheet" href="../assets/navmap/navmap.css">
<section class="navmap"></section>                    <!-- the page map -->
<section class="navmap" data-map="all"></section>     <!-- the whole wiki, optional -->
<script src="../assets/navmap/navmap-data.js"></script>
<script src="../assets/navmap/navmap.js"></script>
```

- The page the reader is on is read from the URL (the first folder under the
  wiki root, worked out from the script's own address), so the same lines work
  at `/`, `/releaf-wiki/` and `/gems-taiwan/`. Force it with `data-here="slug"`.
- The page's `.pagenav` (Previous / Next) is removed; add `data-keep-pagenav` to keep it.
- `data-root` points the links somewhere else than the wiki the script sits in.
- Nothing is fetched from outside the site. The font is whatever the page uses.

## Editing the data

In `navmap-data.js`, `links[page]` is the list of related pages, in order. Each has:

- `to`: the page's slug (iGEM's standard URL; do not rename).
- `lane`: `in` (this page builds on it, drawn on the left) or `out` (it leads there, drawn on the right).
- `why`: the one-line reason shown under the page's name. A lowercase fragment; the first letter is capitalised on screen. These are drafts for the page owners to rewrite.
- `next`: `true` on exactly one `out` link per page, the *Read next* tag.

Both maps read the same list, so a change here shows in both.

## Hand-over for the team's drawings

`python3 build/export.py` (needs Chrome, python-pptx, Pillow, and a static
server on :8864) writes `exports/`:

- `places/<slug>.png`: each of the 27 places on a 1000 x 1000 transparent
  canvas, centred at x=500, standing on the baseline y=940.
- `manifest.json`: for every place its page, section, the scale and offset
  that put the drawing on that canvas, and its footprint.
- `ReLEAF-navmap-places.pptx`: one slide per place, our drawing on the left,
  a blank frame of the same size on the right for a student to draw in.

A student's drawing comes back as `<slug>.png`, same canvas, same baseline,
transparent, no words. Drop it into `exports/places/` and the scene code can
swap the vector place for the image at the same spot.
