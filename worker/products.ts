import { origin, type Product, productUrl, products } from "../src/site.ts";

/**
 * Redirects each product's alias hosts (`Product.aliases`) to its page. A built product lives at
 * `gildrb.com/<slug>`: `/install` goes to `gildrb.com/<slug>/install` (old install commands keep
 * working), any other path to the page. A product with a site of its own keeps the path.
 */
const sites = new Map(
  products.flatMap((product) =>
    product.aliases.map((alias): [string, Product] => [alias, product]),
  ),
);

function target(product: Product, url: URL): string {
  switch (product.site.$) {
    case "Built":
      return url.pathname === "/install"
        ? `${origin}/${product.slug}/install`
        : productUrl(product);
    case "Own":
      return `${product.site.home}${url.pathname}${url.search}`;
    default: {
      const _: never = product.site;
      return _;
    }
  }
}

export default {
  fetch(request) {
    const url = new URL(request.url);
    const product = sites.get(url.hostname);
    if (product === undefined) return new Response("Not Found", { status: 404 });
    return Response.redirect(target(product, url), 301);
  },
} satisfies ExportedHandler;
