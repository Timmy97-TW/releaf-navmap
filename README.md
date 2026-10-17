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

Review page: https://timmy97-tw.github.io/releaf-navmap/

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
