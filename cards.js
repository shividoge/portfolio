/* ===========================================================================
   Detail cards, rendered from window.PROJECTS.
   The order and the numbering both come from that file, so the list can be
   re-ranked in one place without touching markup.
   Runs as a deferred script so the rows exist before the page script wires up
   the cursor marker and reveal animations.
   =========================================================================== */
(function () {
  'use strict';
  var host = document.getElementById('workList');
  if (!host || !window.PROJECTS) return;

  function esc(s){ return String(s); }

  function linkRow(links){
    if (!links || !links.length) return '';
    return '<div class="flex flex-wrap items-center gap-x-5 gap-y-2 mt-5">' + links.map(function(l){
      if (l.href) {
        return '<a class="proj-link lbl" href="'+l.href+'" target="_blank" rel="noopener">'
             + esc(l.label) + '<span aria-hidden="true"> ↗</span></a>';
      }
      /* a genuine gap, not a placeholder to design around */
      return '<span class="proj-link is-pending lbl" aria-disabled="true">'
           + esc(l.label) + ' — pending</span>';
    }).join('') + '</div>';
  }

  host.innerHTML = window.PROJECTS.map(function (p) {
    return ''
    + '<article class="work-row wipe wipe-soft group border-b border-line" data-work id="proj-'+p.id+'">'
    +   '<div class="grid lg:grid-cols-12 gap-x-10 gap-y-5 py-9 sm:py-12 px-2 sm:px-4 -mx-2 sm:-mx-4">'
    +     '<div class="lg:col-span-1"><span class="work-idx lbl text-ink3 num">'+p.n+'</span></div>'
    +     '<div class="lg:col-span-4">'
    +       '<h3 class="display text-ink text-[1.6rem] sm:text-[2rem] leading-[1.06] mb-3">'
    +         '<span class="work-title">'+esc(p.title)+'</span></h3>'
    +       '<p class="lbl text-accentd mb-1">'+esc(p.tag)+'</p>'
    +       '<p class="lbl text-ink3">'+esc(p.meta)+'</p>'
    +     '</div>'
    +     '<div class="lg:col-span-6 lg:col-start-6">'
    +       '<p class="text-[1.0625rem] leading-[1.62] text-ink mb-4 prose-measure">'+esc(p.lede)+'</p>'
    +       '<p class="text-[.9375rem] leading-[1.72] text-ink2 prose-measure mb-6">'+esc(p.body)+'</p>'
    +       '<div class="flex flex-wrap gap-1.5">'
    +         p.tags.map(function(t){ return '<span class="tag">'+esc(t)+'</span>'; }).join('')
    +       '</div>'
    +       linkRow(p.links)
    +     '</div>'
    +     '<div class="lg:col-span-1 lg:text-right"><span class="lbl text-ink3">'+esc(p.status)+'</span></div>'
    +   '</div>'
    + '</article>';
  }).join('');

  /* keep the section's own counter honest */
  var count = document.getElementById('workCount');
  if (count) count.textContent = String(window.PROJECTS.length).padStart(2,'0') + ' projects';
})();
