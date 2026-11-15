import * as stylex from "@stylexjs/stylex";
import { useEffect, useRef, useState } from "preact/hooks";
import { colors, media } from "../tokens.stylex.ts";
import { ui } from "../ui.tsx";

/**
 * Every glyph in CURVES, in font units (1000 to the em). `code` is the first code point the
 * glyph answers to (À and Å draw the A, so the A is U+0041); the missing glyph has none.
 * Glyphs that draw nothing carry the `label` their cell shows instead.
 */
type Glyph = { name: string; code: number | null; width: number; label?: string };

const glyphs: readonly Glyph[] = [
  { name: "Capital A", code: 65, width: 942 },
  { name: "Capital B", code: 66, width: 942 },
  { name: "Capital C", code: 67, width: 942 },
  { name: "Capital D", code: 68, width: 942 },
  { name: "Capital E", code: 69, width: 942 },
  { name: "Capital F", code: 70, width: 942 },
  { name: "Capital G", code: 71, width: 942 },
  { name: "Capital H", code: 72, width: 942 },
  { name: "Capital I", code: 73, width: 244 },
  { name: "Capital J", code: 74, width: 942 },
  { name: "Capital K", code: 75, width: 942 },
  { name: "Capital L", code: 76, width: 942 },
  { name: "Capital M", code: 77, width: 943 },
  { name: "Capital N", code: 78, width: 941 },
  { name: "Capital O", code: 79, width: 942 },
  { name: "Capital P", code: 80, width: 940 },
  { name: "Capital Q", code: 81, width: 1017 },
  { name: "Capital R", code: 82, width: 941 },
  { name: "Capital S", code: 83, width: 942 },
  { name: "Capital T", code: 84, width: 942 },
  { name: "Capital U", code: 85, width: 942 },
  { name: "Capital V", code: 86, width: 942 },
  { name: "Capital W", code: 87, width: 942 },
  { name: "Capital X", code: 88, width: 942 },
  { name: "Capital Y", code: 89, width: 942 },
  { name: "Capital Z", code: 90, width: 940 },
  { name: "Small a", code: 97, width: 941 },
  { name: "Small b", code: 98, width: 941 },
  { name: "Small c", code: 99, width: 941 },
  { name: "Small d", code: 100, width: 941 },
  { name: "Small e", code: 101, width: 941 },
  { name: "Small f", code: 102, width: 941 },
  { name: "Small g", code: 103, width: 941 },
  { name: "Small h", code: 104, width: 942 },
  { name: "Small i", code: 105, width: 243 },
  { name: "Small j", code: 106, width: 941 },
  { name: "Small k", code: 107, width: 941 },
  { name: "Small l", code: 108, width: 941 },
  { name: "Small m", code: 109, width: 942 },
  { name: "Small n", code: 110, width: 940 },
  { name: "Small o", code: 111, width: 941 },
  { name: "Small p", code: 112, width: 939 },
  { name: "Small q", code: 113, width: 1017 },
  { name: "Small r", code: 114, width: 940 },
  { name: "Small s", code: 115, width: 941 },
  { name: "Small t", code: 116, width: 942 },
  { name: "Small u", code: 117, width: 941 },
  { name: "Small v", code: 118, width: 942 },
  { name: "Small w", code: 119, width: 942 },
  { name: "Small x", code: 120, width: 942 },
  { name: "Small y", code: 121, width: 942 },
  { name: "Small z", code: 122, width: 940 },
  { name: "Digit zero", code: 48, width: 939 },
  { name: "Digit one", code: 49, width: 526 },
  { name: "Digit two", code: 50, width: 940 },
  { name: "Digit three", code: 51, width: 940 },
  { name: "Digit four", code: 52, width: 939 },
  { name: "Digit five", code: 53, width: 940 },
  { name: "Digit six", code: 54, width: 940 },
  { name: "Digit seven", code: 55, width: 960 },
  { name: "Digit eight", code: 56, width: 941 },
  { name: "Digit nine", code: 57, width: 940 },
  { name: "Exclamation mark", code: 33, width: 244 },
  { name: "Quotation mark", code: 34, width: 510 },
  { name: "Number sign", code: 35, width: 943 },
  { name: "Dollar sign", code: 36, width: 944 },
  { name: "Percent sign", code: 37, width: 965 },
  { name: "Ampersand", code: 38, width: 1020 },
  { name: "Apostrophe", code: 39, width: 244 },
  { name: "Left parenthesis", code: 40, width: 327 },
  { name: "Right parenthesis", code: 41, width: 327 },
  { name: "Asterisk", code: 42, width: 508 },
  { name: "Plus sign", code: 43, width: 676 },
  { name: "Comma", code: 44, width: 244 },
  { name: "Hyphen-minus", code: 45, width: 676 },
  { name: "Full stop", code: 46, width: 244 },
  { name: "Slash", code: 47, width: 965 },
  { name: "Colon", code: 58, width: 244 },
  { name: "Semicolon", code: 59, width: 244 },
  { name: "Less-than sign", code: 60, width: 498 },
  { name: "Equals sign", code: 61, width: 676 },
  { name: "Greater-than sign", code: 62, width: 498 },
  { name: "Question mark", code: 63, width: 943 },
  { name: "Left square bracket", code: 91, width: 327 },
  { name: "Backslash", code: 92, width: 965 },
  { name: "Right square bracket", code: 93, width: 327 },
  { name: "Low line", code: 95, width: 943 },
  { name: "Low double quotation mark", code: 8222, width: 510 },
  { name: "Euro sign", code: 8364, width: 1077 },
  { name: "Space", code: 32, width: 488, label: "SP" },
  { name: "No-break space", code: 160, width: 488, label: "NBSP" },
  { name: "Soft hyphen", code: 173, width: 0, label: "SHY" },
  { name: "Missing glyph", code: null, width: 527 },
  { name: "Null", code: 0, width: 0, label: "NUL" },
  { name: "Line feed", code: 10, width: 0, label: "LF" },
  { name: "Carriage return", code: 13, width: 0, label: "CR" },
];

const unitsPerEm = 1000;
const capHeight = 665;
const descender = 140;

// The panel is 16 cells by 9, each 3:4, so the panel is 4:3. The showcase takes the top-left
// 8 by 6 block, and the 96 glyphs fill the 96 cells around it.
const columns = 16;
const block = { columns: 8, rows: 6 };
const side = (columns - block.columns) * block.rows;

/** Where cell `index` sits: right of the showcase first, then the full rows below it. */
function place(index: number): { column: number; row: number } {
  if (index < side)
    return {
      column: block.columns + (index % (columns - block.columns)),
      row: Math.floor(index / (columns - block.columns)),
    };
  const rest = index - side;
  return { column: rest % columns, row: block.rows + Math.floor(rest / columns) };
}

const places = glyphs.map((_, index) => place(index));

/** The cell `rows` rows down (up when negative) from `index` in the same column, if any. */
function vertical(index: number, rows: number): number | null {
  const from = places[index];
  if (from === undefined) return null;
  const found = places.findIndex(
    ({ column, row }) => column === from.column && row === from.row + rows,
  );
  return found === -1 ? null : found;
}

function character(glyph: Glyph): string {
  return glyph.code === null || glyph.label !== undefined ? "" : String.fromCodePoint(glyph.code);
}

function codeOf(glyph: Glyph): string {
  if (glyph.code === null) return "None";
  return `U+${glyph.code.toString(16).toUpperCase().padStart(4, "0")}`;
}

const byCharacter = new Map(glyphs.map((glyph, index) => [character(glyph), index]));
byCharacter.set(
  " ",
  glyphs.findIndex((glyph) => glyph.code === 32),
);
byCharacter.delete("");
const first = byCharacter.get("A") ?? 0;
const drawn = glyphs.flatMap((glyph, index) => (character(glyph) === "" ? [] : [index]));
// While nobody points at it, the specimen steps through the drawn glyphs this often.
const stepEvery = 800;

// The showcase in its own units: 4:3, with the em at 60% of its height and the cap height
// centred, so every glyph, the tall dollar and the low comma included, stays inside.
const view = { width: 1600, height: 1200 };
const scale = (0.6 * view.height) / unitsPerEm;
const baseline = view.height / 2 + (capHeight * scale) / 2;
const lines = [
  { label: "Cap height", y: -capHeight },
  { label: "Baseline", y: 0 },
  { label: "Descender", y: descender },
];

/**
 * A CURVES specimen: all 96 glyphs on a grid of 3:4 cells, around a 4:3 showcase that draws
 * the chosen glyph on its cap height, baseline and descender, with its advance width, name and
 * code. Pointing at a cell, the arrow keys or typing a character choose a glyph. Until then
 * the specimen steps through the set by itself while it is on screen and `running`. With
 * `fill`, the panel fills the banner window of the case page; otherwise it keeps 4:3. `cover`
 * scales the panel past the window to fill it whole, cropped from the bottom (the homepage
 * preview, `preview.ts`).
 */
export function Specimen({
  fill,
  font,
  cover,
  running,
}: {
  fill: boolean;
  font: string;
  cover: boolean;
  running: boolean;
}) {
  const frame = useRef<HTMLDivElement>(null);
  const [chosen, setChosen] = useState(first);
  const [touched, setTouched] = useState(false);
  const glyph = glyphs[chosen] ?? glyphs[first];

  useEffect(() => {
    const box = frame.current;
    if (!box || !running || touched || matchMedia("(prefers-reduced-motion: reduce)").matches)
      return undefined;
    let timer = 0;
    const step = () => {
      setChosen((index) => drawn[(drawn.indexOf(index) + 1) % drawn.length] ?? first);
      timer = window.setTimeout(step, stepEvery);
    };
    const watcher = new IntersectionObserver(([entry]) => {
      window.clearTimeout(timer);
      if (entry?.isIntersecting === true) timer = window.setTimeout(step, stepEvery);
    });
    watcher.observe(box);
    return () => {
      window.clearTimeout(timer);
      watcher.disconnect();
    };
  }, [touched, running]);

  const choose = (index: number) => {
    setTouched(true);
    setChosen(index);
  };

  const keys = (event: KeyboardEvent) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const next = (() => {
      switch (event.key) {
        case "ArrowLeft":
          return chosen > 0 ? chosen - 1 : null;
        case "ArrowRight":
          return chosen < glyphs.length - 1 ? chosen + 1 : null;
        case "ArrowUp":
          return vertical(chosen, -1);
        case "ArrowDown":
          return vertical(chosen, 1);
        case "Home":
          return 0;
        case "End":
          return glyphs.length - 1;
        default:
          return byCharacter.get(event.key) ?? null;
      }
    })();
    if (next === null) return;
    event.preventDefault();
    choose(next);
  };

  if (glyph === undefined) return null;
  const left = view.width / 2 - (glyph.width * scale) / 2;
  const shown = character(glyph);
  return (
    <div
      ref={frame}
      {...stylex.props(styles.frame, fill && styles.fill, cover && styles.coverFrame)}
    >
      <style
        dangerouslySetInnerHTML={{
          // The ascent is set so a line box centres the cap height: the cells need no nudging.
          __html: `@font-face{font-family:"CURVES";font-display:block;src:url("${font}") format("woff2");ascent-override:80.5%;descent-override:14%}`,
        }}
      />
      <div
        role="listbox"
        tabIndex={0}
        aria-label="Every CURVES glyph"
        aria-activedescendant={`curves-glyph-${chosen}`}
        onKeyDown={keys}
        {...stylex.props(ui.focusRing, styles.panel, cover && styles.coverPanel)}
      >
        <div {...stylex.props(styles.showcase)} aria-hidden="true">
          <svg viewBox={`0 0 ${view.width} ${view.height}`} {...stylex.props(styles.drawing)}>
            <g transform={`translate(0 ${baseline})`}>
              {lines.map(({ y }) => (
                <line
                  x1={0}
                  x2={view.width}
                  y1={y * scale}
                  y2={y * scale}
                  vector-effect="non-scaling-stroke"
                  {...stylex.props(styles.rule)}
                />
              ))}
              {[left, left + glyph.width * scale].map((x) => (
                <line
                  x1={x}
                  x2={x}
                  y1={-view.height}
                  y2={view.height}
                  vector-effect="non-scaling-stroke"
                  {...stylex.props(styles.rule)}
                />
              ))}
            </g>
            <g transform={`translate(${left} ${baseline}) scale(${scale})`}>
              {shown === "" ? (
                glyph.code === null && (
                  // The missing glyph: an open box, 427 by 700 units, 50 in from its origin.
                  <rect
                    x={50}
                    y={-700}
                    width={427}
                    height={700}
                    vector-effect="non-scaling-stroke"
                    {...stylex.props(styles.missing)}
                  />
                )
              ) : (
                <text x={0} y={0} {...stylex.props(styles.glyph)}>
                  {shown}
                </text>
              )}
            </g>
          </svg>
          {lines.map(({ label, y }) => (
            <span
              {...stylex.props(ui.text, styles.lineLabel)}
              style={{ top: `${((baseline + y * scale) / view.height) * 100}%` }}
            >
              {label}
            </span>
          ))}
          <span {...stylex.props(ui.text, styles.width)}>{glyph.width}</span>
        </div>
        <dl {...stylex.props(ui.text, styles.facts)} aria-live="polite">
          <dt {...stylex.props(styles.term)}>Glyph</dt>
          <dd {...stylex.props(styles.value)}>{glyph.name}</dd>
          <dt {...stylex.props(styles.term)}>Code</dt>
          <dd {...stylex.props(styles.value, styles.code)}>{codeOf(glyph)}</dd>
          <dt {...stylex.props(styles.term)}>Set</dt>
          <dd {...stylex.props(styles.value)}>96 glyphs, unicase.</dd>
        </dl>
        {glyphs.map((cell, index) => {
          const selected = index === chosen;
          const text = character(cell);
          return (
            <div
              id={`curves-glyph-${index}`}
              role="option"
              aria-selected={selected}
              aria-label={`${cell.name}, ${codeOf(cell)}`}
              onPointerEnter={() => choose(index)}
              {...stylex.props(ui.respond, styles.cell, selected && styles.selected)}
            >
              {text === "" ? (
                cell.label === undefined ? (
                  <span {...stylex.props(styles.box)} />
                ) : (
                  <span {...stylex.props(ui.text, styles.label)}>{cell.label}</span>
                )
              ) : (
                <span {...stylex.props(styles.character)}>{text}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Each cell draws the hairline on its right and bottom; the frame draws the outer edge.
const grid = `1px 0 0 ${colors.hairline}, 0 1px 0 ${colors.hairline}`;

const styles = stylex.create({
  frame: {
    position: "relative",
    width: "100%",
    minWidth: 0,
    aspectRatio: "4 / 3",
    overflow: "hidden",
    containerType: "size",
    display: "grid",
    placeItems: "center",
    backgroundColor: colors.bg,
    // The banner's frame: the hairline of the homepage table's rows, drawn over the artwork.
    "::after": {
      content: '""',
      position: "absolute",
      inset: 0,
      boxShadow: `inset 0 0 0 1px ${colors.hairline}`,
      pointerEvents: "none",
    },
  },
  // Fills the case pages' banner window on desktop (`styles.window` in markdown.tsx).
  fill: { height: { default: null, [media.desktop]: "100%" } },
  // Covering the window: the panel stands on its top edge, so the crop takes the bottom rows.
  coverFrame: { placeItems: "start center" },
  // 4:3 inside whatever window the banner leaves: as wide as fits, never cropped.
  panel: {
    width: "min(100cqw, calc(100cqh * 4 / 3))",
    height: "min(100cqh, calc(100cqw * 3 / 4))",
    containerType: "size",
    display: "grid",
    gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))`,
    gridTemplateRows: "repeat(9, minmax(0, 1fr))",
    overflow: "hidden",
    userSelect: "none",
    touchAction: "pan-y",
    cursor: "default",
  },
  // The least 4:3 box that covers the window: full width, running past its bottom edge.
  coverPanel: {
    width: "max(100cqw, calc(100cqh * 4 / 3))",
    height: "max(100cqh, calc(100cqw * 3 / 4))",
  },
  showcase: {
    position: "relative",
    gridColumn: `1 / ${block.columns + 1}`,
    gridRow: `1 / ${block.rows + 1}`,
    // 4.5 of the block's 6 rows: 8 cells of 3 by 4.5 of 4 is 4:3.
    height: "75%",
    alignSelf: "start",
    boxShadow: `1px 0 0 ${colors.hairline}`,
  },
  drawing: { position: "absolute", inset: 0, width: "100%", height: "100%", overflow: "hidden" },
  rule: { stroke: colors.hairline, strokeWidth: 1, fill: "none" },
  glyph: {
    fontFamily: '"CURVES"',
    fontSize: `${unitsPerEm}px`,
    fill: colors.primary,
  },
  missing: { fill: "none", stroke: colors.primary, strokeWidth: 1.5 },
  lineLabel: {
    position: "absolute",
    left: "2.2cqw",
    transform: "translateY(-120%)",
    fontSize: "clamp(11px, 1.25cqw, 13px)",
    lineHeight: 1,
    color: colors.tertiary,
  },
  width: {
    position: "absolute",
    right: "2.2cqw",
    bottom: "2.2cqw",
    fontSize: "clamp(11px, 1.25cqw, 13px)",
    lineHeight: 1,
    fontVariantNumeric: "tabular-nums",
    color: colors.tertiary,
  },
  // The last 1.5 rows of the block, under the showcase.
  facts: {
    gridColumn: `1 / ${block.columns + 1}`,
    gridRow: `1 / ${block.rows + 1}`,
    alignSelf: "end",
    height: "25%",
    margin: 0,
    paddingInline: "2.2cqw",
    paddingBlock: "1.6cqw",
    boxSizing: "border-box",
    display: "grid",
    gridTemplateColumns: "max-content 1fr",
    alignContent: "end",
    columnGap: "3cqw",
    rowGap: "0.4cqw",
    fontSize: "clamp(11px, 1.6cqw, 16px)",
    lineHeight: 1.3,
    boxShadow: grid,
  },
  term: { color: colors.tertiary },
  value: {
    margin: 0,
    color: colors.primary,
    minWidth: 0,
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
  },
  code: { fontVariantNumeric: "tabular-nums" },
  cell: {
    display: "grid",
    placeItems: "center",
    minWidth: 0,
    minHeight: 0,
    boxShadow: grid,
    color: {
      default: colors.secondary,
      ":hover": { [media.hover]: colors.primary },
    },
  },
  // The chosen glyph: the cell turns over, page colour on full contrast.
  selected: {
    color: { default: colors.bg, ":hover": { [media.hover]: colors.bg } },
    backgroundColor: colors.primary,
  },
  character: {
    fontFamily: '"CURVES"',
    fontSize: "3.1cqw",
    lineHeight: 1,
  },
  // A control character's name in its cell. Phones leave it out: at the cell's size it would be
  // set under 11px, too small to read.
  label: {
    display: { default: null, [media.mobile]: "none" },
    fontSize: "clamp(7px, 0.95cqw, 11px)",
    lineHeight: 1,
    letterSpacing: "0.02em",
  },
  // The missing glyph in its cell: the same open box, in ems of the glyph size.
  box: {
    width: "calc(3.1cqw * 0.427)",
    height: "calc(3.1cqw * 0.7)",
    boxShadow: "inset 0 0 0 1px currentColor",
    transform: "translateY(-0.14cqw)",
  },
});
