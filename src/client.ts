import { type FunctionComponent, h, hydrate } from "preact";
import { align } from "./align.ts";
import type { Islands } from "./island.tsx";
import { Email } from "./islands/email.tsx";
import { Portfolio } from "./islands/portfolio.tsx";
import { compareRows, origin, type SortDirection, type SortKey } from "./site.ts";
import { loadPagesAhead } from "./ahead.ts";
import { enableKeys } from "./keys.ts";
import { toggleLinks } from "./links.ts";
import { enablePreview } from "./preview.ts";
import { autoplayVideos } from "./video.ts";
import { enableZoom } from "./zoom.ts";

toggleLinks();
enableZoom();
autoplayVideos();
loadPagesAhead();
// After `enableZoom`: an enlarged artwork takes Escape first, before it can mean "go home".
enableKeys();
enablePreview();
bridgeConverter();

/**
 * Archetypon's converter hydrates once its chunk loads, after the page. Until then "Choose files"
 * would do nothing and a dropped file would open in the browser in place of the page: this opens
 * the converter's file input and puts dropped files into it, where the converter finds them when
 * it mounts. It stands down once the input carries `data-live` (set by the converter).
 */
function bridgeConverter() {
  const converter = document.querySelector<HTMLElement>('[data-island="archetypon"]');
  const input = converter?.querySelector<HTMLInputElement>('input[type="file"]');
  if (!converter || !input) return;
  const early = () => input.dataset.live === undefined;
  converter.addEventListener("click", (event) => {
    if (!early() || !(event.target instanceof Element)) return;
    if (event.target.closest("[data-pick]")) input.click();
  });
  addEventListener("dragover", (event) => {
    if (early() && event.dataTransfer?.types.includes("Files") === true) event.preventDefault();
  });
  addEventListener("drop", (event) => {
    if (!early() || !event.dataTransfer?.types.includes("Files")) return;
    event.preventDefault();
    input.files = event.dataTransfer.files;
  });
}

const islands: { [Name in keyof Islands]: () => Promise<Islands[Name]> | Islands[Name] } = {
  email: () => Email,
  portfolio: () => Portfolio,
  // Only the Heph case study shows the terminal; keep it out of the homepage bundle.
  heph: () => import("./islands/heph.tsx").then((module) => module.Terminal),
  // Only Archetypon's page (archetypon.gildrb.com) runs the converter; its engine loads once the
  // page is idle, or when files come near.
  archetypon: () => import("./islands/archetypon.tsx").then((module) => module.Converter),
  // Only product pages show copyable commands.
  command: () => import("./islands/command.tsx").then((module) => module.Command),
  // The CURVES case study and the homepage preview show the glyph wall; it loads after the page.
  curves: () => import("./islands/curves.tsx").then((module) => module.Specimen),
  // Only the Ben Davis case study plays the mark.
  "ben-davis": () => import("./islands/ben-davis.tsx").then((module) => module.Fold),
};

function isIslandName(value: string | undefined): value is keyof Islands {
  return value !== undefined && Object.hasOwn(islands, value);
}

// The islands are already server-rendered: let the first frame paint, then hydrate each one in
// its own task, and the Heph terminal only once it comes near the viewport.
function hydrateIsland(element: HTMLElement) {
  const name = element.dataset.island;
  if (!isIslandName(name)) throw new Error(`Unknown island: ${name}`);
  void hydrateNamed(name, element);
}

/** One case per island, so each component meets the props type it was rendered with. */
async function hydrateNamed(name: keyof Islands, element: HTMLElement): Promise<void> {
  switch (name) {
    case "email":
      return mount(await islands.email(), element);
    case "portfolio":
      return mount(await islands.portfolio(), element);
    case "heph":
      return mount(await islands.heph(), element);
    case "archetypon":
      return mount(await islands.archetypon(), element);
    case "command":
      return mount(await islands.command(), element);
    case "curves":
      return mount(await islands.curves(), element);
    case "ben-davis":
      return mount(await islands["ben-davis"](), element);
    default: {
      const _: never = name;
      return _;
    }
  }
}

/** `Island` serialized these props from the same component's props on the server. */
function mount<Props extends object>(component: FunctionComponent<Props>, element: HTMLElement) {
  const props: Props = JSON.parse(element.dataset.props ?? "{}");
  hydrate(h(component, props), element);
}

const nearViewport = new IntersectionObserver(
  (entries) => {
    for (const { isIntersecting, target } of entries) {
      const island = target.parentElement;
      if (!isIntersecting || !island) continue;
      nearViewport.unobserve(target);
      hydrateIsland(island);
    }
  },
  { rootMargin: "50%" },
);

requestAnimationFrame(() => {
  for (const element of document.querySelectorAll<HTMLElement>("[data-island]")) {
    // Island wrappers are `display: contents` and have no box to observe; watch their content.
    const content = element.firstElementChild;
    if (element.dataset.island === "heph" && content) nearViewport.observe(content);
    else setTimeout(() => hydrateIsland(element));
  }
});

// The first alignment already ran inline before the first paint; keep it current afterwards.
const updateLayout = () => align();
const resized = new ResizeObserver(() => setTimeout(updateLayout, 0));
for (const target of [
  document.querySelector("main"),
  document.querySelector("aside nav"),
  document.querySelector("[data-island=portfolio]")?.firstElementChild,
]) {
  if (target) resized.observe(target);
}
document.fonts.addEventListener("loadingdone", updateLayout);
addEventListener("load", updateLayout);
addEventListener("resize", updateLayout);

// Restore the scroll position on back/forward navigation, which the sticky layout confuses.
const scrollKey = `gildrb:scroll:${location.pathname}${location.search}`;
history.scrollRestoration = "manual";
function saveScroll() {
  try {
    sessionStorage.setItem(scrollKey, JSON.stringify({ left: scrollX, top: scrollY }));
  } catch {
    // Storage may be unavailable; the browser's default then applies.
  }
}
addEventListener("pagehide", saveScroll);
document.addEventListener(
  "visibilitychange",
  () => document.visibilityState === "hidden" && saveScroll(),
);
addEventListener("pageshow", (event) => {
  const backForward = performance
    .getEntriesByType("navigation")
    .some((entry) => entry instanceof PerformanceNavigationTiming && entry.type === "back_forward");
  if (!event.persisted && !backForward) return;
  let position: { left: number; top: number } | null = null;
  try {
    position = JSON.parse(sessionStorage.getItem(scrollKey) ?? "null");
  } catch {
    return;
  }
  if (!position) return;
  const { left, top } = position;
  const restore = () => scrollTo(left, top);
  restore();
  requestAnimationFrame(() => {
    restore();
    requestAnimationFrame(restore);
  });
});

for (const link of document.querySelectorAll('a[href="#top"]')) {
  link.addEventListener("click", (event) => {
    event.preventDefault();
    scrollTo(0, 0);
    history.replaceState(null, "", location.href.replace(/#.*$/, ""));
  });
}

// Away from the live host (the dev server, a preview deployment), links to gildrb.com open the
// same page on this server, so a preview never jumps to the live site.
if (location.host !== new URL(origin).host) {
  document.addEventListener(
    "click",
    (event) => {
      const link = event.target instanceof Element ? event.target.closest("a") : null;
      if (!link?.href) return;
      const url = new URL(link.href);
      if (url.origin === origin) link.href = `${url.pathname}${url.search}${url.hash}`;
    },
    { capture: true },
  );
}

// Homepage: arrow keys step through the links and the table. Only the homepage has
// `site-title`.
if (document.getElementById("site-title")) {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    event.preventDefault();
    const items = [
      ...document.querySelectorAll<HTMLElement>(
        "[data-mobile-links] a[href], [data-mobile-links] button, aside button",
      ),
      ...document.querySelectorAll<HTMLElement>(
        "main a[href], main button:not([disabled]), main input:not([disabled])",
      ),
    ].filter(
      (item, index, all) =>
        all.indexOf(item) === index &&
        item.tabIndex >= 0 &&
        !item.closest("[aria-hidden='true']") &&
        item.getClientRects().length > 0 &&
        getComputedStyle(item).visibility !== "hidden",
    );
    const current = items.findIndex((item) => item === document.activeElement);
    const step = event.key === "ArrowDown" ? 1 : -1;
    items[current === -1 ? 0 : (current + step + items.length) % items.length]?.focus();
  });
}

// Other pages: inside a list of links (Contact, Links, Sources), ↑ and ↓ step through
// that list; anywhere else the keys scroll the page as usual.
if (!document.getElementById("site-title")) {
  document.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    const active = document.activeElement;
    const list = active instanceof HTMLAnchorElement ? active.closest("nav") : null;
    if (!list) return;
    const links = [...list.querySelectorAll<HTMLElement>("a[href], button")].filter(
      (item) => item.getClientRects().length > 0,
    );
    const at = links.indexOf(active instanceof HTMLElement ? active : list);
    if (at === -1) return;
    event.preventDefault();
    const step = event.key === "ArrowDown" ? 1 : -1;
    links[(at + step + links.length) % links.length]?.focus();
  });
}

// /all?sort=…&direction=… mirrors the order chosen in the homepage table.
const allCases = document.querySelector<HTMLElement>("[data-all-cases]");
const params = new URLSearchParams(location.search);
const sortKey = params.get("sort");
const sortDirection = params.get("direction");
if (allCases && isSortKey(sortKey) && isSortDirection(sortDirection)) {
  const compare = compareRows(sortKey, sortDirection);
  const articles = [...allCases.querySelectorAll<HTMLElement>(":scope > figure")];
  allCases.append(...articles.toSorted((left, right) => compare(sortRow(left), sortRow(right))));
}

// /all?open=<id>, from an archive work elsewhere: that work comes first, at the top, and opens
// enlarged; sending it back shows the whole archive around it.
const opened = allCases?.querySelector<HTMLElement>(
  `:scope > figure[data-work="${CSS.escape(params.get("open") ?? "")}"]`,
);
if (allCases && opened) {
  allCases.prepend(opened);
  const zoom = opened.querySelector<HTMLButtonElement>("[data-zoom]");
  // After the first layout, so the enlargement starts from the tile's place in the grid.
  if (zoom) requestAnimationFrame(() => zoom.click());
}

function sortRow(element: HTMLElement) {
  return {
    date: element.dataset.date ?? "",
    title: element.dataset.title ?? "",
  };
}

function isSortKey(value: string | null): value is SortKey {
  return value === "date" || value === "title";
}

function isSortDirection(value: string | null): value is SortDirection {
  return value === "ascending" || value === "descending";
}
