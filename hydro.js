/* ===========================================================================
   The chamber, four ways.  (Hydroponic Growth Chamber row)

   A piece of space in a box: a closed loop built for long-term space travel
   that senses its own climate, recirculates nutrients, and weighs a plant by
   looking at it. This explorer is the project's own site
   (shividoge.github.io/hydroponics-growth-system) brought into the page:

     Chamber   the 3D model, part by part           (hydro3d.js + Three.js)
     Vision    the camera pipeline, run live in the browser
     Results   the trial errors against the targets
     Why       the decisions behind the parts

   What is real and what is not, said on the panels:
     · per-trial errors, targets, ranges and the decision outcomes are the
       project's own;
     · the plant image, the calibration factor and the regression coefficients
       in the Vision tab are illustrative stand-ins, because the fitted values
       are not published on the board;
     · the 3D model is a procedural rebuild of the CAD design.
   =========================================================================== */
(function () {
  'use strict';

  var mount = document.getElementById('hydroMount');
  if (!mount) return;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function h(tag, cls, html, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }

  /* ------------------------------------------------------------- the parts */
  var PARTS = {
    chamber:   { n: 'Growth chamber', short: 'Chamber', tag: 'Housing', lines: ['Fixed top-down camera geometry', 'Constant LED spectrum', 'Controlled environment around a single plant', 'Creates the housing for chamber and sensors'] },
    reservoir: { n: 'Reservoir base', short: 'Reservoir', tag: 'Nutrient storage', lines: ['External nutrient storage', 'Pump housing compartment', 'Nutrient: Miracle-Gro, chosen in the selection matrix'] },
    platform:  { n: 'White spacer platform', short: 'Platform', tag: 'Mounting plane', lines: ['Mounting plane for sensor, microcontroller and fan', 'Structural separation from the reservoir'] },
    teensy:    { n: 'Teensy 4 controller', short: 'Teensy 4', tag: 'Central control', lines: ['Central control logic', 'Sensor data acquisition', 'Camera data processing', 'Relay switching for the LED', 'Top of the board-selection matrix'] },
    bme:       { n: 'BME680 sensor', short: 'BME680', tag: 'Environmental sensing', lines: ['Temperature (°C) and relative humidity (%)', 'Equivalent CO₂ (ppm) and VOC (ppb)', 'I²C at 3.3 V on a shared bus'] },
    fan:       { n: '5 V circulation fan', short: 'Fan', tag: 'Air circulation', lines: ['5 V fan moves air across the plant', 'Simulates a breeze for the stems'] },
    led:       { n: 'Blurple LED', short: 'LED', tag: 'Lighting', lines: ['Constant spectral output', 'Best growth and CV stability in the lighting matrix', 'Switched by the Teensy through a relay'] },
    camera:    { n: 'Camera mount', short: 'Camera', tag: 'Vision', lines: ['External camera positioning', 'Two adjustable positions depending on plant height', 'Fixed top-down view for repeatable canopy images'] },
    pump:      { n: 'Submersible pump', short: 'Pump', tag: 'Circulation', lines: ['Submersible pump-driven delivery', 'Continuous recirculation loop'] },
    plumb:     { n: 'Water circuit', short: 'Plumbing', tag: 'Closed loop', lines: ['Nutrient delivered from the reservoir to the roots', 'Gravity-assisted return flow', 'Closed-loop nutrient cycling'] },
    plant:     { n: 'Plant in rockwool', short: 'Plant', tag: 'Subject', lines: ['Single-plant imaging configuration', 'Canopy area is the input to the biomass model'] }
  };
  var ORDER = ['chamber', 'reservoir', 'platform', 'teensy', 'bme', 'fan', 'led', 'camera', 'pump', 'plumb', 'plant'];

  /* ---------------------------------------------------------------- shell */
  var root = h('div', 'exp hyd');

  var head = h('div', 'exp-head');
  head.appendChild(h('div', null,
    '<p class="lbl exp-k">Explorer / the chamber</p>' +
    '<p class="exp-h">A closed loop built for long-term space travel</p>'));
  head.appendChild(h('p', 'exp-sub',
    'Space agriculture, environmental engineering. Turn the model, watch the camera turn a plant into grams, then check the results against the targets.'));
  root.appendChild(head);

  var TABS = [['chamber', 'Chamber'], ['vision', 'Vision'], ['results', 'Results'], ['why', 'Why these parts']];
  var tabBar = h('div', 'hyd-tabs', null, { role: 'tablist', 'aria-label': 'Chamber explorer' });
  var tabBtn = {}, panel = {};
  TABS.forEach(function (t) {
    var b = h('button', 'hyd-tab', t[1], { type: 'button', role: 'tab', id: 'hydTab-' + t[0], 'aria-controls': 'hydPanel-' + t[0], 'aria-selected': 'false', tabindex: '-1' });
    tabBar.appendChild(b); tabBtn[t[0]] = b;
    var p = h('div', 'hyd-panel', null, { role: 'tabpanel', id: 'hydPanel-' + t[0], 'aria-labelledby': 'hydTab-' + t[0], tabindex: '0' });
    p.hidden = true; panel[t[0]] = p;
  });
  root.appendChild(tabBar);
  TABS.forEach(function (t) { root.appendChild(panel[t[0]]); });
  mount.appendChild(root);

  var ctl3d = null, started = { vision: false, results: false };

  function show(key, focus) {
    TABS.forEach(function (t) {
      var on = t[0] === key;
      tabBtn[t[0]].setAttribute('aria-selected', on ? 'true' : 'false');
      tabBtn[t[0]].tabIndex = on ? 0 : -1;
      panel[t[0]].hidden = !on;
    });
    if (focus) tabBtn[key].focus();
    if (ctl3d) ctl3d.setTab(key === 'chamber');
    if (key === 'vision' && !started.vision) { started.vision = true; startVision(); }
    if (key === 'results') { drawMape(); }
    if (key === 'vision') drawGrowth(+dayEl.value);
  }
  tabBar.addEventListener('click', function (e) { var b = e.target.closest('.hyd-tab'); if (b) show(b.id.replace('hydTab-', ''), false); });
  tabBar.addEventListener('keydown', function (e) {
    var keys = TABS.map(function (t) { return t[0]; });
    var i = keys.indexOf(document.activeElement.id.replace('hydTab-', ''));
    if (i < 0) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); show(keys[(i + 1) % keys.length], true); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); show(keys[(i + keys.length - 1) % keys.length], true); }
    if (e.key === 'Home') { e.preventDefault(); show(keys[0], true); }
    if (e.key === 'End')  { e.preventDefault(); show(keys[keys.length - 1], true); }
  });

  /* ------------------------------------------------------------- 1 chamber */
  var cP = panel.chamber;
  var grid = h('div', 'hyd-grid');

  var stage = h('div', 'hyd-stage');
  var canvas = h('canvas', null, null, { 'aria-label': 'Interactive 3D model of the growth chamber. Drag to rotate.', role: 'img' });
  var labels = h('div', 'hyd-labels');
  stage.appendChild(canvas); stage.appendChild(labels);
  stage.appendChild(h('div', 'hyd-hint', 'Drag to orbit · tap a part'));
  var tools = h('div', 'hyd-tools');
  [['bExplode', 'Exploded', false], ['bLed', 'LED', true], ['bFlow', 'Water flow', true], ['bFan', 'Fan', true], ['bLabels', 'Labels', false], ['bCam', 'Camera high', false]].forEach(function (b) {
    tools.appendChild(h('button', 'hyd-btn', b[1], { type: 'button', id: b[0], 'aria-pressed': b[2] ? 'true' : 'false' }));
  });
  tools.appendChild(h('button', 'hyd-btn', 'View: Iso', { type: 'button', id: 'bView' }));
  tools.appendChild(h('button', 'hyd-btn', '+', { type: 'button', id: 'bIn', 'aria-label': 'Zoom in' }));
  tools.appendChild(h('button', 'hyd-btn', '−', { type: 'button', id: 'bOut', 'aria-label': 'Zoom out' }));
  stage.appendChild(tools);
  grid.appendChild(stage);

  var side = h('div', 'hyd-side');
  side.appendChild(h('p', 'lbl exp-k', 'The parts'));
  var chipsEl = h('div', 'exp-chips', null, { role: 'group', 'aria-label': 'Parts' });
  chipsEl.style.marginTop = '0';
  side.appendChild(chipsEl);
  var info = h('div', 'hyd-info', null, { 'aria-live': 'polite' });
  side.appendChild(info);
  side.appendChild(h('p', 'exp-note', 'The 3D model is a procedural rebuild of the CAD design. The board and the CAD are the source of truth.'));
  grid.appendChild(side);
  cP.appendChild(grid);

  var chipBy = {};
  ORDER.forEach(function (id) {
    var b = h('button', 'exp-chip wipe', PARTS[id].short, { type: 'button', 'aria-pressed': 'false', 'data-id': id });
    chipsEl.appendChild(b); chipBy[id] = b;
    var l = h('button', 'hyd-lab', PARTS[id].short, { type: 'button', 'data-id': id, tabindex: '-1' });
    labels.appendChild(l); PARTS[id].lab = l;
  });
  var sel = 'chamber';
  function select(id) {
    sel = id;
    ORDER.forEach(function (k) {
      chipBy[k].setAttribute('aria-pressed', k === id ? 'true' : 'false');
      PARTS[k].lab.classList.toggle('on', k === id);
    });
    var p = PARTS[id];
    info.innerHTML = '';
    info.appendChild(h('span', 'lbl hyd-tag', p.tag));
    info.appendChild(h('p', 'hyd-it', p.n));
    var ul = h('ul', 'hyd-ul');
    p.lines.forEach(function (x) { ul.appendChild(h('li', null, x)); });
    info.appendChild(ul);
  }
  chipsEl.addEventListener('click', function (e) { var b = e.target.closest('.exp-chip'); if (b) select(b.getAttribute('data-id')); });
  labels.addEventListener('click', function (e) { var b = e.target.closest('.hyd-lab'); if (b) select(b.getAttribute('data-id')); });
  select('chamber');

  /* Three.js is heavy, so it loads only when this panel nears the screen */
  function webgl() { try { return !!document.createElement('canvas').getContext('webgl'); } catch (e) { return false; } }
  function noGL(msg) {
    stage.appendChild(h('p', 'hyd-nogl', msg));
  }
  var booted = false;
  function boot3d() {
    if (booted) return; booted = true;
    if (!webgl()) { noGL('The 3D view needs WebGL, which this browser does not provide. The rest of the explorer works.'); return; }
    function go() {
      if (!window.Hydro3D || !window.THREE) { noGL('The 3D model could not be loaded. The rest of the explorer works.'); return; }
      ctl3d = window.Hydro3D.init({
        canvas: canvas, stage: stage, labels: labels, order: ORDER, parts: PARTS, reduce: reduce,
        select: select, getSel: function () { return sel; },
        $: function (q) { return root.querySelector(q); }
      });
    }
    if (window.THREE) return go();
    var sc = document.createElement('script');
    sc.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
    sc.onload = go; sc.onerror = go;
    document.head.appendChild(sc);
  }
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) { if (es[0].isIntersecting) boot3d(); }, { rootMargin: '600px 0px' }).observe(root);
  } else boot3d();

  /* --------------------------------------------------------------- 2 vision */
  var vP = panel.vision;
  var W = 200, H = 150;
  /* The project measured six fresh masses of 7.0 to 8.4 g from canopy areas of
     294 to 359 cm² (plant_growth_webapp_v2). The exact fitted coefficients are
     not published, so the two below are illustrative, but they are scaled so a
     full-grown plant lands inside that measured range, not at some other size. */
  var MEAS = { areaLo: 294, areaHi: 359, massLo: 7.0, massHi: 8.4 };
  var TARGET_AREA = 330, TARGET_MASS = 7.5, B = 0.6;
  var A = (TARGET_MASS - B) / TARGET_AREA;            /* g per cm² */
  var CAL = 0.0125;                                   /* cm² per pixel, derived below from the pipeline's own day 21 */
  var pxByDay = null;
  var STEPS = [
    ['Raw frame', 'Fixed top-down view under blurple light'],
    ['HSV', 'RGB converted to hue, saturation, value'],
    ['Excess Green', 'ExG = 2G − R − B lifts the plant off the background'],
    ['Threshold', 'Adaptive threshold: plant = 1, background = 0'],
    ['Morphology', 'Noise removal, closing and dilation fill gaps'],
    ['Canopy area', 'Mask pixel count × calibration factor']
  ];
  vP.appendChild(h('p', 'hyd-lead',
    'A fixed top-down camera and a constant blurple LED remove geometry and lighting noise. Every step below runs live in your browser on a generated plant image. Drag the day and watch the canopy area and predicted mass follow.'));
  var stepsEl = h('div', 'hyd-steps');
  var cv = [];
  STEPS.forEach(function (st) {
    var d = h('div', 'hyd-step');
    var c = h('canvas', null, null, { width: W, height: H, 'aria-hidden': 'true' });
    d.appendChild(c);
    d.appendChild(h('b', null, st[0]));
    d.appendChild(h('span', null, st[1]));
    stepsEl.appendChild(d); cv.push(c.getContext('2d'));
  });
  vP.appendChild(stepsEl);

  var vc = h('div', 'hyd-vc');
  var vl = h('div', 'hyd-vl');
  var sliderRow = h('div', 'env-ctl');
  var playV = h('button', 'env-play', '', { type: 'button', 'aria-label': 'Play the growth cycle' });
  playV.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path class="pp" d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg>';
  var dayEl = h('input', 'exp-range', null, { type: 'range', min: 1, max: 21, value: 12, 'aria-label': 'Day of the growth cycle' });
  var dayLbl = h('span', 'num env-clock', 'Day 12');
  sliderRow.appendChild(playV); sliderRow.appendChild(dayEl); sliderRow.appendChild(dayLbl);
  vl.appendChild(sliderRow);
  var ro = h('div', 'hyd-ro');
  var rPx = h('b', 'num'), rCm = h('b', 'num'), rG = h('b', 'num');
  [['Canopy', rPx], ['Area', rCm], ['Biomass', rG]].forEach(function (p) {
    var c = h('div', 'env-rd'); c.appendChild(h('span', 'lbl', p[0])); c.appendChild(p[1]); ro.appendChild(c);
  });
  rG.parentNode.classList.add('is-on');
  vl.appendChild(ro);
  var eqEl = h('p', 'hyd-eq', '');
  vl.appendChild(eqEl);
  vl.appendChild(h('p', 'exp-note', 'The pipeline steps and formulas are from the project. The plant image and the two coefficients are illustrative, because the fitted values are not published. They are scaled so a full-grown plant lands in the range the project measured: canopy 294 to 359 cm², fresh mass 7.0 to 8.4 g across six trials.'));
  vc.appendChild(vl);

  var vr = h('div', 'hyd-vr');
  var vh = h('p', 'lbl exp-k', 'Predicted growth curve');
  vh.appendChild(h('span', 'exp-pill', 'illustrative, scaled to measured'));
  vr.appendChild(vh);
  var gWrap = h('div', 'env-chart'); var gCanvas = h('canvas', null, null, { role: 'img', 'aria-label': 'Predicted biomass in grams across the 21 day growth cycle, an illustration scaled to the measured harvest range of 7.0 to 8.4 grams.' });
  gWrap.appendChild(gCanvas); vr.appendChild(gWrap);
  vc.appendChild(vr);
  vP.appendChild(vc);

  var src = document.createElement('canvas'); src.width = W; src.height = H;
  var sc = src.getContext('2d', { willReadFrequently: true });

  function growth(day) { var g = (day - 1) / 20; return g * g * (3 - 2 * g) * 0.9 + g * 0.1; }

  function drawPlant(day) {
    var r = rng(42), g = growth(day);
    var bg = sc.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, W * 0.62);
    bg.addColorStop(0, '#5a44c8'); bg.addColorStop(1, '#241a5c');
    sc.fillStyle = bg; sc.fillRect(0, 0, W, H);
    sc.fillStyle = 'rgba(210,200,255,.55)'; sc.fillRect(0, 0, W, 3); sc.fillRect(0, H - 3, W, 3);
    sc.save(); sc.translate(W / 2, H / 2);
    sc.fillStyle = '#8f88b4'; sc.fillRect(-13, -13, 26, 26);
    var n = Math.min(16, 3 + Math.round(day * 0.65));
    for (var i = 0; i < n; i++) {
      var ang = i * 2.399 + 0.4, age = 1 - i * 0.045, len = (7 + g * 50) * Math.max(0.35, age), wd = len * 0.5;
      sc.save(); sc.rotate(ang); sc.translate(len * 0.55, 0);
      var c = [52 + r() * 26, 140 + r() * 40, 96 + r() * 30];
      sc.fillStyle = 'rgb(' + c.map(Math.round).join(',') + ')';
      sc.beginPath(); sc.ellipse(0, 0, len * 0.56, wd * 0.5, 0, 0, 7); sc.fill();
      sc.strokeStyle = 'rgba(190,255,220,.55)'; sc.lineWidth = 1;
      sc.beginPath(); sc.moveTo(-len * 0.5, 0); sc.lineTo(len * 0.5, 0); sc.stroke();
      sc.restore();
    }
    sc.restore();
    for (var k = 0; k < 26; k++) { sc.fillStyle = 'rgba(110,230,160,.9)'; sc.fillRect(r() * W, r() * H, 2, 2); }
    var id = sc.getImageData(0, 0, W, H), d = id.data, nr = rng(9);
    for (var q = 0; q < d.length; q += 4) { var nz = (nr() - 0.5) * 26; d[q] += nz; d[q + 1] += nz; d[q + 2] += nz; }
    sc.putImageData(id, 0, 0);
    return sc.getImageData(0, 0, W, H);
  }
  function otsu(v) {
    var hh = new Array(256).fill(0); v.forEach(function (x) { hh[x]++; });
    var tot = v.length, sum = 0, i;
    for (i = 0; i < 256; i++) sum += i * hh[i];
    var sb = 0, wb = 0, mx = 0, th = 128;
    for (i = 0; i < 256; i++) {
      wb += hh[i]; if (!wb) continue;
      var wf = tot - wb; if (!wf) break;
      sb += i * hh[i];
      var mb = sb / wb, mf = (sum - sb) / wf, vv = wb * wf * (mb - mf) * (mb - mf);
      if (vv > mx) { mx = vv; th = i; }
    }
    return th;
  }
  function morph(m, r, dil) {
    var o = new Uint8Array(m.length);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var hit = dil ? 0 : 1;
      for (var dy = -r; dy <= r && (dil ? !hit : hit); dy++) {
        var yy = y + dy;
        if (yy < 0 || yy >= H) { if (!dil) hit = 0; continue; }
        for (var dx = -r; dx <= r; dx++) {
          var xx = x + dx, v = (xx < 0 || xx >= W) ? (dil ? 0 : 1) : m[yy * W + xx];
          if (dil) { if (v) { hit = 1; break; } } else if (!v) { hit = 0; break; }
        }
      }
      o[y * W + x] = hit;
    }
    return o;
  }
  function hsv(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    var mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn, hh = 0;
    if (d) { if (mx === r) hh = ((g - b) / d) % 6; else if (mx === g) hh = (b - r) / d + 2; else hh = (r - g) / d + 4; hh *= 60; if (hh < 0) hh += 360; }
    return [hh, mx ? d / mx : 0, mx];
  }
  function h2rgb(hh, s, v) {
    var c = v * s, x = c * (1 - Math.abs((hh / 60) % 2 - 1)), m = v - c, r = 0, g = 0, b = 0;
    if (hh < 60) { r = c; g = x; } else if (hh < 120) { r = x; g = c; } else if (hh < 180) { g = c; b = x; }
    else if (hh < 240) { g = x; b = c; } else if (hh < 300) { r = x; b = c; } else { r = c; b = x; }
    return [(r + m) * 255, (g + m) * 255, (b + m) * 255];
  }

  var ACC = (function () { var v = (getComputedStyle(document.documentElement).getPropertyValue('--acc-rgb') || '213,172,255').split(',').map(Number); return [v[0], v[1], v[2], 255]; })();                    /* the site's accent, in place of the project site's teal */

  /* the whole camera pipeline, on one frame. Returns every stage so the panel
     can draw them, and the same function measures the curve. */
  function pipeline(raw) {
    var d = raw.data, N = W * H, i;
    var ex = new Uint8Array(N), hsvRGB = new Uint8ClampedArray(N * 4), exRGB = new Uint8ClampedArray(N * 4);
    for (i = 0; i < N; i++) {
      var r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
      var hv = hsv(r, g, b), c = h2rgb(hv[0], 1, 0.35 + 0.65 * hv[2]);
      hsvRGB[i * 4] = c[0]; hsvRGB[i * 4 + 1] = c[1]; hsvRGB[i * 4 + 2] = c[2]; hsvRGB[i * 4 + 3] = 255;
      var e = Math.max(0, Math.min(255, (2 * g - r - b + 200) * 255 / 450));
      ex[i] = e;
      exRGB[i * 4] = e * 0.55; exRGB[i * 4 + 1] = e; exRGB[i * 4 + 2] = e * 0.7; exRGB[i * 4 + 3] = 255;
    }
    /* Otsu assumes two populations. On a day 1 seedling there is almost no
       plant, so it splits the noise instead. A floor under it (background sits
       near 22 on this scale, leaf near 170) keeps it on the plant. */
    var th = Math.max(otsu(ex), 96), m = new Uint8Array(N);
    for (i = 0; i < N; i++) m[i] = ex[i] > th ? 1 : 0;
    var m2 = morph(morph(m, 1, 0), 1, 1); m2 = morph(morph(m2, 3, 1), 3, 0);
    var px = 0; for (i = 0; i < N; i++) px += m2[i];
    return { hsvRGB: hsvRGB, exRGB: exRGB, m: m, m2: m2, px: px };
  }

  function runPipe(day) {
    var raw = drawPlant(day), d = raw.data, N = W * H, i;
    var P = pipeline(raw);
    cv[0].putImageData(raw, 0, 0);
    var o1 = cv[1].createImageData(W, H); o1.data.set(P.hsvRGB); cv[1].putImageData(o1, 0, 0);
    var o2 = cv[2].createImageData(W, H); o2.data.set(P.exRGB); cv[2].putImageData(o2, 0, 0);
    function showMask(ctx, mask) {
      var o = ctx.createImageData(W, H);
      for (var j = 0; j < N; j++) { var v = mask[j] ? 255 : 0; o.data.set([v, v, v, 255], j * 4); }
      ctx.putImageData(o, 0, 0);
    }
    showMask(cv[3], P.m); showMask(cv[4], P.m2);
    var m2 = P.m2, o5 = cv[5].createImageData(W, H);
    for (i = 0; i < N; i++) {
      var on = m2[i];
      var edge = on && (i % W === 0 || !m2[i - 1] || !m2[i + 1] || !m2[i - W] || !m2[i + W]);
      if (edge) o5.data.set(ACC, i * 4);
      else if (on) o5.data.set([d[i * 4] * 0.5 + 18, d[i * 4 + 1] * 0.5 + 115, d[i * 4 + 2] * 0.5 + 96, 255], i * 4);
      else o5.data.set([d[i * 4] * 0.35, d[i * 4 + 1] * 0.35, d[i * 4 + 2] * 0.35, 255], i * 4);
    }
    cv[5].putImageData(o5, 0, 0);
    var cm = P.px * CAL, gr = A * cm + B;
    rPx.innerHTML = P.px.toLocaleString() + '<small>px</small>';
    rCm.innerHTML = cm.toFixed(1) + '<small>cm²</small>';
    rG.innerHTML = gr.toFixed(1) + '<small>g</small>';
    dayLbl.textContent = 'Day ' + day;
    dayEl.setAttribute('aria-valuetext', 'Day ' + day + ', about ' + gr.toFixed(1) + ' grams');
    eqEl.innerHTML = 'ExG = 2G − R − B<br>Area (cm²) = pixels × ' + CAL.toFixed(4) + '<br>Biomass (g) = ' + A.toFixed(4) + ' · Area + ' + B;
    drawGrowth(day);
  }

  /* the curve is the pipeline's own measurement of every day, in turn, so the
     marker on it always agrees with the readout above. Day 21 goes first
     because it sets the pixel-to-cm² scale. */
  function measureSeries(done) {
    var out = new Array(22), order = [21]; for (var d = 1; d <= 20; d++) order.push(d);
    var k = 0;
    (function step() {
      var day = order[k++];
      out[day] = pipeline(drawPlant(day)).px;
      if (day === 21) { CAL = TARGET_AREA / Math.max(1, out[21]); }
      if (k < order.length) setTimeout(step, 0); else { pxByDay = out; done(); }
    })();
  }

  function setupCanvas(c, hgt) {
    var dpr = Math.min(window.devicePixelRatio || 1, 2), r = c.parentNode.getBoundingClientRect(), w = Math.max(240, r.width);
    c.width = w * dpr; c.height = hgt * dpr; c.style.width = w + 'px'; c.style.height = hgt + 'px';
    var x = c.getContext('2d'); x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, w, hgt);
    return [x, w, hgt];
  }
  var MUT = '#8D8980', GRID = 'rgba(237,235,230,.09)', LIL = (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#D5ACFF').trim(), GOLD = '#D8BC6A';

  function massAt(day) { return A * (pxByDay[day] * CAL) + B; }
  mount.__vision = { massAt: function (d) { return pxByDay ? massAt(d) : null; }, px: function (d) { return pxByDay ? pxByDay[d] : null; } };   /* read by the tests */

  function drawGrowth(day) {
    if (vP.hidden || !pxByDay) return;
    var s = setupCanvas(gCanvas, 210), x = s[0], w = s[1], hgt = s[2];
    var P = { l: 42, r: 84, t: 12, b: 30 }, pw = w - P.l - P.r, ph = hgt - P.t - P.b;
    x.font = '10px "JetBrains Mono", monospace'; x.textBaseline = 'middle';
    var ymax = 10, yOf = function (g) { return P.t + ph - ph * g / ymax; }, xOf = function (dd) { return P.l + pw * (dd - 1) / 20; };
    for (var i = 0; i <= 5; i++) {
      var g2 = ymax * i / 5, yy = yOf(g2);
      x.strokeStyle = GRID; x.beginPath(); x.moveTo(P.l, yy); x.lineTo(w - P.r, yy); x.stroke();
      x.fillStyle = MUT; x.textAlign = 'right'; x.fillText(g2.toFixed(0) + ' g', P.l - 6, yy);
    }
    x.textAlign = 'center';
    [1, 7, 14, 21].forEach(function (dd) { x.fillStyle = MUT; x.fillText('d' + dd, xOf(dd), hgt - 12); });

    /* what was actually measured at harvest: six fresh masses, 7.0 to 8.4 g */
    var by0 = yOf(MEAS.massHi), by1 = yOf(MEAS.massLo);
    x.fillStyle = 'rgba(216,188,106,.16)'; x.fillRect(xOf(21) - 12, by0, 12, by1 - by0);
    x.strokeStyle = GOLD; x.lineWidth = 1.2; x.beginPath();
    x.moveTo(xOf(21) + 6, by0); x.lineTo(xOf(21) + 12, by0); x.lineTo(xOf(21) + 12, by1); x.lineTo(xOf(21) + 6, by1); x.stroke();
    x.fillStyle = GOLD; x.textAlign = 'left';
    x.fillText('measured', xOf(21) + 18, (by0 + by1) / 2 - 7); x.fillText('7.0–8.4 g', xOf(21) + 18, (by0 + by1) / 2 + 7);

    x.beginPath();
    for (var dd = 1; dd <= 21; dd++) { var px2 = xOf(dd), py = yOf(massAt(dd)); dd === 1 ? x.moveTo(px2, py) : x.lineTo(px2, py); }
    x.strokeStyle = LIL; x.lineWidth = 2.5; x.lineJoin = 'round'; x.stroke();
    x.lineTo(xOf(21), P.t + ph); x.lineTo(xOf(1), P.t + ph);
    var gr = x.createLinearGradient(0, P.t, 0, P.t + ph); gr.addColorStop(0, 'rgba(' + ACC.slice(0, 3).join(',') + ',.28)'); gr.addColorStop(1, 'rgba(' + ACC.slice(0, 3).join(',') + ',0)');
    x.fillStyle = gr; x.fill();
    var mx = xOf(day), my = yOf(massAt(day));
    x.strokeStyle = 'rgba(237,235,230,.5)'; x.setLineDash([4, 4]); x.lineWidth = 1;
    x.beginPath(); x.moveTo(mx, P.t); x.lineTo(mx, P.t + ph); x.stroke(); x.setLineDash([]);
    x.fillStyle = '#fff'; x.beginPath(); x.arc(mx, my, 5, 0, 7); x.fill(); x.strokeStyle = LIL; x.lineWidth = 2; x.stroke();
  }

  var renderDay = 12, pending = false;
  function schedule(d) { renderDay = d; if (pending) return; pending = true; requestAnimationFrame(function () { pending = false; runPipe(renderDay); }); }
  function startVision() {
    measureSeries(function () { runPipe(+dayEl.value); });
    runPipe(+dayEl.value);            /* provisional: fills the six frames at once, the curve follows */
  }
  dayEl.addEventListener('input', function () { schedule(+dayEl.value); });

  var playing = false, pt = 0;
  playV.addEventListener('click', function () {
    playing = !playing;
    playV.querySelector('.pp').setAttribute('d', playing ? 'M2 1.5h3.5v11H2zM8.5 1.5H12v11H8.5z' : 'M3 1.5v11l9-5.5z');
    playV.setAttribute('aria-label', playing ? 'Pause' : 'Play the growth cycle');
    clearInterval(pt);
    if (!playing) return;
    if (+dayEl.value >= 21) dayEl.value = 1;
    pt = setInterval(function () {
      var v = +dayEl.value + 1;
      if (v > 21) { playing = false; clearInterval(pt); playV.querySelector('.pp').setAttribute('d', 'M3 1.5v11l9-5.5z'); return; }
      dayEl.value = v; schedule(v);
    }, 520);
  });
  if (reduce) playV.hidden = true;

  /* --------------------------------------------------------------- 3 results */
  var rP = panel.results;
  rP.appendChild(h('p', 'hyd-lead',
    'Six independent growth cycles, one model, a mean error of 6.9%. The chamber held temperature and humidity steady enough for the camera to trust its own numbers.'));

  var rGrid = h('div', 'hyd-rgrid');
  var mCard = h('div', 'hyd-card');
  var mh = h('p', 'lbl exp-k', 'Prediction error by trial · MAPE %');
  mCard.appendChild(mh);
  var mWrap = h('div', 'env-chart'); var mCanvas = h('canvas', null, null, { role: 'img', 'aria-label': 'Prediction error for each of six trials: 5.1, 7.6, 7.8, 6.6, 6.6 and 7.6 percent, against a 15 percent target.' });
  mWrap.appendChild(mCanvas); mCard.appendChild(mWrap);
  mCard.appendChild(h('p', 'exp-note', 'Trial errors are the board’s own. Dashed gold is the 15% target; the dotted line is the 6.9% mean.'));
  rGrid.appendChild(mCard);

  var tCard = h('div', 'hyd-card');
  tCard.appendChild(h('p', 'lbl exp-k', 'Design targets vs results'));
  var MET = [
    ['Biomass prediction error', 'target < 15% MAPE', '6.9%', 6.9 / 20, 15 / 20],
    ['Linear fit, canopy to mass', 'target R² > 0.90', '0.91', 0.91, 0.9],
    ['Independent growth trials', 'target ≥ 4 trials', '6', 6 / 8, 4 / 8],
    ['Climate held over monitoring', '±3 °C and ±6 %RH over 72 h', '72 h', 1, null],
    ['Manual biomass measurement', 'target: none during growth', 'none', 1, null]
  ];
  var meters = h('div', 'hyd-meters');
  MET.forEach(function (m) {
    var row = h('div', 'hyd-meter');
    row.appendChild(h('div', 'hyd-mn', m[0] + '<small>' + m[1] + '</small>'));
    var bar = h('div', 'hyd-bar'); var fill = h('i'); fill.style.width = (m[3] * 100) + '%'; bar.appendChild(fill);
    if (m[4] != null) { var mk = h('u'); mk.style.left = (m[4] * 100) + '%'; bar.appendChild(mk); }
    row.appendChild(bar); row.appendChild(h('b', 'num', m[2]));
    meters.appendChild(row);
  });
  tCard.appendChild(meters);
  rGrid.appendChild(tCard);
  rP.appendChild(rGrid);

  var cols = h('div', 'hyd-cols');
  [['What it proves', ['Non-destructive biomass estimation in controlled environments', 'No destructive harvest needed during growth monitoring', 'A base for autonomous agricultural systems', 'Embedded systems, computer vision and predictive modeling in one framework']],
   ['Where it stops', ['Assumes constant lighting and fixed camera geometry', 'Leaf overlap adds segmentation uncertainty', 'Biomass depends on leaf density and water content', 'Small dataset: n = 6 trials', 'Error sources: edge segmentation, calibration sensitivity, small environmental swings, VOC and CO₂ sensor noise']],
   ['Where it can go', ['Space-based agriculture (CELSS systems)', 'Autonomous greenhouse optimization', 'Precision agriculture monitoring', 'Resource-constrained environments']]
  ].forEach(function (c) {
    var box = h('div', 'hyd-card'); box.appendChild(h('p', 'lbl exp-k', c[0]));
    var ul = h('ul', 'hyd-ul'); c[1].forEach(function (x) { ul.appendChild(h('li', null, x)); });
    box.appendChild(ul); cols.appendChild(box);
  });
  rP.appendChild(cols);

  function drawMape() {
    if (rP.hidden) return;
    var s = setupCanvas(mCanvas, 220), x = s[0], w = s[1], hgt = s[2];
    var P = { l: 34, r: 12, t: 14, b: 30 }, pw = w - P.l - P.r, ph = hgt - P.t - P.b;
    var v = [5.1, 7.6, 7.8, 6.6, 6.6, 7.6], bw = pw / 6, top = 16;
    x.font = '10px "JetBrains Mono", monospace'; x.textBaseline = 'middle';
    for (var i = 0; i <= 4; i++) {
      var yy = P.t + ph - ph * i / 4;
      x.strokeStyle = GRID; x.beginPath(); x.moveTo(P.l, yy); x.lineTo(w - P.r, yy); x.stroke();
      x.fillStyle = MUT; x.textAlign = 'right'; x.fillText((top * i / 4).toFixed(0), P.l - 6, yy);
    }
    v.forEach(function (m, k) {
      var bh = ph * m / top, bx = P.l + bw * k + bw * 0.18, by = P.t + ph - bh;
      var g = x.createLinearGradient(0, by, 0, by + bh); g.addColorStop(0, LIL); g.addColorStop(1, '#4A7A3A');
      x.fillStyle = g; x.beginPath();
      if (x.roundRect) x.roundRect(bx, by, bw * 0.64, bh, [5, 5, 0, 0]); else x.rect(bx, by, bw * 0.64, bh);
      x.fill();
      x.fillStyle = '#EDEBE6'; x.textAlign = 'center'; x.fillText(m.toFixed(1), bx + bw * 0.32, by - 9);
      x.fillStyle = MUT; x.fillText('T' + (k + 1), bx + bw * 0.32, hgt - P.b + 16);
    });
    var ty = P.t + ph - ph * 15 / top;
    x.strokeStyle = GOLD; x.setLineDash([5, 4]); x.beginPath(); x.moveTo(P.l, ty); x.lineTo(w - P.r, ty); x.stroke(); x.setLineDash([]);
    x.fillStyle = GOLD; x.textAlign = 'right'; x.fillText('target 15%', w - P.r, ty - 8);
    var my = P.t + ph - ph * 6.88 / top;
    x.strokeStyle = 'rgba(237,235,230,.5)'; x.setLineDash([2, 4]); x.beginPath(); x.moveTo(P.l, my); x.lineTo(w - P.r, my); x.stroke(); x.setLineDash([]);
  }

  /* ------------------------------------------------------------------ 4 why */
  var yP = panel.why;
  yP.appendChild(h('p', 'hyd-lead',
    'Each choice went through a weighted decision matrix: options scored against criteria that were themselves weighted. These are the outcomes.'));
  var DEC = [
    { t: 'Control board', win: 'Teensy 4', vs: ['ESP32', 'Arduino Uno'], crit: ['Compute', 'I/O and sensors', 'Wireless', 'Ecosystem', 'Cost and power'], why: 'Teensy 4 won on overall balance of compute, sensor I/O and cost.' },
    { t: 'Nutrient', win: 'Miracle-Gro', vs: ['3-part hydroponic', 'Salt-based formula'], crit: ['Growth', 'Ease and simplicity', 'Cost and availability', 'Reproducibility'], why: 'Miracle-Gro scored highest because it is simple, cheap and easy to source and repeat.' },
    { t: 'Lighting', win: 'Blurple', vs: ['Blue-heavy', 'White full spectrum', 'Tunable'], crit: ['Growth', 'CV stability', 'Thermal and energy', 'Cost and simplicity'], why: 'A fixed blurple spectrum gave top growth and the most stable computer-vision results.' }
  ];
  var dGrid = h('div', 'hyd-dgrid');
  DEC.forEach(function (d) {
    var c = h('div', 'hyd-card');
    c.appendChild(h('p', 'lbl exp-k', d.t));
    c.appendChild(h('p', 'hyd-win', d.win + ' <span aria-hidden="true">✓</span>'));
    c.appendChild(h('p', 'hyd-vs', 'over ' + d.vs.join(', ')));
    c.appendChild(h('p', 'lbl hyd-cl', 'Scored on'));
    var ul = h('ul', 'hyd-crit'); d.crit.forEach(function (x) { ul.appendChild(h('li', 'tag tag-dk', x)); });
    c.appendChild(ul);
    c.appendChild(h('p', 'hyd-why', d.why));
    dGrid.appendChild(c);
  });
  yP.appendChild(dGrid);

  /* ---------------------------------------------------------------- go */
  show('chamber', false);
  var rt = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { drawMape(); drawGrowth(+dayEl.value); }, 150); });
})();
