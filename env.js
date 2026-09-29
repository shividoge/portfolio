/* ===========================================================================
   The board, wire by wire.  (Environmental Monitoring PCB row)

   What the board is and what it saw, taken from the project's own site
   (shividoge.github.io/hydroponics-growth-system):

     · the wiring: a Teensy 4 and a BME680 on one shared I²C bus at 3.3 V,
       SDA on pin 18 and SCL on pin 19;
     · the four things the sensor reports: temperature, humidity, equivalent
       CO₂ and VOC;
     · the recorded ranges over a 72 hour log.

   The curves are reconstructed. The project recorded ranges, and the curve
   generator below is the one from that site: seeded, so it draws the same
   curves every time, and clamped to the recorded ranges. The panel says
   "reconstructed" next to every chart rather than pass it off as a raw log.
   =========================================================================== */
(function () {
  'use strict';

  var mount = document.getElementById('envMount');
  if (!mount) return;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------------------------------------------------------- data */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function smooth(n, r, s) { var a = [], v = 0; for (var i = 0; i < n; i++) { v = v * s + (r() - 0.5) * (1 - s) * 2; a.push(v); } return a; }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }

  /* 72 h at 15 minute steps, exactly as the project's site generates it */
  var NP = 289;
  var rr = rng(11), n1 = smooth(NP, rr, 0.8), n2 = smooth(NP, rr, 0.8);
  var DATA = { temp: [], rh: [], co2: [], tvoc: [] };
  for (var i = 0; i < NP; i++) {
    var t = i / 4, ph = Math.sin(t / 22 * Math.PI * 2 + 0.6), saw = (t % 22) / 22;
    DATA.temp.push(clamp(27.9 + 2.1 * ph + n1[i] * 1.5 - (saw > 0.92 ? 1.5 : 0), 24.3, 31.7));
    DATA.rh.push(clamp(46 - 2.6 * ph + n2[i] * 2.6, 40, 52));
    var sp = rr() > 0.965 ? rr() * 110 : 0;
    DATA.tvoc.push(clamp(62 + n1[i] * 38 + sp + n2[i] * 20, 30, 230));
    DATA.co2.push(clamp(470 + n2[i] * 140 + (rr() > 0.96 ? rr() * 190 : 0) + ph * 20, 400, 750));
  }

  var CH = {
    temp: { name: 'Temperature', unit: '°C',  min: 24,  max: 32,  dec: 1, range: '24 to 32 °C',    note: 'Held within about ±3 °C.' },
    rh:   { name: 'Humidity',    unit: '% RH', min: 40,  max: 52,  dec: 0, range: '40 to 52 % RH',  note: 'Held within about ±6 % RH.' },
    co2:  { name: 'eCO₂',        unit: 'ppm',  min: 400, max: 750, dec: 0, range: '400 to 750 ppm', note: 'Transient peaks that fall back.' },
    tvoc: { name: 'TVOC',        unit: 'ppb',  min: 30,  max: 230, dec: 0, range: '30 to 230 ppb',  note: 'Did not accumulate.' }
  };
  var CH_ORDER = ['temp', 'rh', 'co2', 'tvoc'];

  /* -------------------------------------------------------- the wiring */
  var ACCENT = (getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#D5ACFF').trim();
  var ACC_RGB = (getComputedStyle(document.documentElement).getPropertyValue('--acc-rgb') || '213,172,255').trim();
  var WIRE_COL = { v33: '#D8BC6A', scl: '#EDEBE6', sda: ACCENT, gnd: '#77746C' };
  var PARTS = {
    v33: { name: '3.3 V to VIN', d: 'Powers the BME680 from the Teensy’s 3.3 V rail, the same level as the I²C logic, so nothing on the bus needs level shifting.' },
    gnd: { name: 'GND to GND',   d: 'A common ground shared by the controller and the sensor. Without it the two boards have no shared reference for the signals.' },
    sda: { name: 'SDA, Teensy pin 18', d: 'The bidirectional data line. Everything the sensor reports (temperature, humidity, eCO₂ and VOC) travels back to the Teensy on this wire.' },
    scl: { name: 'SCL, Teensy pin 19', d: 'The clock line. The Teensy drives it and the BME680 answers on the data line in step with it.' },
    teensy: { name: 'Teensy 4', d: 'Central control. It reads the sensor over I²C and logs the four channels. It was chosen over an ESP32 and an Arduino Uno by a weighted decision matrix.' },
    bme: { name: 'BME680', d: 'One sensor, four readings: temperature, relative humidity, equivalent CO₂ and VOC. It shares the bus at 3.3 V logic.' }
  };
  var WIRE_ORDER = ['v33', 'scl', 'sda', 'gnd', 'teensy', 'bme'];

  /* ------------------------------------------------------------ helpers */
  var NS = 'http://www.w3.org/2000/svg';
  function h(tag, cls, html, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function s(tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  function fmt(ch, v) { return v.toFixed(CH[ch].dec); }

  /* ------------------------------------------------------------- markup */
  var root = h('div', 'exp env');

  var head = h('div', 'exp-head');
  head.appendChild(h('div', null,
    '<p class="lbl exp-k">Explorer / the board</p>' +
    '<p class="exp-h">Teensy 4 to BME680, wire by wire</p>'));
  head.appendChild(h('p', 'exp-sub',
    'Pin numbers and ranges are from the project. Select a wire or a part, then scrub the 72 hours the board logged.'));
  root.appendChild(head);

  var body = h('div', 'env-body');

  /* left: the schematic */
  var left = h('div', 'env-left');
  var svg = s('svg', { viewBox: '0 0 640 330', class: 'env-svg', role: 'img',
    'aria-label': 'Schematic: a Teensy 4 connected to a BME680 by four wires, 3.3 volts, SCL on pin 19, SDA on pin 18, and ground.' });

  function block(key, x, y, w, hgt, title, sub) {
    var g = s('g', { 'data-k': key, class: 'env-blk' });
    g.appendChild(s('rect', { x: x, y: y, width: w, height: hgt, rx: 10, class: 'env-rect' }));
    g.appendChild(s('text', { x: x + w / 2, y: y + 34, 'text-anchor': 'middle', class: 'env-t1' }, title));
    g.appendChild(s('text', { x: x + w / 2, y: y + 54, 'text-anchor': 'middle', class: 'env-t2' }, sub));
    return g;
  }
  var gT = block('teensy', 24, 34, 176, 250, 'Teensy 4', 'central control');
  var gB = block('bme', 440, 34, 176, 250, 'BME680', 'temp · RH · eCO₂ · VOC');
  svg.appendChild(gT); svg.appendChild(gB);

  var ROWS = [
    { k: 'v33', y: 110, l: '3.3 V', r: 'VIN' },
    { k: 'scl', y: 160, l: 'SCL 19', r: 'SCL' },
    { k: 'sda', y: 210, l: 'SDA 18', r: 'SDA' },
    { k: 'gnd', y: 260, l: 'GND', r: 'GND' }
  ];
  var wireEls = {};
  ROWS.forEach(function (rw) {
    var col = WIRE_COL[rw.k];
    gT.appendChild(s('text', { x: 186, y: rw.y + 4, 'text-anchor': 'end', class: 'env-pin' }, rw.l));
    gB.appendChild(s('text', { x: 454, y: rw.y + 4, class: 'env-pin' }, rw.r));
    var g = s('g', { 'data-k': rw.k, class: 'env-wire' });
    g.appendChild(s('path', { d: 'M200 ' + rw.y + 'H440', class: 'env-hit' }));
    g.appendChild(s('path', { d: 'M200 ' + rw.y + 'H440', class: 'env-line', stroke: col }));
    g.appendChild(s('path', { d: 'M200 ' + rw.y + 'H440', class: 'env-flow', stroke: col }));
    g.appendChild(s('circle', { cx: 200, cy: rw.y, r: 4.5, fill: col }));
    g.appendChild(s('circle', { cx: 440, cy: rw.y, r: 4.5, fill: col }));
    svg.appendChild(g);
    wireEls[rw.k] = g;
  });
  svg.appendChild(s('text', { x: 320, y: 306, 'text-anchor': 'middle', class: 'env-cap' }, 'I²C · 3.3 V logic · one shared bus'));
  left.appendChild(svg);

  /* keyboard and touch route to the same parts */
  var chips = h('div', 'exp-chips', null, { role: 'group', 'aria-label': 'Parts of the board' });
  var chipEls = {};
  WIRE_ORDER.forEach(function (k) {
    var b = h('button', 'exp-chip wipe', '', { type: 'button', 'aria-pressed': 'false', 'data-k': k });
    if (WIRE_COL[k]) b.appendChild(h('i', 'exp-sw')), b.firstChild.style.background = WIRE_COL[k];
    b.appendChild(document.createTextNode(k === 'v33' ? '3.3 V' : k === 'scl' ? 'SCL' : k === 'sda' ? 'SDA' : k === 'gnd' ? 'GND' : PARTS[k].name));
    chips.appendChild(b); chipEls[k] = b;
  });
  left.appendChild(chips);

  var insp = h('div', 'env-insp', null, { 'aria-live': 'polite' });
  left.appendChild(insp);
  left.appendChild(h('p', 'exp-note',
    'Signal integrity on the shared 3.3 V bus was verified by hand with a multimeter.'));
  body.appendChild(left);

  /* right: what it recorded */
  var right = h('div', 'env-right');
  var rh = h('div', 'env-rhead');
  rh.appendChild(h('p', 'lbl exp-k', '72 hour log'));
  rh.appendChild(h('span', 'exp-pill', 'reconstructed to the recorded ranges'));
  right.appendChild(rh);

  var tabs = h('div', 'exp-chips', null, { role: 'group', 'aria-label': 'Channel' });
  var tabEls = {};
  CH_ORDER.forEach(function (k) {
    var b = h('button', 'exp-chip wipe', CH[k].name, { type: 'button', 'aria-pressed': 'false', 'data-ch': k });
    tabs.appendChild(b); tabEls[k] = b;
  });
  right.appendChild(tabs);

  var chartWrap = h('div', 'env-chart');
  var canvas = h('canvas', null, null, { role: 'img' });
  chartWrap.appendChild(canvas);
  right.appendChild(chartWrap);

  var rd = h('div', 'env-read');
  var rdEls = {};
  CH_ORDER.forEach(function (k) {
    var c = h('div', 'env-rd');
    c.appendChild(h('span', 'lbl', CH[k].name));
    var b = h('b', 'num'); c.appendChild(b);
    var u = h('small', null, CH[k].unit); c.appendChild(u);
    rd.appendChild(c); rdEls[k] = { box: c, b: b };
  });
  right.appendChild(rd);

  var ctl = h('div', 'env-ctl');
  var play = h('button', 'env-play', '', { type: 'button', 'aria-label': 'Play the 72 hours' });
  play.innerHTML = '<svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path class="pp" d="M3 1.5v11l9-5.5z" fill="currentColor"/></svg>';
  ctl.appendChild(play);
  var slider = h('input', 'exp-range', null, { type: 'range', min: 0, max: NP - 1, value: 132, 'aria-label': 'Time into the 72 hour log' });
  ctl.appendChild(slider);
  var clock = h('span', 'num env-clock', '');
  ctl.appendChild(clock);
  right.appendChild(ctl);

  right.appendChild(h('p', 'exp-note', 'Ranges recorded on the chamber. The curves are drawn to match them; they are not a raw export.'));
  body.appendChild(right);
  root.appendChild(body);
  mount.appendChild(root);

  /* ---------------------------------------------------------- selecting */
  var selPart = 'sda', selCh = 'temp';

  function pickPart(k) {
    selPart = k;
    WIRE_ORDER.forEach(function (x) { chipEls[x].setAttribute('aria-pressed', x === k ? 'true' : 'false'); });
    Object.keys(wireEls).forEach(function (x) { wireEls[x].classList.toggle('is-on', x === k); });
    gT.classList.toggle('is-on', k === 'teensy'); gB.classList.toggle('is-on', k === 'bme');
    insp.innerHTML = '';
    var t = h('p', 'env-it', PARTS[k].name);
    if (WIRE_COL[k]) t.style.color = WIRE_COL[k];
    insp.appendChild(t);
    insp.appendChild(h('p', 'env-id', PARTS[k].d));
    /* the sensor's own part is the natural way into the data */
    if (k === 'bme') pickChannel(selCh);
  }

  function pickChannel(k) {
    selCh = k;
    CH_ORDER.forEach(function (x) {
      tabEls[x].setAttribute('aria-pressed', x === k ? 'true' : 'false');
      rdEls[x].box.classList.toggle('is-on', x === k);
    });
    draw();
  }

  svg.addEventListener('click', function (e) {
    var n = e.target.closest('[data-k]'); if (n) pickPart(n.getAttribute('data-k'));
  });
  chips.addEventListener('click', function (e) {
    var b = e.target.closest('.exp-chip'); if (b) pickPart(b.getAttribute('data-k'));
  });
  tabs.addEventListener('click', function (e) {
    var b = e.target.closest('.exp-chip'); if (b) pickChannel(b.getAttribute('data-ch'));
  });

  /* -------------------------------------------------------------- chart */
  var idx = +slider.value;

  function draw() {
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = chartWrap.getBoundingClientRect();
    var w = Math.max(240, r.width), hgt = 190;
    canvas.width = w * dpr; canvas.height = hgt * dpr;
    canvas.style.width = w + 'px'; canvas.style.height = hgt + 'px';
    var x = canvas.getContext('2d');
    x.setTransform(dpr, 0, 0, dpr, 0, 0);
    x.clearRect(0, 0, w, hgt);

    var c = CH[selCh], d = DATA[selCh];
    var P = { l: 44, r: 12, t: 12, b: 26 }, pw = w - P.l - P.r, ph = hgt - P.t - P.b;
    var lo = c.min, hi = c.max, span = hi - lo;
    var yOf = function (v) { return P.t + ph - ph * (v - lo) / span; };
    var xOf = function (i2) { return P.l + pw * i2 / (NP - 1); };

    x.font = '10px "JetBrains Mono", monospace'; x.textBaseline = 'middle';
    for (var g = 0; g <= 4; g++) {
      var yy = P.t + ph - ph * g / 4;
      x.strokeStyle = 'rgba(237,235,230,.09)'; x.lineWidth = 1;
      x.beginPath(); x.moveTo(P.l, yy); x.lineTo(w - P.r, yy); x.stroke();
      x.fillStyle = '#8D8980'; x.textAlign = 'right';
      x.fillText((lo + span * g / 4).toFixed(c.dec === 1 ? 0 : 0), P.l - 7, yy);
    }
    x.textAlign = 'center';
    [0, 12, 24, 36, 48, 60, 72].forEach(function (hh) { x.fillStyle = '#8D8980'; x.fillText(hh + 'h', P.l + pw * hh / 72, hgt - 10); });

    /* the recorded min to max of this run, as a band */
    var mn = Math.min.apply(null, d), mx = Math.max.apply(null, d);
    x.fillStyle = 'rgba(' + ACC_RGB + ',.07)';
    x.fillRect(P.l, yOf(mx), pw, yOf(mn) - yOf(mx));

    x.beginPath();
    d.forEach(function (v, k) { var px = xOf(k), py = yOf(v); k ? x.lineTo(px, py) : x.moveTo(px, py); });
    x.strokeStyle = ACCENT; x.lineWidth = 1.7; x.lineJoin = 'round'; x.stroke();

    /* the point being read */
    var cx = xOf(idx), cy = yOf(d[idx]);
    x.strokeStyle = 'rgba(237,235,230,.5)'; x.setLineDash([3, 4]); x.lineWidth = 1;
    x.beginPath(); x.moveTo(cx, P.t); x.lineTo(cx, P.t + ph); x.stroke(); x.setLineDash([]);
    x.fillStyle = '#EDEBE6'; x.beginPath(); x.arc(cx, cy, 4.5, 0, 7); x.fill();
    x.strokeStyle = ACCENT; x.lineWidth = 2; x.stroke();

    canvas.setAttribute('aria-label', c.name + ' over 72 hours, recorded range ' + c.range + '. ' + c.note);
  }

  function readout() {
    var hr = idx / 4;
    var hh = Math.floor(hr), mm = Math.round((hr - hh) * 60);
    clock.textContent = 't = ' + hh + ' h' + (mm ? ' ' + mm + ' min' : '');
    CH_ORDER.forEach(function (k) { rdEls[k].b.textContent = fmt(k, DATA[k][idx]); });
    slider.setAttribute('aria-valuetext', clock.textContent + '. ' + CH_ORDER.map(function (k) { return CH[k].name + ' ' + fmt(k, DATA[k][idx]) + ' ' + CH[k].unit; }).join(', '));
  }

  slider.addEventListener('input', function () { idx = +slider.value; readout(); draw(); });

  var timer = 0, playing = false;
  function setPlay(on) {
    playing = on; clearInterval(timer);
    play.setAttribute('aria-label', on ? 'Pause' : 'Play the 72 hours');
    play.querySelector('.pp').setAttribute('d', on ? 'M2 1.5h3.5v11H2zM8.5 1.5H12v11H8.5z' : 'M3 1.5v11l9-5.5z');
    if (!on) return;
    if (idx >= NP - 1) idx = 0;
    timer = setInterval(function () {
      idx += 2;
      if (idx >= NP - 1) { idx = NP - 1; setPlay(false); }
      slider.value = idx; readout(); draw();
    }, 60);
  }
  play.addEventListener('click', function () { setPlay(!playing); });
  if (reduce) play.hidden = true;

  /* draw when it becomes visible, and stop the playback when it leaves */
  if (window.IntersectionObserver) {
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { draw(); } else if (playing) setPlay(false);
    }, { threshold: 0.05 }).observe(root);
  }
  var rt = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(draw, 150); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);

  pickPart('sda');
  pickChannel('temp');
  readout();
  draw();
})();
