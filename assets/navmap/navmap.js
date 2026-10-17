/* ReLEAF navigation map.

   At the foot of a subpage, before the footer:
     <link rel="stylesheet" href="../assets/navmap/navmap.css">
     <section class="navmap"></section>                   the page map
     <section class="navmap" data-map="all"></section>    the whole wiki (optional)
     <script src="../assets/navmap/navmap-data.js"></script>
     <script src="../assets/navmap/navmap.js"></script>

   The page the reader is on is read from the URL (the first folder under the
   wiki root, which is worked out from this script's own address), so the same
   lines work at /, at /releaf-wiki/ and at /gems-taiwan/.

   Options on the section:
     data-here          force the "you are here" page (a slug)
     data-root          where links point, if not the wiki this script sits in
     data-keep-pagenav  keep the page's Previous / Next row
     data-local         clicks do not navigate; the section fires 'navmap:go'
                        with the slug in detail (for a review page)                */
(function () {
  'use strict';
  var D = window.NAVMAP_DATA;
  if (!D) return;

  var SEC = {}, PAGE = {}, ORDER = [];
  D.sections.forEach(function (s) { SEC[s.id] = s; });
  D.pages.forEach(function (p) { PAGE[p.slug] = p; ORDER.push(p.slug); });

  var me = document.currentScript && document.currentScript.src;
  var BASE = me ? me.replace(/[^/]*$/, '') : '';
  var ROOT = BASE.replace(/assets\/navmap\/$/, '');
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SVGNS = 'http://www.w3.org/2000/svg';

  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }
  function el(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function icon(key) {
    var s = document.createElementNS(SVGNS, 'svg');
    s.setAttribute('viewBox', '0 0 24 24');
    s.setAttribute('aria-hidden', 'true');
    s.innerHTML = D.icons[key] || D.icons.description;
    return s;
  }
  function paint(node, slug) {
    var s = SEC[PAGE[slug].section];
    node.style.setProperty('--s-ink', s.ink);
    node.style.setProperty('--s-line', s.line);
    node.style.setProperty('--s-pill', s.pill);
    node.setAttribute('data-section', s.id);
  }
  function hereFromUrl() {
    var at = location.href.split(/[?#]/)[0];
    if (ROOT && at.indexOf(ROOT) === 0) {
      var slug = at.slice(ROOT.length).split('/')[0];
      if (PAGE[slug]) return slug;
    }
    return '';
  }
  function linksOf(slug) { return (D.links[slug] || []).filter(function (l) { return PAGE[l.to]; }); }
  function neighbours(slug) {
    var set = {};
    linksOf(slug).forEach(function (l) { set[l.to] = true; });
    // a page that points here is a neighbour too
    ORDER.forEach(function (o) { linksOf(o).forEach(function (l) { if (l.to === slug) set[o] = true; }); });
    return set;
  }

  function common(root) {
    var here = root.getAttribute('data-here');
    if (here === null || !PAGE[here]) here = hereFromUrl();
    var linkRoot = root.getAttribute('data-root') || ROOT;
    if (!root.hasAttribute('data-keep-pagenav')) {
      var pn = document.querySelectorAll('.pagenav');
      for (var q = 0; q < pn.length; q++) pn[q].parentNode.removeChild(pn[q]);
    }
    var local = root.hasAttribute('data-local');
    function href(slug) { return linkRoot + slug + '/'; }
    function wireClick(a, slug) {
      if (!local) return;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        root.dispatchEvent(new CustomEvent('navmap:go', { detail: slug, bubbles: true }));
      });
    }
    return { here: here, href: href, wireClick: wireClick };
  }

  /* ---------------------------------------------------------------- the page map */
  function mountPage(root) {
    var c = common(root), here = c.here;
    if (!PAGE[here]) return;
    var links = linksOf(here);
    var lanes = { 'in': links.filter(function (l) { return l.lane === 'in'; }), out: links.filter(function (l) { return l.lane !== 'in'; }) };

    root.classList.add('navmap', 'nm-page');
    root.innerHTML = '';
    paint(root, here);

    var head = h('header', 'nm-head');
    var ht = h('div');
    ht.appendChild(h('p', 'nm-eyebrow', 'Where this page sits'));
    var title = h('h2', 'nm-title', 'Explore our project');
    title.setAttribute('data-no-toc', '');
    ht.appendChild(title);
    head.appendChild(ht);
    head.appendChild(h('p', 'nm-sub', 'What this page builds on, and where it leads.'));
    root.appendChild(head);

    var board = h('div', 'nm-board');
    root.appendChild(board);
    var wires = el('svg', { class: 'nm-wires', 'aria-hidden': 'true' }, board);

    function lane(key, label) {
      var d = h('div', 'nm-lane nm-' + key);
      var hh = h('h3', 'nm-lane__h', label + ' ');
      hh.setAttribute('data-no-toc', '');
      hh.appendChild(h('b', null, String(lanes[key].length)));
      d.appendChild(hh);
      var ul = h('ul');
      d.appendChild(ul);
      lanes[key].forEach(function (l) {
        var li = h('li');
        var a = h('a', 'nm-card');
        a.href = c.href(l.to);
        a.setAttribute('data-page', l.to);
        paint(a, l.to);
        var ic = h('span', 'nm-card__icon'); ic.appendChild(icon(PAGE[l.to].icon)); a.appendChild(ic);
        var t = h('span', 'nm-card__text');
        var nm = h('span', 'nm-card__name', PAGE[l.to].name);
        if (l.next) nm.appendChild(h('span', 'nm-next', 'Read next'));
        t.appendChild(nm);
        t.appendChild(h('span', 'nm-card__why', l.why || PAGE[l.to].caption));
        a.appendChild(t);
        c.wireClick(a, l.to);
        a.addEventListener('mouseenter', function () { light(l.to, true); });
        a.addEventListener('mouseleave', function () { light(l.to, false); });
        a.addEventListener('focus', function () { light(l.to, true); });
        a.addEventListener('blur', function () { light(l.to, false); });
        li.appendChild(a);
        ul.appendChild(li);
      });
      return d;
    }
    board.appendChild(lane('in', 'Builds on'));

    var hub = h('div', 'nm-hub');
    var hc = h('div', 'nm-hub__card');
    hc.setAttribute('aria-current', 'page');
    paint(hc, here);
    var hi = h('span', 'nm-hub__icon'); hi.appendChild(icon(PAGE[here].icon)); hc.appendChild(hi);
    hc.appendChild(h('span', 'nm-hub__eyebrow', 'You are here'));
    hc.appendChild(h('strong', 'nm-hub__name', PAGE[here].name));
    hc.appendChild(h('span', 'nm-hub__cap', PAGE[here].caption));
    hub.appendChild(hc);
    board.appendChild(hub);

    board.appendChild(lane('out', 'Leads to'));

    var cards = root.querySelectorAll('.nm-card');
    var wire = {};
    function light(slug, on) {
      var w = wire[slug];
      if (w) { w.path.classList.toggle('nm-lit', on); w.dot.classList.toggle('nm-lit', on); }
    }

    // the wires: a curve from each card to the page card, drawn from the real layout
    function draw() {
      var bw = board.clientWidth, bh = board.clientHeight;
      if (!bw || window.getComputedStyle(wires).display === 'none') return;
      wires.setAttribute('viewBox', '0 0 ' + bw + ' ' + bh);
      wires.innerHTML = '';
      var defs = el('defs', {}, wires);
      var b0 = board.getBoundingClientRect(), hb = hc.getBoundingClientRect();
      var hubL = hb.left - b0.left, hubR = hb.right - b0.left, hubT = hb.top - b0.top, hubH = hb.height;
      ['in', 'out'].forEach(function (key) {
        var list = lanes[key];
        list.forEach(function (l, i) {
          var a = root.querySelector('.nm-card[data-page="' + l.to + '"]');
          if (!a) return;
          var r = a.getBoundingClientRect();
          var s = SEC[PAGE[l.to].section];
          var cy = r.top - b0.top + r.height / 2;
          var hy = hubT + hubH * (i + 1) / (list.length + 1);
          var x1, x2, d;
          if (key === 'in') { x1 = r.right - b0.left; x2 = hubL; }
          else { x1 = hubR; x2 = r.left - b0.left; }
          var mx = (x1 + x2) / 2;
          var y1 = key === 'in' ? cy : hy, y2 = key === 'in' ? hy : cy;
          d = 'M' + x1 + ',' + y1 + ' C' + mx + ',' + y1 + ' ' + mx + ',' + y2 + ' ' + x2 + ',' + y2;
          var mk = el('marker', { id: 'nm-arrow-' + l.to, viewBox: '0 0 10 10', refX: '8', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' }, defs);
          el('path', { d: 'M1,1 L9,5 L1,9', fill: 'none', stroke: s.ink, 'stroke-width': '1.6', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, mk);
          var g = el('g', { style: '--s-ink:' + s.ink + ';--s-line:' + s.line }, wires);
          var p = el('path', { class: 'nm-wire' + (l.next ? ' nm-next' : ''), d: d, 'marker-end': 'url(#nm-arrow-' + l.to + ')' }, g);
          // a small dot where the wire leaves
          var dot = el('circle', { class: 'nm-dot', cx: x1, cy: y1, r: 3.5 }, g);
          wire[l.to] = { path: p, dot: dot };
        });
      });
    }
    var raf = 0;
    function redraw() { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
    redraw();
    if ('ResizeObserver' in window) new ResizeObserver(redraw).observe(board);
    else window.addEventListener('resize', redraw);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
    window.addEventListener('load', redraw);
    root._nmRedraw = redraw;
  }

  /* ---------------------------------------------------------------- the whole wiki */
  function mountAll(root) {
    var c = common(root), here = c.here;
    root.classList.add('navmap', 'nm-all');
    root.innerHTML = '';
    if (PAGE[here]) paint(root, here);

    var head = h('header', 'nm-head');
    var ht = h('div');
    ht.appendChild(h('p', 'nm-eyebrow', 'Every page'));
    var title = h('h2', 'nm-title', 'The whole project');
    title.setAttribute('data-no-toc', '');
    ht.appendChild(title);
    head.appendChild(ht);
    head.appendChild(h('p', 'nm-sub', D.pages.length + ' pages in five sections, and every link between them.'));
    root.appendChild(head);

    var grid = h('div', 'nm-allgrid');
    root.appendChild(grid);
    var ring = h('div', 'nm-ring');
    grid.appendChild(ring);

    // geometry: pages round a circle, grouped by section with a gap between groups
    var W = 1000, CX = 500, CY = 500, R = 236, GAP = 2.4, LBL = 20;
    var n = ORDER.length, groups = D.sections.length;
    var step = (360 - GAP * groups * 2) / n;
    var ang = {}, a = -90 + GAP, secArc = {};
    D.sections.forEach(function (s) {
      var first = a;
      ORDER.forEach(function (slug) {
        if (PAGE[slug].section !== s.id) return;
        a += step / 2; ang[slug] = a; a += step / 2;
      });
      secArc[s.id] = [first, a];
      a += GAP * 2;
    });
    function pt(deg, r) { var t = deg * Math.PI / 180; return [CX + r * Math.cos(t), CY + r * Math.sin(t)]; }
    function arcPath(a0, a1, r) {
      var p0 = pt(a0, r), p1 = pt(a1, r);
      return 'M' + p0[0] + ',' + p0[1] + ' A' + r + ',' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + p1[0] + ',' + p1[1];
    }

    var svg = el('svg', { viewBox: '0 0 ' + W + ' ' + W, role: 'group', 'aria-label': 'Every page of ReLEAF and the links between them' }, ring);
    // on a phone the names are hidden, so the picture closes in on the ring itself
    var narrow = window.matchMedia('(max-width: 640px)');
    function fit() {
      var pad = narrow.matches ? R + 36 : W / 2;
      svg.setAttribute('viewBox', (CX - pad) + ' ' + (CY - pad) + ' ' + (pad * 2) + ' ' + (pad * 2));
    }
    fit();
    if (narrow.addEventListener) narrow.addEventListener('change', fit); else narrow.addListener(fit);
    var gEdges = el('g', { class: 'nm-edges', 'aria-hidden': 'true' }, svg);
    var gArcs = el('g', { class: 'nm-arcs', 'aria-hidden': 'true' }, svg);
    var gNodes = el('g', { class: 'nm-nodes' }, svg);

    // section arcs just inside the ring, each with its name
    D.sections.forEach(function (s) {
      var ar = secArc[s.id];
      var g = el('g', { style: '--s-ink:' + s.ink + ';--s-line:' + s.line, 'data-section': s.id }, gArcs);
      el('path', { class: 'nm-arc', d: arcPath(ar[0] + 0.8, ar[1] - 0.8, R - 22) }, g);
      var mid = (ar[0] + ar[1]) / 2, p = pt(mid, R - 50);
      var t = el('text', { class: 'nm-secname', x: p[0], y: p[1], 'text-anchor': 'middle', 'dominant-baseline': 'middle' }, g);
      t.textContent = s.name;
    });

    // every link once (the pair, not the direction)
    var seen = {}, edges = [];
    ORDER.forEach(function (from) {
      linksOf(from).forEach(function (l) {
        var k = from < l.to ? from + '|' + l.to : l.to + '|' + from;
        if (seen[k]) return; seen[k] = true;
        edges.push([from, l.to]);
      });
    });
    var edgeEls = [];
    edges.forEach(function (e) {
      var p0 = pt(ang[e[0]], R - 10), p1 = pt(ang[e[1]], R - 10);
      var k = 0.28;   // how far the bend sits from the centre: 0 = straight through the middle
      var cx = CX + ((p0[0] + p1[0]) / 2 - CX) * k, cy = CY + ((p0[1] + p1[1]) / 2 - CY) * k;
      var path = el('path', { class: 'nm-edge', d: 'M' + p0[0] + ',' + p0[1] + ' Q' + cx + ',' + cy + ' ' + p1[0] + ',' + p1[1], 'data-a': e[0], 'data-b': e[1] }, gEdges);
      if (e[0] === here || e[1] === here) {
        path.classList.add('nm-here');
        var s = SEC[PAGE[here].section];
        path.style.setProperty('--s-line', s.line);
      }
      edgeEls.push(path);
    });

    var nodeEl = {};
    ORDER.forEach(function (slug) {
      var p = PAGE[slug], s = SEC[p.section], deg = ang[slug], pos = pt(deg, R);
      var a = el('a', { class: 'nm-node' + (slug === here ? ' nm-is-here' : ''), 'data-page': slug, href: c.href(slug), 'aria-label': p.name + (slug === here ? ' (you are here)' : '') }, gNodes);
      a.style.setProperty('--s-ink', s.ink); a.style.setProperty('--s-line', s.line);
      if (slug === here) a.setAttribute('aria-current', 'page');
      el('circle', { class: 'nm-hit', cx: pos[0], cy: pos[1], r: 16 }, a);
      el('circle', { class: 'nm-halo', cx: pos[0], cy: pos[1], r: 11 }, a);
      el('circle', { class: 'nm-dot', cx: pos[0], cy: pos[1], r: 6 }, a);
      var flip = deg > 90 && deg < 270;
      var t = el('text', { transform: 'translate(' + pos[0] + ',' + pos[1] + ') rotate(' + (flip ? deg + 180 : deg) + ')', x: flip ? -LBL : LBL, 'text-anchor': flip ? 'end' : 'start', 'dominant-baseline': 'middle' }, a);
      t.textContent = p.name;
      nodeEl[slug] = a;
      c.wireClick(a, slug);
    });

    // the centre: what is lit
    var centre = el('g', { class: 'nm-centre', 'aria-hidden': 'true' }, svg);
    var c3 = el('text', { class: 'nm-c3', x: CX, y: CY - 30 }, centre);
    var c1 = el('text', { class: 'nm-c1', x: CX, y: CY + 4 }, centre);
    var c2 = el('text', { class: 'nm-c2', x: CX, y: CY + 32 }, centre);

    // the panel: the active page and its links, with the reasons
    var panel = h('aside', 'nm-panel');
    grid.appendChild(panel);
    var chips = h('ul', 'nm-chips');
    panel.appendChild(chips);
    var chipEl = {};
    D.sections.forEach(function (s) {
      var li = h('li');
      var b = h('button', 'nm-chip', s.name);
      b.type = 'button';
      b.style.setProperty('--s-ink', s.ink); b.style.setProperty('--s-line', s.line); b.style.setProperty('--s-pill', s.pill);
      b.addEventListener('mouseenter', function () { lightSection(s.id); });
      b.addEventListener('mouseleave', function () { settle(); });
      b.addEventListener('focus', function () { lightSection(s.id); });
      b.addEventListener('blur', function () { settle(); });
      b.addEventListener('click', function () { lightSection(s.id); });
      li.appendChild(b);
      chips.appendChild(li);
      chipEl[s.id] = b;
    });
    var focus = h('div', 'nm-focus');
    panel.appendChild(focus);

    function fillFocus(slug) {
      focus.innerHTML = '';
      if (!PAGE[slug]) {
        focus.style.display = 'none';
        return;
      }
      focus.style.display = '';
      paint(focus, slug);
      var p = PAGE[slug];
      var fh = h('div', 'nm-focus__head');
      var ic = h('span', 'nm-focus__icon'); ic.appendChild(icon(p.icon)); fh.appendChild(ic);
      var ft = h('div');
      ft.appendChild(h('span', 'nm-focus__eyebrow', slug === here ? 'You are here · ' + SEC[p.section].name : SEC[p.section].name));
      var fn = h('a', 'nm-focus__name', p.name);
      fn.href = c.href(slug); fn.style.color = 'inherit'; fn.style.textDecoration = 'none';
      c.wireClick(fn, slug);
      ft.appendChild(fn);
      ft.appendChild(h('div', 'nm-focus__cap', p.caption));
      fh.appendChild(ft);
      focus.appendChild(fh);
      var links = linksOf(slug);
      [['in', 'Builds on'], ['out', 'Leads to']].forEach(function (L) {
        var list = links.filter(function (l) { return (l.lane === 'in') === (L[0] === 'in'); });
        if (!list.length) return;
        var lane = h('div', 'nm-focus__lane');
        var hh = h('h4', null, L[1]); hh.setAttribute('data-no-toc', '');
        lane.appendChild(hh);
        list.forEach(function (l) {
          var r = h('a', 'nm-row');
          r.href = c.href(l.to);
          r.setAttribute('data-page', l.to);
          paint(r, l.to);
          var ri = h('span', 'nm-row__icon'); ri.appendChild(icon(PAGE[l.to].icon)); r.appendChild(ri);
          var rt = h('span', 'nm-row__t');
          var rn = h('span', 'nm-row__name', PAGE[l.to].name);
          if (l.next) rn.appendChild(h('span', 'nm-next', 'Read next'));
          rt.appendChild(rn);
          rt.appendChild(h('span', 'nm-row__why', l.why || PAGE[l.to].caption));
          r.appendChild(rt);
          c.wireClick(r, l.to);
          r.addEventListener('mouseenter', function () { nodeEl[l.to].classList.add('nm-active'); });
          r.addEventListener('mouseleave', function () { nodeEl[l.to].classList.remove('nm-active'); });
          lane.appendChild(r);
        });
        focus.appendChild(lane);
      });
    }

    function clearLit() {
      root.removeAttribute('data-lit');
      Object.keys(nodeEl).forEach(function (k) { nodeEl[k].classList.remove('nm-lit', 'nm-active'); });
      edgeEls.forEach(function (e) { e.classList.remove('nm-lit'); e.style.removeProperty('--s-ink'); });
      var arcs = gArcs.querySelectorAll('.nm-arc, .nm-secname');
      for (var i = 0; i < arcs.length; i++) arcs[i].classList.remove('nm-lit');
      Object.keys(chipEl).forEach(function (k) { chipEl[k].classList.remove('nm-lit'); });
    }
    function setCentre(a, b, cc) { c1.textContent = a || ''; c2.textContent = b || ''; c3.textContent = cc || ''; }
    function lightPage(slug) {
      clearLit();
      root.setAttribute('data-lit', slug);
      var s = SEC[PAGE[slug].section];
      var nb = neighbours(slug);
      nodeEl[slug].classList.add('nm-lit', 'nm-active');
      var count = 0;
      Object.keys(nb).forEach(function (k) { nodeEl[k].classList.add('nm-lit'); count++; });
      edgeEls.forEach(function (e) {
        if (e.getAttribute('data-a') === slug || e.getAttribute('data-b') === slug) { e.classList.add('nm-lit'); e.style.setProperty('--s-ink', s.ink); }
      });
      var secs = {};
      secs[s.id] = true;
      Object.keys(nb).forEach(function (k) { secs[PAGE[k].section] = true; });
      Object.keys(secs).forEach(function (id) {
        var g = gArcs.querySelector('[data-section="' + id + '"]');
        if (g) { g.querySelector('.nm-arc').classList.add('nm-lit'); g.querySelector('.nm-secname').classList.add('nm-lit'); }
      });
      centre.style.setProperty('--s-ink', s.ink);
      setCentre(PAGE[slug].name, count + ' linked page' + (count === 1 ? '' : 's'), s.name);
      fillFocus(slug);
    }
    function lightSection(id) {
      clearLit();
      root.setAttribute('data-lit', 'section:' + id);
      var s = SEC[id], count = 0;
      ORDER.forEach(function (k) { if (PAGE[k].section === id) { nodeEl[k].classList.add('nm-lit'); count++; } });
      edgeEls.forEach(function (e) {
        if (PAGE[e.getAttribute('data-a')].section === id && PAGE[e.getAttribute('data-b')].section === id) { e.classList.add('nm-lit'); e.style.setProperty('--s-ink', s.ink); }
      });
      var g = gArcs.querySelector('[data-section="' + id + '"]');
      g.querySelector('.nm-arc').classList.add('nm-lit'); g.querySelector('.nm-secname').classList.add('nm-lit');
      chipEl[id].classList.add('nm-lit');
      centre.style.setProperty('--s-ink', s.ink);
      setCentre(s.name, count + ' pages', 'Section');
      fillFocus(here);
    }
    function settle() {
      clearLit();
      centre.style.removeProperty('--s-ink');
      if (PAGE[here]) {
        var s = SEC[PAGE[here].section];
        centre.style.setProperty('--s-ink', s.ink);
        setCentre(PAGE[here].name, D.pages.length + ' pages · ' + edges.length + ' links', 'You are here');
      } else {
        setCentre('ReLEAF', D.pages.length + ' pages · ' + edges.length + ' links', 'Our wiki');
      }
      fillFocus(here);
    }

    var touch = window.matchMedia('(hover: none)').matches, viaTouch = false, armed = null, hideT = 0;
    svg.addEventListener('pointerdown', function (e) { viaTouch = e.pointerType !== 'mouse'; }, true);
    ORDER.forEach(function (slug) {
      var a = nodeEl[slug];
      a.addEventListener('mouseenter', function () { if (!touch && !viaTouch) { clearTimeout(hideT); lightPage(slug); } });
      a.addEventListener('mouseleave', function () { if (!touch && !viaTouch) { clearTimeout(hideT); hideT = setTimeout(settle, 120); } });
      a.addEventListener('focus', function () { lightPage(slug); });
      a.addEventListener('blur', function () { hideT = setTimeout(settle, 120); });
      a.addEventListener('click', function (e) {
        // on a phone the first tap lights the page, the second goes there
        if ((touch || viaTouch) && armed !== slug) { e.preventDefault(); e.stopImmediatePropagation(); armed = slug; lightPage(slug); }
      }, true);
    });
    document.addEventListener('click', function (e) { if (armed && !root.contains(e.target)) { armed = null; settle(); } });
    settle();
  }

  function mount(root) {
    if (root.getAttribute('data-map') === 'all') mountAll(root); else mountPage(root);
  }
  window.NavMap = { mount: mount, data: D };
  function init() {
    var all = document.querySelectorAll('section.navmap');
    for (var i = 0; i < all.length; i++) if (!all[i].hasAttribute('data-manual')) mount(all[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
