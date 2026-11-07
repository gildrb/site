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
import { ui } from "./ui.tsx";

/** One row's picture, as `home.tsx` writes it into the page's head. */
export type PreviewData =
  | { $: "Image"; href: string; src: string; srcset: string | null }
  | { $: "Video"; href: string; poster: string; src: string }
  /** The CURVES specimen (`islands/curves.tsx`), live, as its case page opens. */
  | { $: "Specimen"; href: string; font: string };

const desktop = matchMedia("(min-width: 768px)");
const hover = matchMedia("(hover: hover)");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");

/** The 8px grid (`tokens.stylex.ts`) and the four fields of the text column (496px). */
const unit = 8;
const column = 4 * 14 * unit + 3 * 2 * unit;
/** The shared frame, height over width: 16:10, near most of the pictures (3:2 to 16:9). */
const ratio = 10 / 16;

/** `animate`: plays or pauses a picture that moves (a recording, the specimen); null for a still. */
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

  const place = () => {
    const box = area.getBoundingClientRect();
    const top = Math.ceil(box.top / unit) * unit;
    const room = Math.floor(box.bottom / unit) * unit - top;
    const width = Math.min(column, box.width);
    const height = Math.round((width * ratio) / unit) * unit;
    fits = desktop.matches && height <= room;
    for (const { box: frame } of pictures.values()) {
      frame.style.top = `${top - box.top}px`;
      frame.style.width = `${width}px`;
      frame.style.height = `${height}px`;
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
    if (shown && picture !== current) {
      current?.box.removeAttribute("data-current");
      current?.animate?.(false);
      current = picture;
      picture.box.setAttribute("data-current", "");
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
      return (
        "src" in value &&
        typeof value.src === "string" &&
        "srcset" in value &&
        (value.srcset === null || typeof value.srcset === "string")
      );
    case "Video":
      return (
        "poster" in value &&
        typeof value.poster === "string" &&
        "src" in value &&
        typeof value.src === "string"
      );
    case "Specimen":
      return "font" in value && typeof value.font === "string";
    default:
      return false;
  }
}

/** The row a pointer or focus event happened in: a link in the table, or none. */
function rowOf(target: EventTarget | null, list: HTMLElement): Element | null {
  const row = target instanceof Element ? target.closest("a[href]") : null;
  return row && list.contains(row) ? row : null;
}

/** Whether an image decodes: ready to paint at once, or broken. */
function decoded(image: HTMLImageElement): Promise<boolean> {
  return image.decode().then(
    () => true,
    () => false,
  );
}

/**
 * Makes a picture's content and waits until it can show without loading anything visibly: an
 * image fetched at the frame's width and decoded; a recording's poster decoded, the recording
 * buffering behind it; the specimen drawn in its own typeface. Moving pictures get their
 * `animate`. Resolves whether it can show.
 */
async function fill(picture: Picture): Promise<boolean> {
  const { box, data } = picture;
  const className = stylex.props(ui.edge, styles.picture).className ?? "";
  switch (data.$) {
    case "Image": {
      const image = document.createElement("img");
      image.className = className;
      image.alt = "";
      image.decoding = "async";
      image.sizes = `${box.offsetWidth || column}px`;
      if (data.srcset !== null) image.srcset = data.srcset;
      image.src = data.src;
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
    default: {
      const _: never = data;
      return _;
    }
  }
}

const styles = stylex.create({
  /** One picture in the shared frame; only the current one shows, swapped at once. */
  preview: {
    position: "absolute",
    left: 0,
    width: 0,
    height: 0,
    opacity: { default: 0, ":is([data-current])": 1 },
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
});
