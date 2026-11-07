# gildrb.com's laws: internal links (R10), references
# ===================================================
#
# Terms of ../links.bend, which states the laws.

import Base
import ../base/html/tokens.bend as H
import ../base/page.bend as Laws
import ../../build/site.bend as S

# Terms: a reference
# ------------------

# key: the path without "/", query and fragment, dots removed; frag: the
# text after the first "#", if any. LkBadRef: a URL not in canonical form
type LRef is Data:
  LkRef{key: String, frag: Maybe<&2, String>}
  LkBadRef{}

# a value read as a URL: on another site, a path ("/..."), relative, or
# an absolute URL not in canonical form (LkBad)
type LUrl is Data:
  LkExt{}
  LkAbs{path: String}
  LkRel{s: String}
  LkBad{}

# c in lower case (ASCII letters; Base's Char.to_lower multiplies 32-bit
# words, too costly per character under --verdict)
def Pre.low(c: Char) -> Char:
  match c:
    case Chr{65}:
      Chr{97}
    case Chr{66}:
      Chr{98}
    case Chr{67}:
      Chr{99}
    case Chr{68}:
      Chr{100}
    case Chr{69}:
      Chr{101}
    case Chr{70}:
      Chr{102}
    case Chr{71}:
      Chr{103}
    case Chr{72}:
      Chr{104}
    case Chr{73}:
      Chr{105}
    case Chr{74}:
      Chr{106}
    case Chr{75}:
      Chr{107}
    case Chr{76}:
      Chr{108}
    case Chr{77}:
      Chr{109}
    case Chr{78}:
      Chr{110}
    case Chr{79}:
      Chr{111}
    case Chr{80}:
      Chr{112}
    case Chr{81}:
      Chr{113}
    case Chr{82}:
      Chr{114}
    case Chr{83}:
      Chr{115}
    case Chr{84}:
      Chr{116}
    case Chr{85}:
      Chr{117}
    case Chr{86}:
      Chr{118}
    case Chr{87}:
      Chr{119}
    case Chr{88}:
      Chr{120}
    case Chr{89}:
      Chr{121}
    case Chr{90}:
      Chr{122}
    case _:
      c

# the rest of s after pre, s read in ASCII lower case (pre is lower case);
# None when pre does not begin s
def Pre.cut(pre: String, s: String) -> Maybe<&2, String>:
  match pre s:
    case SNil{} s:
      Some{s}
    case SCon{a, pt} SNil{}:
      None{}
    case SCon{a, pt} SCon{c, st}:
      Bool.pick(Maybe<&2, String>, Char.is_eq(a, Pre.low(c)), Pre.cut(pt, st), None{})

# the rest of s after pre, case-sensitive; None when pre does not begin s
def Pre.exact(pre: String, s: String) -> Maybe<&2, String>:
  match pre s:
    case SNil{} s:
      Some{s}
    case SCon{a, pt} SNil{}:
      None{}
    case SCon{a, pt} SCon{c, st}:
      Bool.pick(Maybe<&2, String>, Char.is_eq(a, c), Pre.exact(pt, st), None{})

# Terms: canonical absolute URLs
# ------------------------------

def Host.sym(c: Char) -> Bool:
  match c:
    case Chr{45}:
      True{}
    case Chr{46}:
      True{}
    case _:
      False{}

# a character a canonical host holds: a-z, 0-9, "-" or "."
def Host.ch(+c: Char) -> Bool:
  Char.is_lower(c) || Char.is_digit(c) || Host.sym(c)

# a canonical authority: its host, and what follows it (the end, or "/",
# "?" or "#" and the rest)
type LAuth is Data:
  LkAuth{host: String, rest: String}
  LkNoAuth{}

# h: the host so far, reversed; a host is not empty and does not end in "."
def Auth.fin(h: String, rest: String) -> LAuth:
  match h:
    case SNil{}:
      LkNoAuth{}
    case SCon{Chr{46}, t}:
      LkNoAuth{}
    case SCon{c, t}:
      LkAuth{String.reverse(SCon{c, t}), rest}

# s after "//": a canonical authority is a host of Host.ch characters only
# (no upper case, userinfo "@", port ":" or "%"), up to the end, "/", "?"
# or "#"
def Auth.go(s: String, h: String) -> LAuth:
  match s:
    case SNil{}:
      Auth.fin(h, "")
    case SCon{Chr{47}, t}:
      Auth.fin(h, SCon{Chr{47}, t})
    case SCon{Chr{63}, t}:
      Auth.fin(h, SCon{Chr{63}, t})
    case SCon{Chr{35}, t}:
      Auth.fin(h, SCon{Chr{35}, t})
    case SCon{+c, t}:
      Bool.pick(LAuth, Host.ch(c), Auth.go(t, SCon{c, h}), LkNoAuth{})

# the path a canonical URL on gildrb.com names
def Auth.path(rest: String) -> String:
  match rest:
    case SNil{}:
      "/"
    case SCon{Chr{47}, t}:
      SCon{Chr{47}, t}
    case SCon{c, t}:
      SCon{Chr{47}, SCon{c, t}}

# a canonical authority: on gildrb.com exactly, a path; another host,
# another site; none, not in canonical form
def Auth.url(a: LAuth) -> LUrl:
  match a:
    case LkNoAuth{}:
      LkBad{}
    case LkAuth{host, rest}:
      Bool.pick(LUrl, String.eq(host, "gildrb.com"), LkAbs{Auth.path(rest)}, LkExt{})

# a character a URL scheme may hold after its first letter
def Sch.sym(c: Char) -> Bool:
  match c:
    case Chr{43}:
      True{}
    case Chr{45}:
      True{}
    case Chr{46}:
      True{}
    case _:
      False{}

def Sch.ok(+c: Char) -> Bool:
  Char.is_alpha(c) || Char.is_digit(c) || Sch.sym(c)

def Sch.rest(s: String) -> Bool:
  match s:
    case SNil{}:
      False{}
    case SCon{Chr{58}, t}:
      True{}
    case SCon{c, t}:
      Sch.ok(c) && Sch.rest(t)

# s begins with a scheme: a letter, letters, digits, "+", "-" or ".", ":"
def Sch.is(s: String) -> Bool:
  match s:
    case SNil{}:
      False{}
    case SCon{c, t}:
      Char.is_alpha(c) && Sch.rest(t)

# a value with a scheme (b): "http:" or "https:" in any case (web) is not
# in canonical form here (Url.cls has read lower-case "https://" and
# "http://" before: here the scheme is in another case, or "//" is
# missing, as "https:/x"); any other scheme (mailto:, tel:, data:,
# javascript:, ...) is another site and is not checked
def Url.sch(b: Bool, web: Bool, v: String) -> LUrl:
  match b:
    case True{}:
      Bool.pick(LUrl, web, LkBad{}, LkExt{})
    case False{}:
      LkRel{v}

# s begins with "http:" or "https:", in any case
def Url.web(+s: String) -> Bool:
  Maybe.is_some(&2, String, Pre.cut("https:", s)) || Maybe.is_some(&2, String, Pre.cut("http:", s))

# a value without "https://", "http://" or "//": "/x" a path, a scheme
# (Url.sch), anything else relative
def Url.slash(v: String) -> LUrl:
  match v:
    case SNil{}:
      LkRel{""}
    case SCon{Chr{47}, t}:
      LkAbs{SCon{Chr{47}, t}}
    case SCon{+c, +t}:
      Url.sch(Sch.is(SCon{c, t}), Url.web(SCon{c, t}), SCon{c, t})

def Url.abs(r: String) -> LUrl:
  Auth.url(Auth.go(r, ""))

def Url.h3(m: Maybe<&2, String>, v: String) -> LUrl:
  match m:
    case Some{r}:
      Url.abs(r)
    case None{}:
      Url.slash(v)

def Url.h2(m: Maybe<&2, String>, m3: Maybe<&2, String>, v: String) -> LUrl:
  match m:
    case Some{r}:
      Url.abs(r)
    case None{}:
      Url.h3(m3, v)

def Url.h1(m: Maybe<&2, String>, m2: Maybe<&2, String>, m3: Maybe<&2, String>, v: String) -> LUrl:
  match m:
    case Some{r}:
      Url.abs(r)
    case None{}:
      Url.h2(m2, m3, v)

# a value (trimmed) read as a URL: "https://", "http://" (exactly, lower
# case) or "//", then a canonical authority (Auth.go); else as Url.slash
# reads it. v is copied once, the prefixes are tried lazily
def Url.cls(+v: String) -> LUrl:
  Url.h1(Pre.exact("https://", v), Pre.exact("http://", v), Pre.exact("//", v), v)

# s up to and including its last "/", reversed: the directory
def Dir.cut(s: String) -> String:
  match s:
    case SNil{}:
      SNil{}
    case SCon{Chr{47}, t}:
      SCon{Chr{47}, t}
    case SCon{c, t}:
      Dir.cut(t)

def Dir.of(s: String) -> String:
  String.reverse(Dir.cut(String.reverse(s)))

# a relative reference s in the file at self, as a path: "", "#f" and
# "?q" are the file itself; anything else is in the file's directory
def Rel.join(+self: String, s: String) -> String:
  match s:
    case SNil{}:
      SCon{Chr{47}, self}
    case SCon{Chr{35}, t}:
      String.append(SCon{Chr{47}, self}, SCon{Chr{35}, t})
    case SCon{Chr{63}, t}:
      String.append(SCon{Chr{47}, self}, SCon{Chr{63}, t})
    case SCon{c, t}:
      String.append(SCon{Chr{47}, Dir.of(self)}, SCon{c, t})

# the path an internal reference names; None when it is not internal or
# not in canonical form
def Url.path(+self: String, u: LUrl) -> Maybe<&2, String>:
  match u:
    case LkExt{}:
      None{}
    case LkAbs{p}:
      Some{p}
    case LkRel{s}:
      Some{Rel.join(self, s)}
    case LkBad{}:
      None{}

# the path before the query and the fragment
def Cut.path(s: String) -> String:
  match s:
    case SNil{}:
      SNil{}
    case SCon{Chr{63}, t}:
      SNil{}
    case SCon{Chr{35}, t}:
      SNil{}
    case SCon{c, t}:
      SCon{c, Cut.path(t)}

# the text after the first "#"
def Cut.frag(s: String) -> Maybe<&2, String>:
  match s:
    case SNil{}:
      None{}
    case SCon{Chr{35}, t}:
      Some{t}
    case SCon{c, t}:
      Cut.frag(t)

# Terms: dot segments (RFC 3986 remove_dot_segments)
# --------------------------------------------------

type LDot is Data:
  LkSeg{}
  LkOne{}
  LkTwo{}

def Dot.k2(u: String) -> LDot:
  match u:
    case SNil{}:
      LkTwo{}
    case SCon{c, w}:
      LkSeg{}

def Dot.k1(t: String) -> LDot:
  match t:
    case SNil{}:
      LkOne{}
    case SCon{Chr{46}, u}:
      Dot.k2(u)
    case SCon{c, u}:
      LkSeg{}

# a segment is ".", ".." or a name
def Dot.kind(s: String) -> LDot:
  match s:
    case SNil{}:
      LkSeg{}
    case SCon{Chr{46}, t}:
      Dot.k1(t)
    case SCon{c, t}:
      LkSeg{}

def Dot.pop(st: List<&2, String>) -> List<&2, String>:
  match st:
    case Nil{}:
      []
    case Con{h, t}:
      t

def Dot.last(t: List<&2, String>) -> Bool:
  match t:
    case Nil{}:
      True{}
    case Con{h, r}:
      False{}

# one segment onto the segments so far (reversed): "." stays, ".." takes
# the last one off; either, as the last segment, leaves a trailing "/"
def Dot.push(k: LDot, s: String, last: Bool, +st: List<&2, String>) -> List<&2, String>:
  match k:
    case LkSeg{}:
      s <> st
    case LkOne{}:
      Bool.pick(List<&2, String>, last, "" <> st, st)
    case LkTwo{}:
      Bool.pick(List<&2, String>, last, "" <> Dot.pop(st), Dot.pop(st))

def Dot.go(segs: List<&2, String>, st: List<&2, String>) -> List<&2, String>:
  match segs:
    case Nil{}:
      st
    case Con{+s, +t}:
      Dot.go(t, Dot.push(Dot.kind(s), s, Dot.last(t), st))

def Dot.full(p: String) -> String:
  match p:
    case SNil{}:
      ""
    case SCon{Chr{47}, t}:
      String.join(List.reverse(&2, String, Dot.go(String.split(t, '/'), [])), "/")
    case SCon{c, t}:
      String.join(List.reverse(&2, String, Dot.go(String.split(SCon{c, t}, '/'), [])), "/")

# a "." begins a segment (slash: the character before is "/")
def Dot.any(s: String, slash: Bool) -> Bool:
  match s:
    case SNil{}:
      False{}
    case SCon{Chr{46}, t}:
      slash || Dot.any(t, False{})
    case SCon{Chr{47}, t}:
      Dot.any(t, True{})
    case SCon{c, t}:
      Dot.any(t, False{})

def Dot.tail(p: String) -> String:
  match p:
    case SCon{Chr{47}, t}:
      t
    case _:
      p

# a path ("/a/./b/../c") as a key ("a/c"); with no dot segment, the path
# without its "/"
def Dot.key(+p: String) -> String:
  Bool.pick(String, Dot.any(p, True{}), Dot.full(p), Dot.tail(p))

# the reference a path names
def Ref.of(+p: String) -> LRef:
  LkRef{Dot.key(Cut.path(p)), Cut.frag(p)}

# a value in the file at self: none for another site, its reference when
# internal, LkBadRef when it is not in canonical form (Frag.ok fails it)
def Ref.at(+self: String, u: LUrl, rest: List<&2, LRef>) -> List<&2, LRef>:
  match u:
    case LkExt{}:
      rest
    case LkAbs{p}:
      Ref.of(p) <> rest
    case LkRel{s}:
      Ref.of(Rel.join(self, s)) <> rest
    case LkBad{}:
      LkBadRef{} <> rest

def Ref.one(+self: String, v: String, rest: List<&2, LRef>) -> List<&2, LRef>:
  Ref.at(self, Url.cls(Laws.Spec.trim(v)), rest)

def Ref.many(+self: String, vs: List<&2, String>, rest: List<&2, LRef>) -> List<&2, LRef>:
  match vs:
    case Nil{}:
      rest
    case Con{v, t}:
      Ref.one(self, v, Ref.many(self, t, rest))

def Ref.keys(rs: List<&2, LRef>) -> List<&2, String>:
  match rs:
    case Nil{}:
      []
    case Con{LkRef{k, f}, t}:
      k <> Ref.keys(t)
    case Con{LkBadRef{}, t}:
      Ref.keys(t)
