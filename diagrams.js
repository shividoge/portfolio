/* ===========================================================================
   The project diagrams. Each is a schematic drawn in SVG from the project's
   own description, animated with flowing dashes; none of them is data, and
   each page's caption says so.
   =========================================================================== */
(function () {
  'use strict';
  var NS = 'http://www.w3.org/2000/svg';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  function S(tag, attrs, parent, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  function root(w, h, label) {
    var s = S('svg', { viewBox: '0 0 ' + w + ' ' + h, role: 'img', 'aria-label': label });
    return s;
  }
  function box(p, x, y, w, h, title, sub, cls) {
    var g = S('g', { 'class': 'dg-node ' + (cls || '') }, p);
    S('rect', { x: x, y: y, width: w, height: h, rx: 12 }, g);
    S('text', { x: x + w / 2, y: y + h / 2 + (sub ? -4 : 5), 'text-anchor': 'middle', 'class': 'dg-txt t-b' }, g, title);
    if (sub) S('text', { x: x + w / 2, y: y + h / 2 + 15, 'text-anchor': 'middle', 'class': 'dg-sub' }, g, sub);
    return g;
  }
  function link(p, d, cls) {
    S('path', { d: d, 'class': 'dg-link' }, p);
    if (cls) return S('path', { d: d, 'class': 'dg-flow ' + cls }, p);
  }
  function tag(p, x, y, text, anchor) { return S('text', { x: x, y: y, 'class': 'dg-sub', 'text-anchor': anchor || 'start' }, p, text); }

  /* dots that travel along paths, for the pathway diagram */
  function runDots(svg, paths, n, seed) {
    var dots = [], s = seed || 1;
    function r() { s = (s * 16807) % 2147483647; return s / 2147483647; }
    var lens = paths.map(function (p) { return p.getTotalLength(); });
    for (var i = 0; i < n; i++) {
      var k = i % paths.length;
      dots.push({ el: S('circle', { r: 3.2, 'class': 'dg-dot' }, svg), k: k, u: r(), v: 0.05 + r() * 0.05 });
    }
    var vis = true, raf = 0, last = 0;
    function place(d) {
      var pt = paths[d.k].getPointAtLength(d.u * lens[d.k]);
      d.el.setAttribute('cx', pt.x); d.el.setAttribute('cy', pt.y);
      d.el.setAttribute('opacity', Math.sin(d.u * Math.PI).toFixed(2));
    }
    function tick(now) {
      raf = 0; var dt = last ? Math.min(0.05, (now - last) / 1000) : 0; last = now;
      dots.forEach(function (d) { d.u += d.v * dt * 1.6; if (d.u > 1) d.u -= 1; place(d); });
      if (vis && !reduce) raf = requestAnimationFrame(tick);
    }
    dots.forEach(place);
    if (!reduce && window.IntersectionObserver) new IntersectionObserver(function (es) {
      vis = es[0].isIntersecting; if (vis && !raf) { last = 0; raf = requestAnimationFrame(tick); }
    }).observe(svg);
  }

  var D = {};

  /* ------------------------------------------------------------ FPGA CPU */
  D.nearSensor = function () {
    var s = root(1000, 400, 'Two ways to run inference: send the data to distant compute, or put the compute beside the sensor');
    tag(s, 30, 34, 'DATA TO THE COMPUTE');
    box(s, 30, 60, 170, 80, 'Sensor', 'image or signal');
    box(s, 780, 60, 190, 80, 'Distant compute', 'inference happens here', 'is-dash');
    link(s, 'M200 100 H780', '');
    S('path', { d: 'M200 100 H780', 'class': 'dg-flow', 'stroke-dasharray': '2 24' }, s);
    tag(s, 490, 88, 'long trip, every frame', 'middle');

    tag(s, 30, 228, 'COMPUTE TO THE DATA');
    box(s, 30, 254, 170, 80, 'Sensor', 'image or signal');
    box(s, 250, 254, 220, 80, 'Accelerator on the FPGA', 'quantized NN', 'is-hot');
    link(s, 'M200 294 H250', 's2');
    S('path', { d: 'M470 294 H780', 'class': 'dg-link' }, s);
    S('path', { d: 'M470 294 H780', 'class': 'dg-flow s2', 'stroke-dasharray': '1 40' }, s);
    box(s, 780, 254, 190, 80, 'Decision', 'a small result leaves', '');
    tag(s, 30, 372, 'Only the result travels; the raw data stays where it was sensed.');
    return s;
  };

  /* ---------------------------------------------------------- robot PCB */
  D.robotBoard = function () {
    var s = root(1000, 460, 'Block diagram of the robot board: power distribution feeding three subsystems, and a signal architecture linking them to the software subteam’s compute');
    S('rect', { x: 210, y: 16, width: 572, height: 428, rx: 22, fill: 'none', stroke: 'var(--pa)', 'stroke-width': 1.5, 'stroke-dasharray': '6 7', opacity: .55 }, s);
    tag(s, 232, 44, 'THE BOARD  ·  ONE PCB');
    box(s, 20, 178, 150, 70, 'Robot power', 'source');
    box(s, 236, 170, 200, 100, 'Power distribution', 'protect · regulate · route', 'is-hot');
    box(s, 470, 60, 210, 64, 'Signal architecture', 'buses · I/O');
    box(s, 470, 350, 210, 64, 'Compute', 'software subteam', 'is-dash');
    box(s, 790, 40, 190, 80, 'Autonomous', 'navigation');
    box(s, 790, 190, 190, 80, 'Computer', 'vision');
    box(s, 790, 340, 190, 80, 'Movement', 'speed optimisation');
    link(s, 'M170 213 H236', ''); S('path', { d: 'M170 213 H236', 'class': 'dg-flow' }, s);
    link(s, 'M436 220 H735 M735 60 V340 M735 60 H790 M735 200 H790 M735 340 H790', ''); S('path', { d: 'M436 220 H735 M735 60 V340 M735 60 H790 M735 200 H790 M735 340 H790', 'class': 'dg-flow' }, s);
    link(s, 'M680 92 H762 M762 100 V380 M762 100 H790 M762 240 H790 M762 380 H790', ''); S('path', { d: 'M680 92 H762 M762 100 V380 M762 100 H790 M762 240 H790 M762 380 H790', 'class': 'dg-flow s2' }, s);
    link(s, 'M575 350 V124', ''); S('path', { d: 'M575 350 V124', 'class': 'dg-flow s2 rev' }, s);
    S('circle', { cx: 300, cy: 322, r: 4, fill: 'var(--pa)' }, s); tag(s, 312, 326, 'power');
    S('circle', { cx: 300, cy: 344, r: 4, fill: 'var(--pfg)' }, s); tag(s, 312, 348, 'signal');
    return s;
  };

  /* ----------------------------------------------------------- S3 glasses */
  D.glassesFlow = function () {
    var s = root(1000, 340, 'How a question travels: you speak, the glasses turn it into text, a phone app sends it to Gemini, and the answer comes back to the OLED on the lens');
    var X = [20, 270, 520, 770], T = [['You', 'press a button, ask'], ['ESP32 in the glasses', 'speech to text'], ['Companion phone app', 'over a hotspot'], ['Gemini', 'answers the question']];
    T.forEach(function (t, i) { box(s, X[i], 50, 210, 90, t[0], t[1], i === 1 ? 'is-hot' : ''); });
    for (var i = 0; i < 3; i++) { var d = 'M' + (X[i] + 210) + ' 95 H' + X[i + 1]; link(s, d, ''); S('path', { d: d, 'class': 'dg-flow' }, s); }
    box(s, 270, 220, 210, 90, 'OLED on the lens', 'draws the reply', 'is-hot');
    var back = 'M875 140 V265 H480';
    link(s, back, ''); S('path', { d: back, 'class': 'dg-flow s2' }, s);
    var up = 'M375 220 V140';
    link(s, up, ''); S('path', { d: up, 'class': 'dg-flow s2 rev' }, s);
    tag(s, 20, 30, 'THE QUESTION GOES OUT'); tag(s, 520, 297, 'THE ANSWER COMES BACK', 'start');
    return s;
  };

  /* ------------------------------------------------------------ robotics teams */
  D.teams = function () {
    var s = root(1000, 330, 'Nine teams: four FTC, four VEX and one FRC, the team taken to the World Championship');
    var groups = [['FTC', 4, 20], ['VEX', 4, 360], ['FRC', 1, 700]];
    groups.forEach(function (g) {
      tag(s, g[2], 40, g[0] + '  \u00b7  ' + g[1] + (g[1] === 1 ? ' TEAM' : ' TEAMS'));
      for (var i = 0; i < g[1]; i++) {
        var hot = g[0] === 'FRC';
        var r = box(s, g[2] + i * 80, 70, 64, 64, hot ? '\u2605' : String(i + 1), '', hot ? 'is-hot' : '');
      }
    });
    S('rect', { x: 700, y: 170, width: 280, height: 110, rx: 14, fill: 'none', stroke: 'var(--pa)', 'stroke-width': 1.5, 'stroke-dasharray': '5 6', opacity: .8 }, s);
    S('text', { x: 720, y: 205, 'class': 'dg-txt t-b' }, s, 'World Championship');
    S('text', { x: 720, y: 230, 'class': 'dg-sub' }, s, 'Rising All-Star Award');
    S('text', { x: 720, y: 252, 'class': 'dg-sub' }, s, 'put the team on the map');
    var d = 'M732 134 V170';
    S('path', { d: d, 'class': 'dg-link' }, s); S('path', { d: d, 'class': 'dg-flow' }, s);
    tag(s, 20, 220, 'Three competitions, one program: FIRST Tech Challenge, VEX, and FIRST Robotics Competition.');
    tag(s, 20, 244, 'The FRC team is the one we took to the World Championship.');
    return s;
  };

  /* ------------------------------------------------------------ robotics */
  D.deploy = function () {
    var s = root(1000, 300, 'Deployment pipeline: code, version control, a wireless push, the robot, and a rollback path back');
    var X = [30, 270, 510, 750], T = [['Code', 'Java · C++'], ['Version control', 'Git'], ['Wireless push', 'over the air'], ['Robot', 'RoboRIO · VEX']];
    T.forEach(function (t, i) { box(s, X[i], 70, 220, 100, t[0], t[1], i === 2 ? 'is-hot' : ''); });
    for (var i = 0; i < 3; i++) { var d = 'M' + (X[i] + 220) + ' 120 H' + X[i + 1]; link(s, d, ''); S('path', { d: d, 'class': 'dg-flow' }, s); }
    var back = 'M860 170 V245 H380 V170';
    link(s, back, ''); S('path', { d: back, 'class': 'dg-flow s2 rev' }, s);
    tag(s, 620, 236, 'roll back between matches', 'middle');
    tag(s, 30, 40, 'A CHANGE, FROM WRITTEN TO ON THE FIELD');
    return s;
  };

  /* ---------------------------------------------------------------- FLSAM */
  D.pathway = function () {
    var s = root(1000, 420, 'Pathway diagram: the FLSAM site and region 4a coordination lead 80 Tampa Bay students to four contests');
    box(s, 20, 150, 190, 90, 'flsam.org', 'HTML · CSS · JS', '');
    box(s, 290, 150, 210, 90, 'Region 4a', 'coordination', 'is-hot');
    var C = [['HMMT', 30], ['PUMaC', 130], ['ARML', 230], ['CMIMC', 330]], paths = [];
    C.forEach(function (c) { box(s, 790, c[1], 190, 60, c[0], '', ''); });
    link(s, 'M210 195 H290', ''); S('path', { d: 'M210 195 H290', 'class': 'dg-flow' }, s);
    C.forEach(function (c) {
      var d = 'M500 195 C640 195 640 ' + (c[1] + 30) + ' 790 ' + (c[1] + 30);
      S('path', { d: d, 'class': 'dg-link' }, s);
      var p = S('path', { d: d, fill: 'none', stroke: 'none' }, s); paths.push(p);
    });
    tag(s, 20, 40, '80 TAMPA BAY STUDENTS');
    tag(s, 20, 388, 'Each dot stands for one student on the way to a contest.');
    runDots(s, paths, 80, 7);
    return s;
  };

  /* -------------------------------------------------------- hydroponics */
  D.loops = function () {
    var s = root(1100, 460, 'Two loops in one chamber: a climate loop of sensors, controller and relays, and a growth loop of camera, vision pipeline and regression');
    function loopPath(x, y, w, h, r) { return 'M' + (x + r) + ' ' + y + ' H' + (x + w - r) + ' Q' + (x + w) + ' ' + y + ' ' + (x + w) + ' ' + (y + r) + ' V' + (y + h - r) + ' Q' + (x + w) + ' ' + (y + h) + ' ' + (x + w - r) + ' ' + (y + h) + ' H' + (x + r) + ' Q' + x + ' ' + (y + h) + ' ' + x + ' ' + (y + h - r) + ' V' + (y + r) + ' Q' + x + ' ' + y + ' ' + (x + r) + ' ' + y + ' Z'; }
    var A = loopPath(110, 100, 330, 270, 26), B = loopPath(660, 100, 330, 270, 26);
    link(s, A, ''); S('path', { d: A, 'class': 'dg-flow' }, s);
    link(s, B, ''); S('path', { d: B, 'class': 'dg-flow s2' }, s);
    tag(s, 110, 50, 'LOOP 1  ·  KEEP THE CLIMATE'); tag(s, 660, 50, 'LOOP 2  ·  MEASURE THE GROWTH');
    function cbox(cx, cy, w, t, sub, cls) { return box(s, cx - w / 2, cy - 30, w, 60, t, sub, cls); }
    cbox(275, 100, 210, 'BME680 senses', 'temp \u00b7 RH \u00b7 CO\u2082 \u00b7 VOC', 'is-hot');
    cbox(440, 235, 170, 'Teensy 4 decides', 'on the sensor PCB');
    cbox(275, 370, 240, 'Relays switch', 'LED \u00b7 pump \u00b7 fan');
    cbox(110, 235, 170, 'Chamber climate', 'light \u00b7 flow \u00b7 air');
    cbox(825, 100, 230, 'Camera sees', 'the canopy from above', 'is-hot');
    cbox(990, 235, 170, 'OpenCV', 'HSV \u00b7 ExG \u00b7 morphology');
    cbox(825, 370, 250, 'Regression', 'canopy area \u2192 fresh mass');
    cbox(660, 235, 150, 'Plant grows', '');
    return s;
  };

  window.PageDiagrams = D;
})();
