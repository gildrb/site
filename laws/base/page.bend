# gildrb.com's laws: the terms they share
# =======================================
#
# The site's files (build/site.bend) by path, a page's tags (html/),
# attributes, strings. LAWS.bend lists the requirements. Each area of
# laws/ imports this file as Laws.

import Base
import ../../build/site.bend as S
import ./html/tokens.bend as H
import ./html/tree.bend as T

# Files
# -----

# the text of the file at path in fs, None when fs has no such file
def Spec.find(fs: List<&2, S.Out>, +path: String) -> Maybe<&2, List<&2, String>>:
  match fs:
    case Nil{}:
      None{}
    case Con{S.Out{p, text}, t}:
      Bool.pick(Maybe<&2, List<&2, String>>, String.eq(p, path), Some{text}, Spec.find(t, path))

# the HTML page at path in dist/ (S.Site.pages: every .html file)
def Spec.page(path: String) -> Maybe<&2, List<&2, String>>:
  Spec.find(S.Site.pages(), path)

# any other file the laws read (S.Site.files: sitemap.xml, robots.txt,
# _headers, _redirects, llms.txt, llms-full.txt, .well-known/llms.txt,
# .well-known/poppy.json, index.html.md, content/*.md), None when dist/
# lacks it
def Spec.file(path: String) -> Maybe<&2, List<&2, String>>:
  Spec.find(S.Site.files(), path)

# the path of each file of fs, in order
def Paths.of(fs: List<&2, S.Out>) -> List<&2, String>:
  match fs:
    case Nil{}:
      []
    case Con{S.Out{p, text}, t}:
      p <> Paths.of(t)

# the path of every HTML page in dist/, in order ("index.html",
# "ben-davis.html", ...)
def Spec.page_paths() -> List<&2, String>:
  Paths.of(S.Site.pages())

# the path of every other file the laws read (Spec.file), in order
def Spec.file_paths() -> List<&2, String>:
  Paths.of(S.Site.files())

# the path of every file in dist/, relative, "/"-separated, in order
def Spec.paths() -> List<&2, String>:
  S.Site.paths()

# a page's tags and text; None when it is missing or a browser could read
# it another way
def Spec.toks(m: Maybe<&2, List<&2, String>>) -> Maybe<&2, List<&2, H.Tok>>:
  match m:
    case None{}:
      None{}
    case Some{text}:
      T.Html.toks(text)

# the pieces of a file, joined
def Spec.cat(cs: List<&2, String>) -> String:
  match cs:
    case Nil{}:
      ""
    case Con{s, t}:
      String.append(s, Spec.cat(t))

# Attributes
# ----------

def Key.num(k: H.Key) -> Nat:
  match k:
    case H.KId{}:
      0n
    case H.KHref{}:
      1n
    case H.KRel{}:
      2n
    case H.KLabelled{}:
      3n
    case H.KHidden{}:
      4n
    case H.KLang{}:
      5n
    case H.KContent{}:
      6n
    case H.KName{}:
      7n
    case H.KProperty{}:
      8n
    case H.KSrc{}:
      9n
    case H.KSrcset{}:
      10n
    case H.KPoster{}:
      11n
    case H.KAlt{}:
      12n
    case H.KLabel{}:
      13n
    case H.KTitle{}:
      14n
    case H.KOther{}:
      15n
    case H.KAriaHidden{}:
      16n

# the value of a tag's first attribute named key (a browser keeps the
# first of two); Some{""} for an attribute written without a value
def Spec.attr(+key: H.Key, attrs: List<&2, H.Attr>) -> Maybe<&2, String>:
  match attrs:
    case Nil{}:
      None{}
    case Con{H.Attr{k, v}, t}:
      Bool.pick(Maybe<&2, String>, Nat.is_eq(Key.num(k), Key.num(key)), Some{v}, Spec.attr(key, t))

# the tag has an attribute named key
def Spec.has(+key: H.Key, attrs: List<&2, H.Attr>) -> Bool:
  Maybe.is_some(&2, String, Spec.attr(key, attrs))

# a blank character, as JavaScript's trim() and a zero width space: ASCII
# white space (tab, LF, VT, FF, CR, space), U+00A0, U+1680,
# U+2000-U+200B, U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF
def Wide.sp(+x: U32) -> Bool:
  ((x >= 9 : U32) && (x <= 13 : U32)) || U32.is_eq(x, 32) || U32.is_eq(x, 160) || U32.is_eq(x, 5760) || ((x >= 8192 : U32) && (x <= 8203 : U32)) || U32.is_eq(x, 8232) || U32.is_eq(x, 8233) || U32.is_eq(x, 8239) || U32.is_eq(x, 8287) || U32.is_eq(x, 12288) || U32.is_eq(x, 65279)

# s is blank characters (Wide.sp) only: the one blank test of the laws
def Wide.blank(s: String) -> Bool:
  match s:
    case SNil{}:
      True{}
    case SCon{Chr{+x}, t}:
      Wide.sp(x) && Wide.blank(t)

# an attribute value is there and not blank (Wide.blank)
def Spec.filled(m: Maybe<&2, String>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{v}:
      Bool.not(Wide.blank(v))

# Strings
# -------

# s in lower case (ASCII letters)
def Low.go(s: String) -> String:
  match s:
    case SNil{}:
      SNil{}
    case SCon{Chr{65}, t}:
      SCon{Chr{97}, Low.go(t)}
    case SCon{Chr{66}, t}:
      SCon{Chr{98}, Low.go(t)}
    case SCon{Chr{67}, t}:
      SCon{Chr{99}, Low.go(t)}
    case SCon{Chr{68}, t}:
      SCon{Chr{100}, Low.go(t)}
    case SCon{Chr{69}, t}:
      SCon{Chr{101}, Low.go(t)}
    case SCon{Chr{70}, t}:
      SCon{Chr{102}, Low.go(t)}
    case SCon{Chr{71}, t}:
      SCon{Chr{103}, Low.go(t)}
    case SCon{Chr{72}, t}:
      SCon{Chr{104}, Low.go(t)}
    case SCon{Chr{73}, t}:
      SCon{Chr{105}, Low.go(t)}
    case SCon{Chr{74}, t}:
      SCon{Chr{106}, Low.go(t)}
    case SCon{Chr{75}, t}:
      SCon{Chr{107}, Low.go(t)}
    case SCon{Chr{76}, t}:
      SCon{Chr{108}, Low.go(t)}
    case SCon{Chr{77}, t}:
      SCon{Chr{109}, Low.go(t)}
    case SCon{Chr{78}, t}:
      SCon{Chr{110}, Low.go(t)}
    case SCon{Chr{79}, t}:
      SCon{Chr{111}, Low.go(t)}
    case SCon{Chr{80}, t}:
      SCon{Chr{112}, Low.go(t)}
    case SCon{Chr{81}, t}:
      SCon{Chr{113}, Low.go(t)}
    case SCon{Chr{82}, t}:
      SCon{Chr{114}, Low.go(t)}
    case SCon{Chr{83}, t}:
      SCon{Chr{115}, Low.go(t)}
    case SCon{Chr{84}, t}:
      SCon{Chr{116}, Low.go(t)}
    case SCon{Chr{85}, t}:
      SCon{Chr{117}, Low.go(t)}
    case SCon{Chr{86}, t}:
      SCon{Chr{118}, Low.go(t)}
    case SCon{Chr{87}, t}:
      SCon{Chr{119}, Low.go(t)}
    case SCon{Chr{88}, t}:
      SCon{Chr{120}, Low.go(t)}
    case SCon{Chr{89}, t}:
      SCon{Chr{121}, Low.go(t)}
    case SCon{Chr{90}, t}:
      SCon{Chr{122}, Low.go(t)}
    case SCon{c, t}:
      SCon{c, Low.go(t)}

# s split at ASCII white space, empty words dropped
def Words.end(w: String, acc: List<&2, String>) -> List<&2, String>:
  match w:
    case SNil{}:
      acc
    case SCon{h, t}:
      String.reverse(SCon{h, t}) <> acc

def Words.go(s: String, w: String, acc: List<&2, String>) -> List<&2, String>:
  match s:
    case SNil{}:
      List.reverse(&2, String, Words.end(w, acc))
    case SCon{Chr{9}, t}:
      Words.go(t, SNil{}, Words.end(w, acc))
    case SCon{Chr{10}, t}:
      Words.go(t, SNil{}, Words.end(w, acc))
    case SCon{Chr{12}, t}:
      Words.go(t, SNil{}, Words.end(w, acc))
    case SCon{Chr{13}, t}:
      Words.go(t, SNil{}, Words.end(w, acc))
    case SCon{Chr{32}, t}:
      Words.go(t, SNil{}, Words.end(w, acc))
    case SCon{c, t}:
      Words.go(t, SCon{c, w}, acc)

def Spec.words(s: String) -> List<&2, String>:
  Words.go(s, SNil{}, [])

# splitting at blank characters: the word so far (reversed), the words
# before it (reversed)
type Ws is Data:
  Ws{w: String, acc: List<&2, String>}

def Wide.step(b: Bool, c: Char, w: String, acc: List<&2, String>) -> Ws:
  match b:
    case True{}:
      Ws{SNil{}, Words.end(w, acc)}
    case False{}:
      Ws{SCon{c, w}, acc}

def Wide.feed(st: Ws, c: Char) -> Ws:
  match st c:
    case Ws{w, acc} Chr{+x}:
      Wide.step(Wide.sp(x), Chr{x}, w, acc)

def Wide.fin(st: Ws) -> List<&2, String>:
  match st:
    case Ws{w, acc}:
      List.reverse(&2, String, Words.end(w, acc))

# s split at blank characters (Wide.sp), empty words dropped
def Wide.go(s: String, st: Ws) -> List<&2, String>:
  match s:
    case SNil{}:
      Wide.fin(st)
    case SCon{c, t}:
      Wide.go(t, Wide.feed(st, c))

# s as shown: each run of blank characters (Wide.sp) one space, the ends
# trimmed
def Spec.shown(s: String) -> String:
  String.join(Wide.go(s, Ws{SNil{}, []}), " ")

# s without its leading ASCII white space
def Trim.lead(s: String) -> String:
  match s:
    case SNil{}:
      SNil{}
    case SCon{Chr{9}, t}:
      Trim.lead(t)
    case SCon{Chr{10}, t}:
      Trim.lead(t)
    case SCon{Chr{12}, t}:
      Trim.lead(t)
    case SCon{Chr{13}, t}:
      Trim.lead(t)
    case SCon{Chr{32}, t}:
      Trim.lead(t)
    case SCon{c, t}:
      SCon{c, t}

# s without its leading and trailing ASCII white space
def Spec.trim(s: String) -> String:
  String.reverse(Trim.lead(String.reverse(Trim.lead(s))))

# how many times s is in xs
def Spec.count(xs: List<&2, String>, +s: String) -> Nat:
  match xs:
    case Nil{}:
      0n
    case Con{x, t}:
      Nat.add(Bool.pick(Nat, String.eq(x, s), 1n, 0n), Spec.count(t, s))

# s is in xs
def Spec.member(xs: List<&2, String>, +s: String) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{x, t}:
      String.eq(x, s) || Spec.member(t, s)

# pre begins s
def Spec.starts(pre: String, s: String) -> Bool:
  match pre s:
    case SNil{} s:
      True{}
    case SCon{Chr{a}, pt} SCon{Chr{b}, st}:
      U32.is_eq(a, b) && Spec.starts(pt, st)
    case SCon{p, pt} SNil{}:
      False{}

# Tags
# ----

def Spec.ids.at(m: Maybe<&2, String>, rest: List<&2, String>) -> List<&2, String>:
  match m:
    case None{}:
      rest
    case Some{v}:
      v <> rest

# the value of every id attribute of a page, in order
def Spec.ids(ts: List<&2, H.Tok>) -> List<&2, String>:
  match ts:
    case Nil{}:
      []
    case Con{H.TOpen{n, attrs}, t}:
      Spec.ids.at(Spec.attr(H.KId{}, attrs), Spec.ids(t))
    case Con{H.TShut{n}, t}:
      Spec.ids(t)
    case Con{H.TText{x}, t}:
      Spec.ids(t)
