/* ===========================================================================
   Look inside the FPGA.  (Currently building)

   The rotating package shows what the part is. This shows what is being put
   in it: the CPU at the Smart Systems Lab, block by block, with each block
   coloured by where the work actually stands. The four milestones in the
   table beside it are the source of truth, so choosing a row lights its
   blocks and choosing a block lights its row.

   It is a block-level plan, not a placed-and-routed result, and the panel
   says so: positions are illustrative. What is fixed by the project is the
   list of blocks and their order: ALU (add, subtract, multiply) first, then
   the datapath and register file, then a quantized neural-network
   accelerator, then low-latency near-sensor inference.
   =========================================================================== */
(function () {
  'use strict';

  var stage = document.querySelector('.fp-stage');
  var rows = [].slice.call(document.querySelectorAll('.sched tr'));
  if (!stage || rows.length < 4) return;

  var NS = 'http://www.w3.org/2000/svg';
  function s(tag, attrs, text) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    return e;
  }
  function h(tag, cls, html, attrs) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  /* -------------------------------------------------------- what each is */
  var STATUS = { progress: 'In progress', now: 'Now', next: 'Next phase', target: 'Target' };
  var BLK = {
    alu:  { t: 'ALU', sub: 'add · sub · mul', st: 'progress', row: 0,
            head: 'ALU: add, subtract, multiply',
            text: 'The arithmetic core, and the first thing being built: addition, subtraction and multiplication, written in Verilog and SystemVerilog.' },
    reg:  { t: 'Register file', sub: 'operands · results', st: 'now', row: 1,
            head: 'Register file',
            text: 'Holds the operands and results between operations. Being built alongside the datapath.' },
    path: { t: 'Datapath', sub: 'operands in · result back', st: 'now', row: 1,
            head: 'Datapath',
            text: 'Carries operands from the register file through the ALU and writes the result back. This is the RTL foundation the accelerator will extend.' },
    nn:   { t: 'Quantized NN accelerator', sub: 'inference on the fabric', st: 'next', row: 2,
            head: 'Quantized neural-network accelerator',
            text: 'The reason for building a CPU here first: extend the ALU and datapath into an accelerator for quantized neural-network inference, following the lab’s published approach to accelerating hybrid quantized networks on multi-tenant FPGAs.' },
    near: { t: 'Near-sensor inference', sub: 'compute beside the data', st: 'target', row: 3,
            head: 'Low-latency, near-sensor inference',
            text: 'The target: move the compute to the data rather than the data to the compute. Builds on the lab’s FPGA-based near-sensor image-processing accelerator research.' }
  };
  var ORDER = ['alu', 'reg', 'path', 'nn', 'near'];
  var ROW_BLOCKS = { 0: ['alu'], 1: ['reg', 'path'], 2: ['nn'], 3: ['near'] };

  /* --------------------------------------------------------------- layout */
  /* two drawings of the same plan: one wide, one tall for a phone */
  var LAYOUT = {
    wide: {
      vb: [860, 500],
      chip: [150, 20, 690, 470, 'FPGA fabric', 172, 46],
      cpu:  [176, 62, 372, 330, 'CPU'],
      blk: {
        reg:  [204, 104, 132, 108],
        alu:  [388, 104, 132, 108],
        path: [204, 262, 316, 84],
        nn:   [582, 62, 232, 232],
        near: [582, 322, 232, 110]
      },
      sensor: [24, 352, 96, 70],
      links: [
        ['M336 148H388', 'op'], ['M336 176H388', 'op'],                       /* regfile to ALU: two operands */
        ['M454 212V262', 'res'], ['M270 262V212', 'res'],                     /* ALU down the datapath and back up into the regfile */
        ['M548 178H582', 'ext'],                                              /* the CPU extends into the accelerator */
        ['M698 322V294', 'ext'],                                              /* the interface feeds it */
        ['M120 387H582', 'sig']                                               /* the sensor into the fabric */
      ],
      cap: [176, 410]
    },
    tall: {
      vb: [400, 720],
      chip: [12, 12, 376, 566, 'FPGA fabric', 30, 34],
      cpu:  [28, 50, 344, 232, 'CPU'],
      blk: {
        reg:  [44, 84, 148, 84],
        alu:  [208, 84, 148, 84],
        path: [44, 196, 312, 62],
        nn:   [28, 300, 344, 122],
        near: [28, 448, 344, 110]
      },
      sensor: [100, 626, 200, 66],
      links: [
        ['M192 118H208', 'op'], ['M192 140H208', 'op'],
        ['M282 168V196', 'res'], ['M118 196V168', 'res'],
        ['M200 282V300', 'ext'],
        ['M200 448V422', 'ext'],
        ['M200 626V558', 'sig']
      ],
      cap: null
    }
  };

  /* ------------------------------------------------------------- the view */
  var toggle = h('div', 'fm-tog', null, { role: 'group', 'aria-label': 'View of the FPGA' });
  var bPkg = h('button', 'fm-tb', 'Package', { type: 'button', 'aria-pressed': 'true' });
  var bIn  = h('button', 'fm-tb', 'Look inside', { type: 'button', 'aria-pressed': 'false' });
  toggle.appendChild(bPkg); toggle.appendChild(bIn);
  stage.appendChild(toggle);

  var fm = h('div', 'fm', null, { 'aria-hidden': 'true' });
  var legend = h('div', 'fm-legend');
  Object.keys(STATUS).forEach(function (k) {
    legend.appendChild(h('span', 'fm-lg fm-' + k, '<i></i>' + STATUS[k].toLowerCase()));
  });
  fm.appendChild(legend);

  var svgHost = h('div', 'fm-svg');
  fm.appendChild(svgHost);

  var card = h('div', 'fm-card', null, { 'aria-live': 'polite' });
  fm.appendChild(card);
  fm.appendChild(h('p', 'fm-note', 'A block-level plan drawn from the lab milestones. Positions are illustrative, not a placed-and-routed result.'));
  stage.appendChild(fm);

  var blkEls = {}, sel = 'alu', mode = null;

  function draw() {
    var m = matchMedia('(max-width:760px)').matches ? 'tall' : 'wide';
    if (m === mode) return; mode = m;
    var L = LAYOUT[m];
    svgHost.innerHTML = ''; blkEls = {};
    var svg = s('svg', { viewBox: '0 0 ' + L.vb[0] + ' ' + L.vb[1], class: 'fm-drawing', role: 'group', 'aria-label': 'Block plan of the FPGA design' });

    /* the chip and the CPU region */
    svg.appendChild(s('rect', { x: L.chip[0], y: L.chip[1], width: L.chip[2], height: L.chip[3], rx: 14, class: 'fm-chip' }));
    svg.appendChild(s('text', { x: L.chip[5], y: L.chip[6], class: 'fm-cl' }, L.chip[4]));
    svg.appendChild(s('text', { x: L.chip[0] + L.chip[2] - 20, y: L.chip[6], 'text-anchor': 'end', class: 'fm-cl' }, 'Vivado · Vitis'));
    svg.appendChild(s('rect', { x: L.cpu[0], y: L.cpu[1], width: L.cpu[2], height: L.cpu[3], rx: 10, class: 'fm-cpu' }));
    svg.appendChild(s('text', { x: L.cpu[0] + 14, y: L.cpu[1] + 22, class: 'fm-cl fm-cl-cpu' }, L.cpu[4] + ' · in progress'));

    /* wires first, so the blocks sit on top of them */
    L.links.forEach(function (lk) { svg.appendChild(s('path', { d: lk[0], class: 'fm-link fm-l-' + lk[1] })); });
    L.links.forEach(function (lk) { if (lk[1] === 'sig' || lk[1] === 'res') svg.appendChild(s('path', { d: lk[0], class: 'fm-flow fm-l-' + lk[1] })); });

    /* the sensor is outside the part */
    var sn = L.sensor;
    var gs = s('g', { class: 'fm-sensor' });
    gs.appendChild(s('rect', { x: sn[0], y: sn[1], width: sn[2], height: sn[3], rx: 8, class: 'fm-srect' }));
    gs.appendChild(s('text', { x: sn[0] + sn[2] / 2, y: sn[1] + sn[3] / 2 + 5, 'text-anchor': 'middle', class: 'fm-t1' }, 'Sensor'));
    svg.appendChild(gs);

    /* the blocks */
    ORDER.forEach(function (k) {
      var b = BLK[k], r = L.blk[k];
      var g = s('g', { class: 'fm-blk fm-' + b.st, tabindex: '0', role: 'button', 'data-b': k, 'aria-label': b.t + ', ' + STATUS[b.st] });
      g.appendChild(s('rect', { x: r[0], y: r[1], width: r[2], height: r[3], rx: 8, class: 'fm-rect' }));
      var cx = r[0] + r[2] / 2, cy = r[1] + r[3] / 2;
      if (k === 'nn') {
        /* a small multiply-accumulate array, so the box reads as compute and not a label */
        var cols = m === 'wide' ? 5 : 8, rws = m === 'wide' ? 3 : 2, cs = m === 'wide' ? 30 : 24, gap = m === 'wide' ? 12 : 10;
        var w0 = cols * cs + (cols - 1) * gap, x0 = cx - w0 / 2, y0 = r[1] + (m === 'wide' ? 100 : 56);
        for (var i = 0; i < rws; i++) for (var j = 0; j < cols; j++)
          g.appendChild(s('rect', { x: x0 + j * (cs + gap), y: y0 + i * (cs * 0.8 + gap * 0.8), width: cs, height: cs * 0.8, rx: 3, class: 'fm-mac' }));
        g.appendChild(s('text', { x: cx, y: r[1] + 34, 'text-anchor': 'middle', class: 'fm-t1' }, b.t));
        g.appendChild(s('text', { x: cx, y: r[1] + 54, 'text-anchor': 'middle', class: 'fm-t2' }, b.sub));
      } else {
        g.appendChild(s('text', { x: cx, y: cy - 4, 'text-anchor': 'middle', class: 'fm-t1' }, b.t));
        g.appendChild(s('text', { x: cx, y: cy + 17, 'text-anchor': 'middle', class: 'fm-t2' }, b.sub));
      }
      svg.appendChild(g); blkEls[k] = g;
    });
    svgHost.appendChild(svg);
    choose(sel, false);
  }

  function choose(k, fromRow) {
    sel = k;
    var B = BLK[k];
    ORDER.forEach(function (x) { if (blkEls[x]) blkEls[x].classList.toggle('is-sel', x === k); });
    var group = ROW_BLOCKS[B.row];
    ORDER.forEach(function (x) { if (blkEls[x]) blkEls[x].classList.toggle('is-kin', group.indexOf(x) !== -1 && x !== k); });
    rows.forEach(function (r, i) { r.classList.toggle('fm-rowsel', i === B.row); });
    card.innerHTML = '';
    var top = h('div', 'fm-ctop');
    top.appendChild(h('p', 'fm-ch', B.head));
    top.appendChild(h('span', 'fm-pill fm-p-' + B.st, STATUS[B.st]));
    card.appendChild(top);
    card.appendChild(h('p', 'fm-ct', B.text));
  }

  svgHost.addEventListener('click', function (e) { var g = e.target.closest('.fm-blk'); if (g) choose(g.getAttribute('data-b')); });
  svgHost.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    var g = e.target.closest('.fm-blk'); if (g) { e.preventDefault(); choose(g.getAttribute('data-b')); }
  });

  /* the milestone table drives the same selection */
  rows.forEach(function (r, i) {
    r.classList.add('fm-row');
    r.tabIndex = 0;
    r.setAttribute('role', 'button');
    r.setAttribute('aria-label', r.cells[0].textContent.trim() + ', ' + r.cells[1].textContent.trim() + '. Show it in the plan.');
    function go() { choose(ROW_BLOCKS[i][0]); if (stage.getAttribute('data-view') !== 'inside') setView('inside'); }
    r.addEventListener('click', go);
    r.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
  });

  function setView(v) {
    stage.setAttribute('data-view', v);
    bPkg.setAttribute('aria-pressed', v === 'package' ? 'true' : 'false');
    bIn.setAttribute('aria-pressed', v === 'inside' ? 'true' : 'false');
    fm.setAttribute('aria-hidden', v === 'inside' ? 'false' : 'true');
    if (v === 'inside') draw();
  }
  bPkg.addEventListener('click', function () { setView('package'); });
  bIn.addEventListener('click', function () { setView('inside'); });

  var rt = 0;
  window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(function () { if (stage.getAttribute('data-view') === 'inside') { mode = null; draw(); } }, 150); });

  stage.setAttribute('data-view', 'package');
  draw();
})();
