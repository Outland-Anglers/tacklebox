// Player/Officer tab toggles (landing page)
for (const group of document.querySelectorAll("[data-tabs]")) {
  const scope = group.parentElement;
  group.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-tab-target]");
    if (!btn) return;
    const target = btn.dataset.tabTarget;
    for (const b of group.querySelectorAll("[data-tab-target]")) {
      b.classList.toggle("is-active", b === btn);
    }
    for (const panel of scope.querySelectorAll("[data-tab-panel]")) {
      panel.hidden = panel.dataset.tabPanel !== target;
    }
  });
}

// Sidebar scroll-spy (commands page)
const sidebarLinks = document.querySelectorAll('.tb-sidebar a[href^="#"]');
if (sidebarLinks.length > 0 && "IntersectionObserver" in window) {
  const linkById = new Map(
    [...sidebarLinks].map((a) => [a.getAttribute("href").slice(1), a])
  );
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const a of sidebarLinks) a.classList.remove("is-active");
        linkById.get(entry.target.id)?.classList.add("is-active");
      }
    },
    { rootMargin: "-35% 0px -55% 0px", threshold: 0 }
  );
  for (const id of linkById.keys()) {
    const el = document.getElementById(id);
    if (el) observer.observe(el);
  }
}
