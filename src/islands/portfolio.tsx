import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "preact/hooks";
import { Row } from "../row.tsx";
import { groups, person, projects } from "../site.ts";
import { colors, listMarker, media, rootMarker, rowMarker, space } from "../tokens.stylex.ts";
import { Figures, ui } from "../ui.tsx";

// The signature's year, the build's own.
const year = new Date().getFullYear();
/**
 * The homepage project table in two groups, each under its label: Projects (software Gil
 * maintains: name and one line), then Work (client work and studies: name, what was made, year).
 * The label sits where a table header would, with the header's hairline under it; the second
 * label stands two row pitches below the last row before it, so rows stay on the 40px rhythm the
 * sidebar aligns to. The archive closes the Work group: "Archive" in the title column, the
 * count beside it. Edge fades show while the list scrolls on phones. The row under the pointer or
 * in focus brightens; nothing else appears.
 */
export function Portfolio({ more }: { more: number }) {
  const [edges, setEdges] = useState({ top: false, bottom: false });
  const section = useRef<HTMLElement>(null);
  const list = useRef<HTMLDivElement>(null);

  // Browsers with scroll-driven animations tie the edge fades to the scroll position in CSS, so
  // they are right from the first frame; this fallback only serves the others. The up-and-down
  // scroller is the list on phones, the section on dense desktops.
  useEffect(() => {
    if (CSS.supports("animation-timeline: scroll()")) return undefined;
    const elements = [section.current, list.current].filter((element) => element !== null);
    const update = () => {
      const element = elements.find((each) => getComputedStyle(each).overflowY === "auto");
      setEdges(
        element === undefined
          ? { top: false, bottom: false }
          : {
              top: element.scrollTop > 1,
              bottom: element.scrollHeight - element.clientHeight - element.scrollTop > 1,
            },
      );
    };
    update();
    const observer = new ResizeObserver(update);
    for (const element of elements) {
      observer.observe(element);
      element.addEventListener("scroll", update, { passive: true });
    }
    return () => {
      observer.disconnect();
      for (const element of elements) element.removeEventListener("scroll", update);
    };
  }, []);

  return (
    <div
      data-portfolio
      {...stylex.props(
        styles.frame,
        edges.top && styles.fadeTop,
        edges.bottom && styles.fadeBottom,
      )}
    >
      <section
        data-scroll-list
        ref={section}
        {...stylex.props(styles.section)}
        aria-labelledby="portfolio-title"
      >
        <h2 {...stylex.props(ui.srOnly)} id="portfolio-title">
          Work
        </h2>
        <div data-rows data-scroll-list ref={list} {...stylex.props(listMarker, styles.list)}>
          {groups.map((group, index) => (
            <div key={group} {...stylex.props(styles.group)}>
              <h3
                {...stylex.props(ui.label, ui.sans, styles.label, index > 0 && styles.laterLabel)}
              >
                {group}
              </h3>
              {projects
                .filter((project) => project.group.$ === group)
                .map((project, row) => (
                  <Row key={project.href} project={project} first={row === 0} home />
                ))}
              {group === "Work" && (
                <a
                  {...stylex.props(rowMarker, ui.text, ui.respond, ui.row, styles.archive)}
                  href="/all"
                >
                  <span {...stylex.props(ui.emphasis, ui.respondCell, styles.title)}>Archive</span>
                  <span {...stylex.props(ui.respondCell, styles.more)}>
                    <Figures text={String(more)} /> more
                  </span>
                </a>
              )}
            </div>
          ))}
        </div>
        {/* Phones: the signature pinned below the scrolling list, on the label rhythm
            (`laterLabel`): one pitch below Archive, always in view. */}
        <p {...stylex.props(ui.label, styles.signature)}>
          © {year} {person.name}
        </p>
      </section>
    </div>
  );
}

const scrollDriven = "@supports (animation-timeline: scroll())";

// Scroll-linked: the top fade appears once the list scrolls, the bottom one leaves at the end.
const revealTop = stylex.keyframes({ "0%": { opacity: 0 }, "4%, 100%": { opacity: 1 } });
const hideBottom = stylex.keyframes({ "0%, 96%": { opacity: 1 }, "100%": { opacity: 0 } });

const styles = stylex.create({
  frame: {
    display: "grid",
    // Both groups share these columns, so their descriptors start in one place on every screen.
    gridTemplateColumns: space.projectColumns,
    columnGap: { default: space.tableGap, [media.mobile]: space.mobileTableGap },
    // Dense desktop viewports (see `align.ts`) borrow the phone layout: the list scrolls between
    // edge fades.
    gridTemplateRows: {
      default: null,
      [media.mobile]: "minmax(0, 1fr)",
      [stylex.when.ancestor("[data-dense]", rootMarker)]: {
        [media.desktop]: "minmax(0, 1fr)",
      },
    },
    gridColumn: { default: null, [media.mobile]: "1 / -1" },
    gridRow: { default: null, [media.mobile]: 4, [media.desktop]: 2 },
    alignSelf: {
      default: null,
      [media.desktop]: "start",
      [stylex.when.ancestor("[data-dense]", rootMarker)]: { [media.desktop]: "stretch" },
    },
    containerType: "inline-size",
    position: {
      default: null,
      [media.mobile]: "relative",
      [stylex.when.ancestor("[data-dense]", rootMarker)]: { [media.desktop]: "relative" },
    },
    minHeight: {
      default: null,
      [media.mobile]: 0,
      [stylex.when.ancestor("[data-dense]", rootMarker)]: { [media.desktop]: 0 },
    },
    marginBottom: {
      default: space.textMediaGap,
      // Phones: above Safari's bottom bar too, which floats over the page.
      [media.mobile]: `calc(${space.sectionGap} + env(safe-area-inset-bottom))`,
      [stylex.when.ancestor("[data-dense]", rootMarker)]: { [media.desktop]: 0 },
    },
    timelineScope: "--portfolio",
    "::before": {
      content: {
        default: null,
        [media.mobile]: '""',
        [stylex.when.ancestor("[data-dense]", rootMarker)]: { [media.desktop]: '""' },
      },
      // At the list's top edge.
      top: 0,
      backgroundImage: `linear-gradient(to bottom, ${colors.bg}, transparent)`,
      opacity: 0,
      position: "absolute",
      insetInline: 0,
      zIndex: 2,
      // One row (a touch target): what passes under the fade is at most one row.
      height: space.touchTarget,
      pointerEvents: "none",
      animationName: { default: null, [scrollDriven]: revealTop },
      animationTimeline: "--portfolio",
      animationTimingFunction: "linear",
      animationFillMode: "both",
    },
    "::after": {
      content: {
        default: null,
        [media.mobile]: '""',
        [stylex.when.ancestor("[data-dense]", rootMarker)]: { [media.desktop]: '""' },
      },
      // Phones: above the pinned signature (`signature`), so the fade hugs the list's last row.
      bottom: { default: 0, [media.mobile]: space.touchTarget },
      backgroundImage: `linear-gradient(to top, ${colors.bg}, transparent)`,
      opacity: "var(--list-overflows, 0)",
      position: "absolute",
      insetInline: 0,
      zIndex: 2,
      height: space.touchTarget,
      pointerEvents: "none",
      animationName: { default: null, [scrollDriven]: hideBottom },
      animationTimeline: "--portfolio",
      animationTimingFunction: "linear",
      animationFillMode: "both",
    },
  },
  fadeTop: { "::before": { opacity: 1 } },
  fadeBottom: { "::after": { opacity: 1 } },
  /**
   * One group: its label and rows on the table's shared columns: the title column, then what
   * fills the rest; Work sets its full date right, its last figure on the table's edge where the
   * hairlines end. Client work keeps when it was made; Projects, which are ongoing, show no date
   * but where they run, set right in the same column.
   */
  group: {
    display: "grid",
    gridColumn: "1 / -1",
    // Phones: rows are two-line cells with their own columns (`row.tsx`); the group's two columns
    // serve the Archive footer: its name left, the count set right as the rows' facts are.
    gridTemplateColumns: { default: "subgrid", [media.mobile]: "minmax(0, 1fr) auto" },
    columnGap: { default: null, [media.mobile]: space.mobileTableGap },
  },
  /**
   * A group's label, where a table header would be: the label's size, grey, a hairline under it
   * drawn inside, so it never adds to the height. Desktop: 32px, the old header's box (its line
   * and a row padding below), so Contact still sits on it. Phones: one touch target.
   */
  label: {
    gridColumn: "1 / -1",
    margin: 0,
    paddingBlock: { default: space.touchInset, [media.desktop]: `0 ${space.portfolioRowPadding}` },
    color: colors.quaternary,
    fontWeight: "inherit",
    boxShadow: `inset 0 -1px ${colors.hairline}`,
  },
  /**
   * A later group's label stands one empty line below the last row, as every group does. Desktop:
   * `groupGap` from the last line's box, less the row padding already there. Phones: its baseline
   * two line intervals (64px) below the last row's, as the first label stands below the About
   * line; the row's touch inset and the label's own count toward it.
   */
  laterLabel: {
    paddingTop: {
      default: `calc(8 * ${space.unit} - ${space.linkLineHeight} - ${space.touchInset})`,
      [media.desktop]: `calc(${space.groupGap} - ${space.portfolioRowPadding})`,
    },
  },
  title: {
    gridColumn: 1,
    // The archive's title keeps the footer's colour, but dims while another row is lit, as the
    // rows' own titles do (`row.tsx`). The restores nest to beat the dim, as in `row.tsx`.
    color: {
      default: "inherit",
      [media.hover]: { [stylex.when.ancestor(":hover", listMarker)]: colors.quaternary },
      [stylex.when.ancestor(":hover", rowMarker)]: {
        [media.hover]: { [stylex.when.ancestor(":hover", listMarker)]: "inherit" },
      },
      [stylex.when.ancestor(":focus-visible", rowMarker)]: {
        [media.hover]: { [stylex.when.ancestor(":hover", listMarker)]: "inherit" },
      },
      [stylex.when.ancestor("[data-selected]", rowMarker)]: {
        [media.hover]: { [stylex.when.ancestor(":hover", listMarker)]: "inherit" },
      },
    },
  },
  /**
   * Phones: the signature pinned under the list (`section`'s last row), on the label's own box
   * (`paddingBlock` a touch inset), so it stands below Archive one pitch, always in view.
   * Desktop keeps the signature in the sidebar (`layout.tsx`).
   */
  signature: {
    display: { default: "none", [media.mobile]: "block" },
    gridColumn: "1 / -1",
    margin: 0,
    paddingBlock: space.touchInset,
  },
  /** The Work group's footer: "Archive" in the title column, the count beside it. */
  archive: {
    display: "grid",
    gridColumn: "1 / -1",
    gridTemplateColumns: "subgrid",
    alignItems: "baseline",
    paddingBlock: { default: space.touchInset, [media.desktop]: space.portfolioRowPadding },
    boxShadow: `inset 0 1px ${colors.hairline}`,
    color: colors.primary,
    textDecoration: "none",
    touchAction: "manipulation",
    userSelect: "none",
    outline: { default: null, ":focus-visible": `1px solid ${colors.primary}` },
    outlineOffset: space.focusOffset,
    borderRadius: { default: null, ":focus-visible": `calc(${space.radius} / 2)` },
  },
  /** As a row's subject: dim until the footer is hovered, focused or selected (`keys.ts`). */
  more: {
    gridColumn: 2,
    justifySelf: { default: null, [media.mobile]: "end" },
    color: {
      default: colors.tertiary,
      [media.hover]: { [stylex.when.ancestor(":hover", listMarker)]: colors.quaternary },
      [stylex.when.ancestor(":hover", rowMarker)]: {
        [media.hover]: { [stylex.when.ancestor(":hover", listMarker)]: colors.primary },
      },
      [stylex.when.ancestor(":focus-visible", rowMarker)]: {
        [media.hover]: { [stylex.when.ancestor(":hover", listMarker)]: colors.primary },
      },
      [stylex.when.ancestor("[data-selected]", rowMarker)]: {
        [media.hover]: { [stylex.when.ancestor(":hover", listMarker)]: colors.primary },
      },
    },
  },
  section: {
    display: {
      default: "grid",
      [media.desktop]: "contents",
      [stylex.when.ancestor("[data-dense]", rootMarker)]: { [media.desktop]: "grid" },
    },
    gridTemplateColumns: { default: "subgrid", [media.mobile]: "minmax(0, 1fr)" },
    // Phones: the list scrolls (`list`), the signature stays under it (`signature`).
    gridTemplateRows: { default: null, [media.mobile]: "minmax(0, 1fr) auto" },
    gridColumn: "1 / -1",
    gridRow: {
      default: null,
      [media.mobile]: 1,
      [stylex.when.ancestor("[data-dense]", rootMarker)]: { [media.desktop]: 1 },
    },
    minWidth: 0,
    minHeight: {
      default: null,
      [media.mobile]: 0,
      [stylex.when.ancestor("[data-dense]", rootMarker)]: { [media.desktop]: 0 },
    },
    alignContent: "start",
    overflowY: {
      default: null,
      [stylex.when.ancestor("[data-dense]", rootMarker)]: { [media.desktop]: "auto" },
    },
    scrollbarWidth: "none",
    // No overscroll lock: a pull past the list's top must chain to the page so the browser's
    // pull to refresh stays available.
    scrollTimeline: { default: "--portfolio y", [media.mobile]: "none" },
    // One row padding below the last row, as above each row's text.
    paddingBottom: {
      default: null,
      [stylex.when.ancestor("[data-dense]", rootMarker)]: {
        [media.desktop]: space.portfolioRowPadding,
      },
    },
    "::-webkit-scrollbar": { display: "none" },
  },
  list: {
    display: "grid",
    gridColumn: "1 / -1",
    // Phones: one column; the rows set their own (`row.tsx`).
    gridTemplateColumns: { default: "subgrid", [media.mobile]: "minmax(0, 1fr)" },
    alignContent: "start",
    position: "relative",
    // Phones: the up-and-down scroller.
    minHeight: { default: null, [media.mobile]: 0 },
    overflowY: { default: null, [media.mobile]: "auto" },
    overflowX: { default: null, [media.mobile]: "hidden" },
    // Phones: the list keeps its bounce to itself, so the pull past its top never drags the
    // page or the name bar with it; the pull to refresh stays on the page's own edges.
    overscrollBehaviorY: { default: null, [media.mobile]: "contain" },
    scrollTimeline: { default: null, [media.mobile]: "--portfolio y" },
    paddingBottom: { default: null, [media.mobile]: space.portfolioRowPadding },
    "::-webkit-scrollbar": { display: "none" },
  },
});
