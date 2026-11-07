# Proof of canonical (laws/meta.bend)
# ===================================
#
# Canon.all holds on each chunk of pages (pages.bend: computed with
# metadata's reading, one lexing per page). Canon.all of a concatenation
# is the and of the parts (Canon.cat), and the pages are
# A++(B++(C++(D++(E++F)))) (B.Pg.split). Every step keeps the chunks
# written as B.Pg.a() .. B.Pg.f(): a type the kernel must unfold to compare would make it
# compute Canon.all again.

import Base
import ../../laws/base/html/tree.bend as T
import ../../build/site.bend as S
import ../../laws/meta.bend as Meta
import ../base.bend as L
import ./base.bend as B
import ./pages.bend as P

def And.assoc(a: Bool, -b: Bool, -c: Bool) -> {Bool.and(Bool.and(a, b), c) == Bool.and(a, Bool.and(b, c)) : Bool}:
  match a:
    case True{}:
      {==}
    case False{}:
      {==}

# R5 on xs and on ys is R5 on xs++ys
def Canon.cat(xs: List<&2, S.Out>, +ys: List<&2, S.Out>) -> {Bool.and(Meta.Canon.all(xs), Meta.Canon.all(ys)) == Meta.Canon.all(B.Out.cat(xs, ys)) : Bool}:
  match xs:
    case Nil{}:
      {==}
    case Con{S.Out{+p, +text}, +t}:
      %Canon.cat(t, ys) : {Bool.and(Bool.and(Meta.Canon.of(p, T.Html.toks(text)), Meta.Canon.all(t)), Meta.Canon.all(ys)) == Bool.and(Meta.Canon.of(p, T.Html.toks(text)), _) : Bool}
      And.assoc(Meta.Canon.of(p, T.Html.toks(text)), Meta.Canon.all(t), Meta.Canon.all(ys))

def Meta.canonical():
  %B.Pg.split() : {Meta.Canon.all(_) == True{} : Bool}
  %Canon.cat(B.Pg.a(), B.Out.cat(B.Pg.b(), B.Out.cat(B.Pg.c(), B.Out.cat(B.Pg.d(), B.Out.cat(B.Pg.e(), B.Pg.f()))))) : {_ == True{} : Bool}
  %Canon.cat(B.Pg.b(), B.Out.cat(B.Pg.c(), B.Out.cat(B.Pg.d(), B.Out.cat(B.Pg.e(), B.Pg.f())))) : {Bool.and(Meta.Canon.all(B.Pg.a()), _) == True{} : Bool}
  %Canon.cat(B.Pg.c(), B.Out.cat(B.Pg.d(), B.Out.cat(B.Pg.e(), B.Pg.f()))) : {Bool.and(Meta.Canon.all(B.Pg.a()), Bool.and(Meta.Canon.all(B.Pg.b()), _)) == True{} : Bool}
  %Canon.cat(B.Pg.d(), B.Out.cat(B.Pg.e(), B.Pg.f())) : {Bool.and(Meta.Canon.all(B.Pg.a()), Bool.and(Meta.Canon.all(B.Pg.b()), Bool.and(Meta.Canon.all(B.Pg.c()), _))) == True{} : Bool}
  %Canon.cat(B.Pg.e(), B.Pg.f()) : {Bool.and(Meta.Canon.all(B.Pg.a()), Bool.and(Meta.Canon.all(B.Pg.b()), Bool.and(Meta.Canon.all(B.Pg.c()), Bool.and(Meta.Canon.all(B.Pg.d()), _)))) == True{} : Bool}
  L.And.both(Meta.Canon.all(B.Pg.a()), Bool.and(Meta.Canon.all(B.Pg.b()), Bool.and(Meta.Canon.all(B.Pg.c()), Bool.and(Meta.Canon.all(B.Pg.d()), Bool.and(Meta.Canon.all(B.Pg.e()), Meta.Canon.all(B.Pg.f()))))), P.Two.canon_a(), L.And.both(Meta.Canon.all(B.Pg.b()), Bool.and(Meta.Canon.all(B.Pg.c()), Bool.and(Meta.Canon.all(B.Pg.d()), Bool.and(Meta.Canon.all(B.Pg.e()), Meta.Canon.all(B.Pg.f())))), P.Two.canon_b(), L.And.both(Meta.Canon.all(B.Pg.c()), Bool.and(Meta.Canon.all(B.Pg.d()), Bool.and(Meta.Canon.all(B.Pg.e()), Meta.Canon.all(B.Pg.f()))), P.Two.canon_c(), L.And.both(Meta.Canon.all(B.Pg.d()), Bool.and(Meta.Canon.all(B.Pg.e()), Meta.Canon.all(B.Pg.f())), P.Two.canon_d(), L.And.both(Meta.Canon.all(B.Pg.e()), Meta.Canon.all(B.Pg.f()), P.Two.canon_e(), P.Two.canon_f())))))
