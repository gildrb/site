# gildrb.com's laws: files for agents (R11)
# =========================================
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
