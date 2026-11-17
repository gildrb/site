// Case-study recordings (`Video` in markdown.tsx) play only while at least half on screen, and
// never when reduced motion is asked for: otherwise their poster stands still. A loop playing out
// of view only costs battery.

const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
const onScreen = new Set<HTMLVideoElement>();

function update(video: HTMLVideoElement) {
  // While a navigation morph runs (`settle.ts`), its trip keeps the frames; the recording
  // starts when it lands.
  const root = document.documentElement;
  if (root.dataset.morph !== undefined) {
    root.addEventListener("morphdone", () => update(video), { once: true });
    return;
  }
  if (onScreen.has(video) && !reducedMotion.matches) {
    // Browsers may refuse to play (data saver, low power); the poster then simply stays.
    video.play().catch(() => video.pause());
  } else {
    video.pause();
  }
}

export function autoplayVideos() {
  const videos = [...document.querySelectorAll<HTMLVideoElement>("video[data-autoplay]")];
  const observer = new IntersectionObserver(
    (entries) => {
      for (const { target, isIntersecting } of entries) {
        if (!(target instanceof HTMLVideoElement)) continue;
        if (isIntersecting) onScreen.add(target);
        else onScreen.delete(target);
        update(target);
      }
    },
    { threshold: 0.5 },
  );
  for (const video of videos) observer.observe(video);
  reducedMotion.addEventListener("change", () => {
    for (const video of videos) update(video);
  });
}
