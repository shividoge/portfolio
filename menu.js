/* ===========================================================================
   The menu: one button at every width, and a panel that opens as a circle
   grown from the button itself, so the thing you pressed is where the page
   comes from. Shared by the home page and every project page.
   =========================================================================== */
(function () {
  'use strict';
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return [].slice.call((r || document).querySelectorAll(s)); }
  var reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var nav = $('#nav');
  var menuBtn = $('#menuBtn'), panel = $('#menuPanel');
  if (!menuBtn || !panel) return;
  var menuOpen = false, lastFocus = null;

  function originFromButton() {
    var r = menuBtn.getBoundingClientRect();
    panel.style.setProperty('--mx', (r.left + r.width / 2) + 'px');
    panel.style.setProperty('--my', (r.top + r.height / 2) + 'px');
  }

  function setMenu(open) {
    if (open === menuOpen) return;
    menuOpen = open;
    if (open) { originFromButton(); lastFocus = document.activeElement; }

    panel.classList.toggle('is-open', open);
    menuBtn.classList.toggle('is-open', open);
    if (nav) nav.classList.toggle('menu-open', open);
    menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.documentElement.classList.toggle('no-scroll', open);

    if (open) {
      panel.removeAttribute('inert');
      var first = $('.menu-item', panel);
      if (first) setTimeout(function () { first.focus({ preventScroll: true }); }, reduce ? 0 : 260);
    } else {
      panel.setAttribute('inert', '');
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }
  }

  menuBtn.addEventListener('click', function () { setMenu(!menuOpen); });
  $$('#menuPanel a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && menuOpen) setMenu(false);
  });
  window.addEventListener('resize', function () { if (menuOpen) originFromButton(); });
  window.__menu = { isOpen: function () { return menuOpen; }, set: setMenu };
})();
