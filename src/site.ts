export const origin = "https://gildrb.com";
export const email = "g@gildrb.com";

export type Link = { label: string; href: string };

/**
 * The About sentence in its parts. The homepage links the employer and, on phones, keeps its name
 * and the closing part whole, so the line breaks between them; everything else reads the sentence
 * whole (`person.about`). profile.json gives the employer as `worksFor`.
 */
export const about = {
  lead: "Design engineer at",
  employer: { label: "Sybil Solutions", href: "https://www.sybilsolutions.ai/" },
  place: "based in Germany.",
  /** What the homepage's About shows; metadata keeps the sentence above (`person.about`). */
  shown: "Designer and programmer based in Germany.",
} as const satisfies { lead: string; employer: Link; place: string; shown: string };

/**
 * Who this site is about. Keep it to facts that stay true: every page, feed and identity
 * file (profile.json, llms.txt, humans.txt, WebFinger) is generated from it.
 */
export const person = {
  name: "Gil Rodrigues",
  givenName: "Gil",
  additionalName: "Domingos",
  familyName: "Rodrigues Barbosa",
  handle: "gildrb",
  alternateNames: ["Gil", "gildrb", "Gil Rodrigues Barbosa", "Gil Domingos Rodrigues Barbosa"],
  role: "Design Engineer",
  /** The About text: the homepage, metadata, feeds and llms.txt. */
  about: `${about.lead} ${about.employer.label}, ${about.place}`,
} as const;

export const profiles: readonly Link[] = [
  { label: "Are.na", href: "https://www.are.na/gil-rodrigues-tat8yjcamq4" },
  { label: "GitHub", href: "https://github.com/gildrb" },
  { label: "Goodreads", href: "https://www.goodreads.com/user/show/179740227-gil-rodrigues" },
  { label: "Letterboxd", href: "https://letterboxd.com/gildrb/" },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/gildrb/" },
];

/** The date as people read it: "November 13, 2018". Parsed in UTC, so the day never shifts. */
function formatDate(date: string): string {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

/**
 * A Work row's date as the table and the share image set it: the day the work was made, or, for
 * work that goes on, the month it began: "Since August 2026".
 */
export function workDate(date: string, ongoing: boolean): string {
  if (!ongoing) return formatDate(date);
  const began = new Intl.DateTimeFormat("en-US", {
    month: "long",
    timeZone: "UTC",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
  return `Since ${began}`;
}

export const contacts: readonly Link[] = [
  {
    label: "Signal",
    href: "https://signal.me/#eu/KlFnTOEoXJTxUNhl9y4U4-QzunoZj6eX2BrkGYibTNUmKw8OszhNgaKd-aoseeUZ",
  },
  { label: "X", href: "https://x.com/gildrb_" },
];

/**
 * Which homepage group a row belongs to. Projects are software Gil makes and maintains: the table
 * shows what each is (`descriptor`) and where it runs (`platform`), set right where a date would
 * be; no date. Work is design for clients and older studies: the table shows what was made
 * (`work`) and the date, or since when for work that goes on (`ongoing`). The full `description`
 * is every row's link description, for screen readers and agents.
 */
export type Group =
  | { $: "Projects"; platform: string }
  | { $: "Work"; work: string; ongoing: boolean };

/** The homepage's groups, in order. */
export const groups: readonly Group["$"][] = ["Projects", "Work"];

type Row = {
  date: string;
  title: string;
  /** What the client or product is, in at most four words: feeds, llms.txt and JSON-LD. */
  descriptor: string;
  /** Facts, no tense, no narration; a project's line in the homepage table, every row's link description. */
  description: string;
  group: Group;
  /** The source code, shown right under the opening: it says the work is open source. */
  repository: `https://github.com/${string}` | null;
  /** Where else the work lives or was posted (site, posts, people): the end of the page. */
  links: readonly Link[];
};

export type Case = Row & {
  slug: string;
  /** Breadcrumb name. */
  name: string;
  /** Tab and link-preview title: what the work is, in search words; the breadcrumb stays `name`. */
  headline: string;
  ogDescription: string;
  /** Social preview image, relative to `/images/optimized/`. */
  ogImage?: string;
  /** Has a row in the homepage table; false: its page is reached from the archive only. */
  listed: boolean;
};

type External = Row & { href: string };

export const cases: readonly Case[] = [
  {
    slug: "local-studio",
    listed: true,
    date: "2026-08-26",
    title: "Local Studio",
    name: "Local Studio",
    headline: "Local Studio: brand, website and app for private AI on your Mac",
    descriptor: "On-device AI for Mac",
    group: { $: "Work", work: "Brand, website and app", ongoing: true },
    repository: "https://github.com/sybil-solutions/local-studio",
    links: [
      { label: "Site", href: "https://localstudio.ai/" },
      { label: "Sybil Solutions", href: about.employer.href },
    ],
    description: "Brand, website and native app for Local Studio, private AI on a Mac.",
    ogDescription: "Brand, website and native app for Local Studio, private AI on a Mac.",
    ogImage: "gil-rodrigues-local-studio-tour-960.webp",
  },
  {
    slug: "t3",
    listed: false,
    date: "2026-07-25",
    title: "T3",
    name: "T3",
    headline: "T3: logomark studies by Gil Rodrigues",
    descriptor: "Coding agent client",
    group: { $: "Work", work: "Logomark studies", ongoing: false },
    repository: null,
    links: [{ label: "X", href: "https://x.com/gildrb_/status/2080990301208952994" }],
    description: "T3 logomark studies: product marks, icons and rejected directions.",
    ogDescription: "T3 logomark studies: product marks, icons and rejected directions.",
    ogImage: "gil-rodrigues-t3-mark-1200.webp",
  },
  {
    slug: "ben-davis",
    listed: false,
    date: "2026-07-07",
    title: "Ben Davis",
    name: "Ben Davis",
    headline: "Ben Davis: a db monogram and the davis7.sh website",
    descriptor: "Developer and YouTuber",
    group: { $: "Work", work: "Logo and website", ongoing: false },
    repository: null,
    links: [
      { label: "Site", href: "https://davis7.gildrb.com/" },
      { label: "Ben Davis", href: "https://x.com/davis7" },
      { label: "X", href: "https://x.com/gildrb_/status/2074468837781639301" },
    ],
    description: "db monogram and davis7.sh website for developer Ben Davis.",
    ogDescription:
      "db monogram from mirrored letterforms and one diagonal, and the davis7.sh website.",
    ogImage: "gil-rodrigues-ben-davis-construction-1280.webp",
  },
  {
    slug: "heph",
    listed: false,
    date: "2026-04-21",
    title: "Heph",
    name: "Heph",
    headline: "Heph: answers from your files, with every quote checked",
    descriptor: "Local document agent",
    group: { $: "Projects", platform: "macOS, Linux" },
    repository: "https://github.com/gildrb/heph-agent",
    links: [],
    description: "Answers from the files in a folder, every quote checked against its source.",
    ogDescription: "Answers from the files in a folder, every quote checked.",
    ogImage: "gil-rodrigues-heph-answer-1600.webp",
  },
  {
    slug: "elpis",
    listed: true,
    date: "2026-09-03",
    title: "Elpis",
    name: "Elpis",
    headline: "Elpis: the fastest 4-bit Qwen3.8-27B on one RTX 3090",
    descriptor: "Local LLM inference",
    group: { $: "Projects", platform: "Linux, RTX 3090" },
    repository: "https://github.com/gildrb/elpis",
    links: [],
    description: "Fastest 4-bit Qwen3.8-27B on one RTX 3090.",
    ogDescription:
      "Qwen3.8-27B on one RTX 3090: 1,221 tok/s prefill, 126 tok/s decode, 262K context, every speedup gated on quality.",
  },
  {
    slug: "filen",
    listed: false,
    date: "2026-01-14",
    title: "Filen",
    name: "Filen",
    headline: "Filen: identity concept by Gil Rodrigues",
    descriptor: "Encrypted cloud storage",
    group: { $: "Work", work: "Identity concept", ongoing: false },
    repository: null,
    links: [{ label: "X", href: "https://x.com/gildrb_/status/2021242178727452998" }],
    description: "Identity concept for Filen: wordmark, app icon and campaign.",
    ogDescription: "Filen identity concept: sketches, scale tests, app icon and privacy campaign.",
    ogImage: "gil-rodrigues-filen-wordmark-1600.webp",
  },
  {
    slug: "n0thing",
    listed: true,
    date: "2019-11-15",
    title: "Jordan Gilbert",
    name: "Jordan Gilbert",
    headline: "Jordan Gilbert: a pixel wordmark for n0thing",
    descriptor: "Counter-Strike player",
    group: { $: "Work", work: "Pixel wordmark", ongoing: false },
    repository: null,
    links: [{ label: "n0thing", href: "https://www.n0thing.gg/" }],
    description:
      "Pixel wordmark for Jordan “n0thing” Gilbert: typewriter study, exports and animation.",
    ogDescription: "Pixel wordmark for n0thing: typewriter study, exports and animation.",
    ogImage: "gil-rodrigues-n0thing-wordmark-animation-1280.gif",
  },
  {
    slug: "curves",
    listed: true,
    date: "2019-01-25",
    title: "CURVES",
    name: "CURVES",
    headline: "CURVES: a free geometric display typeface by Gil Rodrigues",
    descriptor: "Geometric display typeface",
    group: { $: "Work", work: "Display typeface", ongoing: false },
    repository: null,
    links: [
      { label: "DaFont", href: "https://www.dafont.com/curves.font" },
      { label: "Behance", href: "https://www.behance.net/gallery/75409663/CURVES-Free-Font" },
    ],
    description: "Free geometric display typeface. 96 glyphs, unicase.",
    ogDescription: "Free geometric display typeface. 96 glyphs, unicase.",
  },
  {
    slug: "ml7",
    listed: true,
    date: "2018-11-13",
    title: "Mihai Lupascu",
    name: "Mihai Lupascu",
    headline: "Mihai Lupascu: a compact channel logo by Gil Rodrigues",
    descriptor: "Overwatch streamer",
    group: { $: "Work", work: "Channel logo", ongoing: false },
    repository: null,
    links: [{ label: "Twitch", href: "https://www.twitch.tv/ml7support" }],
    description: "Channel logo for Overwatch streamer mL7.",
    ogDescription: "mL7 channel logo: black wordmark and orange stroke.",
    ogImage: "gil-rodrigues-ml7-logo-system-1600.webp",
  },
];

/**
 * The work a case study is about, for its JSON-LD `about`. `date` is when the work was made, so it
 * is the work's `dateCreated`, not the page's publication date.
 */
export function caseWork(item: Case) {
  return {
    "@type": "CreativeWork",
    name: item.title,
    dateCreated: item.date,
    genre: item.descriptor,
    creator: { "@id": `${origin}/#person` },
  } as const;
}

/** Software I make. Its page is `gildrb.com/<slug>`, unless it has a site of its own. */
export type Product = Row & {
  slug: string;
  /** Old slugs; `gildrb.com/<former>` redirects to the product's page. */
  formerSlugs: readonly string[];
  name: string;
  /**
   * Hosts that redirect to the product's page (`worker/products.ts`): `/install` to its
   * installer path on a built page, any other path to the page; an own site keeps the path.
   */
  aliases: readonly string[];
  /**
   * Who serves the page. `Built`: this site, at `gildrb.com/<slug>`, from
   * `src/content/<slug>.md`. `Own`: a site of its own at `home`, elsewhere (eukhe.com is
   * gildrb/eukhe-site); this site only links and redirects there.
   */
  site: { $: "Built" } | { $: "Own"; home: `https://${string}` };
  /** Tab and search title: what it does, in the words people search for. */
  headline: string;
  repository: `https://github.com/${string}`;
  /** schema.org `applicationCategory`. */
  category: "DeveloperApplication" | "DesignApplication";
  operatingSystem: string;
  /** Archetypon also runs on its page; the others only describe themselves. */
  converter: boolean;
  /**
   * A `curl … | sh` installer behind the page: `<page>/install` always, and the page for clients
   * that ask for neither HTML nor Markdown.
   */
  installer: { $: "None" } | { $: "Script"; url: `https://${string}` };
};

export const products: readonly Product[] = [
  {
    slug: "eukhe",
    formerSlugs: [],
    date: "2026-10-05",
    title: "Eukhe",
    name: "Eukhe",
    descriptor: "Coding agent",
    group: { $: "Projects", platform: "macOS, Linux" },
    links: [],
    aliases: ["eukhe.gildrb.com"],
    site: { $: "Own", home: "https://eukhe.com" },
    headline: "Eukhe: a coding agent that remembers every chat",
    description: "eukhe.com: Neovim in the browser, on a proven core.",
    repository: "https://github.com/gildrb/eukhe",
    category: "DeveloperApplication",
    operatingSystem: "macOS (Apple Silicon), Linux",
    converter: false,
    installer: {
      $: "Script",
      url: "https://github.com/gildrb/eukhe/releases/latest/download/install.sh",
    },
  },
  {
    slug: "archetypon",
    formerSlugs: [],
    date: "2026-09-26",
    title: "Archetypon",
    name: "Archetypon",
    descriptor: "SVG asset converter",
    group: { $: "Projects", platform: "Browser" },
    links: [],
    aliases: ["archetypon.gildrb.com"],
    site: { $: "Built" },
    headline: "Archetypon: convert SVG to PNG, ICO, WebP, JPEG and PDF in your browser",
    description: "SVG export tool: interface and engine, in the browser.",
    repository: "https://github.com/gildrb/archetypon",
    category: "DesignApplication",
    operatingSystem: "Any",
    converter: true,
    installer: { $: "None" },
  },
  {
    slug: "porthmeus",
    formerSlugs: ["poros"],
    date: "2026-09-02",
    title: "Porthmeus",
    name: "Porthmeus",
    descriptor: "Remote dev servers",
    group: { $: "Projects", platform: "macOS, Linux" },
    links: [],
    aliases: ["porthmeus.com", "www.porthmeus.com", "porthmeus.gildrb.com", "poros.gildrb.com"],
    site: { $: "Built" },
    headline: "Porthmeus: open your server's dev server on your Mac or phone over Tailscale",
    description: "One command, one private HTTPS link to a dev server.",
    repository: "https://github.com/gildrb/porthmeus",
    category: "DeveloperApplication",
    operatingSystem: "macOS, Linux",
    converter: false,
    installer: {
      $: "Script",
      url: "https://github.com/gildrb/porthmeus/releases/latest/download/install.sh",
    },
  },
];

/** The products whose pages this site builds (`site: "Built"`). */
export const builtProducts = products.filter((product) => product.site.$ === "Built");

/** A product's page: `https://gildrb.com/<slug>` when built here, its own site's root if not. */
export function productUrl(product: Product): string {
  return product.site.$ === "Built" ? `${origin}/${product.slug}` : `${product.site.home}/`;
}

/** Projects that live elsewhere: their rows link out instead of to a case study. */
const externals: readonly External[] = [];

/**
 * `external`: the row leaves Gil's own pages (underlined title). Products with a site of their
 * own are his pages too, so they read as subpages (no underline). `slug`: its page's
 * `src/content/<slug>.md`, where it has one here; null for projects that live elsewhere.
 */
export type Project = Row & { href: string; external: boolean; slug: string | null };

/**
 * Homepage rows: Projects first, then Work, each newest first. Software Gil maintains comes
 * before client work and studies, whatever their dates.
 */
export const projects: readonly Project[] = [
  ...cases
    .filter((item) => item.listed)
    .map((item) => ({ ...item, href: `/${item.slug}`, external: false })),
  ...products.map((item) => ({
    ...item,
    href: item.site.$ === "Built" ? `/${item.slug}` : productUrl(item),
    external: false,
  })),
  ...externals.map((item) => ({ ...item, external: true, slug: null })),
].toSorted(
  (left, right) =>
    groupRank(left.group) - groupRank(right.group) || right.date.localeCompare(left.date),
);

function groupRank(group: Group): number {
  switch (group.$) {
    case "Projects":
      return 0;
    case "Work":
      return 1;
    default: {
      const _: never = group;
      return _;
    }
  }
}

export const slugs = cases.map((item) => item.slug);

/** Where people and agents find the API, MCP server and Markdown access. */
export const developers = {
  slug: "developers",
  name: "Developers",
  description: "Public read-only API, MCP server and Markdown access for gildrb.com.",
} as const;

/** Plain pages written in `src/content/<slug>.md`; `kind` is their schema.org page type. */
export const pages = [
  {
    slug: "about",
    name: "About",
    kind: "AboutPage",
    description: "About Gil Rodrigues (gildrb), a design engineer based in Germany.",
  },
  {
    slug: "contact",
    name: "Contact",
    kind: "ContactPage",
    description: "How to contact Gil Rodrigues (gildrb): email, Signal or X.",
  },
  {
    slug: "privacy",
    name: "Privacy",
    kind: "WebPage",
    description: "Privacy statement for gildrb.com: no cookies, analytics or tracking scripts.",
  },
  { ...developers, kind: "WebPage" },
] as const;

export type SortKey = "date" | "title";
export type SortDirection = "ascending" | "descending";

const collator = new Intl.Collator("en", { numeric: true, sensitivity: "base" });

/** Dates sort chronologically, newest first when "descending"; text sorts A–Z when "descending". */
export function compareRows(key: SortKey, direction: SortDirection) {
  const factor = (key === "date") === (direction === "descending") ? -1 : 1;
  return (left: Record<SortKey, string>, right: Record<SortKey, string>): number =>
    factor *
    (key === "date"
      ? left.date.localeCompare(right.date)
      : collator.compare(left[key], right[key]));
}
