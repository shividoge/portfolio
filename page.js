/* ===========================================================================
   Renders a project page from window.PROJECTS (identity, links, order) and
   window.PAGES (the write-up), so a fact is written once. The page opens on a
   generative scene in the project's material (art.js), then its sections
   (diagrams.js, or the project's own explorer), then the next project.
   =========================================================================== */
(function () {
  'use strict';

  var id = document.body.getAttribute('data-project');
  var PROJ = window.PROJECTS || [], PAGES = window.PAGES || {};
  var P = PROJ.filter(function (p) { return p.id === id; })[0], G = PAGES[id];
  var host = document.getElementById('page');
  if (!P || !G || !host) return;
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  var BG = { fpga: '#0A0B12', pcb: '#0A1810', env: '#07171B', robotics: '#121110', fsam: '#F3EFE4', hydro: '#07150E' };
  var THEME_OF = { fpga: 'fpga', pcb: 'pcb', envpcb: 'env', robotics: 'robotics', fsam: 'fsam', hydro: 'hydro' };

  function h(tag, cls, html, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function plain(s) { var d = document.createElement('div'); d.innerHTML = s; return d.textContent; }

  /* ------------------------------------------------------------------ hero */
  var hero = h('section', 'ph');
  var cv = h('canvas', 'ph-art', null, { 'aria-hidden': 'true' });
  hero.appendChild(cv);
  hero.appendChild(h('p', 'lbl ph-status', G.status));
  var inner = h('div', 'pp-in');
  inner.appendChild(h('p', 'lbl ph-k', '<span><i></i></span><b>' + P.n + '</b><span>' + plain(P.tag) + '</span>'));

  var h1 = h('h1', 'ph-h', null, { 'aria-label': plain(P.title) });
  var wi = 0;
  G.title.forEach(function (line, li) {
    if (li) h1.appendChild(document.createElement('br'));
    var tmp = document.createElement('div'); tmp.innerHTML = line.replace(/<a>/g, '\u0001').replace(/<\/a>/g, '\u0002');
    var txt = tmp.textContent, acc = false;
    txt.split(/(\s+)/).forEach(function (tok) {
      if (!tok) return;
      if (/^\s+$/.test(tok)) { h1.appendChild(document.createTextNode(' ')); return; }
      var w = h('span', 'w'), inn = h('span', acc || tok.indexOf('\u0001') >= 0 ? 'a' : '', tok.replace(/[\u0001\u0002]/g, ''));
      if (tok.indexOf('\u0001') >= 0) acc = true;
      if (tok.indexOf('\u0002') >= 0) acc = false;
      inn.style.setProperty('--i', wi++);
      w.setAttribute('aria-hidden', 'true'); w.appendChild(inn); h1.appendChild(w);
    });
  });
  inner.appendChild(h1);
  inner.appendChild(h('p', 'ph-lede rv', G.lede, { style: '--d:.5s' }));
  inner.appendChild(h('p', 'lbl ph-meta rv', plain(P.meta), { style: '--d:.6s' }));
  var st = h('div', 'ph-stats rv', null, { style: '--d:.7s' });
  G.stats.forEach(function (s) {
    var d = h('div', 'ph-stat');
    var b = h('b', null, typeof s.v === 'number' ? '0' : s.v);
    if (typeof s.v === 'number') b.setAttribute('data-count', s.v);
    d.appendChild(b); d.appendChild(h('span', null, s.l)); st.appendChild(d);
  });
  inner.appendChild(st);
  hero.appendChild(inner);
  host.appendChild(hero);

  /* --------------------------------------------------------------- blocks */
  function section(b) {
    var sec = h('section', 'pb', null, { id: 's' + b.n });
    var c = h('div', 'pp-in'); sec.appendChild(c);
    return { sec: sec, c: c };
  }
  function head(b, lede) {
    var d = h('div', 'pb-head rv');
    var l = h('div'); l.appendChild(h('p', 'lbl pb-n', b.n)); l.appendChild(h('h2', 'pb-h', b.h)); d.appendChild(l);
    if (lede) d.appendChild(h('p', 'pb-lede', lede));
    return d;
  }
  function linksRow(items, one) {
    var row = h('div', 'pp-links rv');
    (items || []).forEach(function (l) {
      if (l.href) row.appendChild(h('a', 'pp-link', l.label + (l.ext ? ' <span aria-hidden="true">↗</span>' : ' <span aria-hidden="true">→</span>'), l.ext ? { href: l.href, target: '_blank', rel: 'noopener' } : { href: l.href }));
      else row.appendChild(h('span', 'pp-link is-pending', l.label, { 'aria-disabled': 'true' }));
    });
    if (one) row.appendChild(h('a', 'pp-link', one.label + ' <span aria-hidden="true">→</span>', { href: one.href, 'data-pa': one.pa || '', 'data-dest': one.dest || '' }));
    return row;
  }

  var FPGA = '<div class="fpanel on-dark rv"><div class="fp-rail"><span class="vert">SMART SYSTEMS LAB</span></div>'
    + '<div class="fp-stage"><div class="spinner" id="fpgaSpinner"></div><div class="fp-ctl"><span class="fp-hint">Drag to rotate</span><button type="button" class="wipe" id="fpgaToggle" aria-pressed="false">Pause</button></div></div>'
    + '<div class="fp-side on-dark"><div class="fp-stats"><div><span class="lbl">Since</span><b class="num">AUG<span class="unit"> 2026</span></b></div><div><span class="lbl">Language</span><b class="p">SystemVerilog</b></div><div><span class="lbl">Toolchain</span><b class="p">Vivado / Vitis</b></div><div><span class="lbl">Role</span><b>Research asst.</b></div></div>'
    + '<p>The ALU and datapath first, as the RTL foundation for a quantized neural-network inference accelerator. Choose a milestone to see where it sits in the plan.</p>'
    + '<p class="lbl fp-lbl">Milestones</p><table class="sched"><tr><td>ALU — add / sub / mul</td><td>in progress</td></tr><tr class="now"><td>Datapath + regfile</td><td>now</td></tr><tr><td>Quantized NN accelerator</td><td>next phase</td></tr><tr><td>Near-sensor inference</td><td>target</td></tr></table>'
    + '<a class="fp-link lbl" href="https://faculty.eng.ufl.edu/smartsystems/" target="_blank" rel="noopener">Smart Systems Lab &nbsp;↗</a></div></div>';

  G.blocks.forEach(function (b) {
    var S = section(b), c = S.c;
    if (b.t === 'story') {
      var g = h('div', 'pb-story');
      var l = h('div', 'rv'); l.appendChild(h('p', 'lbl pb-n', b.n)); l.appendChild(h('h2', 'pb-h', b.h));
      if (b.aside) {
        var as = h('div', 'pb-aside', null, { style: 'margin-top:2rem' });
        as.appendChild(h('p', 'lbl', b.aside.h));
        var ul = h('ul', 'pb-list'); b.aside.items.forEach(function (x) { ul.appendChild(h('li', null, x)); }); as.appendChild(ul);
        l.appendChild(as);
      }
      var r = h('div', 'rv', null, { style: '--d:.1s' });
      r.appendChild(h('p', 'lead', b.lead));
      b.p.forEach(function (t) { r.appendChild(h('p', null, t)); });
      var chips = h('div', 'chips'); P.tags.forEach(function (t) { chips.appendChild(h('span', 'tag', t)); }); r.appendChild(chips);
      g.appendChild(l); g.appendChild(r); c.appendChild(g);
    } else if (b.t === 'fpga') {
      c.appendChild(head(b, b.lede)); var w = h('div', 'pb-ex'); w.innerHTML = FPGA; c.appendChild(w);
    } else if (b.t === 'diagram') {
      c.appendChild(head(b, b.lede));
      var f = h('div', 'dg rv'); var d = window.PageDiagrams && window.PageDiagrams[b.id];
      if (d) f.appendChild(d());
      if (b.note) f.appendChild(h('p', 'dg-cap', b.note));
      c.appendChild(f);
    } else if (b.t === 'explorer') {
      c.appendChild(head(b, b.lede)); var w2 = h('div', 'pb-ex'); w2.appendChild(h('div', 'proj-bench', null, { id: b.mount })); c.appendChild(w2);
    } else if (b.t === 'timeline') {
      c.appendChild(head(b, b.lede));
      var ol = h('ol', 'tl2 rv', null, { style: '--cols:' + (b.cols || b.items.length) });
      b.items.forEach(function (it) {
        var li = h('li', it.s === 'now' ? 'is-now' : (it.s === 'done' ? 'is-done' : ''));
        li.innerHTML = '<span class="lbl d">' + it.d + '</span><h3>' + it.h + '</h3><p>' + it.p + '</p>';
        ol.appendChild(li);
      });
      c.appendChild(ol);
      if (b.note) c.appendChild(h('p', 'dg-cap rv', b.note));
    } else if (b.t === 'numbers') {
      c.appendChild(head(b, b.lede));
      var nm = h('div', 'nums rv', null, { style: '--cols:' + (b.cols || b.items.length) });
      b.items.forEach(function (it) {
        var d2 = h('div'); var bb = h('b', null, '0' + (it.s || '')); bb.setAttribute('data-count', it.v); if (it.s) bb.setAttribute('data-suffix', it.s);
        d2.appendChild(bb); d2.appendChild(h('span', null, it.l)); nm.appendChild(d2);
      });
      c.appendChild(nm);
    } else if (b.t === 'facts') {
      var g2 = h('div', 'pb-story');
      var l2 = h('div', 'rv'); l2.appendChild(h('p', 'lbl pb-n', b.n)); l2.appendChild(h('h2', 'pb-h', b.h));
      var dl = h('dl', 'facts rv', null, { style: '--d:.1s' });
      b.items.forEach(function (kv) { var d3 = h('div'); d3.appendChild(h('dt', 'lbl', kv[0])); d3.appendChild(h('dd', null, kv[1])); dl.appendChild(d3); });
      var r2 = h('div'); r2.appendChild(dl);
      if (b.note) r2.appendChild(h('p', 'dg-cap rv', b.note));
      var lk = (b.links || (P.links || []).filter(function () { return false; }));
      if (lk.length || b.link) r2.appendChild(linksRow(lk, b.link));
      g2.appendChild(l2); g2.appendChild(r2); c.appendChild(g2);
    }
    host.appendChild(S.sec);
  });

  /* ----------------------------------------------------------- next project */
  var i = PROJ.indexOf(P), N = PROJ[(i + 1) % PROJ.length], nt = THEME_OF[N.id];
  var a = h('a', 'pp-next', null, { href: N.page, 'data-pa': N.accent, 'data-dest': N.n + ' · ' + plain(N.title) });
  a.style.setProperty('--na', N.accent); a.style.setProperty('--nbg', BG[nt]);
  var ai = h('div', 'pp-in');
  ai.appendChild(h('p', 'lbl', 'Next project · ' + N.n));
  ai.appendChild(h('h2', null, '<span>' + N.short + ' →</span>'));
  ai.appendChild(h('div', 'go lbl', plain(N.tag)));
  a.appendChild(ai); host.appendChild(a);

  /* ------------------------------------------------------------ motion glue */
  function countUp(el) {
    var to = parseFloat(el.getAttribute('data-count')), suf = el.getAttribute('data-suffix') || '';
    if (reduce) { el.textContent = to + suf; return; }
    var t0 = performance.now(), D = 1200;
    (function step(now) {
      var k = Math.min(1, (now - t0) / D), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(to * e) + suf;
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }
  var seen = function (el) {
    el.classList.add('is-in');
    [].slice.call(el.querySelectorAll('[data-count]')).forEach(countUp);
  };
  var rvs = [].slice.call(document.querySelectorAll('.rv'));
  if (window.IntersectionObserver) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { seen(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.12 });
    rvs.forEach(function (el) { io.observe(el); });
  } else rvs.forEach(seen);

  /* the hero opens once the loading screen has lifted */
  function openHero() { hero.classList.add('is-in'); }
  var booting = document.documentElement.classList.contains('boot');
  if (booting) {
    var w = setInterval(function () { if (!document.documentElement.classList.contains('boot')) { clearInterval(w); setTimeout(openHero, 60); } }, 80);
    setTimeout(function () { clearInterval(w); openHero(); }, 5000);
  } else requestAnimationFrame(function () { requestAnimationFrame(openHero); });

  if (window.PageArt) window.PageArt.start(cv, G.art);
})();
