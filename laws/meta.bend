# gildrb.com's laws: what search engines and link previews read of a page (R5, R6)
# ===============================================================================
#
# Each law is closed: it reads every page of S.Site.pages() (all of
# dist/**/*.html), or a file of S.Site.files(), as `vp build` ships it.
# The terms shared by every area are in base/page.bend; LAWS.bend lists
# the requirements.

import Base
import ./base/html/tokens.bend as H
import ./base/html/tree.bend as T
import ./base/html/refs.bend as R
import ./base/page.bend as Laws
import ../build/site.bend as S

# Terms: a page's URL (R5, A3)
# ----------------------------

def Url.root() -> String:
  "https://gildrb.com/"

# A3: the product pages and the host each is served on
# (worker/products.ts sites)
def Url.product(+path: String) -> Maybe<&2, String>:
  Bool.pick(Maybe<&2, String>, String.eq(path, "archetypon.html"), Some{"https://archetypon.gildrb.com/"}, Bool.pick(Maybe<&2, String>, String.eq(path, "porthmeus.html"), Some{"https://porthmeus.com/"}, None{}))

# a page of gildrb.com by its path: "index.html" -> "/", "D/index.html"
# -> "/D/" (Cloudflare Pages serves a folder's index at the folder),
# "P.html" -> "/P" (its pretty URL)
def Url.site(+path: String) -> String:
  Bool.pick(String, String.eq(path, "index.html") || String.ends_with(path, "/index.html"), String.append(Url.root(), String.reverse(String.drop(String.reverse(path), 10n))), Bool.pick(String, String.ends_with(path, ".html"), String.append(Url.root(), String.reverse(String.drop(String.reverse(path), 5n))), String.append(Url.root(), path)))

def Url.pick(m: Maybe<&2, String>, path: String) -> String:
  match m:
    case Some{u}:
      u
    case None{}:
      Url.site(path)

# the URL the page at path is served at: its canonical URL (R5)
def Url.of(+path: String) -> String:
  Url.pick(Url.product(path), path)

# the one page exempt from R5-R8
def Url.lost(path: String) -> Bool:
  String.eq(path, "404.html")

# Terms: the head (R5)
# --------------------

# a start tag a browser puts into the head while the body has not begun
def Head.keeps(n: H.Name) -> Bool:
  match n:
    case H.NHtml{}:
      True{}
    case H.NHead{}:
      True{}
    case H.NLink{}:
      True{}
    case H.NMeta{}:
      True{}
    case H.NTitle{}:
      True{}
    case H.NStyle{}:
      True{}
    case H.NScript{}:
      True{}
    case _:
      False{}

# an end tag that does not begin the body
def Head.shuts(n: H.Name) -> Bool:
  match n:
    case H.NHead{}:
      True{}
    case H.NTitle{}:
      True{}
    case H.NStyle{}:
      True{}
    case H.NScript{}:
      True{}
    case _:
      False{}

def Head.title(n: H.Name) -> Bool:
  match n:
    case H.NTitle{}:
      True{}
    case _:
      False{}

# xs when b, else nothing
def Head.cut(b: Bool, xs: List<&2, H.Tok>) -> List<&2, H.Tok>:
  match b:
    case True{}:
      xs
    case False{}:
      []

# the tokens before the body begins, in order: until a body start tag, any
# other start tag a browser does not put into the head, an end tag but
# head's, title's, style's and script's, or text that is not ASCII white
# space (title: the token before is a title start tag, so this text is the
# title's)
def Head.go(ts: List<&2, H.Tok>, title: Bool) -> List<&2, H.Tok>:
  match ts:
    case Nil{}:
      []
    case Con{H.TOpen{+n, a}, t}:
      Head.cut(Head.keeps(n), H.TOpen{n, a} <> Head.go(t, Head.title(n)))
    case Con{H.TShut{+n}, t}:
      Head.cut(Head.shuts(n), H.TShut{n} <> Head.go(t, False{}))
    case Con{H.TText{+s}, t}:
      Head.cut(title || H.Blank.is(s), H.TText{s} <> Head.go(t, False{}))

def Head.of(ts: List<&2, H.Tok>) -> List<&2, H.Tok>:
  Head.go(ts, False{})

# Terms: canonical links (R5)
# ---------------------------

# a rel value whose tokens (split at ASCII white space, ASCII lower case)
# include "canonical"
def Canon.rel(m: Maybe<&2, String>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{v}:
      Laws.Spec.member(Laws.Spec.words(Laws.Low.go(v)), "canonical")

def Canon.at(b: Bool, +attrs: List<&2, H.Attr>, rest: List<&2, Maybe<&2, String>>) -> List<&2, Maybe<&2, String>>:
  match b:
    case True{}:
      Laws.Spec.attr(H.KHref{}, attrs) <> rest
    case False{}:
      rest

# the href (None: none) of every link start tag whose rel includes
# canonical, in order
def Canon.hrefs(ts: List<&2, H.Tok>) -> List<&2, Maybe<&2, String>>:
  match ts:
    case Nil{}:
      []
    case Con{H.TOpen{H.NLink{}, +attrs}, t}:
      Canon.at(Canon.rel(Laws.Spec.attr(H.KRel{}, attrs)), attrs, Canon.hrefs(t))
    case Con{x, t}:
      Canon.hrefs(t)

# the list is one href, equal to url
def Canon.one(xs: List<&2, Maybe<&2, String>>, url: String) -> Bool:
  match xs:
    case Con{Some{v}, Nil{}}:
      String.eq(v, url)
    case _:
      False{}

# Terms: robots (R5)
# ------------------

def Attr.low(m: Maybe<&2, String>, s: String) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{v}:
      String.eq(Laws.Low.go(v), s)

# the tag's attribute key (the first), in ASCII lower case, is s
def Attr.is(+key: H.Key, attrs: List<&2, H.Attr>, s: String) -> Bool:
  Attr.low(Laws.Spec.attr(key, attrs), s)

# commas as spaces
def Comma.sp(s: String) -> String:
  match s:
    case SNil{}:
      SNil{}
    case SCon{Chr{44}, t}:
      SCon{Chr{32}, Comma.sp(t)}
    case SCon{c, t}:
      SCon{c, Comma.sp(t)}

# a robots content value whose directives (split at commas and ASCII
# white space, ASCII lower case) include "noindex"
def Noindex.val(m: Maybe<&2, String>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{v}:
      Laws.Spec.member(Laws.Spec.words(Comma.sp(Laws.Low.go(v))), "noindex")

# some meta start tag named robots (ASCII case-insensitive) says noindex
def Noindex.in(ts: List<&2, H.Tok>) -> Bool:
  match ts:
    case Nil{}:
      False{}
    case Con{H.TOpen{H.NMeta{}, +attrs}, t}:
      (Attr.is(H.KName{}, attrs, "robots") && Noindex.val(Laws.Spec.attr(H.KContent{}, attrs))) || Noindex.in(t)
    case Con{x, t}:
      Noindex.in(t)

# a list of robots directives (split at commas and ASCII white space,
# ASCII lower case) that keeps a page out of the index: it holds
# "noindex" or "none"
def Index.no(v: String) -> Bool:
  +ws = Laws.Spec.words(Comma.sp(Laws.Low.go(v)))
  Laws.Spec.member(ws, "noindex") || Laws.Spec.member(ws, "none")

def Index.val(m: Maybe<&2, String>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{v}:
      Index.no(v)

# a meta name for every crawler or Google's: robots or googlebot (ASCII
# case-insensitive, ASCII white space trimmed)
def Index.bot(m: Maybe<&2, String>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{v}:
      +n = Laws.Spec.trim(Laws.Low.go(v))
      String.eq(n, "robots") || String.eq(n, "googlebot")

# some meta start tag anywhere in the page, named robots or googlebot,
# keeps the page out of the index (Index.no of its content)
def Index.out(ts: List<&2, H.Tok>) -> Bool:
  match ts:
    case Nil{}:
      False{}
    case Con{H.TOpen{H.NMeta{}, +attrs}, t}:
      (Index.bot(Laws.Spec.attr(H.KName{}, attrs)) && Index.val(Laws.Spec.attr(H.KContent{}, attrs))) || Index.out(t)
    case Con{x, t}:
      Index.out(t)

# Terms: R5 on one page
# ---------------------

def Canon.pick(lost: Bool, +path: String, +ts: List<&2, H.Tok>) -> Bool:
  match lost:
    case True{}:
      Noindex.in(Head.of(ts))
    case False{}:
      Canon.one(Canon.hrefs(ts), Url.of(path)) && Canon.one(Canon.hrefs(Head.of(ts)), Url.of(path)) && Bool.not(Index.out(ts))

# 404.html: noindex in the head; any other page: one canonical link in
# the whole page, it is in the head, its href is the page's URL, and no
# meta robots or googlebot keeps it out of the index (Index.out)
def Canon.toks(+path: String, ts: List<&2, H.Tok>) -> Bool:
  Canon.pick(Url.lost(path), path, ts)

def Canon.of(path: String, m: Maybe<&2, List<&2, H.Tok>>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{ts}:
      Canon.toks(path, ts)

# R5 holds on every page of fs
def Canon.all(fs: List<&2, S.Out>) -> Bool:
  match fs:
    case Nil{}:
      True{}
    case Con{S.Out{p, text}, t}:
      Canon.of(p, T.Html.toks(text)) && Canon.all(t)

# Terms: titles, descriptions, Open Graph (R6)
# --------------------------------------------

# a value as a browser shows it: each run of blank characters
# (Laws.Wide.sp: ASCII white space, U+00A0, U+3000, ...) one space, ends
# trimmed
def Show.val(m: Maybe<&2, String>) -> Maybe<&2, String>:
  match m:
    case None{}:
      None{}
    case Some{v}:
      Some{Laws.Spec.shown(v)}

# text as a browser shows it: references decoded (refs.bend; None when
# one is refused), then as Show.val
def Show.text(s: String) -> Maybe<&2, String>:
  Show.val(R.Cr.dec(s))

# the token after a title start tag: its text, or none (an empty title)
def Title.next(ts: List<&2, H.Tok>) -> Maybe<&2, String>:
  match ts:
    case Con{H.TText{s}, t}:
      Some{s}
    case _:
      Some{""}

# the text of the first title element, as written (Some{""} when it is
# empty); None when there is none
def Title.go(ts: List<&2, H.Tok>) -> Maybe<&2, String>:
  match ts:
    case Nil{}:
      None{}
    case Con{H.TOpen{H.NTitle{}, a}, t}:
      Title.next(t)
    case Con{x, t}:
      Title.go(t)

def Title.shown(m: Maybe<&2, String>) -> Maybe<&2, String>:
  match m:
    case None{}:
      None{}
    case Some{s}:
      Show.text(s)

# the document's title as a browser shows it (Show.text)
def Title.of(ts: List<&2, H.Tok>) -> Maybe<&2, String>:
  Title.shown(Title.go(ts))

# the content of the first meta start tag named description (ASCII
# case-insensitive); Some{""} when it has no content; None when none
def Desc.of(ts: List<&2, H.Tok>) -> Maybe<&2, String>:
  match ts:
    case Nil{}:
      None{}
    case Con{H.TOpen{H.NMeta{}, +attrs}, t}:
      Bool.pick(Maybe<&2, String>, Attr.is(H.KName{}, attrs, "description"), Some{Maybe.default(&2, String, Laws.Spec.attr(H.KContent{}, attrs), "")}, Desc.of(t))
    case Con{x, t}:
      Desc.of(t)

def Og.at(b: Bool, +attrs: List<&2, H.Attr>, rest: List<&2, Maybe<&2, String>>) -> List<&2, Maybe<&2, String>>:
  match b:
    case True{}:
      Laws.Spec.attr(H.KContent{}, attrs) <> rest
    case False{}:
      rest

# the content (None: none) of every meta start tag whose property, in
# ASCII lower case, is p, in order
def Og.vals(ts: List<&2, H.Tok>, +p: String) -> List<&2, Maybe<&2, String>>:
  match ts:
    case Nil{}:
      []
    case Con{H.TOpen{H.NMeta{}, +attrs}, t}:
      Og.at(Attr.is(H.KProperty{}, attrs, p), attrs, Og.vals(t, p))
    case Con{x, t}:
      Og.vals(t, p)

# exactly one such tag, and its content is not blank (Laws.Spec.filled)
def Og.one(xs: List<&2, Maybe<&2, String>>) -> Bool:
  match xs:
    case Con{m, Nil{}}:
      Laws.Spec.filled(m)
    case _:
      False{}

# at least one such tag, and the content of each is url
def Og.all(xs: List<&2, Maybe<&2, String>>, +url: String) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{Some{v}, Nil{}}:
      String.eq(v, url)
    case Con{Some{v}, t}:
      String.eq(v, url) && Og.all(t, url)
    case Con{None{}, t}:
      False{}

# what R6 compares across pages: a page's title and description, as
# shown (Show.text, Show.val)
type Snip is Data:
  Snip{title: String, desc: String}

def Snip.if(b: Bool, title: Maybe<&2, String>, desc: Maybe<&2, String>) -> Maybe<&2, Snip>:
  match b title desc:
    case True{} Some{t} Some{d}:
      Some{Snip{t, d}}
    case _ _ _:
      None{}

# R6 on one indexable page: the title and description shown are not
# blank; og:title, og:description and og:image once each, not blank;
# og:url the page's URL. Some{its title and description} when it holds
def Snip.toks(+path: String, +ts: List<&2, H.Tok>) -> Maybe<&2, Snip>:
  +title = Title.of(ts)
  +desc = Show.val(Desc.of(ts))
  Snip.if(Laws.Spec.filled(title) && Laws.Spec.filled(desc) && Og.one(Og.vals(ts, "og:title")) && Og.one(Og.vals(ts, "og:description")) && Og.one(Og.vals(ts, "og:image")) && Og.all(Og.vals(ts, "og:url"), Url.of(path)), title, desc)

def Snip.page(path: String, m: Maybe<&2, List<&2, H.Tok>>) -> Maybe<&2, Snip>:
  match m:
    case None{}:
      None{}
    case Some{ts}:
      Snip.toks(path, ts)

def Snip.cons(m: Maybe<&2, Snip>, rest: Maybe<&2, List<&2, Snip>>) -> Maybe<&2, List<&2, Snip>>:
  match m rest:
    case Some{x} Some{xs}:
      Some{x <> xs}
    case _ _:
      None{}

def Snip.next(b: Bool, path: String, text: List<&2, String>, rest: Maybe<&2, List<&2, Snip>>) -> Maybe<&2, List<&2, Snip>>:
  match b:
    case True{}:
      rest
    case False{}:
      Snip.cons(Snip.page(path, T.Html.toks(text)), rest)

# the title and description of every indexable page of fs (all but
# 404.html), in order; None when R6 fails on one of them
def Snip.all(fs: List<&2, S.Out>) -> Maybe<&2, List<&2, Snip>>:
  match fs:
    case Nil{}:
      Some{[]}
    case Con{S.Out{+p, text}, t}:
      Snip.next(Url.lost(p), p, text, Snip.all(t))

# no string is in xs twice
def Distinct.is(xs: List<&2, String>) -> Bool:
  match xs:
    case Nil{}:
      True{}
    case Con{+x, +t}:
      Bool.not(Laws.Spec.member(t, x)) && Distinct.is(t)

def Snip.titles(xs: List<&2, Snip>) -> List<&2, String>:
  match xs:
    case Nil{}:
      []
    case Con{Snip{t, d}, r}:
      t <> Snip.titles(r)

def Snip.descs(xs: List<&2, Snip>) -> List<&2, String>:
  match xs:
    case Nil{}:
      []
    case Con{Snip{t, d}, r}:
      d <> Snip.descs(r)

# R6 holds on every indexable page, and no two have one title or one
# description
def Snip.ok(m: Maybe<&2, List<&2, Snip>>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{+xs}:
      Distinct.is(Snip.titles(xs)) && Distinct.is(Snip.descs(xs))

# Laws
# ----

# LAW canonical: every HTML page of the site but 404.html has exactly one
# link start tag whose rel tokens (split at ASCII white space) include
# "canonical" (ASCII case-insensitive); it comes before the body begins
# (Head.of: before a body start tag, a start tag a browser does not put
# in the head, or text that is not white space), and its href (the first,
# decoded) is exactly the page's URL (Url.of): index.html ->
# https://gildrb.com/, D/index.html -> https://gildrb.com/D/, P.html ->
# https://gildrb.com/P, and the product pages on their own host (A3):
# archetypon.html -> https://archetypon.gildrb.com/, porthmeus.html ->
# https://porthmeus.com/; and no meta start tag anywhere in the page
# whose name (ASCII case-insensitive, trimmed) is "robots" or "googlebot"
# has content whose directives (split at commas and ASCII white space,
# ASCII case-insensitive) include noindex or none (Index.out). 404.html
# has, before the body begins, a meta start tag whose name is "robots"
# (ASCII case-insensitive) and whose content's directives (split at
# commas and white space) include noindex (ASCII case-insensitive). A
# page the lexer refuses fails (base/html/). NOT checked: canonical links
# in other elements (a, area), a link's other attributes (hreflang,
# media), whether 404.html has a canonical link, meta names for other
# crawlers (bingbot, googlebot-news, ...), robots directives other than
# noindex and none (nofollow, unavailable_after), X-Robots-Tag headers
# (the law sitemap reads _headers). (R5)
law canonical:
  {Canon.all(S.Site.pages()) == True{} : Bool}

# LAW metadata: on every HTML page but 404.html: the first title element's
# text, references decoded (refs.bend), shown as Spec.shown (each run of
# blank characters, Laws.Wide.sp: ASCII white space, U+00A0, U+1680,
# U+2000-U+200B, U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF, one
# space; ends trimmed), is not blank; the content of the first meta named
# description (ASCII case-insensitive), shown the same way, is not blank;
# exactly one meta has property og:title, one og:description, one
# og:image (ASCII case-insensitive), each with a content that is not
# blank (Laws.Wide.blank); at least one meta has property og:url, and the
# content of each is exactly the page's URL (Url.of, which the law
# canonical makes its canonical href). No two of these pages have the
# same title, nor the same description, as shown (titles differing only
# in U+00A0 against a space are the same). A page the lexer refuses, or
# whose title has a reference refs.bend refuses, fails. NOT checked:
# where in the page these tags are, their length or wording, that
# og:image resolves (links law), twitter:* tags, a second meta
# description, other invisible characters (U+00AD, U+2060). (R6)
law metadata:
  {Snip.ok(Snip.all(S.Site.pages())) == True{} : Bool}
