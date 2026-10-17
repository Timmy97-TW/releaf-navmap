/* ReLEAF navigation map, the page scenes.

   Jacquelyn's idea, redrawn: every subpage ends on its own small scene. The
   page's own thing stands in the middle. What comes before it in the project
   stands down the road to the left, what comes after stands to the right, in
   order. Where one thing mirrors another (the Digital Twin and the reactor)
   the two stand side by side at the same size. Where the work loops back to
   learn (results feeding the twin, the model, the next cycle) a route arcs
   back from the later thing to the middle one.

   The scene is set where the page lives: wet-lab pages under the lab
   pavilion, dry-lab pages under the studio roof, project pages in the gravel
   yard, engagement pages on the town plaza, team pages on the village green,
   the Plants page in the field. No words are painted in; names and reasons
   sit under the picture. The Description page uses the whole valley instead
   (art.js, data-art="all").

     <section class="navmap" data-art="scene"></section>
   Needs navmap-data.js and art.js (for the drawings). */
(function () {
  'use strict';
  var A = window.NavMapArt && window.NavMapArt.lib, D = window.NAVMAP_DATA;
  if (!A || !D) return;
  var C = A.C, PLACE = A.PLACE, SEC = A.SEC, PAGE = A.PAGE, h = A.h, esc = A.esc, r1 = A.r1;
  var rect = A.rect, path = A.path, ell = A.ell, circ = A.circ, stroke = A.stroke, line = A.line, poly = A.poly;

  /* ---- the flow of every page: what stands before it, beside it, after it, and what loops back ----
     The pages named are Jacquelyn's choice for each page (navmap-data.js); only the arrangement is new. */
  var FLOW = {
    description:              { before: ['human-practices', 'team'], after: ['plant', 'hardware', 'software', 'results'] },
    biomanufacturing:         { before: ['protein-design', 'software'], peer: 'hardware', after: ['laws-and-regulations', 'entrepreneurship'] },
    engineering:              { before: ['experiments', 'measurement', 'protein-design'], peer: 'hardware', after: ['results', 'biomanufacturing'], loop: 'results' },
    development:              { before: ['engineering', 'human-practices', 'milestones'], after: ['results', 'contribution'], loop: 'results' },
    contribution:             { before: ['hardware', 'plant', 'results'], after: ['education', 'team'] },
    results:                  { before: ['experiments', 'measurement', 'hardware', 'software', 'team'], after: ['plant'] },
    experiments:              { before: ['parts', 'safety-and-security', 'notebook'], after: ['measurement', 'plant', 'results'], loop: 'results' },
    parts:                    { before: ['protein-design', 'engineering', 'notebook'], after: ['experiments', 'results', 'biomanufacturing'] },
    plant:                    { before: ['experiments', 'measurement', 'hardware'], after: ['results', 'geospatial-analysis', 'human-practices'] },
    measurement:              { before: ['hardware', 'software', 'experiments'], after: ['model', 'plant', 'results'], loop: 'model' },
    'safety-and-security':    { before: ['notebook'], after: ['experiments', 'parts', 'hardware', 'laws-and-regulations', 'sustainability'] },
    notebook:                 { before: ['experiments', 'parts', 'measurement'], after: ['engineering', 'development', 'results'] },
    model:                    { before: ['measurement', 'hardware', 'drylab-notebook'], peer: 'software', after: ['results', 'geospatial-analysis'], loop: 'results' },
    hardware:                 { before: ['engineering', 'safety-and-security'], peer: 'software', after: ['measurement', 'plant', 'biomanufacturing'] },
    software:                 { before: ['model', 'measurement'], peer: 'hardware', after: ['drylab-notebook', 'plant', 'results'], loop: 'results' },
    'protein-design':         { before: ['model', 'drylab-notebook'], after: ['parts', 'engineering', 'results', 'biomanufacturing'], loop: 'results' },
    'drylab-notebook':        { before: ['protein-design', 'model', 'hardware', 'software'], after: ['results'] },
    'human-practices':        { before: ['team'], after: ['plant', 'laws-and-regulations', 'entrepreneurship', 'education', 'sustainability'], loop: 'plant' },
    education:                { before: ['description', 'human-practices', 'team'], after: ['contribution', 'data-physicalization', 'sustainability'] },
    entrepreneurship:         { before: ['biomanufacturing', 'hardware', 'plant', 'human-practices'], after: ['laws-and-regulations', 'sustainability'] },
    sustainability:           { before: ['laws-and-regulations', 'entrepreneurship', 'safety-and-security', 'human-practices'], after: ['contribution'] },
    'laws-and-regulations':   { before: ['biomanufacturing', 'safety-and-security', 'human-practices'], after: ['entrepreneurship', 'sustainability'] },
    'geospatial-analysis':    { before: ['model', 'plant'], after: ['data-physicalization', 'sustainability', 'human-practices'] },
    'data-physicalization':   { before: ['results', 'plant', 'model', 'geospatial-analysis'], after: ['education', 'human-practices'] },
    team:                     { before: ['attributions', 'milestones'], after: ['description', 'contribution', 'education', 'results'] },
    attributions:             { before: ['team', 'milestones'], after: ['experiments', 'contribution', 'human-practices'] },
    milestones:               { before: ['team', 'description'], after: ['engineering', 'development', 'contribution', 'results'] }
  };
  // the words for the caption, by lane
  var LANE = { before: 'Before', peer: 'Beside', after: 'After' };

  var W = 2400, H = 780, GROUND = 226;

  /* ---- the setting: where a section's pages live ---- */
  function setting(section, id, slug) {
    var s = '', i;
    var ground = 'url(#' + id + '-ground)';
    s += rect(0, 0, W, H, 'url(#' + id + '-sky)') + circ(1960, 96, 190, 'url(#' + id + '-sun)') + circ(1960, 96, 36, C.sun);
    s += ell(380, 92, 120, 12, C.white, ' opacity=".4"') + ell(1240, 70, 150, 12, C.white, ' opacity=".35"') + ell(2200, 150, 80, 9, C.white, ' opacity=".3"');
    s += '<g filter="url(#' + id + '-brushsoft)">' + A.mountains(W, 170, .6, 'url(#' + id + '-mist)') + '</g>';
    s += '<g filter="url(#' + id + '-brush)">';
    s += rect(0, GROUND - 20, W, H - GROUND + 20, ground);
    s += A.farFields(GROUND - 30, GROUND + 60, W) + A.treeline(GROUND + 46, W, 66, .55);
    s += path('M0,' + (GROUND + 70) + ' C400,' + (GROUND + 50) + ' 900,' + (GROUND + 90) + ' 1300,' + (GROUND + 70) + ' S2000,' + (GROUND + 50) + ' 2400,' + (GROUND + 80) + ' V' + H + ' H0 Z', ground);
    s += rect(0, GROUND + 60, W, H - GROUND - 60, '#fff', ' filter="url(#' + id + '-strokes)" opacity=".9"');
    // the zone's own floor: a wide slab with soft corners, filling the frame
    function soft(x0, y0, x1, y1, r, fill, edge) {
      var d = 'M' + (x0 + r) + ',' + y0 + ' H' + (x1 - r) + ' Q' + x1 + ',' + y0 + ' ' + x1 + ',' + (y0 + r) + ' V' + (y1 - r) + ' Q' + x1 + ',' + y1 + ' ' + (x1 - r) + ',' + y1 + ' H' + (x0 + r) + ' Q' + x0 + ',' + y1 + ' ' + x0 + ',' + (y1 - r) + ' V' + (y0 + r) + ' Q' + x0 + ',' + y0 + ' ' + (x0 + r) + ',' + y0 + ' Z';
      return path(d, edge, ' transform="translate(0,8)" opacity=".9"') + path(d, fill);
    }
    var fy0 = GROUND + 130, fy1 = H - 34;
    if (section === 'wetlab' && slug !== 'plant') {
      s += soft(140, fy0, 2260, fy1, 60, C.pave, C.pave2);
      for (i = 0; i < 14; i++) s += line([[160 + i * 150, fy0 + 10], [140 + i * 150, fy1 - 10]], 1, C.pave2, ' opacity=".6"');
      s += A.pavilion(300, 2100, fy0 + 40, 250, C.roofGreenShade, C.roofGreen, '');
    } else if (section === 'drylab') {
      s += soft(140, fy0, 2260, fy1, 60, C.pave, C.pave2);
      for (i = 0; i < 14; i++) s += line([[160 + i * 150, fy0 + 10], [140 + i * 150, fy1 - 10]], 1, C.pave2, ' opacity=".6"');
      s += A.pavilion(300, 2100, fy0 + 40, 250, C.roofBlueShade, C.roofBlue, '');
    } else if (section === 'project') {
      s += soft(120, fy0, 2280, fy1, 70, C.gravel, C.gravel2);
      A.setSeed(11); for (i = 0; i < 160; i++) s += circ(140 + Math.random() * 2120, fy0 + 20 + Math.random() * (fy1 - fy0 - 40), 1.6 + Math.random() * 2.2, C.gravel2, ' opacity=".7"');
      s += A.fence(150, fy0 + 30, 7, 12) + A.fence(2170, fy0 + 30, 7, 12);
    } else if (section === 'engagement') {
      s += soft(120, fy0, 2280, fy1, 70, C.pave, C.pave2);
      for (i = 0; i < 16; i++) s += line([[150 + i * 140, fy0], [120 + i * 150, fy1]], 1, C.pave2, ' opacity=".7"');
      for (i = 1; i < 6; i++) s += line([[124, fy0 + i * 70], [2276, fy0 + i * 70]], 1, C.pave2, ' opacity=".7"');
      s += ell(300, fy1 - 20, 90, 22, C.lawn) + ell(2100, fy1 - 20, 90, 22, C.lawn) + A.flowers(230, fy1 - 36, 140, 28, C.gold, 20) + A.flowers(2030, fy1 - 36, 140, 28, C.white, 20);
    } else if (section === 'team') {
      s += soft(120, fy0, 2280, fy1, 90, C.lawn, C.plainDeep);
      s += ell(2060, fy1 - 60, 120, 34, C.bank, ' opacity=".8"') + ell(2060, fy1 - 62, 108, 28, C.riverLight) + ell(2056, fy1 - 64, 88, 20, C.river) + ell(2030, fy1 - 70, 18, 4, C.white, ' opacity=".5"');
      s += A.flowers(160, fy0 + 20, 500, 60, C.white, 36);
    } else {
      // the field
      s += soft(100, fy0, 2300, fy1, 40, C.soil2, C.soil);
      for (i = 0; i < 7; i++) s += line([[130, fy0 + 30 + i * 60], [2270, fy0 + 36 + i * 60]], 3, C.soil, ' opacity=".8"') + line([[130, fy0 + 42 + i * 60], [2270, fy0 + 48 + i * 60]], 1.2, C.ochre, ' opacity=".35"');
      s += A.hay(2200, fy0 + 40, 1.2) + A.hay(2240, fy0 + 60, 1);
    }
    // the road the things stand along, through the middle of the floor
    var ry = fy0 + (fy1 - fy0) * .62;
    s += A.roadPath('M-20,' + (ry + 20) + ' C400,' + (ry + 30) + ' 800,' + (ry - 10) + ' 1200,' + (ry) + ' S2000,' + (ry + 30) + ' 2420,' + (ry + 10), 44);
    // trees outside the floor, grass in front
    s += A.tree(70, fy0 + 60, 1.2, 2) + A.tree(2340, fy0 + 80, 1.15) + A.bush(40, H - 30, 1.1) + A.bush(2370, H - 24, 1.0) + A.tuft(600, H - 12) + A.tuft(1500, H - 16) + A.tuft(2000, H - 10);
    s += '</g>';
    s += rect(0, 0, W, H, 'url(#' + id + '-vig)');
    return { svg: s, roadY: ry };
  }

  function mountScene(root) {
    var c = A.common(root), here = c.here, id = 'nms' + Math.floor(Math.random() * 1e6);
    if (!PAGE[here]) return;
    var flow = FLOW[here] || { before: [], after: [] };
    var sec = SEC[PAGE[here].section];
    root.classList.add('navmap', 'nma', 'nma-scene');
    root.innerHTML = '';
    root.style.setProperty('--s-ink', sec.ink);
    A.head(root, 'Where this page sits', 'Explore our project', 'What comes before this page stands to the left, what comes after to the right. A route curving back is the work learning from itself.');
    var stage = h('div', 'nma-stage'); root.appendChild(stage);
    var scroller = h('div', 'nma-scroll'); stage.appendChild(scroller);
    var inner = h('div', 'nma-inner nma-inner--scene'); scroller.appendChild(inner);

    var set = setting(sec.id, id, here), ry = set.roadY;
    var s = '<svg class="nma-svg" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="' + esc(PAGE[here].name) + ' and the pages around it. Arrow keys move between places.">' + A.defs(id);
    s += '<g class="nma-ground">' + set.svg + '</g>';

    // where everything stands. The page in the middle (with its peer beside it), the rest along the road
    var POS = {}, slugs = [];
    function fit(k, slug) { return k * Math.min(1, Math.sqrt(72 / PLACE[slug].r)); }
    var cx = 1200, peer = flow.peer && PAGE[flow.peer] ? flow.peer : null;
    var big = 2.5;
    if (peer) {
      var hw = PLACE[here].r * fit(big, here), pw = PLACE[peer].r * fit(big, peer), gap = 70;
      var total = hw + pw + gap;
      POS[here] = [cx - total / 2 + hw / 2 - 20, ry + 70, fit(big, here)];
      POS[peer] = [cx + total / 2 - pw / 2 + 20, ry + 70, fit(big, peer)];
    } else POS[here] = [cx, ry + 70, fit(big, here)];
    slugs.push(here); if (peer) slugs.push(peer);
    var leftEdge = POS[here][0] - PLACE[here].r * POS[here][2] - 40;
    var rightEdge = (peer ? POS[peer][0] + PLACE[peer].r * POS[peer][2] : POS[here][0] + PLACE[here].r * POS[here][2]) + 40;
    function lane(list, x0, x1, dir) {
      var n = list.length; if (!n) return;
      var span = Math.abs(x1 - x0);
      list.forEach(function (slug, i) {
        if (!PAGE[slug] || POS[slug]) return;
        // before: the earliest furthest left; after: the latest furthest right
        var t = (i + .5) / n, x = dir < 0 ? x1 - t * span : x0 + t * span;
        var far = (i % 2 === 1);
        POS[slug] = [x, far ? ry - 16 : ry + 50, fit(far ? 1.6 : 1.85, slug)];
        slugs.push(slug);
      });
    }
    lane(flow.before, 140, leftEdge, -1);
    lane(flow.after, rightEdge, 2260, 1);

    var order = slugs.slice().sort(function (a, b) { return POS[a][1] - POS[b][1]; });
    s += '<g class="nma-places" filter="url(#' + id + '-brush)">';
    order.forEach(function (slug) {
      var p = POS[slug];
      if (slug === here) s += '<a aria-current="page" tabindex="0" aria-label="' + esc(PAGE[slug].name) + ', you are here">' + A.placeGroup(slug, p[0], p[1], p[2], 'nma-is-here') + '</a>';
      else s += '<a href="' + c.href(slug) + '" aria-label="' + esc(PAGE[slug].name) + '">' + A.placeGroup(slug, p[0], p[1], p[2], '') + '</a>';
    });
    s += '</g>';
    s += '<rect class="nma-dusk" x="0" y="0" width="' + W + '" height="' + H + '"/>';
    s += '<g class="nma-routes" filter="url(#' + id + '-route)"></g>';
    s += '<g class="nma-litlayer" filter="url(#' + id + '-brush)"></g>';
    var hp = POS[here]; s += A.beacon(hp[0], hp[1] - PLACE[here].r * 1.3 * hp[2] - 6, sec.ink);
    s += '<rect class="nma-paper" x="0" y="0" width="' + W + '" height="' + H + '" filter="url(#' + id + '-grain)"/>';
    s += '<g class="nma-tags">'; slugs.forEach(function (slug) { s += A.tagFor(slug, here); }); s += '</g>';
    s += '</svg>';
    inner.innerHTML = s;
    var svg = inner.querySelector('svg');
    var places = {}; inner.querySelectorAll('.nma-place').forEach(function (gg) { places[gg.getAttribute('data-page')] = gg; });
    var light = A.lighting(svg, places, order, svg.querySelector('.nma-places'), svg.querySelector('.nma-litlayer'));
    A.layoutTags(svg, function (slug) { var p = POS[slug]; var up = slug === here ? 66 : 18; return [p[0], p[1] - PLACE[slug].r * 1.35 * p[2] - up, p[1] - PLACE[slug].r * 1.1 * p[2] - (slug === here ? 50 : 0)]; }, slugs);

    // the routes: the flow runs left to right along the road; the loop arcs back over the top
    var routes = svg.querySelector('.nma-routes');
    function seq() {
      var left = flow.before.filter(function (k) { return POS[k]; }), right = flow.after.filter(function (k) { return POS[k]; });
      var chain = left.slice().reverse().concat([here]).concat(peer ? [peer] : []).concat(right);
      return chain;
    }
    function routeBetween(a, b, cls) {
      var pa = POS[a], pb = POS[b], mx = (pa[0] + pb[0]) / 2, my = Math.min(pa[1], pb[1]) - 60;
      return '<path' + (cls ? ' class="' + cls + '"' : '') + ' d="M' + r1(pa[0]) + ',' + r1(pa[1] - 6) + ' Q' + r1(mx) + ',' + r1(my) + ' ' + r1(pb[0]) + ',' + r1(pb[1] - 6) + '"/>';
    }
    function loopPath(cls) {
      if (!flow.loop || !POS[flow.loop]) return '';
      var pa = POS[flow.loop], pb = POS[here];
      var top = Math.min(pa[1], pb[1]) - PLACE[here].r * pb[2] * 1.5 - 90;
      return '<path class="nma-loop ' + (cls || '') + '" d="M' + r1(pa[0]) + ',' + r1(pa[1] - PLACE[flow.loop].r * pa[2] * 1.2) + ' C' + r1(pa[0]) + ',' + r1(top) + ' ' + r1(pb[0]) + ',' + r1(top) + ' ' + r1(pb[0]) + ',' + r1(pb[1] - PLACE[here].r * pb[2] * 1.45) + '"/>' +
        '<path class="nma-loop__head ' + (cls || '') + '" d="M' + r1(pb[0] - 14) + ',' + r1(pb[1] - PLACE[here].r * pb[2] * 1.45 - 26) + ' l14,22 l14,-22"/>';
    }
    function drawRoutes(only) {
      var r = '', chain = seq();
      if (only && only !== here) {
        // the lit place and its link to the page, plus the loop if it is the looping one
        r += routeBetween(here, only, 'nma-hot');
        if (peer && only === peer) r = routeBetween(here, peer, 'nma-hot');
        if (flow.loop === only) r += loopPath('nma-hot');
      } else {
        for (var i = 0; i < chain.length - 1; i++) r += routeBetween(chain[i], chain[i + 1], 'nma-rest' + (chain[i] === here || chain[i + 1] === here ? ' nma-near' : ''));
        if (peer) r += '<path class="nma-peer" d="M' + r1(POS[here][0]) + ',' + r1(POS[here][1] - PLACE[here].r * POS[here][2] * .7) + ' L' + r1(POS[peer][0]) + ',' + r1(POS[peer][1] - PLACE[peer].r * POS[peer][2] * .7) + '"/>';
        r += loopPath('nma-rest');
      }
      routes.innerHTML = r;
    }
    drawRoutes();

    var rows = {};
    function tagOf(slug) { return svg.querySelector('.nma-tag[data-for="' + slug + '"]'); }
    function lit(slug, on) {
      if (on) {
        root.setAttribute('data-lit', slug);
        light.lift(slug === here ? [here] : [here, slug]);
        places[slug].parentNode.classList.add('nma-active');
        tagOf(slug).classList.add('nma-show'); tagOf(here).classList.add('nma-show');
        if (rows[slug]) rows[slug].classList.add('nma-lit');
        drawRoutes(slug);
      } else {
        root.removeAttribute('data-lit');
        light.drop();
        tagOf(slug).classList.remove('nma-show'); tagOf(here).classList.remove('nma-show');
        if (rows[slug]) rows[slug].classList.remove('nma-lit');
        drawRoutes();
      }
    }
    var touch = window.matchMedia('(hover: none)').matches, viaTouch = false, armed = null;
    svg.addEventListener('pointerdown', function (e) { viaTouch = e.pointerType !== 'mouse'; }, true);
    function placeOf(t) { var a = t && t.closest ? t.closest('a') : null; var gg = a && a.querySelector('.nma-place'); return gg ? gg.getAttribute('data-page') : null; }
    svg.addEventListener('pointerover', function (e) { if (touch || viaTouch) return; var k = placeOf(e.target); if (k) lit(k, true); });
    svg.addEventListener('pointerout', function (e) { if (touch || viaTouch) return; var k = placeOf(e.target); if (k && !placeOf(e.relatedTarget)) lit(k, false); });
    svg.addEventListener('focusin', function (e) { var k = placeOf(e.target); if (k) lit(k, true); });
    svg.addEventListener('focusout', function (e) { var k = placeOf(e.target); if (k && !placeOf(e.relatedTarget)) lit(k, false); });
    svg.addEventListener('click', function (e) {
      var k = placeOf(e.target); if (!k) return;
      if (k === here) { e.preventDefault(); return; }
      if ((touch || viaTouch) && armed !== k) { e.preventDefault(); if (armed) lit(armed, false); armed = k; lit(k, true); return; }
      if (c.local) { e.preventDefault(); root.dispatchEvent(new CustomEvent('navmap:go', { detail: k, bubbles: true })); }
    });
    A.keyboard(svg, places, (function () { var o = {}; slugs.forEach(function (k) { o[k] = POS[k][0]; }); return o; })(), function () { if (armed) { lit(armed, false); armed = null; } });
    document.addEventListener('click', function (e) { if (armed && !root.contains(e.target)) { lit(armed, false); armed = null; } });

    // under the picture: the page, then before / beside / after, each with its reason; the loop named last
    var why = {}; A.linksOf(here).forEach(function (l) { why[l.to] = l; });
    var cap = h('div', 'nma-cap nma-cap--page'); root.appendChild(cap);
    var hd = h('div', 'nma-cap__head');
    hd.appendChild(h('span', 'nma-cap__eyebrow', 'You are here · ' + sec.name));
    hd.appendChild(h('span', 'nma-cap__name', PAGE[here].name));
    hd.appendChild(h('span', 'nma-cap__line', PAGE[here].caption));
    cap.appendChild(hd);
    var lanesEl = h('div', 'nma-lanes nma-lanes--scene');
    [['before', flow.before], ['peer', peer ? [peer] : []], ['after', flow.after]].forEach(function (L) {
      var list = L[1].filter(function (k) { return PAGE[k]; }); if (!list.length) return;
      var col = h('div', 'nma-lanecol nma-lanecol--' + L[0]);
      var hh = h('h4', null, LANE[L[0]]); hh.setAttribute('data-no-toc', ''); col.appendChild(hh);
      var ul = h('ul', 'nma-cap__links');
      list.forEach(function (k) {
        var l = why[k] || {}, li = h('li'), a = h('a'); a.href = c.href(k);
        var ls = SEC[PAGE[k].section]; a.style.setProperty('--s-ink', ls.ink); a.style.setProperty('--s-pill', ls.pill);
        a.appendChild(h('b', null, PAGE[k].name));
        a.appendChild(h('span', null, l.why || PAGE[k].caption));
        if (l.next) a.appendChild(h('i', 'nm-next', 'Read next'));
        if (flow.loop === k) a.appendChild(h('i', 'nm-next nm-loop', 'Loops back'));
        a.addEventListener('mouseenter', function () { lit(k, true); });
        a.addEventListener('mouseleave', function () { lit(k, false); });
        if (c.local) a.addEventListener('click', function (e) { e.preventDefault(); root.dispatchEvent(new CustomEvent('navmap:go', { detail: k, bubbles: true })); });
        rows[k] = a;
        li.appendChild(a); ul.appendChild(li);
      });
      col.appendChild(ul); lanesEl.appendChild(col);
    });
    cap.appendChild(lanesEl);
    A.note(root);
    if (scroller.scrollWidth > scroller.clientWidth + 4) scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
  }

  window.NavMapScene = { mount: mountScene, flow: FLOW };
  function init() {
    var all = document.querySelectorAll('section.navmap[data-art="scene"]');
    for (var i = 0; i < all.length; i++) if (!all[i].hasAttribute('data-manual')) mountScene(all[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
