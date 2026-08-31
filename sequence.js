/* ===========================================================================
   Scroll-telling chip sequence
   ---------------------------------------------------------------------------
   Split out of index.html so the decode pipeline below has room to breathe.

   The source animation is 300 frames. That is a hard ceiling on real detail —
   more bytes cannot buy more motion, only more pixels per frame. So smoothness
   here comes from two places:

     * fractional frame positions are cross-dissolved at 64 sub-steps, so the
       picture keeps changing even where the frame index does not
     * decode is kept off the critical path by warming a window ahead of the
       playhead, in whichever direction it is travelling

   An ImageBitmap cache was tried here and removed: measured against an
   already-warm <img>, drawing a bitmap cost the same (~0.005ms vs ~0.004ms),
   while holding ~96MB of bitmaps and churning allocations on every fast scrub.
   It was buying nothing that decode() warming did not already provide.
   =========================================================================== */
(function () {
  'use strict';

  var FRAMES = 300;
  var section = document.getElementById('intro');
  var pin     = document.getElementById('introPin');
  var canvas  = document.getElementById('seqCanvas');
  if (!canvas || !section) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var small  = window.matchMedia('(max-width: 767px)').matches;
  var DIR    = small ? 'frames-sm' : 'frames';
  var BG     = '#F8F8F8';
  /* how far ahead of the playhead to warm the decode cache */
  var WARM_FWD  = small ? 20 : 30;
  var WARM_BACK = small ? 6  : 10;

  var ctx = canvas.getContext('2d', { alpha: false });

  var beats = Array.prototype.slice.call(document.querySelectorAll('.beat')).map(function (el) {
    return { el: el, inP: parseFloat(el.dataset.in), outP: parseFloat(el.dataset.out), shown: -1 };
  });
  /* All beats share one slot, so two must never be visible at once. Size each
     crossfade from the gap to its neighbour: beat N hits 0 as beat N+1 leaves 0. */
  (function () {
    var BASE = 0.055;
    for (var i = 0; i < beats.length; i++) {
      var prevOut = i > 0 ? beats[i - 1].outP : -1;
      var nextIn  = i < beats.length - 1 ? beats[i + 1].inP : 2;
      beats[i].fadeIn  = Math.max(0.006, Math.min(BASE, (beats[i].inP - prevOut) / 2));
      beats[i].fadeOut = Math.max(0.006, Math.min(BASE, (nextIn - beats[i].outP) / 2));
    }
  })();

  var loader   = document.getElementById('seqLoader');
  var loadBar  = document.getElementById('seqLoadBar');
  var loadPct  = document.getElementById('seqLoadPct');
  var railFill = document.getElementById('seqRailFill');
  var cue      = document.getElementById('seqCue');

  function setHeight() {
    if (reduce) { section.style.height = ''; return; }
    section.style.height = (small ? 520 : 720) + 'vh';
  }
  setHeight();

  /* ---------------- frame store ---------------- */
  var imgs   = new Array(FRAMES + 1);
  var ready  = new Array(FRAMES + 1);
  var loaded = 0;

  function src(i) { return DIR + '/frame_' + String(i).padStart(4, '0') + '.jpg'; }

  function load(i, cb) {
    if (imgs[i]) { cb && cb(); return; }
    var im = new Image();
    im.decoding = 'async';
    imgs[i] = im;
    im.onload = function () {
      ready[i] = true; loaded++;
      var pct = Math.round(loaded / FRAMES * 100);
      if (loadBar) loadBar.style.transform = 'scaleX(' + (pct / 100) + ')';
      if (loadPct) loadPct.textContent = pct + '%';
      cb && cb();
    };
    im.onerror = function () { ready[i] = false; loaded++; cb && cb(); };
    im.src = src(i);
  }

  function nearest(i) {
    if (ready[i]) return i;
    for (var d = 1; d < FRAMES; d++) {
      if (i - d >= 1 && ready[i - d]) return i - d;
      if (i + d <= FRAMES && ready[i + d]) return i + d;
    }
    return 0;
  }

  /* ---------------- decode warming ----------------
     Fetching a frame does not decode it; the first draw pays that cost, which
     is what makes a first scroll-through judder even when everything is cached.
     Warm a window ahead of the playhead in the direction of travel. Measured:
     this took a cold blended paint from 9.33ms to 0.72ms. */
  var warmed = {};
  function warm(centre, direction) {
    var lo = direction >= 0 ? centre - WARM_BACK : centre - WARM_FWD;
    var hi = direction >= 0 ? centre + WARM_FWD  : centre + WARM_BACK;
    if (lo < 1) lo = 1;
    if (hi > FRAMES) hi = FRAMES;
    for (var i = lo; i <= hi; i++) {
      if (!warmed[i] && ready[i] && imgs[i] && imgs[i].decode) {
        warmed[i] = 1;
        imgs[i].decode().catch(function () {});
      }
    }
  }

  /* ---------------- canvas ---------------- */
  var cw = 0, ch = 0, cur = 1, lastDrawn = 0;

  function resize() {
    var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    var r = canvas.getBoundingClientRect();
    var w = Math.max(1, Math.round(r.width));
    var h = Math.max(1, Math.round(reduce ? r.width * 9 / 16 : r.height));
    if (w === cw && h === ch) return;
    cw = w; ch = h;
    canvas.width  = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    lastDrawn = 0;
    paint(cur || 1, true);
  }

  function srcW(s) { return s.naturalWidth  || s.width; }
  function srcH(s) { return s.naturalHeight || s.height; }

  /* Cover, but never cut more than 20% off the frame's WIDTH. Vertical cropping
     is harmless (the render has white margin top and bottom); horizontal
     cropping eats the product. */
  function scaleFor(s) {
    var iw = srcW(s), ih = srcH(s);
    var sc = Math.max(cw / iw, ch / ih);
    if (cw / (iw * sc) < 0.80) sc = cw / (iw * 0.80);
    return sc;
  }
  function coversCanvas(s) {
    var iw = srcW(s);
    return cw / (iw * Math.max(cw / iw, ch / srcH(s))) >= 0.80;
  }

  function blit(s, alpha) {
    var sc = scaleFor(s), w = srcW(s) * sc, h = srcH(s) * sc;
    if (alpha < 1) ctx.globalAlpha = alpha;
    ctx.drawImage(s, (cw - w) / 2, (ch - h) / 2, w, h);
    if (alpha < 1) ctx.globalAlpha = 1;
  }

  /* Draw a FRACTIONAL frame position by cross-dissolving the two frames either
     side of it — this is what makes the slow dwell shots read as continuous
     motion rather than a slideshow. 64 sub-steps between frames. */
  var SUBSTEPS = 64;
  function paint(f, force) {
    var i0 = Math.floor(f);
    if (i0 < 1) i0 = 1;
    if (i0 > FRAMES) i0 = FRAMES;
    var t = f - i0;
    var a = nearest(i0);
    if (!a) return;
    var b = t > 0.008 ? nearest(Math.min(FRAMES, i0 + 1)) : 0;

    var key = a * (SUBSTEPS + 2) + (b && b !== a ? Math.round(t * SUBSTEPS) : 0);
    if (key === lastDrawn && !force) return;
    lastDrawn = key;

    var sa = imgs[a];
    if (!coversCanvas(sa)) { ctx.fillStyle = BG; ctx.fillRect(0, 0, cw, ch); }
    blit(sa, 1);
    if (b && b !== a && t > 0.008) blit(imgs[b], t);
  }

  /* ---------------- scroll -> frame ----------------
     Deliberately NOT linear. The lens and screen macros are only ~6% of the
     source animation each, far too quick to read copy over. These keypoints
     (scroll progress -> source frame) hold on each reveal and move quickly
     through the travel between them. */
  var KEYS = [
    [0.00,   1], [0.12,  52], [0.195, 88], [0.33, 106], [0.41, 118],
    [0.51, 136], [0.57, 148], [0.68, 186], [0.73, 200], [0.86, 250], [1.00, 300]
  ];
  var SRC_TOTAL = 300;

  function srcAt(p) {
    for (var i = 1; i < KEYS.length; i++) {
      if (p <= KEYS[i][0]) {
        var a = KEYS[i - 1], b = KEYS[i];
        var span = b[0] - a[0];
        var t = span > 0 ? (p - a[0]) / span : 0;
        t = t * t * (3 - 2 * t);       /* smoothstep: no velocity jump at joins */
        return a[1] + (b[1] - a[1]) * t;
      }
    }
    return SRC_TOTAL;
  }
  function idxAt(p) {
    var f = 1 + (srcAt(p) - 1) * (FRAMES - 1) / (SRC_TOTAL - 1);
    return Math.min(FRAMES, Math.max(1, f));
  }

  function progress() {
    var r = section.getBoundingClientRect();
    var travel = section.offsetHeight - window.innerHeight;
    if (travel <= 0) return 0;
    return Math.min(1, Math.max(0, -r.top / travel));
  }

  /* ---------------- beats ---------------- */
  function updateBeats(p) {
    for (var i = 0; i < beats.length; i++) {
      var b = beats[i], o, y;
      if (p < b.inP - b.fadeIn || p > b.outP + b.fadeOut) { o = 0; y = 14; }
      else if (p < b.inP)  { var t = (p - (b.inP - b.fadeIn)) / b.fadeIn; o = t; y = 14 * (1 - t); }
      else if (p > b.outP) { var u = (p - b.outP) / b.fadeOut; o = 1 - u; y = -12 * u; }
      else { o = 1; y = 0; }
      var oR = Math.round(o * 100) / 100;
      if (oR !== b.shown) {
        b.shown = oR;
        b.el.style.opacity = oR;
        b.el.style.transform = 'translate3d(0,calc(-50% + ' + y.toFixed(1) + 'px),0)';
        b.el.setAttribute('aria-hidden', oR < 0.05 ? 'true' : 'false');
      }
    }
  }

  /* ---------------- reduced motion ---------------- */
  if (reduce) {
    load(FRAMES, function () { cur = FRAMES; resize(); paint(FRAMES, true); });
    if (loader) loader.hidden = true;
    window.addEventListener('resize', resize);
    return;
  }

  /* ---------------- scrub loop ---------------- */
  var running = false, visible = false, lastT = 0, lastCentre = -1, travelDir = 1;

  function tick(now) {
    if (!running) return;
    var dt = lastT ? Math.min(64, now - lastT) : 16.7;
    lastT = now;

    var p = progress();
    var target = idxAt(p);
    if (target > cur) travelDir = 1; else if (target < cur) travelDir = -1;

    /* time-based smoothing: identical feel at 60Hz and 120Hz */
    var k = 1 - Math.pow(1 - 0.13, dt / 16.7);
    cur += (target - cur) * k;
    if (Math.abs(target - cur) < 0.004) cur = target;

    paint(cur);

    var centre = Math.round(cur);
    if (centre !== lastCentre) {
      lastCentre = centre;
      warm(centre, travelDir);
    }

    if (railFill) railFill.style.transform = 'scaleY(' + p.toFixed(3) + ')';
    updateBeats(p);
    if (cue) cue.style.opacity = p > 0.03 ? '0' : '1';

    if (visible || Math.abs(target - cur) > 0.004) requestAnimationFrame(tick);
    else running = false;
  }
  function kick() { if (!running) { running = true; lastT = 0; requestAnimationFrame(tick); } }

  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      if (visible) kick();
    }, { rootMargin: '10% 0px' }).observe(section);
  } else { visible = true; }

  window.addEventListener('scroll', kick, { passive: true });
  window.addEventListener('resize', function () { setHeight(); resize(); kick(); });

  /* ---------------- progressive load ----------------
     first frame -> paint immediately; then a coarse pass so scrubbing anywhere
     works early; then everything else. */
  load(1, function () {
    cur = 1;
    resize();
    paint(1, true);

    var coarse = [], rest = [];
    for (var i = 2; i <= FRAMES; i++) (i % 8 === 1 ? coarse : rest).push(i);
    coarse.push(FRAMES);

    var queue = coarse.concat(rest), qi = 0, inflight = 0, MAX = 8, revealed = false;
    function pump() {
      while (inflight < MAX && qi < queue.length) {
        inflight++;
        load(queue[qi++], function () {
          inflight--;
          if (!revealed && loaded >= Math.min(FRAMES, coarse.length + 8)) {
            revealed = true;
            if (loader) loader.hidden = true;
            warm(1, 1);
            kick();
          }
          pump();
        });
      }
      if (qi >= queue.length && inflight === 0) {
        if (loader) loader.hidden = true;
        warm(Math.round(cur), travelDir);
      }
    }
    pump();
  });
})();
