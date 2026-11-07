# gildrb.com: the laws
# ====================
#
# Each law is a claim about the site as `vp build` ships it: the bytes of
# dist/, which scripts/site.py writes into build/site.bend (S.Site.pages:
# every HTML page; S.Site.files: the other files the laws read;
# S.Site.paths: the path of every file). A page is read as a browser reads
# it (laws/base/html/). PROOF.bend proves every law; `npm run laws`
# (`bend PROOF.bend`) is the gate, `npm run laws:verdict` the optional,
# much slower recheck by the Lean-proven kernel.
#
# Requirements
#
# R1 Homepage text in raw HTML (no JS): at least 500 characters and at least 5% of the body markup, the bytes from "<body" to the end including script content (A1). Text: tags, comments, declarations and the content of style, script, title and textarea left out; a character reference counts as one space; white space runs collapsed; ends trimmed.
# R2 The homepage's text is shown (home_shown).
# R3 Every HTML page: exactly one h1; the first heading is the h1; heading levels never skip going deeper (h_n then h_m requires m <= n+1).
# R4 Every HTML page: the <html> start tag has a non-blank lang. Blank (R4, R6, R7): only ASCII white space, U+00A0, U+1680, U+2000-U+200B, U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF (JavaScript's trim() and a zero width space), judged after character references are decoded.
# R5 Every HTML page has exactly one <link rel=canonical> (rel token, ASCII case-insensitive), in the head, whose href is the page's URL: index.html -> https://gildrb.com/, <slug>.html -> https://gildrb.com/<slug>, except the product pages on their own host (A3): archetypon.html -> https://archetypon.gildrb.com/, porthmeus.html -> https://porthmeus.com/. Every page but 404.html is indexable: no <meta name=robots> or <meta name=googlebot> (name ASCII case-insensitive) anywhere in it has a content whose directives (comma- or white-space-separated, case-insensitive) include noindex or none, and dist/_headers gives none of its paths (/, /slug, /slug.html) an X-Robots-Tag with noindex or none. 404.html is exempt from R5-R7 but carries <meta name=robots> whose content includes noindex.
# R6 Every indexable page (all but 404.html): a non-blank <title>; a non-blank <meta name=description>; og:title, og:description, og:image (meta property=...) non-blank, each exactly once; og:url equal to the canonical href. Titles pairwise distinct across pages; descriptions pairwise distinct; both compared as shown (each run of blank characters one space, ends trimmed).
# R7 Accessible controls: every img has an alt attribute (empty allowed: decorative); every a with an href and every button has an accessible name: non-blank text inside, an img with non-empty alt inside, a non-blank aria-label, an aria-labelledby naming an id on the page, or a title (blank as in R4); a reference that cannot be decoded in a control's text fails. Content with hidden or aria-hidden="true" names nothing; an a with an href or a button that has aria-hidden="true", or is inside an element that has it, fails.
# R8 sitemap.xml: its <loc> values are exactly the canonical hrefs of the indexable pages (R5) whose host is gildrb.com, each once (order free); the file has the plain shape: an XML declaration only at the start, no other processing instruction, no "<!", no "&", no prefixed tag, loc only as unprefixed <loc>...</loc> without attributes.
# R9 robots.txt has the line "Sitemap: https://gildrb.com/sitemap.xml" exactly once, and every line is printable ASCII and one of: empty, a comment, "User-agent: <token>", "Allow: /", "Content-Signal: <value>", that Sitemap line (so no Disallow line at all).
# R10 No dead internal links: every internal reference (HTML href, src, poster, srcset URLs, og:image/og:url content; markdown link targets and bare https://gildrb.com/ URLs in llms.txt, llms-full.txt, .well-known/llms.txt, index.html.md, content/*.md; sitemap.xml <loc>) resolves to a file in dist/, "/" with index.html, P.html, P/ with Pindex.html, a non-splat _redirects source whose target resolves, or a function route (A4); a fragment on a link to an HTML page is empty or an id on that page.
# R11 /.well-known/poppy.json declares the public website of this domain and nothing it does not serve: {protocol_version: "0.1", organization: {name: "Gil Rodrigues", domain: <the site's host>}, web: {}}; the site's host is the host of the homepage's one canonical URL.
#
# Assumptions
#
# A1 is-agentic's content ratio is text / bytes from "<body" to the end including scripts (inferred: its 2026-10-23 scan reported 1261 characters at 4.5%, the homepage body then about 28 KB).
# A2 HTML the lexer cannot read as a browser does, or whose tags a browser would build into another tree (moving, cloning or dropping an element; laws/base/html/), is a bug: every law that reads that page fails.
# A3 Product pages and their hosts (worker/products.ts sites): archetypon.html <-> archetypon.gildrb.com, porthmeus.html <-> porthmeus.com; a fixture in the laws, worker/products.ts trusted to match.
# A4 Paths served by functions/ (trusted, not proven): /mcp, /mcp/server-card, /.well-known/mcp, /api, /api/v1, /api/profile, /api/v1/profile, /api/status, /api/v1/status.
# A5 Pages are read as UTF-8 (the host sends text/html; charset=utf-8). Scripts are not run. CSS is not read: text hidden by CSS counts as shown.
# A6 scripts/site.py copies dist/ faithfully; the Bend compiler and checker are trusted.

import Base
import ./laws/home/text.bend as HomeText
import ./laws/pages.bend as PagesLaws
import ./laws/agents.bend as AgentsLaws
import ./laws/a11y.bend as A11yLaws
import ./laws/meta.bend as MetaLaws
import ./laws/crawl.bend as CrawlLaws
import ./laws/links.bend as LinksLaws
