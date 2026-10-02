/* ===========================================================================
   The two bands under the opening.

   RIGHT NOW  Four live tiles: Gainesville's clock, how far through the degree
              the calendar is, how many days until the summer I am looking for
              work in, and the focus. The numbers are computed from today's
              date when the page loads; nothing is invented.
   PROOF      One number per project, counted up as it comes into view, each
              with a small drawing of what it measures: the three ALU
              operations, the one board, the four channels, the hundred
              students, the 60%, and the six trials' errors. Each cell is a
              link to that project's own page.
   Reduced motion: values are set, nothing is animated.
   =========================================================================== */
(function () {
  'use strict';
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var NS = 'http://www.w3.org/2000/svg';
  function $(id) { return document.getElementById(id); }
  function S(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
  function fmt(n) { return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

  /* ------------------------------------------------------------- right now */
  var clock = $('ntClock');
  if (clock) {
    var f;
    try { f = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: false }); } catch (e) { f = null; }
    var sec = $('ntSec'), part = $('ntPart');
    var tick = function () {
      if (!f) return;
      var p = {}; f.formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      var h = (+p.hour) % 24, hh = ('0' + h).slice(-2);
      clock.innerHTML = hh + ':' + p.minute + '<small>:' + p.second + '</small>';
      if (sec) sec.style.strokeDashoffset = String(60 - (+p.second));
      if (part) part.textContent = (h < 5 ? 'Late night' : h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : h < 21 ? 'Evening' : 'Night') + ' in Gainesville. Originally from Tampa.';
    };
    tick(); if (f) setInterval(tick, 1000);
  }

  var DAY = 86400000, now = Date.now();
  var start = Date.UTC(2026, 7, 24), end = Date.UTC(2030, 4, 2), seek = Date.UTC(2027, 5, 1);
  var pct = Math.max(0, Math.min(100, (now - start) / (end - start) * 100));
  var toGrad = Math.max(0, Math.ceil((end - now) / DAY)), toSeek = Math.max(0, Math.ceil((seek - now) / DAY));
  var degEl = $('ntDeg'), barEl = $('ntBar'), daysEl = $('ntDays'), seekEl = $('ntSeek'), pips = $('ntPips');
  if (pips) {
    var weeks = Math.min(60, Math.ceil(toSeek / 7));
    for (var i = 0; i < weeks; i++) { var d = document.createElement('i'); if (i === 0) d.className = 'is-next'; pips.appendChild(d); }
  }
  function countTo(el, to, dec, done) {
    if (!el) return;
    if (reduce) { el.textContent = dec ? to.toFixed(dec) : fmt(to); return; }
    var t0 = performance.now(), D = 1300;
    (function step(n) {
      var k = Math.min(1, (n - t0) / D), e = 1 - Math.pow(1 - k, 3), v = to * e;
      el.textContent = dec ? v.toFixed(dec) : fmt(v);
      if (k < 1) requestAnimationFrame(step); else if (done) done();
    })(t0);
  }
  var nowSec = document.getElementById('now');
  function nowIn() {
    countTo(degEl, pct, 1); countTo(daysEl, toGrad, 0); countTo(seekEl, toSeek, 0);
    if (barEl) barEl.style.transform = 'scaleX(' + Math.max(0.012, pct / 100) + ')';
  }
  if (degEl) { degEl.textContent = pct.toFixed(1); daysEl.textContent = fmt(toGrad); seekEl.textContent = fmt(toSeek); if (barEl) barEl.style.transform = 'scaleX(' + Math.max(0.012, pct / 100) + ')'; }
  if (nowSec && !reduce && window.IntersectionObserver) {
    if (barEl) barEl.style.transform = 'scaleX(0)';
    new IntersectionObserver(function (es, o) { if (es[0].isIntersecting) { nowIn(); o.disconnect(); } }, { threshold: 0.3 }).observe(nowSec);
  }

  var wave = $('ntWave');
  if (wave) {
    var d2 = 'M0 20'; for (var x = 0; x <= 480; x += 4) d2 += ' L' + x + ' ' + (20 + Math.sin(x / 120 * 6.2832) * 11 * (0.6 + 0.4 * Math.sin(x / 37))).toFixed(1);
    wave.setAttribute('d', d2);
    wave.parentNode.removeChild(wave); var g = S('g', { 'class': 'nt-wave-g' }, document.querySelector('.nt-wave')); g.appendChild(wave);
  }

  /* ----------------------------------------------------------------- proof */
  var V = {
    alu: function (s) {
      ['ADD', 'SUB', 'MUL'].forEach(function (t, i) {
        var y = 6 + i * 16;
        S('text', { x: 0, y: y + 8, 'class': 'gv-t' }, s).textContent = t;
        S('rect', { x: 30, y: y, width: 120, height: 10, rx: 3, 'class': 'gv-track' }, s);
        var r = S('rect', { x: 30, y: y, width: 120, height: 10, rx: 3, 'class': 'gv-fill', style: '--i:' + i }, s);
      });
    },
    board: function (s) {
      S('rect', { x: 4, y: 4, width: 152, height: 46, rx: 6, 'class': 'gv-track', fill: 'none' }, s);
      S('rect', { x: 62, y: 14, width: 36, height: 26, rx: 3, 'class': 'gv-fill2' }, s);
      ['M62 22 H20 V12', 'M62 32 H14', 'M98 22 H140 V12', 'M98 32 H146', 'M80 14 V8', 'M80 40 V46'].forEach(function (d, i) { S('path', { d: d, pathLength: 1, 'class': 'gv-line', style: '--i:' + i }, s); });
    },
    waves: function (s) {
      [[12, 6, 1], [24, 4, 1.6], [36, 7, .8], [47, 3, 2.2]].forEach(function (w, i) {
        var d = 'M0 ' + w[0]; for (var x = 0; x <= 320; x += 4) d += ' L' + x + ' ' + (w[0] + Math.sin(x / 160 * 6.2832 * w[2]) * w[1]).toFixed(1);
        var g = S('g', { 'class': 'gv-wave', style: '--i:' + i }, s); S('path', { d: d, 'class': 'gv-line2' }, g);
      });
    },
    dots: function (s) {
      for (var i = 0; i < 100; i++) S('circle', { cx: 4 + (i % 25) * 6.3, cy: 6 + Math.floor(i / 25) * 13, r: 2.3, 'class': 'gv-dot', style: '--i:' + i }, s);
    },
    ring: function (s) {
      S('circle', { cx: 80, cy: 27, r: 22, 'class': 'gv-ringb' }, s);
      S('circle', { cx: 80, cy: 27, r: 22, 'class': 'gv-ringf', pathLength: 100 }, s);
    },
    price: function (s) {
      var rows = [['S\u00b3', 83, false], ['CAP', 150, true]];
      rows.forEach(function (r, i) {
        var y = 8 + i * 22;
        S('text', { x: 0, y: y + 10, 'class': 'gv-t' }, s).textContent = r[0];
        S('rect', { x: 32, y: y, width: r[1] / 150 * 120, height: 14, rx: 3, 'class': r[2] ? 'gv-track' : 'gv-bar2', style: '--i:' + i }, s);
      });
      S('text', { x: 32 + 83 / 150 * 120 + 5, y: 18, 'class': 'gv-t' }, s).textContent = '$83';
    },
    bars: function (s) {
      var E = [5.1, 7.6, 7.8, 6.6, 6.6, 7.6];
      E.forEach(function (e, i) { var h = e / 8 * 44; S('rect', { x: 14 + i * 24, y: 50 - h, width: 16, height: h, rx: 3, 'class': 'gv-bar', style: '--i:' + i }, s); });
      S('path', { d: 'M4 ' + (50 - 6.9 / 8 * 44) + ' H156', 'class': 'gv-mean' }, s);
    }
  };
  [].slice.call(document.querySelectorAll('.gl-viz')).forEach(function (h) {
    var fn = V[h.getAttribute('data-viz')]; if (!fn) return;
    var s = S('svg', { viewBox: '0 0 160 54', preserveAspectRatio: 'xMinYMid meet' }); h.appendChild(s); fn(s);
  });
  function countProof(el) {
    var to = parseFloat(el.getAttribute('data-count')), dec = +(el.getAttribute('data-dec') || 0), suf = el.getAttribute('data-suffix') || '', pre = el.getAttribute('data-prefix') || '';
    if (reduce) { el.textContent = pre + (dec ? to.toFixed(dec) : fmt(to)) + suf; return; }
    var t0 = performance.now(), D = 1400;
    (function step(n) {
      var k = Math.min(1, (n - t0) / D), e = 1 - Math.pow(1 - k, 3), v = to * e;
      el.textContent = pre + (dec ? v.toFixed(dec) : fmt(v)) + suf;
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  var cells = [].slice.call(document.querySelectorAll('.glance-stat'));
  cells.forEach(function (c, i) { c.style.setProperty('--ci', i); });
  if (reduce || !window.IntersectionObserver) { cells.forEach(function (c) { c.classList.add('is-in'); countProof(c.querySelector('[data-count]')); }); }
  else {
    cells.forEach(function (c) { var n = c.querySelector('[data-count]'); if (n) n.textContent = (n.getAttribute('data-prefix') || '') + '0' + (n.getAttribute('data-suffix') || ''); });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (!e.isIntersecting) return; io.unobserve(e.target); e.target.classList.add('is-in'); var n = e.target.querySelector('[data-count]'); if (n) setTimeout(function () { countProof(n); }, (+e.target.style.getPropertyValue('--ci')) * 90); });
    }, { threshold: 0.35 });
    cells.forEach(function (c) { io.observe(c); });
  }
})();
