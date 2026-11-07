# gildrb.com's laws: internal links (R10), what files refer to
# ============================================================
#
# Terms of ../links.bend, which states the laws.

import Base
import ../base/html/tokens.bend as H
import ../base/page.bend as Laws
import ../../build/site.bend as S
import ./url.bend as U

# Terms: the references of an HTML page
# -------------------------------------

# srcset, as the HTML standard parses it: between candidates, white space
# and commas; a URL is a run of characters but white space, its trailing
# commas dropped (then the candidate ends); else descriptors follow, up
# to a comma outside parentheses
type LSs is Data:
  LkSkip{}
  LkUrl{}
  LkDesc{}
  LkParen{}

def Ss.comma(s: String) -> String:
  match s:
    case SCon{Chr{44}, t}:
      Ss.comma(t)
    case _:
      s

# a URL (reversed) joins acc, its trailing commas dropped
def Ss.push(cur: String, acc: List<&2, String>) -> List<&2, String>:
  String.reverse(Ss.comma(cur)) <> acc

def Ss.end(st: LSs, cur: String, acc: List<&2, String>) -> List<&2, String>:
  match st:
    case LkUrl{}:
      Ss.push(cur, acc)
    case _:
      acc

# a character's class: ASCII white space, comma, "(", ")", other
type LCh is Data:
  LkSp{}
  LkCm{}
  LkOp{}
  LkCl{}
  LkOt{}
  LkBr{}

def Ch.cls(c: Char) -> LCh:
  match c:
    case Chr{32}:
      LkSp{}
    case Chr{9}:
      LkSp{}
    case Chr{10}:
      LkSp{}
    case Chr{12}:
      LkSp{}
    case Chr{13}:
      LkSp{}
    case Chr{44}:
      LkCm{}
    case Chr{40}:
      LkOp{}
    case Chr{41}:
      LkCl{}
    case Chr{93}:
      LkBr{}
    case _:
      LkOt{}

# the scan so far: its state, the URL so far (reversed), the URLs so far
type LSsSt is Data:
  LkSsSt{st: LSs, cur: String, acc: List<&2, String>}

# white space after a URL ends it; a URL that ended in a comma ends its
# candidate, else descriptors follow
def Ss.sp(cur: String, acc: List<&2, String>) -> LSsSt:
  match cur:
    case SNil{}:
      LkSsSt{LkDesc{}, "", Ss.push(SNil{}, acc)}
    case SCon{Chr{44}, t}:
      LkSsSt{LkSkip{}, "", Ss.push(SCon{Chr{44}, t}, acc)}
    case SCon{c, t}:
      LkSsSt{LkDesc{}, "", Ss.push(SCon{c, t}, acc)}

# the scan after character c of class k: a space or a comma between
# candidates is skipped, anything else begins a URL; a URL runs to white
# space; descriptors run to a comma outside parentheses. cur and acc are
# used once per arm (a value used twice is copied at every character)
def Ss.step(st: LSs, k: LCh, c: Char, cur: String, acc: List<&2, String>) -> LSsSt:
  match st:
    case LkSkip{}:
      match k:
        case LkSp{}:
          LkSsSt{LkSkip{}, "", acc}
        case LkCm{}:
          LkSsSt{LkSkip{}, "", acc}
        case _:
          LkSsSt{LkUrl{}, SCon{c, ""}, acc}
    case LkUrl{}:
      match k:
        case LkSp{}:
          Ss.sp(cur, acc)
        case _:
          LkSsSt{LkUrl{}, SCon{c, cur}, acc}
    case LkDesc{}:
      match k:
        case LkCm{}:
          LkSsSt{LkSkip{}, "", acc}
        case LkOp{}:
          LkSsSt{LkParen{}, "", acc}
        case _:
          LkSsSt{LkDesc{}, "", acc}
    case LkParen{}:
      match k:
        case LkCl{}:
          LkSsSt{LkDesc{}, "", acc}
        case _:
          LkSsSt{LkParen{}, "", acc}

def Ss.fin(q: LSsSt) -> List<&2, String>:
  match q:
    case LkSsSt{st, cur, acc}:
      Ss.end(st, cur, acc)

# one recursive call per character (white space: Ch.cls)
def Ss.go(s: String, q: LSsSt) -> List<&2, String>:
  match s:
    case SNil{}:
      Ss.fin(q)
    case SCon{+c, t}:
      match q:
        case LkSsSt{st, cur, acc}:
          Ss.go(t, Ss.step(st, Ch.cls(c), c, cur, acc))

# the URL of each image candidate of a srcset value
def Srcset.urls(s: String) -> List<&2, String>:
  Ss.go(s, LkSsSt{LkSkip{}, "", []})

# an attribute's references: href, src and poster (any element), each URL
# of srcset
def Refs.key(k: H.Key, +self: String, v: String, rest: List<&2, U.LRef>) -> List<&2, U.LRef>:
  match k:
    case H.KHref{}:
      U.Ref.one(self, v, rest)
    case H.KSrc{}:
      U.Ref.one(self, v, rest)
    case H.KPoster{}:
      U.Ref.one(self, v, rest)
    case H.KSrcset{}:
      U.Ref.many(self, Srcset.urls(v), rest)
    case _:
      rest

def Refs.attrs(+self: String, attrs: List<&2, H.Attr>, rest: List<&2, U.LRef>) -> List<&2, U.LRef>:
  match attrs:
    case Nil{}:
      rest
    case Con{H.Attr{k, v}, t}:
      Refs.key(k, self, v, Refs.attrs(self, t, rest))

def Og.p(+s: String) -> Bool:
  String.eq(s, "og:image") || String.eq(s, "og:url")

# a property (ASCII case-insensitive) is og:image or og:url
def Og.is(m: Maybe<&2, String>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{v}:
      Og.p(Laws.Low.go(v))

def Refs.ogp(b: Bool, +self: String, m: Maybe<&2, String>, rest: List<&2, U.LRef>) -> List<&2, U.LRef>:
  match b:
    case False{}:
      rest
    case True{}:
      match m:
        case None{}:
          rest
        case Some{v}:
          U.Ref.one(self, v, rest)

# a meta tag's references: its attributes', then its content when its
# property is og:image or og:url
def Refs.meta(+self: String, +attrs: List<&2, H.Attr>, rest: List<&2, U.LRef>) -> List<&2, U.LRef>:
  Refs.attrs(self, attrs, Refs.ogp(Og.is(Laws.Spec.attr(H.KProperty{}, attrs)), self, Laws.Spec.attr(H.KContent{}, attrs), rest))

# a start tag's references (only a meta tag's attributes are read twice,
# and so copied)
def Refs.tag(n: H.Name, +self: String, attrs: List<&2, H.Attr>, rest: List<&2, U.LRef>) -> List<&2, U.LRef>:
  match n:
    case H.NMeta{}:
      Refs.meta(self, attrs, rest)
    case _:
      Refs.attrs(self, attrs, rest)

# every internal reference of a page (the page at self), in order
def Refs.html(+self: String, ts: List<&2, H.Tok>) -> List<&2, U.LRef>:
  match ts:
    case Nil{}:
      []
    case Con{H.TOpen{n, attrs}, t}:
      Refs.tag(n, self, attrs, Refs.html(self, t))
    case Con{x, t}:
      Refs.html(self, t)

# Terms: halves of a page
# -----------------------

# a page's start tags at even (LkEv) or odd (LkOd) positions among its
# start tags: each start tag is in one half, so the references of a page
# are those of its two halves (Refs.html reads only start tags)
type LHalf is Data:
  LkEv{}
  LkOd{}

def Tags.open(ts: List<&2, H.Tok>) -> List<&2, H.Tok>:
  match ts:
    case Nil{}:
      []
    case Con{H.TOpen{n, a}, t}:
      H.TOpen{n, a} <> Tags.open(t)
    case Con{x, t}:
      Tags.open(t)

def Tags.ev(ts: List<&2, H.Tok>) -> List<&2, H.Tok>:
  match ts:
    case Nil{}:
      []
    case Con{x, Nil{}}:
      [x]
    case Con{x, Con{y, t}}:
      x <> Tags.ev(t)

def Tags.at(h: LHalf, ts: List<&2, H.Tok>) -> List<&2, H.Tok>:
  match h:
    case LkEv{}:
      Tags.ev(ts)
    case LkOd{}:
      match ts:
        case Nil{}:
          []
        case Con{x, t}:
          Tags.ev(t)

# the start tags of half h of a page's tokens
def Tags.half(h: LHalf, ts: List<&2, H.Tok>) -> List<&2, H.Tok>:
  Tags.at(h, Tags.open(ts))

# Terms: the references of a text file
# ------------------------------------

# markdown link targets: the text after "](" up to ")" or white space
type LMd is Data:
  LkOut{}
  LkBrk{}
  LkTgt{}

def Md.end(st: LMd, cur: String, acc: List<&2, String>) -> List<&2, String>:
  match st:
    case LkTgt{}:
      String.reverse(cur) <> acc
    case _:
      acc

# the scan so far: its state, the target so far (reversed), the targets
# so far
type LMdSt is Data:
  LkMdSt{st: LMd, cur: String, acc: List<&2, String>}

# the scan after character c of class k: "]" then "(" begins a target,
# which ends at ")" or white space. cur and acc are used once per arm (a
# value used twice is copied at every character)
def Md.step(st: LMd, k: LCh, c: Char, cur: String, acc: List<&2, String>) -> LMdSt:
  match st:
    case LkOut{}:
      match k:
        case LkBr{}:
          LkMdSt{LkBrk{}, "", acc}
        case _:
          LkMdSt{LkOut{}, "", acc}
    case LkBrk{}:
      match k:
        case LkOp{}:
          LkMdSt{LkTgt{}, "", acc}
        case LkBr{}:
          LkMdSt{LkBrk{}, "", acc}
        case _:
          LkMdSt{LkOut{}, "", acc}
    case LkTgt{}:
      match k:
        case LkSp{}:
          LkMdSt{LkOut{}, "", String.reverse(cur) <> acc}
        case LkCl{}:
          LkMdSt{LkOut{}, "", String.reverse(cur) <> acc}
        case _:
          LkMdSt{LkTgt{}, SCon{c, cur}, acc}

def Md.fin(q: LMdSt) -> List<&2, String>:
  match q:
    case LkMdSt{st, cur, acc}:
      Md.end(st, cur, acc)

# one recursive call per character
def Md.go(s: String, q: LMdSt) -> List<&2, String>:
  match s:
    case SNil{}:
      Md.fin(q)
    case SCon{+c, t}:
      match q:
        case LkMdSt{st, cur, acc}:
          Md.go(t, Md.step(st, Ch.cls(c), c, cur, acc))

# a URL's trailing ".,;:!?" (reversed: its leading ones) dropped
def Punct.drop(s: String) -> String:
  match s:
    case SCon{Chr{46}, t}:
      Punct.drop(t)
    case SCon{Chr{44}, t}:
      Punct.drop(t)
    case SCon{Chr{59}, t}:
      Punct.drop(t)
    case SCon{Chr{58}, t}:
      Punct.drop(t)
    case SCon{Chr{33}, t}:
      Punct.drop(t)
    case SCon{Chr{63}, t}:
      Punct.drop(t)
    case _:
      s

# the authority of a URL (after "//"): up to the end, "/", "?" or "#"
def Gil.auth(s: String) -> String:
  match s:
    case SNil{}:
      SNil{}
    case SCon{Chr{47}, t}:
      SNil{}
    case SCon{Chr{63}, t}:
      SNil{}
    case SCon{Chr{35}, t}:
      SNil{}
    case SCon{c, t}:
      SCon{c, Gil.auth(t)}

# s (reversed) up to its first "@": the authority without userinfo
def Gil.user(s: String) -> String:
  match s:
    case SNil{}:
      SNil{}
    case SCon{Chr{64}, t}:
      SNil{}
    case SCon{c, t}:
      SCon{c, Gil.user(t)}

# s up to its first ":": the host without a port
def Gil.port(s: String) -> String:
  match s:
    case SNil{}:
      SNil{}
    case SCon{Chr{58}, t}:
      SNil{}
    case SCon{c, t}:
      SCon{c, Gil.port(t)}

def Gil.dots(s: String) -> String:
  match s:
    case SCon{Chr{46}, t}:
      Gil.dots(t)
    case _:
      s

# an authority names gildrb.com in some form: in any case, with userinfo,
# a port or trailing dots
def Gil.like(a: String) -> Bool:
  String.eq(String.reverse(Gil.dots(String.reverse(Gil.port(String.reverse(Gil.user(String.reverse(Laws.Low.go(a)))))))), "gildrb.com")

def Bare.m(m1: Maybe<&2, String>, m2: Maybe<&2, String>) -> Bool:
  match m1:
    case Some{r}:
      Gil.like(Gil.auth(r))
    case None{}:
      match m2:
        case Some{r}:
          Gil.like(Gil.auth(r))
        case None{}:
          False{}

# t follows an "h": "ttps://" or "ttp://" (in any case), then a gildrb.com
# authority in some form
def Bare.hit(+t: String) -> Bool:
  Bare.m(U.Pre.cut("ttps://", t), U.Pre.cut("ttp://", t))

def Bare.at(b: Bool, h: Char, t: String, acc: List<&2, String>) -> List<&2, String>:
  match b:
    case True{}:
      String.reverse(Punct.drop(String.reverse(SCon{h, t}))) <> acc
    case False{}:
      acc

# every "http://" or "https://" (in any case) on gildrb.com (Gil.like) in
# a token, to the token's end; Url.cls then fails any not in canonical
# form
def Bare.scan(tok: String, acc: List<&2, String>) -> List<&2, String>:
  match tok:
    case SNil{}:
      acc
    case SCon{Chr{104}, +t}:
      Bare.scan(t, Bare.at(Bare.hit(t), Chr{104}, t, acc))
    case SCon{Chr{72}, +t}:
      Bare.scan(t, Bare.at(Bare.hit(t), Chr{72}, t, acc))
    case SCon{c, t}:
      Bare.scan(t, acc)

def Bare.end(cur: String, acc: List<&2, String>) -> List<&2, String>:
  Bare.scan(String.reverse(cur), acc)

# bare URLs: s cut into tokens at white space, ")",
# ">", '"', "'" and "`" (where a bare URL ends); cur: the token so far,
# reversed
def Bare.go(s: String, cur: String, acc: List<&2, String>) -> List<&2, String>:
  match s:
    case SNil{}:
      Bare.end(cur, acc)
    case SCon{Chr{32}, t}:
      Bare.go(t, "", Bare.end(cur, acc))
    case SCon{Chr{9}, t}:
      Bare.go(t, "", Bare.end(cur, acc))
    case SCon{Chr{10}, t}:
      Bare.go(t, "", Bare.end(cur, acc))
    case SCon{Chr{12}, t}:
      Bare.go(t, "", Bare.end(cur, acc))
    case SCon{Chr{13}, t}:
      Bare.go(t, "", Bare.end(cur, acc))
    case SCon{Chr{41}, t}:
      Bare.go(t, "", Bare.end(cur, acc))
    case SCon{Chr{62}, t}:
      Bare.go(t, "", Bare.end(cur, acc))
    case SCon{Chr{34}, t}:
      Bare.go(t, "", Bare.end(cur, acc))
    case SCon{Chr{39}, t}:
      Bare.go(t, "", Bare.end(cur, acc))
    case SCon{Chr{96}, t}:
      Bare.go(t, "", Bare.end(cur, acc))
    case SCon{c, t}:
      Bare.go(t, SCon{c, cur}, acc)

# reference-style link definitions (CommonMark): a line that begins with
# up to 3 spaces, "[label]:", spaces or tabs, then the target, up to white
# space or the end. The state of the scan of one line
type LRf is Data:
  LkL0{}
  LkL1{}
  LkL2{}
  LkL3{}
  LkLb0{}
  LkLb{}
  LkCo{}
  LkGap{}
  LkDt{}
  LkNo{}

# a character's class for Rf: newline, space, tab, other white space,
# "[", "]", ":", other
type LRc is Data:
  LkRNl{}
  LkRSp{}
  LkRTab{}
  LkRWs{}
  LkROp{}
  LkRCl{}
  LkRCo{}
  LkROt{}

def Rf.cls(c: Char) -> LRc:
  match c:
    case Chr{10}:
      LkRNl{}
    case Chr{32}:
      LkRSp{}
    case Chr{9}:
      LkRTab{}
    case Chr{12}:
      LkRWs{}
    case Chr{13}:
      LkRWs{}
    case Chr{91}:
      LkROp{}
    case Chr{93}:
      LkRCl{}
    case Chr{58}:
      LkRCo{}
    case _:
      LkROt{}

type LRfSt is Data:
  LkRfSt{st: LRf, cur: String, acc: List<&2, String>}

# at the start of a line, after n spaces (next: the state after a space)
def Rf.lead(k: LRc, next: LRf, acc: List<&2, String>) -> LRfSt:
  match k:
    case LkRSp{}:
      LkRfSt{next, "", acc}
    case LkROp{}:
      LkRfSt{LkLb0{}, "", acc}
    case LkRNl{}:
      LkRfSt{LkL0{}, "", acc}
    case _:
      LkRfSt{LkNo{}, "", acc}

# the scan after character c of class k; cur (the target so far,
# reversed) and acc are used once per arm
def Rf.step(st: LRf, k: LRc, c: Char, cur: String, acc: List<&2, String>) -> LRfSt:
  match st:
    case LkL0{}:
      Rf.lead(k, LkL1{}, acc)
    case LkL1{}:
      Rf.lead(k, LkL2{}, acc)
    case LkL2{}:
      Rf.lead(k, LkL3{}, acc)
    case LkL3{}:
      Rf.lead(k, LkNo{}, acc)
    case LkLb0{}:
      match k:
        case LkRCl{}:
          LkRfSt{LkNo{}, "", acc}
        case LkRNl{}:
          LkRfSt{LkL0{}, "", acc}
        case _:
          LkRfSt{LkLb{}, "", acc}
    case LkLb{}:
      match k:
        case LkRCl{}:
          LkRfSt{LkCo{}, "", acc}
        case LkRNl{}:
          LkRfSt{LkL0{}, "", acc}
        case _:
          LkRfSt{LkLb{}, "", acc}
    case LkCo{}:
      match k:
        case LkRCo{}:
          LkRfSt{LkGap{}, "", acc}
        case LkRNl{}:
          LkRfSt{LkL0{}, "", acc}
        case _:
          LkRfSt{LkNo{}, "", acc}
    case LkGap{}:
      match k:
        case LkRSp{}:
          LkRfSt{LkGap{}, "", acc}
        case LkRTab{}:
          LkRfSt{LkGap{}, "", acc}
        case LkRWs{}:
          LkRfSt{LkGap{}, "", acc}
        case LkRNl{}:
          LkRfSt{LkL0{}, "", acc}
        case _:
          LkRfSt{LkDt{}, SCon{c, ""}, acc}
    case LkDt{}:
      match k:
        case LkRNl{}:
          LkRfSt{LkL0{}, "", String.reverse(cur) <> acc}
        case LkRSp{}:
          LkRfSt{LkNo{}, "", String.reverse(cur) <> acc}
        case LkRTab{}:
          LkRfSt{LkNo{}, "", String.reverse(cur) <> acc}
        case LkRWs{}:
          LkRfSt{LkNo{}, "", String.reverse(cur) <> acc}
        case _:
          LkRfSt{LkDt{}, SCon{c, cur}, acc}
    case LkNo{}:
      match k:
        case LkRNl{}:
          LkRfSt{LkL0{}, "", acc}
        case _:
          LkRfSt{LkNo{}, "", acc}

def Rf.fin(q: LRfSt) -> List<&2, String>:
  match q:
    case LkRfSt{LkDt{}, cur, acc}:
      String.reverse(cur) <> acc
    case LkRfSt{st, cur, acc}:
      acc

# one recursive call per character
def Rf.go(s: String, q: LRfSt) -> List<&2, String>:
  match s:
    case SNil{}:
      Rf.fin(q)
    case SCon{+c, t}:
      match q:
        case LkRfSt{st, cur, acc}:
          Rf.go(t, Rf.step(st, Rf.cls(c), c, cur, acc))

# the text of a loc element: up to the next "<", trimmed
def Loc.val(s: String) -> String:
  match s:
    case SNil{}:
      SNil{}
    case SCon{Chr{60}, t}:
      SNil{}
    case SCon{c, t}:
      SCon{c, Loc.val(t)}

def Loc.at(b: Bool, t: String, acc: List<&2, String>) -> List<&2, String>:
  match b:
    case True{}:
      Loc.val(String.drop(t, 4n)) <> acc
    case False{}:
      acc

# the text after every "<loc>"
def Loc.go(s: String, acc: List<&2, String>) -> List<&2, String>:
  match s:
    case SNil{}:
      acc
    case SCon{Chr{60}, +t}:
      Loc.go(t, Loc.at(Laws.Spec.starts("loc>", t), t, acc))
    case SCon{c, t}:
      Loc.go(t, acc)

# which references a text file has
type LTx is Data:
  LkMap{}
  LkMd{}
  LkNone{}

def Txt.md(+p: String) -> Bool:
  String.eq(p, "llms.txt") || String.eq(p, "llms-full.txt") || String.eq(p, ".well-known/llms.txt") || String.eq(p, "index.html.md") || (Laws.Spec.starts("content/", p) && String.ends_with(p, ".md"))

def Txt.kind(+p: String) -> LTx:
  Bool.pick(LTx, String.eq(p, "sitemap.xml"), LkMap{}, Bool.pick(LTx, Txt.md(p), LkMd{}, LkNone{}))

# sitemap.xml: every loc; llms.txt, llms-full.txt, .well-known/llms.txt,
# index.html.md, content/*.md: every inline markdown link target, every
# reference-style definition's target (Rf.go) and every bare http(s) URL
# on gildrb.com in some form (Bare.go); any other file: none
def Txt.urls(k: LTx, +s: String) -> List<&2, String>:
  match k:
    case LkMap{}:
      Loc.go(s, [])
    case LkMd{}:
      Md.go(s, LkMdSt{LkOut{}, "", Rf.go(s, LkRfSt{LkL0{}, "", Bare.go(s, "", [])})})
    case LkNone{}:
      []
