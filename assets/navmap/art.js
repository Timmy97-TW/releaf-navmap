/* ReLEAF navigation map, the painted version.

   One valley, drawn in the manner of the homepage's vision painting: flat
   shapes in two or three tones, dry-brush edges, the olive / ochre / lime /
   blue-grey palette. Every page of the wiki is a place in it, and the valley
   reads left to right as the project does:

     the village (Team) · the lab (Wet Lab) · the studio (Dry Lab) ·
     the yard where the machine is built (Project) · the field (Plants) ·
     the town (Engagement)

   One road joins them, and the river crosses the field. Pointing at a place
   turns the valley to dusk and lights that place and the places it links to,
   the way the reactors light the fields on the homepage.

   Two pictures share the same place drawings:
     <section class="navmap" data-art="all"></section>    the whole valley
     <section class="navmap" data-art="page"></section>   the page you are on,
         large in the middle, the places it builds on down the road to the
         left, the places it leads to down the road to the right, each with a
         signpost saying why.

   Needs navmap-data.js. Everything here is vector, drawn in code, AI-assisted
   after the student painting; nothing is fetched. */
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

  /* ---- the palette, sampled from her painting ---- */
  var C = {
    skyTop: '#dce8e6', skyLow: '#f4edd0', sunHaze: '#f7e9b8',
    mtFar: '#6f8a93', mtMid: '#46606b', mtNear: '#30524a', mtLit: '#5f8f5e', mtLit2: '#7fae6a',
    ridge: '#4e7a4f', ridgeDark: '#365c3e',
    plain: '#aab06e', plain2: '#9eaa64', plainLight: '#b8bd7c',
    lime: '#92a842', lime2: '#a9bc55', yellow: '#d9c944', olive: '#94a660', olive2: '#a4b36e',
    ochre: '#bfa76e', ochre2: '#cbb67f', soil: '#7a5a2a', soil2: '#8d6a35', paddy: '#c9d3c0', paddy2: '#b7c6ba',
    road: '#c9b27f', roadEdge: '#b89f6c', river: '#7fa6b0', riverLight: '#a9c8cc', riverDeep: '#6b94a0',
    wall: '#ede3c8', wall2: '#d9ccab', roof: '#b4563a', roof2: '#8f4330', roofBlue: '#4a6a9c', roofBlue2: '#3b557d', roofGreen: '#3f6b4e',
    tree: '#3f7f4a', tree2: '#5a9a52', tree3: '#2f6a3e', trunk: '#6b4a2a',
    skin: '#e9c39a', hat: '#d9c27a', hat2: '#c2aa5e', shirtB: '#4b6aa0', shirtR: '#c84b3a', shirtW: '#f3efe3', shirtG: '#3f7f4a', pants: '#3a4a6a',
    glass: '#d3e6dc', glass2: '#b9d3c7', liquid: '#7fd05a', liquid2: '#5db842', metal: '#8a9299', metal2: '#6d757c', metalLight: '#b7bec4',
    wood: '#8a6a3a', wood2: '#6f5430', woodLight: '#b08a4e', paper: '#f6f3e8', paper2: '#e8e2cf', ink: '#2b2b2b', ink2: '#4a4a4a',
    green: '#4a8a4a', green2: '#376f3a', leaf: '#6fb352', red: '#c84b3a', blue: '#4b6aa0', gold: '#d9a93a', white: '#f6f3e8',
    shadow: '#2f3a2a', signal: '#8ddc5a'
  };

  /* ---- a tiny string-building vector kit ---- */
  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;'); }
  function pts(a) { return a.map(function (p) { return p[0] + ',' + p[1]; }).join(' '); }
  function poly(a, fill, extra) { return '<polygon points="' + pts(a) + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  function path(d, fill, extra) { return '<path d="' + d + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  function ell(cx, cy, rx, ry, fill, extra) { return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  function circ(cx, cy, r, fill, extra) { return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + fill + '"' + (extra || '') + '/>'; }
  function rect(x, y, w, h, fill, r, extra) { return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"' + (r ? ' rx="' + r + '"' : '') + ' fill="' + fill + '"' + (extra || '') + '/>'; }
  function line(a, w, col, extra) { return '<polyline points="' + pts(a) + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"' + (extra || '') + '/>'; }
  function shadow(cx, cy, rx, ry, a) { return ell(cx, cy, rx, ry, C.shadow, ' opacity="' + (a || 0.18) + '" style="mix-blend-mode:multiply"'); }
  function g(inner, extra) { return '<g' + (extra || '') + '>' + inner + '</g>'; }
  function at(x, y, s, inner) { return '<g transform="translate(' + x + ',' + y + ')' + (s && s !== 1 ? ' scale(' + s + ')' : '') + '">' + inner + '</g>'; }
  // a deterministic wobble so edges are not ruler-straight
  var seed = 7;
  function rnd() { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; }
  function jitter(a, k) { return a.map(function (p) { return [p[0] + (rnd() - 0.5) * k, p[1] + (rnd() - 0.5) * k]; }); }

  /* ---- shared small things ---- */
  function tree(x, y, s, tone) {
    s = s || 1; var top = tone === 1 ? C.tree2 : tone === 2 ? C.tree3 : C.tree;
    return at(x, y, s, shadow(0, 2, 16, 5, .16) + rect(-2.5, -14, 5, 15, C.trunk, 1) + circ(0, -22, 13, top) + circ(-6, -17, 9, top) + circ(7, -18, 9, top) + circ(-2, -26, 7, C.tree2));
  }
  function pine(x, y, s) {
    s = s || 1;
    return at(x, y, s, shadow(0, 2, 10, 4, .16) + rect(-2, -10, 4, 11, C.trunk) + poly([[0, -40], [-11, -16], [11, -16]], C.tree3) + poly([[0, -32], [-13, -6], [13, -6]], C.tree));
  }
  function person(x, y, s, shirt, hat, flip) {
    s = s || 1; var sh = shirt || C.shirtB;
    var b = shadow(0, 1, 9, 3, .16) +
      rect(-6, -14, 5, 14, C.pants, 1) + rect(1, -14, 5, 14, C.pants, 1) +
      path('M-7,-30 h14 v17 h-14 z', sh) + rect(-10, -29, 4, 13, sh, 2) + rect(6, -29, 4, 13, sh, 2) +
      circ(0, -36, 6, C.skin);
    if (hat) b += path('M-11,-39 L0,-50 L11,-39 Z', C.hat) + rect(-12, -40, 24, 3, C.hat2, 1);
    else b += path('M-6,-39 a6,5 0 0 1 12,0 v2 h-12 z', C.ink2);
    return at(x, y, s, (flip ? '<g transform="scale(-1,1)">' + b + '</g>' : b));
  }
  function house(x, y, s, roof, wall) {
    s = s || 1; roof = roof || C.roof; wall = wall || C.wall;
    return at(x, y, s, shadow(2, 4, 34, 9, .18) +
      poly([[-26, 0], [26, 0], [26, -28], [-26, -28]], wall) + poly([[-26, -28], [0, -46], [26, -28]], wall) +
      poly([[-31, -27], [0, -49], [31, -27], [26, -27], [0, -43], [-26, -27]], roof) +
      poly([[-31, -27], [0, -49], [0, -43], [-26, -27]], roof) + poly([[0, -49], [31, -27], [26, -27], [0, -43]], roof) +
      rect(-7, -16, 14, 16, C.wood2, 1) + rect(-21, -22, 9, 9, C.riverLight, 1) + rect(12, -22, 9, 9, C.riverLight, 1));
  }
  function flask(x, y, s, col) {
    s = s || 1; col = col || C.liquid;
    return at(x, y, s, path('M-4,-26 h8 v10 l9,16 h-26 l9,-16 z', C.glass) + path('M-9,-6 h18 l4,6 h-26 z', col) + rect(-5, -28, 10, 3, C.glass2, 1));
  }
  function beaker(x, y, s, col) {
    s = s || 1; col = col || C.blue;
    return at(x, y, s, rect(-8, -22, 16, 22, C.glass, 2) + rect(-8, -11, 16, 11, col, 1) + rect(-9, -23, 18, 3, C.glass2, 1));
  }
  function signpost(x, y, s, w, lines, face) {
    // a wooden sign on a post, text as page text in the picture
    s = s || 1; w = w || 120; var h = 14 + lines.length * 15;
    var t = '';
    lines.forEach(function (l, i) { t += '<text x="0" y="' + (-h + 20 + i * 15) + '" text-anchor="middle" class="nma-sign">' + esc(l) + '</text>'; });
    return at(x, y, s, shadow(0, 1, w / 3, 4, .14) + rect(-3, -h - 4, 6, h + 4, C.wood) +
      rect(-w / 2, -h - 10, w, h, face || C.paper, 4) + rect(-w / 2, -h - 10, w, 3, C.paper2, 1) + t);
  }

  /* ---- the 27 places. Each is drawn standing on (0,0), facing the reader. r = its reach for the hit area ---- */
  var PLACE = {};
  PLACE.team = { r: 70, draw: function () {
    return house(-44, -4, .8, C.roof) + house(40, -8, .75, C.roofBlue) + house(0, 10, .9, C.roof2) +
      tree(-82, 4, .8, 1) + tree(78, 10, .7) + person(-16, 36, .85, C.shirtG, false) + person(14, 40, .85, C.shirtW, false, true) + person(40, 34, .8, C.shirtB, false);
  } };
  PLACE.milestones = { r: 46, draw: function () {
    var f = shadow(0, 2, 20, 6, .16) + circ(0, -2, 14, C.ochre2) + circ(0, -3, 10, C.ochre) + rect(-2, -92, 4, 90, C.wood2);
    [[-88, C.red], [-72, C.gold], [-56, C.blue], [-40, C.leaf]].forEach(function (p) { f += poly([[2, p[0]], [26, p[0] + 6], [2, p[0] + 12]], p[1]); });
    return f + circ(0, -94, 4, C.gold);
  } };
  PLACE.attributions = { r: 46, draw: function () {
    return shadow(0, 2, 34, 6, .16) + rect(-30, -62, 4, 62, C.wood) + rect(26, -62, 4, 62, C.wood) +
      rect(-36, -66, 72, 44, C.wood2, 3) + rect(-33, -63, 66, 38, C.ochre2, 2) +
      rect(-28, -58, 18, 14, C.paper, 1) + rect(-7, -58, 14, 20, C.paper, 1) + rect(10, -58, 16, 12, C.paper, 1) + rect(-28, -41, 22, 12, C.paper, 1) + rect(8, -43, 18, 14, C.paper, 1) +
      circ(-19, -57, 2, C.red) + circ(0, -57, 2, C.blue) + circ(18, -57, 2, C.red) + circ(-17, -40, 2, C.gold) + circ(17, -42, 2, C.blue) +
      poly([[-36, -66], [0, -78], [36, -66]], C.roofGreen);
  } };
  PLACE.description = { r: 70, draw: function () {
    return shadow(0, 2, 60, 8, .16) + rect(-50, -70, 6, 70, C.wood2) + rect(44, -70, 6, 70, C.wood2) +
      rect(-62, -78, 124, 46, C.green2, 6) + rect(-58, -74, 116, 38, C.green, 4) +
      path('M-40,-50 c6,-18 22,-22 34,-20 c-4,14 -16,24 -34,20 z', C.leaf) + line([[-38, -46], [-14, -62]], 2, C.green2) +
      '<text x="12" y="-49" text-anchor="middle" class="nma-sign nma-sign--big">ReLEAF</text>' +
      tree(-80, 8, .7, 2) + tree(82, 4, .65, 1);
  } };
  PLACE.biomanufacturing = { r: 88, draw: function () {
    var f = shadow(4, 6, 86, 14, .2) + poly([[-84, 0], [84, 0], [84, -56], [-84, -56]], C.wall2) + poly([[-88, -56], [-44, -84], [0, -56], [44, -84], [88, -56]], C.roofGreen) +
      poly([[-84, -56], [-44, -80], [-4, -56]], C.roofGreen) + poly([[4, -56], [44, -80], [84, -56]], C.roofGreen) +
      rect(52, -104, 10, 50, C.metal2) + rect(50, -106, 14, 4, C.metal);
    [-56, -14, 28].forEach(function (x) { f += rect(x, -46, 26, 42, C.green2, 4) + rect(x + 4, -40, 18, 24, C.glass, 2) + rect(x + 4, -28, 18, 12, C.liquid, 1) + rect(x + 2, -50, 22, 5, C.metal, 1); });
    return f + ell(57, -112, 10, 5, C.white, ' opacity=".8"') + ell(66, -120, 8, 4, C.white, ' opacity=".6"');
  } };
  PLACE.engineering = { r: 60, draw: function () {
    var gear = function (cx, cy, R, col) {
      var s = ''; for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4; s += rect(-5, -R - 6, 10, 10, col, 2, ' transform="translate(' + cx + ',' + cy + ') rotate(' + (a * 180 / Math.PI) + ')"'); }
      return s + circ(cx, cy, R, col) + circ(cx, cy, R * .38, C.wall2);
    };
    return shadow(0, 3, 54, 8, .18) + rect(-50, -40, 100, 10, C.wood, 2) + rect(-46, -30, 8, 30, C.wood2) + rect(38, -30, 8, 30, C.wood2) +
      gear(-14, -62, 17, C.metal2) + gear(16, -52, 11, C.metal) +
      line([[28, -40], [46, -76]], 5, C.metal2) + circ(47, -79, 6, C.metal2) + circ(47, -79, 2.5, C.wall2) +
      path('M-44,-86 a18,18 0 1 1 6,14', 'none', ' stroke="' + C.green + '" stroke-width="4" stroke-linecap="round"') + poly([[-40, -66], [-30, -74], [-28, -62]], C.green);
  } };
  PLACE.development = { r: 64, draw: function () {
    var f = shadow(6, 4, 60, 10, .18);
    [[-58, 0, 30, 16], [-30, -16, 30, 32], [-2, -32, 30, 48], [26, -48, 30, 64]].forEach(function (s, i) {
      f += rect(s[0], s[1] - s[3], s[2], s[3], i % 2 ? C.ochre : C.ochre2, 2) + rect(s[0], s[1] - s[3], s[2], 4, C.wall, 1);
    });
    f += rect(40, -118, 3, 56, C.wood2) + poly([[43, -118], [68, -110], [43, -102]], C.leaf) + person(-42, 0, .8, C.shirtB) + person(12, -32, .8, C.shirtR, false, true);
    return f;
  } };
  PLACE.contribution = { r: 48, draw: function () {
    return shadow(0, 3, 44, 8, .18) + rect(-36, -28, 72, 28, C.roof2, 3) + rect(-38, -32, 76, 8, C.roof, 2) +
      path('M-34,-32 l6,-18 h56 l6,18 z', C.roof) + rect(-8, -38, 16, 5, C.wood, 2) +
      line([[-18, -32], [-18, -56]], 4, C.metal2) + rect(-24, -64, 12, 10, C.metal2, 2) +
      line([[2, -32], [10, -54]], 4, C.wood2) + poly([[6, -52], [18, -60], [16, -50]], C.metal2) +
      circ(22, -40, 7, C.gold) + circ(22, -40, 3, C.roof2) + rect(-30, -22, 20, 8, C.gold, 1) + rect(8, -20, 24, 6, C.leaf, 1);
  } };
  PLACE.results = { r: 52, draw: function () {
    var f = shadow(0, 2, 40, 6, .16) + rect(-30, -60, 4, 60, C.wood) + rect(26, -60, 4, 60, C.wood) +
      rect(-40, -96, 80, 44, C.wood2, 3) + rect(-37, -93, 74, 38, C.paper, 2);
    [[-28, 14, C.ochre], [-16, 24, C.lime], [-4, 30, C.leaf], [8, 20, C.lime], [20, 34, C.green]].forEach(function (b) { f += rect(b[0], -62 - b[1], 9, b[1], b[2], 1); });
    return f + line([[-33, -62], [33, -62]], 1.5, C.ink2);
  } };
  PLACE.experiments = { r: 60, draw: function () {
    return shadow(0, 3, 58, 8, .18) + rect(-56, -34, 112, 8, C.wall2, 2) + rect(-52, -26, 6, 26, C.metal2) + rect(46, -26, 6, 26, C.metal2) + rect(-56, -30, 112, 3, C.wall) +
      flask(-34, -34, 1, C.liquid) + beaker(-4, -34, 1, C.blue) + flask(26, -34, .8, C.gold) + rect(36, -50, 14, 16, C.metal, 2) + rect(39, -47, 8, 5, C.liquid, 1) +
      rect(-20, -70, 56, 4, C.metal2, 1) + rect(-20, -70, 4, 36, C.metal2) + ell(10, -62, 10, 4, C.white, ' opacity=".7"');
  } };
  PLACE.parts = { r: 52, draw: function () {
    var f = shadow(0, 3, 46, 7, .18) + rect(-44, -30, 88, 8, C.wood, 2) + rect(-40, -22, 6, 22, C.wood2) + rect(34, -22, 6, 22, C.wood2) +
      rect(-40, -46, 50, 16, C.metal, 3);
    for (var i = 0; i < 6; i++) f += rect(-36 + i * 8, -56, 5, 14, i % 2 ? C.liquid : C.blue, 2);
    f += circ(26, -62, 16, C.paper) + circ(26, -62, 13, 'none', ' stroke="' + C.green2 + '" stroke-width="3" stroke-dasharray="7 4"') + circ(26, -62, 6, C.leaf) + rect(12, -46, 28, 4, C.wood2, 1);
    return f;
  } };
  PLACE.plant = { r: 110, draw: function () {
    var f = shadow(0, 6, 120, 22, .14) + poly([[-118, 0], [118, 0], [96, -62], [-96, -62]], C.soil) + poly([[-110, -4], [110, -4], [92, -58], [-92, -58]], C.soil2, ' opacity=".6"');
    for (var r = 0; r < 4; r++) {
      var y = -10 - r * 14, w = 108 - r * 7;
      f += line([[-w, y], [w, y]], 2, C.soil, ' opacity=".9"');
      for (var i = -5; i <= 5; i++) { var x = i * (w / 5.4); f += path('M' + x + ',' + y + ' c-2,-6 -8,-7 -10,-5 c4,2 6,6 10,5 c4,1 6,-3 10,-5 c-2,-2 -8,-1 -10,5 l0,-10', C.leaf) + line([[x, y], [x, y - 9]], 1.5, C.green2); }
    }
    return f + person(-96, 4, .9, C.shirtB, true) + person(100, -6, .85, C.shirtR, true, true) + pine(-130, -40, .8) + tree(136, -36, .8, 1);
  } };
  PLACE.measurement = { r: 56, draw: function () {
    return shadow(0, 3, 50, 7, .18) + rect(-48, -30, 96, 8, C.wall2, 2) + rect(-44, -22, 6, 22, C.metal2) + rect(38, -22, 6, 22, C.metal2) +
      rect(-40, -66, 44, 36, C.metal, 4) + rect(-36, -62, 36, 22, C.ink, 2) + path('M-30,-44 a12,12 0 0 1 24,0', 'none', ' stroke="' + C.signal + '" stroke-width="2.5"') + line([[-18, -44], [-10, -54]], 2, C.red) +
      circ(-26, -34, 2.5, C.red) + circ(-18, -34, 2.5, C.leaf) + circ(-10, -34, 2.5, C.gold) +
      rect(12, -50, 10, 20, C.glass, 1) + rect(12, -38, 10, 8, C.blue, 1) + rect(26, -56, 16, 26, C.wall, 2) + line([[29, -52], [29, -34]], 1, C.ink2) + line([[33, -52], [33, -34]], 1, C.ink2) + line([[37, -52], [37, -34]], 1, C.ink2) +
      line([[20, -66], [20, -58]], 3, C.gold) + ell(20, -70, 6, 4, C.gold, ' opacity=".5"');
  } };
  PLACE['safety-and-security'] = { r: 44, draw: function () {
    return shadow(0, 2, 26, 5, .16) + rect(-3, -70, 6, 70, C.wood2) + rect(-28, -92, 56, 40, C.gold, 5) + rect(-24, -88, 48, 32, C.white, 3) +
      path('M0,-84 l16,6 v10 c0,10 -8,16 -16,20 c-8,-4 -16,-10 -16,-20 v-10 z', C.green) + path('M-7,-70 l5,5 l10,-11', 'none', ' stroke="' + C.white + '" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"') +
      rect(-14, -30, 10, 22, C.red, 2) + rect(-12, -34, 6, 4, C.metal2, 1) + rect(4, -28, 10, 20, C.white, 2) + rect(6, -24, 6, 6, C.red, 1);
  } };
  PLACE.notebook = { r: 50, draw: function () {
    return shadow(0, 3, 44, 7, .18) + rect(-42, -30, 84, 8, C.wood, 2) + rect(-38, -22, 6, 22, C.wood2) + rect(32, -22, 6, 22, C.wood2) +
      path('M-32,-32 l0,-26 q16,-6 30,0 l0,26 q-14,-6 -30,0 z', C.paper) + path('M-2,-32 l0,-26 q16,-6 30,0 l0,26 q-14,-6 -30,0 z', C.paper) + rect(-3, -58, 2, 26, C.paper2) +
      line([[-26, -50], [-10, -51]], 1.5, C.ink2) + line([[-26, -45], [-8, -46]], 1.5, C.ink2) + line([[-26, -40], [-12, -41]], 1.5, C.ink2) + line([[6, -50], [22, -51]], 1.5, C.ink2) + line([[6, -45], [20, -46]], 1.5, C.ink2) +
      line([[28, -62], [40, -40]], 3, C.gold) + circ(28, -63, 2, C.ink);
  } };
  PLACE.model = { r: 54, draw: function () {
    return shadow(0, 2, 36, 6, .16) + line([[-20, 0], [-6, -70]], 4, C.wood) + line([[20, 0], [6, -70]], 4, C.wood) + line([[0, 0], [0, -74]], 4, C.wood2) +
      rect(-40, -100, 80, 56, C.wood2, 3) + rect(-37, -97, 74, 50, C.paper, 2) +
      path('M-32,-52 C-18,-52 -14,-90 0,-90 C14,-90 18,-52 32,-52', 'none', ' stroke="' + C.green2 + '" stroke-width="3"') + line([[-32, -52], [32, -52]], 1.5, C.ink2) + line([[0, -90], [0, -52]], 1, C.ink2, ' stroke-dasharray="3 3"') +
      path('M-32,-70 C-18,-70 -14,-80 0,-74 C14,-70 20,-58 32,-62', 'none', ' stroke="' + C.gold + '" stroke-width="2.5"');
  } };
  PLACE.hardware = { r: 66, draw: function () {
    return shadow(0, 4, 50, 9, .2) + rect(-34, -90, 68, 90, C.green2, 6) + rect(-30, -86, 60, 82, C.green, 4) +
      rect(-22, -78, 44, 56, C.glass, 5) + rect(-22, -50, 44, 28, C.liquid, 3) + rect(-18, -46, 10, 20, C.liquid2, 2) + circ(-6, -36, 3, C.white, ' opacity=".7"') + circ(8, -44, 2.5, C.white, ' opacity=".6"') + circ(2, -30, 2, C.white, ' opacity=".7"') +
      rect(-26, -96, 52, 8, C.metal, 2) + rect(-6, -104, 12, 8, C.metal2, 2) + line([[0, -78], [0, -34]], 3, C.metal2) + rect(-8, -36, 16, 4, C.metal2, 1) +
      rect(-10, -16, 20, 8, C.ink, 2) + circ(-5, -12, 1.8, C.signal) + circ(5, -12, 1.8, C.red) +
      line([[30, -70], [48, -70], [48, -20]], 3, C.metal2) + rect(44, -22, 8, 14, C.metal, 1) +
      rect(-30, -118, 24, 16, C.gold, 2) + circ(-18, -110, 5, 'none', ' stroke="' + C.ink + '" stroke-width="2"');
  } };
  PLACE.software = { r: 52, draw: function () {
    return shadow(0, 2, 36, 6, .16) + rect(-14, -22, 28, 6, C.metal2, 2) + rect(-3, -40, 6, 20, C.metal2) +
      rect(-44, -88, 88, 50, C.metal2, 5) + rect(-40, -84, 80, 42, C.ink, 3) +
      path('M-34,-52 l10,-8 l10,4 l12,-14 l10,6 l12,-12', 'none', ' stroke="' + C.signal + '" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"') +
      rect(-34, -78, 20, 8, C.ink2, 1) + rect(-10, -78, 14, 8, C.ink2, 1) + rect(8, -78, 24, 8, C.green2, 1) +
      line([[-34, -64], [32, -64]], 1, C.ink2) + circ(28, -54, 3, C.signal) + circ(28, -54, 6, 'none', ' stroke="' + C.signal + '" stroke-width="1" opacity=".5"');
  } };
  PLACE['protein-design'] = { r: 44, draw: function () {
    var f = shadow(0, 2, 24, 5, .16) + ell(0, -4, 20, 7, C.wood2) + rect(-3, -70, 6, 64, C.wood);
    var beads = [[-18, -96, C.red], [-6, -108, C.blue], [8, -104, C.gold], [18, -88, C.leaf], [10, -74, C.blue], [-4, -66, C.red], [-16, -80, C.gold]];
    for (var i = 0; i < beads.length - 1; i++) f += line([beads[i].slice(0, 2), beads[i + 1].slice(0, 2)], 3, C.metal2);
    beads.forEach(function (b) { f += circ(b[0], b[1], 6, b[2]); });
    return f;
  } };
  PLACE['drylab-notebook'] = { r: 50, draw: function () {
    return shadow(0, 3, 44, 7, .18) + rect(-42, -30, 84, 8, C.wood, 2) + rect(-38, -22, 6, 22, C.wood2) + rect(32, -22, 6, 22, C.wood2) +
      path('M-30,-34 l6,-30 h48 l-6,30 z', C.metal2) + path('M-25,-37 l5,-24 h40 l-5,24 z', C.ink) + path('M-18,-50 l6,-4 l6,3 l8,-7 l8,3', 'none', ' stroke="' + C.signal + '" stroke-width="2" stroke-linecap="round"') +
      rect(-34, -34, 62, 4, C.metal, 1) + circ(30, -54, 8, C.paper) + circ(30, -54, 2, C.ink2);
  } };
  PLACE['human-practices'] = { r: 72, draw: function () {
    return shadow(0, 4, 70, 12, .16) + ell(0, -2, 44, 16, C.wood2) + ell(0, -5, 40, 13, C.woodLight) +
      line([[-70, -2], [-70, -110]], 4, C.wood) + path('M-110,-106 q40,-34 80,0 z', C.red) + path('M-110,-106 q40,-10 80,0 z', C.roof2) +
      person(-30, 12, .9, C.shirtB, true) + person(30, 12, .9, C.shirtW, false, true) + person(-4, -22, .8, C.shirtG) + person(26, -20, .75, C.shirtR, false, true) +
      circ(0, -8, 5, C.gold) + ell(-14, -9, 6, 3, C.paper) + tree(84, -10, .9);
  } };
  PLACE.education = { r: 74, draw: function () {
    return shadow(4, 6, 76, 12, .2) + rect(-72, -54, 144, 54, C.wall) + rect(-72, -54, 144, 6, C.wall2) +
      poly([[-78, -54], [0, -88], [78, -54]], C.roof) + rect(-18, -108, 36, 24, C.wall) + poly([[-22, -108], [0, -120], [22, -108]], C.roof2) +
      circ(0, -96, 7, C.gold) + rect(-9, -24, 18, 24, C.wood2, 2) +
      rect(-58, -42, 14, 14, C.riverLight, 1) + rect(-36, -42, 14, 14, C.riverLight, 1) + rect(22, -42, 14, 14, C.riverLight, 1) + rect(44, -42, 14, 14, C.riverLight, 1) +
      rect(60, -130, 3, 76, C.metal2) + poly([[63, -130], [84, -124], [63, -118]], C.red) + person(-30, 8, .7, C.shirtW) + person(30, 8, .7, C.shirtB, false, true);
  } };
  PLACE.entrepreneurship = { r: 60, draw: function () {
    var f = shadow(0, 4, 56, 9, .18) + rect(-48, -40, 96, 40, C.wood, 3) + rect(-44, -36, 88, 8, C.woodLight, 1) +
      rect(-52, -96, 5, 60, C.wood2) + rect(47, -96, 5, 60, C.wood2) + path('M-58,-96 h116 l-6,-14 h-104 z', C.red);
    for (var i = 0; i < 6; i++) f += path('M' + (-58 + i * 19.3) + ',-96 h19.3 q-9.6,10 -19.3,0 z', i % 2 ? C.white : C.red);
    f += rect(-40, -58, 14, 20, C.liquid, 2) + rect(-22, -60, 14, 22, C.liquid, 2) + rect(-4, -58, 14, 20, C.liquid, 2) + rect(14, -52, 26, 14, C.ochre, 2) + circ(27, -58, 6, C.leaf) +
      rect(-56, -70, 22, 14, C.paper, 2) + '<text x="-45" y="-60" text-anchor="middle" class="nma-sign nma-sign--tiny">$</text>' + person(66, 6, .8, C.shirtB, true, true);
    return f;
  } };
  PLACE.sustainability = { r: 62, draw: function () {
    var blade = function (a) { return path('M0,0 c6,-14 6,-40 0,-58 c-6,-18 -6,-44 0,-58', C.white, ' transform="rotate(' + a + ')"'); };
    return shadow(0, 2, 20, 5, .14) + path('M-6,0 l3,-120 h6 l3,120 z', C.white) + path('M-6,0 l3,-120 h3 l1,120 z', C.paper2) +
      at(0, -122, 1, blade(0) + blade(120) + blade(240) + circ(0, 0, 5, C.metal2)) +
      tree(-42, 4, .9, 1) + tree(46, 8, .8) + rect(-80, -14, 34, 20, C.blue, 2, ' transform="skewX(-20)"') + line([[-72, -14], [-56, -14], [-72, -4], [-56, -4]], 1, C.riverLight) + path('M-96,-8 h30', 'none', ' stroke="' + C.metal2 + '" stroke-width="3"');
  } };
  PLACE['laws-and-regulations'] = { r: 70, draw: function () {
    var f = shadow(4, 6, 72, 12, .2) + rect(-66, -10, 132, 10, C.wall2) + rect(-60, -62, 120, 52, C.wall) + rect(-60, -62, 120, 5, C.wall2);
    [-48, -24, 0, 24, 48].forEach(function (x) { f += rect(x - 5, -62, 10, 52, C.paper); });
    f += poly([[-70, -62], [0, -92], [70, -62]], C.wall2) + poly([[-62, -64], [0, -88], [62, -64]], C.paper) +
      circ(0, -74, 7, C.gold) + path('M-3,-77 h6 v6 h-6 z', C.white) + rect(-9, -30, 18, 20, C.wood2, 1) + person(-82, 6, .75, C.shirtW) + person(82, 4, .75, C.pants, false, true);
    return f;
  } };
  PLACE['geospatial-analysis'] = { r: 54, draw: function () {
    return shadow(0, 2, 30, 6, .16) + line([[-16, 0], [-4, -60]], 4, C.metal2) + line([[16, 0], [4, -60]], 4, C.metal2) + line([[0, 0], [0, -62]], 4, C.metal2) +
      rect(-40, -98, 80, 44, C.paper, 3) + rect(-36, -94, 72, 36, C.lime2, 2) + path('M-36,-70 c10,-6 18,-18 30,-14 c10,4 14,10 24,4 c6,-4 10,-8 18,-8 v30 h-72 z', C.olive) +
      path('M-36,-80 c14,2 20,10 30,8 c14,-2 22,-12 42,-10', 'none', ' stroke="' + C.river + '" stroke-width="3"') +
      circ(6, -78, 5, C.red) + path('M6,-78 l0,10', 'none', ' stroke="' + C.red + '" stroke-width="2"') + circ(-18, -66, 3, C.gold) + circ(22, -64, 3, C.gold) +
      '<circle cx="-22" cy="-106" r="9" fill="none" stroke="' + C.ink2 + '" stroke-width="2"/><path d="M-22,-115 v18 M-31,-106 h18" stroke="' + C.ink2 + '" stroke-width="1.5"/>';
  } };
  PLACE['data-physicalization'] = { r: 54, draw: function () {
    var f = shadow(0, 3, 44, 8, .18) + rect(-44, -14, 88, 14, C.wall2, 2) + rect(-40, -18, 80, 6, C.wall, 1);
    [[-34, 22, C.ochre], [-18, 40, C.lime], [-2, 56, C.leaf], [14, 34, C.gold], [26, 48, C.green]].forEach(function (b) {
      f += poly([[b[0], -18], [b[0] + 12, -18], [b[0] + 12, -18 - b[1]], [b[0], -18 - b[1]]], b[2]) + poly([[b[0], -18 - b[1]], [b[0] + 12, -18 - b[1]], [b[0] + 18, -24 - b[1]], [b[0] + 6, -24 - b[1]]], C.white, ' opacity=".55"') + poly([[b[0] + 12, -18], [b[0] + 18, -24], [b[0] + 18, -24 - b[1]], [b[0] + 12, -18 - b[1]]], C.ink, ' opacity=".18"');
    });
    return f + person(-62, 4, .8, C.shirtR, false) + person(60, 2, .75, C.shirtW, false, true);
  } };

  /* ---- the valley: where every place stands, in a 2400 x 1200 picture ---- */
  var W = 2400, H = 1200;
  var POS = {
    // the village
    milestones: [100, 640, 1.4], attributions: [300, 630, 1.4], team: [200, 950, 1.5],
    // the lab
    notebook: [520, 590, 1.4], parts: [730, 590, 1.4], experiments: [510, 860, 1.5], measurement: [750, 820, 1.4], 'safety-and-security': [870, 1020, 1.4],
    // the studio
    model: [980, 580, 1.4], 'protein-design': [1160, 580, 1.4], software: [1010, 800, 1.4], 'drylab-notebook': [1190, 830, 1.4],
    // the yard: where the machine is built
    description: [960, 1090, 1.5], contribution: [1160, 1050, 1.4], engineering: [1320, 700, 1.4], biomanufacturing: [1500, 600, 1.4], hardware: [1350, 950, 1.5], development: [1550, 930, 1.4], results: [1650, 700, 1.4],
    // the field
    plant: [1830, 1090, 1.5], 'geospatial-analysis': [1900, 760, 1.4],
    // the town
    sustainability: [2300, 560, 1.3], education: [2260, 760, 1.3], entrepreneurship: [2070, 900, 1.3], 'data-physicalization': [1990, 1080, 1.3], 'human-practices': [2150, 1090, 1.3], 'laws-and-regulations': [2300, 970, 1.3]
  };
  var ZONES = [
    ['team', 'The village', 60, 390], ['wetlab', 'The lab', 400, 880], ['drylab', 'The studio', 880, 1230],
    ['project', 'The yard', 1230, 1690], ['wetlab', 'The field', 1690, 1970], ['engagement', 'The town', 1970, 2360]
  ];

  function defs(id) {
    return '<defs>' +
      '<linearGradient id="' + id + '-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + C.skyTop + '"/><stop offset=".7" stop-color="' + C.skyLow + '"/><stop offset="1" stop-color="' + C.sunHaze + '"/></linearGradient>' +
      '<filter id="' + id + '-brush" x="-2%" y="-2%" width="104%" height="104%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="2" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="4" xChannelSelector="R" yChannelSelector="G"/></filter>' +
      '<filter id="' + id + '-grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="1" seed="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".07"/></feComponentTransfer></filter>' +
      '<filter id="' + id + '-glow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="14" result="b"/><feFlood flood-color="' + C.signal + '" flood-opacity=".9"/><feComposite in2="b" operator="in" result="c"/><feMerge><feMergeNode in="c"/><feMergeNode in="c"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<filter id="' + id + '-route" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '</defs>';
  }

  function mountains(w, horizon, amp) {
    amp = amp || 1;
    var s = '';
    // three ridges, far to near, the near one lit on its left faces
    var far = [[0, horizon - 10]]; for (var x = 0; x <= w; x += 160) far.push([x, horizon - amp * (90 + 70 * Math.abs(Math.sin(x / 230 + 1)) + 30 * Math.sin(x / 90))]); far.push([w, horizon]);
    s += poly(jitter(far, 6), C.mtFar);
    var mid = [[0, horizon]]; for (x = 0; x <= w; x += 120) mid.push([x, horizon - amp * (40 + 120 * Math.abs(Math.sin(x / 310 + 2.4)) + 40 * Math.abs(Math.sin(x / 130)))]); mid.push([w, horizon]);
    s += poly(jitter(mid, 8), C.mtMid);
    var near = [[0, horizon + 40]]; for (x = 0; x <= w; x += 100) near.push([x, horizon - amp * (10 + 90 * Math.abs(Math.sin(x / 420 + 0.6)) + 50 * Math.abs(Math.sin(x / 170 + 1)))]); near.push([w, horizon + 40]);
    s += poly(jitter(near, 8), C.mtNear);
    // lit faces and green slopes
    for (var i = 1; i < near.length - 2; i += 3) {
      var a = near[i], b = near[i + 1];
      if (b[1] < a[1]) s += poly([[a[0], a[1] + 30], [b[0], b[1]], [b[0] + 30, b[1] + 60]], C.mtLit, ' opacity=".8"');
    }
    s += path('M0,' + (horizon + 20) + ' C300,' + (horizon - 40) + ' 700,' + (horizon + 10) + ' 1000,' + (horizon + 30) + ' S1800,' + (horizon - 20) + ' 2400,' + (horizon + 30) + ' V' + (horizon + 60) + ' H0 Z', C.ridge);
    s += path('M0,' + (horizon + 40) + ' C400,' + (horizon + 10) + ' 900,' + (horizon + 60) + ' 1300,' + (horizon + 40) + ' S2000,' + (horizon + 20) + ' 2400,' + (horizon + 56) + ' V' + (horizon + 80) + ' H0 Z', C.ridgeDark);
    return s;
  }

  function farFields(y0, y1, w) {
    // the patchwork behind the places: skewed strips in her field colours
    var cols = [C.lime, C.olive, C.yellow, C.ochre, C.soil, C.lime2, C.paddy, C.olive2, C.ochre2, C.lime];
    var s = '', i = 0;
    for (var y = y0; y < y1; y += 46) {
      var skew = (y - y0) * .18;
      for (var x = -60; x < w + 60; x += 150 + (i % 3) * 40) {
        var ww = 120 + (i * 37) % 90;
        s += poly(jitter([[x + skew, y], [x + ww + skew, y], [x + ww + skew + 14, y + 42], [x + skew + 14, y + 42]], 3), cols[i % cols.length], ' opacity=".92"');
        i++;
      }
    }
    return s;
  }

  function tiny(x, y) { return [tree, tree, pine][(x * 7 + y) % 3](x, y, .5 + ((x + y) % 4) * .08, (x >> 3) % 3); }

  function valley(id) {
    var horizon = 230;
    var s = rect(0, 0, W, H, 'url(#' + id + '-sky)') + circ(1900, 110, 60, C.sunHaze, ' opacity=".8"') + circ(1900, 110, 40, C.white, ' opacity=".9"');
    s += '<g filter="url(#' + id + '-brush)">' + mountains(W, horizon, .8);
    s += rect(0, horizon + 60, W, H - horizon - 60, C.plain);
    s += farFields(horizon + 48, 400, W);
    // the plain nearer the reader, in two tones
    s += path('M0,400 C400,380 900,420 1300,400 S2000,380 2400,410 V1200 H0 Z', C.plain);
    s += path('M0,720 C500,700 1000,740 1500,720 S2100,710 2400,730 V1200 H0 Z', C.plain2, ' opacity=".7"');
    // the river: comes down from the hills, crosses the field and leaves at the right
    s += path('M1700,290 C1760,420 1690,520 1740,660 S1780,900 1720,1000 S1660,1150 1700,1200 h60 C1710,1120 1760,1020 1770,960 S1800,760 1760,660 S1740,420 1740,290 Z', C.riverLight);
    s += path('M1712,290 C1768,420 1700,520 1750,660 S1788,900 1730,1000 S1672,1150 1710,1200 h36 C1718,1120 1760,1020 1766,960 S1792,760 1752,660 S1736,420 1732,290 Z', C.river);
    s += path('M1722,300 C1772,420 1712,520 1758,660 S1792,900 1740,1000 S1686,1140 1718,1195', 'none', ' stroke="' + C.riverDeep + '" stroke-width="5" opacity=".5"');
    // the footbridge
    s += rect(1700, 912, 110, 14, C.wood, 2) + line([[1700, 904], [1810, 904]], 3, C.wood2) + line([[1700, 932], [1810, 932]], 3, C.wood2);
    // the road, from the village through the lab and the yard, past the field, into the town
    var road = 'M-20,1010 C200,990 300,960 420,920 S700,900 900,960 S1200,1000 1400,930 S1650,900 1755,918 S2000,960 2160,940 S2350,920 2420,950';
    s += path(road, 'none', ' stroke="' + C.roadEdge + '" stroke-width="44" stroke-linecap="round" opacity=".9"') + path(road, 'none', ' stroke="' + C.road + '" stroke-width="36" stroke-linecap="round"');
    // a lane up to the studio and one down to the town square
    s += path('M960,950 C980,860 1000,800 1060,740', 'none', ' stroke="' + C.road + '" stroke-width="18" stroke-linecap="round"');
    s += path('M2060,930 C2100,1000 2150,1060 2240,1100', 'none', ' stroke="' + C.road + '" stroke-width="18" stroke-linecap="round"');
    // the field's plots, in rows, with the plant place standing on the biggest
    s += poly(jitter([[1800, 980], [1960, 980], [1940, 1060], [1780, 1060]], 4), C.lime2, ' opacity=".9"') + poly(jitter([[1960, 1000], [2040, 1000], [2030, 1060], [1950, 1060]], 4), C.yellow, ' opacity=".85"') + poly(jitter([[1780, 1140], [1960, 1140], [1950, 1200], [1770, 1200]], 4), C.ochre, ' opacity=".85"');
    // trees along the ridge foot and here and there
    for (var x = 30; x < W; x += 74) s += tiny(x, 440 + ((x * 13) % 30));
    [[420, 1140], [1560, 1160], [2380, 1120], [60, 1140], [1240, 1160], [1700, 560], [2420, 850]].forEach(function (p) { s += tree(p[0], p[1], .9 + (p[0] % 3) * .1, (p[0] >> 4) % 3); });
    s += '</g>';
    return s;
  }

  function placeGroup(slug, x, y, k, cls, extra) {
    var p = PLACE[slug]; if (!p) return '';
    seed = 7 + slug.length;
    return '<g class="nma-place ' + (cls || '') + '" data-page="' + slug + '" transform="translate(' + x + ',' + y + ') scale(' + k + ')"' + (extra || '') + '>' +
      '<circle class="nma-hit" cx="0" cy="-' + (p.r * .55) + '" r="' + (p.r + 10) + '"/>' +
      '<g class="nma-art">' + p.draw() + '</g></g>';
  }

  function linksOf(slug) { return (D.links[slug] || []).filter(function (l) { return PAGE[l.to]; }); }
  function neighbours(slug) {
    var set = {};
    linksOf(slug).forEach(function (l) { set[l.to] = true; });
    ORDER.forEach(function (o) { linksOf(o).forEach(function (l) { if (l.to === slug) set[o] = true; }); });
    return set;
  }
  function common(root) {
    var here = root.getAttribute('data-here');
    if (here === null || !PAGE[here]) {
      var at = location.href.split(/[?#]/)[0];
      here = (ROOT && at.indexOf(ROOT) === 0) ? at.slice(ROOT.length).split('/')[0] : '';
      if (!PAGE[here]) here = '';
    }
    var linkRoot = root.getAttribute('data-root') || ROOT;
    var local = root.hasAttribute('data-local');
    return { here: here, href: function (s) { return linkRoot + s + '/'; }, local: local };
  }
  function h(tag, cls, text) { var n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; }
  function head(root, eyebrow, title, sub) {
    var hd = h('header', 'nm-head'), ht = h('div');
    ht.appendChild(h('p', 'nm-eyebrow', eyebrow));
    var t = h('h2', 'nm-title', title); t.setAttribute('data-no-toc', ''); ht.appendChild(t);
    hd.appendChild(ht); hd.appendChild(h('p', 'nm-sub', sub));
    root.appendChild(hd);
  }
  function tagFor(slug, here) {
    var p = PAGE[slug], s = SEC[p.section];
    return '<g class="nma-tag" data-for="' + slug + '" style="--s-ink:' + s.ink + '"><rect class="nma-tag__bg" rx="9"/><text class="nma-tag__t">' + esc(p.name) + (slug === here ? ' · you are here' : '') + '</text></g>';
  }
  function placeTag(svg, slug, x, y) {
    var t = svg.querySelector('.nma-tag[data-for="' + slug + '"]'); if (!t) return;
    var txt = t.querySelector('text'), bg = t.querySelector('rect');
    txt.setAttribute('x', x); txt.setAttribute('y', y);
    var bb = txt.getBBox();
    bg.setAttribute('x', bb.x - 10); bg.setAttribute('y', bb.y - 5); bg.setAttribute('width', bb.width + 20); bg.setAttribute('height', bb.height + 10);
  }

  /* ---------------------------------------------------------------- the whole valley */
  function mountAll(root) {
    var c = common(root), here = c.here, id = 'nma' + Math.floor(Math.random() * 1e6);
    root.classList.add('navmap', 'nma', 'nma-all');
    root.innerHTML = '';
    if (PAGE[here]) { var sh = SEC[PAGE[here].section]; root.style.setProperty('--s-ink', sh.ink); }
    head(root, 'Every page', 'The whole valley', 'Read it left to right: the village, the lab, the studio, the yard, the field, the town.');
    var stage = h('div', 'nma-stage');
    root.appendChild(stage);
    var scroller = h('div', 'nma-scroll'); stage.appendChild(scroller);
    var inner = h('div', 'nma-inner'); scroller.appendChild(inner);

    var s = '<svg class="nma-svg" viewBox="0 0 ' + W + ' ' + H + '" role="group" aria-label="Every page of ReLEAF as a place in one valley">' + defs(id);
    s += '<g class="nma-ground">' + valley(id) + '</g>';
    s += '<rect class="nma-dusk" x="0" y="0" width="' + W + '" height="' + H + '"/>';
    // the zone names, painted on the ground
    s += '<g class="nma-zones">';
    ZONES.forEach(function (z) {
      var sec = SEC[z[0]];
      s += '<text class="nma-zone" x="' + ((z[2] + z[3]) / 2) + '" y="1172" text-anchor="middle" fill="' + sec.ink + '">' + esc(z[1]) + '</text>' +
        '<line x1="' + (z[2] + 10) + '" y1="1184" x2="' + (z[3] - 10) + '" y2="1184" stroke="' + sec.line + '" stroke-width="3" stroke-linecap="round" opacity=".7"/>';
    });
    s += '</g><g class="nma-routes" filter="url(#' + id + '-route)"></g>';
    // the places, drawn back to front
    var order = ORDER.slice().sort(function (a, b) { return POS[a][1] - POS[b][1]; });
    s += '<g class="nma-places" filter="url(#' + id + '-brush)">';
    order.forEach(function (slug) {
      var p = POS[slug];
      s += '<a href="' + c.href(slug) + '" aria-label="' + esc(PAGE[slug].name) + '"' + (slug === here ? ' aria-current="page"' : '') + '>' + placeGroup(slug, p[0], p[1], p[2], slug === here ? 'nma-is-here' : '') + '</a>';
    });
    s += '</g>';
    s += '<rect class="nma-paper" x="0" y="0" width="' + W + '" height="' + H + '" filter="url(#' + id + '-grain)"/>';
    s += '<g class="nma-tags">'; ORDER.forEach(function (slug) { s += tagFor(slug, here); }); s += '</g>';
    s += '</svg>';
    inner.innerHTML = s;
    var svg = inner.querySelector('svg');
    var places = {}; inner.querySelectorAll('.nma-place').forEach(function (g) { places[g.getAttribute('data-page')] = g; });
    var routes = svg.querySelector('.nma-routes');
    ORDER.forEach(function (slug) { var p = POS[slug]; placeTag(svg, slug, p[0], p[1] - PLACE[slug].r * 1.25 * p[2] - 26); });

    // the caption under the picture: the lit page and its links, with reasons
    var cap = h('div', 'nma-cap'); root.appendChild(cap);
    function fillCap(slug) {
      cap.innerHTML = '';
      if (!PAGE[slug]) return;
      var p = PAGE[slug], sec = SEC[p.section];
      cap.style.setProperty('--s-ink', sec.ink); cap.style.setProperty('--s-pill', sec.pill);
      var hd = h('div', 'nma-cap__head');
      hd.appendChild(h('span', 'nma-cap__eyebrow', (slug === here ? 'You are here · ' : '') + sec.name));
      var nm = h('a', 'nma-cap__name', p.name); nm.href = c.href(slug); hd.appendChild(nm);
      hd.appendChild(h('span', 'nma-cap__line', p.caption));
      cap.appendChild(hd);
      var ul = h('ul', 'nma-cap__links');
      linksOf(slug).forEach(function (l) {
        var li = h('li'); var a = h('a'); a.href = c.href(l.to);
        var ls = SEC[PAGE[l.to].section]; a.style.setProperty('--s-ink', ls.ink);
        a.appendChild(h('b', null, PAGE[l.to].name));
        a.appendChild(h('span', null, (l.lane === 'in' ? 'builds on · ' : 'leads to · ') + l.why));
        if (l.next) a.appendChild(h('i', 'nm-next', 'Read next'));
        a.addEventListener('mouseenter', function () { places[l.to].classList.add('nma-active'); });
        a.addEventListener('mouseleave', function () { places[l.to].classList.remove('nma-active'); });
        li.appendChild(a); ul.appendChild(li);
      });
      cap.appendChild(ul);
    }

    function clear() {
      root.removeAttribute('data-lit');
      Object.keys(places).forEach(function (k) { places[k].classList.remove('nma-lit', 'nma-active'); });
      svg.querySelectorAll('.nma-tag.nma-show').forEach(function (t) { t.classList.remove('nma-show'); });
      routes.innerHTML = '';
    }
    function light(slug) {
      clear();
      root.setAttribute('data-lit', slug);
      var nb = neighbours(slug), from = POS[slug];
      places[slug].classList.add('nma-lit', 'nma-active');
      svg.querySelector('.nma-tag[data-for="' + slug + '"]').classList.add('nma-show');
      var r = '';
      Object.keys(nb).forEach(function (k) {
        places[k].classList.add('nma-lit');
        svg.querySelector('.nma-tag[data-for="' + k + '"]').classList.add('nma-show');
        var to = POS[k], mx = (from[0] + to[0]) / 2, my = Math.min(from[1], to[1]) - 40 - Math.abs(from[0] - to[0]) * .08;
        r += '<path d="M' + from[0] + ',' + (from[1] - 6) + ' Q' + mx + ',' + my + ' ' + to[0] + ',' + (to[1] - 6) + '"/>';
      });
      routes.innerHTML = r;
      fillCap(slug);
    }
    function settle() { clear(); fillCap(here); }

    var touch = window.matchMedia('(hover: none)').matches, viaTouch = false, armed = null, hideT = 0;
    svg.addEventListener('pointerdown', function (e) { viaTouch = e.pointerType !== 'mouse'; }, true);
    Object.keys(places).forEach(function (slug) {
      var a = places[slug].parentNode;
      a.addEventListener('mouseenter', function () { if (!touch && !viaTouch) { clearTimeout(hideT); light(slug); } });
      a.addEventListener('mouseleave', function () { if (!touch && !viaTouch) { clearTimeout(hideT); hideT = setTimeout(settle, 140); } });
      a.addEventListener('focus', function () { light(slug); });
      a.addEventListener('blur', function () { hideT = setTimeout(settle, 140); });
      a.addEventListener('click', function (e) {
        if ((touch || viaTouch) && armed !== slug) { e.preventDefault(); armed = slug; light(slug); return; }
        if (c.local) { e.preventDefault(); root.dispatchEvent(new CustomEvent('navmap:go', { detail: slug, bubbles: true })); }
      });
    });
    document.addEventListener('click', function (e) { if (armed && !root.contains(e.target)) { armed = null; settle(); } });
    settle();
    // on a phone the valley keeps a readable size and scrolls sideways, starting where the reader is
    if (scroller.scrollWidth > scroller.clientWidth + 4 && POS[here]) scroller.scrollLeft = POS[here][0] / W * scroller.scrollWidth - scroller.clientWidth / 2;
  }

  /* ---------------------------------------------------------------- the page you are on */
  function mountPage(root) {
    var c = common(root), here = c.here, id = 'nmp' + Math.floor(Math.random() * 1e6);
    if (!PAGE[here]) return;
    root.classList.add('navmap', 'nma', 'nma-page');
    root.innerHTML = '';
    var sh = SEC[PAGE[here].section]; root.style.setProperty('--s-ink', sh.ink);
    head(root, 'Where this page sits', 'Explore our project', 'Down the road to the left, what this page builds on. To the right, where it leads.');
    var stage = h('div', 'nma-stage'); root.appendChild(stage);
    var scroller = h('div', 'nma-scroll'); stage.appendChild(scroller);
    var inner = h('div', 'nma-inner nma-inner--page'); scroller.appendChild(inner);

    var links = linksOf(here);
    var ins = links.filter(function (l) { return l.lane === 'in'; }), outs = links.filter(function (l) { return l.lane !== 'in'; });
    var PW = 2400, PH = 700, GY = 430;
    var s = '<svg class="nma-svg" viewBox="0 0 ' + PW + ' ' + PH + '" role="group" aria-label="' + esc(PAGE[here].name) + ' and the pages it links to">' + defs(id);
    s += '<g class="nma-ground"><rect x="0" y="0" width="' + PW + '" height="' + PH + '" fill="url(#' + id + '-sky)"/>';
    s += '<g filter="url(#' + id + '-brush)">' + mountains(PW, 150, .65) + rect(0, 210, PW, PH - 210, C.plain) + farFields(200, 290, PW);
    s += path('M0,290 C400,270 900,310 1300,290 S2000,270 2400,300 V700 H0 Z', C.plain) + path('M0,520 C500,500 1000,540 1500,520 S2100,510 2400,530 V700 H0 Z', C.plain2, ' opacity=".7"');
    // the road: a gentle curve, the places stand along it
    var road = 'M-20,' + (GY + 40) + ' C400,' + (GY + 60) + ' 800,' + (GY - 10) + ' 1200,' + (GY + 10) + ' S2000,' + (GY + 60) + ' 2420,' + (GY + 30);
    s += path(road, 'none', ' stroke="' + C.roadEdge + '" stroke-width="44" stroke-linecap="round" opacity=".9"') + path(road, 'none', ' stroke="' + C.road + '" stroke-width="36" stroke-linecap="round"');
    for (var x = 40; x < PW; x += 90) s += tiny(x, 320 + ((x * 11) % 24));
    [[60, 680], [2340, 690], [1200, 340]].forEach(function (p) { s += tree(p[0], p[1], 1 + (p[0] % 3) * .1, (p[0] >> 4) % 3); });
    s += '</g></g>';
    s += '<rect class="nma-dusk" x="0" y="0" width="' + PW + '" height="' + PH + '"/>';
    s += '<g class="nma-routes" filter="url(#' + id + '-route)"></g>';
    // positions: the page in the middle, lanes spread either side, nearer ones lower (nearer the reader)
    var POSP = {}; POSP[here] = [1200, GY + 90, 2.0 * Math.min(1, Math.sqrt(70 / PLACE[here].r))];
    function lane(list, dir) {
      var n = list.length; if (!n) return;
      list.forEach(function (l, i) {
        var t = (i + 1) / (n + 1);
        var x = 1200 + dir * (340 + t * 790), y = GY - 20 + (i % 2) * 80;
        POSP[l.to] = [x, y, 1.4 * Math.min(1, Math.sqrt(70 / PLACE[l.to].r))];
      });
    }
    lane(ins, -1); lane(outs, 1);
    var order = Object.keys(POSP).sort(function (a, b) { return POSP[a][1] - POSP[b][1]; });
    s += '<g class="nma-places" filter="url(#' + id + '-brush)">';
    order.forEach(function (slug) {
      var p = POSP[slug];
      if (slug === here) s += '<g aria-current="page">' + placeGroup(slug, p[0], p[1], p[2], 'nma-is-here nma-lit') + '</g>';
      else s += '<a href="' + c.href(slug) + '" aria-label="' + esc(PAGE[slug].name) + '">' + placeGroup(slug, p[0], p[1], p[2], 'nma-lit') + '</a>';
    });
    s += '</g>';
    // signposts: the reason for each link, planted by the road under its place
    s += '<g class="nma-signs" filter="url(#' + id + '-brush)">';
    links.forEach(function (l) {
      var p = POSP[l.to], words = l.why.split(' '), lines = [], cur = '';
      words.forEach(function (w) { if ((cur + ' ' + w).trim().length > 20) { lines.push(cur.trim()); cur = w; } else cur += ' ' + w; }); lines.push(cur.trim());
      lines[0] = lines[0].charAt(0).toUpperCase() + lines[0].slice(1);
      s += signpost(p[0], p[1] + 118, 1.4, Math.max(110, Math.max.apply(null, lines.map(function (t) { return t.length; })) * 7.4 + 22), lines, l.next ? '#fff6d6' : C.paper);
    });
    s += '</g>';
    s += '<rect class="nma-paper" x="0" y="0" width="' + PW + '" height="' + PH + '" filter="url(#' + id + '-grain)"/>';
    s += '<g class="nma-tags">'; Object.keys(POSP).forEach(function (slug) { s += tagFor(slug, here); }); s += '</g>';
    s += '<g class="nma-lanes"><text class="nma-lane" x="560" y="196" text-anchor="middle">Builds on</text><text class="nma-lane" x="1840" y="196" text-anchor="middle">Leads to</text>' +
      '<path d="M720,188 h80" class="nma-lane__arrow"/><path d="M720,188 l10,-7 m-10,7 l10,7" class="nma-lane__arrow"/>' +
      '<path d="M1600,188 h80" class="nma-lane__arrow"/><path d="M1680,188 l-10,-7 m10,7 l-10,7" class="nma-lane__arrow"/></g>';
    s += '</svg>';
    inner.innerHTML = s;
    var svg = inner.querySelector('svg');
    var places = {}; inner.querySelectorAll('.nma-place').forEach(function (g) { places[g.getAttribute('data-page')] = g; });
    Object.keys(POSP).forEach(function (slug) { var p = POSP[slug]; placeTag(svg, slug, p[0], p[1] - PLACE[slug].r * 1.3 * p[2] - 24); svg.querySelector('.nma-tag[data-for="' + slug + '"]').classList.add('nma-show'); });
    var routes = svg.querySelector('.nma-routes'), from = POSP[here];
    function drawRoutes(only) {
      var r = '';
      links.forEach(function (l) {
        var to = POSP[l.to];
        if (only && only !== l.to) return;
        var mx = (from[0] + to[0]) / 2, my = Math.min(from[1], to[1]) - 70;
        r += '<path d="M' + from[0] + ',' + (from[1] - 6) + ' Q' + mx + ',' + my + ' ' + to[0] + ',' + (to[1] - 6) + '"' + (l.next ? ' class="nma-next"' : '') + '/>';
      });
      routes.innerHTML = r;
    }
    drawRoutes();
    Object.keys(places).forEach(function (slug) {
      if (slug === here) return;
      var a = places[slug].parentNode;
      a.addEventListener('mouseenter', function () { root.setAttribute('data-lit', slug); places[slug].classList.add('nma-active'); drawRoutes(slug); });
      a.addEventListener('mouseleave', function () { root.removeAttribute('data-lit'); places[slug].classList.remove('nma-active'); drawRoutes(); });
      a.addEventListener('click', function (e) { if (c.local) { e.preventDefault(); root.dispatchEvent(new CustomEvent('navmap:go', { detail: slug, bubbles: true })); } });
    });
    if (scroller.scrollWidth > scroller.clientWidth + 4) scroller.scrollLeft = (scroller.scrollWidth - scroller.clientWidth) / 2;
  }

  function mount(root) { if (root.getAttribute('data-art') === 'all') mountAll(root); else mountPage(root); }
  window.NavMapArt = { mount: mount, places: PLACE, positions: POS };
  function init() {
    var all = document.querySelectorAll('section.navmap[data-art]');
    for (var i = 0; i < all.length; i++) if (!all[i].hasAttribute('data-manual')) mount(all[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
