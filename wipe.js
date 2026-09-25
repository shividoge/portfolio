/* ===========================================================================
   Direction-aware hover fill.

   The fill is a clip-path ellipse that grows from a point. This sets that
   point to wherever the cursor actually crossed the edge, so the colour
   arrives from the side you approached from and retreats toward the side you
   left by — rather than always rising from the bottom.

   Delegated, because the work rows are rendered after this file runs.
   Keyboard focus has no pointer, so it keeps the default origin.
   =========================================================================== */
(function () {
  'use strict';

  function setOrigin(el, e) {
    var r = el.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var x = ((e.clientX - r.left) / r.width) * 100;
    var y = ((e.clientY - r.top) / r.height) * 100;
    el.style.setProperty('--wx', Math.max(0, Math.min(100, x)).toFixed(1) + '%');
    el.style.setProperty('--wy', Math.max(0, Math.min(100, y)).toFixed(1) + '%');
  }

  function edge(e) {
    var el = e.target && e.target.closest ? e.target.closest('.wipe') : null;
    if (!el) return;
    /* pointerover/out also fire when moving between children — ignore those */
    if (e.relatedTarget && el.contains(e.relatedTarget)) return;
    setOrigin(el, e);
  }

  document.addEventListener('pointerover', edge, true);
  document.addEventListener('pointerout',  edge, true);

  /* a keyboard user gets the neutral origin back */
  document.addEventListener('focusin', function (e) {
    var el = e.target && e.target.closest ? e.target.closest('.wipe') : null;
    if (!el) return;
    if (el.matches(':hover')) return;
    el.style.removeProperty('--wx');
    el.style.removeProperty('--wy');
  });
})();
