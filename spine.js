/* ===========================================================================
   Circuit spine
   ---------------------------------------------------------------------------
   One copper trace runs the whole length of the page, routed down the left
   gutter with 45-degree corners and a via at every section boundary, drawn
   progressively as you scroll.

   It is the page's structure made literal: the sections stop being separated
   by hairlines and start being stops on a board. Decorative only — the route
   carries no information that is not already in the headings — so it is
   aria-hidden, and it is dropped below 1100px where there is no gutter to
   live in.
   =========================================================================== */
(function () {
  'use strict';

  var host = document.getElementById('spine');
  var main = document.getElementById('main');
  if (!host || !main) return;

  var NS = 'http://www.w3.org/2000/svg';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var wide   = window.matchMedia('(min-width: 1101px)');

  var svg, bed, live, vias = [], total = 0, stops = [];

  function lanes() {
    var vw = document.documentElement.clientWidth;
    var container = Math.min(1400, vw);
    var left = (vw - container) / 2;
    return [left + 18, left + 38];
  }

  /* Route the trace: straight runs in one lane, a 45-degree jog across to the
     other lane at each section boundary. dx === dy is what makes it 45. */
  function build() {
    host.innerHTML = '';
    vias = [];
    stops = [];

    var h = main.offsetHeight;
    var L = lanes();
    var JOG = 20;

    var secs = Array.prototype.slice.call(main.querySelectorAll('section[id]'));
    var mainTop = main.getBoundingClientRect().top + window.scrollY;

    /* The opening is a dark full-bleed block with its own object in it; a warm
       hairline down it would read as a stray line, so the spine starts where
       the page proper does. */
    var hero = document.getElementById('top');
    var startY = hero ? Math.round(hero.getBoundingClientRect().bottom + window.scrollY - mainTop) : 0;

    secs.forEach(function (sec) {
      var y = sec.getBoundingClientRect().top + window.scrollY - mainTop;
      if (y > startY + JOG * 2 && y < h - JOG * 2) stops.push(Math.round(y));
    });
    stops.sort(function (a, b) { return a - b; });

    svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + document.documentElement.clientWidth + ' ' + h);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', h);

    var d = '', lane = 0;
    d += 'M ' + L[0] + ' ' + startY;
    stops.forEach(function (y) {
      var from = L[lane], to = L[1 - lane];
      d += ' L ' + from + ' ' + (y - JOG);
      d += ' L ' + to + ' ' + y;        /* the 45-degree corner */
      lane = 1 - lane;
    });
    d += ' L ' + L[lane] + ' ' + h;

    bed = document.createElementNS(NS, 'path');
    bed.setAttribute('class', 'trace-bed');
    bed.setAttribute('d', d);
    svg.appendChild(bed);

    live = document.createElementNS(NS, 'path');
    live.setAttribute('class', 'trace-live');
    live.setAttribute('d', d);
    svg.appendChild(live);

    /* a via wherever the trace changes lane */
    var lane2 = 0;
    stops.forEach(function (y) {
      var x = L[1 - lane2];
      var ring = document.createElementNS(NS, 'circle');
      ring.setAttribute('class', 'via');
      ring.setAttribute('cx', x); ring.setAttribute('cy', y); ring.setAttribute('r', 4.5);
      svg.appendChild(ring);

      var core = document.createElementNS(NS, 'circle');
      core.setAttribute('class', 'via-live');
      core.setAttribute('cx', x); core.setAttribute('cy', y); core.setAttribute('r', 2);
      svg.appendChild(core);

      vias.push({ y: y, el: core, lit: false });
      lane2 = 1 - lane2;
    });

    host.appendChild(svg);

    total = live.getTotalLength();
    live.style.strokeDasharray = total;
    live.style.strokeDashoffset = reduce ? 0 : total;
    if (reduce) vias.forEach(function (v) { v.el.classList.add('on'); v.lit = true; });
  }

  /* Draw to wherever the reader has got to. */
  function draw() {
    if (!live || reduce) return;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    var p = docH > 0 ? Math.min(1, Math.max(0, window.scrollY / docH)) : 0;
    live.style.strokeDashoffset = (total * (1 - p)).toFixed(1);

    /* light each via as the reader passes it */
    var reached = window.scrollY + window.innerHeight * 0.55
                  - (main.getBoundingClientRect().top + window.scrollY);
    for (var i = 0; i < vias.length; i++) {
      var on = vias[i].y <= reached;
      if (on !== vias[i].lit) { vias[i].lit = on; vias[i].el.classList.toggle('on', on); }
    }
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () { draw(); ticking = false; });
  }

  var reflow;
  function onResize() {
    clearTimeout(reflow);
    reflow = setTimeout(function () { if (wide.matches) { build(); draw(); } }, 180);
  }

  function start() {
    if (!wide.matches) { host.innerHTML = ''; return; }
    build();
    draw();
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);
  if (wide.addEventListener) wide.addEventListener('change', start);

  /* the page grows as fonts swap and the sequence sizes itself, so measure late */
  start();
  window.addEventListener('load', function () { setTimeout(start, 400); });
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { setTimeout(start, 200); });
})();
