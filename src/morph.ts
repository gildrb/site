import { previewFrame, previewGrid } from "./preview-frame.ts";
import { colors } from "./tokens.stylex.ts";

/**
 * A project's title and picture travel between the homepage table and its page, as opencode.ai's
 * cards do: a cross-document view transition. Opening a row, its title grows into the page's
 * title and its preview into the page's lead picture while the page fades in over the table;
 * going home, both shrink back to the row. Every other navigation, and every one under reduced
 * motion, skips the transition and stays instant.
 *
 * The page being left names what travels (`pageswap`) and leaves a note in session storage; the
 * next page reads it and names its own ends before its first frame (`pagereveal`). Titles carry
 * `data-morph="row"` or `"page"`; a page's lead picture sits in `figure[data-lead]`; the homepage
 * preview frames carry `data-morph-image` (`preview.ts`).
 */

const morph = {
  key: "gildrb:morph",
  /** A note older than this belongs to an earlier click, not to this navigation. */
  ttl: 4000,
  /** Milliseconds for a trip across half the screen's diagonal; shorter hops take down to 3/4. */
  grow: 380,
  shrink: 340,
  /** The new page fades in over the old one, a beat after the title sets off. */
  fade: 220,
  delay: 60,
  /** The pictures cross-fade through a slight blur, quicker than the trip. */
  image: 160,
  easing: "cubic-bezier(.32,.72,0,1)",
  fadeEasing: "cubic-bezier(.23,1,.32,1)",
  /** The preview's own fade out (`motion.response`), once the picture is back in its frame. */
  settle: 200,
  hairline: colors.hairline,
  grid: previewGrid,
} as const;

/**
 * The transition's look; `morphTransitions` sets the timings as custom properties. The old page
 * stays still under the new one, so nothing dips through the page color.
 */
export const morphCss = [
  "@view-transition{navigation:auto}",
  ":root[data-morph]::view-transition-group(root){animation:none}",
  ":root[data-morph]::view-transition-old(root){animation:none;mix-blend-mode:normal}",
  ":root[data-morph]::view-transition-new(root){animation:var(--morph-fade) var(--morph-fade-easing) var(--morph-delay) both morph-in;mix-blend-mode:normal}",
  "::view-transition-group(page-title),::view-transition-group(page-image){animation-duration:var(--morph-duration);animation-timing-function:var(--morph-easing)}",
  "::view-transition-group(page-image){overflow:clip}",
  "::view-transition-old(page-image),::view-transition-new(page-image){width:100%;height:100%;object-fit:cover;object-position:top;mix-blend-mode:normal}",
  "::view-transition-old(page-image){animation:var(--morph-image) var(--morph-fade-easing) both morph-blur-out}",
  "::view-transition-new(page-image){animation:var(--morph-image) var(--morph-fade-easing) both morph-blur-in}",
  // A picture with no counterpart on the other page leaves or arrives with the page.
  "::view-transition-old(page-image):only-child{animation:var(--morph-fade) var(--morph-fade-easing) both morph-out}",
  "::view-transition-new(page-image):only-child{animation:var(--morph-fade) var(--morph-fade-easing) var(--morph-delay) both morph-in}",
  // A live preview lands in an empty frame: the picture shrinks into it and dissolves on arrival.
  ":root[data-morph-land]::view-transition-old(page-image){animation:var(--morph-duration) ease-in both morph-dissolve}",
  ":root[data-morph-land]::view-transition-new(page-image){animation:none;opacity:0}",
  "@keyframes morph-dissolve{0%,40%{opacity:1}to{opacity:0}}",
  "@keyframes morph-in{from{opacity:0}}",
  "@keyframes morph-out{to{opacity:0}}",
  "@keyframes morph-blur-out{to{filter:blur(4px)}}",
  "@keyframes morph-blur-in{from{opacity:0;filter:blur(4px)}}",
].join("\n");

/** A page path without its trailing slash, as notes compare them. */
function pathOf(href: string): string {
  return new URL(href, location.href).pathname.replace(/(.)\/$/, "$1");
}

/** The homepage list's scroller, where the list scrolls (phones, dense desktops). */
function scrollerOf(element: Element): HTMLElement | null {
  return (
    [
      element.closest("[data-scroll-list] [data-scroll-list]"),
      element.closest("[data-scroll-list]"),
    ].find(
      (candidate): candidate is HTMLElement =>
        candidate instanceof HTMLElement && getComputedStyle(candidate).overflowY === "auto",
    ) ?? null
  );
}

/**
 * Self-contained: it runs inlined (`morphScript`), so it uses only what it defines or is given.
 */
function morphTransitions(
  config: typeof morph,
  path: typeof pathOf,
  scroller: typeof scrollerOf,
  frame: typeof previewFrame,
): void {
  const root = document.documentElement;
  const properties = [
    "--morph-duration",
    "--morph-easing",
    "--morph-fade",
    "--morph-fade-easing",
    "--morph-delay",
    "--morph-image",
  ];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const desktop = matchMedia("(min-width: 768px)");
  // At least half of it shows, in the viewport and in its scroller.
  const onScreen = (element: Element) => {
    const own = element.getBoundingClientRect();
    const clip = scroller(element)?.getBoundingClientRect();
    const width =
      Math.min(own.right, innerWidth, clip?.right ?? Infinity) -
      Math.max(own.left, 0, clip?.left ?? 0);
    const height =
      Math.min(own.bottom, innerHeight, clip?.bottom ?? Infinity) -
      Math.max(own.top, 0, clip?.top ?? 0);
    const area = own.width * own.height;
    return area > 0 && Math.max(0, width) * Math.max(0, height) >= area / 2;
  };
  const shown = (selector: string) =>
    [...document.querySelectorAll<HTMLElement>(selector)].find(
      (element) => element.getClientRects().length > 0 && onScreen(element),
    ) ?? null;
  // The page's own title: the content heading on desktop, the name bar's on phones.
  const pageTitle = () => shown('[data-morph="page"]');
  const lead = () => shown("figure[data-lead] :is(img, video, [data-island] > *)");
  const clear = () => {
    delete root.dataset.morph;
    delete root.dataset.morphLand;
    for (const property of properties) root.style.removeProperty(property);
    for (const element of document.querySelectorAll<HTMLElement>(
      "[data-morph], [data-morph-image], figure[data-lead] *",
    )) {
      element.style.viewTransitionName = "";
    }
  };

  // Leaving: name the clicked row's title and preview, or the page's own on the way home.
  let clicked: HTMLAnchorElement | null = null;
  document.addEventListener(
    "click",
    (event) => {
      const plain =
        event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
      const link = event.target instanceof Element ? event.target.closest("a[href]") : null;
      clicked = plain && link instanceof HTMLAnchorElement ? link : null;
    },
    { capture: true },
  );
  addEventListener("pagehide", clear);
  addEventListener("pageswap", (event) => {
    const link = clicked;
    clicked = null;
    const transition = event.viewTransition;
    if (transition === null) return;
    const destination = event.activation?.entry.url;
    if (destination === undefined || destination === null || reduced.matches) {
      transition.skipTransition();
      return;
    }
    void transition.finished.then(clear, clear);
    const to = path(destination);
    const row = link?.querySelector<HTMLElement>('[data-morph="row"]');
    let from: HTMLElement | null;
    let image: HTMLElement | null;
    let project: string | null = null;
    if (link && row && path(link.href) === to) {
      // Only the homepage table's titles travel. The next projects at a page's foot are a
      // screen or more from where the next page's title stands: the page fades over instead.
      const home = link.closest("[data-portfolio]") !== null;
      if (home) {
        sessionStorage.setItem(`${config.key}:list`, String(scroller(row)?.scrollTop ?? 0));
      }
      from = home && onScreen(row) ? row : null;
      image = home ? shown("[data-previews][data-shown] [data-morph-image][data-current]") : null;
    } else if (to === "/" && document.querySelector('[data-morph="page"]') !== null) {
      // Scrolled past the title, the homepage fades over instead, picture and all.
      from = pageTitle();
      image = from ? lead() : null;
      project = path(location.href);
    } else {
      transition.skipTransition();
      return;
    }
    if (from) from.style.viewTransitionName = "page-title";
    if (image) image.style.viewTransitionName = "page-image";
    sessionStorage.setItem(
      config.key,
      JSON.stringify({
        to,
        at: Date.now(),
        from: from?.getBoundingClientRect() ?? null,
        image: image !== null,
        project,
      }),
    );
  });

  // The homepage's preview of `project`, made at once for the picture to land in: the module
  // that makes the real ones loads after the first frame (`preview.ts`).
  const placeholder = (project: string) => {
    const area = document.querySelector("[data-previews]");
    const source = document.getElementById("preview-data")?.textContent;
    if (!area || source === undefined || source === null || !desktop.matches) return null;
    const data: unknown = JSON.parse(source);
    const item = Array.isArray(data)
      ? data.find(
          (each: unknown) =>
            typeof each === "object" &&
            each !== null &&
            "href" in each &&
            typeof each.href === "string" &&
            path(each.href) === project,
        )
      : undefined;
    if (typeof item !== "object" || item === null || !("$" in item)) return null;
    const room = area.getBoundingClientRect();
    const box = frame(room, config.grid);
    if (!box.fits) return null;
    // A live preview (the CURVES specimen) has no still to land on: an empty frame takes the
    // picture, which dissolves as it arrives, as the preview leaves when no row is lit.
    let landing: HTMLElement;
    if (item.$ === "Image" && "src" in item && typeof item.src === "string") {
      const image = document.createElement("img");
      if ("srcset" in item && typeof item.srcset === "string") image.srcset = item.srcset;
      image.src = item.src;
      image.decoding = "sync";
      image.sizes = `${box.width}px`;
      landing = image;
    } else if (item.$ === "Video" && "poster" in item && typeof item.poster === "string") {
      const image = document.createElement("img");
      image.src = item.poster;
      image.decoding = "sync";
      landing = image;
    } else {
      landing = document.createElement("div");
      root.dataset.morphLand = "dissolve";
    }
    const still = landing instanceof HTMLImageElement;
    if (landing instanceof HTMLImageElement) landing.alt = "";
    landing.style.cssText = [
      "position:fixed",
      "z-index:1",
      "pointer-events:none",
      `left:${room.left}px`,
      `top:${room.top + box.top}px`,
      `width:${box.width}px`,
      `height:${box.height}px`,
      "object-fit:cover",
      "object-position:top",
      still ? `outline:1px solid ${config.hairline}` : "",
      "outline-offset:-1px",
      `transition:opacity ${config.settle}ms ease-out`,
    ].join(";");
    document.body.append(landing);
    return landing;
  };

  // Arriving, before the first frame: name this page's ends of the trip.
  addEventListener("pagereveal", (event) => {
    let note: unknown = null;
    try {
      note = JSON.parse(sessionStorage.getItem(config.key) ?? "null");
      sessionStorage.removeItem(config.key);
    } catch {
      note = null;
    }
    const transition = event.viewTransition;
    if (transition === null) return;
    if (
      typeof note !== "object" ||
      note === null ||
      !("to" in note) ||
      !("at" in note) ||
      !("from" in note) ||
      !("image" in note) ||
      !("project" in note) ||
      note.to !== path(location.href) ||
      typeof note.at !== "number" ||
      Date.now() - note.at > config.ttl
    ) {
      transition.skipTransition();
      return;
    }

    let title: HTMLElement | null;
    let image: HTMLElement | null = null;
    let landed: HTMLElement | null = null;
    let duration: number;
    let delay = 0;
    if (note.project === null) {
      duration = config.grow;
      title = pageTitle();
      if (note.image === true) image = lead();
    } else if (typeof note.project === "string") {
      duration = config.shrink;
      const project = note.project;
      const row = [
        ...document.querySelectorAll<HTMLAnchorElement>("[data-portfolio] a[href]"),
      ].find((link) => path(link.href) === project);
      const own = row?.querySelector<HTMLElement>('[data-morph="row"]');
      // No row for the page left (About, Contact): the homepage simply appears.
      if (!own) {
        transition.skipTransition();
        return;
      }
      // The list as it was left, so the row is where the reader last saw it.
      const list = scroller(own);
      const top = Number(sessionStorage.getItem(`${config.key}:list`));
      if (list && Number.isFinite(top)) list.scrollTop = top;
      title = onScreen(own) ? own : null;
      if (note.image === true && title) landed = placeholder(project);
      image = landed;
    } else {
      transition.skipTransition();
      return;
    }

    const from = note.from;
    if (
      title &&
      typeof from === "object" &&
      from !== null &&
      "left" in from &&
      "top" in from &&
      "right" in from &&
      "bottom" in from &&
      typeof from.left === "number" &&
      typeof from.top === "number" &&
      typeof from.right === "number" &&
      typeof from.bottom === "number"
    ) {
      const end = title.getBoundingClientRect();
      const distance = Math.max(
        Math.hypot(end.left - from.left, end.top - from.top),
        Math.hypot(end.right - from.right, end.bottom - from.bottom),
      );
      const share = distance / (0.5 * Math.hypot(innerWidth, innerHeight));
      duration = Math.round(duration * Math.min(1, Math.max(0.75, share)));
      title.style.viewTransitionName = "page-title";
      // The page fades in a beat after the title sets off; with nothing travelling, at once.
      if (note.project === null) delay = config.delay;
    }
    if (image) image.style.viewTransitionName = "page-image";
    root.dataset.morph = "";
    root.style.setProperty("--morph-duration", `${duration}ms`);
    root.style.setProperty("--morph-easing", config.easing);
    root.style.setProperty("--morph-fade", `${Math.min(config.fade, duration)}ms`);
    root.style.setProperty("--morph-fade-easing", config.fadeEasing);
    root.style.setProperty("--morph-delay", `${delay}ms`);
    root.style.setProperty("--morph-image", `${Math.min(config.image, duration)}ms`);
    const done = () => {
      clear();
      // The picture is back in its frame; it leaves as a preview does when no row is lit.
      if (!landed) return;
      const picture = landed;
      picture.addEventListener("transitionend", () => picture.remove(), { once: true });
      picture.style.opacity = "0";
    };
    void transition.finished.then(done, done);
  });
}

/** For the head of every page (`layout.tsx`). */
export const morphScript = `(${morphTransitions.toString()})(${JSON.stringify(morph)},${pathOf.toString()},${scrollerOf.toString()},${previewFrame.toString()})`;
