/* ===========================================================================
   The moving art behind each project page's opening: one generative scene per
   project, in that project's own material.

     traces   signal pulses running along routed copper      (FPGA CPU)
     routing  a board being routed, trace by trace           (robot PCB)
     waves    four sensor channels and rising particles      (environment board)
     gears    meshing gears under a hazard stripe            (robotics)
     math     symbols drifting past a curve being plotted    (FSAM)
     growth   a stem putting out leaves, and bubbles         (hydroponic chamber)

   Nothing here listens to the pointer. A scene runs only while it is on
   screen, and for reduced motion it draws one still frame.
   =========================================================================== */
(function () {
  'use strict';

  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hexA(hex, a) {
    var h = hex.replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    return 'rgba(' + parseInt(h.slice(0, 2), 16) + ',' + parseInt(h.slice(2, 4), 16) + ',' + parseInt(h.slice(4, 6), 16) + ',' + a + ')';
  }

  /* a routed polyline: horizontal and vertical runs with 45 degree bends */
  function route(R, w, h, step) {
    var x = Math.round(R() * w / step) * step, y = Math.round(R() * h / step) * step;
    var pts = [[x, y]], horiz = R() < 0.5, n = 4 + Math.floor(R() * 4);
    for (var i = 0; i < n; i++) {
      var run = (2 + Math.floor(R() * 6)) * step * (R() < 0.5 ? -1 : 1);
      if (horiz) x += run; else y += run;
      pts.push([x, y]);
      if (R() < 0.45) { var d = (1 + Math.floor(R() * 2)) * step * (R() < 0.5 ? -1 : 1); x += horiz ? d : d; y += horiz ? d : -d; pts.push([x, y]); }
      horiz = !horiz;
    }
    var len = 0, cum = [0];
    for (var j = 1; j < pts.length; j++) { len += Math.hypot(pts[j][0] - pts[j - 1][0], pts[j][1] - pts[j - 1][1]); cum.push(len); }
    return { pts: pts, len: len, cum: cum };
  }
  function pointAt(l, d) {
    d = Math.max(0, Math.min(l.len, d));
    for (var i = 1; i < l.cum.length; i++) if (d <= l.cum[i]) {
      var k = (d - l.cum[i - 1]) / ((l.cum[i] - l.cum[i - 1]) || 1);
      return [l.pts[i - 1][0] + (l.pts[i][0] - l.pts[i - 1][0]) * k, l.pts[i - 1][1] + (l.pts[i][1] - l.pts[i - 1][1]) * k];
    }
    return l.pts[l.pts.length - 1];
  }
  function strokeUpTo(x, l, d0, d1) {
    x.beginPath();
    var p = pointAt(l, d0); x.moveTo(p[0], p[1]);
    for (var i = 1; i < l.cum.length; i++) {
      if (l.cum[i] <= d0) continue;
      if (l.cum[i - 1] >= d1) break;
      var q = pointAt(l, Math.min(l.cum[i], d1)); x.lineTo(q[0], q[1]);
    }
    x.stroke();
  }

  var SCENES = {

    traces: function (w, h, C) {
      var R = rng(11), L = [], i;
      for (i = 0; i < 20; i++) L.push({ l: route(R, w, h, 52), sp: 90 + R() * 130, ph: R() * 2000, hot: R() < 0.35 });
      return function (x, t) {
        x.lineWidth = 1.5; x.lineCap = 'round'; x.lineJoin = 'round';
        L.forEach(function (o) {
          x.strokeStyle = C.line; strokeUpTo(x, o.l, 0, o.l.len);
          var d = (t * o.sp + o.ph) % (o.l.len + 200);
          x.strokeStyle = o.hot ? C.a : C.a2; x.lineWidth = 2.6;
          strokeUpTo(x, o.l, Math.max(0, d - 110), d); x.lineWidth = 1.5;
          var e = o.l.pts[o.l.pts.length - 1];
          x.fillStyle = C.line; x.beginPath(); x.arc(e[0], e[1], 4, 0, 6.3); x.fill();
        });
      };
    },

    routing: function (w, h, C) {
      var R = rng(5), L = [], i;
      for (i = 0; i < 15; i++) L.push({ l: route(R, w, h, 48), ph: R() * 9, sp: 0.09 + R() * 0.07 });
      return function (x, t) {
        x.lineCap = 'round'; x.lineJoin = 'round';
        L.forEach(function (o) {
          var c = ((t * o.sp + o.ph) % 1.7), g = Math.min(1, c / 0.9), a = c < 1.2 ? 1 : Math.max(0, 1 - (c - 1.2) / 0.5);
          var s = o.l.pts[0], e = pointAt(o.l, o.l.len * g);
          x.strokeStyle = hexA(C.aHex, 0.16 * a + 0.05); x.lineWidth = 7; strokeUpTo(x, o.l, 0, o.l.len * g);
          x.strokeStyle = hexA(C.aHex, 0.85 * a); x.lineWidth = 3; strokeUpTo(x, o.l, 0, o.l.len * g);
          x.fillStyle = hexA(C.aHex, 0.9 * a); x.beginPath(); x.arc(s[0], s[1], 7, 0, 6.3); x.fill();
          x.fillStyle = C.bg; x.beginPath(); x.arc(s[0], s[1], 2.6, 0, 6.3); x.fill();
          if (g >= 1) { x.strokeStyle = hexA(C.aHex, a); x.lineWidth = 2; x.beginPath(); x.arc(e[0], e[1], 7, 0, 6.3); x.stroke(); }
        });
      };
    },

    waves: function (w, h, C) {
      var R = rng(9), P = [], i;
      for (i = 0; i < 40; i++) P.push({ x: R() * w, y: R() * h, s: 8 + R() * 22, r: 1 + R() * 2.4, ph: R() * 6.3 });
      var bands = [{ y: .34, a: 34, f: 1.6, s: .5, c: 'aHex', al: .9 }, { y: .46, a: 26, f: 2.6, s: -.36, c: 'a2Hex', al: .6 }, { y: .58, a: 42, f: 1.1, s: .28, c: 'aHex', al: .45 }, { y: .70, a: 16, f: 4.2, s: -.7, c: 'a2Hex', al: .5 }];
      return function (x, t) {
        bands.forEach(function (b) {
          x.strokeStyle = hexA(C[b.c], b.al); x.lineWidth = 2.4; x.beginPath();
          for (var px = 0; px <= w; px += 6) {
            var y = h * b.y + Math.sin(px / w * b.f * 6.283 + t * b.s * 3) * b.a + Math.sin(px / w * b.f * 19 + t * b.s * 5) * b.a * .18;
            if (px === 0) x.moveTo(px, y); else x.lineTo(px, y);
          }
          x.stroke();
        });
        P.forEach(function (p) {
          var y = ((p.y - t * p.s) % h + h) % h, xx = p.x + Math.sin(t * .6 + p.ph) * 18;
          x.fillStyle = hexA(C.aHex, .35); x.beginPath(); x.arc(xx, y, p.r, 0, 6.3); x.fill();
        });
      };
    },

    gears: function (w, h, C) {
      function gear(x, cx, cy, r, teeth, rot, fill) {
        var td = r * 0.16, n = teeth * 4, i;
        x.beginPath();
        for (i = 0; i < n; i++) {
          var a = rot + i / n * 6.2832, k = i % 4, rr = (k === 1 || k === 2) ? r + td : r;
          var px = cx + Math.cos(a) * rr, py = cy + Math.sin(a) * rr;
          if (i === 0) x.moveTo(px, py); else x.lineTo(px, py);
        }
        x.closePath(); x.fillStyle = fill; x.fill(); x.stroke();
        x.beginPath(); x.arc(cx, cy, r * 0.32, 0, 6.3); x.stroke();
        x.beginPath(); x.arc(cx, cy, r * 0.08, 0, 6.3); x.fillStyle = C.a; x.fill();
      }
      return function (x, t) {
        var s = Math.min(w, h) / 900 + 0.25, r1 = 190 * s, r2 = 120 * s, r3 = 80 * s;
        var c1 = [w * 0.74, h * 0.4], td1 = r1 * 0.16;
        var ang2 = -0.7, d12 = r1 + r2 + td1 * 0.1;
        var c2 = [c1[0] + Math.cos(ang2) * d12, c1[1] + Math.sin(ang2) * d12];
        var ang3 = 0.8, d13 = r1 + r3 + td1 * 0.1;
        var c3 = [c1[0] + Math.cos(ang3) * d13, c1[1] + Math.sin(ang3) * d13];
        var sp = t * 0.22;
        x.lineWidth = 2.5; x.strokeStyle = C.a;
        gear(x, c1[0], c1[1], r1, 20, sp, hexA(C.aHex, .07));
        x.strokeStyle = C.a2; gear(x, c2[0], c2[1], r2, 13, -sp * 20 / 13 + 0.12, hexA(C.a2Hex, .06));
        x.strokeStyle = C.a; gear(x, c3[0], c3[1], r3, 9, -sp * 20 / 9 + 0.2, hexA(C.aHex, .05));
        /* the hazard stripe */
        var sh = 30, y0 = h - sh - 14;
        x.save(); x.beginPath(); x.rect(0, y0, w, sh); x.clip();
        x.fillStyle = hexA(C.aHex, .16); x.fillRect(0, y0, w, sh);
        x.fillStyle = hexA(C.aHex, .75);
        for (var i = -2; i < w / 36 + 3; i++) {
          var ox = i * 60 + (t * 40 % 60);
          x.beginPath(); x.moveTo(ox, y0 + sh); x.lineTo(ox + 30, y0 + sh); x.lineTo(ox + 30 + sh, y0); x.lineTo(ox + sh, y0); x.closePath(); x.fill();
        }
        x.restore();
      };
    },

    math: function (w, h, C) {
      var R = rng(4), S = ['π', '∑', '∫', '√', 'x²', '∞', 'θ', 'Δ', '≈', 'n!', 'sin', 'log', 'e', 'φ'], P = [], i;
      for (i = 0; i < 16; i++) P.push({ s: S[i % S.length], x: R() * w, y: R() * h, z: 26 + R() * 70, v: 5 + R() * 12, ph: R() * 6.3 });
      return function (x, t) {
        x.textAlign = 'center'; x.textBaseline = 'middle';
        P.forEach(function (p) {
          var y = ((p.y - t * p.v) % (h + 100) + h + 100) % (h + 100) - 50;
          x.font = '600 ' + p.z + 'px "Space Grotesk",sans-serif';
          x.fillStyle = hexA(C.fgHex, 0.075); x.fillText(p.s, p.x + Math.sin(t * .35 + p.ph) * 20, y);
        });
        /* a curve being plotted, and the point that draws it */
        var ax = w * 0.52, ay = h * 0.66, aw = w * 0.42, ah = h * 0.22;
        x.strokeStyle = hexA(C.fgHex, .35); x.lineWidth = 1.6; x.beginPath(); x.moveTo(ax, ay - ah); x.lineTo(ax, ay + ah); x.moveTo(ax, ay); x.lineTo(ax + aw, ay); x.stroke();
        var prog = (t * 0.11) % 1.25, end = Math.min(1, prog);
        x.strokeStyle = C.a; x.lineWidth = 3; x.lineCap = 'round'; x.beginPath();
        var lx = 0, ly = 0;
        for (var k = 0; k <= end * 240; k++) {
          var u = k / 240, cx = ax + u * aw, cy = ay - (Math.sin(u * 9.4) * 0.55 + Math.sin(u * 3.1 + 1) * 0.35) * ah;
          if (k === 0) x.moveTo(cx, cy); else x.lineTo(cx, cy); lx = cx; ly = cy;
        }
        x.stroke();
        if (prog < 1.15) { x.fillStyle = C.a; x.beginPath(); x.arc(lx, ly, 7, 0, 6.3); x.fill(); }
      };
    },

    growth: function (w, h, C) {
      var R = rng(8), B = [], i;
      for (i = 0; i < 26; i++) B.push({ x: R() * w, y: R() * h, s: 14 + R() * 34, r: 2 + R() * 7, ph: R() * 6.3 });
      function leaf(x, px, py, ang, len, wid) {
        x.save(); x.translate(px, py); x.rotate(ang);
        x.beginPath(); x.moveTo(0, 0); x.bezierCurveTo(len * .3, -wid, len * .8, -wid * .8, len, 0); x.bezierCurveTo(len * .8, wid * .8, len * .3, wid, 0, 0); x.closePath();
        x.fill(); x.stroke(); x.restore();
      }
      return function (x, t) {
        B.forEach(function (b) {
          var y = ((b.y - t * b.s) % (h + 40) + h + 40) % (h + 40) - 20, xx = b.x + Math.sin(t * .7 + b.ph) * 14;
          x.strokeStyle = hexA(C.aHex, .35); x.lineWidth = 1.5; x.beginPath(); x.arc(xx, y, b.r, 0, 6.3); x.stroke();
        });
        var g = Math.min(1, ((t * 0.07) % 1.4)), base = [w * 0.78, h + 10], top = h * (1 - 0.68 * g);
        var sway = Math.sin(t * .6) * 10;
        x.lineCap = 'round'; x.lineWidth = 6; x.strokeStyle = hexA(C.aHex, .8);
        x.beginPath(); x.moveTo(base[0], base[1]); x.quadraticCurveTo(base[0] + 30 + sway, (base[1] + top) / 2, base[0] + sway * 1.6, top); x.stroke();
        x.lineWidth = 2; x.strokeStyle = hexA(C.aHex, .9);
        var N = 9;
        for (var n = 1; n <= N; n++) {
          var u = n / N; if (u > g * 1.05) continue;
          var age = Math.min(1, (g - u * .9) * 2.2), yy = base[1] - (base[1] - top) * u;
          var xx = base[0] + (30 + sway) * (u * (1 - u) * 2) + sway * 1.6 * u * u;
          var side = n % 2 ? 1 : -1, len = (60 + 70 * (1 - u * .6)) * age, wid = len * .3;
          x.fillStyle = hexA(C.aHex, .18 + .1 * u);
          leaf(x, xx, yy, (side > 0 ? -0.35 : Math.PI + 0.35) + Math.sin(t * .7 + n) * .06, len, wid);
        }
      };
    }
  };

  function start(cv, kind) {
    if (!cv || !SCENES[kind]) return;
    var x = cv.getContext('2d');
    var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    var cs = getComputedStyle(document.documentElement);
    function v(n, d) { return (cs.getPropertyValue(n) || d).trim(); }
    var C = { a: v('--pa', '#D5ACFF'), aHex: v('--pa', '#D5ACFF'), a2: v('--pa2', '#7C5CFF'), a2Hex: v('--pa2', '#7C5CFF'), line: v('--pline', '#25253D'), bg: v('--pbg', '#0A0B12'), fgHex: v('--pfg', '#EDEBE6') };
    var draw, W = 0, H = 0, dpr = 1, vis = true, raf = 0, t0 = performance.now();

    function size() {
      var r = cv.getBoundingClientRect(); if (!r.width) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height; cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
      draw = SCENES[kind](W, H, C);
      frame(performance.now());
    }
    function frame(now) {
      raf = 0;
      if (!draw) return;
      x.setTransform(dpr, 0, 0, dpr, 0, 0); x.clearRect(0, 0, W, H);
      draw(x, reduce ? 6 : (now - t0) / 1000);
      if (!reduce && vis) raf = requestAnimationFrame(frame);
    }
    if (window.IntersectionObserver) new IntersectionObserver(function (es) {
      vis = es[0].isIntersecting;
      if (vis && !raf && !reduce) raf = requestAnimationFrame(frame);
    }).observe(cv);
    var rt = 0;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(size, 120); });
    size();
  }

  window.PageArt = { start: start };
})();
