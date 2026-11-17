// A critically damped spring (no overshoot), sampled for CSS `linear()`. `zoom.ts` moves images
// on it.
export const spring =
  "linear(0, 0.078, 0.235, 0.401, 0.549, 0.669, 0.762, 0.831, 0.882, 0.918, 0.944, 0.962, 0.974, 0.982, 0.988, 0.992, 0.995, 0.996, 0.998, 0.998, 1)";

// The length of an image's enlargement: at most 200ms, so the interaction feels immediate
// (interfaces.rauno.me), and the spring carries the distance.
export const zoomDuration = 200;

/**
 * Runs in every page's `<head>`, right after the stylesheet: on the first page of a visit, until
 * Allo has loaded, the page stays hidden, so the first frame is always the intended one (browsers
 * keep the previous page on screen meanwhile). Capped at one second so a slow or blocked font
 * never hangs the page; the metric-matched fallback then shows and swaps to Allo once it arrives.
 * Later pages of the visit have Allo in the cache and are never hidden: hiding them, even for a
 * frame, blanks the sidebar between two pages. Without JavaScript nothing is held.
 */
export const fontGate = `const r=document.documentElement;const face=[...document.fonts].find(f=>f.family.replace(/"/g,"")==="Allo");let seen=false;try{seen=sessionStorage.getItem("gildrb:font")==="1"}catch{}if(face&&face.status!=="loaded"&&!seen){r.style.setProperty("--first-paint","hidden");const go=()=>{window.__align?.();r.style.removeProperty("--first-paint")};face.load().then(go,go);setTimeout(go,1000)}if(face)face.load().then(()=>{try{sessionStorage.setItem("gildrb:font","1")}catch{}},()=>{})`;
