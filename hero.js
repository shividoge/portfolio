/* ===========================================================================
   The part in the opening.

   It is built, not photographed. The package has four real walls and a real
   thickness, and every component stands off the lid on its own Z, so turning
   it produces actual parallax instead of a picture spinning in place.

   Two things keep the light honest while it turns:
     · each wall's brightness is recomputed from the angle between its outward
       normal and a light that stays put in world space;
     · every raised part casts its extrusion with an offset that is rotated
       back out of the part's local frame, so shadows fall the same way no
       matter where the package is pointing.

   The four dots are content: each feature stands for a real piece of the work,
   which is the whole reason this shape exists.
   =========================================================================== */
(function () {
  'use strict';

  var hold  = document.getElementById('chipHold');
  var stage = document.getElementById('chipStage');
  if (!hold || !stage) return;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse = matchMedia('(pointer: coarse)').matches;
  var NS = 'http://www.w3.org/2000/svg';

  /* ------------------------------------------------------------- geometry */
  var BOX   = 464;                 /* the square everything is laid out in */
  var BODY  = 300;                 /* package body */
  var THICK = 34;                  /* package height */
  var HB    = BODY / 2;
  var LEAD  = 46;                  /* how far the leads reach past the body */
  var NPIN  = 31;                  /* per side */
  var LIGHT = -115;                /* degrees; where the key light sits */

  /* features, in body pixels — the hotspots read their centres from here */
  var F = {
    lcd:  { x: 86,  y: 18,  w: 132, h: 80 },
    dpad: { cx: 56, cy: 140, arm: 36 },
    lens: { cx: 228, cy: 134, r: 44 },
    keys: { y: 244, size: 26, gap: 6, n: 7 }
  };
  F.keys.w = F.keys.n * F.keys.size + (F.keys.n - 1) * F.keys.gap;
  F.keys.x = (BODY - F.keys.w) / 2;

  var TOOL_NAME = { js: 'JavaScript', py: 'Python', cpp: 'C++', cad: 'Autodesk', ki: 'KiCad', sv: 'SystemVerilog', lx: 'Linux' };

  /* One key per tool. Each is a real button that opens where that tool was
     used (see TOOLS below), so the row is a map, not a decoration. */
  var KEYS = [
    { id: 'js',  t: 'JS',  bg: '#F7DF1E', fg: '#12120C' },
    { id: 'py',  t: 'Py',  bg: '#356C9B', fg: '#FFE873' },
    { id: 'cpp', t: 'C++', bg: '#00589C', fg: '#DCEBFA' },
    { id: 'cad', t: 'A',   bg: '#C0202B', fg: '#FFE9EA' },
    { id: 'ki',  t: 'Ki',  bg: '#2F4BB0', fg: '#E7ECFF' },
    { id: 'sv',  t: 'SV',  bg: '#D5ACFF', fg: '#14130F' },
    { id: 'lx',  t: 'Lx',  bg: '#E9E4D8', fg: '#1A1A1A' }
  ];

  /* ------------------------------------------------------------- helpers */
  function el(tag, cls, css) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (css) d.style.cssText = css;
    return d;
  }
  function box(cls, x, y, w, h, z, h3, tag) {
    /* a face parked at (x,y) in body space, lifted z above the lid */
    var d = el(tag || 'div', cls,
      'position:absolute;left:' + x + 'px;top:' + y + 'px;width:' + w + 'px;height:' + h + 'px;' +
      'transform:translateZ(' + z + 'px);');
    if (h3 != null) d.style.setProperty('--h', h3);
    return d;
  }
  function svg(w, h) {
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    s.setAttribute('width', w); s.setAttribute('height', h);
    return s;
  }
  function n(tag, a) {
    var e = document.createElementNS(NS, tag);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }

  /* ------------------------------------------------------------- the lid */
  function lid() {
    var s = svg(BODY, BODY);
    var defs = n('defs', {});

    var g = n('linearGradient', { id: 'hlLid', x1: '0%', y1: '0%', x2: '78%', y2: '100%' });
    g.appendChild(n('stop', { offset: '0%',   'stop-color': '#32323A' }));
    g.appendChild(n('stop', { offset: '42%',  'stop-color': '#1B1B21' }));
    g.appendChild(n('stop', { offset: '100%', 'stop-color': '#0B0B0F' }));
    defs.appendChild(g);

    var f = n('filter', { id: 'hlGrain' });
    f.appendChild(n('feTurbulence', { type: 'fractalNoise', baseFrequency: '.85', numOctaves: '3' }));
    f.appendChild(n('feColorMatrix', { type: 'saturate', values: '0' }));
    defs.appendChild(f);
    s.appendChild(defs);

    s.appendChild(n('rect', { x: 0, y: 0, width: BODY, height: BODY, rx: 7, fill: 'url(#hlLid)' }));
    s.appendChild(n('rect', { x: 0, y: 0, width: BODY, height: BODY, rx: 7,
                              filter: 'url(#hlGrain)', opacity: .07 }));

    /* moulded relief around the rim */
    s.appendChild(n('rect', { x: 5, y: 5, width: BODY - 10, height: BODY - 10, rx: 5,
                              fill: 'none', stroke: '#000', 'stroke-opacity': .34 }));
    s.appendChild(n('path', { d: 'M 8 6 H ' + (BODY - 8), stroke: '#55555F',
                              'stroke-opacity': .75, 'stroke-width': 1.3, fill: 'none' }));

    /* the etched routing that gives the lid its texture */
    var tr = n('g', { fill: 'none', stroke: '#3C3C47', 'stroke-width': 1.1, 'stroke-opacity': .85 });
    var die = { x: 112, y: 150, w: 76, h: 62 };
    for (var i = 0; i < 9; i++) {
      var yy = die.y + 6 + i * 6.4;
      tr.appendChild(n('path', { d: 'M ' + (die.x - 4) + ' ' + yy.toFixed(1) +
                                    ' H ' + (die.x - 22 - (i % 3) * 9) +
                                    ' L ' + (die.x - 34 - (i % 3) * 9) + ' ' + (yy - 12).toFixed(1) }));
      tr.appendChild(n('path', { d: 'M ' + (die.x + die.w + 4) + ' ' + yy.toFixed(1) +
                                    ' H ' + (die.x + die.w + 20 + (i % 4) * 8) +
                                    ' L ' + (die.x + die.w + 32 + (i % 4) * 8) + ' ' + (yy + 11).toFixed(1) }));
    }
    s.appendChild(tr);

    /* the die window */
    s.appendChild(n('rect', { x: die.x, y: die.y, width: die.w, height: die.h, rx: 2,
                              fill: '#121218', stroke: '#3E3E49' }));
    var grid = n('g', { stroke: '#2C2C36', 'stroke-width': .7 });
    for (var gx = 1; gx < 9; gx++)
      grid.appendChild(n('path', { d: 'M ' + (die.x + gx * die.w / 9) + ' ' + (die.y + 3) +
                                      ' V ' + (die.y + die.h - 3) }));
    for (var gy = 1; gy < 7; gy++)
      grid.appendChild(n('path', { d: 'M ' + (die.x + 3) + ' ' + (die.y + gy * die.h / 7) +
                                      ' H ' + (die.x + die.w - 3) }));
    s.appendChild(grid);

    /* scattered passives, the way a real lid is never empty */
    var smd = n('g', { fill: '#23232B', stroke: '#3A3A45', 'stroke-width': .6 });
    [[30,196],[38,208],[30,220],[252,206],[262,218],[252,230],[70,232],[84,232],
     [206,36],[218,36],[230,36],[40,110],[40,122]].forEach(function (p) {
      smd.appendChild(n('rect', { x: p[0], y: p[1], width: 8, height: 4.4, rx: 1 }));
    });
    s.appendChild(smd);

    /* the marking, gold, the way it is on the render */
    var t = n('text', { x: BODY / 2, y: 232, 'text-anchor': 'middle', fill: '#C8A24A',
                        'font-family': '"Space Grotesk", sans-serif', 'font-size': 10.5,
                        'font-weight': 600, 'letter-spacing': 1.6 });
    t.textContent = 'FPEA · XII-00Y · MADE BY SHIVIN';
    s.appendChild(t);

    /* pin 1 */
    s.appendChild(n('circle', { cx: 20, cy: 20, r: 5.5, fill: '#08080B' }));
    s.appendChild(n('circle', { cx: 20, cy: 20, r: 5.5, fill: 'none', stroke: '#5A5A66' }));
    s.appendChild(n('path', { d: 'M 7 28 L 28 7', stroke: '#3E3E48', 'stroke-width': 1.2 }));
    return s;
  }

  /* ------------------------------------------------------------- the leads */
  function leads() {
    var s = svg(BOX, BOX);
    var c = BOX / 2;
    var g = n('g', {});
    var pitch = BODY / (NPIN + 1);
    for (var side = 0; side < 4; side++) {
      for (var i = 0; i < NPIN; i++) {
        var off = -HB + pitch * (i + 1);
        var r;
        if (side === 0)      r = { x: c + off - 1.9, y: c - HB - LEAD, width: 3.8, height: LEAD + 10 };
        else if (side === 1) r = { x: c + HB - 10,   y: c + off - 1.9, width: LEAD + 10, height: 3.8 };
        else if (side === 2) r = { x: c + off - 1.9, y: c + HB - 10,   width: 3.8, height: LEAD + 10 };
        else                 r = { x: c - HB - LEAD, y: c + off - 1.9, width: LEAD + 10, height: 3.8 };
        r.rx = 1.4;
        r.fill = i % 2 ? '#CFC7AE' : '#DAD2B8';
        g.appendChild(n('rect', r));
      }
    }
    s.appendChild(g);
    return s;
  }

  /* ------------------------------------------------------------- the LCD
     The display shows a tiny thumbnail of the About page, because that is what
     it is: scroll, and the page grows out of this screen (portal.js). The bars
     stand in for the paragraph, with the two accented phrases in purple. */
  function screen() {
    var w = F.lcd.w - 14, hh = F.lcd.h - 14;
    var s = svg(w, hh);
    s.appendChild(n('rect', { x: 0, y: 0, width: w, height: hh, rx: 1.5, fill: '#F7F5F1' }));
    s.appendChild(n('circle', { cx: 8, cy: 9, r: 1.7, fill: '#6B3FA0' }));
    s.appendChild(n('rect', { x: 13, y: 7.6, width: 15, height: 2.8, rx: 1.4, fill: '#66635B', opacity: 0.8 }));
    var ROWS = [
      [[8, 98, '#14130F']],
      [[8, 100, '#14130F']],
      [[8, 46, '#14130F'], [50, 54, '#6B3FA0']],
      [[8, 100, '#14130F']],
      [[8, 34, '#14130F'], [38, 34, '#6B3FA0']]
    ];
    ROWS.forEach(function (row, i) {
      row.forEach(function (b) {
        s.appendChild(n('rect', { x: b[0], y: 18 + i * 8, width: b[1], height: 5, rx: 2.2, fill: b[2] }));
      });
    });
    return s;
  }

  /* ------------------------------------------------------------- assemble */
  var spots = [].slice.call(hold.querySelectorAll('.spot'));

  var rig = el('div', 'hc-rig', 'position:absolute;inset:0;transform-style:preserve-3d;');

  var lead = el('div', 'hc-leads',
    'position:absolute;left:0;top:0;width:' + BOX + 'px;height:' + BOX + 'px;' +
    'transform:translateZ(' + (-THICK / 2 + 8) + 'px);');
  lead.appendChild(leads());
  rig.appendChild(lead);

  var bodyEl = el('div', 'hc-body',
    'position:absolute;left:' + ((BOX - BODY) / 2) + 'px;top:' + ((BOX - BODY) / 2) + 'px;' +
    'width:' + BODY + 'px;height:' + BODY + 'px;transform-style:preserve-3d;');

  var top = box('hc-face', 0, 0, BODY, BODY, THICK / 2);
  top.appendChild(lid());
  bodyEl.appendChild(top);

  var bot = el('div', 'hc-face hc-bottom',
    'position:absolute;inset:0;transform:rotateX(180deg) translateZ(' + (THICK / 2) + 'px);');
  bodyEl.appendChild(bot);

  var walls = [];
  [[0, 'rotateX(90deg)', BODY, THICK], [90, 'rotateY(90deg)', THICK, BODY],
   [180, 'rotateX(-90deg)', BODY, THICK], [270, 'rotateY(-90deg)', THICK, BODY]
  ].forEach(function (w) {
    var d = el('div', 'hc-wall',
      'position:absolute;left:50%;top:50%;width:' + w[2] + 'px;height:' + w[3] + 'px;' +
      'margin-left:' + (-w[2] / 2) + 'px;margin-top:' + (-w[3] / 2) + 'px;' +
      'transform:' + w[1] + ' translateZ(' + HB + 'px);');
    /* outward normal in screen degrees, 0 = right, 90 = down */
    d.dataset.nrm = [270, 0, 90, 180][[0, 90, 180, 270].indexOf(w[0])];
    bodyEl.appendChild(d);
    walls.push(d);
  });

  var LIFT = THICK / 2;

  /* LCD: bezel, then the glass inset on top of it */
  var lcd = box('hc-part hc-lcd', F.lcd.x, F.lcd.y, F.lcd.w, F.lcd.h, LIFT + 7, 7);
  bodyEl.appendChild(lcd);
  var glass = box('hc-glass', F.lcd.x + 7, F.lcd.y + 7, F.lcd.w - 14, F.lcd.h - 14, LIFT + 9);
  glass.appendChild(screen());
  bodyEl.appendChild(glass);

  /* D-pad: four keys, like the render */
  var a = F.dpad.arm, k = a * 0.80;
  [[0, -a, '▲'], [a, 0, '▶'], [0, a, '▼'], [-a, 0, '◀']].forEach(function (d) {
    var key = box('hc-part hc-dkey', F.dpad.cx + d[0] - k / 2, F.dpad.cy + d[1] - k / 2, k, k, LIFT + 10, 10);
    key.textContent = d[2];
    bodyEl.appendChild(key);
  });

  /* Lens: a stack, so it parallaxes like a real barrel */
  var L = F.lens;
  bodyEl.appendChild(box('hc-part hc-lbase', L.cx - L.r - 4, L.cy - L.r - 4,
                         (L.r + 4) * 2, (L.r + 4) * 2, LIFT + 8, 8));
  bodyEl.appendChild(box('hc-ring hc-r1', L.cx - L.r, L.cy - L.r, L.r * 2, L.r * 2, LIFT + 18, 10));
  bodyEl.appendChild(box('hc-ring hc-r2', L.cx - L.r + 6, L.cy - L.r + 6,
                         (L.r - 6) * 2, (L.r - 6) * 2, LIFT + 28, 8));
  bodyEl.appendChild(box('hc-ring hc-r3', L.cx - L.r + 12, L.cy - L.r + 12,
                         (L.r - 12) * 2, (L.r - 12) * 2, LIFT + 36, 6));
  var eye = box('hc-eye', L.cx - L.r + 18, L.cy - L.r + 18, (L.r - 18) * 2, (L.r - 18) * 2, LIFT + 41);
  var glint = el('div', 'hc-glint');
  eye.appendChild(glint);
  bodyEl.appendChild(eye);

  /* the key row */
  KEYS.forEach(function (kk, i) {
    var x = F.keys.x + i * (F.keys.size + F.keys.gap);
    var key = box('hc-part hc-key', x, F.keys.y, F.keys.size, F.keys.size, LIFT + 6, 6, 'button');
    key.type = 'button';
    key.style.background = kk.bg;
    key.style.color = kk.fg;
    key.textContent = kk.t;
    key.setAttribute('tabindex', '-1');       /* the Stack pick offers the same tools; see the note on the dots below */
    key.setAttribute('data-group', 'stack');
    key.setAttribute('data-tool', kk.id);
    key.setAttribute('aria-label', 'Where I have used ' + TOOL_NAME[kk.id]);
    bodyEl.appendChild(key);
  });

  /* a highlight that stays with the light rather than with the part */
  var sheen = box('hc-sheen', 0, 0, BODY, BODY, LIFT + 44);
  bodyEl.appendChild(sheen);

  rig.appendChild(bodyEl);
  hold.insertBefore(rig, hold.firstChild);

  /* ------------------------------------------- what each part stands for
     The chip is an index into the work. Pick a part and it opens the real
     numbers behind it and a jump to the write-up. Every figure below is on
     the resume; nothing is here for atmosphere. */
  var GROUPS = {
    web: {
      pick: 'Web', kicker: 'Web · the display',
      head: 'FSAM website and regional infrastructure',
      metrics: [['60%', 'less manual communication overhead'], ['80', 'Tampa Bay students given a route into elite math contests']],
      points: [
        'Built and maintain the organization’s site in HTML, CSS and JavaScript, on Linux-based hosting, with Git.',
        'Region 4a Coordinator and Webmaster, June 2023 to May 2026.'
      ],
      row: 'fsam', ext: ['flsam.org', 'https://flsam.org/']
    },
    robotics: {
      pick: 'Robotics', kicker: 'Robotics · the D-pad',
      head: 'Middleton Robotics: FRC and VEX',
      metrics: [['2', 'national awards'], ['1', 'World Championship award'], ['30%', 'more competitive participation, 9 teams']],
      points: [
        'Returned the school’s FRC program to competition after years of inactivity.',
        'Java on the RoboRIO, C++ on VEX controllers, Git for version control.'
      ],
      row: 'robotics', ext: ['middletonrobotics.com', 'https://www.middletonrobotics.com/']
    },
    vision: {
      pick: 'Vision', kicker: 'Vision · the lens',
      head: 'Plant biomass by computer vision',
      metrics: [['6.9%', 'MAPE across 6 growth trials'], ['0.91', 'R² against harvest ground truth']],
      points: [
        'OpenCV in Python: HSV conversion, Excess Green Index segmentation, morphological refinement.',
        'A NASA Kennedy Space Center Award at the Southeastern Science and Engineering Fair.'
      ],
      row: 'hydro'
    },
    stack: {
      pick: 'Stack', kicker: 'Stack · the keys',
      head: 'Where I’ve used each tool'
    }
  };
  var ORDER = ['vision', 'web', 'robotics', 'stack'];

  var TOOLS = [
    { id: 'js',  name: 'JavaScript',    where: [['FSAM site and regional infrastructure', 'fsam']] },
    { id: 'py',  name: 'Python',        where: [['OpenCV biomass pipeline', 'hydro']] },
    { id: 'cpp', name: 'C++',           where: [['VEX controllers at Middleton Robotics', 'robotics']] },
    { id: 'cad', name: 'Autodesk',      where: [['Inventor, AutoCAD and Fusion 360: certified user', null]] },
    { id: 'ki',  name: 'KiCad',         where: [['Environmental monitoring board', 'envpcb'], ['SoutheastCon robot board', 'pcb']] },
    { id: 'sv',  name: 'SystemVerilog', where: [['CPU RTL at the Smart Systems Lab', 'fpga']] },
    { id: 'lx',  name: 'Linux',         where: [['FSAM web hosting. Linux Essentials certified', 'fsam']] }
  ];

  function t(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text != null) e.textContent = text;
    return e;
  }
  function link(cls, text, href, ext) {
    var a = t('a', cls, text);
    a.href = href;
    if (ext) { a.target = '_blank'; a.rel = 'noopener'; }
    return a;
  }

  var idx  = document.getElementById('chipIndex');
  var read = document.getElementById('chipRead');
  var picks = [], panels = {}, toolBtns = {}, toolDetail = null, selTool = 'ki';

  ORDER.forEach(function (g) {
    var G = GROUPS[g];

    var b = t('button', 'chip-pick wipe', G.pick);
    b.type = 'button';
    b.setAttribute('data-group', g);
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-controls', 'chipPanel-' + g);
    idx.appendChild(b);
    picks.push(b);

    var p = t('div', 'chip-panel');
    p.id = 'chipPanel-' + g;
    p.setAttribute('data-group', g);
    var top = t('div', 'chip-top');
    var ttl = t('div', 'chip-title');
    ttl.appendChild(t('p', 'lbl chip-k', G.kicker));
    ttl.appendChild(t('h3', 'chip-h', G.head));
    top.appendChild(ttl);
    if (G.row) top.appendChild(link('chip-cta wipe', 'Write-up ↓', '#proj-' + G.row));
    p.appendChild(top);

    if (G.metrics) {
      var m = t('div', 'chip-metrics');
      G.metrics.forEach(function (x) {
        var c = t('div');
        c.appendChild(t('b', null, x[0]));
        c.appendChild(t('span', null, x[1]));
        m.appendChild(c);
      });
      p.appendChild(m);
      var ul = t('ul', 'chip-points');
      G.points.forEach(function (x) { ul.appendChild(t('li', null, x)); });
      if (G.ext) {
        var li2 = t('li');
        li2.appendChild(link('chip-ext', G.ext[0] + ' ↗', G.ext[1], true));
        ul.appendChild(li2);
      }
      p.appendChild(ul);
    } else {
      var grid = t('div', 'chip-toolgrid');
      grid.setAttribute('role', 'group');
      grid.setAttribute('aria-label', 'Tools');
      TOOLS.forEach(function (T) {
        var K = KEYS.filter(function (k) { return k.id === T.id; })[0];
        var tb = t('button', 'chip-toolbtn');
        tb.type = 'button';
        tb.setAttribute('data-tool', T.id);
        tb.setAttribute('aria-pressed', 'false');
        var badge = t('span', 'chip-kb', K.t);
        badge.style.background = K.bg; badge.style.color = K.fg;
        badge.setAttribute('aria-hidden', 'true');
        tb.appendChild(badge);
        tb.appendChild(t('span', null, T.name));
        grid.appendChild(tb);
        toolBtns[T.id] = tb;
      });
      p.appendChild(grid);
      toolDetail = t('p', 'chip-td');
      p.appendChild(toolDetail);
    }

    read.appendChild(p);
    panels[g] = p;
  });

  /* the parts on the package that stand for each group */
  var partsOf = {
    web:      [].slice.call(bodyEl.querySelectorAll('.hc-lcd, .hc-glass')),
    robotics: [].slice.call(bodyEl.querySelectorAll('.hc-dkey')),
    vision:   [].slice.call(bodyEl.querySelectorAll('.hc-lbase, .hc-ring, .hc-eye')),
    stack:    [].slice.call(bodyEl.querySelectorAll('.hc-key'))
  };
  Object.keys(partsOf).forEach(function (g) {
    partsOf[g].forEach(function (n) { if (!n.hasAttribute('data-group')) n.setAttribute('data-group', g); });
  });

  /* the dots sit on the three big features; the keys need none, they are buttons */
  var AT = {
    web:      [F.lcd.x + F.lcd.w / 2, F.lcd.y + F.lcd.h / 2, LIFT + 12],
    robotics: [F.dpad.cx, F.dpad.cy, LIFT + 14],
    vision:   [L.cx, L.cy, LIFT + 46]
  };
  var pad = (BOX - BODY) / 2;
  /* The dots and keys are a pointer and touch shortcut to what the four picks
     below already do. Out of the tab order so a keyboard user reaches the
     picks directly; still buttons, so a screen reader can find them. */
  spots.forEach(function (sp) { sp.setAttribute('tabindex', '-1'); });
  spots.forEach(function (sp) {
    var a2 = AT[sp.getAttribute('data-group')];
    if (!a2) return;
    sp.style.left = ((pad + a2[0]) / BOX * 100) + '%';
    sp.style.top  = ((pad + a2[1]) / BOX * 100) + '%';
    sp.style.transform = 'translateZ(' + a2[2] + 'px)';
  });

  var sel = null, userPicked = false;

  function showTool(id) {
    var T = TOOLS.filter(function (x) { return x.id === id; })[0];
    if (!T || !toolDetail) return;
    toolDetail.textContent = '';
    toolDetail.appendChild(t('b', null, T.name));
    toolDetail.appendChild(document.createTextNode(' — '));
    T.where.forEach(function (w, i) {
      if (i) toolDetail.appendChild(document.createTextNode(' · '));
      if (w[1]) toolDetail.appendChild(link('chip-tl', w[0] + ' ↓', '#proj-' + w[1]));
      else toolDetail.appendChild(document.createTextNode(w[0]));
    });
  }

  function pick(group, tool, fromUser) {
    if (!GROUPS[group]) return;
    sel = group;
    if (fromUser) userPicked = true;
    if (group === 'stack') { tool = tool || selTool; selTool = tool; showTool(tool); }
    Object.keys(toolBtns).forEach(function (id) { toolBtns[id].setAttribute('aria-pressed', group === 'stack' && id === tool ? 'true' : 'false'); });

    picks.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-group') === group ? 'true' : 'false'); });
    ORDER.forEach(function (g) {
      var on = g === group;
      panels[g].classList.toggle('is-on', on);
      if (on) panels[g].removeAttribute('inert'); else panels[g].setAttribute('inert', '');
    });
    Object.keys(partsOf).forEach(function (g) {
      partsOf[g].forEach(function (n) {
        var hit = g === group && (g !== 'stack' || !tool || n.getAttribute('data-tool') === tool);
        n.classList.toggle('is-sel', hit);
      });
    });
    spots.forEach(function (sp) { sp.classList.toggle('is-on', sp.getAttribute('data-group') === group); });
    hold.classList.add('has-sel');
  }

  read.addEventListener('click', function (e) {
    var tb = e.target.closest('.chip-toolbtn');
    if (tb) pick('stack', tb.getAttribute('data-tool'), true);
  });

  idx.addEventListener('click', function (e) {
    var b = e.target.closest('.chip-pick');
    if (b) pick(b.getAttribute('data-group'), null, true);
  });

  /* a tap on any part of the package. Drag only starts after a few pixels of
     movement (see below), so a tap reaches here as an ordinary click, and so
     does Enter on a focused key. */
  var suppressClick = false;
  hold.addEventListener('click', function (e) {
    if (suppressClick) return;
    var n = e.target.closest('[data-group]');
    if (n) pick(n.getAttribute('data-group'), n.getAttribute('data-tool'), true);
  });

  pick('vision', null, false);     /* open on the strongest single piece of evidence */

  /* -------------------------------------------------------------- motion */
  var DRIFT = 2.6, MAX_TILT = 9;
  var rot = -18, vel = 0;
  var tx = 15, ty = 0, tgx = 15, tgy = 0;
  var dragging = false, paused = false, visible = true;
  var last = 0, raf = 0, lastSY = null;

  function rad(d) { return d * Math.PI / 180; }

  /* Pose. portal.js turns the part to face the reader and hold still while the
     About page grows out of its display. mix 0 is the free-running part; mix 1
     is upright and flat-on. The free values are frozen while it is above 0 and
     handed back untouched when it returns to 0, so nothing snaps. */
  var poseMix = 0, poseRotFrom = 0, poseRotTo = 0, poseTxFrom = 0;
  function effRot() { return poseMix > 0 ? poseRotFrom + (poseRotTo - poseRotFrom) * poseMix : rot; }
  function effTx()  { return poseMix > 0 ? poseTxFrom * (1 - poseMix) : tx; }
  function setPose(m) {
    m = Math.max(0, Math.min(1, m));
    if (m > 0 && poseMix === 0) { poseRotFrom = rot; poseRotTo = Math.round(rot / 360) * 360; poseTxFrom = tx; vel = 0; }
    if (m === 0 && poseMix > 0) { rot = poseRotFrom; tx = poseTxFrom; }
    poseMix = m;
    apply();
  }
  /* where the display sits on screen when the part is upright and flat-on */
  function measureLCD() {
    var prev = poseMix;
    if (prev === 0) { poseRotFrom = rot; poseRotTo = Math.round(rot / 360) * 360; poseTxFrom = tx; }
    poseMix = 1; apply();
    var r = glass.getBoundingClientRect();
    poseMix = prev; apply();
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  }
  window.__chip = { setPose: setPose, measureLCD: measureLCD };

  function apply() {
    var er = effRot(), et = effTx();
    hold.style.transform = 'rotateX(' + et.toFixed(2) + 'deg) rotateY(' + ty.toFixed(2) +
                           'deg) rotateZ(' + er.toFixed(2) + 'deg)';

    /* shadows: rotate the light back out of the part's own frame */
    var away = rad(LIGHT + 180 - er);
    hold.style.setProperty('--sx', Math.cos(away).toFixed(3));
    hold.style.setProperty('--sy', Math.sin(away).toFixed(3));
    sheen.style.transform = 'translateZ(' + (LIFT + 44) + 'px) rotate(' + (-er).toFixed(2) + 'deg)';
    glint.style.transform = 'rotate(' + (-er).toFixed(2) + 'deg)';

    /* walls: brightness from how squarely each one faces the light */
    for (var i = 0; i < walls.length; i++) {
      var nrm = rad(parseFloat(walls[i].dataset.nrm) + er);
      var d = Math.cos(nrm - rad(LIGHT));
      walls[i].style.filter = 'brightness(' + (0.52 + 0.92 * Math.max(0, d)).toFixed(3) + ')';
    }
  }

  function angleAt(e) {
    var r = hold.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2),
                      e.clientX - (r.left + r.width / 2)) * 180 / Math.PI;
  }
  var grabRot = 0, lastAngle = 0, lastT = 0;
  var pending = false, downX = 0, downY = 0, downId = 0;

  hold.addEventListener('pointerdown', function (e) {
    if (poseMix > 0) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    pending = true; downX = e.clientX; downY = e.clientY; downId = e.pointerId;
  });
  hold.addEventListener('pointermove', function (e) {
    if (pending && !dragging && Math.hypot(e.clientX - downX, e.clientY - downY) > 5) {
      dragging = true; pending = false;
      try { hold.setPointerCapture(downId); } catch (err) { /* already released */ }
      lastAngle = angleAt(e); grabRot = rot; lastT = performance.now(); vel = 0;
      return;
    }
    if (!dragging) return;
    var ang = angleAt(e), d = ang - lastAngle;
    while (d > 180) d -= 360;
    while (d < -180) d += 360;
    var now = performance.now(), dt = Math.max(8, now - lastT);
    vel = d / dt * 1000;
    lastAngle = ang; lastT = now;
    rot = grabRot + d; grabRot = rot;
    apply();
  });
  function endDrag() {
    pending = false;
    if (!dragging) return;
    dragging = false;
    suppressClick = true;                    /* the release must not also count as a tap */
    setTimeout(function () { suppressClick = false; }, 0);
    vel = Math.max(-900, Math.min(900, vel));
  }
  hold.addEventListener('pointerup', endDrag);
  hold.addEventListener('pointercancel', endDrag);

  var btn = document.getElementById('chipPause');
  if (btn) {
    if (reduce) btn.hidden = true;
    btn.addEventListener('click', function () {
      paused = !paused;
      btn.setAttribute('aria-pressed', String(paused));
      btn.textContent = paused ? 'Play' : 'Pause';
    });
  }

  function tick(now) {
    raf = 0;
    var dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    if (poseMix > 0) { lastSY = window.pageYOffset || 0; }
    else if (!dragging) {
      if (Math.abs(vel) > 1) { rot += vel * dt; vel *= Math.pow(0.12, dt); }
      else { vel = 0; if (!paused && !reduce && !userPicked) rot += DRIFT * dt; }
    }
    /* scrolling the page turns the part, so the chip answers the thing the
       reader is actually doing, not where their pointer happens to be */
    var sy = window.pageYOffset || 0;
    if (!reduce && lastSY !== null && poseMix === 0) rot += (sy - lastSY) * 0.11;
    lastSY = sy;
    tx += (tgx - tx) * Math.min(1, dt * 6);
    ty += (tgy - ty) * Math.min(1, dt * 6);
    apply();
    if (visible) raf = requestAnimationFrame(tick);
    else last = 0;
  }
  function start() { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } }

  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) { lastSY = null; start(); }
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: 0 }).observe(stage);
  }

  /* the rig is laid out in fixed pixels, so scale it to whatever it is given */
  function fit() {
    var wrap = hold.parentNode;
    var w = wrap.clientWidth, h = wrap.clientHeight;
    /* the part and its leads must sit inside the box the page gave it */
    wrap.style.setProperty('--chip-k', Math.max(0.3, Math.min(1.08, w / BOX, h / BOX * 0.9)).toFixed(3));
  }
  fit();
  addEventListener('resize', fit);
  /* the column can change size with no window resize (fonts arriving, the
     loader lifting, the scene pinning), so watch it directly */
  if (window.ResizeObserver) new ResizeObserver(fit).observe(hold.parentNode.parentNode);

  apply();
  start();
})();
