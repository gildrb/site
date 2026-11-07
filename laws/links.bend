# gildrb.com's laws: internal links (R10)
# =======================================
#
# Each law is closed: it reads every page of S.Site.pages() (all of
# dist/**/*.html), or the text files of S.Site.files(), as `vp build`
# ships them, and S.Site.paths() (every file in dist/). The terms shared
# by every area are in base/page.bend; LAWS.bend lists the requirements.
#
# A URL with a scheme, or beginning with "//", must be in canonical form,
# else the file fails: "https://", "http://" (the scheme in lower case)
# or "//", then a host of a-z, 0-9, "-" and "." only (not empty, no
# trailing "."; so no upper case, userinfo "@", port ":" or "%"), then
# the end, "/", "?" or "#". "http:" or "https:" in any other case or
# without "//" (as "https:/x") fails too. Any other scheme (mailto:,
# tel:, data:, javascript:, ...) is another site, as is a canonical URL
# on any host but gildrb.com, and is not checked.
#
# A reference is internal when it is root-relative ("/x", not "//x"), a
# canonical URL on the host gildrb.com exactly, or relative (no scheme,
# not "//"; resolved against the directory of the file it is in; "",
# "#f" and "?q" are the file itself).
# Its key is its path without the leading "/", the query and the
# fragment, dot segments removed (RFC 3986). A key is served (R10) as
# Cloudflare Pages resolves its path: a function route (A4; Pages applies
# no redirect to a function); else, when "/" + key is exactly the source
# of a rule of _redirects (the first such; status none, 200, 301, 302,
# 303, 307 or 308), as that rule's target, in a chain no longer than the
# rules (redirects come before files: "Redirects are always followed,
# regardless of whether or not an asset matches"); else a file of dist/
# other than _headers, _redirects and _routes.json, which Pages does not
# serve (S.Site.paths, sorted: the keys are sorted and merged with it,
# links/serve.bend), key.html as a page, or, when the key is "" or ends
# in "/", key + "index.html" as a page (so "/" is index.html;
# S.Site.pages is every .html file of dist/, A6). A _redirects rule whose
# source is a path with "*" or ":name" fails every file (it could match a
# reference); "https://www.gildrb.com/*" matches only the host
# www.gildrb.com, never a reference on gildrb.com.

import Base
import ./base/html/tokens.bend as H
import ./base/html/tree.bend as T
import ./base/page.bend as Laws
import ../build/site.bend as S
import ./links/url.bend as U
import ./links/refs.bend as R
import ./links/serve.bend as V

# Terms: R10 on one file
# ----------------------

# every reference of the file at self is served (with the rules of
# _redirects, read once: V.LRd), and its fragment holds
def Links.at(d: V.LRd, +self: String, +rs: List<&2, U.LRef>, +ids: List<&2, String>) -> Bool:
  match d:
    case V.LkRd{+rules, wild}:
      V.Served.with(rules, wild, U.Ref.keys(rs)) && V.Frag.all(rules, self, ids, rs)

def Links.ok(+self: String, +rs: List<&2, U.LRef>, +ids: List<&2, String>) -> Bool:
  Links.at(V.Rd.of(), self, rs, ids)

# R10 on the references of half h of the start tags of the page at path
# (R.Tags.half: the two halves hold every start tag, and so every
# reference, of the page); the ids are those of the whole page
def Html.toks(h: R.LHalf, +path: String, m: Maybe<&2, List<&2, H.Tok>>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{+ts}:
      Links.ok(path, R.Refs.html(path, R.Tags.half(h, ts)), Laws.Spec.ids(ts))

# R10 on half h of every page of fs
def Html.half(+h: R.LHalf, fs: List<&2, S.Out>) -> Bool:
  match fs:
    case Nil{}:
      True{}
    case Con{S.Out{p, text}, t}:
      Html.toks(h, p, T.Html.toks(text)) && Html.half(h, t)

# R10 on every page of fs: on both halves of each (a proof computes them
# apart; one page's references in one def ran out of fuel)
def Html.all(+fs: List<&2, S.Out>) -> Bool:
  Html.half(R.LkEv{}, fs) && Html.half(R.LkOd{}, fs)

def Text.file(+path: String, cs: List<&2, String>) -> Bool:
  Links.ok(path, U.Ref.many(path, R.Txt.urls(R.Txt.kind(path), Laws.Spec.cat(cs)), []), [])

# R10 on every text file of fs
def Text.all(fs: List<&2, S.Out>) -> Bool:
  match fs:
    case Nil{}:
      True{}
    case Con{S.Out{p, text}, t}:
      Text.file(p, text) && Text.all(t)

# Laws
# ----

# LAW links_html: on every HTML page of the site, every internal reference
# (header) of an href, src or poster attribute of any element, of each URL
# of a srcset (as the HTML standard splits it) and of the content of a
# meta tag whose property is og:image or og:url (ASCII case-insensitive),
# values trimmed and references decoded (base/html/), is served (header),
# and its fragment, when not empty and the reference is served from an
# HTML page (directly, as P.html or a folder's index.html, or through
# _redirects), is the value of an id attribute on that page; and every
# such value that is a URL with a scheme or "//" is in canonical form
# (header). A page the lexer refuses fails (base/html/), so does one
# with a <base> element (banned there). NOT checked: references in
# attributes the lexer drops (action, data, xlink:href, ...), in scripts,
# CSS, JSON, <meta http-equiv=refresh> or other meta tags; percent-
# encoding and case of paths (keys are compared as written);
# www.gildrb.com (another host); Pages features beyond the header's
# resolution (its own .html and trailing-slash redirects, _headers,
# _routes.json contents); links to other hosts and other schemes.
# (R10, A4)
# waive L4-examples-only: the laws read one build, Site.paths is the list of its files, and the site takes no input; these laws check every path the build has.
law links_html:
  {Html.all(S.Site.pages()) == True{} : Bool}

# LAW links_text: in llms.txt, llms-full.txt, .well-known/llms.txt,
# index.html.md and content/*.md, every inline markdown link target (the
# text after "](" up to ")" or white space), every reference-style
# definition's target (a line of up to 3 spaces, "[label]:", spaces or
# tabs, then the target up to white space or the end) and every bare
# "http://" or "https://" URL, in any case, whose authority is
# gildrb.com in any case, with or without userinfo, a port or trailing
# dots (each occurrence, to white space or one of )>"'` , trailing .,;:!?
# dropped), and in sitemap.xml the text after each "<loc>" up to "<",
# trimmed, is in canonical form when it is a URL with a scheme or "//"
# (header), and when it is an internal reference (header; relative ones
# against the file's folder), is served (header), and its fragment, when
# not empty and the reference is served from an HTML page, is the value
# of an id attribute on that page. Angle-bracket targets ("](<y>)",
# "[x]: <y>") are read with their brackets, so they fail. NOT checked:
# a definition whose label spans lines or whose target is on the next
# line, entities in sitemap.xml, other text files (robots.txt, feed.xml,
# *.json), bare URLs on other hosts, and percent-encoding. (R10, A4)
law links_text:
  {Text.all(S.Site.files()) == True{} : Bool}
