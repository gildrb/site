# gildrb.com's laws: what crawlers read besides the pages (R8, R9)
# =================================================================
#
# Each law is closed: it reads a file of S.Site.files() and the page
# paths, as `vp build` ships them. The page terms it shares (a page's URL,
# robots directives) are in meta.bend; the terms shared by every area are
# in base/page.bend; LAWS.bend lists the requirements.

import Base
import ./base/page.bend as Laws
import ./meta.bend as Meta

# Terms: the sitemap (R8)
# -----------------------

# the sitemap reader's state; loc: inside a loc element, its text so far
# (reversed); name: a tag's name so far (reversed); slash: the tag's last
# character was "/"; q: the quote an attribute value ends at; SxDecl: in
# the XML declaration, q: its last character was "?"
type Sx is Data:
  SxText{loc: Maybe<&2, String>}
  SxLt{loc: Maybe<&2, String>}
  SxName{loc: Maybe<&2, String>, shut: Bool, name: String}
  SxTag{loc: Maybe<&2, String>, shut: Bool, name: String, slash: Bool}
  SxQ{loc: Maybe<&2, String>, shut: Bool, name: String, q: U32}
  SxDecl{q: Bool}
  SxBad{}

# the state and the loc values so far (reversed)
type Sxr is Data:
  Sxr{st: Sx, locs: List<&2, String>}

# a tag ends: a loc start tag opens a value, its end tag closes it; any
# tag inside a loc, or a stray </loc>, is refused
def Sx.tag(loc: Maybe<&2, String>, shut: Bool, self: Bool, isloc: Bool, locs: List<&2, String>) -> Sxr:
  match loc shut self isloc:
    case None{} False{} False{} True{}:
      Sxr{SxText{Some{SNil{}}}, locs}
    case None{} s e False{}:
      Sxr{SxText{None{}}, locs}
    case Some{v} True{} False{} True{}:
      Sxr{SxText{None{}}, String.reverse(v) <> locs}
    case _ _ _ _:
      Sxr{SxBad{}, []}

def Sx.add(c: Char, loc: Maybe<&2, String>, locs: List<&2, String>) -> Sxr:
  match loc:
    case Some{v}:
      Sxr{SxText{Some{SCon{c, v}}}, locs}
    case None{}:
      Sxr{SxText{None{}}, locs}

def Sx.text(c: Char, loc: Maybe<&2, String>, locs: List<&2, String>) -> Sxr:
  match c:
    case Chr{60}:
      Sxr{SxLt{loc}, locs}
    case Chr{38}:
      Sxr{SxBad{}, []}
    case c:
      Sx.add(c, loc, locs)

def Sx.lt(c: Char, loc: Maybe<&2, String>, locs: List<&2, String>) -> Sxr:
  match c:
    case Chr{47}:
      Sxr{SxName{loc, True{}, SNil{}}, locs}
    case Chr{63}:
      Sxr{SxBad{}, []}
    case Chr{33}:
      Sxr{SxBad{}, []}
    case Chr{62}:
      Sxr{SxBad{}, []}
    case c:
      Sxr{SxName{loc, False{}, SCon{c, SNil{}}}, locs}

# a loc tag's name ends at anything but ">": an attribute, white space or
# "/" in a loc tag is refused
def Sx.cut(b: Bool, r: Sxr) -> Sxr:
  match b:
    case True{}:
      Sxr{SxBad{}, []}
    case False{}:
      r

def Sx.name(c: Char, loc: Maybe<&2, String>, shut: Bool, +name: String, locs: List<&2, String>) -> Sxr:
  match c:
    case Chr{62}:
      Sx.tag(loc, shut, False{}, String.eq(name, "col"), locs)
    case Chr{47}:
      Sx.cut(String.eq(name, "col"), Sxr{SxTag{loc, shut, name, True{}}, locs})
    case Chr{32}:
      Sx.cut(String.eq(name, "col"), Sxr{SxTag{loc, shut, name, False{}}, locs})
    case Chr{9}:
      Sx.cut(String.eq(name, "col"), Sxr{SxTag{loc, shut, name, False{}}, locs})
    case Chr{10}:
      Sx.cut(String.eq(name, "col"), Sxr{SxTag{loc, shut, name, False{}}, locs})
    case Chr{13}:
      Sx.cut(String.eq(name, "col"), Sxr{SxTag{loc, shut, name, False{}}, locs})
    case Chr{38}:
      Sxr{SxBad{}, []}
    case Chr{60}:
      Sxr{SxBad{}, []}
    case Chr{58}:
      Sxr{SxBad{}, []}
    case c:
      Sxr{SxName{loc, shut, SCon{c, name}}, locs}

def Sx.inner(c: Char, loc: Maybe<&2, String>, shut: Bool, +name: String, slash: Bool, locs: List<&2, String>) -> Sxr:
  match c:
    case Chr{62}:
      Sx.tag(loc, shut, slash, String.eq(name, "col"), locs)
    case Chr{47}:
      Sxr{SxTag{loc, shut, name, True{}}, locs}
    case Chr{34}:
      Sxr{SxQ{loc, shut, name, 34}, locs}
    case Chr{39}:
      Sxr{SxQ{loc, shut, name, 39}, locs}
    case Chr{38}:
      Sxr{SxBad{}, []}
    case Chr{60}:
      Sxr{SxBad{}, []}
    case c:
      Sxr{SxTag{loc, shut, name, False{}}, locs}

def Sx.quote(b: Bool, loc: Maybe<&2, String>, shut: Bool, name: String, +q: U32, locs: List<&2, String>) -> Sxr:
  match b:
    case True{}:
      Sxr{SxTag{loc, shut, name, False{}}, locs}
    case False{}:
      Sxr{SxQ{loc, shut, name, q}, locs}

def Sx.q(c: Char, loc: Maybe<&2, String>, shut: Bool, name: String, +q: U32, locs: List<&2, String>) -> Sxr:
  match c:
    case Chr{38}:
      Sxr{SxBad{}, []}
    case Chr{60}:
      Sxr{SxBad{}, []}
    case Chr{x}:
      Sx.quote(U32.is_eq(x, q), loc, shut, name, q, locs)

# in the XML declaration: "?>" ends it; "<", ">" (not after "?") and "&"
# are refused
def Sx.decl(c: Char, q: Bool, locs: List<&2, String>) -> Sxr:
  match c q:
    case Chr{63} q:
      Sxr{SxDecl{True{}}, locs}
    case Chr{62} True{}:
      Sxr{SxText{None{}}, locs}
    case Chr{62} False{}:
      Sxr{SxBad{}, []}
    case Chr{60} q:
      Sxr{SxBad{}, []}
    case Chr{38} q:
      Sxr{SxBad{}, []}
    case c q:
      Sxr{SxDecl{False{}}, locs}

def Sx.step(c: Char, r: Sxr) -> Sxr:
  match r:
    case Sxr{SxText{loc}, locs}:
      Sx.text(c, loc, locs)
    case Sxr{SxLt{loc}, locs}:
      Sx.lt(c, loc, locs)
    case Sxr{SxName{loc, shut, name}, locs}:
      Sx.name(c, loc, shut, name, locs)
    case Sxr{SxTag{loc, shut, name, slash}, locs}:
      Sx.inner(c, loc, shut, name, slash, locs)
    case Sxr{SxQ{loc, shut, name, q}, locs}:
      Sx.q(c, loc, shut, name, q, locs)
    case Sxr{SxDecl{q}, locs}:
      Sx.decl(c, q, locs)
    case Sxr{SxBad{}, locs}:
      Sxr{SxBad{}, []}

def Sx.go(s: String, r: Sxr) -> Sxr:
  match s:
    case SNil{}:
      r
    case SCon{c, t}:
      Sx.go(t, Sx.step(c, r))

def Sx.fin(r: Sxr) -> Maybe<&2, List<&2, String>>:
  match r:
    case Sxr{SxText{None{}}, locs}:
      Some{List.reverse(&2, String, locs)}
    case _:
      None{}

# "<?xml" begins the file and white space follows it: an XML declaration
def Decl.sp(s: String) -> Bool:
  match s:
    case SCon{Chr{32}, t}:
      True{}
    case SCon{Chr{9}, t}:
      True{}
    case SCon{Chr{10}, t}:
      True{}
    case SCon{Chr{13}, t}:
      True{}
    case _:
      False{}

# the file read from its start; an XML declaration ("<?xml" and white
# space) is read from after "<?xml" in SxDecl, up to "?>"
def Decl.start(b: Bool, +s: String) -> Sxr:
  match b:
    case True{}:
      Sx.go(String.drop(s, 5n), Sxr{SxDecl{False{}}, []})
    case False{}:
      Sx.go(s, Sxr{SxText{None{}}, []})

def Decl.of(+s: String) -> Sxr:
  Decl.start(Laws.Spec.starts("<?xml", s) && Decl.sp(String.drop(s, 5n)), s)

# the text of every loc element of a sitemap, as written, in order. None
# when the file is missing or read another way by an XML reader than by
# this one, or not in the plain shape: after an optional XML declaration
# at the very start, any other "<?" (processing instruction), a "&" (a
# reference), "<!" (comment, CDATA, doctype), a prefixed tag name ("x:"),
# a loc tag that is not exactly "<loc>" or "</loc>" (attributes, white
# space, "<loc/>"), a tag inside a loc, a stray </loc>, or a file that
# ends inside a tag or loc
def Sitemap.locs(m: Maybe<&2, List<&2, String>>) -> Maybe<&2, List<&2, String>>:
  match m:
    case None{}:
      None{}
    case Some{cs}:
      Sx.fin(Decl.of(Laws.Spec.cat(cs)))

def Sitemap.at(b: Bool, url: String, rest: List<&2, String>) -> List<&2, String>:
  match b:
    case True{}:
      url <> rest
    case False{}:
      rest

# the URL (Url.of) of every indexable page
def Sitemap.urls(ps: List<&2, String>) -> List<&2, String>:
  match ps:
    case Nil{}:
      []
    case Con{+p, t}:
      Sitemap.at(Bool.not(Meta.Url.lost(p)), Meta.Url.of(p), Sitemap.urls(t))

# every x of xs is in ys
def Each.in(xs: List<&2, String>, +ys: List<&2, String>) -> Bool:
  match xs:
    case Nil{}:
      True{}
    case Con{x, t}:
      Laws.Spec.member(ys, x) && Each.in(t, ys)

# every y of ys is in xs exactly once
def Each.once(ys: List<&2, String>, +xs: List<&2, String>) -> Bool:
  match ys:
    case Nil{}:
      True{}
    case Con{y, t}:
      Nat.is_eq(Laws.Spec.count(xs, y), 1n) && Each.once(t, xs)

# the locs are the urls, each once
def Sitemap.ok(m: Maybe<&2, List<&2, String>>, +urls: List<&2, String>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{+locs}:
      Each.in(locs, urls) && Each.once(urls, locs)

# Terms: robots.txt (R9)
# ----------------------

# s split into lines at CR and LF
def Lines.go(s: String, line: String, acc: List<&2, String>) -> List<&2, String>:
  match s:
    case SNil{}:
      List.reverse(&2, String, String.reverse(line) <> acc)
    case SCon{Chr{10}, t}:
      Lines.go(t, SNil{}, String.reverse(line) <> acc)
    case SCon{Chr{13}, t}:
      Lines.go(t, SNil{}, String.reverse(line) <> acc)
    case SCon{c, t}:
      Lines.go(t, SCon{c, line}, acc)

def Lines.of(m: Maybe<&2, List<&2, String>>) -> Maybe<&2, List<&2, String>>:
  match m:
    case None{}:
      None{}
    case Some{cs}:
      Some{Lines.go(Laws.Spec.cat(cs), SNil{}, [])}

# printable ASCII only (U+0020-U+007E): no tab, form feed, BOM or other
# character a robots parser may trim or split a line at
def Rb.print(s: String) -> Bool:
  match s:
    case SNil{}:
      True{}
    case SCon{Chr{+x}, t}:
      U32.is_lt(31, x) && U32.is_lt(x, 127) && Rb.print(t)

# the rest of a value: no "#", and no space unless sp
def Rb.rest(s: String, +sp: Bool) -> Bool:
  match s:
    case SNil{}:
      True{}
    case SCon{Chr{+x}, t}:
      Bool.not(U32.is_eq(x, 35)) && (sp || Bool.not(U32.is_eq(x, 32))) && Rb.rest(t, sp)

# a field value: not empty, no space first, no "#"
def Rb.val(s: String, sp: Bool) -> Bool:
  match s:
    case SNil{}:
      False{}
    case SCon{Chr{+x}, t}:
      Bool.not(U32.is_eq(x, 32)) && Bool.not(U32.is_eq(x, 35)) && Rb.rest(t, sp)

# line s, after field pre, has a value (sp: it may hold spaces)
def Rb.field(pre: String, +s: String, +n: Nat, sp: Bool) -> Bool:
  Laws.Spec.starts(pre, s) && Rb.val(String.drop(s, n), sp)

def Robots.sitemap() -> String:
  "Sitemap: https://gildrb.com/sitemap.xml"

# a line of the shape the site writes: empty; a comment ("#" first);
# "User-agent: " and a token (no space, no "#"); exactly "Allow: /";
# "Content-Signal: " and a value (no "#", no space first); exactly the
# Sitemap line. Field names case as written, one space after the colon,
# printable ASCII only
def Rb.line(+s: String) -> Bool:
  Rb.print(s) && (String.eq(s, "") || Laws.Spec.starts("#", s) || String.eq(s, "Allow: /") || String.eq(s, Robots.sitemap()) || Rb.field("User-agent: ", s, 12n, False{}) || Rb.field("Content-Signal: ", s, 16n, True{}))

def Rb.all(ls: List<&2, String>) -> Bool:
  match ls:
    case Nil{}:
      True{}
    case Con{l, t}:
      Rb.line(l) && Rb.all(t)

def Robots.ok(m: Maybe<&2, List<&2, String>>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{+ls}:
      Nat.is_eq(Laws.Spec.count(ls, Robots.sitemap()), 1n) && Rb.all(ls)

# Terms: _headers (R5, R8)
# ------------------------
#
# Cloudflare Pages' _headers: a line not indented (and not a "#" comment)
# is a rule's path; the indented lines after it are its headers ("Name:
# value", or "! Name", which removes a header and adds none).

# s up to the first character stop (all of s when it has none)
def Hx.upto(s: String, +stop: U32) -> String:
  match s:
    case SNil{}:
      SNil{}
    case SCon{Chr{+x}, t}:
      Bool.pick(String, U32.is_eq(x, stop), SNil{}, SCon{Chr{x}, Hx.upto(t, stop)})

# s after the first character stop ("" when it has none)
def Hx.after(s: String, +stop: U32) -> String:
  match s:
    case SNil{}:
      SNil{}
    case SCon{Chr{+x}, +t}:
      Bool.pick(String, U32.is_eq(x, stop), t, Hx.after(t, stop))

# s holds the character c
def Hx.has(s: String, +c: U32) -> Bool:
  match s:
    case SNil{}:
      False{}
    case SCon{Chr{+x}, t}:
      U32.is_eq(x, c) || Hx.has(t, c)

def Hx.val(b: Bool, +l: String) -> Bool:
  match b:
    case True{}:
      Meta.Index.no(Hx.after(l, 58))
    case False{}:
      False{}

# a header line (trimmed) that adds an X-Robots-Tag (name ASCII
# case-insensitive) whose directives keep a page out of the index
# (Index.no: noindex or none)
def Hx.adds(+l: String) -> Bool:
  Hx.val(String.eq(Laws.Spec.trim(Laws.Low.go(Hx.upto(l, 58))), "x-robots-tag"), l)

def Hx.slash(s: String) -> String:
  match s:
    case SCon{Chr{47}, t}:
      t
    case s:
      s

# a path without one trailing "/"
def Hx.norm(s: String) -> String:
  String.reverse(Hx.slash(String.reverse(s)))

# a rule path read as matching every path: not beginning "/" (a full
# URL), or with a ":" (a placeholder) or "%" (an escape)
def Hx.wild(+r: String) -> Bool:
  Bool.not(Laws.Spec.starts("/", r)) || Hx.has(r, 58) || Hx.has(r, 37)

# rule path r matches path c (both ASCII lower case): with a "*", c
# begins with what is before the first "*" (what follows it read as
# matching anything); else they are equal, a trailing "/" aside
def Hx.one(+r: String, +c: String) -> Bool:
  Bool.pick(Bool, Hx.has(r, 42), Laws.Spec.starts(Hx.upto(r, 42), c), String.eq(Hx.norm(r), Hx.norm(c)))

# rule path r matches a path the page p is served at: "/" and p
# ("/about.html", "/index.html"), or its URL's path ("/about", "/")
def Hx.page(+r: String, +p: String) -> Bool:
  Hx.wild(r) || Hx.one(r, Laws.Low.go(String.append("/", p))) || Hx.one(r, Laws.Low.go(String.append("/", String.drop(Meta.Url.of(p), 19n))))

# rule path r (trimmed, ASCII lower case) matches an indexable page of ps
def Hx.any(ps: List<&2, String>, +r: String) -> Bool:
  match ps:
    case Nil{}:
      False{}
    case Con{+p, t}:
      (Bool.not(Meta.Url.lost(p)) && Hx.page(r, p)) || Hx.any(t, r)

type Hk is Data:
  HkSkip{}
  HkHead{}
  HkPath{}

# a line: empty or a "#" comment; indented (a header); else a rule path
def Hx.kind(s: String) -> Hk:
  match s:
    case SNil{}:
      HkSkip{}
    case SCon{Chr{32}, t}:
      HkHead{}
    case SCon{Chr{9}, t}:
      HkHead{}
    case SCon{Chr{35}, t}:
      HkSkip{}
    case SCon{c, t}:
      HkPath{}

# the rule in force after line l: its path, trimmed, ASCII lower case
def Hx.next(k: Hk, +l: String, rule: String) -> String:
  match k:
    case HkPath{}:
      Laws.Low.go(Laws.Spec.trim(l))
    case HkHead{}:
      rule
    case HkSkip{}:
      rule

# a header that keeps pages out of the index (b) under rule: the rule
# matches no indexable page of ps
def Hx.hit(b: Bool, +rule: String, +ps: List<&2, String>) -> Bool:
  match b:
    case True{}:
      Bool.not(Hx.any(ps, rule))
    case False{}:
      True{}

# line l adds no X-Robots-Tag keeping out of the index under a rule
# that matches an indexable page
def Hx.ok(k: Hk, +l: String, +rule: String, +ps: List<&2, String>) -> Bool:
  match k:
    case HkHead{}:
      Hx.hit(Hx.adds(Laws.Spec.trim(l)), rule, ps)
    case _:
      True{}

# rule: the path of the rule in force ("" before the first rule: not
# beginning "/", so a header there is read as matching every path)
def Hx.go(ls: List<&2, String>, +rule: String, +ps: List<&2, String>) -> Bool:
  match ls:
    case Nil{}:
      True{}
    case Con{+l, t}:
      Hx.ok(Hx.kind(l), l, rule, ps) && Hx.go(t, Hx.next(Hx.kind(l), l, rule), ps)

# _headers is in dist/ and gives no indexable page of ps an X-Robots-Tag
# that keeps it out of the index
def Headers.ok(m: Maybe<&2, List<&2, String>>, +ps: List<&2, String>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{ls}:
      Hx.go(ls, "", ps)

# Laws
# ----

# LAW sitemap: sitemap.xml is in dist/ and has the plain shape this reader
# reads as an XML reader does: an optional XML declaration ("<?xml", white
# space, up to "?>", no "<", ">", "&" in it) only at its very start, no
# other "<?", no "<!", no "&", no prefixed tag name ("x:"), loc tags only
# exactly "<loc>" and "</loc>" (no attributes, white space or "<loc/>"),
# no tag inside a loc; and the texts of its loc elements, exactly as
# written, are exactly the URLs (Url.of) of the HTML pages but 404.html,
# each once and nothing else (order free). With the law canonical, these
# are the pages' canonical hrefs. And _headers is in
# dist/ and adds no X-Robots-Tag whose directives (split at commas and
# ASCII white space, ASCII case-insensitive) include noindex or none
# under a rule whose path matches a path an HTML page but 404.html is
# served at ("/" and its file path, and its URL's path: "/about.html",
# "/about", "/", "/index.html"; ASCII case-insensitive, a trailing "/"
# aside): a rule path with a "*" matches every path beginning with what
# is before its first "*"; one not beginning "/" or holding ":" or "%"
# matches every path; a header before the first rule applies; "! Name"
# lines add nothing (Headers.ok). NOT checked: that the file is valid
# sitemap XML (urlset, url, the namespace: an xmlns attribute on another
# element could move a loc to another namespace), lastmod, changefreq,
# priority; headers set by functions/ or the worker (A4). (R8)
law sitemap:
  {Sitemap.ok(Sitemap.locs(Laws.Spec.file("sitemap.xml")), Sitemap.urls(Laws.Spec.page_paths())) && Headers.ok(Lines.of(Laws.Spec.file("_headers")), Laws.Spec.page_paths()) == True{} : Bool}

# LAW robots: robots.txt is in dist/ and every line (split at CR and LF)
# is printable ASCII (U+0020-U+007E: no tab, form feed, BOM) and exactly
# one of: empty; a comment ("#" first); "User-agent: " and a non-empty
# token (no space, no "#"); "Allow: /"; "Content-Signal: " and a non-empty
# value (no space first, no "#"); "Sitemap: https://gildrb.com/sitemap.xml",
# which is there exactly once. Field names case-sensitive as written, one
# space after the colon. So no Disallow rule, in any spelling, and no
# other field. NOT checked: how User-agent and Allow lines group, the
# Content-Signal value's syntax, what the comments say. (R9)
law robots:
  {Robots.ok(Lines.of(Laws.Spec.file("robots.txt"))) == True{} : Bool}
