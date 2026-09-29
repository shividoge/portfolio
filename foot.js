/* ===========================================================================
   The footer.

   · The lanes are built from window.PROJECTS, the same list the project rows
     are built from: one lane per project, holding that project's own tags.
     Each lane runs the opposite way to the
     one beside it, at its own speed, and the whole stack tips up out of the
     floor as the footer scrolls into view.
   · Motion can be paused (and is off for reduced motion, and while the footer
     is not on screen).
   · The clock is Gainesville's, which is what someone trying to reach me
     actually wants to know.
   =========================================================================== */
(function () {
  'use strict';

  var foot = document.getElementById('foot');
  if (!foot) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var plane = document.getElementById('footPlane');

  function text(html) { var d = document.createElement('div'); d.innerHTML = html; return d.textContent; }
  function el(tag, cls, txt) { var e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; }

  /* ------------------------------------------------------------- the lanes */
  function build() {
    var P = window.PROJECTS || [];
    if (!plane || !P.length) return;
    var speeds = [78, 62, 90, 70, 84, 66];
    var sr = el('ul', 'sr-only');

    P.forEach(function (p, i) {
      var tags = (p.tags || []).map(text);
      var lane = el('div', 'foot-lane');
      lane.style.setProperty('--k', i);

      /* enough copies of the list that one half is wider than the plane */
      var reps = Math.max(2, Math.ceil(10 / tags.length));
      function half() {
        var h = el('div', 'foot-half'); h.setAttribute('aria-hidden', 'true');
        for (var r = 0; r < reps; r++) tags.forEach(function (t, j) {
          var k = (j + r * 3 + i) % 4;
          var s = el('span', 'foot-sk' + (k === 1 ? ' is-o' : k === 3 ? ' is-a' : ''), t);
          s.appendChild(el('sup', null, p.n));
          h.appendChild(s);
        });
        return h;
      }
      var track = el('div', 'foot-track');
      track.style.setProperty('--t', speeds[i % speeds.length] + 's');
      track.style.setProperty('--dir', i % 2 ? 'reverse' : 'normal');
      track.appendChild(half()); track.appendChild(half());
      lane.appendChild(track);
      plane.appendChild(lane);

      sr.appendChild(el('li', null, text(p.title) + ': ' + tags.join(', ')));
    });
    foot.appendChild(sr);

    /* the stack tips up out of the floor as the footer arrives */
    if (!reduce && window.gsap && window.ScrollTrigger) {
      gsap.registerPlugin(ScrollTrigger);
      gsap.fromTo(plane, { rotateX: 80, rotateZ: -4, scale: 1.2, y: 90 },
        { rotateX: 54, rotateZ: -10, scale: 1, y: 0, ease: 'none',
          scrollTrigger: { trigger: foot, start: 'top bottom', end: 'top 15%', scrub: 0.6 } });
    }
  }
  /* the deferred scripts (projects.js among them) have all run by DOMContentLoaded */
  if (document.readyState === 'complete') build(); else document.addEventListener('DOMContentLoaded', build);

  /* ---------------------------------------------- run only while on screen */
  var paused = false;
  function sync(vis) { foot.classList.toggle('is-paused', paused || !vis); }
  if (window.IntersectionObserver) new IntersectionObserver(function (es) { sync(es[0].isIntersecting); }).observe(foot);
  var pb = document.getElementById('footPause');
  if (pb) pb.addEventListener('click', function () {
    paused = !paused;
    pb.setAttribute('aria-pressed', paused ? 'true' : 'false');
    pb.textContent = paused ? 'Play' : 'Pause';
    sync(true);
  });

  /* --------------------------------------------------------------- clock */
  var clock = document.getElementById('footClock');
  if (clock) {
    var fmt;
    try { fmt = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' }); } catch (e) { fmt = null; }
    var tick = function () { if (fmt) clock.textContent = fmt.format(new Date()); };
    tick();
    if (fmt) setInterval(tick, 20000);
  }

  /* ---------------------------------------------------------- back to top */
  var up = document.getElementById('footUp');
  if (up) up.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
  });
})();
