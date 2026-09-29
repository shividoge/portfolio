/* The small page furniture the project pages share with the home page: the
   scroll-progress line, the bar turning to plain ink over the footer's lilac
   frame, and the year. */
(function () {
  'use strict';
  var bar = document.getElementById('scrollProgress'), nav = document.getElementById('nav'), ft = document.getElementById('foot');
  var yr = document.getElementById('year'); if (yr) yr.textContent = new Date().getFullYear();
  var busy = false;
  function update() {
    busy = false;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    if (bar) bar.style.width = (docH > 0 ? Math.min(100, (window.scrollY / docH) * 100) : 0) + '%';
    if (nav && ft) { var r = ft.getBoundingClientRect(); nav.classList.toggle('over-frame', r.top < 40 && r.bottom > 40); }
  }
  window.addEventListener('scroll', function () { if (!busy) { busy = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', update);
  window.addEventListener('load', update);
  update();
})();
