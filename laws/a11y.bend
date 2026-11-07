# gildrb.com's laws: accessible images and controls (R7)
# ======================================================
#
# The terms shared by every area are in base/page.bend; LAWS.bend lists
# the requirements.

import Base
import ./base/html/tokens.bend as H
import ./base/html/refs.bend as R
import ./base/html/tree.bend as T
import ./base/page.bend as Laws

# Terms
# -----

# what a page's images and controls ask of it: Miss, an img with no alt
# or a control with no name; Refs, a control named only by its
# aria-labelledby, whose ids must all be on the page
type Ask is Data:
  Miss{}
  Refs{ids: List<&2, String>}

# text a reader is shown (references already decoded): not blank
# (Laws.Wide.blank, base/page.bend)
def Name.text(s: String) -> Bool:
  Bool.not(Laws.Wide.blank(s))

# an attribute value (decoded by the lexer) is there and not blank
def Name.val(m: Maybe<&2, String>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{v}:
      Name.text(v)

# an element inside a control that names it by itself: an img with a
# non-blank alt, an svg with a non-blank aria-label
def Name.own(n: H.Name, attrs: List<&2, H.Attr>) -> Bool:
  match n:
    case H.NImg{}:
      Name.val(Laws.Spec.attr(H.KAlt{}, attrs))
    case H.NSvg{}:
      Name.val(Laws.Spec.attr(H.KLabel{}, attrs))
    case _:
      False{}

# the ids an aria-labelledby names
def Lab.ids(m: Maybe<&2, String>) -> List<&2, String>:
  match m:
    case None{}:
      []
    case Some{v}:
      Laws.Spec.words(v)

# a control named (named) or else named only by the ids w: nothing asked,
# Refs{w}, or Miss when w is empty
def Ask.of(named: Bool, w: List<&2, String>, rest: List<&2, Ask>) -> List<&2, Ask>:
  match named:
    case True{}:
      rest
    case False{}:
      match w:
        case Nil{}:
          Miss{} <> rest
        case Con{x, xt}:
          Refs{x <> xt} <> rest

# an img: Miss unless it has an alt (alt="" or a bare alt too)
def Ask.img(alt: Bool, rest: List<&2, Ask>) -> List<&2, Ask>:
  match alt:
    case True{}:
      rest
    case False{}:
      Miss{} <> rest

# an open a or button while its content is read, from its start tag to
# its end tag. h: how many elements with the hidden attribute, or inside
# one, are open since its start tag (0: what comes is shown); named: it
# has a name already (an a with no href starts named: it asks nothing);
# w: the ids its aria-labelledby names; ok: no text inside it so far has
# a character reference refs.bend refuses
type Fr is Data:
  Fr{h: Nat, named: Bool, w: List<&2, String>, ok: Bool}

# aria-hidden="true" (the value trimmed of ASCII white space, ASCII
# lower case): the element and what is in it are hidden from assistive
# technology
def Aria.hid(m: Maybe<&2, String>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{v}:
      String.eq(Laws.Spec.trim(Laws.Low.go(v)), "true")

# an element hidden from a reader: the hidden attribute or aria-hidden
def Hid.is(+attrs: List<&2, H.Attr>) -> Bool:
  Laws.Spec.has(H.KHidden{}, attrs) || Aria.hid(Laws.Spec.attr(H.KAriaHidden{}, attrs))

# a control's frame at its start tag: named by a non-blank aria-label or
# a non-blank title (counts: it is a control at all; ok: it is not hidden
# from assistive technology, Ah.ok)
def Fr.new(counts: Bool, ok: Bool, +attrs: List<&2, H.Attr>) -> Fr:
  Fr{0n, Bool.not(counts) || Name.val(Laws.Spec.attr(H.KLabel{}, attrs)) || Name.val(Laws.Spec.attr(H.KTitle{}, attrs)), Lab.ids(Laws.Spec.attr(H.KLabelled{}, attrs)), ok}

# text inside, its references decoded (d; None: one is refused, which
# fails the control): shown text that is not blank names the control
def Fr.text(d: Maybe<&2, String>, h: Nat, named: Bool, w: List<&2, String>, ok: Bool) -> Fr:
  match d h:
    case None{} h:
      Fr{h, named, w, False{}}
    case Some{s} 0n:
      Fr{0n, named || Name.text(s), w, ok}
    case Some{s} 1n+p:
      Fr{1n+p, named, w, ok}

# an end tag inside: it closes a hidden element if one is open
def Fr.shut(h: Nat, named: Bool, w: List<&2, String>, ok: Bool) -> Fr:
  match h:
    case 0n:
      Fr{0n, named, w, ok}
    case 1n+p:
      Fr{p, named, w, ok}

# a start tag inside: a shown one names the control by itself
# (Name.own) unless it has the hidden attribute or aria-hidden="true";
# one with an end tag (not void) opens hiding if it has either or is
# inside a hidden element
def Fr.open(h: Nat, named: Bool, +n: H.Name, +attrs: List<&2, H.Attr>, w: List<&2, String>, ok: Bool) -> Fr:
  match h:
    case 0n:
      +hid = Hid.is(attrs)
      Fr{Bool.pick(Nat, hid && Bool.not(H.Html.void(n)), 1n, 0n), named || (Bool.not(hid) && Name.own(n, attrs)), w, ok}
    case 1n+p:
      Fr{Nat.add(Bool.pick(Nat, H.Html.void(n), 0n, 1n), 1n+p), named, w, ok}

# a frame after one more token of its content
def Fr.step(f: Fr, +x: H.Tok) -> Fr:
  match f:
    case Fr{h, named, w, ok}:
      match x:
        case H.TText{s}:
          Fr.text(R.Cr.dec(s), h, named, w, ok)
        case H.TShut{n}:
          Fr.shut(h, named, w, ok)
        case H.TOpen{n, attrs}:
          Fr.open(h, named, n, attrs, w, ok)

# every open control's frame after one more token
def Frs.step(fs: List<&2, Fr>, +x: H.Tok) -> List<&2, Fr>:
  match fs:
    case Nil{}:
      []
    case Con{f, t}:
      Fr.step(f, x) <> Frs.step(t, x)

# a frame whose text had a refused reference (ok False) asks Miss
def Ask.if(ok: Bool, named: Bool, w: List<&2, String>, acc: List<&2, Ask>) -> List<&2, Ask>:
  match ok:
    case True{}:
      Ask.of(named, w, acc)
    case False{}:
      Miss{} <> acc

# at a control's end tag, what its frame (the innermost) asks
def Frs.ask(fs: List<&2, Fr>, acc: List<&2, Ask>) -> List<&2, Ask>:
  match fs:
    case Nil{}:
      acc
    case Con{Fr{h, named, w, ok}, t}:
      Ask.if(ok, named, w, acc)

def Frs.tail(fs: List<&2, Fr>) -> List<&2, Fr>:
  match fs:
    case Nil{}:
      []
    case Con{f, t}:
      t

# the page's aria-hidden depth after one more token: 0 outside every
# element with aria-hidden="true"; inside one, how many elements are open
# since (and including) it
def Ah.open(ah: Nat, +n: H.Name, +attrs: List<&2, H.Attr>) -> Nat:
  match ah:
    case 0n:
      Bool.pick(Nat, Aria.hid(Laws.Spec.attr(H.KAriaHidden{}, attrs)) && Bool.not(H.Html.void(n)), 1n, 0n)
    case 1n+p:
      Nat.add(Bool.pick(Nat, H.Html.void(n), 0n, 1n), 1n+p)

def Ah.step(ah: Nat, x: H.Tok) -> Nat:
  match x:
    case H.TOpen{n, attrs}:
      Ah.open(ah, n, attrs)
    case H.TShut{n}:
      Nat.sub(ah, 1n)
    case H.TText{s}:
      ah

# a control (counts) is not hidden from assistive technology: neither it
# nor an element it is in has aria-hidden="true"
def Ah.ok(ah: Nat, counts: Bool, +attrs: List<&2, H.Attr>) -> Bool:
  match ah:
    case 0n:
      Bool.not(counts && Aria.hid(Laws.Spec.attr(H.KAriaHidden{}, attrs)))
    case 1n+p:
      Bool.not(counts)

# what every img, a with an href, and button of a page asks (acc), read
# in one pass: fs holds a frame for each a and button open, innermost
# first; ah: the page's aria-hidden depth (Ah.step). The tokens nest
# (tree.bend) and an a or button never opens inside one of its own, so
# an a or button end tag closes the innermost frame, every frame is
# closed by the page's end, and a control's frame sees exactly the tokens
# between its start and end tags.
def Spec.asks(ts: List<&2, H.Tok>, +ah: Nat, +fs: List<&2, Fr>, acc: List<&2, Ask>) -> List<&2, Ask>:
  match ts:
    case Nil{}:
      acc
    case Con{H.TOpen{H.NImg{}, +attrs}, t}:
      Spec.asks(t, Ah.open(ah, H.NImg{}, attrs), Frs.step(fs, H.TOpen{H.NImg{}, attrs}), Ask.img(Laws.Spec.has(H.KAlt{}, attrs), acc))
    case Con{H.TOpen{H.NA{}, +attrs}, t}:
      +href = Laws.Spec.has(H.KHref{}, attrs)
      Spec.asks(t, Ah.open(ah, H.NA{}, attrs), Fr.new(href, Ah.ok(ah, href, attrs), attrs) <> Frs.step(fs, H.TOpen{H.NA{}, attrs}), acc)
    case Con{H.TOpen{H.NButton{}, +attrs}, t}:
      Spec.asks(t, Ah.open(ah, H.NButton{}, attrs), Fr.new(True{}, Ah.ok(ah, True{}, attrs), attrs) <> Frs.step(fs, H.TOpen{H.NButton{}, attrs}), acc)
    case Con{H.TShut{H.NA{}}, t}:
      Spec.asks(t, Nat.sub(ah, 1n), Frs.step(Frs.tail(fs), H.TShut{H.NA{}}), Frs.ask(fs, acc))
    case Con{H.TShut{H.NButton{}}, t}:
      Spec.asks(t, Nat.sub(ah, 1n), Frs.step(Frs.tail(fs), H.TShut{H.NButton{}}), Frs.ask(fs, acc))
    case Con{+x, t}:
      Spec.asks(t, Ah.step(ah, x), Frs.step(fs, x), acc)

# every id of w is in ids
def Ids.all(w: List<&2, String>, +ids: List<&2, String>) -> Bool:
  match w:
    case Nil{}:
      True{}
    case Con{x, t}:
      Laws.Spec.member(ids, x) && Ids.all(t, ids)

# no Miss, and every id a Refs names is in ids
def Ask.ok(qs: List<&2, Ask>, +ids: List<&2, String>) -> Bool:
  match qs:
    case Nil{}:
      True{}
    case Con{Miss{}, t}:
      False{}
    case Con{Refs{w}, t}:
      Ids.all(w, ids) && Ask.ok(t, ids)

def A11y.of(m: Maybe<&2, List<&2, H.Tok>>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{+ts}:
      Ask.ok(Spec.asks(ts, 0n, [], []), Laws.Spec.ids(ts))

# a page's images and controls are accessible
def Spec.a11y(text: List<&2, String>) -> Bool:
  A11y.of(T.Html.toks(text))

# Laws
# ----

# LAW a11y: on every HTML page of the site (404.html too), every img start
# tag has an alt attribute (alt="" or a bare alt counts: decorative), and
# every a with an href (any value) and every button has an accessible
# name, one of: a non-blank aria-label; a non-blank title; text inside it,
# up to its end tag, that is not blank; an img inside with a non-blank
# alt; an svg inside with a non-blank aria-label; or an aria-labelledby
# naming one or more ids, each the id of some element of the page. Blank:
# after character references are decoded (refs.bend; the lexer decodes
# attribute values, the law decodes text), only ASCII white space, U+00A0,
# U+1680, U+2000-U+200B, U+2028, U+2029, U+202F, U+205F, U+3000, U+FEFF
# (Laws.Wide.blank, base/page.bend). Text inside an a or button
# (shown or hidden) with a reference refs.bend refuses fails the control.
# Text, imgs and svgs inside an element with the hidden attribute or
# aria-hidden="true" (value trimmed of ASCII white space, ASCII
# case-insensitive), and imgs and svgs carrying either, name nothing. An
# a with an href or a button that has aria-hidden="true", or is inside an
# element that has it, fails even when otherwise named (a focusable
# control hidden from assistive technology). A page a browser could read
# another way, or build another tree, fails (base/html/).
# NOT checked: that alt text describes the image; what the elements an
# aria-labelledby names say (they may be empty or hidden); role, CSS
# (display:none text counts, A5) and scripts (A5); the hidden attribute
# on the control itself (it must be named all the same); tabindex="-1"
# or inert on a control under aria-hidden (it fails all the same); names
# given another way (aria-label on other descendants, title on
# descendants, svg <title>, which the lexer refuses, input/label
# elements); other invisible characters (U+00AD, U+2060, control
# characters) count as shown; references in text outside every a and
# button. (R7)
law a11y:
  for +path: String
  for +text: List<&2, String>
  for at: {Laws.Spec.page(path) == Some{text} : Maybe<&2, List<&2, String>>}
  {Spec.a11y(text) == True{} : Bool}
