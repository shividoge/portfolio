/* ===========================================================================
   The seam between the opening and the page.

   The opening is a board. So it ends the way a board ends: a routed edge with
   gold fingers along it, mouse-bite perforations where it was snapped off the
   panel, and copper that does not stop at the boundary — every trace crosses
   through a via and carries on into the light side, one of them running down
   to where the page's own spine begins.

   It draws itself as you approach: the traces route down, the vias light as
   the current reaches them, then the copper continues below. So the hard cut
   from dark to paper is the thing you are crossing, not something to hide.
   =========================================================================== */
(function () {
  'use strict';

  var host = document.getElementById('seam');
  var hero = document.getElementById('top');
  if (!host || !hero) return;

  var NS = 'http://www.w3.org/2000/svg';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var ABOVE = 128;         /* dark side of the seam */
  var BELOW = 96;          /* light side */
  var H = ABOVE + BELOW;

  var up = [], down = [], vias = [], lens = [], dlens = [];
  var raf = 0;

  function n(tag, a) {
    var e = document.createElementNS(NS, tag);
    for (var k in a) e.setAttribute(k, a[k]);
    return e;
  }

  /* One straight run, then one 45° knee. The knee is set by the HORIZONTAL
     offset — a 45° corner covers as much y as it does x — so the diagonal is
     only ever as long as the trace has to move sideways. */
  function route(x0, y0, x1, y1) {
    var dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    if (dx < 1) return 'M ' + x0 + ' ' + y0 + ' V ' + y1;
    if (dx >= dy) return 'M ' + x0 + ' ' + y0 + ' L ' + x1 + ' ' + y1;
    return 'M ' + x0 + ' ' + y0 + ' V ' + (y1 - dx).toFixed(1) + ' L ' + x1 + ' ' + y1;
  }

  function build() {
    host.innerHTML = '';
    up = []; down = []; vias = []; lens = []; dlens = [];

    var W = host.clientWidth || document.documentElement.clientWidth;
    var svg = n('svg', { viewBox: '0 0 ' + W + ' ' + H, width: '100%', height: H,
                         preserveAspectRatio: 'none' });

    var defs = n('defs', {});
    /* the copper below the edge fades out rather than stopping dead */
    var fade = n('linearGradient', { id: 'seamFade', x1: '0', y1: '0', x2: '0', y2: '1' });
    fade.appendChild(n('stop', { offset: '0%',  'stop-color': '#fff' }));
    fade.appendChild(n('stop', { offset: '58%', 'stop-color': '#fff', 'stop-opacity': '.85' }));
    fade.appendChild(n('stop', { offset: '100%', 'stop-color': '#fff', 'stop-opacity': '0' }));
    var mask = n('mask', { id: 'seamMask', maskUnits: 'userSpaceOnUse',
                           x: 0, y: ABOVE, width: W, height: BELOW });
    mask.appendChild(n('rect', { x: 0, y: ABOVE, width: W, height: BELOW, fill: 'url(#seamFade)' }));

    /* and the copper above emerges out of the dark instead of starting at a cap */
    var rise = n('linearGradient', { id: 'seamRise', x1: '0', y1: '0', x2: '0', y2: '1' });
    rise.appendChild(n('stop', { offset: '0%',  'stop-color': '#fff', 'stop-opacity': '0' }));
    rise.appendChild(n('stop', { offset: '38%', 'stop-color': '#fff' }));
    var upMask = n('mask', { id: 'seamUp', maskUnits: 'userSpaceOnUse',
                             x: 0, y: 0, width: W, height: ABOVE });
    upMask.appendChild(n('rect', { x: 0, y: 0, width: W, height: ABOVE, fill: 'url(#seamRise)' }));

    defs.appendChild(fade); defs.appendChild(mask);
    defs.appendChild(rise); defs.appendChild(upMask);

    var gold = n('linearGradient', { id: 'seamGold', x1: '0', y1: '0', x2: '0', y2: '1' });
    gold.appendChild(n('stop', { offset: '0%',   'stop-color': '#6E5827' }));
    gold.appendChild(n('stop', { offset: '42%',  'stop-color': '#B99F55' }));
    gold.appendChild(n('stop', { offset: '100%', 'stop-color': '#5E4C21' }));
    defs.appendChild(gold);
    svg.appendChild(defs);

    /* ---- the edge connector: fingers at a fixed pitch, with the keying gaps
           a real card edge has, so it reads as a connector and not a bar ---- */
    /* a phone is too narrow for a 29px pitch to read as a connector */
    var narrow = W < 620;
    var pitch = narrow ? 19 : 29, fw = narrow ? 7 : 10, FH = narrow ? 15 : 19;
    var fx = [];
    for (var x = ((W - 8) % pitch) / 2 + 4; x < W - 14; x += pitch) fx.push(x);
    var kA = Math.round(fx.length * 0.30), kB = Math.round(fx.length * 0.66);
    fx = fx.filter(function (_, i) { return i !== kA && i !== kA + 1 && i !== kB; });

    var fingers = n('g', { fill: 'url(#seamGold)' });
    fx.forEach(function (x) {
      fingers.appendChild(n('rect', { x: x.toFixed(1), y: ABOVE - FH, width: fw, height: FH, rx: 1.5 }));
    });
    svg.appendChild(fingers);

    /* ---- the routed edge, and the mouse bites left where it was snapped
           off the manufacturing panel ---- */
    svg.appendChild(n('rect', { x: 0, y: ABOVE - 2.4, width: W, height: 2.4, fill: '#CEC4A8' }));
    var bites = n('g', { fill: 'var(--bg)' });
    for (var bx = 64; bx < W - 30; bx += 178) {
      for (var b = 0; b < 3; b++) {
        bites.appendChild(n('circle', { cx: (bx + b * 8.5).toFixed(1), cy: ABOVE - 2.4, r: 3 }));
      }
    }
    svg.appendChild(bites);

    /* ---- the copper that crosses: down onto a finger, through, and on ---- */
    var want  = Math.max(5, Math.min(11, Math.round(W / 130)));
    var step  = Math.max(2, Math.round(fx.length / want));
    var gUp   = n('g', { fill: 'none', stroke: 'var(--accent)', 'stroke-width': 1.5,
                         'stroke-opacity': .62, 'stroke-linecap': 'round',
                         'stroke-linejoin': 'round', mask: 'url(#seamUp)' });
    var gDown = n('g', { fill: 'none', stroke: 'var(--accentd)', 'stroke-width': 1.5,
                         'stroke-opacity': .52, 'stroke-linecap': 'round',
                         'stroke-linejoin': 'round', mask: 'url(#seamMask)' });
    var gVia  = n('g', {});

    /* where the page's own spine starts, so one trace can hand over to it */
    var container = Math.min(1400, W);
    var spineX = (W - container) / 2 + 18;

    for (var i = 0, k = 0; i < fx.length; i += step, k++) {
      var ex = +(fx[i] + fw / 2).toFixed(1);
      var jog  = [(k % 3) - 1] * 1;
      var up1  = ((k % 3) - 1) * 27;
      var dn1  = ((k % 4) - 1.5) * 22;
      void jog;

      var pu = n('path', { d: route(ex + up1, 0, ex, ABOVE - FH + 2) });
      gUp.appendChild(pu); up.push(pu);

      /* the left-most one carries straight on into the page's spine */
      var bx2 = (W > 1100 && k === 0) ? spineX : ex + dn1;
      bx2 = Math.max(10, Math.min(W - 10, bx2));
      var pd = n('path', { d: route(ex, ABOVE + 2, bx2, ABOVE + BELOW - 8) });
      gDown.appendChild(pd); down.push(pd);

      var ring = n('circle', { cx: ex, cy: ABOVE - FH - 13, r: 4.6, fill: '#0E0E12',
                               stroke: '#CEC4A8', 'stroke-opacity': .85, 'stroke-width': 1.2 });
      var core = n('circle', { cx: ex, cy: ABOVE - FH - 13, r: 2.2, fill: '#E4CC80', opacity: 0 });
      gVia.appendChild(ring); gVia.appendChild(core);
      vias.push(core);
    }

    svg.appendChild(gUp); svg.appendChild(gVia); svg.appendChild(gDown);
    host.appendChild(svg);

    up.forEach(function (p)   { var L = p.getTotalLength(); lens.push(L);
                                p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    down.forEach(function (p) { var L = p.getTotalLength(); dlens.push(L);
                                p.style.strokeDasharray = L; p.style.strokeDashoffset = L; });
    if (reduce) draw(1);
  }

  function draw(p) {
    /* the run down, then the vias, then the run out — in that order */
    var a = Math.min(1, p / 0.55);
    var b = Math.max(0, Math.min(1, (p - 0.45) / 0.5));
    for (var i = 0; i < up.length; i++) {
      var stagger = (i % 4) * 0.06;
      var ai = Math.max(0, Math.min(1, (a - stagger) / (1 - stagger || 1)));
      up[i].style.strokeDashoffset = (lens[i] * (1 - ai)).toFixed(1);
      vias[i].style.opacity = ai > 0.96 ? 1 : 0;
      var bi = Math.max(0, Math.min(1, (b - stagger) / (1 - stagger || 1)));
      down[i].style.strokeDashoffset = (dlens[i] * (1 - bi)).toFixed(1);
    }
  }

  function onScroll() {
    if (raf || reduce) return;
    raf = requestAnimationFrame(function () {
      raf = 0;
      var r = host.getBoundingClientRect();
      var vh = window.innerHeight;
      /* 0 when the seam is a screen away, 1 once the edge has settled in view */
      var p = 1 - (r.top - vh * 0.34) / (vh * 0.66);
      draw(Math.max(0, Math.min(1, p)));
    });
  }

  var t;
  function reflow() { clearTimeout(t); t = setTimeout(function () { build(); onScroll(); }, 180); }

  build();
  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', reflow);
  window.addEventListener('load', function () { setTimeout(function () { build(); onScroll(); }, 300); });
})();
