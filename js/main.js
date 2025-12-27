// js/main.js
// =========================================================
// Interactions: scroll progress, mobile nav, scroll reveal,
// count-up stats, modal open/close + accessibility, footer year.
// =========================================================

(() => {
  // ---------- Helpers ----------
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  // ---------- Preferences ----------
  const prefersReducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;

  // ---------- Footer year ----------
  const yearEl = qs("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // =========================================================
  // Scroll Progress (injects bar on every page)
  // =========================================================
  const progressWrap = document.createElement("div");
  progressWrap.className = "scroll-progress";

  const progressBar = document.createElement("div");
  progressBar.className = "scroll-progress-bar";

  progressWrap.appendChild(progressBar);
  document.body.appendChild(progressWrap);

  let ticking = false;

  const updateProgress = () => {
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop || 0;
    const scrollHeight = doc.scrollHeight || document.body.scrollHeight || 0;
    const clientHeight = doc.clientHeight || window.innerHeight || 0;

    const maxScroll = Math.max(1, scrollHeight - clientHeight);
    const pct = Math.min(100, Math.max(0, (scrollTop / maxScroll) * 100));

    progressBar.style.width = pct.toFixed(2) + "%";
    ticking = false;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(updateProgress);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  // initial paint
  updateProgress();

  // =========================================================
  // Mobile nav toggle
  // =========================================================
  const navToggle = qs(".nav-toggle");
  const navMenu = qs("#navMenu");

  if (navToggle && navMenu) {
    const setOpen = (open) => {
      navToggle.setAttribute("aria-expanded", String(open));
      navMenu.classList.toggle("open", open);
    };

    navToggle.addEventListener("click", () => {
      const isOpen = navToggle.getAttribute("aria-expanded") === "true";
      setOpen(!isOpen);
    });

    // Close menu when clicking a link (mobile)
    navMenu.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!a) return;
      setOpen(false);
    });

    // Close when clicking outside
    document.addEventListener("click", (e) => {
      const clickedInside = e.target.closest(".nav");
      if (clickedInside) return;
      setOpen(false);
    });

    // Close on Escape
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") setOpen(false);
    });
  }

  // =========================================================
  // Reveal on scroll
  // =========================================================
  const revealEls = qsa("[data-reveal]");

  if (prefersReducedMotion) {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  } else if ("IntersectionObserver" in window) {
    const revealIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
          revealIO.unobserve(entry.target);
        });
      },
      { threshold: 0.15 }
    );

    revealEls.forEach((el) => revealIO.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // =========================================================
  // Count-up stats
  // =========================================================
  const statEls = qsa("[data-count]");

  function animateCount(el, to, duration = 950) {
    const start = 0;
    const t0 = performance.now();

    const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);

    function tick(t) {
      const p = Math.min((t - t0) / duration, 1);
      const val = Math.floor(start + (to - start) * easeOutCubic(p));
      el.textContent = val.toLocaleString();
      if (p < 1) requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  if (prefersReducedMotion) {
    statEls.forEach((el) => {
      const to = Number(el.dataset.count || "0");
      el.textContent = to.toLocaleString();
    });
  } else if ("IntersectionObserver" in window) {
    const statIO = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const el = entry.target;
          const to = Number(el.dataset.count || "0");
          animateCount(el, to);
          statIO.unobserve(el);
        });
      },
      { threshold: 0.35 }
    );
    statEls.forEach((el) => statIO.observe(el));
  } else {
    statEls.forEach((el) => {
      const to = Number(el.dataset.count || "0");
      el.textContent = to.toLocaleString();
    });
  }

  // =========================================================
  // Modal
  // =========================================================
  const modal = qs(".modal");
  const modalContent = qs("#modalContent");
  const openButtons = qsa("[data-open-modal]");
  const closeButtons = qsa("[data-close-modal]");

  let lastFocusedEl = null;

  const defaultModalHTML = (key) => `
    <h3>${key}</h3>
    <p>Add this content in <code>js/data.js</code> under <code>MODAL_DATA["${key}"]</code>.</p>
  `;

  const getModalHTML = (key) => {
    try {
      if (window.MODAL_DATA && window.MODAL_DATA[key]) {
        const { title, body } = window.MODAL_DATA[key];
        return `
          <h3>${title || key}</h3>
          ${body || "<p></p>"}
        `;
      }
    } catch (_) {}
    return defaultModalHTML(key);
  };

  const openModal = (key) => {
    if (!modal || !modalContent) return;

    lastFocusedEl = document.activeElement;

    modalContent.innerHTML = getModalHTML(key);
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");

    const closeBtn = qs(".modal-close", modal);
    if (closeBtn) closeBtn.focus();

    document.body.style.overflow = "hidden";
  };

  const closeModal = () => {
    if (!modal) return;

    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");

    document.body.style.overflow = "";

    if (lastFocusedEl && typeof lastFocusedEl.focus === "function") {
      lastFocusedEl.focus();
    }
  };

  if (modal) {
    openButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-open-modal");
        if (key) openModal(key);
      });
    });

    closeButtons.forEach((btn) => btn.addEventListener("click", closeModal));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && modal.classList.contains("open")) closeModal();
    });

    modal.addEventListener("click", (e) => {
      const panel = qs(".modal-panel", modal);
      if (!panel) return;
      if (!panel.contains(e.target) && modal.classList.contains("open")) closeModal();
    });

    // Focus trap
    modal.addEventListener("keydown", (e) => {
      if (e.key !== "Tab" || !modal.classList.contains("open")) return;

      const focusables = qsa(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
        modal
      ).filter((el) => el.offsetParent !== null);

      if (focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];

      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    });
  }
})();
