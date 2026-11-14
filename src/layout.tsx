import * as stylex from "@stylexjs/stylex";
import type { ComponentChildren } from "preact";
import { fontGate } from "./entry.ts";
import { Island } from "./island.tsx";
import { Email } from "./islands/email.tsx";
import { align } from "./align.ts";
import { morphCss, morphScript } from "./morph.ts";
import { pageScrollbar } from "./scrollbar.ts";
import { contacts, type Link, person, profiles } from "./site.ts";
import { previewScript, themeCss } from "./theme.ts";
import {
  baseline,
  colors,
  fontFeatures,
  media,
  pageColor,
  rootMarker,
  space,
  typeScale,
} from "./tokens.stylex.ts";
import { type Style, ui, untranslated } from "./ui.tsx";
import { versioned } from "./versioned.ts";

// The signature's year, the build's own.
const year = new Date().getFullYear();

export type Assets = {
  script: string;
  css: string;
  /** The link-preview image rendered at build time (`og.tsx`), stamped with its hash. */
  shareImage: string;
};

// Each face is subset to exactly its range, so declare it to the browser. Inter
// also carries Latin Extended-A, for names such as Bēhance; the monospace face does not need it.
const monoRanges =
  "U+0020-007E,U+00A0-00FF,U+0131,U+0152-0153,U+02C6,U+02DA,U+02DC,U+2010-205E,U+20AC,U+2122,U+2190-21FF,U+2212,U+2500-257F";
const interRanges = `${monoRanges},U+0100-017F`;

// One URL per face, shared by its @font-face and its preload so the browser fetches it once.
const interUrl = versioned("/fonts/inter.woff2");
const monoUrl = versioned("/fonts/commit-mono.woff2");

/** The few rules StyleX cannot attach to an element, layered beneath StyleX's own layers. */
const globalCss = [
  "@layer reset;",
  `@font-face{font-family:"Inter";font-weight:380 600;font-display:swap;src:url("${interUrl}") format("woff2");unicode-range:${interRanges}}`,
  `@font-face{font-family:"Commit Mono";font-weight:400;font-display:optional;src:url("${monoUrl}") format("woff2");unicode-range:${monoRanges}}`,
  // Arial (or metric-identical Liberation Sans) scaled to Inter's metrics, so text laid out
  // before the web font arrives does not move when it does.
  '@font-face{font-family:"Inter Fallback";src:local("Arial"),local("Liberation Sans");size-adjust:107.35%;ascent-override:90.24%;descent-override:22.47%;line-gap-override:0%}',
  "@layer reset{*{margin:0;padding:0;box-sizing:border-box}}",
  // The browser's own scrollbar never shows, in any frame: the page keeps one width everywhere
  // and never shifts when it becomes scrollable. The site's own scrollbar takes its place
  // (`scrollbar.ts`), and without JavaScript the page still scrolls by wheel, touch and keys.
  "html{scrollbar-width:none}html::-webkit-scrollbar{display:none}",
  `::selection{color:${colors.bg};background:${colors.primary}}`,
  // A touch shows nothing: no grey tap flash, and no press state takes its place.
  "a,button{-webkit-tap-highlight-color:transparent}",
  // Where the homepage list scrolls (phones, dense desktop), the edge fades (`portfolio.tsx`) dim
  // rows as they near an edge. Under the top fade a row also fades as a whole, in its own view
  // timeline, and is gone by the time its text reaches the edge (12%: a 64px phone row's 8px
  // inset, a 32px desktop row's 4px): no row is cut while it shows, so no sliver of a word is
  // left at the top edge. There the fade already covers it nearly whole.
  "@keyframes list-row{entry 0%,exit 0%{opacity:1}exit 12%,exit 100%{opacity:0}}",
  "@supports (animation-timeline:view()){@media (max-width:767px){[data-rows]>div>*{animation:list-row linear both;animation-timeline:view()}}@media (min-width:768px){[data-dense] [data-rows]>div>*{animation:list-row linear both;animation-timeline:view()}}}",
  // In-page links glide unless motion is reduced. Between pages, only a project's title moves
  // (`morph.ts`).
  "@media (prefers-reduced-motion:no-preference){html{scroll-behavior:smooth}}",
  // The site's own scrollbar (`scrollbar.ts`): a thumb at rest only while the page scrolls, on
  // hover, in focus or dragged, fading out 0.6s after it stops; resting on it or dragging it
  // widens it a little over 0.14s. States follow superlogical.com's; the resting width is 6.6px.
  "[data-pagebar]{position:fixed;inset-block:2px;inset-inline-end:4px;width:10px;z-index:200;opacity:0;pointer-events:none;touch-action:none;user-select:none;outline:none}",
  "[data-pagebar][data-scrollable]{opacity:1;pointer-events:auto}",
  "[data-pagebar][data-dragging]{cursor:ns-resize}",
  [
    "[data-pagebar] .thumb{position:absolute;inset-block-start:0;inset-inline:auto 2px;width:6.6px;height:var(--pagebar-thumb,0px);min-height:32px;border-radius:999px;",
    "background:color-mix(in oklab,currentColor,transparent 45%);box-shadow:0 0 0 1px rgb(0 0 0 / 0.06);",
    "opacity:0;will-change:width,height,margin-block-start,transform;",
    "transition-property:width,height,margin-block-start,background-color,opacity;",
    "transition-duration:.14s,.14s,.14s,.14s,.6s;transition-timing-function:cubic-bezier(.2,.8,.2,1)}",
  ].join(""),
  "[data-pagebar][data-shown] .thumb{opacity:1;transition-duration:.14s,.14s,.14s,.14s,90ms}",
  "[data-pagebar]:hover .thumb,[data-pagebar]:focus-visible .thumb,[data-pagebar][data-dragging] .thumb{opacity:1;width:9px;height:calc(var(--pagebar-thumb,0px) + 2px);margin-block-start:-1px;transition-duration:.14s,.14s,.14s,.14s,90ms}",
  "[data-pagebar]:focus-visible .thumb{background:color-mix(in oklab,currentColor,transparent 30%)}",
  "@media (min-width:40rem){[data-pagebar]{inset-block:7px;width:16px}[data-pagebar] .thumb{inset-inline:auto 0}}",
  "@media (pointer:coarse){[data-pagebar] .thumb{min-height:48px;transition-property:width,background-color,opacity;transition-duration:.3s,.14s,.6s;transition-timing-function:cubic-bezier(.22,1,.36,1),cubic-bezier(.2,.8,.2,1),cubic-bezier(.2,.8,.2,1)}[data-pagebar][data-shown] .thumb{transition-duration:.3s,.14s,90ms}}",
  "@media (prefers-reduced-motion:reduce){[data-pagebar] .thumb{transition-duration:.01ms!important}}",
  // Where supported, the page's own scroll moves the thumb (`scrollbar.ts`), in step with it.
  "@keyframes pagebar-travel{from{transform:translateY(0)}to{transform:translateY(var(--pagebar-travel,0px))}}",
  "@supports (animation-timeline:scroll()){[data-pagebar] .thumb{animation:pagebar-travel linear both;animation-timeline:scroll(root block)}}",
  morphCss,
].join("\n");

// Defined in the head, run at the body's end (`bodyScript`), so the bytes past `<body` stay
// content. The font gate calls `__align` too; the scrollbar must not wait for the island script.
// The title transition listens from the head, before the page's first frame.
const headScript = `window.__align=()=>(${align.toString()})();window.__pageScrollbar=${pageScrollbar.toString()};${morphScript}`;
const bodyScript = "__align();__pageScrollbar()";

/**
 * Chrome prerenders a page of this site once a pointer rests on its link (about 200ms) or presses
 * it, so the page opens whole, images included. Files (`.md`, `.xml`, downloads) are left alone.
 * Other browsers ignore this; `ahead.ts` loads the images there.
 */
const speculationRules = scriptJson({
  prerender: [
    {
      where: { and: [{ href_matches: "/*" }, { not: { href_matches: "/*.*" } }] },
      eagerness: "moderate",
    },
  ],
});

/**
 * JSON safe inside a `<script>`: `<`, `>` and `&` cannot close the element or open a comment,
 * and the line separators JavaScript once rejected in strings are escaped too.
 */
export function scriptJson(value: unknown, indent?: number): string {
  return JSON.stringify(value, null, indent)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");
}

export function JsonLd({ value }: { value: unknown }) {
  const json = scriptJson(value, 2);
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />;
}

/** The HTML document: shared head, theme bootstrap, inlined CSS and the island script. */
export function Document({
  assets,
  title,
  head,
  mono,
  home = false,
  children,
}: {
  assets: Assets;
  title: string;
  head: ComponentChildren;
  /** Preload the monospace face for pages that show code or the terminal demo. */
  mono: boolean;
  home?: boolean;
  children: ComponentChildren;
}) {
  return (
    <html lang="en" {...stylex.props(rootMarker, styles.html, home && styles.fixedViewport)}>
      <head>
        <meta charset="UTF-8" />
        {/* `viewport-fit=cover`: Safari reports its bottom bar and the notch as safe-area insets,
            which the page's margins clear. */}
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        {/* The page color first, so no frame shows the browser's white canvas (see `themeCss`).
            The `theme-color` tags follow the system scheme; the preview script swaps the favicon,
            so it comes after it. */}
        <style dangerouslySetInnerHTML={{ __html: themeCss }} />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content={pageColor.dark} />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content={pageColor.light} />
        <link id="favicon" rel="icon" type="image/svg+xml" href="/favicon.svg?v=5" />
        <script data-cfasync="false" dangerouslySetInnerHTML={{ __html: previewScript }} />
        {/* Hold the first paint until the whole page is parsed and aligned, so it never arrives
            in pieces or shifts. Preact's typings lack `blocking` on <link>, hence the spread. */}
        <link rel="expect" href="#aligned" {...{ blocking: "render" }} />
        {head}
        <title>{title}</title>
        <link rel="preload" href={interUrl} as="font" type="font/woff2" crossOrigin="anonymous" />
        {mono && (
          <link rel="preload" href={monoUrl} as="font" type="font/woff2" crossOrigin="anonymous" />
        )}
        <style dangerouslySetInnerHTML={{ __html: `${globalCss}\n${assets.css}` }} />
        <script data-cfasync="false" dangerouslySetInnerHTML={{ __html: headScript }} />
        {/* After the stylesheet, so the Inter @font-face exists when the gate asks for it. */}
        <script data-cfasync="false" dangerouslySetInnerHTML={{ __html: fontGate }} />
        <script type="speculationrules" dangerouslySetInnerHTML={{ __html: speculationRules }} />
        {/* High priority: the page reacts to the pointer (the enlargement) as soon as it shows.
            A module script never blocks the first paint. Preact's typings lack `fetchpriority`
            on <script> although browsers support it, hence the spread. */}
        <script
          data-cfasync="false"
          type="module"
          src={assets.script}
          {...{ fetchpriority: "high" }}
        />
      </head>
      <body
        {...stylex.props(
          ui.sans,
          styles.body,
          home ? [styles.homeBody, styles.fixedViewport] : styles.caseBody,
        )}
        id="top"
      >
        <div
          {...stylex.props(ui.srOnly)}
          id="status"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        />
        {children}
        {/* Align the layout before the first paint (see the render-blocking `expect` in <head>),
            and start the scrollbar, so scrolling on arrival finds it. */}
        <script data-cfasync="false" dangerouslySetInnerHTML={{ __html: bodyScript }} />
        <div id="aligned" hidden />
      </body>
    </html>
  );
}

/**
 * Two columns on desktop (sidebar, content), one flowing grid on phones where the sidebar and
 * content dissolve (`display: contents`) so their children can be ordered together.
 */
export function Shell({ home = false, children }: { home?: boolean; children: ComponentChildren }) {
  return (
    <div {...stylex.props(styles.wrapper)}>
      <div {...stylex.props(styles.layout, home ? styles.homeLayout : styles.caseLayout)}>
        {children}
      </div>
    </div>
  );
}

export function Sidebar({
  home = false,
  label,
  children,
}: {
  home?: boolean;
  label: { "aria-label": string } | { "aria-labelledby": string };
  children: ComponentChildren;
}) {
  return (
    <aside {...stylex.props(styles.sidebar, home && styles.homeColumn)} {...label}>
      <a {...stylex.props(ui.heading, ui.focusRing, styles.skip)} href="#content">
        <span data-nosnippet>Skip to content</span>
      </a>
      {children}
    </aside>
  );
}

export function Main({ home = false, children }: { home?: boolean; children: ComponentChildren }) {
  return (
    <main
      {...stylex.props(
        styles.content,
        home ? [styles.homeColumn, styles.homeContent] : [ui.text, styles.caseContent],
      )}
    >
      {/* The skip link's target. `<main>` itself cannot take focus on phones, where it is
          `display: contents`; this marker can, and being out of flow it takes no grid cell. */}
      <span {...stylex.props(styles.skipTarget)} id="content" tabIndex={-1} />
      {children}
      {/* Desktop: the signature in the top right corner, on the name's line. Phones: it follows
          the page's content; the homepage keeps its own, in the table's list (`portfolio.tsx`). */}
      <p {...stylex.props(ui.label, styles.signature, !home && styles.caseSignature)}>
        © {year} {person.name}
      </p>
      {!home && (
        <p {...stylex.props(ui.label, styles.signatureMobile)}>
          © {year} {person.name}
        </p>
      )}
    </main>
  );
}

/**
 * The site's name: the homepage's `<h1>` with the phone toggle; elsewhere a grey link home.
 * Phones add the page after a bar.
 */
export function Name({ current }: { current?: string }) {
  return current ? (
    <p {...stylex.props(ui.heading, styles.name, styles.caseName)}>
      <a
        {...stylex.props(ui.target, ui.focusRing, ui.respond, styles.home)}
        href="/"
        {...untranslated}
      >
        Gil Rodrigues
      </a>
      {/* Phones: the trail in the pinned bar — the name, the bar (no state), the page. */}
      <span {...stylex.props(styles.crumb)} aria-hidden="true">
        |
      </span>
      <span {...stylex.props(styles.mobilePage)} data-morph="page">
        {current}
      </span>
    </p>
  ) : (
    <h1
      {...stylex.props(ui.heading, styles.name, styles.homeName)}
      id="site-title"
      itemProp="name"
      // Named by its text alone: the button inside is named after it too and would read twice.
      aria-labelledby="site-name"
      {...untranslated}
    >
      <span id="site-name">Gil Rodrigues</span>
      <button
        {...stylex.props(ui.reset, ui.focusRing, styles.linksToggle)}
        type="button"
        aria-labelledby="site-name"
        aria-expanded="false"
        aria-controls="profile-links"
        data-links-toggle
      />
    </h1>
  );
}

/** On inner pages the links sit in the sidebar on desktop; phones leave them to the homepage. */
export function PageLinks() {
  return (
    <div {...stylex.props(styles.desktopOnly)}>
      <Links />
    </div>
  );
}

/**
 * Contact, then the profile links: one list above the other on desktop. The homepage's stay
 * hidden on phones until the name is tapped (`links.ts`), then sit right under it, Links on the
 * left and Contact on the right.
 */
export function Links({ home = false }: { home?: boolean }) {
  const link = (item: Link, placement: Style, me: boolean) => {
    return (
      <a
        {...stylex.props(ui.quiet, ui.respond, ui.focusRing, styles.link, placement)}
        href={item.href}
        rel={me ? "me noopener noreferrer" : "noopener noreferrer"}
        itemProp={me ? "sameAs" : undefined}
        {...untranslated}
      >
        <span data-nosnippet>{item.label}</span>
      </a>
    );
  };
  return (
    <nav
      {...stylex.props(ui.text, styles.links, home && styles.homeLinks)}
      id={home ? "profile-links" : undefined}
      aria-label="Public profiles and contact"
      data-mobile-links={home || undefined}
    >
      <div {...stylex.props(styles.linkGroup)}>
        <p {...stylex.props(ui.label, styles.label, styles.contactLabel)}>
          <span data-nosnippet>Contact</span>
        </p>
        <Island name="email" component={Email} props={{}} />
        {contacts.map((item) => link(item, null, false))}
      </div>
      <div {...stylex.props(styles.linkGroup, styles.profiles)}>
        <p {...stylex.props(ui.label, styles.label, styles.profileLabel, styles.profileGroup)}>
          <span data-nosnippet>Links</span>
        </p>
        {profiles.map((item) => link(item, styles.profileGroup, true))}
      </div>
    </nav>
  );
}

/**
 * The phone page's side margin, half a line; the sticky name bar bleeds across it to the
 * viewport edge.
 */
const phoneGutter = `calc(${space.sectionGap} / 2)`;
/** The left one, wider beside a notch. */
const phoneGutterLeft = `max(${phoneGutter}, env(safe-area-inset-left))`;
/**
 * Phones wider than the text's column (tablets, narrow windows) centre the whole page on it, name
 * bar included, so nothing stands apart at the viewport's edges. In the wrapper and on fixed
 * elements `100%` is the viewport's width.
 */
const phoneMargin = `calc((100% - ${space.contentColumn}) / 2)`;
const phoneInsetLeft = `max(${phoneGutterLeft}, ${phoneMargin})`;
// The scrollbar's widest thumb (9px hovered at its 4px inset) plus a clear unit beside the text.
const pagebarRoom = `calc(${space.unit} + 13px)`;
const phoneInsetRight = `max(${phoneGutter}, env(safe-area-inset-right), ${phoneMargin}, ${pagebarRoom})`;

const styles = stylex.create({
  // The background lives on <html> too, so the held first frame is already the theme color.
  html: {
    backgroundColor: colors.bg,
    colorScheme: colors.scheme,
  },
  /**
   * The homepage fits the viewport; only the project list scrolls. On phones it always does; on
   * desktop the content fits until `data-dense` (see `align.ts`) holds it to the viewport.
   * Clipping covers heights too short for even its compact sidebar.
   */
  fixedViewport: { height: "100dvh", overflow: "hidden" },
  body: {
    // Held hidden by the font gate until Inter is ready; see `fontGate`.
    visibility: "var(--first-paint, visible)",
    // No background: the canvas's comes from <html>, and the grid (`grid.ts`) lies under the
    // body's paint, so any fill here would cover it.
    color: colors.primary,
    fontFeatureSettings: fontFeatures.interface,
    fontWeight: typeScale.textWeight,
    // Every element sets its own size; this keeps stray whitespace from adding height.
    fontSize: "1px",
    lineHeight: 1.5,
    WebkitFontSmoothing: "antialiased",
    MozOsxFontSmoothing: "grayscale",
    WebkitTextSizeAdjust: "100%",
    textRendering: "optimizeLegibility",
  },
  homeBody: { minHeight: "100dvh" },
  caseBody: { minHeight: "100vh" },
  wrapper: {
    // A minimum margin: the layout keeps its full width until the viewport cannot fit it. Four
    // units, a sidebar pitch. Beside a notch the margin grows to clear it (`viewport-fit=cover`).
    paddingLeft: {
      default: `max(calc(4 * ${space.unit}), env(safe-area-inset-left))`,
      [media.mobile]: phoneInsetLeft,
    },
    paddingRight: {
      default: `max(calc(4 * ${space.unit}), env(safe-area-inset-right))`,
      [media.mobile]: phoneInsetRight,
    },
  },
  /** Desktop: sidebar and content, one block centred in the wrapper at every width. */
  layout: {
    display: "grid",
    gridTemplateColumns: {
      default: `${space.sidebarColumn} 1fr`,
      [media.mobile]: "minmax(0, 1fr)",
    },
    maxWidth: `calc(${space.sidebarColumn} + ${space.layoutGap} + ${space.contentColumn})`,
    margin: "0 auto",
    minHeight: { default: "100vh", [media.mobile]: "auto" },
    gap: { default: space.layoutGap, [media.mobile]: 0 },
  },
  /**
   * Phones: the page ends a section gap below its last row, and clears Safari's bottom bar,
   * which floats over the page. A column at least the viewport tall, so on a short page the
   * signature still sits at the foot (`signatureMobile`), where the homepage's does.
   */
  // StyleX merges by property: `display` and `minHeight` here replace `layout`'s whole value, so
  // the desktop defaults are restated.
  caseLayout: {
    display: { default: "grid", [media.mobile]: "flex" },
    flexDirection: { default: null, [media.mobile]: "column" },
    minHeight: { default: "100vh", [media.mobile]: "100dvh" },
    paddingBottom: {
      default: null,
      [media.mobile]: `calc(${space.sectionGap} + env(safe-area-inset-bottom))`,
    },
  },
  homeLayout: {
    // Desktop: the name alone on the first row, then About with the lists beside the sidebar
    // links, and the room left below them, where the homepage previews a row's picture
    // (`home.tsx`).
    gridTemplateRows: {
      default: null,
      [media.desktop]: "auto auto auto 1fr",
      [media.mobile]: "auto auto auto minmax(0, 1fr)",
      // Dense: like on phones, the page holds to the viewport and the project list scrolls. The
      // list's row still grows to fit the sidebar links, so those are never cut off.
      [stylex.when.ancestor("[data-dense]", rootMarker)]: { [media.desktop]: "auto auto 1fr auto" },
    },
    rowGap: 0,
    paddingBlock: { default: null, [media.desktop]: space.pageInset },
    height: {
      default: null,
      [media.mobile]: "100dvh",
      [stylex.when.ancestor("[data-dense]", rootMarker)]: { [media.desktop]: "100dvh" },
    },
    minHeight: "100dvh",
    alignContent: { default: null, [media.mobile]: "start" },
  },
  sidebar: {
    position: { default: "sticky", [media.mobile]: "relative" },
    top: 0,
    zIndex: 100,
    height: { default: "100vh", [media.mobile]: "auto" },
    padding: { default: `${space.pageInset} 0`, [media.mobile]: 0 },
    display: { default: "flex", [media.mobile]: "contents" },
    flexDirection: "column",
  },
  /** Homepage desktop: sidebar and content share four subgrid rows (name, About, lists, room). */
  homeColumn: {
    position: { default: null, [media.desktop]: "static" },
    display: { default: null, [media.desktop]: "grid", [media.mobile]: "contents" },
    gridRow: { default: null, [media.desktop]: "1 / 5" },
    gridTemplateRows: { default: null, [media.desktop]: "subgrid" },
    height: { default: null, [media.desktop]: "auto" },
    minHeight: { default: null, [media.desktop]: 0 },
    padding: { default: null, [media.desktop]: 0 },
  },
  content: {
    minWidth: 0,
    width: "100%",
    maxWidth: space.contentColumn,
    padding: { default: `${space.pageInset} 0`, [media.mobile]: 0 },
    display: { default: "flex", [media.mobile]: "contents" },
    flexDirection: "column",
  },
  // Focused only through the skip link, which is its own cue.
  skipTarget: { position: "absolute", outline: "none" },
  /**
   * Hidden until focused, then set exactly over the name: same type, same place (the sidebar's
   * inset on desktop, the name bar's padding on phones), on the page color.
   */
  skip: {
    position: { default: "absolute", [media.mobile]: "fixed" },
    top: { default: space.pageInset, [media.mobile]: space.sectionGap },
    left: { default: 0, [media.mobile]: phoneInsetLeft },
    zIndex: 102,
    lineHeight: space.linkLineHeight,
    textDecoration: "none",
    backgroundColor: colors.bg,
    clipPath: { default: "inset(50%)", ":focus-visible": "none" },
  },
  homeContent: { gridColumn: { default: null, [media.desktop]: 2 } },
  /** Case pages' text: `ui.text`, so it follows the reader's font size from tablets up. The
   *  page's name (`case.tsx`) opens it at the page's inset, on the name's row. */
  caseContent: {
    // The signature's corner (`caseSignature`).
    position: { default: null, [media.desktop]: "relative" },
    minHeight: "100vh",
  },
  name: {
    lineHeight: space.linkLineHeight,
    marginBottom: { default: space.groupGap, [media.mobile]: space.sectionGap },
    alignContent: "start",
    gridColumn: { default: null, [media.mobile]: 1 },
    order: { default: null, [media.mobile]: 1 },
    // Desktop keeps the heading's baseline shift (`ui.heading`); phones pin the name bar on top.
    position: { default: "relative", [media.mobile]: "sticky" },
    top: { default: baseline.heading, [media.mobile]: 0 },
    zIndex: { default: null, [media.mobile]: 100 },
    // iOS Safari tints its top bar from a fixed or sticky element at least 90% of the viewport
    // wide, then keeps that color after any tap, so the bar is only as wide as its text. It has
    // no background of its own: content passes behind it and the top bar follows the page. A
    // solid backing was tried: Safari draws the page under its translucent top bar, where no
    // backing reaches, so content showed above it with a hard cut.
    width: { default: null, [media.mobile]: "fit-content" },
    maxWidth: { default: null, [media.mobile]: "100%" },
    // Phones: the bar's top padding takes the heading's baseline shift (`baseline.heading`, which
    // `top` cannot carry on a sticky bar) and the bottom padding gives it back, so the bar's
    // height and everything under it stay put.
    padding: {
      default: null,
      [media.mobile]: `calc(${space.sectionGap} + ${baseline.heading}) 0 calc(${space.unit} - ${baseline.heading})`,
    },
  },
  homeName: {
    gridRow: 1,
    alignSelf: "start",
  },
  /**
   * Phones: laid over the homepage name, so a tap on the name shows or hides Contact and Links
   * (`links.ts`). Desktop keeps them in the sidebar and has no such button.
   */
  linksToggle: {
    display: { default: "none", [media.mobile]: "block" },
    position: "absolute",
    inset: 0,
  },
  /** Inner pages: the name block, one line on desktop; phones put the page after a bar. */
  caseName: {
    display: "flex",
    flexDirection: { default: "column", [media.mobile]: "row" },
    alignItems: { default: "start", [media.mobile]: "baseline" },
    whiteSpace: "nowrap",
  },
  /** Phones: the trail's bar — no state, as the grey name it follows. */
  crumb: {
    display: { default: "none", [media.mobile]: "inline" },
    color: colors.tertiary,
    paddingInline: space.unit,
  },
  /** Phones: the page's name in the pinned trail, after the bar (`Name`). */
  mobilePage: {
    display: { default: "none", [media.mobile]: "block" },
    color: colors.primary,
  },
  /** Desktop: the top right corner, on the name's line; phones put theirs at the page's end. */
  signature: {
    display: { default: "none", [media.desktop]: "block" },
    gridRow: 1,
    justifySelf: "end",
    alignSelf: "start",
    margin: 0,
    whiteSpace: "nowrap",
  },
  /** Inner pages: over the content column's padding, as the page's title beside it. */
  caseSignature: {
    position: "absolute",
    top: `calc(${space.pageInset} + ${baseline.label})`,
    right: 0,
  },
  signatureMobile: {
    display: { default: "block", [media.desktop]: "none" },
    // Phones: last in the flow, under the article and the next projects. Its box ends a touch
    // inset below the text, as the homepage's does (`portfolio.tsx` `signature`), so at the end of
    // a page it stands exactly where the homepage's stands.
    order: { default: null, [media.mobile]: 6 },
    margin: 0,
    paddingTop: space.sectionGap,
    paddingBottom: space.touchInset,
    marginTop: { default: null, [media.mobile]: "auto" },
  },
  /**
   * The parent: the same name, in the same type and place as on the homepage, so only its color
   * changes between pages. Gray until hovered or focused; the page under it is in full contrast.
   */
  home: {
    color: {
      default: colors.tertiary,
      ":hover": { [media.hover]: colors.primary },
      ":focus-visible": colors.primary,
    },
    textDecoration: "none",
  },
  desktopOnly: { display: { default: "contents", [media.mobile]: "none" } },
  links: {
    display: "flex",
    flexDirection: { default: "column", [media.mobile]: "row" },
    rowGap: space.linkGap,
    gridColumn: { default: null, [media.mobile]: "1 / -1" },
  },
  /** Phones: hidden until the name is tapped (`links.ts`), then right under it, above About. */
  homeLinks: {
    display: {
      default: "flex",
      [media.mobile]: "none",
      [stylex.when.ancestor("[data-links-open]", rootMarker)]: { [media.mobile]: "flex" },
    },
    // Desktop: beside About and the lists, so About starts on Contact's line.
    gridRow: { default: 2, [media.desktop]: "2 / 4" },
    alignSelf: { default: null, [media.desktop]: "start" },
    marginBottom: { default: null, [media.mobile]: space.sectionGap },
  },
  /**
   * Desktop: one list, as if ungrouped. Phones: side by side; Contact takes the rest of the row
   * after Links (`profiles`).
   */
  linkGroup: {
    display: { default: "contents", [media.mobile]: "flex" },
    flexDirection: "column",
    rowGap: space.linkGap,
    flex: { default: null, [media.mobile]: "1 1 0" },
    minWidth: 0,
  },
  /** Phones: Links first, on the left half; Contact takes the right half. */
  profiles: {
    order: { default: null, [media.mobile]: -1 },
    flex: { default: null, [media.mobile]: "0 0 50%" },
  },
  label: { width: "fit-content" },
  profileLabel: { marginTop: { default: null, [media.desktop]: space.sidebarBaselinePitch } },
  /** Compact (a dense homepage too short for the whole sidebar, see `align.ts`): contact stays. */
  profileGroup: {
    display: {
      default: null,
      [stylex.when.ancestor("[data-compact]", rootMarker)]: { [media.desktop]: "none" },
    },
  },
  link: {
    paddingBlock: `calc(${space.linkGap} / 2)`,
    marginBlock: `calc(${space.linkGap} / -2)`,
  },
  contactLabel: {
    marginTop: {
      default: `calc(${space.sectionGap} - ${space.sectionContentGap})`,
      [media.desktop]: 0,
      [media.mobile]: 0,
    },
  },
});
