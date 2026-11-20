/**
 * Aligns what CSS cannot, before the first paint and on resize:
 * - Desktop: marks short viewports dense.
 * - Phones: shows the list's bottom fade in the first frame when it overflows; the scroll-driven
 *   animation takes over after.
 * Self-contained on purpose: `layout.tsx` inlines its source (`headScript`).
 */
export function align(): void {
  const sidebarLinks = document.querySelector("aside nav");
  const home = document.getElementById("site-title");

  // Desktop, short viewports: on the homepage the page holds to the viewport and the project
  // list scrolls instead, as on phones, once its content would overflow it (`data-dense`). When
  // even the sidebar links outgrow the dense homepage, `data-compact` drops the profile links,
  // keeping contact. Each step is measured in the layout before it, so neither flip-flops.
  const root = document.documentElement;
  delete root.dataset.dense;
  delete root.dataset.compact;
  if (matchMedia("(min-width: 768px)").matches && sidebarLinks && home) {
    // <body> is the viewport's height on the homepage (see `layout.tsx`), so the content fits
    // until it overflows <body>.
    const dense = document.body.scrollHeight > document.body.clientHeight;
    root.toggleAttribute("data-dense", dense);
    // The dense homepage layout is the viewport's height; the links must end above its padding.
    const layout = sidebarLinks.closest("aside")?.parentElement;
    if (dense && layout) {
      const end =
        layout.getBoundingClientRect().bottom -
        Number.parseFloat(getComputedStyle(layout).paddingBottom);
      root.toggleAttribute("data-compact", sidebarLinks.getBoundingClientRect().bottom > end + 0.5);
    }
  }

  // The up-and-down scroller: the list on phones, the section on dense desktops.
  const list = [...document.querySelectorAll<HTMLElement>("[data-scroll-list]")].find(
    (element) => getComputedStyle(element).overflowY === "auto",
  );
  const overflows =
    list !== undefined && list.scrollHeight - list.clientHeight - list.scrollTop > 1;
  document
    .querySelector<HTMLElement>("[data-portfolio]")
    ?.style.setProperty("--list-overflows", overflows ? "1" : "0");
}
