import { copyEmail } from "./islands/email.tsx";

/**
 * Desktop keys, Vim's, for those who look for them; the page shows no hints:
 * - Homepage: J and K step a selection through the project table, lit as the row under the
 *   pointer is (`data-selected`, see `row.tsx`); L or Enter opens it, Escape lets it go.
 * - Other pages: J and K scroll by two lines, as the arrow keys do; H or Escape goes back to the
 *   homepage.
 * - Everywhere: C copies the email address, as the Contact button does.
 * The arrow keys stay with focus and scrolling (`client.ts`); these are letters, so they never
 * take a key the page already answers.
 */
export function enableKeys(): void {
  const home = document.getElementById("site-title") !== null;
  const desktop = matchMedia("(min-width: 768px)");
  let selected: HTMLElement | undefined;
  // Where the pointer last was: scrolling the list moves rows under a resting pointer, and some
  // browsers report that as a move; only a real one hands the table back to the pointer.
  let pointer = { x: -1, y: -1 };

  const select = (row: HTMLElement | undefined) => {
    selected?.removeAttribute("data-selected");
    selected = row;
    if (!row) return;
    row.setAttribute("data-selected", "");
    reveal(row);
  };

  document.addEventListener("pointermove", (event) => {
    if (event.clientX === pointer.x && event.clientY === pointer.y) return;
    pointer = { x: event.clientX, y: event.clientY };
    if (event.pointerType === "mouse") select(undefined);
  });

  document.addEventListener("keydown", (event) => {
    if (!isCommandKey(event)) return;
    // Letters by their meaning, whatever Caps Lock says.
    const key = event.key.length === 1 ? event.key.toLowerCase() : event.key;
    switch (key) {
      case "j":
      case "k": {
        if (!desktop.matches) return;
        if (!home) {
          event.preventDefault();
          // Instant, not the page's smooth scroll: a held key repeats faster than a glide ends.
          window.scrollBy({ top: key === "j" ? 48 : -48, behavior: "instant" });
          return;
        }
        const rows = [...document.querySelectorAll<HTMLElement>("[data-rows] a[href]")];
        if (rows.length === 0) return;
        event.preventDefault();
        const active = document.activeElement;
        // A row in focus is where the selection starts; the focus gives way to it, so only one
        // row is lit.
        const focused = active instanceof HTMLElement && rows.includes(active) ? active : undefined;
        focused?.blur();
        const from = selected ?? focused;
        const at = from ? rows.indexOf(from) : -1;
        const step = key === "j" ? 1 : -1;
        select(
          at === -1
            ? rows.at(step === 1 ? 0 : -1)
            : rows[Math.min(Math.max(at + step, 0), rows.length - 1)],
        );
        return;
      }
      case "l":
      case "Enter": {
        if (!selected || event.repeat || isInteractive(document.activeElement)) return;
        event.preventDefault();
        // A click, so the link goes where a click would (`client.ts` keeps previews local).
        selected.click();
        return;
      }
      case "h":
      case "Escape": {
        if (selected && key === "Escape") {
          select(undefined);
          return;
        }
        if (home || event.repeat) return;
        event.preventDefault();
        goHome();
        return;
      }
      case "c": {
        if (event.repeat) return;
        event.preventDefault();
        // The Contact button, where the page shows one, so it says "Copied" too.
        const button = [
          ...document.querySelectorAll<HTMLButtonElement>('[data-island="email"] button'),
        ].find((each) => each.getClientRects().length > 0);
        if (button) button.click();
        else void copyEmail();
        return;
      }
      default:
        return;
    }
  });
}

/**
 * A key the page may take as a command: no modifier, not already taken, and not typed into a
 * field or an island that answers keys of its own (the Heph terminal, the CURVES specimen,
 * Archetypon). The table and the Contact button have none.
 */
export function isCommandKey(event: KeyboardEvent): boolean {
  if (event.defaultPrevented || event.isComposing) return false;
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return false;
  const target = event.target;
  if (!(target instanceof HTMLElement)) return true;
  if (target.isContentEditable || target.closest("input, textarea, select")) return false;
  const island = target.closest<HTMLElement>("[data-island]")?.dataset.island;
  return island === undefined || island === "portfolio" || island === "email";
}

/** Whether Enter already does something here: activate a link or a control. */
function isInteractive(element: Element | null): boolean {
  return (
    element instanceof HTMLElement &&
    element !== document.body &&
    element.matches("a[href], button, summary, input, select, textarea, [contenteditable]")
  );
}

/**
 * Keeps the selected row out from under the list's edge fades, where the list scrolls (dense
 * desktops). Elsewhere the table fits the viewport and nothing moves. A fade covers at most one
 * row, so a row's height clears it.
 */
function reveal(row: HTMLElement): void {
  const scroller = [...document.querySelectorAll<HTMLElement>("[data-scroll-list]")].find(
    (element) => getComputedStyle(element).overflowY === "auto",
  );
  if (!scroller) return;
  const box = row.getBoundingClientRect();
  const view = scroller.getBoundingClientRect();
  const top = view.top + box.height - box.top;
  const bottom = box.bottom - (view.bottom - box.height);
  if (top > 0) scroller.scrollTop -= top;
  else if (bottom > 0) scroller.scrollTop += bottom;
}

/**
 * Back where the reader came from when that was the homepage, so it keeps its place; otherwise to
 * it.
 */
function goHome(): void {
  const target = new URL("/", location.origin);
  const from = URL.canParse(document.referrer) ? new URL(document.referrer) : undefined;
  if (from?.origin === target.origin && from.pathname === "/" && history.length > 1) history.back();
  else location.assign(target);
}
