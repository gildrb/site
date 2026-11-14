/**
 * Aligns what CSS cannot, before the first paint and on resize:
 * - Desktop: marks short viewports dense.
 * - Phones: shows the list's bottom fade in the first frame when it overflows; the scroll-driven
 *   animation takes over after.
 * Self-contained on purpose: `layout.tsx` inlines its source (`headScript`).
 */
export function align(): void {
  const body = document.body;
  const sidebarLinks = document.querySelector("aside nav");

  // Desktop, short viewports: on the homepage the page holds to the viewport and the project
  // list scrolls instead, as on phones, once its content would overflow it (`data-dense`). When
  // even the sidebar links outgrow the dense homepage, `data-compact` drops the profile links,
  // keeping contact. Each step is measured in the layout before it, so neither flip-flops.
  const root = document.documentElement;
  const home = document.getElementById("site-title");
  delete root.dataset.dense;
  delete root.dataset.compact;
  if (matchMedia("(min-width: 768px)").matches && sidebarLinks && home) {
    // <body> is the viewport's height on the homepage (see `layout.tsx`), so the content fits
    // until it overflows <body>.
    const dense = body.scrollHeight > body.clientHeight;
    if (dense) root.dataset.dense = "";
    // The dense homepage layout is the viewport's height; the links must end above its padding.
    const layout = sidebarLinks.closest("aside")?.parentElement;
    if (dense && layout) {
      const box = layout.getBoundingClientRect();
      const end = box.bottom - Number.parseFloat(getComputedStyle(layout).paddingBottom);
      if (sidebarLinks.getBoundingClientRect().bottom > end + 0.5) root.dataset.compact = "";
    }
  }

  // The up-and-down scroller: the list on phones, the section on dense desktops.
  const list = [...document.querySelectorAll<HTMLElement>("[data-scroll-list]")].find(
    (element) => getComputedStyle(element).overflowY === "auto",
  );
  document
    .querySelector<HTMLElement>("[data-portfolio]")
    ?.style.setProperty(
      "--list-overflows",
      list !== undefined && list.scrollHeight - list.clientHeight - list.scrollTop > 1 ? "1" : "0",
    );
}
