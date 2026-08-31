/* ===========================================================================
   03 · Capability orbit
   ---------------------------------------------------------------------------
   Ten capability pads on a slowly rotating ring, wired to the projects that
   earned them. Hovering previews a pad in the rail; clicking pins it, stops the
   rotation, eases the pad to the top and draws traces to whatever it feeds.

   Notes on the things that are easy to get wrong here:
     * the rotation is real continuous motion, so it needs a visible pause
       control (WCAG 2.2.2) and it stops on hover, on focus and under
       prefers-reduced-motion
     * the pads are real <button>s in reading order, so the whole thing is
       keyboard operable and the rail is a live region — the orbit is a
       presentation of the list, never the only way to reach the content
     * radius is derived from the container, so it survives narrow screens
   =========================================================================== */
(function () {
  'use strict';

  var wrap = document.getElementById('orbitWrap');
  if (!wrap) return;

  var stage    = document.getElementById('orbitStage');
  var nodeHost = document.getElementById('orbitNodes');
  var linkSvg  = document.getElementById('orbitLinks');
  var toggle   = document.getElementById('orbitToggle');
  var togLabel = document.getElementById('orbitToggleLabel');
  var reduce   = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var I = {
    chip:  '<rect x="7" y="7" width="10" height="10" rx="1"/><path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4"/>',
    board: '<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.4"/><circle cx="15.5" cy="15.5" r="1.4"/><path d="M8.5 10v3.5a1.5 1.5 0 0 0 1.5 1.5h4"/>',
    wave:  '<path d="M2 12h3l2.5-7 4 14 3-10 2 3h5.5"/>',
    lens:  '<circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.8"/><path d="M12 4.5v3M12 16.5v3M4.5 12h3M16.5 12h3"/>',
    bot:   '<rect x="4" y="8" width="16" height="12" rx="2.5"/><path d="M12 4v4"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/>',
    win:   '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><circle cx="6.4" cy="6.5" r=".7"/><circle cx="9" cy="6.5" r=".7"/>',
    term:  '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7.5 9.5l3 2.5-3 2.5M13 15h4"/>',
    sigma: '<path d="M17.5 5h-11l6.5 7-6.5 7h11"/>',
    grid:  '<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18M15 3v18M3 9h18M3 15h18"/>',
    clock: '<circle cx="12" cy="12" r="8"/><path d="M12 7.5V12l3 2"/>'
  };

  var DATA = [
    { id:'embedded', label:'Embedded C',   cat:'Firmware',    icon:I.chip,  status:'shipped',  depth:85,
      desc:'Firmware for the hydroponic chamber and the control loop it ran. The language I reach for when the timing has to be provable, not just fast.',
      links:['pcb','sensors','robotics'] },
    { id:'pcb', label:'PCB / KiCad',       cat:'Hardware',    icon:I.board, status:'shipped',  depth:70,
      desc:'A custom I²C board around a Teensy and a BME680 — schematic, layout, and the bring-up when it did not work the first time.',
      links:['embedded','sensors','fpga'] },
    { id:'sensors', label:'Sensor I/O',    cat:'Hardware',    icon:I.wave,  status:'shipped',  depth:80,
      desc:'I²C bus architecture and environmental sensing. Also where I learned a sensor can keep reporting long after it stops telling the truth.',
      links:['embedded','pcb','vision'] },
    { id:'vision', label:'Vision',         cat:'Software',    icon:I.lens,  status:'shipped',  depth:65,
      desc:'OpenCV in Python — HSV and Excess Green Index segmentation, regressed against live sensor data to track plant health across trials.',
      links:['sensors','fullstack'] },
    { id:'robotics', label:'Robotics',     cat:'Control',     icon:I.bot,   status:'shipped',  depth:80,
      desc:'Java on the RoboRIO, C++ on VEX, four seasons of it — plus the version control and wireless deploys that kept a hundred-person team from bricking a robot.',
      links:['embedded','rtos'] },
    { id:'fullstack', label:'Full-stack',  cat:'Software',    icon:I.win,   status:'shipped',  depth:70,
      desc:'JavaScript over a MongoDB schema I designed for roughly a thousand QR-tagged products. Two authenticated surfaces, running a real business.',
      links:['linux','vision'] },
    { id:'linux', label:'Linux / Infra',   cat:'Systems',     icon:I.term,  status:'shipped',  depth:60,
      desc:'Server administration and repository access for FLSAM Region 4a, including a full webmaster handoff with no downtime for the teams depending on it.',
      links:['fullstack'] },
    { id:'matlab', label:'MATLAB',         cat:'Building next', icon:I.sigma, status:'building', depth:15,
      desc:'Not on my résumé yet, on purpose. Model-based control design is the gap between sketching a loop and being able to prove it before it runs.',
      links:['robotics','rtos'] },
    { id:'fpga', label:'FPGA / VHDL',      cat:'Building next', icon:I.grid, status:'building', depth:10,
      desc:'The one that turns the die diagram above from a drawing into something I could actually help design. First target of year one.',
      links:['pcb','embedded'] },
    { id:'rtos', label:'RTOS',             cat:'Building next', icon:I.clock, status:'building', depth:20,
      desc:'Deterministic task scheduling and bounded interrupt latency — the whole promise of the safety island on that chip.',
      links:['embedded','robotics','matlab'] }
  ];

  var byId = {};
  DATA.forEach(function (d, i) { d.i = i; byId[d.id] = d; });

  /* ---------------- build ---------------- */
  var NS = 'http://www.w3.org/2000/svg';
  var nodes = DATA.map(function (d, i) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'orbit-node';
    b.dataset.status = d.status;
    b.dataset.id = d.id;
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', d.label + '. ' +
      (d.status === 'shipped' ? 'Shipped with.' : 'Building next.') + ' Show detail.');
    b.innerHTML =
      '<span class="orbit-pad"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
      d.icon + '</svg></span>' +
      '<span class="orbit-label">' + d.label + '</span>';
    nodeHost.appendChild(b);
    return b;
  });

  var lines = DATA.map(function () {
    var ln = document.createElementNS(NS, 'line');
    linkSvg.appendChild(ln);
    return ln;
  });

  /* ---------------- rail ---------------- */
  var el = {
    index: document.getElementById('capIndex'),
    cat:   document.getElementById('capCat'),
    status:document.getElementById('capStatus'),
    name:  document.getElementById('capName'),
    desc:  document.getElementById('capDesc'),
    depth: document.getElementById('capDepth'),
    depthV:document.getElementById('capDepthVal'),
    linked:document.getElementById('capLinked')
  };

  var shown = null;
  function show(d) {
    if (!d || shown === d.id) return;
    shown = d.id;
    el.index.textContent  = String(d.i + 1).padStart(2, '0');
    el.cat.textContent    = d.cat;
    el.name.textContent   = d.label;
    el.desc.textContent   = d.desc;
    el.status.textContent = d.status === 'shipped' ? 'Shipped' : 'Building next';
    el.status.dataset.s   = d.status;
    el.depth.style.transform = 'scaleX(' + (d.depth / 100) + ')';
    el.depthV.textContent = d.depth;

    el.linked.innerHTML = '';
    d.links.forEach(function (id) {
      var t = byId[id];
      if (!t) return;
      var c = document.createElement('button');
      c.type = 'button';
      c.className = 'cap-chip';
      c.textContent = t.label;
      c.setAttribute('aria-label', 'Show ' + t.label);
      c.addEventListener('click', function () { pin(t.i); nodes[t.i].focus(); });
      el.linked.appendChild(c);
    });
  }

  /* ---------------- geometry ---------------- */
  var angle = -90, target = null, pinned = -1, hovered = -1;
  var paused = false, userPaused = false, running = false, lastT = 0;

  function radius() {
    var w = wrap.getBoundingClientRect().width;
    return Math.max(96, w / 2 - (w < 420 ? 40 : 56));
  }

  function layout() {
    var r = radius();
    var box = wrap.getBoundingClientRect();
    var cx = box.width / 2, cy = box.height / 2;
    var step = 360 / DATA.length;
    var pts = [];

    for (var i = 0; i < nodes.length; i++) {
      var a = (angle + i * step) * Math.PI / 180;
      var x = Math.cos(a) * r, y = Math.sin(a) * r;
      pts.push([cx + x, cy + y]);
      var depth = (Math.sin(a) + 1) / 2;                  /* 0 back, 1 front */
      var n = nodes[i];
      n.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px,0)';
      n.style.zIndex = String(10 + Math.round(depth * 40) + (i === pinned ? 100 : 0));
      n.style.opacity = (i === pinned || i === hovered) ? '1' : (0.55 + 0.45 * depth).toFixed(3);
    }

    /* traces from the pinned pad to everything it feeds */
    for (var k = 0; k < lines.length; k++) {
      var on = false;
      if (pinned >= 0) {
        var ids = DATA[pinned].links;
        if (k < ids.length && byId[ids[k]]) {
          var j = byId[ids[k]].i;
          lines[k].setAttribute('x1', pts[pinned][0].toFixed(1));
          lines[k].setAttribute('y1', pts[pinned][1].toFixed(1));
          lines[k].setAttribute('x2', pts[j][0].toFixed(1));
          lines[k].setAttribute('y2', pts[j][1].toFixed(1));
          on = true;
        }
      }
      lines[k].classList.toggle('on', on);
    }
  }

  function tick(now) {
    if (!running) return;
    var dt = lastT ? Math.min(64, now - lastT) : 16.7;
    lastT = now;

    if (target !== null) {
      var d = target - angle;
      while (d > 180) d -= 360;
      while (d < -180) d += 360;
      angle += d * (1 - Math.pow(1 - 0.12, dt / 16.7));
      if (Math.abs(d) < 0.05) { angle = target; target = null; }
    } else if (!paused && !userPaused && !reduce) {
      angle = (angle + 4.2 * dt / 1000) % 360;            /* ~86s per revolution */
    }

    layout();

    if (target !== null || (!paused && !userPaused && !reduce)) requestAnimationFrame(tick);
    else running = false;
  }
  function kick() { if (!running) { running = true; lastT = 0; requestAnimationFrame(tick); } }

  /* ---------------- interaction ---------------- */
  function setLinkedClasses() {
    var ids = pinned >= 0 ? DATA[pinned].links : [];
    nodes.forEach(function (n, i) {
      n.classList.toggle('is-pinned', i === pinned);
      n.classList.toggle('is-linked', pinned >= 0 && ids.indexOf(DATA[i].id) > -1);
      n.setAttribute('aria-pressed', i === pinned ? 'true' : 'false');
    });
  }

  function pin(i) {
    pinned = (pinned === i) ? -1 : i;
    setLinkedClasses();
    if (pinned >= 0) {
      show(DATA[pinned]);
      /* bring the chosen pad to the top of the ring — eased normally, but jumped
         straight there for anyone who asked for reduced motion */
      var t = -90 - (pinned * (360 / DATA.length));
      if (reduce) { angle = t; target = null; } else { target = t; }
    } else {
      target = null;
    }
    /* paint the new state now rather than waiting on the next frame, so the
       traces answer the click immediately even if the loop is idle */
    layout();
    kick();
  }

  nodes.forEach(function (n, i) {
    n.addEventListener('click', function () { pin(i); });
    n.addEventListener('pointerenter', function () {
      hovered = i; paused = true;
      if (pinned < 0) show(DATA[i]);
      kick();
    });
    n.addEventListener('pointerleave', function () {
      hovered = -1; paused = false;
      if (pinned >= 0) show(DATA[pinned]);
      kick();
    });
    n.addEventListener('focus', function () {
      paused = true;
      show(DATA[i]);
      kick();
    });
    n.addEventListener('blur', function () {
      if (!nodeHost.contains(document.activeElement)) paused = false;
      kick();
    });
    n.addEventListener('keydown', function (e) {
      var j = -1;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') j = (i + 1) % nodes.length;
      if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   j = (i - 1 + nodes.length) % nodes.length;
      if (e.key === 'Home') j = 0;
      if (e.key === 'End')  j = nodes.length - 1;
      if (j > -1) { e.preventDefault(); nodes[j].focus(); }
      if (e.key === 'Escape' && pinned >= 0) { e.preventDefault(); pin(pinned); }
    });
  });

  stage.addEventListener('click', function (e) {
    if (e.target === stage || e.target.classList.contains('orbit-ring')) {
      if (pinned >= 0) pin(pinned);
    }
  });

  if (toggle) {
    toggle.addEventListener('click', function () {
      userPaused = !userPaused;
      toggle.setAttribute('aria-pressed', userPaused ? 'true' : 'false');
      togLabel.textContent = userPaused ? 'Resume orbit' : 'Pause orbit';
      kick();
    });
    if (reduce) toggle.style.display = 'none';
  }

  /* run only while the section is on screen */
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { paused = false; kick(); } else { paused = true; }
    }, { rootMargin: '15% 0px' }).observe(wrap);
  }

  window.addEventListener('resize', function () { layout(); kick(); });

  show(DATA[0]);
  layout();
  if (!reduce) kick(); else layout();
})();
