# gildrb.com's laws: files for agents (R11, R12)
# ===============================================
#
# The terms shared by every area are in base/page.bend; LAWS.bend lists
# the requirements.

import Base
import ./base/html/tokens.bend as H
import ./base/page.bend as Laws

# Terms
# -----

# a host name's characters: a-z, 0-9, "-", "."
def Host.char(c: Char) -> Bool:
  match c:
    case Chr{97}:
      True{}
    case Chr{98}:
      True{}
    case Chr{99}:
      True{}
    case Chr{100}:
      True{}
    case Chr{101}:
      True{}
    case Chr{102}:
      True{}
    case Chr{103}:
      True{}
    case Chr{104}:
      True{}
    case Chr{105}:
      True{}
    case Chr{106}:
      True{}
    case Chr{107}:
      True{}
    case Chr{108}:
      True{}
    case Chr{109}:
      True{}
    case Chr{110}:
      True{}
    case Chr{111}:
      True{}
    case Chr{112}:
      True{}
    case Chr{113}:
      True{}
    case Chr{114}:
      True{}
    case Chr{115}:
      True{}
    case Chr{116}:
      True{}
    case Chr{117}:
      True{}
    case Chr{118}:
      True{}
    case Chr{119}:
      True{}
    case Chr{120}:
      True{}
    case Chr{121}:
      True{}
    case Chr{122}:
      True{}
    case Chr{48}:
      True{}
    case Chr{49}:
      True{}
    case Chr{50}:
      True{}
    case Chr{51}:
      True{}
    case Chr{52}:
      True{}
    case Chr{53}:
      True{}
    case Chr{54}:
      True{}
    case Chr{55}:
      True{}
    case Chr{56}:
      True{}
    case Chr{57}:
      True{}
    case Chr{45}:
      True{}
    case Chr{46}:
      True{}
    case _:
      False{}

# s split at each "."
def Dots.go(s: String, w: String, acc: List<&2, String>) -> List<&2, String>:
  match s:
    case SNil{}:
      List.reverse(&2, String, String.reverse(w) <> acc)
    case SCon{Chr{46}, t}:
      Dots.go(t, SNil{}, String.reverse(w) <> acc)
    case SCon{c, t}:
      Dots.go(t, SCon{c, w}, acc)

def Dash.is(c: Char) -> Bool:
  match c:
    case Chr{45}:
      True{}
    case _:
      False{}

# the last character of c then s is "-"
def Dash.last(s: String, c: Char) -> Bool:
  match s:
    case SNil{}:
      Dash.is(c)
    case SCon{d, t}:
      Dash.last(t, d)

# the 3rd and 4th characters of a label are "--" (t: the label after its
# first character)
def Label.hy(t: String) -> Bool:
  match t:
    case SCon{b, SCon{x, SCon{y, r}}}:
      Dash.is(x) && Dash.is(y)
    case _:
      False{}

# a label: not empty, not beginning or ending with "-", no "--" as its
# 3rd and 4th characters (as in "xn--", which a URL parser decodes)
def Label.ok(l: String) -> Bool:
  match l:
    case SNil{}:
      False{}
    case SCon{+c, +t}:
      Bool.not(Dash.is(c)) && Bool.not(Dash.last(t, c)) && Bool.not(Label.hy(t))

# a label beginning with a letter (a URL parser reads a host whose last
# label is a number as an IPv4 address)
def Label.lead(l: String) -> Bool:
  match l:
    case SCon{Chr{+x}, t}:
      U32.is_lt(96, x) && U32.is_lt(x, 123)
    case _:
      False{}

def Labels.ok(ls: List<&2, String>) -> Bool:
  match ls:
    case Nil{}:
      False{}
    case Con{+l, Nil{}}:
      Label.ok(l) && Label.lead(l)
    case Con{l, t}:
      Label.ok(l) && Labels.ok(t)

def Host.end(acc: String) -> Maybe<&2, String>:
  match acc:
    case SNil{}:
      None{}
    case SCon{h, t}:
      +r = String.reverse(SCon{h, t})
      Bool.pick(Maybe<&2, String>, Labels.ok(Dots.go(r, SNil{}, [])), Some{r}, None{})

# H from "H/": H of host characters, its labels (split at ".") each
# Label.ok, the last beginning with a letter
def Host.go(s: String, acc: String) -> Maybe<&2, String>:
  match s:
    case SNil{}:
      None{}
    case SCon{Chr{47}, SNil{}}:
      Host.end(acc)
    case SCon{+c, t}:
      Bool.pick(Maybe<&2, String>, Host.char(c), Host.go(t, SCon{c, acc}), None{})

# H from "https://H/"
def Spec.host(href: String) -> Maybe<&2, String>:
  match href:
    case SCon{Chr{104}, SCon{Chr{116}, SCon{Chr{116}, SCon{Chr{112}, SCon{Chr{115}, SCon{Chr{58}, SCon{Chr{47}, SCon{Chr{47}, rest}}}}}}}}:
      Host.go(rest, SNil{})
    case _:
      None{}

# the rel attribute names "canonical" (link types: ASCII case-insensitive,
# separated by white space)
def Canon.word(ws: List<&2, String>) -> Bool:
  match ws:
    case Nil{}:
      False{}
    case Con{w, t}:
      String.eq(w, "canonical") || Canon.word(t)

def Canon.rel(m: Maybe<&2, String>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{r}:
      Canon.word(Laws.Spec.words(Laws.Low.go(r)))

def Canon.at(b: Bool, href: Maybe<&2, String>, rest: List<&2, Maybe<&2, String>>) -> List<&2, Maybe<&2, String>>:
  match b:
    case True{}:
      href <> rest
    case False{}:
      rest

# the href of every canonical link, in order
def Canon.all(ts: List<&2, H.Tok>) -> List<&2, Maybe<&2, String>>:
  match ts:
    case Nil{}:
      []
    case Con{H.TOpen{H.NLink{}, +attrs}, t}:
      Canon.at(Canon.rel(Laws.Spec.attr(H.KRel{}, attrs)), Laws.Spec.attr(H.KHref{}, attrs), Canon.all(t))
    case Con{x, t}:
      Canon.all(t)

def Canon.one(hs: List<&2, Maybe<&2, String>>) -> Maybe<&2, String>:
  match hs:
    case Con{Some{h}, Nil{}}:
      Spec.host(h)
    case _:
      None{}

# H when the page has exactly one canonical link, https://H/
def Spec.canon(ts: List<&2, H.Tok>) -> Maybe<&2, String>:
  Canon.one(Canon.all(ts))

# JSON.stringify({protocol_version: "0.1", organization: {name: "Gil
# Rodrigues", domain: host}, web: {}}, null, 2), then a newline
def Spec.poppy(host: String) -> String:
  "{\n  \"protocol_version\": \"0.1\",\n  \"organization\": {\n    \"name\": \"Gil Rodrigues\",\n    \"domain\": \"" ++ host ++ "\"\n  },\n  \"web\": {}\n}\n"

def Poppy.ok(file: Maybe<&2, List<&2, String>>, host: Maybe<&2, String>) -> Bool:
  match file host:
    case Some{text} Some{h}:
      String.eq(Laws.Spec.cat(text), Spec.poppy(h))
    case _ _:
      False{}

# no canonical link after the body's start tag (a browser reads a
# canonical link only in the head)
def Canon.head(ts: List<&2, H.Tok>) -> Bool:
  match ts:
    case Nil{}:
      True{}
    case Con{H.TOpen{H.NBody{}, a}, t}:
      List.is_empty(&2, Maybe<&2, String>, Canon.all(t))
    case Con{x, t}:
      Canon.head(t)

def Poppy.host(m: Maybe<&2, List<&2, H.Tok>>) -> Maybe<&2, String>:
  match m:
    case None{}:
      None{}
    case Some{+ts}:
      Bool.pick(Maybe<&2, String>, Canon.head(ts), Spec.canon(ts), None{})

# Terms: Markdown for agents (R12, A7)
# ------------------------------------

# b is false
def Md.not(b: Bool) -> Bool:
  match b:
    case True{}:
      False{}
    case False{}:
      True{}

# the title line read so far (reversed) is not blank, and neither is the rest
def Md.both(line: String, body: String) -> Bool:
  Md.not(Laws.Wide.blank(line)) && Md.not(Laws.Wide.blank(body))

# after "# ": the title up to the first line feed, then the body; a file
# that ends on its title line has no body
def Md.title(s: String, line: String) -> Bool:
  match s:
    case SNil{}:
      False{}
    case SCon{Chr{10}, t}:
      Md.both(line, t)
    case SCon{c, t}:
      Md.title(t, SCon{c, line})

# after "#": a space, then the title
def Md.space(s: String) -> Bool:
  match s:
    case SNil{}:
      False{}
    case SCon{Chr{32}, t}:
      Md.title(t, SNil{})
    case SCon{c, t}:
      False{}

# a Markdown text for agents: it begins with "# ", a title that is not
# blank (Laws.Wide.blank), a line feed, then text that is not blank
def Md.shape(s: String) -> Bool:
  match s:
    case SNil{}:
      False{}
    case SCon{Chr{35}, t}:
      Md.space(t)
    case SCon{c, t}:
      False{}

# the file is in the build and has the shape of a Markdown text for agents
def Md.ok(m: Maybe<&2, List<&2, String>>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{cs}:
      Md.shape(Laws.Spec.cat(cs))

# r is a page's path reversed: the slug before ".html", if it ends so
def Slug.rev(r: String) -> Maybe<&2, String>:
  match r:
    case SCon{Chr{108}, SCon{Chr{109}, SCon{Chr{116}, SCon{Chr{104}, SCon{Chr{46}, t}}}}}:
      Some{String.reverse(t)}
    case _:
      None{}

# content/<slug>.md; a path with no slug names no file (Spec.file gives None)
def Md.content(m: Maybe<&2, String>) -> String:
  match m:
    case None{}:
      ""
    case Some{s}:
      String.append("content/", String.append(s, ".md"))

# the file the Markdown route serves for a page (A7): / is index.html.md,
# /all is llms-full.txt, any other /<slug> is content/<slug>.md
def Md.file(+p: String) -> String:
  Bool.pick(String, String.eq(p, "index.html"), "index.html.md", Bool.pick(String, String.eq(p, "all.html"), "llms-full.txt", Md.content(Slug.rev(String.reverse(p)))))

# a page's Markdown is in the build and has the shape; 404.html has none
def Md.page(+p: String) -> Bool:
  Bool.pick(Bool, String.eq(p, "404.html"), True{}, Md.ok(Laws.Spec.file(Md.file(p))))

def Md.pages(ps: List<&2, String>) -> Bool:
  match ps:
    case Nil{}:
      True{}
    case Con{p, t}:
      Md.page(p) && Md.pages(t)

# llms.txt, .well-known/llms.txt and every page's Markdown (R12)
def Agent.text() -> Bool:
  Md.ok(Laws.Spec.file("llms.txt")) && Md.ok(Laws.Spec.file(".well-known/llms.txt")) && Md.pages(Laws.Spec.page_paths())

# Laws
# ----

# LAW poppy: /.well-known/poppy.json is, byte for byte, the 2-space JSON
# {"protocol_version": "0.1", "organization": {"name": "Gil Rodrigues",
# "domain": H}, "web": {}} and a newline, where the homepage has exactly
# one canonical link (rel names "canonical", any letter case), before its
# body's start tag, its href is https://H/ and H is a host name a URL
# parser reads as itself: labels of a-z, 0-9 and "-" split by ".", none
# empty, none beginning or ending with "-" or with "--" as its 3rd and 4th
# characters, the last beginning with a letter (R11).
# waive L4-examples-only: the law reads one file, poppy.json, and the site no input; this law pins its bytes whole.
law poppy:
  {Poppy.ok(Laws.Spec.file(".well-known/poppy.json"), Poppy.host(Laws.Spec.toks(Laws.Spec.page("index.html")))) == True{} : Bool}

# LAW agent_text: llms.txt, .well-known/llms.txt and, for every HTML page but
# 404.html, the Markdown the site serves for it (A7: index.html.md for /,
# llms-full.txt for /all, content/<slug>.md for /<slug>) are in the build,
# begin with "# " and a title line that is not blank, and have text after
# it that is not blank (blank as in R4). NOT checked: what the Markdown
# says, that it matches its page, its links (R10 does those), or that
# functions/ serves it (A7). (R12)
law agent_text:
  {Agent.text() == True{} : Bool}
