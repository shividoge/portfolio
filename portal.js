/* ===========================================================================
   Into the display.

   The chip's screen is a thumbnail of the About page, and that is literally
   what happens: scrolling turns the part to face you, then the About page
   grows out of its display until it fills the window. The opening is one
   object, so nothing here is a fade or a wipe laid over the top.

   The maths, so it can be checked: the About page is a real full-window layer.
   At the start it is scaled and cropped to exactly the display's rectangle,
   measured from the live part while it is upright. It then grows to the window
   with its scale moving exponentially, which is what zooming feels like, and
   its centre travelling in step with that scale, so the display's centre is
   the fixed point of the zoom.

   Only on a wide, tall window with motion allowed. Anywhere else the opening
   is simply followed by the About page.
   =========================================================================== */
(function () {
  'use strict';

  var scene = document.getElementById('top');
  var about = document.getElementById('about');
  var layer = document.getElementById('heroLayer');
  if (!scene || !about || !layer) return;

  var MQ = '(min-width: 1000px) and (min-height: 640px) and (prefers-reduced-motion: no-preference)';

  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  var fading = [].slice.call(layer.querySelectorAll('.hero-copy, .chip-index, .chip-read, .chip-foot, .hero-cue'));
  var geom = null, W = 0, H = 0;

  function measure() {
    if (!window.__chip) return;
    W = scene.clientWidth; H = scene.clientHeight;
    var sr = scene.getBoundingClientRect();
    var r = window.__chip.measureLCD();
    var s0 = Math.max(r.w / W, r.h / H);
    geom = {
      s0: s0,
      lcx: r.x - sr.left + r.w / 2,
      lcy: r.y - sr.top + r.h / 2,
      cropX: Math.max(0, (W - r.w / s0) / 2),
      cropY: Math.max(0, (H - r.h / s0) / 2)
    };
  }

  function wordsTo(t) {
    var words = window.__aboutWords;
    if (!words || !words.length) return;
    var n = words.length;
    for (var i = 0; i < n; i++) {
      var k = clamp((t * (n + 9) - i) / 9, 0, 1);
      var base = words[i].classList.contains('is-em') ? 0.7 : 0.5;
      words[i].style.opacity = (base + (1 - base) * k).toFixed(3);
    }
  }

  function render(p) {
    if (!geom) return;
    var pose = clamp(p / 0.2, 0, 1);
    var u = clamp((p - 0.2) / 0.72, 0, 1);
    var out = clamp((p - 0.92) / 0.08, 0, 1);
    var ui = 1 - clamp(p / 0.15, 0, 1);

    window.__chip.setPose(ease(pose));
    fading.forEach(function (el) {
      el.style.opacity = ui.toFixed(3);
      el.style.transform = 'translate3d(0,' + (-16 * (1 - ui)).toFixed(1) + 'px,0)';
      el.style.pointerEvents = ui < 0.05 ? 'none' : '';
    });

    if (u <= 0) {
      about.style.clipPath = 'inset(0 0 100% 0)';
      about.style.pointerEvents = 'none';
      about.style.transform = '';
    } else {
      var e = ease(u);
      var s = Math.pow(geom.s0, 1 - e);
      var g = (s - geom.s0) / (1 - geom.s0);
      var cx = lerp(geom.lcx, W / 2, g), cy = lerp(geom.lcy, H / 2, g);
      about.style.transform = 'translate3d(' + (cx - s * W / 2).toFixed(2) + 'px,' + (cy - s * H / 2).toFixed(2) + 'px,0) scale(' + s.toFixed(5) + ')';
      about.style.clipPath = 'inset(' + (geom.cropY * (1 - g)).toFixed(2) + 'px ' + (geom.cropX * (1 - g)).toFixed(2) + 'px round ' + (3 / s * (1 - g)).toFixed(2) + 'px)';
      about.style.pointerEvents = u >= 1 ? 'auto' : 'none';
    }

    wordsTo(clamp((p - 0.62) / 0.34, 0, 1));
    if (window.__aboutSync) window.__aboutSync();
    layer.style.opacity = (1 - out).toFixed(3);
    layer.style.visibility = out >= 1 ? 'hidden' : 'visible';
    if (p >= 0.9) layer.setAttribute('data-paper', ''); else layer.removeAttribute('data-paper');
  }

  function reset() {
    window.__aboutPinned = false;
    scene.classList.remove('is-portal');
    about.style.transform = ''; about.style.clipPath = ''; about.style.pointerEvents = '';
    layer.style.opacity = ''; layer.style.visibility = ''; layer.removeAttribute('data-paper');
    fading.forEach(function (el) { el.style.opacity = ''; el.style.transform = ''; el.style.pointerEvents = ''; });
    if (window.__chip) window.__chip.setPose(0);
    var words = window.__aboutWords || [];
    words.forEach(function (w) { w.style.opacity = ''; });
    if (window.__aboutSync) window.__aboutSync();
  }

  function init() {
    if (!window.gsap || !window.ScrollTrigger || !window.__chip) return;
    gsap.registerPlugin(ScrollTrigger);

    /* The pin has to be measured from the top of the page. Measured from
       anywhere else (a reload that restores a deep scroll position, a resize
       half way down) its start lands above the page and the zoom never plays.
       So every refresh is done from 0 and the reader is put back after. */
    var savedY = 0, held = false;
    function jump(y) { window.scrollTo({ top: y, left: 0, behavior: 'instant' }); }
    ScrollTrigger.addEventListener('refreshInit', function () {
      savedY = window.scrollY; held = savedY > 0;
      if (held) jump(0);
    });
    ScrollTrigger.addEventListener('refresh', function () { if (held) { held = false; jump(savedY); } });

    gsap.matchMedia().add(MQ, function () {
      scene.classList.add('is-portal');
      window.__aboutPinned = true;
      var state = { p: 0 };
      var t = gsap.to(state, {
        p: 1, ease: 'none',
        onUpdate: function () { render(state.p); },
        scrollTrigger: {
          trigger: scene, start: 'top top',
          end: function () { return '+=' + Math.round(window.innerHeight * 1.2); },
          pin: true, scrub: 0.6, anticipatePin: 1, invalidateOnRefresh: true,
          onRefresh: function () { measure(); render(state.p); }
        }
      });
      measure(); render(0);

      window.__portal = { get progress() { return state.p; }, render: render, trigger: t.scrollTrigger };
      return reset;
    });

    ScrollTrigger.sort();
    ScrollTrigger.refresh();
    window.dispatchEvent(new Event('resize'));      /* the pin adds height: the circuit spine re-routes */
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(function () { ScrollTrigger.refresh(); }, 60); });
  }

  if (document.readyState === 'complete') init(); else window.addEventListener('load', init);
})();
