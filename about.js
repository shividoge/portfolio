/* ===========================================================================
   The About statement, annotated.

   One paragraph set large, whose words go from faint to full as the reader
   scrolls through it (portal.js drives that while the page grows out of the
   chip's display). Every phrase that stands for a project is a link to that
   project's own page, and beside the paragraph a note for each one says what
   the phrase actually refers to, joined to it by a line that draws as the
   phrase is read. So the statement is not a claim: it is an index.

   Without a wide window, or with reduced motion, nothing is faded or drawn:
   the paragraph is simply there in full, the phrases are links, and the notes
   sit below it as a list.
   =========================================================================== */
(function () {
  'use strict';
  var el = document.getElementById('aboutText');
  if (!el) return;

  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var WIDE = matchMedia('(min-width: 1000px)');
  var words = [], groups = [];
  var PJ = {};
  function projects() { (window.PROJECTS || []).forEach(function (p) { PJ[p.id] = p; }); }

  /* what each phrase refers to */
  var NOTE = {
    envpcb:   ['A board that logs four channels', 'Teensy 4 and a BME680 on one shared 3.3 V I²C bus.'],
    hydro:    ['A chamber that weighs its plant', 'Closed-loop, with a camera pipeline at 6.9% mean error.'],
    robotics: ['A program I led to the World Championship', '20 to 100+ members across nine teams, and the Rising All-Star Award at Worlds.'],
    fpga:     ['A CPU, ALU and datapath first', 'SystemVerilog in the Smart Systems Lab, toward a quantized NN accelerator.'],
    pcb:      ['One board for every system', 'Sole electrical designer on a ten-person team.']
  };
  var NASA = ['The NASA Kennedy Space Center Award', 'Southeastern Science and Engineering Fair, for the spaceflight-viability of the research.'];

  /* A space follows a word only where the source had one: the last word of an
     <em> must not gain a space in front of the full stop that comes after it. */
  function wrap(text, em, into, trailingSpace, dp) {
    var parts = text.split(/\s+/).filter(Boolean), made = [];
    parts.forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'about-w' + (em ? ' is-em' : '');
      s.textContent = w;
      into.appendChild(s);
      if (i < parts.length - 1 || (trailingSpace && !dp)) into.appendChild(document.createTextNode(' '));
      words.push(s); made.push(s);
    });
    return made;
  }

  var nodes = [].slice.call(el.childNodes);
  el.textContent = '';
  var order = 0;
  nodes.forEach(function (n, i) {
    var txt = n.textContent;
    if (n.nodeType === 3) {
      var lead = /^\s/.test(txt) && el.lastChild ? ' ' : '';
      if (lead) el.appendChild(document.createTextNode(lead));
      wrap(txt, false, el, /\s$/.test(txt));
    } else if (n.nodeType === 1) {
      var next = nodes[i + 1] ? nodes[i + 1].textContent : '';
      var dp = n.getAttribute('data-p'), host = el, a = null;
      if (dp) { a = document.createElement('a'); a.className = 'about-a'; a.href = '#'; el.appendChild(a); host = a; }
      var made = wrap(txt, true, host, !next || /^\s/.test(next), dp);
      if (dp) {
        a.setAttribute('data-p', dp);
        groups.push({ id: dp, a: a, words: made, nasa: /NASA/.test(txt), n: order++ });
        if (!next || /^\s/.test(next)) el.appendChild(document.createTextNode(' '));
      }
    }
  });

  window.__aboutWords = words;          /* portal.js drives them while the page grows out of the display */

  /* ------------------------------------------------------------- the notes */
  var list = document.getElementById('aboutNotes'), lines = document.getElementById('aboutLines'), body = document.getElementById('aboutBody');
  var notes = [];
  function build() {
    projects();
    groups.forEach(function (g) {
      var p = PJ[g.id]; if (!p) return;
      var t = g.nasa ? NASA : NOTE[g.id];
      g.a.href = p.page; g.a.setAttribute('data-pa', p.accent); g.a.setAttribute('data-dest', p.n + ' · ' + p.short);
      g.a.style.setProperty('--pc', p.accent);
      var sup = document.createElement('sup'); sup.className = 'about-sup'; sup.textContent = p.n; sup.setAttribute('aria-hidden', 'true'); g.a.appendChild(sup);
      if (!list) return;
      var li = document.createElement('li'); li.className = 'about-note'; li.style.setProperty('--pc', p.accent);
      li.innerHTML = '<a href="' + p.page + '" data-pa="' + p.accent + '" data-dest="' + p.n + ' · ' + p.short + '"><span class="lbl">' + p.n + ' · ' + p.short + '</span><b>' + t[0] + '</b><span class="about-note-s">' + t[1] + '</span></a>';
      list.appendChild(li);
      var path = null;
      if (lines) { path = document.createElementNS('http://www.w3.org/2000/svg', 'path'); path.setAttribute('pathLength', '1'); path.setAttribute('class', 'about-line'); lines.appendChild(path); }
      notes.push({ g: g, li: li, path: path });
    });
  }

  /* place each note level with its phrase, then push apart what would touch */
  function pos(w) { var x = 0, y = 0, e = w; while (e && e !== body) { x += e.offsetLeft; y += e.offsetTop; e = e.offsetParent; } return { x: x, y: y, w: w.offsetWidth, h: w.offsetHeight }; }
  function layout() {
    if (!body || !notes.length) return;
    var wide = WIDE.matches;
    body.classList.toggle('is-wide', wide);
    if (!wide) { notes.forEach(function (n) { n.li.style.top = ''; n.li.classList.add('is-on'); }); if (lines) lines.style.display = 'none'; return; }
    if (lines) lines.style.display = '';
    var bw = body.offsetWidth, bh = el.offsetHeight, GAP = 10;
    var tx = el.offsetWidth + 56, nx = tx;
    var items = notes.map(function (n) {
      var lw = n.g.words[0], p = pos(lw);
      return { n: n, wy: p.y + p.h / 2, wx: p.x + p.w, h: n.li.offsetHeight };
    }).sort(function (a, b) { return a.wy - b.wy; });
    var y = 0;
    items.forEach(function (it) { it.top = Math.max(y, it.wy - it.h / 2); y = it.top + it.h + GAP; });
    var total = Math.max(bh, y - GAP);
    body.style.minHeight = total > bh + 1 ? Math.ceil(total) + 'px' : '';     /* room for every note */
    if (lines) { lines.setAttribute('viewBox', '0 0 ' + bw + ' ' + total); lines.style.height = total + 'px'; }
    var edge = el.offsetWidth + 2;
    items.forEach(function (it) {
      it.n.li.style.top = it.top + 'px';
      if (it.n.path) {
        var ny = it.top + Math.min(it.h / 2, 26), mid = Math.max(edge + 14, nx - 28);
        it.n.path.setAttribute('d', 'M' + edge + ' ' + it.wy + ' H' + mid + ' V' + ny + ' H' + (nx - 4));
      }
    });
    sync();
  }

  /* a note appears once its phrase has been read */
  function sync() {
    var pinned = !!window.__aboutPinned;
    notes.forEach(function (n) {
      var w = n.g.words[n.g.words.length - 1];
      var on = !pinned || parseFloat(w.style.opacity || '0') >= 0.97;
      n.li.classList.toggle('is-on', on);
      if (n.path) n.path.classList.toggle('is-on', on);
    });
  }
  window.__aboutSync = sync;

  function start() { build(); layout(); setTimeout(layout, 400); setTimeout(layout, 1500); if (window.ResizeObserver) notes.forEach(function (n) { new ResizeObserver(layout).observe(n.li); }); }
  window.addEventListener('resize', function () { layout(); });
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  window.addEventListener('load', layout);
  if (window.ResizeObserver && body) new ResizeObserver(function () { layout(); }).observe(body);

  if (reduce) { window.__aboutPinned = false; return; }
  /* On a wide window the opening is pinned and portal.js reveals the words
     itself, so this scroll-scrub would fight it. */
  if (matchMedia('(min-width: 1000px) and (min-height: 640px)').matches) return;

  function init() {
    if (!window.gsap || !window.ScrollTrigger) return;
    gsap.registerPlugin(ScrollTrigger);
    /* Unread words are dimmed but never illegible: at this size WCAG asks for
       3:1, which ink on paper holds down to about 0.5 opacity, and the accent
       needs a higher floor (0.7) because purple starts out lighter than ink. */
    gsap.fromTo(words, { opacity: function (i, e) { return e.classList.contains('is-em') ? 0.7 : 0.5; } }, {
      opacity: 1, ease: 'none', stagger: 0.14,
      scrollTrigger: { trigger: el, start: 'top 82%', end: 'bottom 52%', scrub: 0.5 }
    });
  }
  if (document.readyState === 'complete') init();
  else window.addEventListener('load', init);
})();
