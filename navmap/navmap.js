/* ReLEAF navigation picture: one painting at the foot of every subpage, each
   thing in it a link to a page.

   Markup (the same on every page, after the page's last section):
     <link rel="stylesheet" href="/assets/navmap/navmap.css">
     <section class="navmap" data-variant="b"></section>
     <script src="/assets/navmap/layout.js"></script>        (variant b)
     <script src="/assets/navmap/layout-world.js"></script>  (variant w)
     <script src="/assets/navmap/navmap.js"></script>

   data-variant  b  the field, the farmer, the student and the reactor: 7 pages
                 w  the whole wiki: every page of the five menus
   data-root     the wiki root as a URL path, default "/"
   data-here     force the "you are here" page (otherwise read from the URL)
   data-keep-pagenav   keep the page's Previous / Next (removed by default:
                 the picture takes its place)

   Pictures are read from img/<variant>/ next to this file. Nothing is fetched
   from anywhere else. */
(function () {
  'use strict';

  var GROUPS = [
    { id: 'project', name: 'Project' },
    { id: 'wetlab', name: 'Wet Lab' },
    { id: 'drylab', name: 'Dry Lab' },
    { id: 'engagement', name: 'Engagement' },
    { id: 'team', name: 'Team' }
  ];
  // [id (= its folder), group, menu name, one line]
  var LIST = [
    ['description', 'project', 'Description', 'Why ReLEAF exists and how it works: a leaf sensor and the weather forecast feed a stress index scored against 25 years of county harvests.'],
    ['biomanufacturing', 'project', 'Biomanufacturing', 'Growing a secreted protein protectant in a 1 L perfusion reactor beside the plants, and what breaks when that unit is copied.'],
    ['engineering', 'project', 'Engineering', 'Twenty-three design, build, test and learn cycles across five subsystems, from the light circuit to the hydroponics box.'],
    ['development', 'project', 'Development', 'What a working ReLEAF has to do, stage by stage, each with a test that would settle it, and how far the project gets.'],
    ['contribution', 'project', 'Contribution', 'Seven things we hand on: parts, a hydroponics plate, a plant protocol, a containment method, an in-line photometer, a GIS workflow and lesson materials.'],
    ['results', 'project', 'Results', 'Each link of the ReLEAF chain with our own data: nine sequenced Level-1 modules, a 102.4-hour reactor run with OD600 rising from 0.8 to 3.8, and a salt dose response in roots. Claims the data cannot carry yet are listed too.'],
    ['experiments', 'wetlab', 'Experiments', 'The protocol sheets behind the wet lab: cloning, protein production, plant assays and the bioreactor.'],
    ['parts', 'wetlab', 'Parts', 'Thirty-two parts in five modules: a green-light switch in Bacillus subtilis with a secreted plant protectant behind it.'],
    ['plant', 'wetlab', 'Plants', 'Our Arabidopsis assay for salt and heat stress. It asks whether a protectant helps the plant, and how early it has to arrive to make a difference.'],
    ['measurement', 'wetlab', 'Measurement', 'Where each claim is made checkable: the principle, the full protocol and the raw numbers behind it.'],
    ['safety-and-security', 'wetlab', 'Safety and Security', 'How the engineered Bacillus subtilis stays inside the bioreactor, how our members were trained, and what we do when something goes wrong.'],
    ['notebook', 'wetlab', 'Notebook', '565 dated entries from April to August 2026, as they were written on the day.'],
    ['model', 'drylab', 'Math Model', 'When the lamp comes on, how much the reactor has to make, and whether the machine that makes it is worth building.'],
    ['hardware', 'drylab', 'Hardware', 'A 300 mL perfusion bioreactor, an in-line photometer that reads OD600 through a 2 mm light path, an LED array that lights 24 cultures at once, and a hydroponic plate with 13 seed positions.'],
    ['software', 'drylab', 'Digital Twin', 'The AIoT system behind the bioreactor. It reads the reactor’s sensors and valves, local sensors and online forecasts, and its models learn from new data so a run can last weeks with little hand work.'],
    ['protein-design', 'drylab', 'Protein Design', 'How we chose BoPEP4, LEA14 and ACC deaminase, and what we changed in each before any DNA was ordered.'],
    ['drylab-notebook', 'drylab', 'Dry Lab Notebook', 'All fourteen dry lab pipelines and the wet lab’s tracks on one season timeline.'],
    ['human-practices', 'engagement', 'Integrated Human Practices', 'The 24 stakeholders we talked to between February and October, and what each conversation changed in the project.'],
    ['education', 'engagement', 'Education', 'Lessons on plant stress, climate and synthetic biology, with debates built into them.'],
    ['entrepreneurship', 'engagement', 'Entrepreneurship', 'Who ReLEAF is for, smallholder farmers, and how it could reach them as a business.'],
    ['sustainability', 'engagement', 'Sustainability', 'Sustainability for the environment and for society, including our talk with Ubuntu Social Enterprise in Ghana.'],
    ['laws-and-regulations', 'engagement', 'Laws and Regulations', 'How the output is classified, how the culture is contained, and which rules apply to the bioreactor.'],
    ['geospatial-analysis', 'engagement', 'Geospatial Analysis', 'Where in Taiwan heat stress is rising fastest, and which farmers farm there.'],
    ['data-physicalization', 'engagement', 'Data Physicalization', 'A paper map of Taiwan that visitors can see and touch: paper colour for crop yield, flashing lights for plant stress.'],
    ['team', 'team', 'Team Members', 'The students, instructors and advisors of GEMS Taiwan, grouped into Wet Lab, Dry Lab and Human Practices, with the tasks each person took on.'],
    ['attributions', 'team', 'Attribution', 'Who did what on ReLEAF, and who helped us.'],
    ['milestone', 'team', 'Milestone', 'The ReLEAF year in order, from the first team meeting on 13 December 2025 to the Grand Jamboree.']
  ];
  var PAGES = {};
  LIST.forEach(function (r) { PAGES[r[0]] = { id: r[0], group: r[1], name: r[2], text: r[3], path: r[0] + '/' }; });

  // variant b's sprites are named for what they are; these are their pages
  var B_KEYS = { plants: 'plant', ihp: 'human-practices', team: 'team', results: 'results',
                 hardware: 'hardware', software: 'software', safety: 'safety-and-security' };
  var VARIANTS = {
    b: { layout: function () { var L = window.NAVMAP_LAYOUT && window.NAVMAP_LAYOUT.b; if (L) { L.attach = { software: 'hardware', safety: 'hardware' }; } return L; },
         keys: B_KEYS,
         // painted back to front
         order: ['plants', 'ihp', 'hardware', 'software', 'safety', 'team', 'results'],
         names: ['plant', 'human-practices', 'hardware', 'software', 'safety-and-security', 'team', 'results'],
         rest: 'Seven pages of ReLEAF, from the field to the lab.' },
    w: { layout: function () { return window.NAVMAP_WORLD; },
         keys: null, order: null, names: null, grouped: true,
         rest: 'Every page of ReLEAF, from the labs to the farms.' }
  };

  var SVGNS = 'http://www.w3.org/2000/svg';
  var COUNT = 0;
  var me = document.currentScript && document.currentScript.src;
  var BASE = me ? me.replace(/[^/]*$/, '') : '';
  var REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function el(tag, attrs, parent) {
    var n = document.createElementNS(SVGNS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  }
  function h(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text) n.textContent = text;
    return n;
  }

  function mount(root) {
    var v = root.getAttribute('data-variant') || 'b';
    var V = VARIANTS[v];
    var L = V && V.layout();
    if (!L) return;
    var wikiRoot = root.getAttribute('data-root') || '/';
    var here = root.getAttribute('data-here');
    if (here === null) {
      var rest = location.pathname.indexOf(wikiRoot) === 0 ? location.pathname.slice(wikiRoot.length) : '';
      here = rest.split('/')[0] || '';
    }
    if (!root.hasAttribute('data-keep-pagenav')) {
      var pn = document.querySelectorAll('.pagenav');
      for (var q = 0; q < pn.length; q++) pn[q].parentNode.removeChild(pn[q]);
    }
    var img = BASE + 'img/' + v + '/';
    var spriteKeys = V.order || L.order;
    var pageOf = function (k) { return V.keys ? V.keys[k] : k; };
    var attach = L.attach || {};

    root.classList.add('navmap', 'nm-' + v);
    root.innerHTML = '';
    root.appendChild(h('h2', 'nm-title', 'Explore our project'));
    var stage = h('div', 'nm-stage');
    root.appendChild(stage);

    var svg = el('svg', { viewBox: '0 0 ' + L.w + ' ' + L.h, role: 'group', 'aria-label': 'ReLEAF pages' }, stage);
    var fid = 'nm-halo-' + (++COUNT);
    root.style.setProperty('--nm-halo', 'url(#' + fid + ')');
    var f = el('filter', { id: fid, x: '-20%', y: '-20%', width: '140%', height: '140%' }, el('defs', {}, svg));
    el('feMorphology', { in: 'SourceAlpha', operator: 'dilate', radius: v === 'w' ? '5' : '7', result: 'd' }, f);
    el('feGaussianBlur', { in: 'd', stdDeviation: '3.5', result: 'b' }, f);
    el('feFlood', { 'flood-color': '#ffffff', 'flood-opacity': '0.95' }, f);
    el('feComposite', { in2: 'b', operator: 'in', result: 'h' }, f);
    var mg = el('feMerge', {}, f);
    el('feMergeNode', { in: 'h' }, mg);
    el('feMergeNode', { in: 'SourceGraphic' }, mg);
    el('image', { href: img + 'plate.webp', x: 0, y: 0, width: L.w, height: L.h }, svg);

    var spots = {};       // page id -> [svg <a>, ...] (a page may own more than one sprite)
    var spriteOf = {};    // sprite key -> svg <a>
    spriteKeys.forEach(function (k) {
      var s = L.sprites[k], pid = pageOf(k), p = PAGES[pid];
      var a = el('a', { class: 'nm-spot', 'data-page': pid, 'aria-label': p.name }, svg);
      if (pid === here) { a.classList.add('nm-is-here'); a.setAttribute('aria-current', 'page'); }
      else a.setAttribute('href', wikiRoot + p.path);
      var g = el('g', { class: 'nm-art' }, a);
      el('image', { href: img + k + '.webp', x: s.x, y: s.y, width: s.w, height: s.h }, g);
      el('polygon', { points: s.hit, class: 'nm-hit' }, a);
      (spots[pid] = spots[pid] || []).push(a);
      spriteOf[k] = a;
    });

    var tag = h('span', 'nm-tag');
    tag.setAttribute('aria-hidden', 'true');
    stage.appendChild(tag);
    var flag = null;
    if (here && spots[here]) { flag = h('span', 'nm-here', 'You are here'); stage.appendChild(flag); }

    // the caption under the picture: the page under the pointer, or a line at rest
    var cap = h('p', 'nm-caption');
    cap.setAttribute('aria-live', 'polite');
    root.appendChild(cap);

    // the names, in the painting's order (b) or by menu (w)
    var nameLinks = [], groupHeads = [];
    function nameLink(pid) {
      var p = PAGES[pid], a = h('a', null, p.name);
      a.setAttribute('data-page', pid);
      if (pid === here) { a.className = 'nm-is-here'; a.setAttribute('aria-current', 'page'); }
      else a.href = wikiRoot + p.path;
      nameLinks.push(a);
      return a;
    }
    if (V.grouped) {
      var grid = h('div', 'nm-groups');
      GROUPS.forEach(function (gp) {
        var col = h('div', 'nm-group');
        var head = h('h3', null, gp.name);
        head.setAttribute('data-group', gp.id);
        head.tabIndex = 0;
        groupHeads.push(head);
        col.appendChild(head);
        var ul = h('ul', 'nm-names');
        LIST.forEach(function (r) { if (r[1] === gp.id) { var li = h('li'); li.appendChild(nameLink(r[0])); ul.appendChild(li); } });
        col.appendChild(ul);
        grid.appendChild(col);
      });
      root.appendChild(grid);
    } else {
      var ul = h('ul', 'nm-names');
      V.names.forEach(function (pid) { var li = h('li'); li.appendChild(nameLink(pid)); ul.appendChild(li); });
      root.appendChild(ul);
    }

    function box(nodes) {
      var s = stage.getBoundingClientRect(), l = 1e9, t = 1e9, r = -1e9, b = -1e9;
      nodes.forEach(function (a) {
        var q = a.querySelector('.nm-hit').getBoundingClientRect();
        l = Math.min(l, q.left); t = Math.min(t, q.top); r = Math.max(r, q.right); b = Math.max(b, q.bottom);
      });
      return { l: l - s.left, t: t - s.top, r: r - s.left, b: b - s.top, w: s.width };
    }
    function lit(pid) {   // every sprite that lights with this page, its attachments too
      var out = (spots[pid] || []).slice();
      for (var k in attach) if (pageOf(attach[k]) === pid && spriteOf[k]) out.push(spriteOf[k]);
      return out;
    }
    function placeFlag() {
      if (!flag) return;
      var b = box(spots[here]);
      flag.style.left = ((b.l + b.r) / 2) + 'px';
      flag.style.top = b.t + 'px';
    }

    var current = null, hideT = 0;
    var touch = window.matchMedia('(hover: none)').matches;

    function setCaption(pid) {
      cap.innerHTML = '';
      if (!pid) { cap.classList.remove('nm-on'); cap.appendChild(h('span', 'nm-rest', V.rest)); return; }
      var p = PAGES[pid];
      cap.classList.add('nm-on');
      var name = h('strong', null, p.name);
      cap.appendChild(name);
      cap.appendChild(h('span', null, (pid === here ? 'You are here. ' : '') + p.text));
    }
    function show(pid, group) {
      clearTimeout(hideT);
      current = pid || (group ? 'g:' + group : null);
      var on = [];
      if (pid) on = lit(pid);
      if (group) LIST.forEach(function (r) { if (r[1] === group) on = on.concat(lit(r[0])); });
      root.classList.toggle('nm-has-on', on.length > 0);
      var all = svg.querySelectorAll('.nm-spot');
      for (var i = 0; i < all.length; i++) all[i].classList.toggle('nm-on', on.indexOf(all[i]) >= 0);
      nameLinks.forEach(function (a) {
        var id = a.getAttribute('data-page');
        a.classList.toggle('nm-on', id === pid || (!!group && PAGES[id].group === group));
      });
      groupHeads.forEach(function (g) { g.classList.toggle('nm-on', g.getAttribute('data-group') === group); });
      setCaption(pid);
      if (!pid || !spots[pid]) { tag.classList.remove('nm-show'); return; }
      tag.textContent = PAGES[pid].name;
      var b = box(spots[pid]);
      tag.classList.add('nm-show');
      var tw = tag.offsetWidth;
      tag.style.left = Math.max(4, Math.min(b.w - tw - 4, (b.l + b.r) / 2 - tw / 2)) + 'px';
      tag.style.top = Math.max(4, b.t - tag.offsetHeight - 8) + 'px';
    }
    function hideSoon() { hideT = setTimeout(function () { show(null); }, 140); }

    function wire(node, pid, group) {
      node.addEventListener('mouseenter', function () { if (!touch) show(pid, group); });
      node.addEventListener('mouseleave', function () { if (!touch) hideSoon(); });
      node.addEventListener('focus', function () { show(pid, group); });
      node.addEventListener('blur', hideSoon);
      node.addEventListener('click', function (e) {
        // on a phone the first tap shows what it is, the second goes there
        var key = pid || 'g:' + group;
        if (touch && current !== key) { e.preventDefault(); show(pid, group); }
      });
    }
    for (var pid in spots) spots[pid].forEach(function (a) { wire(a, a.getAttribute('data-page')); });
    nameLinks.forEach(function (a) { wire(a, a.getAttribute('data-page')); });
    groupHeads.forEach(function (g) { wire(g, null, g.getAttribute('data-group')); });
    document.addEventListener('click', function (e) { if (touch && current && !root.contains(e.target)) show(null); });
    window.addEventListener('resize', function () { placeFlag(); if (current && current.indexOf('g:') !== 0) show(current); });
    setCaption(null);
    placeFlag();

    // a quiet hint, once: the first time the picture comes into view, each
    // thing in it catches the light in turn, left to right
    if (!REDUCED && 'IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        io.disconnect();
        var arr = Array.prototype.slice.call(svg.querySelectorAll('.nm-spot:not(.nm-is-here)'));
        arr.sort(function (a, b) { return a.getBBox().x - b.getBBox().x; });
        var step = Math.max(70, Math.min(260, 1800 / arr.length));
        arr.forEach(function (a, i) {
          setTimeout(function () {
            if (root.classList.contains('nm-has-on')) return;
            a.classList.add('nm-hint');
            setTimeout(function () { a.classList.remove('nm-hint'); }, 520);
          }, 500 + i * step);
        });
      }, { threshold: 0.6 });
      io.observe(stage);
    }
  }

  window.NavMap = { mount: mount, pages: PAGES, groups: GROUPS };
  function init() {
    var all = document.querySelectorAll('.navmap[data-variant]');
    for (var i = 0; i < all.length; i++) if (!all[i].hasAttribute('data-manual')) mount(all[i]);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
