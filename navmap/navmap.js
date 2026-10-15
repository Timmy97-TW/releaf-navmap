/* ReLEAF navigation picture: one painting at the foot of every subpage, seven
   things in it, each one a link to a page.

   Markup (the same on every page):
     <section class="navmap" data-variant="a"></section>
     <script src="/assets/navmap/layout.js"></script>
     <script src="/assets/navmap/navmap.js"></script>

   data-variant  a | b | c   (which painting; see README)
   data-root     the wiki root as a URL path, default "/" (the page links are
                 made from it, and the page the reader is on is found from it)
   data-here     force the "you are here" page (otherwise read from the URL)

   The pictures are read from img/<variant>/ next to this file. */
(function () {
  'use strict';

  var PAGES = {
    plants:   { name: 'Plants', path: 'plant/',
      text: 'Our Arabidopsis assay for salt and heat stress. It asks whether a protectant helps the plant, and how early it has to arrive to make a difference.' },
    ihp:      { name: 'Integrated Human Practices', path: 'human-practices/',
      text: 'The 24 stakeholders we talked to between February and October, and what each conversation changed in the project.' },
    team:     { name: 'Team Members', path: 'team/',
      text: 'The students, instructors and advisors of GEMS Taiwan, grouped into Wet Lab, Dry Lab and Human Practices, with the tasks each person took on.' },
    results:  { name: 'Results', path: 'results/',
      text: 'Each link of the ReLEAF chain with our own data: nine sequenced Level-1 modules, a 102.4-hour reactor run with OD600 rising from 0.8 to 3.8, and a salt dose response in roots. Claims the data cannot carry yet are listed too.' },
    hardware: { name: 'Hardware', path: 'hardware/',
      text: 'A 300 mL perfusion bioreactor, an in-line photometer that reads OD600 through a 2 mm light path, an LED array that lights 24 cultures at once, and a hydroponic plate with 13 seed positions.' },
    software: { name: 'Digital Twin', path: 'software/',
      text: 'The AIoT system behind the bioreactor. It reads the reactor’s sensors and valves, local sensors and online forecasts, and its models learn from new data so a run can last weeks with little hand work.' },
    safety:   { name: 'Safety and Security', path: 'safety-and-security/',
      text: 'How the engineered Bacillus subtilis stays inside the bioreactor, how our members were trained, and what we do when something goes wrong.' }
  };
  // left to right as they stand in each painting
  var ORDER = {
    a: ['plants', 'ihp', 'team', 'results', 'hardware', 'software', 'safety'],
    b: ['plants', 'ihp', 'hardware', 'software', 'safety', 'team', 'results']
  };
  ORDER.c = ORDER.b;
  // painted back to front; the reactor's screen and label ride on its body
  var STACK = ['plants', 'ihp', 'team', 'results'];
  var REACTOR = ['hardware', 'software', 'safety'];

  var SVGNS = 'http://www.w3.org/2000/svg';
  var COUNT = 0;
  var me = document.currentScript && document.currentScript.src;
  var BASE = me ? me.replace(/[^/]*$/, '') : '';

  function el(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }

  function mount(root) {
    var v = root.getAttribute('data-variant') || 'a';
    var L = window.NAVMAP_LAYOUT && window.NAVMAP_LAYOUT[v];
    if (!L) return;
    var wikiRoot = root.getAttribute('data-root') || '/';
    var here = root.getAttribute('data-here');
    if (here === null) {
      var rest = location.pathname.indexOf(wikiRoot) === 0 ? location.pathname.slice(wikiRoot.length) : '';
      here = '';
      for (var k in PAGES) if (rest.indexOf(PAGES[k].path) === 0) here = k;
    }
    var img = BASE + 'img/' + v + '/';

    root.classList.add('navmap', 'nm-' + v);
    root.innerHTML = '';
    var h = document.createElement('h2');
    h.className = 'nm-title';
    h.textContent = 'Where to next';
    root.appendChild(h);
    var stage = document.createElement('div');
    stage.className = 'nm-stage';
    root.appendChild(stage);

    var svg = el('svg', { viewBox: '0 0 ' + L.w + ' ' + L.h, role: 'group', 'aria-label': 'ReLEAF pages' }, stage);
    var defs = el('defs', {}, svg);
    var fid = 'nm-halo-' + (++COUNT);
    root.style.setProperty('--nm-halo', 'url(#' + fid + ')');
    var f = el('filter', { id: fid, x: '-20%', y: '-20%', width: '140%', height: '140%' }, defs);
    el('feMorphology', { in: 'SourceAlpha', operator: 'dilate', radius: '7', result: 'd' }, f);
    el('feGaussianBlur', { in: 'd', stdDeviation: '4', result: 'b' }, f);
    el('feFlood', { 'flood-color': '#ffffff', 'flood-opacity': '0.95' }, f);
    el('feComposite', { in2: 'b', operator: 'in', result: 'h' }, f);
    var m = el('feMerge', {}, f);
    el('feMergeNode', { in: 'h' }, m);
    el('feMergeNode', { in: 'SourceGraphic' }, m);

    el('image', { href: img + 'plate.webp', x: 0, y: 0, width: L.w, height: L.h, class: 'nm-plate' }, svg);

    var spots = {};
    function spot(key, parent) {
      var s = L.sprites[key], p = PAGES[key];
      var a = el('a', { class: 'nm-spot', 'data-key': key, 'aria-label': p.name }, parent);
      if (key === here) { a.classList.add('nm-is-here'); a.setAttribute('aria-current', 'page'); }
      else a.setAttribute('href', wikiRoot + p.path);
      var g = el('g', { class: 'nm-lift' }, a);
      el('image', { href: img + key + '.webp', x: s.x, y: s.y, width: s.w, height: s.h, class: 'nm-sprite' }, g);
      if (v === 'c') el('image', { href: img + key + '-day.webp', x: s.x, y: s.y, width: s.w, height: s.h, class: 'nm-day' }, g);
      el('polygon', { points: s.hit, class: 'nm-hit' }, a);
      spots[key] = a;
      return a;
    }
    // back to front: the field, the people (by depth), the reactor as one group
    var reactor = el('g', { class: 'nm-reactor' });
    spot('plants', svg);
    var people = ['ihp', 'team'].sort(function (x, y) {
      var a = L.sprites[x], b = L.sprites[y];
      return (a.y + a.h) - (b.y + b.h);
    });
    var rFoot = L.sprites.hardware.y + L.sprites.hardware.h;
    people.forEach(function (k) {
      if (L.sprites[k].y + L.sprites[k].h <= rFoot) { spot(k, svg); if (k === 'team') spot('results', svg); }
    });
    svg.appendChild(reactor);
    REACTOR.forEach(function (k) { spot(k, reactor); });
    people.forEach(function (k) {
      if (L.sprites[k].y + L.sprites[k].h > rFoot) { spot(k, svg); if (k === 'team') spot('results', svg); }
    });

    // the seven names as text, in the painting's order
    var row = document.createElement('ul');
    row.className = 'nm-names';
    ORDER[v].forEach(function (k) {
      var li = document.createElement('li');
      var a = document.createElement('a');
      a.textContent = PAGES[k].name;
      a.setAttribute('data-key', k);
      if (k === here) { a.className = 'nm-is-here'; a.setAttribute('aria-current', 'page'); }
      else a.href = wikiRoot + PAGES[k].path;
      li.appendChild(a);
      row.appendChild(li);
    });
    root.appendChild(row);
    var names = row.querySelectorAll('a');

    var card = document.createElement('a');
    card.className = 'nm-card';
    root.appendChild(card);

    var flag = null;
    if (here && spots[here]) {
      flag = document.createElement('span');
      flag.className = 'nm-here';
      flag.textContent = 'You are here';
      stage.appendChild(flag);
    }

    var current = null, hideT = 0;
    var touch = window.matchMedia('(hover: none)').matches;

    function box(key) {
      var r = spots[key].querySelector('.nm-hit').getBoundingClientRect(), s = stage.getBoundingClientRect();
      return { l: r.left - s.left, r: r.right - s.left, t: r.top - s.top, b: r.bottom - s.top, w: s.width, h: s.height };
    }
    function placeFlag() {
      if (!flag) return;
      var b = box(here);
      flag.style.left = ((b.l + b.r) / 2) + 'px';
      flag.style.top = b.t + 'px';
    }

    function show(key) {
      clearTimeout(hideT);
      current = key;
      root.classList.toggle('nm-has-on', !!key);
      for (var k in spots) spots[k].classList.toggle('nm-on', k === key);
      reactor.classList.toggle('nm-on', key === 'hardware');
      for (var i = 0; i < names.length; i++) names[i].classList.toggle('nm-on', names[i].getAttribute('data-key') === key);
      if (!key) { card.classList.remove('nm-show'); return; }
      var p = PAGES[key], isHere = key === here;
      card.innerHTML = (isHere ? '<span class="nm-eyebrow">You are here</span>' : '') +
        '<strong>' + p.name + (isHere ? '' : ' <span class="nm-arrow" aria-hidden="true">→</span>') + '</strong><span>' + p.text + '</span>';
      if (isHere) card.removeAttribute('href'); else card.href = wikiRoot + p.path;
      card.classList.add('nm-show');
      if (stage.clientWidth < 640) { card.classList.add('nm-docked'); card.style.left = card.style.top = ''; return; }
      card.classList.remove('nm-docked');
      var b = box(key), cw = card.offsetWidth, ch = card.offsetHeight, gap = 16, left, top;
      var cx = (b.l + b.r) / 2;
      if (b.r - b.l > b.w * 0.33) { left = cx - cw / 2; top = b.t - ch - gap; }
      else { left = cx > b.w / 2 ? b.l - cw - gap : b.r + gap; top = (b.t + b.b) / 2 - ch / 2; }
      card.style.left = Math.max(8, Math.min(b.w - cw - 8, left)) + 'px';
      card.style.top = Math.max(8, Math.min(b.h - ch - 8, top)) + 'px';
    }
    function hideSoon() { hideT = setTimeout(function () { show(null); }, 160); }

    function wire(node, key) {
      node.addEventListener('mouseenter', function () { if (!touch) show(key); });
      node.addEventListener('mouseleave', function () { if (!touch) hideSoon(); });
      node.addEventListener('focus', function () { show(key); });
      node.addEventListener('blur', hideSoon);
      node.addEventListener('click', function (e) {
        // on a phone the first tap shows what it is, the second one goes there
        if (touch && current !== key) { e.preventDefault(); show(key); }
      });
    }
    for (var k2 in spots) wire(spots[k2], k2);
    for (var j = 0; j < names.length; j++) wire(names[j], names[j].getAttribute('data-key'));
    card.addEventListener('mouseenter', function () { clearTimeout(hideT); });
    card.addEventListener('mouseleave', function () { if (!touch) hideSoon(); });
    document.addEventListener('click', function (e) { if (touch && current && !root.contains(e.target)) show(null); });
    window.addEventListener('resize', function () { placeFlag(); if (current) show(current); });
    placeFlag();
  }

  window.NavMap = { mount: mount, pages: PAGES };
  function init() {
    var all = document.querySelectorAll('.navmap[data-variant]');
    for (var i = 0; i < all.length; i++) if (!all[i].hasAttribute('data-manual')) mount(all[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
