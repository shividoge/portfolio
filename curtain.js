/* ===========================================================================
   The loading screen and page transitions (see curtain.css).

   ARRIVAL   The circuit fills in as the page really loads (document, fonts,
             the animation library, the window load), with a short floor so it
             never flashes past. A first visit to the home page gets the full
             power-on self test; arriving from another page gets a short one
             that names the page it is loading.
   LEAVING   Clicking a link to another page of the site closes the same
             board over the page, then navigates. The next page opens it.
   Kind to the visitor: once per session for the long version; any key, click
   or tap skips; it never holds a page for more than about three seconds; it
   is absent for reduced motion and for anyone without JavaScript (the class
   that shows it is added by a script in the <head>).
   =========================================================================== */
(function () {
  'use strict';

  var root = document.documentElement;
  var boot = document.getElementById('boot');
  if (!boot) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!window.CSS || !CSS.registerProperty) boot.classList.add('boot-fade');   /* no animatable custom properties: fade instead of iris */

  var num = document.getElementById('bootN');
  var destEl = document.getElementById('bootDest');
  var modeEl = document.getElementById('bootMode');
  var rows = [].slice.call(boot.querySelectorAll('.boot-row'));
  var store = { get: function (k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
                set: function (k, v) { try { sessionStorage.setItem(k, v); } catch (e) {} },
                del: function (k) { try { sessionStorage.removeItem(k); } catch (e) {} } };

  function accent() { return (getComputedStyle(root).getPropertyValue('--pc') || '').trim(); }
  function paint(p) {
    boot.style.setProperty('--p', p.toFixed(3));
    var pct = Math.round(p * 100);
    if (num) num.textContent = pct < 10 ? '0' + pct : String(pct);
    rows.forEach(function (r, i) {
      var on = p >= (i + 1) / (rows.length + 0.6);
      if (on !== r.classList.contains('is-ok')) r.classList.toggle('is-ok', on);
    });
  }

  /* --------------------------------------------------------------- arrival */
  var finished = false;
  function arrive() {
    var full = root.classList.contains('boot-full');
    var a = accent(); if (a) boot.style.setProperty('--ba', a);
    if (destEl) destEl.textContent = store.get('w2dest') || document.title.replace(/\s*[|:—-].*$/, '');
    store.del('w2dest');
    if (modeEl) modeEl.textContent = full ? 'Power-on self test' : 'Loading';
    boot.classList.add('is-fast'); if (full) boot.classList.remove('is-fast');

    var MIN = full ? 1500 : 850, MAX = 3200, t0 = performance.now();
    var ev = { dom: false, fonts: false, lib: false, load: false };
    var shown = 0;
    function done(k) { ev[k] = true; }
    if (document.readyState !== 'loading') done('dom'); else document.addEventListener('DOMContentLoaded', function () { done('dom'); });
    if (document.readyState === 'complete') done('load'); else window.addEventListener('load', function () { done('load'); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { done('fonts'); }); else done('fonts');
    (function pollLib() { if (window.gsap && window.ScrollTrigger) done('lib'); else if (!finished) setTimeout(pollLib, 60); })();
    function target() { return (ev.dom ? 0.22 : 0) + (ev.lib ? 0.18 : 0) + (ev.fonts ? 0.25 : 0) + (ev.load ? 0.35 : 0); }

    function finish() {
      if (finished) return; finished = true;
      paint(1);
      rows.forEach(function (r) { r.classList.add('is-ok'); });
      store.set('w2boot', '1');
      boot.classList.add('is-lit');                      /* the board energises ... */
      setTimeout(function () {
        boot.classList.add('is-done');                    /* ... then the iris opens from the chip */
        setTimeout(function () {
          root.classList.remove('boot', 'boot-full', 'boot-tx');
          if (boot.parentNode) boot.parentNode.removeChild(boot);
          window.dispatchEvent(new Event('resize'));      /* the page was measured while scrolling was locked */
          if (window.ScrollTrigger) ScrollTrigger.refresh();
        }, full ? 1000 : 720);
      }, 380);
    }
    function step(now) {
      if (finished) return;
      var el = now - t0;
      var goal = Math.min(target(), el / MIN);
      shown += (goal - shown) * 0.14;
      if (goal - shown < 0.002) shown = goal;
      paint(Math.min(shown, 0.999));
      if ((target() >= 1 && shown >= 0.995 && el >= MIN) || el >= MAX) return finish();
      requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
    ['keydown', 'pointerdown', 'wheel', 'touchstart'].forEach(function (t) {
      window.addEventListener(t, function () { finish(); }, { once: true, passive: true });
    });
  }
  if (root.classList.contains('boot')) arrive();

  /* --------------------------------------------------------------- leaving */
  var leaving = false;
  function leave(url, dest, color) {
    if (leaving) return; leaving = true;
    if (color) boot.style.setProperty('--ba', color); else boot.style.removeProperty('--ba');
    if (destEl) destEl.textContent = dest || '';
    if (modeEl) modeEl.textContent = 'Loading';
    root.classList.add('boot', 'boot-tx');
    boot.classList.remove('is-lit');
    boot.classList.add('is-instant', 'is-done', 'is-fast');
    paint(0.18);
    void boot.offsetWidth;
    boot.classList.remove('is-instant', 'is-done');       /* the iris closes over the page */
    var t0 = performance.now(), D = 620;
    (function draw(now) {
      var k = Math.min(1, (now - t0) / D);
      paint(0.18 + 0.72 * k);
      if (k < 1) requestAnimationFrame(draw);
    })(t0);
    store.set('w2dest', dest || ''); store.set('w2tx', '1');
    setTimeout(function () { location.href = url; }, D + 60);
    setTimeout(function () { leaving = false; }, 4000);    /* if the navigation is cancelled, do not stay shut */
  }

  document.addEventListener('click', function (e) {
    if (reduce || e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a || a.target === '_blank' || a.hasAttribute('download')) return;
    var u; try { u = new URL(a.href, location.href); } catch (x) { return; }
    if (u.origin !== location.origin || !/\.html?$|\/$/.test(u.pathname)) return;
    if (u.pathname === location.pathname) return;          /* same page: an ordinary jump */
    e.preventDefault();
    leave(u.href, a.getAttribute('data-dest') || '', a.getAttribute('data-pa') || '');
  });

  /* back/forward can restore a page with the curtain still down */
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    leaving = false;
    root.classList.remove('boot', 'boot-full', 'boot-tx');
    boot.classList.add('is-done', 'is-instant');
  });
})();
