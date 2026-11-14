import type { VNode } from "preact";
import { renderToString } from "preact-render-to-string";
import { collect } from "./archive.tsx";
import { files } from "./files.ts";
import type { Assets } from "./layout.tsx";
import { AllPage, CasePage, DocPage, ProductPage } from "./pages/case.tsx";
import { type Preview, Home, livePreviews } from "./pages/home.tsx";
import { leadOf } from "./markdown.tsx";
import { media } from "./media.ts";
import {
  builtProducts,
  type Case,
  cases,
  origin,
  pages,
  type Product,
  products,
  projects,
} from "./site.ts";

// For the build (`vite.config.ts`): the share image comes first, since the pages link it, and the
// stamped copies of `public/` files last, once rendering has named them all.
export { ogImage } from "./og.tsx";
export { stamp, versionedCopies } from "./versioned.ts";

/** Where the rendered share image lives before stamping. */
export const shareImagePath = "/images/og-image.png";

const sources = import.meta.glob<string>("./content/*.md", {
  query: "?raw",
  import: "default",
  eager: true,
});
const markdown = Object.fromEntries(
  Object.entries(sources).map(([path, source]) => [
    path.replace(/^\.\/content\/|\.md$/g, ""),
    source,
  ]),
);

function text(slug: string): string {
  const body = markdown[slug];
  if (body === undefined) throw new Error(`Missing src/content/${slug}.md`);
  return body;
}

const projectsBySlug = new Map<string, Case | Product>(
  [...cases, ...products].map((item) => [item.slug, item]),
);

/**
 * The Markdown a reader or agent receives: a project's page as written, then its source code and
 * links, as the HTML page lists them around the text. Plain pages are served as written.
 */
function published(slug: string): string {
  const body = text(slug);
  const item = projectsBySlug.get(slug);
  if (item === undefined) return body;
  const links = [
    ...(item.repository === null ? [] : [{ label: "Source code", href: item.repository }]),
    ...item.links,
  ];
  if (links.length === 0) return body;
  const list = links.map(({ label, href }) => `- [${label}](${href})`).join("\n");
  return `${body.trimEnd()}\n\n## ${links.length === 1 ? "Source" : "Sources"}\n\n${list}\n`;
}

// Cloudflare email obfuscation would rewrite the visible address, so opt the copy button out.
const html = (page: VNode) =>
  `<!doctype html>\n${renderToString(page).replace(
    /<div[^>]*data-island="email"[\s\S]*?<\/button><\/div>/g,
    (island) => `<!--email_off-->${island}<!--/email_off-->`,
  )}\n`;

/**
 * The homepage rows with a picture to preview: the Work pages' lead image, recording or live
 * demo. The Projects section previews nothing yet (`home.tsx`).
 */
const previews: Preview[] = projects
  .filter(({ group }) => group.$ === "Work")
  .flatMap(({ href, slug }) => {
    if (slug === null) return [];
    const body = markdown[slug];
    const id =
      (body === undefined ? undefined : leadOf(body, livePreviews)) ??
      Object.keys(media).find((key) => media[key]?.preview === slug);
    return id === undefined ? [] : [{ href, id }];
  });

/** Every generated file of the site, keyed by its path in the output directory. */
export function render(assets: Assets): Record<string, string> {
  const work = collect(markdown);
  return {
    "index.html": html(<Home assets={assets} work={work} previews={previews} />),
    "all.html": html(<AllPage assets={assets} work={work} />),
    ...Object.fromEntries(
      cases.map((item) => [
        `${item.slug}.html`,
        html(<CasePage assets={assets} item={item} markdown={text(item.slug)} />),
      ]),
    ),
    ...Object.fromEntries(
      pages.map((page) => [
        `${page.slug}.html`,
        html(<DocPage assets={assets} page={page} markdown={text(page.slug)} />),
      ]),
    ),
    ...Object.fromEntries(
      builtProducts.map((item) => [
        `${item.slug}.html`,
        html(<ProductPage assets={assets} item={item} markdown={text(item.slug)} />),
      ]),
    ),
    ...Object.fromEntries(
      Object.keys(markdown).map((slug) => [`content/${slug}.md`, published(slug)]),
    ),
    ...files,
    "llms-full.txt": fullText(),
  };
}

/** The whole public text in one Markdown file, for agents that should not crawl. */
function fullText(): string {
  const sections = [
    {
      heading: "Homepage",
      path: `${origin}/`,
      source: "/index.html.md",
      body: files["index.html.md"] ?? "",
    },
    ...[...cases, ...pages, ...builtProducts].map(({ slug, name }) => ({
      heading: name,
      path: `${origin}/${slug}`,
      source: `/content/${slug}.md`,
      body: published(slug),
    })),
  ];
  return `# gildrb.com

> Every public page of ${origin}/ in one Markdown file.

${sections.map(({ heading, path }) => `- [${heading}](${path})`).join("\n")}

---

${sections
  .map(({ heading, path, source, body }) =>
    [`## ${heading}`, "", `Page: ${path}`, `Markdown: ${origin}${source}`, "", body.trim()].join(
      "\n",
    ),
  )
  .join("\n\n---\n\n")}
`;
}
