# gildrb.com's laws: the HTML they read, how its tags nest
# ========================================================
#
# Html.toks reads a page (lexer.bend) and keeps it only when its tags nest
# so that a browser builds the tree the tags say, moving, cloning or
# dropping no element (a misnested "<a>" is cloned into what follows):
# every end tag closes the element opened last and not yet closed (same
# name); an element with no end tag (Html.void) is never open; the page
# ends with every element closed. A start tag a browser's tree builder
# treats on its own is refused where it would change the tree: any start
# tag before "<html>", a second "<html>"; "<head>" or "<body>" not right in
# "<html>"; in head, any element but title, meta, link, style or script,
# or text but white space; li not right in ul, ol or menu; dd or dt not right in dl; while
# a p is open, an element whose start tag ends a p (Html.closes_p); a, button,
# form or nobr inside one of its own; a heading inside a heading. Inside svg
# or math only svg, math and NOther elements open (any other is no HTML
# element there, breaks out of it, or is void in HTML only).

import Base
import ./tokens.bend as H
import ./lexer.bend as X

# Terms
# -----

def Name.num(n: H.Name) -> Nat:
  match n:
    case H.NA{}:
      0n
    case H.NBody{}:
      1n
    case H.NDiv{}:
      2n
    case H.NH1{}:
      3n
    case H.NH2{}:
      4n
    case H.NH3{}:
      5n
    case H.NH4{}:
      6n
    case H.NH5{}:
      7n
    case H.NH6{}:
      8n
    case H.NLink{}:
      9n
    case H.NNav{}:
      10n
    case H.NSvg{}:
      11n
    case H.NMath{}:
      12n
    case H.NScript{}:
      13n
    case H.NStyle{}:
      14n
    case H.NTitle{}:
      15n
    case H.NTextarea{}:
      16n
    case H.NHtml{}:
      17n
    case H.NHead{}:
      18n
    case H.NP{}:
      19n
    case H.NLi{}:
      20n
    case H.NDd{}:
      21n
    case H.NDt{}:
      22n
    case H.NDl{}:
      23n
    case H.NUl{}:
      24n
    case H.NOl{}:
      25n
    case H.NMenu{}:
      26n
    case H.NButton{}:
      27n
    case H.NForm{}:
      28n
    case H.NNobr{}:
      29n
    case H.NHr{}:
      30n
    case H.NVoid{t}:
      31n
    case H.NBlock{t}:
      32n
    case H.NBreak{t}:
      33n
    case H.NBanned{}:
      34n
    case H.NOther{t}:
      35n
    case H.NImg{}:
      36n
    case H.NMeta{}:
      37n

def Name.tag(n: H.Name) -> String:
  match n:
    case H.NVoid{t}:
      t
    case H.NBlock{t}:
      t
    case H.NBreak{t}:
      t
    case H.NOther{t}:
      t
    case _:
      ""

# two names are one element's
def Name.eq(+a: H.Name, +b: H.Name) -> Bool:
  Nat.is_eq(Name.num(a), Name.num(b)) && String.eq(Name.tag(a), Name.tag(b))

# a start tag that ends an open p
def Html.closes_p(n: H.Name) -> Bool:
  match n:
    case H.NDiv{}:
      True{}
    case H.NNav{}:
      True{}
    case H.NH1{}:
      True{}
    case H.NH2{}:
      True{}
    case H.NH3{}:
      True{}
    case H.NH4{}:
      True{}
    case H.NH5{}:
      True{}
    case H.NH6{}:
      True{}
    case H.NP{}:
      True{}
    case H.NLi{}:
      True{}
    case H.NDd{}:
      True{}
    case H.NDt{}:
      True{}
    case H.NDl{}:
      True{}
    case H.NUl{}:
      True{}
    case H.NOl{}:
      True{}
    case H.NMenu{}:
      True{}
    case H.NForm{}:
      True{}
    case H.NHr{}:
      True{}
    case H.NBlock{t}:
      True{}
    case _:
      False{}

def Html.heading(n: H.Name) -> Bool:
  match n:
    case H.NH1{}:
      True{}
    case H.NH2{}:
      True{}
    case H.NH3{}:
      True{}
    case H.NH4{}:
      True{}
    case H.NH5{}:
      True{}
    case H.NH6{}:
      True{}
    case _:
      False{}

# an element a browser closes when one of its own starts inside it
def Html.alone(n: H.Name) -> Bool:
  match n:
    case H.NA{}:
      True{}
    case H.NButton{}:
      True{}
    case H.NForm{}:
      True{}
    case H.NNobr{}:
      True{}
    case _:
      False{}

# an element that may open inside svg or math
def Html.foreign(n: H.Name) -> Bool:
  match n:
    case H.NOther{t}:
      True{}
    case H.NSvg{}:
      True{}
    case H.NMath{}:
      True{}
    case _:
      False{}

def Foreign.num(n: H.Name) -> Nat:
  match n:
    case H.NSvg{}:
      1n
    case H.NMath{}:
      1n
    case _:
      0n

# Open elements
# -------------

# st: the open elements, the last opened first
def Open.has(st: List<&2, H.Name>, +n: H.Name) -> Bool:
  match st:
    case Nil{}:
      False{}
    case Con{x, t}:
      Name.eq(x, n) || Open.has(t, n)

def Open.heading(st: List<&2, H.Name>) -> Bool:
  match st:
    case Nil{}:
      False{}
    case Con{x, t}:
      Html.heading(x) || Open.heading(t)

def Parent.list(top: H.Name) -> Bool:
  match top:
    case H.NUl{}:
      True{}
    case H.NOl{}:
      True{}
    case H.NMenu{}:
      True{}
    case _:
      False{}

def Parent.dl(top: H.Name) -> Bool:
  match top:
    case H.NDl{}:
      True{}
    case _:
      False{}

def Parent.html(top: H.Name) -> Bool:
  match top:
    case H.NHtml{}:
      True{}
    case _:
      False{}

# what may open in head (any other start tag ends it, and a browser opens
# the body)
def Head.ok(n: H.Name) -> Bool:
  match n:
    case H.NLink{}:
      True{}
    case H.NTitle{}:
      True{}
    case H.NStyle{}:
      True{}
    case H.NScript{}:
      True{}
    case H.NMeta{}:
      True{}
    case _:
      False{}

# n may open right inside top, top not head
def Parent.kid(n: H.Name, top: H.Name) -> Bool:
  match n:
    case H.NLi{}:
      Parent.list(top)
    case H.NDd{}:
      Parent.dl(top)
    case H.NDt{}:
      Parent.dl(top)
    case H.NHead{}:
      Parent.html(top)
    case H.NBody{}:
      Parent.html(top)
    case H.NHtml{}:
      False{}
    case _:
      True{}

# n may open right inside top
def Parent.of(n: H.Name, top: H.Name) -> Bool:
  match top:
    case H.NHead{}:
      Head.ok(n)
    case t:
      Parent.kid(n, t)

# n may open with st open; with none open, only html
def Parent.ok(n: H.Name, st: List<&2, H.Name>) -> Bool:
  match st:
    case Nil{}:
      Parent.html(n)
    case Con{top, t}:
      Parent.of(n, top)

# an HTML start tag n, with st open, builds the tree it says
def Open.ok(+n: H.Name, +st: List<&2, H.Name>) -> Bool:
  Parent.ok(n, st) && Bool.not(Html.closes_p(n) && Open.has(st, H.NP{})) && Bool.not(Html.alone(n) && Open.has(st, n)) && Bool.not(Html.heading(n) && Open.heading(st))

def Open.push(+n: H.Name, +st: List<&2, H.Name>) -> List<&2, H.Name>:
  Bool.pick(List<&2, H.Name>, H.Html.void(n), st, n <> st)

# Tree
# ----

# the open elements, the last opened first, and how many are svg or math
type Nest is Data:
  Nest{st: List<&2, H.Name>, d: Nat}

def Nest.if(b: Bool, n: Nest) -> Maybe<&2, Nest>:
  match b:
    case True{}:
      Some{n}
    case False{}:
      None{}

def Tree.open(html: Bool, +n: H.Name, +st: List<&2, H.Name>, d: Nat) -> Maybe<&2, Nest>:
  match html:
    case True{}:
      Nest.if(Open.ok(n, st), Nest{Open.push(n, st), Nat.add(d, Foreign.num(n))})
    case False{}:
      Nest.if(Html.foreign(n), Nest{n <> st, Nat.add(d, Foreign.num(n))})

def Tree.shut(st: List<&2, H.Name>, +n: H.Name, d: Nat) -> Maybe<&2, Nest>:
  match st:
    case Nil{}:
      None{}
    case Con{top, rest}:
      Nest.if(Name.eq(top, n), Nest{rest, Nat.sub(d, Foreign.num(n))})

# text in head is white space only (any other ends it, and a browser opens
# the body)
def Head.text(st: List<&2, H.Name>, s: String) -> Bool:
  match st:
    case Con{H.NHead{}, t}:
      H.Blank.is(s)
    case _:
      True{}

# one token on: None where it would not build the tree it says
def Tree.step(x: H.Tok, +st: List<&2, H.Name>, +d: Nat) -> Maybe<&2, Nest>:
  match x:
    case H.TOpen{n, a}:
      Tree.open(Nat.is_eq(d, 0n), n, st, d)
    case H.TShut{n}:
      Tree.shut(st, n, d)
    case H.TText{s}:
      Nest.if(Head.text(st, s), Nest{st, d})

# ts nest, and every element is closed at the end
def Tree.go(ts: List<&2, H.Tok>, m: Maybe<&2, Nest>) -> Bool:
  match ts m:
    case ts None{}:
      False{}
    case Nil{} Some{Nest{st, d}}:
      List.is_empty(&2, H.Name, st)
    case Con{x, t} Some{Nest{st, d}}:
      Tree.go(t, Tree.step(x, st, d))

def Tree.check(b: Bool, ts: List<&2, H.Tok>) -> Maybe<&2, List<&2, H.Tok>>:
  match b:
    case True{}:
      Some{ts}
    case False{}:
      None{}

def Tree.of(m: Maybe<&2, List<&2, H.Tok>>) -> Maybe<&2, List<&2, H.Tok>>:
  match m:
    case None{}:
      None{}
    case Some{+ts}:
      Tree.check(Tree.go(ts, Some{Nest{[], 0n}}), ts)

# a page's tags and text, in order; None where a browser could read it
# another way or build another tree
def Html.toks(cs: List<&2, String>) -> Maybe<&2, List<&2, H.Tok>>:
  Tree.of(X.Lx.fin(X.Lx.all(cs, X.Run{X.LxText{SNil{}}, []})))
