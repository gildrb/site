/**
 * A page's images are fetched before the reader opens it, so it opens with them in place instead
 * of showing them appear. When a pointer rests on a link to another page of this site, a finger
 * touches it, or the keyboard focuses it, the page is fetched and the images of its first screen
 * are loaded into the cache. Chrome also prerenders the page
 * itself (the speculation rules in `layout.tsx`); this covers every other browser and the images
 * a prerender leaves for later.
 */

/** The images a page shows first: enough for a tall screen of the article. */
const firstScreen = 6;

const fetched = new Set<string>();

/** A link to another page of this site; files (`.md`, `.xml`, downloads) are left alone. */
function pageUrl(target: EventTarget | null): URL | null {
  if (!(target instanceof Element)) return null;
  const link = target.closest("a[href]");
  if (!(link instanceof HTMLAnchorElement) || link.hasAttribute("download")) return null;
  const url = new URL(link.href);
  if (url.origin !== location.origin || /\.[a-z0-9]+$/i.test(url.pathname)) return null;
  if (url.pathname === location.pathname) return null;
  return url;
}

async function loadAhead(url: URL): Promise<void> {
  if (fetched.has(url.pathname)) return;
  fetched.add(url.pathname);
  const response = await fetch(url, { headers: { Accept: "text/html" } });
  if (!response.ok) return;
  const page = new DOMParser().parseFromString(await response.text(), "text/html");
  const media = [...page.querySelectorAll("main img, main video")].slice(0, firstScreen);
  for (const element of media) {
    // Same srcset and sizes in the same window: the browser picks the file the page will use.
    const image = new Image();
    if (element instanceof HTMLImageElement) {
      image.sizes = element.sizes;
      image.srcset = element.srcset;
      image.src = element.src;
    } else if (element instanceof HTMLVideoElement && element.poster !== "") {
      image.src = element.poster;
    }
    // Decoded too, so the first frame of the next page has it ready; a failure only loses that.
    image.decode().catch(() => undefined);
  }
}

/**
 * Images further down wait for the reader to scroll near them, and
 * would appear while they scroll. Once the page has loaded and the browser is idle, they load all
 * at once, lowest priority, so scrolling finds them in place.
 */
function loadRestAhead(): void {
  for (const image of document.querySelectorAll<HTMLImageElement>("img")) {
    if (image.loading !== "lazy") continue;
    image.fetchPriority = "low";
    image.loading = "eager";
  }
}

/** A reader's sign that they may open a link: the page behind it starts loading. */
function intent(event: Event): void {
  const url = pageUrl(event.target);
  // A failed fetch only means the page loads its images when opened, as without this.
  if (url) loadAhead(url).catch(() => undefined);
}

/** Safari before 26 has no idle callback: the next task after load is the closest it offers. */
function whenIdle(): void {
  if ("requestIdleCallback" in window) requestIdleCallback(loadRestAhead, { timeout: 2000 });
  else setTimeout(loadRestAhead, 0);
}

export function loadPagesAhead(): void {
  document.addEventListener("pointerover", intent, { passive: true });
  document.addEventListener("touchstart", intent, { passive: true });
  document.addEventListener("focusin", intent);
  if (document.readyState === "complete") whenIdle();
  else addEventListener("load", whenIdle, { once: true });
}
