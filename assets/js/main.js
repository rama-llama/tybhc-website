(function () {
  "use strict";

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header background after scrolling ---------- */
  const header = document.querySelector("[data-header]");
  const onScrollHeader = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---------- Mobile menu ---------- */
  const toggle = document.querySelector("[data-nav-toggle]");
  const links = document.querySelector("[data-nav-links]");
  if (toggle && links) {
    const setOpen = (open) => {
      toggle.setAttribute("aria-expanded", String(open));
      links.classList.toggle("open", open);
    };
    toggle.addEventListener("click", () => setOpen(toggle.getAttribute("aria-expanded") !== "true"));
    links.addEventListener("click", (e) => { if (e.target.closest("a")) setOpen(false); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });
  }

  /* ---------- Mission: words light up as you scroll ---------- */
  const lit = document.querySelector("[data-scroll-lit]");
  if (lit && !reduceMotion) {
    const words = lit.textContent.trim().split(/\s+/);
    lit.setAttribute("aria-label", lit.textContent.trim());
    lit.innerHTML = words.map(w => `<span class="w" aria-hidden="true">${w}</span> `).join("");
    const spans = Array.from(lit.querySelectorAll(".w"));
    const section = lit.closest(".mission");

    let ticking = false;
    const update = () => {
      ticking = false;
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const progress = Math.min(Math.max(-rect.top / (total * 0.85), 0), 1);
      const count = Math.round(progress * spans.length);
      spans.forEach((s, i) => {
        s.classList.toggle("lit", i < count);
        // the newest words glow like a spike front
        s.classList.toggle("spark", i < count && i >= count - 2 && progress < 1);
      });
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  /* ---------- What we do: light the matching region ---------- */
  const steps = document.querySelectorAll("[data-step]");
  const regions = document.querySelectorAll("[data-region]");
  const activate = (i) => {
    steps.forEach(s => s.classList.toggle("active", s.dataset.step === String(i)));
    regions.forEach(r => r.classList.toggle("active", r.dataset.region === String(i)));
  };
  if (steps.length && "IntersectionObserver" in window) {
    activate(0);
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => { if (entry.isIntersecting) activate(entry.target.dataset.step); });
    }, { rootMargin: "-45% 0px -45% 0px" });
    steps.forEach(s => io.observe(s));
  }

  /* ---------- Footer year ---------- */
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
