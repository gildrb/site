# gildrb.com's laws: every page (R3, R4)
# ======================================
#
# The terms shared by every area are in base/page.bend; LAWS.bend lists
# the requirements.

import Base
import ./base/html/tokens.bend as H
import ./base/html/tree.bend as T
import ./base/page.bend as Laws

# Terms: headings (R3)
# --------------------

# a heading's rank: h1 is 1, ..., h6 is 6; any other element 0
def Rank.of(n: H.Name) -> Nat:
  match n:
    case H.NH1{}:
      1n
    case H.NH2{}:
      2n
    case H.NH3{}:
      3n
    case H.NH4{}:
      4n
    case H.NH5{}:
      5n
    case H.NH6{}:
      6n
    case _:
      0n

# a heading of rank k after one of rank prev (0: none yet) skips no rank:
# k <= prev+1, so the first heading is an h1
def Rank.next(+k: Nat, +prev: Nat) -> Bool:
  Nat.is_le(k, 1n+prev)

# a heading of rank k (0: no heading) leaves prev as k, and counts an h1
def Heads.prev(+k: Nat, +prev: Nat) -> Nat:
  Bool.pick(Nat, Nat.is_eq(k, 0n), prev, k)

def Heads.h1(+k: Nat, +h1s: Nat) -> Nat:
  Bool.pick(Nat, Nat.is_eq(k, 1n), 1n+h1s, h1s)

def Heads.ok(+k: Nat, +prev: Nat) -> Bool:
  Nat.is_eq(k, 0n) || Rank.next(k, prev)

# the start tags in order: each heading (rank k > 0) skips no rank and
# becomes prev; at the end, h1s (how many h1 start tags) is 1
def Heads.go(ts: List<&2, H.Tok>, +prev: Nat, +h1s: Nat) -> Bool:
  match ts:
    case Nil{}:
      Nat.is_eq(h1s, 1n)
    case Con{H.TOpen{+n, a}, t}:
      Heads.ok(Rank.of(n), prev) && Heads.go(t, Heads.prev(Rank.of(n), prev), Heads.h1(Rank.of(n), h1s))
    case Con{x, t}:
      Heads.go(t, prev, h1s)

def Heads.of(m: Maybe<&2, List<&2, H.Tok>>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{ts}:
      Heads.go(ts, 0n, 0n)

# a page's headings are in order (R3)
def Spec.headings(text: List<&2, String>) -> Bool:
  Heads.of(T.Html.toks(text))

# Terms: the page's language (R4)
# -------------------------------

# the first html start tag has a lang attribute that is not blank
# (Laws.Wide.blank)
def Lang.go(ts: List<&2, H.Tok>) -> Bool:
  match ts:
    case Nil{}:
      False{}
    case Con{H.TOpen{H.NHtml{}, attrs}, t}:
      Laws.Spec.filled(Laws.Spec.attr(H.KLang{}, attrs))
    case Con{x, t}:
      Lang.go(t)

def Lang.of(m: Maybe<&2, List<&2, H.Tok>>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{ts}:
      Lang.go(ts)

# a page names its language (R4)
def Spec.lang(text: List<&2, String>) -> Bool:
  Lang.of(T.Html.toks(text))

# both, from one lexing, computed once per page by the proof (proof/pages/)
def Both.of(+m: Maybe<&2, List<&2, H.Tok>>) -> Bool:
  Heads.of(m) && Lang.of(m)

def Spec.both(text: List<&2, String>) -> Bool:
  Both.of(T.Html.toks(text))

# Laws
# ----

# LAW headings: on every HTML page of the site, taking the h1..h6 start
# tags in document order, there is exactly one h1, the first heading is
# an h1, and a heading h_m right after a heading h_n has m <= n+1 (no rank
# skipped going down; going up any number is allowed). A page a browser
# could read another way, or build another tree, fails (base/html/).
# NOT checked: the headings' text (an empty heading passes), headings
# hidden by CSS or the hidden attribute, and where in the page the h1 is
# (only that no heading precedes it). (R3)
law headings:
  for +path: String
  for +text: List<&2, String>
  for at: {Laws.Spec.page(path) == Some{text} : Maybe<&2, List<&2, String>>}
  {Spec.headings(text) == True{} : Bool}

# LAW lang: on every HTML page of the site, the first html start tag has
# a lang attribute (the first one, if repeated) whose value, references
# decoded, is not blank (Laws.Wide.blank: only ASCII white space, U+00A0,
# U+1680, U+2000-U+200B, U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF);
# a page with no html start tag fails, as does a page
# the lexer refuses (base/html/). NOT checked: that the value is a valid
# BCP 47 tag or the page's real language, or lang on other elements. (R4)
law lang:
  for +path: String
  for +text: List<&2, String>
  for at: {Laws.Spec.page(path) == Some{text} : Maybe<&2, List<&2, String>>}
  {Spec.lang(text) == True{} : Bool}

# LAW home_page: the site has the homepage, index.html, among its HTML
# pages. The witness for headings, lang and a11y, which quantify over the
# pages that exist: with no page at all they would hold vacuously. NOT
# checked: anything about the page's content (the other laws do that).
law home_page:
  exs text: List<&2, String>
  {Laws.Spec.page("index.html") == Some{text} : Maybe<&2, List<&2, String>>}
