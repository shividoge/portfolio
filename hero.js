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

  var KEYS = [
    { t: 'JS',  bg: '#F7DF1E', fg: '#12120C' },
    { t: 'Py',  bg: '#356C9B', fg: '#FFE873' },
    { t: 'C++', bg: '#00589C', fg: '#DCEBFA' },
    { t: 'A',   bg: '#C0202B', fg: '#FFE9EA' },
    { t: 'Ki',  bg: '#2F4BB0', fg: '#E7ECFF' },
    { t: 'Az',  bg: '#0F7FC1', fg: '#E4F3FC' },
    { t: 'Lx',  bg: '#E9E4D8', fg: '#1A1A1A' }
  ];

  /* ------------------------------------------------------------- helpers */
  function el(tag, cls, css) {
    var d = document.createElement(tag);
    if (cls) d.className = cls;
    if (css) d.style.cssText = css;
    return d;
  }
  function box(cls, x, y, w, h, z, h3) {
    /* a face parked at (x,y) in body space, lifted z above the lid */
    var d = el('div', cls,
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

  /* ------------------------------------------------------------- the LCD */
  function screen() {
    var s = svg(F.lcd.w - 14, F.lcd.h - 14);
    var w = F.lcd.w - 14, h = F.lcd.h - 14;
    s.appendChild(n('rect', { x: 0, y: 0, width: w, height: h, rx: 2, fill: '#CFCFC8' }));
    s.appendChild(n('rect', { x: 0, y: 0, width: w, height: 11, fill: '#B9B9B2' }));
    [6, 13, 20].forEach(function (x) {
      s.appendChild(n('circle', { cx: x, cy: 5.5, r: 1.8, fill: '#6A6A66' }));
    });
    s.appendChild(n('rect', { x: 7, y: 18, width: 24, height: 20, rx: 2,
                              fill: 'none', stroke: '#55554F', 'stroke-width': 1.4 }));
    s.appendChild(n('circle', { cx: 14, cy: 25, r: 2.6, fill: '#55554F' }));
    s.appendChild(n('path', { d: 'M 9 36 L 18 26 L 29 36 Z', fill: '#55554F' }));
    [[38, 20, 56], [38, 27, 48], [38, 34, 52]].forEach(function (l) {
      s.appendChild(n('rect', { x: l[0], y: l[1], width: l[2], height: 3, rx: 1.5, fill: '#6E6E68' }));
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
    var key = box('hc-part hc-key', x, F.keys.y, F.keys.size, F.keys.size, LIFT + 6, 6);
    key.style.background = kk.bg;
    key.style.color = kk.fg;
    key.textContent = kk.t;
    bodyEl.appendChild(key);
  });

  /* a highlight that stays with the light rather than with the part */
  var sheen = box('hc-sheen', 0, 0, BODY, BODY, LIFT + 44);
  bodyEl.appendChild(sheen);

  rig.appendChild(bodyEl);
  hold.insertBefore(rig, hold.firstChild);

  /* ---------------------------------------------------------- the hotspots */
  var AT = {
    'The display': [F.lcd.x + F.lcd.w / 2, F.lcd.y + F.lcd.h / 2, LIFT + 12],
    'The D-pad':   [F.dpad.cx, F.dpad.cy, LIFT + 14],
    'The lens':    [L.cx, L.cy, LIFT + 46],
    'The keys':    [F.keys.x + F.keys.w / 2, F.keys.y + F.keys.size / 2, LIFT + 11]
  };
  var COPY = {
    'The display': 'Web work — FSAM’s site, and a storefront and inventory app I built for a small business.',
    'The D-pad':   'Robotics — two seasons as president, FRC and VEX, and the deployment pipeline behind them.',
    'The lens':    'Computer vision — the OpenCV pipeline that estimated plant biomass to 6.9% MAPE.',
    'The keys':    'The stack — JavaScript, Python, C++, Autodesk, KiCad, Azure and Linux.'
  };
  var pad = (BOX - BODY) / 2;
  spots.forEach(function (sp) {
    var a2 = AT[sp.dataset.title];
    if (!a2) return;
    sp.style.left = ((pad + a2[0]) / BOX * 100) + '%';
    sp.style.top  = ((pad + a2[1]) / BOX * 100) + '%';
    sp.style.transform = 'translateZ(' + a2[2] + 'px)';
  });

  var tip  = document.getElementById('chipTip');
  var tipT = document.getElementById('chipTipT');
  var tipB = document.getElementById('chipTipB');
  var active = null;

  function show(sp) {
    if (active === sp) return;
    if (active) active.classList.remove('is-on');
    active = sp;
    if (!sp) { tip.classList.remove('is-on'); return; }
    sp.classList.add('is-on');
    tipT.textContent = sp.dataset.title;
    tipB.textContent = COPY[sp.dataset.title] || '';
    tip.classList.add('is-on');
  }

  spots.forEach(function (sp) {
    sp.addEventListener('mouseenter', function () { if (!coarse) show(sp); });
    sp.addEventListener('mouseleave', function () { if (!coarse) show(null); });
    sp.addEventListener('focus', function () { show(sp); });
    sp.addEventListener('blur',  function () { show(null); });
    sp.addEventListener('click', function (e) { e.preventDefault(); show(active === sp ? null : sp); });
  });

  /* -------------------------------------------------------------- motion */
  var DRIFT = 2.6, MAX_TILT = 9;
  var rot = -18, vel = 0;
  var tx = 15, ty = 0, tgx = 15, tgy = 0;
  var dragging = false, paused = false, visible = true;
  var last = 0, raf = 0;

  function rad(d) { return d * Math.PI / 180; }

  function apply() {
    hold.style.transform = 'rotateX(' + tx.toFixed(2) + 'deg) rotateY(' + ty.toFixed(2) +
                           'deg) rotateZ(' + rot.toFixed(2) + 'deg)';

    /* shadows: rotate the light back out of the part's own frame */
    var away = rad(LIGHT + 180 - rot);
    hold.style.setProperty('--sx', Math.cos(away).toFixed(3));
    hold.style.setProperty('--sy', Math.sin(away).toFixed(3));
    sheen.style.transform = 'translateZ(' + (LIFT + 44) + 'px) rotate(' + (-rot).toFixed(2) + 'deg)';
    glint.style.transform = 'rotate(' + (-rot).toFixed(2) + 'deg)';

    /* walls: brightness from how squarely each one faces the light */
    for (var i = 0; i < walls.length; i++) {
      var nrm = rad(parseFloat(walls[i].dataset.nrm) + rot);
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

  hold.addEventListener('pointerdown', function (e) {
    if (e.target.closest('.spot')) return;
    dragging = true;
    hold.classList.add('is-drag');
    hold.setPointerCapture(e.pointerId);
    lastAngle = angleAt(e); grabRot = rot; lastT = performance.now(); vel = 0;
    show(null);
  });
  hold.addEventListener('pointermove', function (e) {
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
    if (!dragging) return;
    dragging = false;
    hold.classList.remove('is-drag');
    vel = Math.max(-900, Math.min(900, vel));
  }
  hold.addEventListener('pointerup', endDrag);
  hold.addEventListener('pointercancel', endDrag);

  if (!coarse) {
    stage.addEventListener('pointermove', function (e) {
      if (reduce) return;
      var r = hold.getBoundingClientRect();
      var nx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
      var ny = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
      tgy =  Math.max(-1, Math.min(1, nx)) * MAX_TILT;
      tgx = 15 - Math.max(-1, Math.min(1, ny)) * MAX_TILT;
    });
    stage.addEventListener('pointerleave', function () { tgx = 15; tgy = 0; });
  }

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
    if (!dragging) {
      if (Math.abs(vel) > 1) { rot += vel * dt; vel *= Math.pow(0.12, dt); }
      else { vel = 0; if (!paused && !reduce) rot += DRIFT * dt; }
    }
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
      if (visible) start();
      else if (raf) { cancelAnimationFrame(raf); raf = 0; }
    }, { threshold: 0 }).observe(stage);
  }

  /* the rig is laid out in fixed pixels, so scale it to whatever it is given */
  function fit() {
    var wrap = hold.parentNode;
    var w = wrap.clientWidth;
    wrap.style.setProperty('--chip-k', Math.max(0.3, Math.min(1.08, w / BOX)).toFixed(3));
  }
  fit();
  addEventListener('resize', fit);

  apply();
  start();
})();
