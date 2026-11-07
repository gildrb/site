# Proof of metadata (laws/meta.bend)
# ==================================
#
# Snip.ok(Snip.all(pages)) compares the titles and descriptions of all
# pages, but one def's check cannot lex all 18 (10 pages' Snip.all run
# out of fuel under --verdict). So:
#
# - Snip.all of each chunk of pages (A-F: 3 pages each, F the rest) is
#   computed equal to F.Fall.all of it
#   (pages.bend), which reads each page's title and description from
#   its start only (fall.bend);
# - Snip.all and Fall.all of a concatenation are the joins of the parts
#   (All.cat, F.Fall.cat), and the pages are A++(B++(C++(D++(E++F))))
#   (B.Pg.split), so Snip.all(pages) is Fall.all(pages) (Meta2.same);
# - Snip.ok(Fall.all(pages)) is computed (Meta2.ok): it lexes only the
#   pages' starts.
#
# If a page's title or description ever lies past what F.Pre.go reads,
# a chunk's equation fails: the proof, not the law, needs a change.

import Base
import ../../laws/base/html/tree.bend as T
import ../../build/site.bend as S
import ../../laws/meta.bend as Meta
import ./base.bend as B
import ./fall.bend as F
import ./pages.bend as P

def Next.join(b: Bool, path: String, text: List<&2, String>, x: Maybe<&2, List<&2, Meta.Snip>>, y: Maybe<&2, List<&2, Meta.Snip>>) -> {Meta.Snip.next(b, path, text, F.Ms.join(x, y)) == F.Ms.join(Meta.Snip.next(b, path, text, x), y) : Maybe<&2, List<&2, Meta.Snip>>}:
  match b:
    case True{}:
      {==}
    case False{}:
      F.Cons.join(Meta.Snip.page(path, T.Html.toks(text)), x, y)

# Snip.all of xs++ys is the join of the two
def All.cat(xs: List<&2, S.Out>, +ys: List<&2, S.Out>) -> {Meta.Snip.all(B.Out.cat(xs, ys)) == F.Ms.join(Meta.Snip.all(xs), Meta.Snip.all(ys)) : Maybe<&2, List<&2, Meta.Snip>>}:
  match xs:
    case Nil{}:
      F.Join.nil(Meta.Snip.all(ys))
    case Con{S.Out{+p, +text}, +t}:
      Equal.trans(Maybe<&2, List<&2, Meta.Snip>>, Meta.Snip.next(Meta.Url.lost(p), p, text, Meta.Snip.all(B.Out.cat(t, ys))), Meta.Snip.next(Meta.Url.lost(p), p, text, F.Ms.join(Meta.Snip.all(t), Meta.Snip.all(ys))), F.Ms.join(Meta.Snip.next(Meta.Url.lost(p), p, text, Meta.Snip.all(t)), Meta.Snip.all(ys)), Equal.cong(Maybe<&2, List<&2, Meta.Snip>>, Maybe<&2, List<&2, Meta.Snip>>, q => Meta.Snip.next(Meta.Url.lost(p), p, text, q), Meta.Snip.all(B.Out.cat(t, ys)), F.Ms.join(Meta.Snip.all(t), Meta.Snip.all(ys)), All.cat(t, ys)), Next.join(Meta.Url.lost(p), p, text, Meta.Snip.all(t), Meta.Snip.all(ys)))

# the join, read right to left (a rewrite replaces the right side)
def All.cat_r(xs: List<&2, S.Out>, ys: List<&2, S.Out>) -> {F.Ms.join(Meta.Snip.all(xs), Meta.Snip.all(ys)) == Meta.Snip.all(B.Out.cat(xs, ys)) : Maybe<&2, List<&2, Meta.Snip>>}:
  Equal.sym(Maybe<&2, List<&2, Meta.Snip>>, Meta.Snip.all(B.Out.cat(xs, ys)), F.Ms.join(Meta.Snip.all(xs), Meta.Snip.all(ys)), All.cat(xs, ys))

# Fall.all(pages) is Snip.all(pages)
def Meta2.same() -> {F.Fall.all(S.Site.pages()) == Meta.Snip.all(S.Site.pages()) : Maybe<&2, List<&2, Meta.Snip>>}:
  %B.Pg.split() : {F.Fall.all(_) == Meta.Snip.all(_) : Maybe<&2, List<&2, Meta.Snip>>}
  %All.cat_r(B.Pg.a(), B.Out.cat(B.Pg.b(), B.Out.cat(B.Pg.c(), B.Out.cat(B.Pg.d(), B.Out.cat(B.Pg.e(), B.Pg.f()))))) : {F.Fall.all(B.Out.cat(B.Pg.a(), B.Out.cat(B.Pg.b(), B.Out.cat(B.Pg.c(), B.Out.cat(B.Pg.d(), B.Out.cat(B.Pg.e(), B.Pg.f())))))) == _ : Maybe<&2, List<&2, Meta.Snip>>}
  %All.cat_r(B.Pg.b(), B.Out.cat(B.Pg.c(), B.Out.cat(B.Pg.d(), B.Out.cat(B.Pg.e(), B.Pg.f())))) : {F.Fall.all(B.Out.cat(B.Pg.a(), B.Out.cat(B.Pg.b(), B.Out.cat(B.Pg.c(), B.Out.cat(B.Pg.d(), B.Out.cat(B.Pg.e(), B.Pg.f())))))) == F.Ms.join(Meta.Snip.all(B.Pg.a()), _) : Maybe<&2, List<&2, Meta.Snip>>}
  %All.cat_r(B.Pg.c(), B.Out.cat(B.Pg.d(), B.Out.cat(B.Pg.e(), B.Pg.f()))) : {F.Fall.all(B.Out.cat(B.Pg.a(), B.Out.cat(B.Pg.b(), B.Out.cat(B.Pg.c(), B.Out.cat(B.Pg.d(), B.Out.cat(B.Pg.e(), B.Pg.f())))))) == F.Ms.join(Meta.Snip.all(B.Pg.a()), F.Ms.join(Meta.Snip.all(B.Pg.b()), _)) : Maybe<&2, List<&2, Meta.Snip>>}
  %All.cat_r(B.Pg.d(), B.Out.cat(B.Pg.e(), B.Pg.f())) : {F.Fall.all(B.Out.cat(B.Pg.a(), B.Out.cat(B.Pg.b(), B.Out.cat(B.Pg.c(), B.Out.cat(B.Pg.d(), B.Out.cat(B.Pg.e(), B.Pg.f())))))) == F.Ms.join(Meta.Snip.all(B.Pg.a()), F.Ms.join(Meta.Snip.all(B.Pg.b()), F.Ms.join(Meta.Snip.all(B.Pg.c()), _))) : Maybe<&2, List<&2, Meta.Snip>>}
  %All.cat_r(B.Pg.e(), B.Pg.f()) : {F.Fall.all(B.Out.cat(B.Pg.a(), B.Out.cat(B.Pg.b(), B.Out.cat(B.Pg.c(), B.Out.cat(B.Pg.d(), B.Out.cat(B.Pg.e(), B.Pg.f())))))) == F.Ms.join(Meta.Snip.all(B.Pg.a()), F.Ms.join(Meta.Snip.all(B.Pg.b()), F.Ms.join(Meta.Snip.all(B.Pg.c()), F.Ms.join(Meta.Snip.all(B.Pg.d()), _)))) : Maybe<&2, List<&2, Meta.Snip>>}
  %F.Fall.cat_r(B.Pg.a(), B.Out.cat(B.Pg.b(), B.Out.cat(B.Pg.c(), B.Out.cat(B.Pg.d(), B.Out.cat(B.Pg.e(), B.Pg.f()))))) : {_ == F.Ms.join(Meta.Snip.all(B.Pg.a()), F.Ms.join(Meta.Snip.all(B.Pg.b()), F.Ms.join(Meta.Snip.all(B.Pg.c()), F.Ms.join(Meta.Snip.all(B.Pg.d()), F.Ms.join(Meta.Snip.all(B.Pg.e()), Meta.Snip.all(B.Pg.f())))))) : Maybe<&2, List<&2, Meta.Snip>>}
  %F.Fall.cat_r(B.Pg.b(), B.Out.cat(B.Pg.c(), B.Out.cat(B.Pg.d(), B.Out.cat(B.Pg.e(), B.Pg.f())))) : {F.Ms.join(F.Fall.all(B.Pg.a()), _) == F.Ms.join(Meta.Snip.all(B.Pg.a()), F.Ms.join(Meta.Snip.all(B.Pg.b()), F.Ms.join(Meta.Snip.all(B.Pg.c()), F.Ms.join(Meta.Snip.all(B.Pg.d()), F.Ms.join(Meta.Snip.all(B.Pg.e()), Meta.Snip.all(B.Pg.f())))))) : Maybe<&2, List<&2, Meta.Snip>>}
  %F.Fall.cat_r(B.Pg.c(), B.Out.cat(B.Pg.d(), B.Out.cat(B.Pg.e(), B.Pg.f()))) : {F.Ms.join(F.Fall.all(B.Pg.a()), F.Ms.join(F.Fall.all(B.Pg.b()), _)) == F.Ms.join(Meta.Snip.all(B.Pg.a()), F.Ms.join(Meta.Snip.all(B.Pg.b()), F.Ms.join(Meta.Snip.all(B.Pg.c()), F.Ms.join(Meta.Snip.all(B.Pg.d()), F.Ms.join(Meta.Snip.all(B.Pg.e()), Meta.Snip.all(B.Pg.f())))))) : Maybe<&2, List<&2, Meta.Snip>>}
  %F.Fall.cat_r(B.Pg.d(), B.Out.cat(B.Pg.e(), B.Pg.f())) : {F.Ms.join(F.Fall.all(B.Pg.a()), F.Ms.join(F.Fall.all(B.Pg.b()), F.Ms.join(F.Fall.all(B.Pg.c()), _))) == F.Ms.join(Meta.Snip.all(B.Pg.a()), F.Ms.join(Meta.Snip.all(B.Pg.b()), F.Ms.join(Meta.Snip.all(B.Pg.c()), F.Ms.join(Meta.Snip.all(B.Pg.d()), F.Ms.join(Meta.Snip.all(B.Pg.e()), Meta.Snip.all(B.Pg.f())))))) : Maybe<&2, List<&2, Meta.Snip>>}
  %F.Fall.cat_r(B.Pg.e(), B.Pg.f()) : {F.Ms.join(F.Fall.all(B.Pg.a()), F.Ms.join(F.Fall.all(B.Pg.b()), F.Ms.join(F.Fall.all(B.Pg.c()), F.Ms.join(F.Fall.all(B.Pg.d()), _)))) == F.Ms.join(Meta.Snip.all(B.Pg.a()), F.Ms.join(Meta.Snip.all(B.Pg.b()), F.Ms.join(Meta.Snip.all(B.Pg.c()), F.Ms.join(Meta.Snip.all(B.Pg.d()), F.Ms.join(Meta.Snip.all(B.Pg.e()), Meta.Snip.all(B.Pg.f())))))) : Maybe<&2, List<&2, Meta.Snip>>}
  %P.Two.snip_a() : {F.Ms.join(_, F.Ms.join(F.Fall.all(B.Pg.b()), F.Ms.join(F.Fall.all(B.Pg.c()), F.Ms.join(F.Fall.all(B.Pg.d()), F.Ms.join(F.Fall.all(B.Pg.e()), F.Fall.all(B.Pg.f())))))) == F.Ms.join(Meta.Snip.all(B.Pg.a()), F.Ms.join(Meta.Snip.all(B.Pg.b()), F.Ms.join(Meta.Snip.all(B.Pg.c()), F.Ms.join(Meta.Snip.all(B.Pg.d()), F.Ms.join(Meta.Snip.all(B.Pg.e()), Meta.Snip.all(B.Pg.f())))))) : Maybe<&2, List<&2, Meta.Snip>>}
  %P.Two.snip_b() : {F.Ms.join(Meta.Snip.all(B.Pg.a()), F.Ms.join(_, F.Ms.join(F.Fall.all(B.Pg.c()), F.Ms.join(F.Fall.all(B.Pg.d()), F.Ms.join(F.Fall.all(B.Pg.e()), F.Fall.all(B.Pg.f())))))) == F.Ms.join(Meta.Snip.all(B.Pg.a()), F.Ms.join(Meta.Snip.all(B.Pg.b()), F.Ms.join(Meta.Snip.all(B.Pg.c()), F.Ms.join(Meta.Snip.all(B.Pg.d()), F.Ms.join(Meta.Snip.all(B.Pg.e()), Meta.Snip.all(B.Pg.f())))))) : Maybe<&2, List<&2, Meta.Snip>>}
  %P.Two.snip_c() : {F.Ms.join(Meta.Snip.all(B.Pg.a()), F.Ms.join(Meta.Snip.all(B.Pg.b()), F.Ms.join(_, F.Ms.join(F.Fall.all(B.Pg.d()), F.Ms.join(F.Fall.all(B.Pg.e()), F.Fall.all(B.Pg.f())))))) == F.Ms.join(Meta.Snip.all(B.Pg.a()), F.Ms.join(Meta.Snip.all(B.Pg.b()), F.Ms.join(Meta.Snip.all(B.Pg.c()), F.Ms.join(Meta.Snip.all(B.Pg.d()), F.Ms.join(Meta.Snip.all(B.Pg.e()), Meta.Snip.all(B.Pg.f())))))) : Maybe<&2, List<&2, Meta.Snip>>}
  %P.Two.snip_d() : {F.Ms.join(Meta.Snip.all(B.Pg.a()), F.Ms.join(Meta.Snip.all(B.Pg.b()), F.Ms.join(Meta.Snip.all(B.Pg.c()), F.Ms.join(_, F.Ms.join(F.Fall.all(B.Pg.e()), F.Fall.all(B.Pg.f())))))) == F.Ms.join(Meta.Snip.all(B.Pg.a()), F.Ms.join(Meta.Snip.all(B.Pg.b()), F.Ms.join(Meta.Snip.all(B.Pg.c()), F.Ms.join(Meta.Snip.all(B.Pg.d()), F.Ms.join(Meta.Snip.all(B.Pg.e()), Meta.Snip.all(B.Pg.f())))))) : Maybe<&2, List<&2, Meta.Snip>>}
  %P.Two.snip_e() : {F.Ms.join(Meta.Snip.all(B.Pg.a()), F.Ms.join(Meta.Snip.all(B.Pg.b()), F.Ms.join(Meta.Snip.all(B.Pg.c()), F.Ms.join(Meta.Snip.all(B.Pg.d()), F.Ms.join(_, F.Fall.all(B.Pg.f())))))) == F.Ms.join(Meta.Snip.all(B.Pg.a()), F.Ms.join(Meta.Snip.all(B.Pg.b()), F.Ms.join(Meta.Snip.all(B.Pg.c()), F.Ms.join(Meta.Snip.all(B.Pg.d()), F.Ms.join(Meta.Snip.all(B.Pg.e()), Meta.Snip.all(B.Pg.f())))))) : Maybe<&2, List<&2, Meta.Snip>>}
  %P.Two.snip_f() : {F.Ms.join(Meta.Snip.all(B.Pg.a()), F.Ms.join(Meta.Snip.all(B.Pg.b()), F.Ms.join(Meta.Snip.all(B.Pg.c()), F.Ms.join(Meta.Snip.all(B.Pg.d()), F.Ms.join(Meta.Snip.all(B.Pg.e()), _))))) == F.Ms.join(Meta.Snip.all(B.Pg.a()), F.Ms.join(Meta.Snip.all(B.Pg.b()), F.Ms.join(Meta.Snip.all(B.Pg.c()), F.Ms.join(Meta.Snip.all(B.Pg.d()), F.Ms.join(Meta.Snip.all(B.Pg.e()), Meta.Snip.all(B.Pg.f())))))) : Maybe<&2, List<&2, Meta.Snip>>}
  {==}

# no two titles or descriptions alike, computed on the pages' starts
def Meta2.ok() -> {Meta.Snip.ok(F.Fall.all(S.Site.pages())) == True{} : Bool}:
  {==}

def Meta.metadata():
  %Meta2.same() : {Meta.Snip.ok(_) == True{} : Bool}
  Meta2.ok()
