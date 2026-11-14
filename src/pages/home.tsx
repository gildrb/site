import * as stylex from "@stylexjs/stylex";
import type { Work } from "../archive.tsx";
import { profile } from "../files.ts";
import { Island } from "../island.tsx";
import { Portfolio } from "../islands/portfolio.tsx";
import {
  type Assets,
  Document,
  JsonLd,
  Links,
  Main,
  Name,
  scriptJson,
  Shell,
  Sidebar,
} from "../layout.tsx";
import { sources } from "../markdown.tsx";
import { media as artwork } from "../media.ts";
import { about, developers, origin, person, profiles, projects } from "../site.ts";
import { media, motion, space } from "../tokens.stylex.ts";
import { ui } from "../ui.tsx";
import { shareFrame } from "../og.tsx";
import type { PreviewData } from "../preview.ts";
import { versioned } from "../versioned.ts";

/** A homepage row's preview: the row's link and its page's lead image or recording (`leadOf`). */
export type Preview = { href: string; id: string };

const title = `${person.name} (${person.handle})`;

/** What search results show under the name: the About text, then the projects by name. */
const description = `${person.about} Projects: ${projects.map((project) => project.title).join(", ")}.`;

/** Machine-readable versions of this page, advertised to crawlers and agents. */
const alternates: [rel: string, type: string, path: string, title: string][] = [
  ["alternate", "text/markdown", "/index.html.md", "Markdown version"],
  ["alternate", "text/markdown", "/llms.txt", "LLM reference"],
  ["alternate", "text/markdown", "/llms-full.txt", "Full site text"],
  ["alternate", "application/rss+xml", "/feed.xml", "Feed"],
  ["author", "text/plain", "/humans.txt", "humans.txt"],
  ["sitemap", "application/xml", "/sitemap.xml", "Sitemap"],
  // RFC 8631: the service documentation, found by agents without any text on the page.
  ["service-doc", "text/html", `/${developers.slug}`, developers.description],
];

function Head({ shareImage, previews }: { shareImage: string; previews: readonly Preview[] }) {
  return (
    <>
      <meta name="description" content={description} />
      <meta name="author" content={person.name} />
      <meta
        name="robots"
        content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1"
      />
      <link rel="canonical" href={`${origin}/`} />
      {alternates.map(([rel, type, path, linkTitle]) => (
        <link key={path} rel={rel} type={type} href={`${origin}${path}`} title={linkTitle} />
      ))}
      {profiles.map(({ href }) => (
        <link key={href} rel="me" href={href} />
      ))}
      <meta property="og:type" content="profile" />
      <meta property="og:url" content={`${origin}/`} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:site_name" content={person.name} />
      <meta property="og:image" content={`${origin}${shareImage}`} />
      <meta property="og:image:width" content={String(shareFrame.width)} />
      <meta property="og:image:height" content={String(shareFrame.height)} />
      <meta property="og:image:alt" content={title} />
      <meta property="profile:first_name" content={person.givenName} />
      <meta property="profile:last_name" content={person.familyName} />
      <meta property="profile:username" content={person.handle} />
      <meta name="twitter:card" content="summary_large_image" />
      <JsonLd value={profile} />
      {/* The desktop previews' pictures as data (`Previews`): read after the first paint, so
          they wait here rather than weigh on the page's body. */}
      <script
        type="application/json"
        id="preview-data"
        dangerouslySetInnerHTML={{ __html: scriptJson(previewData(previews)) }}
      />
    </>
  );
}

export function Home({
  assets,
  work,
  previews,
}: {
  assets: Assets;
  work: readonly Work[];
  previews: readonly Preview[];
}) {
  return (
    <Document
      assets={assets}
      title={title}
      head={<Head shareImage={assets.shareImage} previews={previews} />}
      mono={false}
      home
    >
      <Shell home>
        <Sidebar home label={{ "aria-labelledby": "site-title" }}>
          <Name />
          <Links home />
        </Sidebar>
        <Main home>
          <section {...stylex.props(styles.summary)} aria-labelledby="profile-summary-title">
            <h2 {...stylex.props(ui.label, styles.heading)} id="profile-summary-title">
              About
            </h2>
            <p {...stylex.props(ui.text)}>{about.shown}</p>
          </section>
          <Island
            name="portfolio"
            component={Portfolio}
            // Works the table does not lead to: archive-only ones and those of unlisted cases.
            props={{
              more: work.filter(({ from }) => from.$ === "Archive" || !from.project.listed).length,
            }}
          />
          <Previews />
        </Main>
      </Shell>
    </Document>
  );
}

/** Live demos the homepage can preview as they run (`preview.ts`); other demos give way to a file. */
export const livePreviews: ReadonlySet<string> = new Set(["curves-demo"]);

/**
 * Desktop: the lead picture of the row under the pointer or selected with the keys, in the room
 * below the table, and nothing at rest. It shows as the row lights, at once, and leaves with the
 * row's fade (`motion.response`). Only the empty room is markup, so it never shifts the page;
 * the pictures travel as data in the head (`previewData`), which `preview.ts` turns into
 * elements after the first paint, loads, fits to the room and shows one at a time. Decoration:
 * the row already names what it shows.
 */
function Previews() {
  return <div {...stylex.props(styles.previews)} aria-hidden="true" data-previews />;
}

/** Each previewed row's picture, as `preview.ts` reads it from `#preview-data`. */
function previewData(previews: readonly Preview[]): PreviewData[] {
  return previews.map(({ href, id }) => {
    if (id === "curves-demo")
      return { $: "Specimen", href, font: versioned("/fonts/curves.woff2") };
    const item = artwork[id];
    if (!item) throw new Error(`Unknown media id: ${id}`);
    const { src, srcset } = sources(id);
    return item.video
      ? { $: "Video", href, poster: src, src: versioned(`/videos/gil-rodrigues-${id}.mp4`) }
      : { $: "Image", href, src, srcset: srcset ?? null };
  });
}

const styles = stylex.create({
  summary: {
    maxWidth: space.contentColumn,
    gridColumn: { default: null, [media.mobile]: "1 / -1" },
    gridRow: { default: null, [media.desktop]: 2, [media.mobile]: 3 },
    alignSelf: { default: null, [media.desktop]: "start" },
    // Phones: the table's label baseline two line intervals (64px) below the About line's, as on
    // desktop; the label's own touch inset is part of that distance.
    marginBottom: {
      default: space.groupGap,
      [media.mobile]: `calc(8 * ${space.unit} - ${space.linkLineHeight} - ${space.touchInset})`,
    },
  },
  heading: {
    marginBottom: { default: space.sectionContentGap, [media.desktop]: space.linkGap },
  },
  /**
   * The room below the table, to the page's bottom inset (the layout's last row): the pictures
   * hang from its top, on the fields from the text's left edge (`preview.ts` sizes them). The
   * whole fades as a row does: in at once, out over `motion.response`.
   */
  previews: {
    display: { default: "none", [media.desktop]: "block" },
    gridRow: 4,
    position: "relative",
    minHeight: 0,
    // The pictures never size the page: the room is what the layout leaves.
    overflow: "hidden",
    pointerEvents: "none",
    opacity: { default: 0, ":is([data-shown])": 1 },
    transitionProperty: "opacity",
    transitionDuration: { default: motion.response, ":is([data-shown])": "0s" },
    transitionTimingFunction: motion.responseEasing,
  },
});
