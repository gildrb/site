// Desktop homepage: the row under the pointer, in keyboard focus or selected with J and K
// (`keys.ts`) shows its page's lead picture below the table (`Previews` in home.tsx). The page
// carries only the empty room, and the pictures as data in its head; after the first paint, when
// the browser is idle, each picture is made, loaded and decoded at the size it shows at, so the
// first hover finds it ready. Every picture shares one frame: the text column's full width (its
// four fields), 16:10, its top and height on the 8px grid, filled edge to edge and cropped to it.
// A picture shows only once ready, and only where the frame fits above the page's bottom inset;
// in less room nothing shows.

import * as stylex from "@stylexjs/stylex";
import { h, render } from "preact";
import { previewFrame, previewGrid } from "./preview-frame.ts";
import { ui } from "./ui.tsx";

/** A still picture: its file and, where it has more widths, their set. */
type Still = { src: string; srcset: string | null };

/**
 * How an archive picture takes the frame: `Cover` scales full-bleed artwork up to fill it,
 * cropped about its centre; `Contain` shows a piece on a plain ground whole, the ground carried
 * on to the frame's edges.
 */
export type Fit = "Cover" | "Contain";

/** One of the Archive row's pictures. */
type Highlight = Still & { fit: Fit };

/** One row's picture, as `home.tsx` writes it into the page's head. */
export type PreviewData =
  | ({ $: "Image"; href: string } & Still)
  | { $: "Video"; href: string; poster: string; src: string }
  /** The CURVES specimen (`islands/curves.tsx`), live, as its case page opens. */
  | { $: "Specimen"; href: string; font: string }
  /** The Archive row: chosen archive pictures, one after another. */
  | { $: "Cycle"; href: string; highlights: Highlight[] };

/** How long each archive picture stands before the next takes its place. */
const cycleStep = 650;

const desktop = matchMedia("(min-width: 768px)");
const hover = matchMedia("(hover: hover)");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

/** `animate` plays or pauses a moving picture (a recording, the specimen); null for a still. */
type Picture = { box: HTMLElement; data: PreviewData; animate: ((on: boolean) => void) | null };

export function enablePreview(): void {
  const area = document.querySelector<HTMLElement>("[data-previews]");
  const list = document.querySelector<HTMLElement>("[data-rows]");
  const source = document.getElementById("preview-data")?.textContent;
  if (!area || !list || !source) return;
  const parsed: unknown = JSON.parse(source);
  const data = Array.isArray(parsed) ? parsed.filter(isPreviewData) : [];
  /** By the row's link; made on first load. */
  const pictures = new Map<string, Picture>();
  const ready = new Set<Picture>();
  let fits = false;
  let hovered: Element | null = null;
  let focused: Element | null = null;
  let current: Picture | undefined;
  /** The row whose picture shows: the next row's place against it sets the slide's direction. */
  let currentRow: Element | null = null;

  const place = () => {
    const frame = previewFrame(area.getBoundingClientRect(), previewGrid);
    fits = desktop.matches && frame.fits;
    for (const { box } of pictures.values()) {
      box.style.top = `${frame.top}px`;
      box.style.width = `${frame.width}px`;
      box.style.height = `${frame.height}px`;
    }
    update();
  };

  const update = () => {
    // The keys' selection first: a resting pointer does not take the table back (`keys.ts`).
    const row = desktop.matches
      ? (list.querySelector("a[href][data-selected]") ?? hovered ?? focused)
      : null;
    const picture = pictures.get(row?.getAttribute("href") ?? "");
    const shown = picture !== undefined && fits && ready.has(picture);
    if (shown && row !== null && picture !== current) {
      const side = entrySide(currentRow, row, area.hasAttribute("data-shown"));
      if (current) leave(current.box, side);
      current?.animate?.(false);
      enter(picture.box, side);
      current = picture;
      currentRow = row;
    }
    area.toggleAttribute("data-shown", shown);
    if (shown) current?.animate?.(true);
  };

  // A moving picture runs while it shows and stops once its fade has ended.
  area.addEventListener("transitionend", () => {
    if (!area.hasAttribute("data-shown")) current?.animate?.(false);
  });

  list.addEventListener("pointerover", (event) => {
    if (event.pointerType === "touch" || !hover.matches) return;
    hovered = rowOf(event.target, list);
    update();
  });
  list.addEventListener("pointerleave", () => {
    hovered = null;
    update();
  });
  list.addEventListener("focusin", (event) => {
    const row = rowOf(event.target, list);
    focused = row?.matches(":focus-visible") ? row : null;
    update();
  });
  list.addEventListener("focusout", () => {
    focused = null;
    update();
  });
  new MutationObserver(update).observe(list, {
    subtree: true,
    attributeFilter: ["data-selected"],
  });

  new ResizeObserver(place).observe(area);
  desktop.addEventListener("change", () => {
    load();
    place();
  });

  const load = () => {
    if (pictures.size > 0 || !desktop.matches) return;
    for (const item of data) {
      const box = document.createElement("div");
      box.className = stylex.props(styles.preview).className ?? "";
      // The picture a page's title takes along when the row opens (`morph.ts`).
      box.dataset.morphImage = "";
      // Decoration only: nothing in it takes focus or the pointer.
      box.inert = true;
      const picture: Picture = { box, data: item, animate: null };
      pictures.set(item.href, picture);
      area.append(box);
    }
    place();
    for (const picture of pictures.values()) {
      void fill(picture).then((done) => {
        if (!done) return;
        ready.add(picture);
        update();
      });
    }
  };
  // After the first paint, out of the way of the page's own loading.
  requestAnimationFrame(() => {
    if ("requestIdleCallback" in window) requestIdleCallback(load, { timeout: 2000 });
    else setTimeout(load, 200);
  });
}

function isPreviewData(value: unknown): value is PreviewData {
  if (typeof value !== "object" || value === null) return false;
  if (!("href" in value) || typeof value.href !== "string" || !("$" in value)) return false;
  switch (value.$) {
    case "Image":
      return isStill(value);
    case "Video":
      return (
        "poster" in value &&
        typeof value.poster === "string" &&
        "src" in value &&
        typeof value.src === "string"
      );
    case "Specimen":
      return "font" in value && typeof value.font === "string";
    case "Cycle":
      return (
        "highlights" in value &&
        Array.isArray(value.highlights) &&
        value.highlights.length > 0 &&
        value.highlights.every(
          (each: unknown) =>
            isStill(each) && "fit" in each && (each.fit === "Cover" || each.fit === "Contain"),
        )
      );
    default:
      return false;
  }
}

function isStill(value: unknown): value is Still {
  return (
    typeof value === "object" &&
    value !== null &&
    "src" in value &&
    typeof value.src === "string" &&
    "srcset" in value &&
    (value.srcset === null || typeof value.srcset === "string")
  );
}

/** The row a pointer or focus event happened in: a link in the table, or none. */
function rowOf(target: EventTarget | null, list: HTMLElement): Element | null {
  const row = target instanceof Element ? target.closest("a[href]") : null;
  return row && list.contains(row) ? row : null;
}

/** Where a picture comes in from: the side of the table its row lies on, past the last one's. */
type Side = "Above" | "Below" | "InPlace";

/**
 * A row further down brings its picture up from below, one further up brings it down from
 * above; the first picture after the frame was empty stands in place, as the frame fades in.
 */
function entrySide(previous: Element | null, next: Element, frameShown: boolean): Side {
  if (!frameShown || previous === null || previous === next) return "InPlace";
  return previous.compareDocumentPosition(next) & Node.DOCUMENT_POSITION_FOLLOWING
    ? "Below"
    : "Above";
}

function sideAttribute(side: Side): string | null {
  switch (side) {
    case "Above":
      return "above";
    case "Below":
      return "below";
    case "InPlace":
      return null;
    default: {
      const unknown: never = side;
      return unknown;
    }
  }
}

/** Puts a picture at its entry side at once, then lets it travel to the frame. */
function enter(box: HTMLElement, side: Side): void {
  const attribute = sideAttribute(side);
  box.setAttribute("data-instant", "");
  if (attribute === null) box.removeAttribute("data-side");
  else box.setAttribute("data-side", attribute);
  // Commits the start position before the transition back to the frame begins.
  void box.offsetWidth;
  box.removeAttribute("data-instant");
  // The side's offset and the frame's position share a specificity: the side must go to land.
  box.removeAttribute("data-side");
  box.setAttribute("data-current", "");
}

/** The outgoing picture leaves the way the incoming one travels: towards the opposite side. */
function leave(box: HTMLElement, incoming: Side): void {
  const attribute = sideAttribute(opposite(incoming));
  if (attribute === null) box.removeAttribute("data-side");
  else box.setAttribute("data-side", attribute);
  box.removeAttribute("data-current");
}

function opposite(side: Side): Side {
  switch (side) {
    case "Above":
      return "Below";
    case "Below":
      return "Above";
    case "InPlace":
      return "InPlace";
    default: {
      const unknown: never = side;
      return unknown;
    }
  }
}

/** Whether an image decodes: ready to paint at once, or broken. */
function decoded(image: HTMLImageElement): Promise<boolean> {
  return image.decode().then(
    () => true,
    () => false,
  );
}

/** A still's <img>, fetched at the frame's width. */
function still({ src, srcset }: Still, box: HTMLElement, className: string): HTMLImageElement {
  const image = document.createElement("img");
  image.className = className;
  image.alt = "";
  image.decoding = "async";
  image.sizes = `${box.offsetWidth || previewGrid.column}px`;
  if (srcset !== null) image.srcset = srcset;
  image.src = src;
  return image;
}

/**
 * Makes a picture's content and waits until it can show without loading anything visibly: an
 * image fetched at the frame's width and decoded; a recording's poster decoded, the recording
 * buffering behind it; the specimen drawn in its own typeface; the archive's pictures, the first
 * of them decoded. Moving pictures get their `animate`. Resolves whether it can show.
 */
async function fill(picture: Picture): Promise<boolean> {
  const { box, data } = picture;
  const className = stylex.props(ui.edge, ui.artCorner, styles.picture).className ?? "";
  switch (data.$) {
    case "Image": {
      const image = still(data, box, className);
      box.append(image);
      return decoded(image);
    }
    case "Video": {
      const poster = new Image();
      poster.src = data.poster;
      const ready = await decoded(poster);
      const video = document.createElement("video");
      video.className = className;
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.poster = data.poster;
      video.preload = "auto";
      video.src = data.src;
      box.append(video);
      picture.animate = (on) => {
        // Browsers may refuse to play (data saver, low power); the poster then simply stays.
        if (on && !reducedMotion.matches) video.play().catch(() => video.pause());
        else video.pause();
      };
      return ready;
    }
    case "Specimen": {
      // Split out, as the case page's island is (`client.ts`): the homepage loads it only when idle.
      const { Specimen } = await import("./islands/curves.tsx");
      const draw = (running: boolean) =>
        render(h(Specimen, { fill: true, cover: true, font: data.font, running }), box);
      // It steps through its glyphs only while it shows (`running`).
      draw(false);
      picture.animate = draw;
      return document.fonts.load('1em "CURVES"').then(
        (faces) => faces.length > 0,
        () => false,
      );
    }
    case "Cycle": {
      // Stacked in the frame, one showing at a time, in an order shuffled for each visit. A picture
      // joins the cycle once decoded, so none shows half-loaded; the first decoded makes the row
      // ready.
      const stacked =
        stylex.props(ui.edge, ui.artCorner, styles.picture, styles.stacked).className ?? "";
      const images = shuffled(data.highlights).map((each) => {
        const image = still(each, box, stacked);
        box.append(image);
        return { image, fit: each.fit };
      });
      const ready = new Set<HTMLImageElement>();
      let shown: HTMLImageElement | undefined;
      const show = (image: HTMLImageElement) => {
        shown?.style.removeProperty("visibility");
        image.style.visibility = "visible";
        shown = image;
      };
      const next = () => {
        const cycle = images.flatMap(({ image }) => (ready.has(image) ? [image] : []));
        const at = shown === undefined ? -1 : cycle.indexOf(shown);
        const image = cycle[(at + 1) % cycle.length];
        if (image !== undefined) show(image);
      };
      let timer = 0;
      picture.animate = (on) => {
        clearInterval(timer);
        if (on && !reducedMotion.matches) timer = window.setInterval(next, cycleStep);
      };
      return Promise.any(
        images.map(async ({ image, fit }) => {
          if (!(await decoded(image))) throw new Error(`Archive picture failed: ${image.src}`);
          if (fit === "Contain") standOnGround(image);
          ready.add(image);
          if (shown === undefined) show(image);
        }),
      ).then(
        () => true,
        () => false,
      );
    }
    default: {
      const _: never = data;
      return _;
    }
  }
}

/** A copy of `items` in a random order (Fisher–Yates), so every order is as likely. */
function shuffled<Item>(items: readonly Item[]): Item[] {
  const order = [...items];
  for (let index = order.length - 1; index > 0; index -= 1) {
    const other = Math.floor(Math.random() * (index + 1));
    const item = order[index];
    const swap = order[other];
    if (item === undefined || swap === undefined) continue;
    order[index] = swap;
    order[other] = item;
  }
  return order;
}

/**
 * Shows a picture whole, and carries the colour along its edge on to the frame's, so the frame is
 * never part empty.
 */
function standOnGround(image: HTMLImageElement): void {
  image.style.objectFit = "contain";
  const edge = edgeColor(image);
  if (edge !== null) image.style.backgroundColor = edge;
}

/** The mean colour of a picture's four corners, drawn small: the ground it stands on. */
function edgeColor(image: HTMLImageElement): string | null {
  const size = 8;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const context = canvas.getContext("2d");
  if (context === null) return null;
  context.drawImage(image, 0, 0, size, size);
  const corners = [
    [0, 0],
    [size - 1, 0],
    [0, size - 1],
    [size - 1, size - 1],
  ].map(([x = 0, y = 0]) => context.getImageData(x, y, 1, 1).data);
  const mean = (channel: number) =>
    Math.round(corners.reduce((sum, pixel) => sum + (pixel[channel] ?? 0), 0) / corners.length);
  return `rgb(${mean(0)} ${mean(1)} ${mean(2)})`;
}

const styles = stylex.create({
  /**
   * One picture in the shared frame. The current one stands in it; the others wait 40px off it,
   * slightly smaller and blurred, on the side they leave by or come in from (`data-side`). Moving
   * between rows slides the pictures with the table's direction; reduced motion only fades.
   */
  preview: {
    position: "absolute",
    left: 0,
    width: 0,
    height: 0,
    opacity: { default: 0, ":is([data-current])": 1 },
    transform: {
      default: "scale(.96)",
      ":is([data-side=below])": "translateY(40px) scale(.96)",
      ":is([data-side=above])": "translateY(-40px) scale(.96)",
      ":is([data-current])": "none",
      "@media (prefers-reduced-motion: reduce)": "none",
    },
    filter: { default: "blur(8px)", ":is([data-current])": "none" },
    transitionProperty: "opacity, transform, filter",
    transitionDuration: { default: "260ms, 560ms, 320ms", ":is([data-instant])": "0s" },
    // Transform on a spring-like overshoot: the picture lands a touch past the frame and settles.
    transitionTimingFunction: "ease-out, cubic-bezier(.34,1.36,.64,1), ease-out",
  },
  /**
   * Fills the frame, cropped to it rather than shrunk: screenshots keep their top, where a
   * window's title and a page's opening are.
   */
  picture: {
    display: "block",
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "top",
  },
  /**
   * The archive's pictures, one over another; only the one shown is visible. Cropped about the
   * centre, where a piece of work sits, or shown whole on its own ground (`fit`).
   */
  stacked: {
    position: "absolute",
    inset: 0,
    visibility: "hidden",
    objectPosition: "center",
  },
});
