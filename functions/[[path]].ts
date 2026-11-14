import { builtProducts, origin, pages, productUrl, products, slugs } from "../src/site.ts";
import {
  apiHeaders,
  canonicalHost,
  type Env,
  markdownNotFound,
  problem,
  wantsMarkdown,
} from "./_lib.ts";

/** Pages that can also be served as Markdown through `Accept: text/markdown`. */
const markdown = new Map([
  ["/", "/index.html.md"],
  ["/all", "/llms-full.txt"],
  ...[...slugs, ...pages.map(({ slug }) => slug), ...builtProducts.map(({ slug }) => slug)].map(
    (slug): [string, string] => [`/${slug}`, `/content/${slug}.md`],
  ),
]);

/**
 * Old product paths on gildrb.com: a built product's former slugs redirect to its page here, and
 * a product with a site of its own (`site: "Own"`) is linked and redirected there.
 */
const productMoves = new Map(
  products.flatMap((product): [string, string][] =>
    (product.site.$ === "Built" ? product.formerSlugs : [product.slug, ...product.formerSlugs])
      .flatMap((name) => [`/${name}`, `/${name}/`, `/${name}.html`, `/${name}/install`])
      .map((path): [string, string] => [
        path,
        product.site.$ === "Built" && path.endsWith("/install")
          ? `${productUrl(product)}/install`
          : productUrl(product),
      ]),
  ),
);

/**
 * Installers behind built product pages: `/<slug>/install` always, and `/<slug>` for clients
 * that ask for neither HTML nor Markdown, as `curl … | sh` does.
 */
const installers = new Map(
  builtProducts.flatMap(({ slug, installer }): [string, string][] =>
    installer.$ === "Script" ? [[`/${slug}`, installer.url]] : [],
  ),
);
const siteHost = new URL(origin).hostname;

const aliases = new Map([
  ["/api/profile", "/profile.json"],
  ["/api/v1/profile", "/profile.json"],
  ["/mcp/server-card", "/.well-known/mcp/server-card.json"],
  ["/.well-known/mcp", "/.well-known/mcp.json"],
]);

const apiIndex = {
  name: "gildrb.com public API",
  version: "v1",
  documentation: "https://gildrb.com/api-docs.md",
  openapi: "https://gildrb.com/openapi.json",
  developers: "https://gildrb.com/developers",
  endpoints: [
    {
      path: "/api/v1/profile",
      method: "GET",
      description: "Canonical JSON-LD profile and portfolio graph.",
      alias: "/api/profile",
    },
    {
      path: "/api/v1/status",
      method: "GET",
      description: "Service liveness probe.",
      alias: "/api/status",
    },
  ],
  mcp: { transport: "https://gildrb.com/mcp", manifest: "https://gildrb.com/.well-known/mcp" },
};

/** Extra response headers for a path, applied on top of the static asset's own. */
const overrides: Record<string, Record<string, string>> = {
  "/api/profile": {
    ...apiHeaders,
    Deprecation: "version=v1",
    Sunset: "Sun, 01 Aug 2027 00:00:00 GMT",
    "Sunset-Context":
      "Unversioned alias of /api/v1/profile; prefer the versioned path. Policy: https://gildrb.com/api-docs.md#versioning",
    "Content-Type": "application/ld+json; charset=utf-8",
  },
  "/api/v1/profile": { ...apiHeaders, "Content-Type": "application/ld+json; charset=utf-8" },
  "/mcp/server-card": {
    "Access-Control-Allow-Origin": "*",
    "Cache-Control": "public, max-age=3600",
    "Content-Type": "application/mcp-server-card+json; charset=utf-8",
  },
};

function withHeaders(response: Response, headers: Record<string, string>): Response {
  const next = new Response(response.body, response);
  for (const [name, value] of Object.entries(headers)) next.headers.set(name, value);
  return next;
}

export const onRequest: PagesFunction<Env> = async ({ env, request, next }) => {
  const redirect = canonicalHost(request);
  if (redirect) return redirect;
  const url = new URL(request.url);
  const { pathname } = url;
  const moved = url.hostname === siteHost ? productMoves.get(pathname) : undefined;
  if (moved) return Response.redirect(moved, 301);
  const installer =
    url.hostname === siteHost ? installers.get(pathname.replace(/\/install$/, "")) : undefined;
  if (installer) {
    // A browser asks for HTML and an agent for Markdown, and both get the page.
    const accept = request.headers.get("Accept") ?? "";
    const page = accept.includes("text/html") || accept.includes("text/markdown");
    if (pathname.endsWith("/install") || !page)
      return new Response(null, { status: 302, headers: { Location: installer, Vary: "Accept" } });
  }
  // Only Markdown negotiation, aliases and the API need the work below.
  const plain =
    !wantsMarkdown(request) &&
    !aliases.has(pathname) &&
    !(pathname in overrides) &&
    !pathname.startsWith("/api");
  if (plain) return next();
  if (pathname === "/api" || pathname === "/api/v1") {
    return Response.json(apiIndex, {
      headers: {
        ...apiHeaders,
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff",
      },
    });
  }
  // Pages answers `/filen/` with the HTML page; send Markdown clients where HTML clients go.
  const slashless = pathname.length > 1 ? pathname.replace(/\/$/, "") : pathname;
  if (wantsMarkdown(request) && slashless !== pathname && markdown.has(slashless)) {
    return new Response(null, {
      status: 308,
      headers: { Location: `${slashless}${url.search}`, Vary: "Accept" },
    });
  }
  const source = wantsMarkdown(request) ? markdown.get(pathname) : undefined;
  url.pathname = source ?? aliases.get(pathname) ?? pathname;
  url.search = "";
  const response = await env.ASSETS.fetch(
    new Request(url, { method: request.method, headers: request.headers }),
  );
  const api = pathname.startsWith("/api/");
  if (api && response.status === 404) {
    return problem(
      404,
      "Not Found",
      "Unknown API resource. See https://gildrb.com/api-docs.md for available endpoints.",
      {
        instance: pathname,
        headers: apiHeaders,
      },
    );
  }
  if (source)
    return withHeaders(response, {
      "Content-Type": "text/markdown; charset=utf-8",
      Vary: "Accept",
    });
  if (response.status === 404 && wantsMarkdown(request) && !api && request.method !== "HEAD")
    return markdownNotFound();
  const extra = overrides[pathname];
  return extra ? withHeaders(response, extra) : response;
};
