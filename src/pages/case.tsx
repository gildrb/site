import * as stylex from "@stylexjs/stylex";
import { ArchiveGrid, type Work } from "../archive.tsx";
import { SourcesLine } from "../aside.tsx";
import { Island } from "../island.tsx";
import { Converter } from "../islands/archetypon.tsx";
import { Article, demos, parse, sizesFor, sources } from "../markdown.tsx";
import {
  type Assets,
  Document,
  JsonLd,
  Main,
  Name,
  PageLinks,
  Shell,
  Sidebar,
} from "../layout.tsx";
import { Row } from "../row.tsx";
import {
  type Case,
  cases,
  caseWork,
  origin,
  pages,
  person,
  type Product,
  products,
  type Project,
  projects,
} from "../site.ts";
import { colors, listMarker, media, space } from "../tokens.stylex.ts";
import { ui } from "../ui.tsx";
import { versioned } from "../versioned.ts";

const monoBlocks = (markdown: string) =>
  parse(markdown).blocks.some(
    (block) =>
      block.type === "code" ||
      (block.type === "media" && block.items.some(({ id }) => demos.has(id))),
  );

/**
 * Every inner page. Its tab and its link preview read like its breadcrumb ("Gil Rodrigues → T3")
 * unless the page names its own `title`; the preview shows the page's own image, or else the
 * homepage as rendered at build time.
 */
function Frame({
  assets,
  url,
  current,
  title = `${person.name} → ${current}`,
  type,
  description,
  shareDescription = description,
  image = assets.shareImage,
  head,
  mono,
  heading = false,
  children,
}: {
  assets: Assets;
  /** The canonical URL. */
  url: string;
  title?: string;
  type: "article" | "website";
  description: string;
  shareDescription?: string;
  /** A stamped site path, see `versioned`. */
  image?: string;
  current: string;
  head: preact.ComponentChildren;
  mono: boolean;
  /** The archive page makes the page's name its `<h1>`. */
  heading?: boolean;
  children: preact.ComponentChildren;
}) {
  const Title = heading ? "h1" : "p";
  return (
    <Document
      assets={assets}
      title={title}
      mono={mono}
      head={
        <>
          <meta name="description" content={description} />
          <meta name="author" content={person.name} />
          <meta name="creator" content={person.name} />
          <meta name="robots" content="index, follow, max-image-preview:large" />
          <link rel="canonical" href={url} />
          <meta property="og:type" content={type} />
          <meta property="og:url" content={url} />
          <meta property="og:title" content={title} />
          <meta property="og:description" content={shareDescription} />
          <meta property="og:image" content={`${origin}${image}`} />
          <meta name="twitter:card" content="summary_large_image" />
          <meta name="twitter:title" content={title} />
          <meta name="twitter:description" content={shareDescription} />
          <meta name="twitter:image" content={`${origin}${image}`} />
          {head}
        </>
      }
    >
      <Shell>
        <Sidebar
          label={{
            "aria-label": `${current} navigation`,
          }}
        >
          <Name current={current} />
          <PageLinks />
        </Sidebar>
        <Main>
          <Title {...stylex.props(ui.heading, styles.pageTitle)}>{current}</Title>
          {children}
        </Main>
      </Shell>
    </Document>
  );
}

/** Starts loading a page's first image with the HTML, since it is usually the largest paint. */
function HeroPreload({ markdown }: { markdown: string }) {
  const { blocks } = parse(markdown);
  const block = blocks.find((each) => each.type === "media");
  const first = block?.items[0]?.id;
  if (!block || !first || demos.has(first)) return null;
  const { src, srcset } = sources(first);
  const sizes = sizesFor(block.items.length > 1);
  return (
    <link
      rel="preload"
      as="image"
      href={src}
      {...(srcset && { imagesrcset: srcset, imagesizes: sizes })}
      fetchPriority="high"
    />
  );
}

function Alternates({ slug, name }: { slug?: string; name?: string }) {
  return (
    <>
      <link
        rel="alternate"
        type="text/markdown"
        href={`${origin}/llms.txt`}
        title={`LLM reference for ${person.name}`}
      />
      <link
        rel="alternate"
        type="text/markdown"
        href={`${origin}/llms-full.txt`}
        title={`Full public website text for ${person.name}`}
      />
      {slug && (
        <link
          rel="alternate"
          type="text/markdown"
          href={`${origin}/content/${slug}.md`}
          title={`Markdown source for ${name}`}
        />
      )}
    </>
  );
}

export function CasePage({
  assets,
  item,
  markdown,
}: {
  assets: Assets;
  item: Case;
  markdown: string;
}) {
  const url = `${origin}/${item.slug}`;
  const image = item.ogImage && versioned(`/images/optimized/${item.ogImage}`);
  const others = next(`/${item.slug}`);
  return (
    <Frame
      assets={assets}
      url={url}
      type="article"
      description={item.description}
      shareDescription={item.ogDescription}
      {...(image && { image })}
      current={item.name}
      title={item.headline}
      mono={monoBlocks(markdown)}
      head={
        <>
          <Alternates slug={item.slug} name={item.name} />
          <JsonLd
            value={{
              "@context": "https://schema.org",
              "@type": "Article",
              "@id": `${url}#case-study`,
              url,
              headline: parse(markdown).title,
              description: item.description,
              ...(image && { image: `${origin}${image}` }),
              about: caseWork(item),
              author: {
                "@type": "Person",
                "@id": `${origin}/#person`,
                name: person.name,
                url: `${origin}/`,
              },
              inLanguage: "en",
            }}
          />
          <HeroPreload markdown={markdown} />
        </>
      }
    >
      <article {...stylex.props(styles.column, styles.phoneItem)}>
        <Article
          markdown={markdown}
          eager
          reading
          codeLine={
            item.repository === null ? null : (
              <SourcesLine links={[{ label: "Source code", href: item.repository }]} />
            )
          }
          sourcesLine={item.links.length > 0 ? <SourcesLine links={item.links} /> : null}
        />
      </article>
      <Next projects={others} />
    </Frame>
  );
}

/**
 * The three projects after this one in the homepage's order, wrapping round to the newest;
 * external projects are left out unless they are products, whose pages live on their own hosts.
 */
function next(href: string): Project[] {
  const own = projects.filter(
    (project) => !project.external || products.some(({ home }) => `${home}/` === project.href),
  );
  const at = own.findIndex((project) => project.href === href);
  return [1, 2, 3]
    .map((step) => own[(at + step) % own.length])
    .filter((project): project is Project => project !== undefined && project.href !== href);
}

function Next({ projects: list }: { projects: readonly Project[] }) {
  return (
    <nav {...stylex.props(styles.column, styles.phoneItem, styles.next)} aria-label="More projects">
      <div {...stylex.props(listMarker, styles.nextList)}>
        {list.map((project, index) => (
          <Row key={project.href} project={project} first={index === 0} home={false} />
        ))}
      </div>
    </nav>
  );
}

/** The archive: the artwork of every case study as one grid of images, newest first. */
export function AllPage({ assets, work }: { assets: Assets; work: readonly Work[] }) {
  return (
    <Frame
      assets={assets}
      url={`${origin}/all`}
      type="website"
      description={`Logos, typefaces, identities and websites by ${person.name}.`}
      current="Archive"
      mono={false}
      heading
      head={
        <>
          <Alternates />
          <JsonLd
            value={{
              "@context": "https://schema.org",
              "@type": "CollectionPage",
              "@id": `${origin}/all#page`,
              url: `${origin}/all`,
              name: `Archive of work by ${person.name}`,
              isPartOf: { "@id": `${origin}/#website` },
              about: { "@id": `${origin}/#person` },
              author: { "@id": `${origin}/#person` },
              hasPart: cases.map(({ slug }) => ({ "@id": `${origin}/${slug}#case-study` })),
            }}
          />
        </>
      }
    >
      <ArchiveGrid work={work} />
    </Frame>
  );
}

const styles = stylex.create({
  column: { width: `min(100%, ${space.contentColumn})`, marginInline: "auto" },
  /** The page's name at the top of the content: the name's size, on the name's row. */
  pageTitle: {
    color: colors.primary,
    textDecoration: "none",
    lineHeight: space.linkLineHeight,
    // The article keeps its start row below: the one where Contact starts (`layout.tsx`).
    display: { default: "block", [media.mobile]: "none" },
    marginBottom: {
      default: space.sectionContentGap,
      [media.desktop]: `calc(9 * ${space.unit})`,
    },
  },
  phoneItem: {
    gridColumn: { default: null, [media.mobile]: "1 / -1" },
    order: { default: null, [media.mobile]: 5 },
  },
  /**
   * The next projects: one empty line below the text, on desktop at the column's foot.
   */
  next: {
    marginTop: { default: space.groupGap, [media.desktop]: "auto" },
    paddingTop: { default: null, [media.desktop]: space.groupGap },
  },
  /** The homepage table's columns. */
  nextList: {
    display: "grid",
    gridTemplateColumns: space.projectColumns,
    columnGap: { default: space.tableGap, [media.mobile]: space.mobileTableGap },
  },
});

/** A plain page (about, contact, …) written in Markdown. */
export function DocPage({
  assets,
  page,
  markdown,
}: {
  assets: Assets;
  page: (typeof pages)[number];
  markdown: string;
}) {
  return (
    <Frame
      assets={assets}
      url={`${origin}/${page.slug}`}
      type="website"
      description={page.description}
      current={page.name}
      mono={monoBlocks(markdown)}
      head={
        <>
          <Alternates slug={page.slug} name={page.name} />
          <JsonLd
            value={{
              "@context": "https://schema.org",
              "@type": page.kind,
              "@id": `${origin}/${page.slug}#page`,
              url: `${origin}/${page.slug}`,
              name: parse(markdown).title,
              description: page.description,
              inLanguage: "en",
              isPartOf: { "@id": `${origin}/#website` },
              author: { "@id": `${origin}/#person` },
              // About and contact pages are about the person; the others about the site.
              ...(page.kind === "WebPage"
                ? { about: { "@id": `${origin}/#website` } }
                : { mainEntity: { "@id": `${origin}/#person` } }),
            }}
          />
        </>
      }
    >
      <article {...stylex.props(styles.column, styles.phoneItem)}>
        <Article markdown={markdown} eager />
      </article>
    </Frame>
  );
}

/**
 * A product, served on its own host (see `worker/products.ts`): an article on what it solves,
 * with Archetypon's converter right after the opening.
 */
export function ProductPage({
  assets,
  item,
  markdown,
}: {
  assets: Assets;
  item: Product;
  markdown: string;
}) {
  const url = `${item.home}/`;
  const others = next(url);
  return (
    <Frame
      assets={assets}
      url={url}
      title={item.headline}
      type="website"
      description={item.description}
      current={item.name}
      mono={monoBlocks(markdown)}
      head={
        <>
          <Alternates slug={item.slug} name={item.name} />
          <JsonLd
            value={{
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "@id": `${url}#software`,
              url,
              name: item.name,
              description: item.description,
              applicationCategory: item.category,
              operatingSystem: item.operatingSystem,
              ...(item.converter && { browserRequirements: "Requires WebAssembly" }),
              offers: { "@type": "Offer", price: "0", priceCurrency: "EUR" },
              isAccessibleForFree: true,
              codeRepository: item.repository,
              author: {
                "@type": "Person",
                "@id": `${origin}/#person`,
                name: person.name,
                url: `${origin}/`,
              },
              inLanguage: "en",
            }}
          />
        </>
      }
    >
      <article {...stylex.props(styles.column, styles.phoneItem)}>
        <Article
          markdown={markdown}
          eager
          reading
          codeLine={<SourcesLine links={[{ label: "Source code", href: item.repository }]} />}
          sourcesLine={item.links.length > 0 ? <SourcesLine links={item.links} /> : null}
          tool={
            item.converter ? (
              <Island
                name="archetypon"
                component={Converter}
                props={{ wasm: versioned("/tools/archetypon/archetypon.wasm") }}
              />
            ) : null
          }
        />
      </article>
      <Next projects={others} />
    </Frame>
  );
}
