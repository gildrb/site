# gildrb.com's proofs: what the proofs of laws/meta.bend share
# ============================================================
#
# The site's pages in chunks: one def's check under --verdict has one
# budget, and lexing all 18 pages overflows it (proof/README.md).

import Base
import ../../build/site.bend as S

# the first n files of fs, and the rest
def Out.take(n: Nat, fs: List<&2, S.Out>) -> List<&2, S.Out>:
  match n fs:
    case 0n fs:
      []
    case 1n+p Nil{}:
      []
    case 1n+p Con{x, t}:
      x <> Out.take(p, t)

def Out.drop(n: Nat, fs: List<&2, S.Out>) -> List<&2, S.Out>:
  match n fs:
    case 0n fs:
      fs
    case 1n+p Nil{}:
      []
    case 1n+p Con{x, t}:
      Out.drop(p, t)

def Out.cat(xs: List<&2, S.Out>, ys: List<&2, S.Out>) -> List<&2, S.Out>:
  match xs:
    case Nil{}:
      ys
    case Con{x, t}:
      x <> Out.cat(t, ys)

# the first n files, then the rest, are fs
def Out.split(n: Nat, fs: List<&2, S.Out>) -> {Out.cat(Out.take(n, fs), Out.drop(n, fs)) == fs : List<&2, S.Out>}:
  match n fs:
    case 0n fs:
      {==}
    case 1n+p Nil{}:
      {==}
    case 1n+p Con{x, t}:
      Equal.cong(List<&2, S.Out>, List<&2, S.Out>, y => x <> y, Out.cat(Out.take(p, t), Out.drop(p, t)), t, Out.split(p, t))

# the site's pages in chunks of 3 (6 pages to a chunk ran out of fuel
# once canonical read every page's robots meta): A, B, C, D, E, and the
# rest F
def Pg.r1() -> List<&2, S.Out>:
  Out.drop(3n, S.Site.pages())

def Pg.r2() -> List<&2, S.Out>:
  Out.drop(3n, Pg.r1())

def Pg.r3() -> List<&2, S.Out>:
  Out.drop(3n, Pg.r2())

def Pg.r4() -> List<&2, S.Out>:
  Out.drop(3n, Pg.r3())

def Pg.a() -> List<&2, S.Out>:
  Out.take(3n, S.Site.pages())

def Pg.b() -> List<&2, S.Out>:
  Out.take(3n, Pg.r1())

def Pg.c() -> List<&2, S.Out>:
  Out.take(3n, Pg.r2())

def Pg.d() -> List<&2, S.Out>:
  Out.take(3n, Pg.r3())

def Pg.e() -> List<&2, S.Out>:
  Out.take(3n, Pg.r4())

def Pg.f() -> List<&2, S.Out>:
  Out.drop(3n, Pg.r4())

# the pages are A++(B++(C++(D++(E++F))))
def Pg.split() -> {Out.cat(Pg.a(), Out.cat(Pg.b(), Out.cat(Pg.c(), Out.cat(Pg.d(), Out.cat(Pg.e(), Pg.f()))))) == S.Site.pages() : List<&2, S.Out>}:
  %Out.split(3n, S.Site.pages()) : {Out.cat(Pg.a(), Out.cat(Pg.b(), Out.cat(Pg.c(), Out.cat(Pg.d(), Out.cat(Pg.e(), Pg.f()))))) == _ : List<&2, S.Out>}
  %Out.split(3n, Pg.r1()) : {Out.cat(Pg.a(), Out.cat(Pg.b(), Out.cat(Pg.c(), Out.cat(Pg.d(), Out.cat(Pg.e(), Pg.f()))))) == Out.cat(Pg.a(), _) : List<&2, S.Out>}
  %Out.split(3n, Pg.r2()) : {Out.cat(Pg.a(), Out.cat(Pg.b(), Out.cat(Pg.c(), Out.cat(Pg.d(), Out.cat(Pg.e(), Pg.f()))))) == Out.cat(Pg.a(), Out.cat(Pg.b(), _)) : List<&2, S.Out>}
  %Out.split(3n, Pg.r3()) : {Out.cat(Pg.a(), Out.cat(Pg.b(), Out.cat(Pg.c(), Out.cat(Pg.d(), Out.cat(Pg.e(), Pg.f()))))) == Out.cat(Pg.a(), Out.cat(Pg.b(), Out.cat(Pg.c(), _))) : List<&2, S.Out>}
  %Out.split(3n, Pg.r4()) : {Out.cat(Pg.a(), Out.cat(Pg.b(), Out.cat(Pg.c(), Out.cat(Pg.d(), Out.cat(Pg.e(), Pg.f()))))) == Out.cat(Pg.a(), Out.cat(Pg.b(), Out.cat(Pg.c(), Out.cat(Pg.d(), _)))) : List<&2, S.Out>}
  {==}
