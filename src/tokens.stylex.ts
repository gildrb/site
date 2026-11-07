import * as stylex from "@stylexjs/stylex";

const light = "@media (prefers-color-scheme: light)";

/**
 * The layout's one unit, in px: every width and gap is a whole multiple of it, and a line (24px)
 * is three.
 *
 * Columns come from one field grid: fields of 14 units (112px) with gutters of 2 units (16px),
 * six across the desktop layout (752px). The sidebar takes fields 1 and 2, the text fields 3
 * to 6. In the tables the title takes a field and the descriptor starts on the next one, so every
 * left edge on a page lands on a field: the name and sidebar, About and the project names, the
 * descriptors; the dates end on the last field's right edge. 112px fits a project's name at the
 * emphasis weight ("Local Studio" is 99px).
 */
const unit = 8;
const field = 14 * unit;
const gutter = 2 * unit;
/** The share image's date column (`og.tsx`), which cannot size to its figures as the page does. */
const dateColumn = `${12 * unit}px`;
const titleColumn = `${field}px`;
const tableGap = `${gutter}px`;

/**
 * Text cut by its box's edge fades out instead: over the last table gap, for a command wider than
 * its block (`command.tsx`). A `mask-image`.
 */
export const fade = stylex.defineConsts({
  end: `linear-gradient(to right, black calc(100% - ${tableGap}), transparent)`,
});

/**
 * Shifts that put a label's and a heading's baseline on the text's (`ui.label`, `ui.heading`).
 * In a 24px line box, Inter's baseline sits `(line - (ascent + descent) × size) / 2 + ascent ×
 * size` from the top (ascent 1984/2048, descent 494/2048): 17.81px at 16px, 17.08px at 14px,
 * 19.99px at 22px. The difference is `(16 - size) × 0.36377`.
 */
export const baseline = stylex.defineConsts({
  label: "0.7275px",
  heading: "-2.1826px",
});
export const media = stylex.defineConsts({
  mobile: "@media (max-width: 767px)",
  desktop: "@media (min-width: 768px)",
  hover: "@media (hover: hover)",
  motion: "@media screen and (prefers-reduced-motion: no-preference)",
});

/**
 * How dates are spaced, in Inter's font units (see `ui.figures`). The page sets them as CSS; the
 * share image (`og.tsx`) draws its dates from the same numbers.
 */
export const figureUnits = stylex.defineConsts({
  unitsPerEm: "2048",
  /** Every tabular digit's advance. */
  tabular: "1328",
  /** Digit to digit. */
  digit: "-95.1",
  /** Digit to hyphen, after the digit's own tracking. */
  beforeHyphen: "17",
  /** Hyphen to digit. */
  afterHyphen: "-88.2",
});

/**
 * Inter's OpenType features. Interface text takes case forms (`case`): arrows, hyphens and @
 * centred on capitals and figures, which is what they stand beside in names, dates, headers and
 * links. Running prose and the email address keep the default forms, which sit among lowercase
 * letters. The grotesque G (Inter's cv10) is not listed: it is built into the font file itself.
 */
export const fontFeatures = stylex.defineConsts({
  interface: '"liga" 1, "calt" 1, "case" 1',
  prose: '"liga" 1, "calt" 1',
});

/**
 * Underlined links: thinner than Inter's own underline (140/2048 em, about 1.1px at 16px), set
 * at Inter's underline position (348/2048 em below the baseline) so it keeps its gap below the
 * letters; a thin line at the `auto` offset touches them.
 */
export const underline = stylex.defineConsts({
  thickness: "0.5px",
  offset: "0.17em",
});

/**
 * How a state change shows. A hover, focus or current part changes a color or opacity.
 * - Entering is immediate (`ui.respond`): the row under the pointer is lit the moment it is
 *   reached, so nothing ever waits on an animation.
 * - Leaving fades over `response`, 200ms, on a decelerating curve (`ease-out`): the release
 *   starts quickly, then lingers and dissolves. A pointer sweeping a list leaves a short trail
 *   behind it, which shows the path the hand took. At 150ms on `ease` half the change was done in
 *   50ms and the fade read as an instant swap; past 400ms a sweep leaves four or five rows lit
 *   and the index turns to noise. 300ms was tried; 200ms is the owner's pick.
 * - Every element whose color changes takes part. One that changes on its row's or its parent's
 *   state inherits the color (`color: inherit`) rather than setting its own, or it switches at
 *   once while its row fades. Elements that set their own state color carry `ui.respond`, a
 *   row's cells `ui.respondCell`.
 * Nothing travels toward the pointer and no marker follows the reader: state is color. The only
 * thing that moves is an image enlarging, for the reader's own click, over `entry.ts`'s
 * `zoomDuration` (200ms) on its spring.
 */
export const motion = stylex.defineConsts({
  response: "200ms",
  responseEasing: "ease-out",
});

/**
 * The type scale: three sizes, two weights, and tracking that follows the size.
 *
 * Why three sizes and two weights, not one of each: one size at one weight leaves color as the
 * only way to rank text, and a page ranked by gray alone reads as a data listing. The scale adds
 * two more axes: size tells a label from a line of text from the name, and weight tells the
 * thing (a project's name, a page's heading) from what is said about it.
 *
 * Every size sits on the 24px line (three units), so nothing moves between pages: the name is
 * the same size in the same place on the homepage and on every page under it, where the page's
 * title takes the line below it as its child. The heading size, 22px, is the size whose cap
 * height (Inter's is 0.727em) is 16px: two units on a three-unit line. The label's line is 20px
 * in the same 24px box. Phones use the same pixels; from tablets up text scales with `rem`.
 *
 * Tracking is Inter's own dynamic metrics (rsms.me/inter/dynmetrics): `a + b * e^(c * size)`
 * with a = -0.0223, b = 0.185, c = -0.1745, size in px. It tightens as type grows, which is why
 * 14px gets -0.006em, 16px -0.011em and 22px -0.018em. The date figures are calibrated against
 * letters tracked this way (`ui.figures` adds `textTracking`).
 *
 * Weights: 400 is text; 500 is emphasis, the step Inter's optical size keeps clearly apart from
 * 400 at every size here (the font file carries 380 to 600, see `scripts/inter.py`). Nothing is
 * bolder: on a dark page 600 blooms. The share image (`og.tsx`) draws from a 400-only instance.
 */
export const typeScale = stylex.defineConsts({
  /** Labels: section names (About, Contact, Links), table headers, captions, small print. */
  labelSize: "14px",
  labelTracking: "-0.006em",
  /** Interface and running text: links, table rows, paragraphs. */
  textSize: "16px",
  textLeading: "24px",
  textTracking: "-0.011em",
  /** The name, the page under it, and a page's part headings: the one step above text. */
  headingSize: "22px",
  headingTracking: "-0.018em",
  textWeight: "400",
  emphasisWeight: "500",
  /**
   * Code: inline code, code blocks, the shell block (`markdown.tsx`, `command.tsx`). Commit Mono
   * at the text's size: its x-height is 540/1000 em, Inter's 1118/2048 (0.546 em), so at 16px the
   * mono's lowercase stands 8.64px tall beside Inter's 8.73px, the same optical size; at 14px it
   * read two sizes small. On the text's line, so a block of code keeps the page's rhythm. Inline
   * code takes the size only and sits on its sentence's line. Weight 400, the only one shipped.
   */
  monoSize: "16px",
  monoLeading: "24px",
});

/**
 * Each theme's page color, `colors.bg`, as plain strings: `theme.ts` sets the same values on
 * <html> and in `theme-color` before any CSS loads, so the first frame and the browser chrome are
 * the page itself.
 */
export const pageColor = { dark: "oklch(15.5% 0.013 55)", light: "oklch(99.5% 0.004 85)" };

/**
 * The forge's palette, sampled from Batoni's "Vulcan" (1750) and Flaxman's gilt Shield of
 * Achilles (1817): umber shadow, bronze half-light, ivory where the fire catches. Measured in
 * OKLCH, the paintings' shadows (L 15 to 25%) carry chroma 0.027 to 0.036 at hue 36 to 75, and
 * the hue climbs with the light, from ember red in the dark (hue 40) to gilt yellow in the
 * highlights (hue 90). A grey with a trace of one hue reads as dirt, not warmth.
 *
 * So each ladder ramps both ways at once, like firelight: the darker a color, the redder and the
 * more chromatic. Dark: an umber page (hue 55, chroma 0.013), bronze tertiary (hue 64, 0.042),
 * sand secondary (hue 72, 0.035), ivory text (hue 85, 0.02). Light: the same scale read from the
 * other end, ivory paper (hue 85, 0.004) under umber ink (hue 50 to 58, 0.018 to 0.036), held
 * lower than the dark ladder's chroma: on paper the same chroma reads as sepia.
 *
 * The text ladder in APCA. Dark, on the page: primary Lc 97, secondary 63, tertiary 45 (WCAG
 * 6.5:1). Light: primary Lc 98, secondary 84, tertiary 73 (WCAG 5.5:1).
 * Light is not a mirror of dark: grey on a light page reads fainter than on a dark one, the
 * reason light prose is heavier too (`proseWeight`).
 */
export const colors = stylex.defineVars({
  /**
   * Tells the browser which way the page is lit, for scrollbars, overscroll and other built-in
   * controls: either, following the system.
   */
  scheme: "light dark",
  bg: { default: pageColor.dark, [light]: pageColor.light },
  primary: { default: "oklch(95% 0.02 85)", [light]: "oklch(21% 0.018 50)" },
  secondary: { default: "oklch(78% 0.035 72)", [light]: "oklch(41% 0.03 55)" },
  /**
   * The bottom of the text ladder, a rung below tertiary: the labels themselves (About, Contact,
   * Links, table headers) and other marks that must recede further than any run text does.
   */
  quaternary: { default: "oklch(56% 0.05 60)", [light]: "oklch(35% 0.026 54)" },
  /** Dates, descriptors, quiet links at rest. */
  tertiary: { default: "oklch(67% 0.042 64)", [light]: "oklch(50% 0.036 58)" },
  /**
   * Rules: the tertiary ink (bronze over the umber page, sepia on paper) at a low alpha —
   * Vercel's approach: a faint, transparent line that keeps the palette's hue instead of
   * graying out, and takes whatever it sits under.
   */
  hairline: { default: "oklch(67% 0.042 64 / 0.16)", [light]: "oklch(50% 0.036 58 / 0.18)" },
  codeBg: { default: "oklch(21% 0.016 58)", [light]: "oklch(95% 0.018 82)" },
  /**
   * Depth without shadows, from light (after raycast.com): a surface is lit from above. Its fill
   * runs from `surfaceTop` down to its own color, and `bevel`, a line of light, sits on its top
   * edge inside the hairline. A key (a button on a surface: the shell block's copy button) stands
   * one step brighter than its surface, with a brighter `keyBevel` on top and `keyBase`, a darker
   * line, under it, so it reads as raised. Nothing casts a shadow onto the page.
   */
  surfaceTop: { default: "oklch(24% 0.017 60)", [light]: "oklch(97.5% 0.016 82)" },
  bevel: { default: "oklch(100% 0 0 / 0.07)", [light]: "oklch(100% 0 0 / 0.75)" },
  key: { default: "oklch(27% 0.018 62)", [light]: "oklch(99% 0.008 85)" },
  keyHover: { default: "oklch(31% 0.02 64)", [light]: "oklch(100% 0 0)" },
  keyBevel: { default: "oklch(100% 0 0 / 0.13)", [light]: "oklch(100% 0 0)" },
  keyBase: { default: "oklch(7% 0.012 50 / 0.55)", [light]: "oklch(21% 0.018 50 / 0.16)" },
  terminalBg: { default: "oklch(18% 0.015 56)", [light]: "oklch(97.5% 0.015 84)" },
  /**
   * Heph's glass window (`heph.tsx`), the one lifted surface on the site; flat surfaces take a
   * line (`ui.edge`), not a shadow. `glass` is the terminal colour the wallpaper shows through:
   * 62% on the dark page, 82% on the light one, where a thinner pale tint over the dark painting
   * mixes into grey-brown. `glint` is light caught on the glass, white in both themes: mixed from
   * the text it went near-black on the light page. `shadow` is the dark under the window, on
   * each theme's own hue rather than pure black, which reads as a hole in a tinted page.
   */
  glass: { default: "oklch(18% 0.015 56 / 0.62)", [light]: "oklch(97.5% 0.015 84 / 0.82)" },
  glint: { default: "oklch(100% 0 0)", [light]: "oklch(100% 0 0)" },
  shadow: { default: "oklch(7% 0.012 50)", [light]: "oklch(15% 0.02 50)" },
  /** Muted text on terminal surfaces: 5.6:1 on the dark terminal, 5.2:1 on the light one. */
  terminalMuted: { default: "oklch(64% 0.04 64)", [light]: "oklch(50% 0.036 58)" },
  proseWeight: { default: "380", [light]: "400" },
  /**
   * How strong an underline is at rest, as a share of its link's text colour (`ui.outbound`); on
   * hover it is the full colour. Not a mirror, for the reason light prose is heavier: a thin light
   * line brightening on a dark page blooms and reads larger than its numbers, a thin dark line
   * darkening on paper does not. Dark: 50%, a step of 0.35 lightness to the hover. Light: 25%, a
   * step of 0.52, which reads as the same step. At 50% on paper the change could not be seen.
   */
  underlineRest: { default: "50%", [light]: "25%" },
  artworkFilter: { default: "none", [light]: "brightness(0)" },
});

/**
 * Vertical rhythm. The sidebar's link pitch is 32px (four units) and the table's row pitch 40px
 * (five); they meet every 160px. Contact's label sits on the table header, so with 8 lines of
 * contact and links and one pitch between the groups, "Links" lands on the fourth row and the
 * last link on the eighth. Grouping comes from the type, not from the spacing: labels are
 * smaller and grayer than the lines under them (`ui.label`), project names heavier than their
 * descriptors (`ui.emphasis`), so the rhythm can stay strict.
 */
export const space = stylex.defineVars({
  /**
   * The unit itself, for lengths derived from it elsewhere (`calc(n * unit)`): pads, insets and
   * gaps that are not one of the named spaces below.
   */
  unit: `${unit}px`,
  /**
   * How far a keyboard focus ring stands outside what it marks: half a unit. Rows have a unit of
   * padding above and below their text, so the ring sits halfway into it and never touches the
   * neighbouring row's words. The ring's corner is half the surface corner (`radius`).
   */
  focusOffset: `${unit / 2}px`,
  sectionGap: "24px",
  sectionContentGap: "8px",
  /**
   * Desktop: the gap between two groups, from the last line's box to the next group's first line:
   * one empty line on the line interval (`sidebarBaselinePitch`), plus the interval's own gap.
   * About to the table, Projects to Work, Contact to Links: every baseline stays on one grid.
   */
  groupGap: "calc(2rem + 2rem - 1.5rem)",
  /** Below the project table on desktop: one sidebar pitch. */
  textMediaGap: "32px",
  linkLineHeight: { default: "24px", "@media (min-width: 768px)": "1.5rem" },
  /**
   * Desktop: the one line interval of the homepage, 32px, in both columns: sidebar links, table
   * rows, labels and the About lines all stand a whole interval apart.
   */
  sidebarBaselinePitch: "2rem",
  /**
   * The smallest thing a finger should have to hit, on the 8px grid: six units. On phones every
   * table row and group label is exactly this tall, so phone lines stay on the grid too.
   */
  touchTarget: "48px",
  /** Pads a phone line (24px) out to a touch target. */
  touchInset: "calc((48px - 24px) / 2)",
  /**
   * Between two lines of a link list: the line interval less a line, one unit on every screen.
   * Links pad into half of it, so their hit areas meet with no dead space between them.
   */
  linkGap: "calc(2rem - 1.5rem)",
  /** Pads a line (24px) out to the line interval (32px) on desktop: a table row. */
  portfolioRowPadding: "calc((2rem - 1.5rem) / 2)",
  toggleSize: "32px",
  /** The page's inset from the viewport edge on desktop: top of the sidebar and content, bottom of the footer. */
  pageInset: "48px",
  /** Two fields and their gutter. */
  sidebarColumn: `${2 * field + gutter}px`,
  /** Four fields and their gutters. */
  contentColumn: `${4 * field + 3 * gutter}px`,
  /** One gutter: the text starts on the field after the sidebar's. */
  layoutGap: `${gutter}px`,
  /**
   * One unit: the corner of the code surfaces: code, keycaps, the shell block and Archetypon's
   * previews. Artwork stands square-cornered, as the homepage's previews (`markdown.tsx`,
   * `archive.tsx`). Inline code takes half (`calc(radius / 2)`): a chip at text size, which a
   * whole unit would round into a pill. Heph's window keeps macOS's own corner, as it keeps
   * macOS's lights (`heph.tsx`).
   */
  radius: `${unit}px`,
  tileGap: `${4 * unit}px`,
  tableGap,
  mobileTableGap: "clamp(8px, 3vw, 16px)",
  mobileCellEndSpace: "10px",
  dateColumn,
  titleColumn,
  /**
   * The project tables (homepage, next projects): project, subject, then the date set right, its
   * last figure on the table's right edge, where the hairlines end. Desktop: the title column a
   * unit multiple, the date as wide as its figures. Phones: content-sized, the subject taking
   * what is left.
   */
  projectColumns: {
    default: `${titleColumn} minmax(0, 1fr) max-content`,
    "@media (max-width: 767px)": "max-content minmax(0, 1fr) max-content",
  },
  /**
   * A settings table (Archetypon's formats) on the fields: the name in the title field, so it
   * lines up with the project names; then one field per setting, the last taking the rest, its
   * value set right on the table's edge. A column never gets narrower than its values.
   */
  settingsColumns: {
    default: `${titleColumn} ${field}px ${field}px minmax(max-content, 1fr)`,
    "@media (max-width: 767px)": "max-content repeat(3, minmax(max-content, 1fr))",
  },
});

/**
 * Put on the row list (the homepage table, a case page's next projects) so its rows can dim the
 * siblings while one of them is hovered. Defined before `rowMarker`, so a row's own restore
 * rules come after the dim rule in the compiled CSS and win it.
 */
export const listMarker = stylex.defineMarker();

/** Put on a table row so its cells can react to the row's hover and focus. */
export const rowMarker = stylex.defineMarker();

/**
 * Put on <html>, which carries page-wide state: `data-dense` and `data-compact` when a desktop
 * viewport is too short for the full layout (see `align.ts`).
 */
export const rootMarker = stylex.defineMarker();
