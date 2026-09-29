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

  /* a row is a doorway: what it is, one line on it, and the way in. The
     write-up, the tools and the links live on the project's own page. */
  host.innerHTML = window.PROJECTS.map(function (p) {
    var dest = p.n+' \u00b7 '+esc(p.short);
    return ''
    + '<article class="work-row wipe wipe-soft group border-b border-line" data-work id="proj-'+p.id+'">'
    +   '<div class="grid lg:grid-cols-12 gap-x-10 gap-y-6 py-12 sm:py-16 px-2 sm:px-4 -mx-2 sm:-mx-4">'
    +     '<div class="lg:col-span-1"><span class="work-idx lbl text-ink3 num">'+p.n+'</span></div>'
    +     '<div class="lg:col-span-5">'
    +       '<h3 class="display text-ink text-[1.75rem] sm:text-[2.25rem] leading-[1.06] mb-4">'
    +         '<a class="work-title row-title" href="'+p.page+'" data-pa="'+p.accent+'" data-dest="'+dest+'">'+esc(p.title)+'</a></h3>'
    +       '<p class="lbl text-accentd mb-2">'+esc(p.tag)+'</p>'
    +       '<p class="lbl text-ink3">'+esc(p.status)+' &nbsp;&middot;&nbsp; '+esc(p.meta)+'</p>'
    +     '</div>'
    +     '<div class="lg:col-span-5 lg:col-start-8">'
    +       '<p class="text-[1.125rem] leading-[1.6] text-ink mb-8 prose-measure">'+esc(p.lede)+'</p>'
    +       '<a class="row-open lbl" href="'+p.page+'" data-pa="'+p.accent+'" data-dest="'+dest+'" style="--pc:'+p.accent+'">Open the full project <span aria-hidden="true">\u2192</span></a>'
    +     '</div>'
    +   '</div>'
    + '</article>';
  }).join('');

  /* keep the section's own counter honest */
  var count = document.getElementById('workCount');
  if (count) count.textContent = String(window.PROJECTS.length).padStart(2,'0') + ' projects';
})();
