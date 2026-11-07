# gildrb.com's proofs: Snip.all read from each page's start
# =========================================================
#
# Fall.all is Snip.all (laws/meta.bend) with each indexable page's title
# and description read from the tokens of only its start (Pre.go: the
# pieces up to the first title end tag and description meta; about 3 KB
# of a page's 50-130 KB). pages.bend proves it equal to Snip.all on the
# site, chunk by chunk; metadata.bend computes the law on it.

import Base
import ../../laws/base/html/tokens.bend as H
import ../../laws/base/html/lexer.bend as X
import ../../build/site.bend as S
import ../../laws/meta.bend as Meta
import ./base.bend as B

# Joins
# -----

def Ss.cat(xs: List<&2, Meta.Snip>, ys: List<&2, Meta.Snip>) -> List<&2, Meta.Snip>:
  match xs:
    case Nil{}:
      ys
    case Con{x, t}:
      x <> Ss.cat(t, ys)

# two results of Snip.all, joined: None when either is
def Ms.join_r(x: List<&2, Meta.Snip>, b: Maybe<&2, List<&2, Meta.Snip>>) -> Maybe<&2, List<&2, Meta.Snip>>:
  match b:
    case None{}:
      None{}
    case Some{y}:
      Some{Ss.cat(x, y)}

def Ms.join(a: Maybe<&2, List<&2, Meta.Snip>>, b: Maybe<&2, List<&2, Meta.Snip>>) -> Maybe<&2, List<&2, Meta.Snip>>:
  match a:
    case None{}:
      None{}
    case Some{x}:
      Ms.join_r(x, b)

def Join.nil(m: Maybe<&2, List<&2, Meta.Snip>>) -> {m == Ms.join_r([], m) : Maybe<&2, List<&2, Meta.Snip>>}:
  match m:
    case None{}:
      {==}
    case Some{y}:
      {==}

def Cons.join(m: Maybe<&2, Meta.Snip>, x: Maybe<&2, List<&2, Meta.Snip>>, y: Maybe<&2, List<&2, Meta.Snip>>) -> {Meta.Snip.cons(m, Ms.join(x, y)) == Ms.join(Meta.Snip.cons(m, x), y) : Maybe<&2, List<&2, Meta.Snip>>}:
  match m x y:
    case None{} None{} y:
      {==}
    case None{} Some{a} None{}:
      {==}
    case None{} Some{a} Some{b}:
      {==}
    case Some{s} None{} y:
      {==}
    case Some{s} Some{a} None{}:
      {==}
    case Some{s} Some{a} Some{b}:
      {==}

# A page's start
# --------------

# the tokens so far hold a title end tag and a meta named description
def Pre.seen(ts: List<&2, H.Tok>, title: Bool, desc: Bool) -> Bool:
  match ts:
    case Nil{}:
      title && desc
    case Con{H.TShut{H.NTitle{}}, t}:
      Pre.seen(t, True{}, desc)
    case Con{H.TOpen{H.NMeta{}, +attrs}, t}:
      Pre.seen(t, title, desc || Meta.Attr.is(H.KName{}, attrs, "description"))
    case Con{x, t}:
      Pre.seen(t, title, desc)

def Pre.done(r: X.Run) -> Bool:
  match r:
    case X.Run{st, acc}:
      Pre.seen(acc, False{}, False{})

# the lexer run on the pieces of a page until, after a piece, the tokens
# hold a title end tag and a description meta (or the pieces end)
def Pre.go(cs: List<&2, String>, r: X.Run, done: Bool) -> X.Run:
  match cs done:
    case Nil{} d:
      r
    case Con{s, t} True{}:
      r
    case Con{s, t} False{}:
      +r2 = X.Lx.str(s, r)
      Pre.go(t, r2, Pre.done(r2))

def Pre.toks(r: X.Run) -> List<&2, H.Tok>:
  match r:
    case X.Run{st, acc}:
      List.reverse(&2, H.Tok, acc)

def Fast.if(title: Maybe<&2, String>, desc: Maybe<&2, String>) -> Maybe<&2, Meta.Snip>:
  match title desc:
    case Some{t} Some{d}:
      Some{Meta.Snip{t, d}}
    case _ _:
      None{}

def Fast.toks(+ts: List<&2, H.Tok>) -> Maybe<&2, Meta.Snip>:
  Fast.if(Meta.Title.of(ts), Meta.Show.val(Meta.Desc.of(ts)))

# a page's title and description, from its start only
def Fast.of(text: List<&2, String>) -> Maybe<&2, Meta.Snip>:
  Fast.toks(Pre.toks(Pre.go(text, X.Run{X.LxText{SNil{}}, []}, False{})))

# Fall.all
# --------

def Fall.next(b: Bool, text: List<&2, String>, rest: Maybe<&2, List<&2, Meta.Snip>>) -> Maybe<&2, List<&2, Meta.Snip>>:
  match b:
    case True{}:
      rest
    case False{}:
      Meta.Snip.cons(Fast.of(text), rest)

def Fall.all(fs: List<&2, S.Out>) -> Maybe<&2, List<&2, Meta.Snip>>:
  match fs:
    case Nil{}:
      Some{[]}
    case Con{S.Out{p, text}, t}:
      Fall.next(Meta.Url.lost(p), text, Fall.all(t))

def Fnext.join(b: Bool, text: List<&2, String>, x: Maybe<&2, List<&2, Meta.Snip>>, y: Maybe<&2, List<&2, Meta.Snip>>) -> {Fall.next(b, text, Ms.join(x, y)) == Ms.join(Fall.next(b, text, x), y) : Maybe<&2, List<&2, Meta.Snip>>}:
  match b:
    case True{}:
      {==}
    case False{}:
      Cons.join(Fast.of(text), x, y)

# Fall.all of xs++ys is the join of the two
def Fall.cat(xs: List<&2, S.Out>, +ys: List<&2, S.Out>) -> {Fall.all(B.Out.cat(xs, ys)) == Ms.join(Fall.all(xs), Fall.all(ys)) : Maybe<&2, List<&2, Meta.Snip>>}:
  match xs:
    case Nil{}:
      Join.nil(Fall.all(ys))
    case Con{S.Out{+p, +text}, +t}:
      Equal.trans(Maybe<&2, List<&2, Meta.Snip>>, Fall.next(Meta.Url.lost(p), text, Fall.all(B.Out.cat(t, ys))), Fall.next(Meta.Url.lost(p), text, Ms.join(Fall.all(t), Fall.all(ys))), Ms.join(Fall.next(Meta.Url.lost(p), text, Fall.all(t)), Fall.all(ys)), Equal.cong(Maybe<&2, List<&2, Meta.Snip>>, Maybe<&2, List<&2, Meta.Snip>>, q => Fall.next(Meta.Url.lost(p), text, q), Fall.all(B.Out.cat(t, ys)), Ms.join(Fall.all(t), Fall.all(ys)), Fall.cat(t, ys)), Fnext.join(Meta.Url.lost(p), text, Fall.all(t), Fall.all(ys)))

# the join, read right to left (a rewrite replaces the right side)
def Fall.cat_r(xs: List<&2, S.Out>, ys: List<&2, S.Out>) -> {Ms.join(Fall.all(xs), Fall.all(ys)) == Fall.all(B.Out.cat(xs, ys)) : Maybe<&2, List<&2, Meta.Snip>>}:
  Equal.sym(Maybe<&2, List<&2, Meta.Snip>>, Fall.all(B.Out.cat(xs, ys)), Ms.join(Fall.all(xs), Fall.all(ys)), Fall.cat(xs, ys))
