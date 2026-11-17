/**
 * Resolves once a navigation morph has finished, or at once when none is running. Work that can
 * wait out the trip starts after it (`client.ts`, `video.ts`), so its frames stay smooth
 * (`morph.ts` announces the end as `morphdone`).
 */
export function morphSettled(): Promise<void> {
  const { promise, resolve } = Promise.withResolvers<void>();
  // `pagereveal` names the page after this module ran, so the check waits for the first frame.
  requestAnimationFrame(() => {
    const root = document.documentElement;
    if (root.dataset.morph === undefined) {
      resolve();
      return;
    }
    root.addEventListener("morphdone", () => resolve(), { once: true });
  });
  return promise;
}
