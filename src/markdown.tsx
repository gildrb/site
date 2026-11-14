import { readdirSync } from "node:fs";
import * as stylex from "@stylexjs/stylex";
import type { ComponentChildren } from "preact";
import { Island } from "./island.tsx";
import { Command } from "./islands/command.tsx";
import { Fold } from "./islands/ben-davis.tsx";
import { Specimen } from "./islands/curves.tsx";
import { Terminal } from "./islands/heph.tsx";
import { media } from "./media.ts";
import { baseline, colors, media as breakpoints, space, typeScale } from "./tokens.stylex.ts";
import { ui } from "./ui.tsx";
import { versioned } from "./versioned.ts";

type Block =
  | { type: "h2" | "h3" | "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "media"; items: { id: string; caption: string }[] }
  | { type: "code"; language: string; title: string; code: string };

/** Figures that are live components rather than files in `media.ts`. */
export const demos = new Set(["heph-demo", "curves-demo", "ben-davis-demo"]);

const mediaLine = /^!\[(.*)\]\(media:([a-z0-9-]+)\)$/;

/** The images a page opens with, before any text: a banner, framed by the table's hairline. */
export function bannerOf(blocks: Block[]): Extract<Block, { type: "media" }> | undefined {
  const [first] = blocks;
  return first?.type === "media" ? first : undefined;
}

/**
 * The first recording or image a page shows, the banner where it opens with one. Live demos
 * count where `live` names them; the others are passed over for the next file (`demos`). The
 * homepage previews its row with it (`home.tsx`).
 */
export function leadOf(markdown: string, live: ReadonlySet<string>): string | undefined {
  return parse(markdown)
    .blocks.flatMap((block) => (block.type === "media" ? block.items : []))
    .find(({ id }) => !demos.has(id) || live.has(id))?.id;
}

/** Parses the case-study Markdown subset. */
export function parse(markdown: string): { title: string; blocks: Block[] } {
  const [titleLine = "", ...lines] = markdown.replaceAll("\r\n", "\n").trim().split("\n");
  if (!titleLine.startsWith("# ")) throw new Error("Case Markdown must begin with one # title.");
  const blocks: Block[] = [];
  for (let index = 0; index < lines.length;) {
    const line = lines[index] ?? "";
    const figure = line.match(mediaLine);
    if (!line) {
      index += 1;
    } else if (line.startsWith("## ") || line.startsWith("### ")) {
      blocks.push({ type: line.startsWith("## ") ? "h2" : "h3", text: line.replace(/^#+ /, "") });
      index += 1;
    } else if (figure) {
      const previous = blocks.at(-1);
      const item = { caption: figure[1] ?? "", id: figure[2] ?? "" };
      if (previous?.type === "media" && mediaLine.test(lines[index - 1] ?? "")) {
        previous.items.push(item);
      } else {
        blocks.push({ type: "media", items: [item] });
      }
      index += 1;
    } else if (line.startsWith("```")) {
      const end = lines.indexOf("```", index + 1);
      if (end === -1) throw new Error("Unclosed fenced code block.");
      blocks.push({
        type: "code",
        language: line.match(/^```(\S*)/)?.[1] ?? "",
        title: line.match(/title="([^"]+)"/)?.[1] ?? "",
        code: lines.slice(index + 1, end).join("\n"),
      });
      index = end + 1;
    } else if (line.startsWith("- ")) {
      const items: string[] = [];
      for (; lines[index]?.startsWith("- "); index += 1) items.push((lines[index] ?? "").slice(2));
      blocks.push({ type: "list", items });
    } else {
      const text: string[] = [];
      for (; /^(?!#|```|- |!\[)./.test(lines[index] ?? ""); index += 1)
        text.push(lines[index] ?? "");
      blocks.push({ type: "p", text: text.join(" ") });
    }
  }
  return { title: titleLine.slice(2), blocks };
}

const inline =
  /`([^`]+)`|\[([^\]]+)\]\(((?:https?:\/\/|mailto:|\/)[^\s)]*)\)|\*\*([^*]+)\*\*|\*([^*]+)\*/g;

function Inline({ text }: { text: string }) {
  const source = text.trim();
  const nodes: ComponentChildren[] = [];
  let last = 0;
  for (const match of source.matchAll(inline)) {
    const [whole, code, label, href = "", strong, em] = match;
    nodes.push(source.slice(last, match.index));
    last = match.index + whole.length;
    if (code)
      nodes.push(<code {...stylex.props(ui.mono, ui.codeSurface, styles.code)}>{code}</code>);
    else if (label) {
      const external = href.startsWith("http") && { rel: "noopener noreferrer" };
      nodes.push(
        <a
          {...stylex.props(ui.outbound, styles.link, ui.respond, ui.focusRing)}
          href={href}
          {...external}
        >
          {label}
        </a>,
      );
    } else if (strong) nodes.push(<strong {...stylex.props(styles.strong)}>{strong}</strong>);
    else nodes.push(<em>{em}</em>);
  }
  nodes.push(source.slice(last));
  return <>{nodes}</>;
}

const images = readdirSync("public/images/optimized");

function Image({
  id,
  sizes,
  eager,
  fill,
}: {
  id: string;
  sizes: string;
  eager: boolean;
  fill: boolean;
}) {
  const item = media[id];
  if (!item) throw new Error(`Unknown media id: ${id}`);
  const { src, srcset } = sources(id);
  return (
    <button
      type="button"
      {...stylex.props(
        ui.reset,
        ui.focusRing,
        styles.zoom,
        item.mark && styles.mark,
        item.mark === "center" && styles.centered,
        fill && styles.fill,
      )}
      aria-label={`Enlarge: ${item.alt}`}
      aria-expanded="false"
      data-zoom
    >
      <img
        {...stylex.props(
          !item.mark && ui.edge,
          styles.image,
          item.mark ? styles.markOnGrid : styles.onGrid,
          item.mark && styles.markImage,
          fill && (item.mark ? styles.contain : styles.cover),
        )}
        style={{ "--ratio": String(item.height / item.width) }}
        alt={item.alt}
        width={item.width}
        height={item.height}
        decoding="async"
        {...(eager ? { fetchpriority: "high" } : { loading: "lazy" })}
        src={src}
        {...(srcset && { srcset, sizes })}
      />
    </button>
  );
}

/**
 * A recording: a still poster until `video.ts` plays it, silently and on a loop, while it is on
 * screen and motion is allowed. It enlarges as an image does (`zoom.ts`), the copy playing on
 * from the same moment.
 */
function Video({ id, fill }: { id: string; fill: boolean }) {
  const item = media[id];
  if (!item) throw new Error(`Unknown media id: ${id}`);
  return (
    <button
      type="button"
      {...stylex.props(ui.reset, ui.focusRing, styles.zoom, fill && styles.fill)}
      aria-label={`Enlarge: ${item.alt}`}
      aria-expanded="false"
      data-zoom
    >
      <video
        {...stylex.props(ui.edge, styles.image, styles.onGrid, fill && styles.cover)}
        style={{ "--ratio": String(item.height / item.width) }}
        width={item.width}
        height={item.height}
        poster={sources(id).src}
        src={versioned(`/videos/gil-rodrigues-${id}.mp4`)}
        muted
        loop
        playsInline
        preload="none"
        aria-label={item.alt}
        data-autoplay
      />
    </button>
  );
}

// The case pages' column: four fields, 496px from 816px up (the 752px layout and its 32px
// margins); between 768px and 815px the viewport less the margins, the sidebar and its gutter.
// Two images in a row share it, less their 24px gap. A banner spans the same fields as the text.
// Phones (`media.mobile`, to 767px) take the viewport less the two 12px gutters, up to the
// column's 496px, where the page centres on it (`layout.tsx`).
const singleSizes =
  "(max-width: 767px) min(calc(100vw - 24px), 496px), (max-width: 815px) calc(100vw - 320px), 496px";
const gridSizes =
  "(max-width: 767px) min(calc(100vw - 24px), 496px), (max-width: 815px) calc(50vw - 172px), 236px";

/** The `sizes` of an image alone or one of a row of two. */
export function sizesFor(grid: boolean): string {
  return grid ? gridSizes : singleSizes;
}

/** The responsive variants of `gil-rodrigues-<id>-<width>.<ext>`, or the single vector file. */
export function sources(id: string): { src: string; srcset?: string } {
  const pattern = new RegExp(`^gil-rodrigues-${id}(?:-(\\d+))?\\.\\w+$`);
  const files = images
    .map((file) => ({ file, width: Number(file.match(pattern)?.[1]) }))
    .filter(({ file }) => pattern.test(file))
    .toSorted((left, right) => left.width - right.width);
  const widest = files.findLast(({ width }) => width <= 960) ?? files[0];
  if (!widest) throw new Error(`No image files for media id: ${id}`);
  const src = versioned(`/images/optimized/${widest.file}`);
  if (!widest.width) return { src };
  const srcset = files
    .map(({ file, width }) => `${versioned(`/images/optimized/${file}`)} ${width}w`)
    .join(", ");
  return { src, srcset };
}

function Figures({
  items,
  eager,
  banner,
  lead,
}: {
  items: { id: string; caption: string }[];
  eager: boolean;
  banner: boolean;
  lead: string | undefined;
}) {
  const grid = items.length > 1;
  return (
    <div {...stylex.props(styles.media, grid && styles.grid)}>
      {items.map(({ id, caption }, index) => (
        <figure
          {...stylex.props(
            styles.figure,
            banner && styles.window,
            // The demos draw their own frame, rounded with them on small screens.
            banner && !demos.has(id) && styles.frame,
          )}
          // The homepage previews this picture; it travels with the title (`morph.ts`).
          data-lead={id === lead || undefined}
        >
          {id === "heph-demo" ? (
            <Island
              name="heph"
              component={Terminal}
              props={{
                fill: banner,
                wallpaper: { ...sources("heph-forge"), sizes: sizesFor(grid) },
              }}
            />
          ) : id === "curves-demo" ? (
            <Island
              name="curves"
              component={Specimen}
              props={{
                fill: banner,
                cover: false,
                font: versioned("/fonts/curves.woff2"),
                running: true,
              }}
            />
          ) : id === "ben-davis-demo" ? (
            <Island
              name="ben-davis"
              component={Fold}
              props={{
                fill: banner,
                player: versioned("/ben-davis/lottie.min.js"),
                animation: versioned("/ben-davis/ben-davis-hover.json"),
              }}
            />
          ) : media[id]?.video ? (
            <Video id={id} fill={banner} />
          ) : (
            <Image id={id} sizes={sizesFor(grid)} eager={eager && index === 0} fill={banner} />
          )}
          {caption && (
            <figcaption {...stylex.props(styles.small, styles.caption)}>
              <Inline text={caption} />
            </figcaption>
          )}
        </figure>
      ))}
    </div>
  );
}

type Token = [kind: keyof typeof tokenStyles | null, text: string];

/** Tokenizes TOML well enough to tint keys, strings, numbers, comments and punctuation. */
function toml(source: string): Token[] {
  const tokens: Token[] = [];
  let tableDepth = 0;
  let arrayDepth = 0;
  let valueContext = false;
  let lineStart = true;
  for (let rest = source; rest;) {
    const [text = "", kind]: [string | undefined, Token[0]] = rest.startsWith("#")
      ? [rest.match(/^[^\n]*/)?.[0], "comment"]
      : /^["']/.test(rest)
        ? [rest.match(/^("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')/)?.[0] ?? rest, "string"]
        : /^\s/.test(rest)
          ? [rest.match(/^\s+/)?.[0], null]
          : /^-?(?:\d|\.\d)/.test(rest)
            ? [rest.match(/^-?(?:\d+(?:\.\d+)?|\.\d+)[a-zA-Z]*/)?.[0], "number"]
            : /^[a-zA-Z_]/.test(rest)
              ? [rest.match(/^[a-zA-Z_][\w.-]*/)?.[0], null]
              : [rest.charAt(0), null];
    let tokenKind: Token[0] = kind;
    if (!kind && /^[a-zA-Z_]/.test(text)) {
      const next = rest.slice(text.length).match(/^\s*([=.\]])/)?.[1];
      tokenKind = tableDepth > 0 || next === "=" ? "key" : "value";
      valueContext = false;
    } else if (!kind && "[]{},.".includes(text)) {
      tokenKind = "punctuation";
      if (text === "[" && (arrayDepth > 0 || valueContext)) {
        arrayDepth += 1;
        valueContext = false;
      } else if (text === "[") {
        if (tableDepth > 0 || lineStart) tableDepth += 1;
        else arrayDepth += 1;
      } else if (text === "]") {
        if (arrayDepth > 0) arrayDepth -= 1;
        else if (tableDepth > 0) tableDepth -= 1;
      }
    } else if (!kind && text === "=") {
      tokenKind = "operator";
      valueContext = true;
    }
    lineStart = tokenKind === null && /^\s+$/.test(text) ? lineStart || text.includes("\n") : false;
    tokens.push([tokenKind, text]);
    rest = rest.slice(text.length);
  }
  return tokens;
}

function Code({ language, title, code }: { language: string; title: string; code: string }) {
  const label = title && (
    <p {...stylex.props(styles.small, styles.codeLabel)}>
      <Inline text={title} />
    </p>
  );
  // A shell block is commands to run in order: one block, one copy button for all of them.
  if (language === "sh")
    return (
      <>
        {label}
        <Island
          name="command"
          component={Command}
          props={{ commands: code.split("\n").filter((line) => line.trim() !== "") }}
        />
      </>
    );
  const tokens: Token[] = language === "toml" ? toml(code) : [[null, code]];
  return (
    <>
      {label}
      <pre {...stylex.props(ui.mono, ui.edge, styles.pre)}>
        <code>
          {tokens.map(([kind, text]) =>
            text
              .split(/([\u2190-\u2199])/)
              .map((part, index) =>
                index % 2 ? (
                  <span {...stylex.props(ui.sans)}>{part}</span>
                ) : kind ? (
                  <span {...stylex.props(tokenStyles[kind])}>{part}</span>
                ) : (
                  part
                ),
              ),
          )}
        </code>
      </pre>
    </>
  );
}

/** A heading's text without its inline Markdown, as the contents list shows it. */
function plain(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[`*]/g, "")
    .trim();
}

export type Heading = { id: string; text: string };

type Anchor = Heading & { top: boolean };

/**
 * Every heading's anchor, by block index, and whether it opens a part of the page. A `##` always
 * does; a `###` does before the first `##` (case studies have none) and is a subheading after it.
 */
function anchors(blocks: readonly Block[]): Map<number, Anchor> {
  const found = new Map<number, Anchor>();
  const used = new Set<string>();
  let chapter = false;
  blocks.forEach((block, index) => {
    if (block.type !== "h2" && block.type !== "h3") return;
    if (block.type === "h2") chapter = true;
    const text = plain(block.text);
    const base =
      text
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || "part";
    let id = base;
    for (let count = 2; used.has(id); count += 1) id = `${base}-${count}`;
    used.add(id);
    found.set(index, { id, text, top: block.type === "h2" || !chapter });
  });
  return found;
}

/** What a block is, for the space above it. */
type Kind = "part" | "subheading" | "text" | "figure";

/** The space above a block; see `gap`. */
type Spacing = "partGap" | "headingGap" | "lineGap";

/**
 * The page's vertical rhythm, on the 24px line: a part opens two lines below what came before, a
 * heading sits 8px above its own text, and every other block is one line from the last.
 */
function gap(kind: Kind, previous: Kind | null): Spacing | null {
  if (previous === null) return null;
  if (kind === "part") return "partGap";
  if (previous === "part" || previous === "subheading") return "headingGap";
  return "lineGap";
}

/**
 * Renders a page's Markdown, every page alike: the title for screen readers (the page's name sits
 * above it), then the blocks. The first paragraph is the opening, at full contrast, wherever it stands
 * (n0thing opens with an image and a part). `codeLine` (the source code) follows it, then `tool`
 * (Archetypon's converter), then the rest; `sourcesLine` (where else the work lives) ends the
 * page. `eager` gives the first image high fetch priority. `reading` (a page with contents): the
 * images a page opens with are a banner, framed by a hairline. `lead`: the picture the homepage
 * previews for this page (`leadOf`).
 */
export function Article({
  markdown,
  eager,
  codeLine = null,
  sourcesLine = null,
  tool = null,
  reading = false,
  lead,
}: {
  markdown: string;
  eager: boolean;
  codeLine?: ComponentChildren;
  sourcesLine?: ComponentChildren;
  tool?: ComponentChildren;
  reading?: boolean;
  lead?: string | undefined;
}) {
  const { title, blocks } = parse(markdown);
  const found = anchors(blocks);
  const firstMedia = blocks.find((block) => block.type === "media");
  const banner = reading ? bannerOf(blocks) : undefined;
  const opening = blocks.findIndex((block) => block.type === "p");
  const nodes: ComponentChildren[] = [];
  let previous: Kind | null = null;
  let pendingTool = tool;
  const place = (
    kind: Kind,
    render: (
      layout: readonly [false | (typeof styles)[Spacing], false | typeof styles.measure],
    ) => ComponentChildren,
    width: false | typeof styles.measure = styles.measure,
  ) => {
    const spacing = gap(kind, previous);
    nodes.push(render([spacing !== null && styles[spacing], width]));
    previous = kind;
  };
  const placeTool = () => {
    if (pendingTool === null || pendingTool === undefined) return;
    const content = pendingTool;
    pendingTool = null;
    place("figure", (spacing) => <div {...stylex.props(spacing)}>{content}</div>);
  };
  for (const [index, block] of blocks.entries()) {
    const anchor = found.get(index);
    if (index === opening + 1 && opening !== -1) {
      if (codeLine !== null)
        place("text", (spacing) => <div {...stylex.props(spacing)}>{codeLine}</div>);
      placeTool();
    }
    switch (block.type) {
      case "h2":
      case "h3": {
        const top = anchor?.top === true;
        const Tag = top ? "h2" : "h3";
        place(top ? "part" : "subheading", (spacing) => (
          <Tag
            {...stylex.props(
              ui.prose,
              styles.heading,
              top ? [ui.heading, styles.part] : [ui.text, styles.subheading],
              spacing,
            )}
            id={anchor?.id}
          >
            <Inline text={block.text} />
          </Tag>
        ));
        break;
      }
      case "p":
        place("text", (spacing) => (
          <p {...stylex.props(ui.prose, styles.prose, spacing)}>
            <Inline text={block.text} />
          </p>
        ));
        break;
      case "list":
        place("text", (spacing) => (
          <ul {...stylex.props(styles.list, spacing)}>
            {block.items.map((item, itemIndex) => (
              <li
                {...stylex.props(
                  ui.prose,
                  styles.prose,
                  styles.item,
                  itemIndex > 0 && styles.nextItem,
                )}
              >
                <Inline text={item} />
              </li>
            ))}
          </ul>
        ));
        break;
      case "media":
        place(
          "figure",
          (spacing) => (
            <div {...stylex.props(spacing)}>
              <Figures
                items={block.items}
                eager={eager && block === firstMedia}
                banner={block === banner}
                lead={lead}
              />
            </div>
          ),
          false,
        );
        break;
      case "code":
        place("figure", (spacing) => (
          <div {...stylex.props(spacing)}>
            <Code language={block.language} title={block.title} code={block.code} />
          </div>
        ));
        break;
      default: {
        const _: never = block;
        return _;
      }
    }
  }
  placeTool();
  if (sourcesLine !== null)
    place("text", (spacing) => <div {...stylex.props(spacing)}>{sourcesLine}</div>);
  return (
    <>
      <h1 {...stylex.props(ui.prose, styles.heading, ui.srOnly)}>
        <Inline text={title} />
      </h1>
      {nodes}
    </>
  );
}

export const styles = stylex.create({
  /**
   * Every heading: on the page's line, clear of the top when jumped to. Phones: below the sticky
   * name bar (a line, padded by `sectionGap` above and a unit below, `layout.tsx`), then two units
   * clear of it.
   */
  heading: {
    color: colors.primary,
    lineHeight: space.linkLineHeight,
    scrollMarginTop: {
      default: space.pageInset,
      [breakpoints.mobile]: `calc(${space.sectionGap} + ${space.linkLineHeight} + 3 * ${space.unit})`,
    },
  },
  /** A part of the page: as large as the name and the breadcrumb, never larger. */
  part: { fontWeight: typeScale.textWeight },
  /** A step inside a part: running-text size (`ui.text`), set apart by weight. */
  subheading: { fontWeight: typeScale.emphasisWeight },
  prose: { color: colors.primary, fontWeight: colors.proseWeight },
  /** The text's width. */
  measure: { maxWidth: space.contentColumn },
  partGap: { marginTop: `calc(2 * ${space.linkLineHeight})` },
  headingGap: { marginTop: space.unit },
  lineGap: { marginTop: space.linkLineHeight },
  /** Three units: room for the square marker and its space outside the text. */
  list: { paddingLeft: `calc(3 * ${space.unit})`, listStyleType: "square" },
  item: { "::marker": { color: colors.tertiary } },
  nextItem: { marginTop: space.unit },
  /** Set with `ui.outbound` and `ui.respond`. */
  link: { color: { default: colors.primary, ":focus-visible": colors.primary } },
  /**
   * Inline code: the code size on its sentence's line, never spreading the lines (`lineHeight: 1`).
   * On `ui.codeSurface` with `ui.edge`. An inline box is as tall as its font's glyph
   * box: Commit Mono's ascent and descent are 0.9em and 0.2em, which browsers round to whole
   * pixels at 16px (14.4 → 14, 3.2 → 3), so 17px, and the descenders of g and y would touch the
   * edge. The padding fills it to the label's line, 20px: (20 - 17) / 2 = 1.5px each way, which
   * leaves 2px of the 24px line above and below, so chips on two lines never meet. Half a unit at
   * each side, half the surface corner: a chip at text size. A chip that breaks over two lines
   * closes at both ends.
   */
  code: {
    fontSize: typeScale.monoSize,
    fontWeight: typeScale.textWeight,
    // A box shorter than the line, so the mono face's own ascent and descent never push the line
    // past 24px and the lines below off the baseline grid; padding and fill are unaffected.
    lineHeight: 1,
    paddingBlock: "calc((20px - 17px) / 2)",
    paddingInline: `calc(${space.unit} / 2)`,
    borderRadius: `calc(${space.radius} / 2)`,
    boxDecorationBreak: "clone",
    WebkitBoxDecorationBreak: "clone",
    color: colors.primary,
  },
  strong: { color: colors.primary, fontWeight: typeScale.emphasisWeight },
  small: {
    color: colors.tertiary,
    fontSize: typeScale.labelSize,
    lineHeight: space.linkLineHeight,
    // A label's size on the text's line: onto the text's baseline, as `ui.label`.
    position: "relative",
    top: baseline.label,
    letterSpacing: typeScale.labelTracking,
  },
  /** A row of figures; its width is what a banner's window height is taken from. */
  media: { width: "100%", containerType: "inline-size" },
  grid: {
    display: "grid",
    gridTemplateColumns: {
      default: "repeat(2, minmax(0, 1fr))",
      [breakpoints.mobile]: "1fr",
    },
    gap: space.sectionGap,
  },
  /** A figure's width is what its image's rounded height is taken from (`onGrid`). */
  figure: { minWidth: 0, containerType: "inline-size" },
  /**
   * A banner's window on desktop: 4:3, but never so tall that the first heading leaves the first
   * screen, and rounded down to a unit so the text under it stays on the baseline grid. Every
   * case page's text starts at the same height; the artwork is cut at the window's edge and keeps
   * going past it.
   */
  window: {
    height: {
      default: null,
      [breakpoints.desktop]: `round(down, min(calc(100cqi * 3 / 4), calc(100svh - 240px)), ${space.unit})`,
    },
    overflow: "hidden",
  },
  /** A banner's frame: the homepage table's hairline, over the artwork. */
  frame: {
    position: "relative",
    "::after": {
      content: '""',
      position: "absolute",
      inset: 0,
      boxShadow: `inset 0 0 0 1px ${colors.hairline}`,
      pointerEvents: "none",
    },
  },
  /** Fills the banner window on desktop: artwork is cropped, a mark is shown whole. */
  fill: { height: { default: null, [breakpoints.desktop]: "100%" } },
  cover: {
    height: {
      default: `round(nearest, calc(100cqi * var(--ratio)), ${space.unit})`,
      [breakpoints.desktop]: "100%",
    },
    objectFit: "cover",
    objectPosition: "50% 0",
  },
  contain: {
    height: {
      default: `round(nearest, calc(88cqi * var(--ratio)), ${space.unit})`,
      [breakpoints.desktop]: "100%",
    },
    objectFit: "contain",
  },
  /** Every image and recording: rectangular, as the homepage's previews (`preview.ts`). */
  image: {
    display: "block",
    width: "100%",
    height: "auto",
    userSelect: "none",
    WebkitUserDrag: "none",
  },
  /**
   * An image or recording at its own ratio (`--ratio`), its height rounded to the nearest unit,
   * cropping at most half a unit, so the caption and the text below stay on the baseline grid.
   */
  onGrid: {
    height: `round(nearest, calc(100cqi * var(--ratio)), ${space.unit})`,
    objectFit: "cover",
  },
  /** The same for a mark, which is 88% of its figure's width (`mark`). */
  markOnGrid: {
    height: `round(nearest, calc(88cqi * var(--ratio)), ${space.unit})`,
    objectFit: "contain",
  },
  /** The button around each image; `zoom.ts` enlarges it on click where there is room. */
  zoom: {
    display: "block",
    width: "100%",
    cursor: { default: "auto", [breakpoints.desktop]: "zoom-in" },
  },
  mark: { width: "88%" },
  markImage: { filter: colors.artworkFilter },
  centered: { marginInline: "auto" },
  caption: { marginTop: space.unit },
  codeLabel: { marginBottom: space.unit },
  /**
   * A code block, on `ui.codeSurface` with `ui.edge`. A unit above and below the lines, two units at the sides,
   * the shell block's inset (`command.tsx`).
   */
  pre: {
    overflowX: "auto",
    paddingBlock: space.unit,
    paddingInline: `calc(2 * ${space.unit})`,
    color: colors.primary,
    fontSize: typeScale.monoSize,
    lineHeight: typeScale.monoLeading,
    tabSize: 4,
  },
});

const tokenStyles = stylex.create({
  key: { color: colors.primary },
  value: { color: colors.secondary },
  string: { color: colors.secondary },
  number: { color: colors.secondary },
  comment: { color: colors.tertiary },
  punctuation: { color: colors.tertiary },
  operator: { color: colors.tertiary },
});
