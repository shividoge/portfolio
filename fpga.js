/* ===========================================================================
   The chip in the "Currently building" panel.

   Not a wireframe. It is built the way the part is built: a board plane with
   copper escape routing, a solder-ball grid, an epoxy package with real
   thickness (four walls, not a rotated card), and laser marking on the lid.
   Everything is drawn from the constants below, so the geometry stays
   self-consistent — the fanout starts where the balls are, and the balls sit
   under the package outline.

   Motion is two nested CSS animations, yaw and a slow tilt, so the pause
   button only has to flip animation-play-state. Reduced motion gets a static
   three-quarter view and no control.
   =========================================================================== */
(function () {
  'use strict';

  var host = document.getElementById('fpgaSpinner');
  if (!host) return;

  var NS     = 'http://www.w3.org/2000/svg';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var BOX   = 400;   /* the square the whole assembly is laid out in */
  var BODY  = 196;   /* package footprint */
  var THICK = 26;    /* package height */
  var HALF  = BODY / 2;
  var BALLS = 12;    /* 12 x 12 grid, perimeter-depopulated like a real CPG */
  var PITCH = BODY / (BALLS + 1);

  /* ---------------------------------------------------------------- helpers */
  function el(tag, cls, css) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (css) d.style.cssText = css;
    return d;
  }
  function svg(w, h) {
    var s = document.createElementNS(NS, 'svg');
    s.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    s.setAttribute('width', w); s.setAttribute('height', h);
    return s;
  }
  function node(tag, attrs) {
    var n = document.createElementNS(NS, tag);
    for (var k in attrs) n.setAttribute(k, attrs[k]);
    return n;
  }

  /* --------------------------------------------------------------- the board
     Escape routing: every ball on the outer two rows has to get out from under
     the package, so the copper leaves radially and fans into the four edges.
     Vias drop the inner rows to another layer — which is why the inner grid
     has rings and the outer rows have lines. */
  function board() {
    var s = svg(BOX, BOX);
    var defs = node('defs', {});
    var g = node('radialGradient', { id: 'fpBoard', cx: '50%', cy: '42%', r: '68%' });
    g.appendChild(node('stop', { offset: '0%',   'stop-color': '#17171C' }));
    g.appendChild(node('stop', { offset: '100%', 'stop-color': '#0A0A0C' }));
    defs.appendChild(g);
    s.appendChild(defs);

    s.appendChild(node('rect', { x: 0, y: 0, width: BOX, height: BOX, fill: 'url(#fpBoard)' }));

    var c = BOX / 2;
    var traces = node('g', { fill: 'none', stroke: '#6B3FA0', 'stroke-width': 1.1,
                             'stroke-opacity': .5, 'stroke-linecap': 'round' });
    var pads = node('g', { fill: '#C9A227', 'fill-opacity': .55 });

    /* two depopulated outer rows escape straight out to the board edge */
    for (var side = 0; side < 4; side++) {
      for (var i = 0; i < BALLS; i++) {
        if (i % 2) continue;                         /* every other ball escapes */
        var off = -HALF + PITCH * (i + 1);
        var run = 46 + (i % 4) * 11;                 /* staggered lengths, as routed */
        var x0, y0, x1, y1;
        if (side === 0)      { x0 = c + off; y0 = c - HALF + 6;  x1 = x0; y1 = y0 - run; }
        else if (side === 1) { x0 = c + HALF - 6; y0 = c + off;  x1 = x0 + run; y1 = y0; }
        else if (side === 2) { x0 = c + off; y0 = c + HALF - 6;  x1 = x0; y1 = y0 + run; }
        else                 { x0 = c - HALF + 6; y0 = c + off;  x1 = x0 - run; y1 = y0; }
        traces.appendChild(node('path', { d: 'M ' + x0 + ' ' + y0 + ' L ' + x1 + ' ' + y1 }));
        pads.appendChild(node('circle', { cx: x1, cy: y1, r: 2.6 }));
      }
    }

    /* silkscreen: the package outline and its pin-1 index */
    var silk = node('g', { fill: 'none', stroke: '#8A8794', 'stroke-opacity': .34, 'stroke-width': 1 });
    silk.appendChild(node('rect', { x: c - HALF - 7, y: c - HALF - 7,
                                    width: BODY + 14, height: BODY + 14 }));
    silk.appendChild(node('path', { d: 'M ' + (c - HALF - 7) + ' ' + (c - HALF + 13) +
                                       ' L ' + (c - HALF + 13) + ' ' + (c - HALF - 7) }));

    /* fiducials, one per corner, as on any assembled board */
    var fid = node('g', { fill: '#C9A227', 'fill-opacity': .4 });
    [[26, 26], [BOX - 26, 26], [26, BOX - 26], [BOX - 26, BOX - 26]].forEach(function (p) {
      fid.appendChild(node('circle', { cx: p[0], cy: p[1], r: 3 }));
    });

    s.appendChild(traces); s.appendChild(pads); s.appendChild(silk); s.appendChild(fid);
    return s;
  }

  /* ------------------------------------------------------------ package lid */
  function lid() {
    var s = svg(BODY, BODY);
    var defs = node('defs', {});

    var lg = node('linearGradient', { id: 'fpLid', x1: '0%', y1: '0%', x2: '100%', y2: '100%' });
    lg.appendChild(node('stop', { offset: '0%',   'stop-color': '#26262B' }));
    lg.appendChild(node('stop', { offset: '46%',  'stop-color': '#151519' }));
    lg.appendChild(node('stop', { offset: '100%', 'stop-color': '#0B0B0E' }));
    defs.appendChild(lg);

    /* epoxy is not smooth — a little grain stops it reading as flat vector */
    var f = node('filter', { id: 'fpGrain', x: '0%', y: '0%', width: '100%', height: '100%' });
    f.appendChild(node('feTurbulence', { type: 'fractalNoise', baseFrequency: '.9',
                                         numOctaves: '3', result: 'n' }));
    f.appendChild(node('feColorMatrix', { type: 'saturate', values: '0', 'in': 'n', result: 'g' }));
    defs.appendChild(f);
    s.appendChild(defs);

    s.appendChild(node('rect', { x: 0, y: 0, width: BODY, height: BODY, rx: 3, fill: 'url(#fpLid)' }));
    s.appendChild(node('rect', { x: 0, y: 0, width: BODY, height: BODY, rx: 3,
                                 filter: 'url(#fpGrain)', opacity: .05 }));

    /* moulded bevel: light catches the top edge, the bottom edge falls away */
    s.appendChild(node('path', { d: 'M 3 5 H ' + (BODY - 3), stroke: '#4A4A54',
                                 'stroke-opacity': .85, 'stroke-width': 1.4, fill: 'none' }));
    s.appendChild(node('path', { d: 'M 3 ' + (BODY - 4) + ' H ' + (BODY - 3), stroke: '#000',
                                 'stroke-opacity': .55, 'stroke-width': 1.6, fill: 'none' }));
    s.appendChild(node('rect', { x: 9, y: 9, width: BODY - 18, height: BODY - 18, rx: 2,
                                 fill: 'none', stroke: '#000', 'stroke-opacity': .28 }));

    /* pin 1: the dimple, and the corner chamfer marked on the lid */
    s.appendChild(node('circle', { cx: 22, cy: 22, r: 6, fill: '#08080A' }));
    s.appendChild(node('circle', { cx: 22, cy: 22, r: 6, fill: 'none',
                                   stroke: '#55555F', 'stroke-opacity': .7 }));
    s.appendChild(node('path', { d: 'M 9 30 L 30 9', stroke: '#3A3A43', 'stroke-width': 1.2 }));

    /* laser marking */
    var mark = node('g', { fill: '#8B8894', 'font-family': '"Space Grotesk", sans-serif' });
    function line(y, size, weight, spacing, text, fill) {
      var t = node('text', { x: BODY / 2, y: y, 'text-anchor': 'middle',
                             'font-size': size, 'font-weight': weight,
                             'letter-spacing': spacing });
      if (fill) t.setAttribute('fill', fill);
      t.textContent = text;
      mark.appendChild(t);
    }
    line(78,  19, 600, '1.5', 'SA-CPU', '#B9B5C2');
    line(96,   9, 500, '2.2', 'ALU + DATAPATH');
    line(112,  9, 500, '2.2', 'SYSTEMVERILOG');
    line(136,  8, 500, '1.8', 'SMART SYSTEMS LAB');
    line(150,  8, 500, '1.8', 'UF ECE  ·  2026');
    s.appendChild(mark);

    return s;
  }

  /* ------------------------------------------- package underside: the balls */
  function balls() {
    var s = svg(BODY, BODY);
    var defs = node('defs', {});
    var g = node('radialGradient', { id: 'fpBall', cx: '35%', cy: '32%', r: '70%' });
    g.appendChild(node('stop', { offset: '0%',   'stop-color': '#E8D28A' }));
    g.appendChild(node('stop', { offset: '55%',  'stop-color': '#B8973F' }));
    g.appendChild(node('stop', { offset: '100%', 'stop-color': '#6A5420' }));
    defs.appendChild(g);
    s.appendChild(defs);

    s.appendChild(node('rect', { x: 0, y: 0, width: BODY, height: BODY, rx: 3, fill: '#0E0E11' }));

    var grid = node('g', { fill: 'url(#fpBall)' });
    for (var r = 0; r < BALLS; r++) {
      for (var c2 = 0; c2 < BALLS; c2++) {
        /* real BGAs depopulate the middle where the die sits */
        var mid = (r > 3 && r < BALLS - 4 && c2 > 3 && c2 < BALLS - 4);
        if (mid) continue;
        grid.appendChild(node('circle', { cx: PITCH * (c2 + 1), cy: PITCH * (r + 1), r: 3.4 }));
      }
    }
    s.appendChild(grid);
    s.appendChild(node('circle', { cx: PITCH, cy: PITCH, r: 6.4, fill: 'none',
                                   stroke: '#8B8894', 'stroke-opacity': .6 }));
    return s;
  }

  /* --------------------------------------------------------------- assemble */
  function face(cls, transform, w, h, child) {
    var d = el('div', cls,
      'position:absolute;left:50%;top:50%;width:' + w + 'px;height:' + h + 'px;' +
      'margin-left:' + (-w / 2) + 'px;margin-top:' + (-h / 2) + 'px;' +
      'transform:' + transform + ';');
    if (child) d.appendChild(child);
    return d;
  }

  host.innerHTML = '';

  var scene = el('div', 'chip-scene');
  var spin  = el('div', 'chip-spin');

  spin.appendChild(face('chip-board', 'translateZ(' + (-THICK / 2 - 4) + 'px)', BOX, BOX, board()));
  spin.appendChild(face('chip-shadow', 'translateZ(' + (-THICK / 2 - 3) + 'px)', BODY + 40, BODY + 40));

  var pkg = el('div', 'chip-pkg', 'position:absolute;inset:0;transform-style:preserve-3d;');
  pkg.appendChild(face('chip-face', 'translateZ(' + (THICK / 2) + 'px)', BODY, BODY, lid()));
  pkg.appendChild(face('chip-face', 'rotateX(180deg) translateZ(' + (THICK / 2) + 'px)', BODY, BODY, balls()));
  pkg.appendChild(face('chip-wall', 'rotateX(90deg)  translateZ(' + HALF + 'px)', BODY, THICK));
  pkg.appendChild(face('chip-wall', 'rotateX(-90deg) translateZ(' + HALF + 'px)', BODY, THICK));
  pkg.appendChild(face('chip-wall chip-wall-v', 'rotateY(90deg)  translateZ(' + HALF + 'px)', THICK, BODY));
  pkg.appendChild(face('chip-wall chip-wall-v', 'rotateY(-90deg) translateZ(' + HALF + 'px)', THICK, BODY));
  spin.appendChild(pkg);

  /* a specular highlight that stays put in world space while the part turns */
  var sheen = face('chip-sheen', 'translateZ(' + (THICK / 2 + 0.1) + 'px)', BODY, BODY);
  pkg.appendChild(sheen);

  scene.appendChild(spin);
  host.appendChild(scene);

  /* ------------------------------------------------------------------ scale
     The rig is laid out in fixed pixels because translateZ has to be, so the
     whole thing is scaled to whatever the stage gives it. */
  function fit() {
    var stage = host.parentNode;
    var avail = Math.min(stage.clientWidth - 24, stage.clientHeight - 24, BOX);
    var k = Math.max(0.4, Math.min(1, avail / BOX));
    host.style.setProperty('--chip-scale', k.toFixed(3));
  }
  fit();
  addEventListener('resize', fit);

  /* ------------------------------------------------------------------ pause */
  var btn = document.getElementById('fpgaToggle');
  if (reduce) {
    host.classList.add('is-static');
    if (btn) btn.hidden = true;
    return;
  }
  if (!btn) return;

  var paused = false;
  btn.addEventListener('click', function () {
    paused = !paused;
    host.classList.toggle('is-paused', paused);
    btn.setAttribute('aria-pressed', String(paused));
    btn.textContent = paused ? 'Play' : 'Pause';
  });
})();
