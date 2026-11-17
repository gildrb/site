import * as stylex from "@stylexjs/stylex";
import { parse, sources } from "./markdown.tsx";
import { type Media, media as artwork } from "./media.ts";
import { type Case, cases } from "./site.ts";
import { baseline, colors, media, space, typeScale } from "./tokens.stylex.ts";
import { ui } from "./ui.tsx";
import { versioned } from "./versioned.ts";

/**
 * The artwork's width as a percentage of the column, as CSS: the whole column for a screenshot
 * or recording, which shows whole at its own ratio; 60% for a logo mark, so a mark and a
 * screenshot read at one optical size.
 */
function share(item: Media): string {
  return item.mark ? "60" : "100";
}

/**
 * One piece of artwork and where it comes from: a case study, or the archive alone for work
 * that has no project page.
 */
export type Work = { id: string; from: { $: "Case"; project: Case } | { $: "Archive" } };

/**
 * The archive: every `archive` media item, newest case first, each case's in its page's order and
 * then those tagged with its `project`; last the items that belong to no case, in `media.ts`
 * order.
 */
export function collect(markdown: Readonly<Record<string, string>>): Work[] {
  const entries = Object.entries(artwork).filter(([, item]) => item.archive === true);
  for (const [id, { project }] of entries) {
    if (project !== undefined && !cases.some(({ slug }) => slug === project)) {
      throw new Error(`Archive media ${id} names an unknown project: ${project}`);
    }
  }
  const work: Work[] = cases.flatMap((project) => {
    const body = markdown[project.slug];
    if (body === undefined) throw new Error(`Missing src/content/${project.slug}.md`);
    const ids = parse(body).blocks.flatMap((block) =>
      block.type === "media" ? block.items.map(({ id }) => id) : [],
    );
    const tagged = entries.filter(([, item]) => item.project === project.slug).map(([id]) => id);
    return [...ids, ...tagged]
      .filter((id, index, all) => artwork[id]?.archive === true && all.indexOf(id) === index)
      .map((id) => ({ id, from: { $: "Case", project } }));
  });
  const shown = new Set(work.map(({ id }) => id));
  const alone: Work[] = entries
    .filter(([id]) => !shown.has(id))
    .map(([id]) => ({ id, from: { $: "Archive" } }));
  return [...work, ...alone];
}

/**
 * The work's label and where it leads: the case study, or the archive page opened on this very
 * work (first in the stream and enlarged, see `client.ts`).
 */
function destination(work: Work): { label: string; href: string } {
  switch (work.from.$) {
    case "Case":
      return { label: work.from.project.name, href: `/${work.from.project.slug}` };
    case "Archive":
      return { label: "Archive", href: `/all?open=${work.id}` };
    default: {
      const _: never = work.from;
      return _;
    }
  }
}

/** What `?sort=` on the archive page orders by; archive-only work has no date. */
function sortData(work: Work) {
  switch (work.from.$) {
    case "Case": {
      const { date, title } = work.from.project;
      return { "data-date": date, "data-title": title };
    }
    case "Archive":
      return { "data-date": "", "data-title": "Archive" };
    default: {
      const _: never = work.from;
      return _;
    }
  }
}

// One work a row in the content column, each at its own ratio. Phones take the viewport less
// the two 12px gutters, up to the column's 496px, where the page centres on it (`layout.tsx`);
// tablets the viewport less the sidebar's room; desktop the column's 496px.
const workSizes =
  "(max-width: 767px) min(calc(100vw - 24px), 496px), (max-width: 815px) calc(100vw - 320px), 496px";

/**
 * How a work's image loads: the archive's first image is its largest paint, so it comes first;
 * the next few load with the page; everything below waits until it is near.
 */
type Load = "first" | "eager" | "lazy";

/** One work in the stream: the artwork at its own ratio, enlarging in place (`zoom.ts`). */
function Tile({ work, load }: { work: Work; load: Load }) {
  const item = artwork[work.id];
  if (item === undefined) throw new Error(`Unknown media id: ${work.id}`);
  const { label, href } = destination(work);
  const size = { width: `${share(item)}%`, "--ratio": String(item.height / item.width) };
  const { src, srcset } = sources(work.id);
  const art = item.video ? (
    <video
      {...stylex.props(ui.edge, ui.artCorner, styles.art)}
      width={item.width}
      height={item.height}
      poster={src}
      src={versioned(`/videos/gil-rodrigues-${work.id}.mp4`)}
      muted
      loop
      playsInline
      preload="none"
      aria-label={item.alt}
      data-autoplay
    />
  ) : (
    <img
      {...stylex.props(
        !item.mark && ui.edge,
        !item.mark && ui.artCorner,
        styles.art,
        item.mark && styles.mark,
      )}
      alt={item.alt}
      width={item.width}
      height={item.height}
      decoding="async"
      {...(load === "first" && { fetchPriority: "high" })}
      {...(load === "lazy" && { loading: "lazy" })}
      src={src}
      {...(srcset && { srcset, sizes: workSizes })}
    />
  );
  return (
    <figure {...stylex.props(styles.tile)} {...sortData(work)} data-work={work.id}>
      <button
        type="button"
        {...stylex.props(
          ui.reset,
          ui.focusRing,
          styles.frame,
          styles.zoom,
          item.mark === "center" && styles.centered,
        )}
        style={size}
        aria-label={`Enlarge: ${item.alt}`}
        aria-expanded="false"
        data-zoom
      >
        {art}
      </button>
      <figcaption {...stylex.props(styles.caption)}>
        {work.from.$ === "Case" ? (
          <a {...stylex.props(ui.quiet, ui.respond, ui.focusRing)} href={href}>
            {label}
          </a>
        ) : (
          <span {...stylex.props(styles.plain)}>{label}</span>
        )}
      </figcaption>
    </figure>
  );
}

/** The archive page's stream of work; `?sort=` from the homepage table reorders it (see `client.ts`). */
export function ArchiveGrid({ work }: { work: readonly Work[] }) {
  return (
    <div {...stylex.props(styles.grid, styles.page)} data-all-cases>
      {work.map((item, index) => (
        <Tile
          key={item.id}
          work={item}
          load={
            index === work.findIndex(({ id }) => artwork[id]?.video !== true)
              ? "first"
              : index < 5
                ? "eager"
                : "lazy"
          }
        />
      ))}
    </div>
  );
}

const styles = stylex.create({
  grid: {
    display: "grid",
    gridTemplateColumns: "minmax(0, 1fr)",
    // One empty line between works, as between any two groups (`groupGap`).
    gap: space.groupGap,
  },
  page: {
    gridColumn: { default: null, [media.mobile]: "1 / -1" },
    order: { default: null, [media.mobile]: 5 },
  },
  tile: { minWidth: 0, margin: 0 },
  /**
   * A work at its own ratio: nothing crops it to a cell, the column's width sets its size and a
   * taller work simply runs further down the page. Its height is rounded to the nearest unit
   * (`--ratio`, set per work), cropping at most half a unit, so the caption and every work below
   * stay on the baseline grid.
   */
  frame: { display: "block", width: "100%", containerType: "inline-size" },
  /** A centred mark: the button is narrower than the column, so it centres itself. */
  centered: { marginInline: "auto" },
  zoom: { cursor: { default: "auto", [media.desktop]: "zoom-in" } },
  art: {
    display: "block",
    width: "100%",
    height: `round(nearest, calc(100cqi * var(--ratio)), ${space.unit})`,
    objectFit: "cover",
    userSelect: "none",
    WebkitUserDrag: "none",
  },
  /** Marks (logos): the page's ink in light mode. */
  mark: { filter: colors.artworkFilter },
  caption: {
    display: "block",
    marginTop: space.unit,
    fontSize: typeScale.labelSize,
    lineHeight: space.linkLineHeight,
    // A label's size on the text's line: onto the text's baseline, as `ui.label`.
    position: "relative",
    top: baseline.label,
    letterSpacing: typeScale.labelTracking,
  },
  plain: { color: colors.tertiary },
});
