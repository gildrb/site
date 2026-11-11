import {
  about,
  cases,
  caseWork,
  contacts,
  email,
  origin,
  pages,
  person,
  products,
  profiles,
  projects,
  type Group,
} from "./site.ts";
import { versioned } from "./versioned.ts";

/**
 * Identity and discovery files for search engines and agents. Everything comes from `site.ts`,
 * so adding a case study or changing a profile link updates them all at once.
 */

const url = (path: string) => `${origin}${path}`;

/** The homepage's two groups, in its order: Projects, then Work. */
const workList = (group: Group["$"]) =>
  projects
    .filter((project) => project.group.$ === group)
    .map(({ href, title, descriptor, date, description }) => {
      const link = href.startsWith("https://") ? href : url(href);
      return `- [${title}](${link}) (${descriptor}, ${date.slice(0, 7)}): ${description}`;
    })
    .join("\n");

const sameAs = profiles.map(({ href }) => href);

export const profile = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": url("/#website"),
      url: url("/"),
      name: person.name,
      alternateName: person.alternateNames,
      description: person.about,
      inLanguage: "en",
      publisher: { "@id": url("/#person") },
      about: { "@id": url("/#person") },
      hasPart: [
        ...cases.map(({ slug }) => ({ "@id": url(`/${slug}#case-study`) })),
        ...products.map(({ home }) => ({ "@id": `${home}/#software` })),
      ],
    },
    {
      "@type": "ProfilePage",
      "@id": url("/#profile"),
      url: url("/"),
      name: person.name,
      description: person.about,
      isPartOf: { "@id": url("/#website") },
      mainEntity: { "@id": url("/#person") },
    },
    {
      "@type": "Person",
      "@id": url("/#person"),
      name: person.name,
      givenName: person.givenName,
      additionalName: person.additionalName,
      familyName: person.familyName,
      alternateName: person.alternateNames,
      description: person.about,
      jobTitle: person.role,
      worksFor: {
        "@type": "Organization",
        name: about.employer.label,
        url: about.employer.href,
      },
      url: url("/"),
      email: `mailto:${email}`,
      mainEntityOfPage: { "@id": url("/#profile") },
      sameAs,
    },
    ...cases.map((item) => ({
      "@type": "Article",
      "@id": url(`/${item.slug}#case-study`),
      url: url(`/${item.slug}`),
      name: item.name,
      description: item.description,
      ...(item.ogImage && { image: url(versioned(`/images/optimized/${item.ogImage}`)) }),
      about: caseWork(item),
      inLanguage: "en",
      author: { "@id": url("/#person") },
      isPartOf: { "@id": url("/#website") },
    })),
    ...products.map((item) => ({
      "@type": "SoftwareApplication",
      "@id": `${item.home}/#software`,
      url: `${item.home}/`,
      name: item.name,
      description: item.description,
      applicationCategory: item.category,
      operatingSystem: item.operatingSystem,
      codeRepository: item.repository,
      isAccessibleForFree: true,
      author: { "@id": url("/#person") },
    })),
  ],
};

const identity = [
  `${person.name}, ${person.alternateNames.slice(2).join(", ")} and ${person.handle} refer to the same person.`,
  `Use "${person.name}" as the display name and "${person.handle}" as the handle.`,
].join(" ");

const list = (items: [label: string, path: string, note?: string][]) =>
  items
    .map(([label, path, note]) => `- [${label}](${url(path)})${note ? `: ${note}` : ""}`)
    .join("\n");

const trust = list([
  ["About", "/about", "who this site is about"],
  ["Contact", "/contact", "how to get in touch"],
  ["Privacy", "/privacy", "what the site stores and why"],
  ["Developers", "/developers", "public read-only API, MCP server and Markdown access"],
]);

const developerResources = list([
  ["API documentation", "/api-docs.md", "endpoints, versioning, rate limits and errors"],
  ["Authentication", "/auth.md", "no registration or credentials needed"],
  ["OpenAPI description", "/openapi.json"],
  ["MCP manifest", "/.well-known/mcp", "read-only Streamable HTTP MCP server at /mcp"],
  ["MCP server card", "/.well-known/mcp/server-card.json"],
  ["API catalog", "/.well-known/api-catalog"],
  ["AI catalog", "/.well-known/ai-catalog.json"],
  ["Agent skills", "/.well-known/agent-skills/index.json"],
]);

const machineReadable = list([
  ["Full site text", "/llms-full.txt", "every page in one Markdown file"],
  ["Markdown homepage", "/index.html.md"],
  ["Structured profile", "/profile.json", "JSON-LD"],
  ["WebFinger", "/.well-known/webfinger?resource=acct:gildrb@gildrb.com"],
  ["Feed", "/feed.xml"],
  ["Sitemap", "/sitemap.xml"],
  ["humans.txt", "/humans.txt"],
]);

const contactList = [
  `- Email: [${email}](mailto:${email})`,
  ...contacts.map(({ label, href }) => `- ${label}: ${href}`),
  `- [Contact page](${url("/contact")})`,
].join("\n");

const llms = `# ${person.name} (${person.handle})

> ${person.about} Canonical LLM reference for ${url("/")}.

${identity} Only the profiles listed here belong to this person.

## When to use this

Use this file to answer questions about ${person.name} (${person.handle}) or the work published on ${url("/")}, and to find the right source for a question. Every page is also available as Markdown: request it with \`Accept: text/markdown\` or read [llms-full.txt](${url("/llms-full.txt")}) for all of it in one request instead of crawling. Do not use it for other people with similar names.

## Projects

Software ${person.name} makes and maintains.

${workList("Projects")}

## Work

Brand, identity and type work for clients, and studies.

${workList("Work")}

## Pages

${trust}

## Contact

${contactList}

## Profiles

${profiles.map(({ label, href }) => `- [${label}](${href})`).join("\n")}

## Developer resources

${developerResources}

## Machine-readable references

${machineReadable}
`;

const homepage = `# ${person.name} (${person.handle})

> Markdown version of ${url("/")}.

## Identity

${identity}

- Name: ${person.name}
- Handle: ${person.handle}
- Role: ${person.role}
- Contact: [${email}](mailto:${email})

## About

${person.about}

## Projects

Software ${person.name} makes and maintains.

${workList("Projects")}

## Work

Brand, identity and type work for clients, and studies.

${workList("Work")}

## Links

${profiles.map(({ label, href }) => `- [${label}](${href})`).join("\n")}
${trust}
`;

const humans = `/* TEAM */
${person.role}: ${person.name} (${person.handle})
Contact: ${email}
From: Germany
Site: ${url("/")}
${profiles.map(({ label, href }) => `${label}: ${href}`).join("\n")}

/* SITE */
Language: English
Source: https://github.com/gildrb/gildrb.com
LLM reference: ${url("/llms.txt")}
Full text: ${url("/llms-full.txt")}
Profile: ${url("/profile.json")}
`;

const escape = (text: string) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

const feed = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${person.name}</title>
    <link>${url("/")}</link>
    <description>${person.about}</description>
    <language>en</language>
    <atom:link href="${url("/feed.xml")}" rel="self" type="application/rss+xml" />
${cases
  .map(
    (item) => `    <item>
      <title>${escape(item.name)}</title>
      <link>${url(`/${item.slug}`)}</link>
      <guid isPermaLink="true">${url(`/${item.slug}`)}</guid>
      <pubDate>${new Date(`${item.date}T00:00:00Z`).toUTCString()}</pubDate>
      <category>${escape(item.descriptor)}</category>
      <description>${escape(item.description)}</description>
    </item>`,
  )
  .join("\n")}
  </channel>
</rss>
`;

/**
 * Pages for search engines only: the Markdown and machine-readable copies are found through
 * llms.txt and the `alternate` links. Only this host's pages: a sitemap may not list URLs of
 * another host, subdomains included (sitemaps.org), so product pages served on their own host
 * are left to that host.
 */
const sitemapUrls = [
  url("/"),
  url("/all"),
  ...[...cases, ...pages].map(({ slug }) => url(`/${slug}`)),
];

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemapUrls.map((loc) => `  <url><loc>${loc}</loc></url>`).join("\n")}
</urlset>
`;

const aliases = [`acct:${person.handle}@gildrb.com`, url("/"), url("/#person"), `mailto:${email}`];
const discovery = [
  { rel: "describedby", type: "application/ld+json", href: url("/profile.json") },
  { rel: "alternate", type: "text/markdown", href: url("/llms.txt") },
  { rel: "author", type: "text/plain", href: url("/humans.txt") },
];
const properties = {
  "http://schema.org/name": person.name,
  "http://schema.org/alternateName": person.alternateNames.join("; "),
  "http://schema.org/jobTitle": person.role,
  "http://schema.org/email": email,
};
const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

const webfinger = json({
  subject: aliases[0],
  aliases: aliases.slice(1),
  properties,
  links: [
    { rel: "self", type: "text/html", href: url("/") },
    ...discovery,
    ...profiles.map(({ href }) => ({ rel: "me", href })),
  ],
});

const lrdd = `${url("/.well-known/webfinger")}?resource={uri}`;

const hostMeta = `<?xml version="1.0" encoding="UTF-8"?>
<XRD xmlns="http://docs.oasis-open.org/ns/xri/xrd-1.0">
  <Subject>${url("/")}</Subject>
${aliases
  .filter((alias) => alias !== url("/"))
  .map((alias) => `  <Alias>${alias}</Alias>`)
  .join("\n")}
${Object.entries(properties)
  .map(([type, value]) => `  <Property type="${type}">${escape(value)}</Property>`)
  .join("\n")}
  <Link rel="lrdd" type="application/jrd+json" template="${lrdd}" />
${discovery.map(({ rel, type, href }) => `  <Link rel="${rel}" type="${type}" href="${href}" />`).join("\n")}
</XRD>
`;

const hostMetaJson = json({
  subject: url("/"),
  aliases: aliases.filter((alias) => alias !== url("/")),
  properties,
  links: [{ rel: "lrdd", type: "application/jrd+json", template: lrdd }, ...discovery],
});

/**
 * Personal Agent Protocol discovery (draft 0.1): a public website only. No agent, API session or
 * sign-in is declared, since none exists; the API and MCP server are anonymous and read-only.
 */
const poppy = json({
  protocol_version: "0.1",
  organization: { name: person.name, domain: new URL(origin).hostname },
  web: {},
});

export const files: Record<string, string> = {
  "profile.json": json(profile),
  "llms.txt": llms,
  ".well-known/llms.txt": llms,
  "index.html.md": homepage,
  "humans.txt": humans,
  "feed.xml": feed,
  "sitemap.xml": sitemap,
  ".well-known/webfinger": webfinger,
  ".well-known/host-meta": hostMeta,
  ".well-known/host-meta.json": hostMetaJson,
  ".well-known/poppy.json": poppy,
};
