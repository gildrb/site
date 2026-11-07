# Proof of a11y (laws/a11y.bend)
# ==============================
#
# The shape of proof/pages/outline.bend: every page of S.Site.pages() is
# accessible (All.a11y), computed in chunks of 3 pages, one def each (6
# pages ran close to the kernel's budget), joined by All.split; Find.ok
# goes down the page list by induction
# (Pick.ok takes each branch of Spec.find's Bool.pick); the premise `at`
# rewrites the goal to Ok.m(Spec.find(..)).

import Base
import ../../build/site.bend as S
import ../../laws/base/page.bend as P
import ../../laws/a11y.bend as A11y
import ../base.bend as L

# every file of fs is accessible
def All.a11y(fs: List<&2, S.Out>) -> Bool:
  match fs:
    case Nil{}:
      True{}
    case Con{S.Out{p, text}, t}:
      Bool.and(A11y.Spec.a11y(text), All.a11y(t))

# the file found, if any, is accessible
def Ok.m(m: Maybe<&2, List<&2, String>>) -> Bool:
  match m:
    case None{}:
      True{}
    case Some{text}:
      A11y.Spec.a11y(text)

def Pick.ok(b: Bool, -x: Maybe<&2, List<&2, String>>, -y: Maybe<&2, List<&2, String>>, ex: {Ok.m(x) == True{} : Bool}, ey: {Ok.m(y) == True{} : Bool}) -> {Ok.m(Bool.pick(Maybe<&2, List<&2, String>>, b, x, y)) == True{} : Bool}:
  match b:
    case True{}:
      ex
    case False{}:
      ey

def Find.ok(fs: List<&2, S.Out>, +path: String, +ok: {All.a11y(fs) == True{} : Bool}) -> {Ok.m(P.Spec.find(fs, path)) == True{} : Bool}:
  match fs:
    case Nil{}:
      {==}
    case Con{S.Out{p, +text}, +t}:
      Pick.ok(String.eq(p, path), Some{text}, P.Spec.find(t, path), L.And.l(A11y.Spec.a11y(text), All.a11y(t), ok), Find.ok(t, path, L.And.r(A11y.Spec.a11y(text), All.a11y(t), ok)))

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

# the first n files and the rest are accessible: all are
def All.split(n: Nat, fs: List<&2, S.Out>, +e1: {All.a11y(Out.take(n, fs)) == True{} : Bool}, e2: {All.a11y(Out.drop(n, fs)) == True{} : Bool}) -> {All.a11y(fs) == True{} : Bool}:
  match n fs:
    case 0n fs:
      e2
    case 1n+p Nil{}:
      {==}
    case 1n+p Con{S.Out{path, +text}, +t}:
      L.And.both(A11y.Spec.a11y(text), All.a11y(t), L.And.l(A11y.Spec.a11y(text), All.a11y(Out.take(p, t)), e1), All.split(p, t, L.And.r(A11y.Spec.a11y(text), All.a11y(Out.take(p, t)), e1), e2))

# the site in chunks of 3 pages, each computed
def Shown.c0() -> {All.a11y(Out.take(3n, S.Site.pages())) == True{} : Bool}:
  {==}

def Shown.c1() -> {All.a11y(Out.take(3n, Out.drop(3n, S.Site.pages()))) == True{} : Bool}:
  {==}

def Shown.c2() -> {All.a11y(Out.take(3n, Out.drop(3n, Out.drop(3n, S.Site.pages())))) == True{} : Bool}:
  {==}

def Shown.c3() -> {All.a11y(Out.take(3n, Out.drop(3n, Out.drop(3n, Out.drop(3n, S.Site.pages()))))) == True{} : Bool}:
  {==}

def Shown.c4() -> {All.a11y(Out.take(3n, Out.drop(3n, Out.drop(3n, Out.drop(3n, Out.drop(3n, S.Site.pages())))))) == True{} : Bool}:
  {==}

def Shown.c5() -> {All.a11y(Out.drop(3n, Out.drop(3n, Out.drop(3n, Out.drop(3n, Out.drop(3n, S.Site.pages())))))) == True{} : Bool}:
  {==}

# the whole site
def Shown.all() -> {All.a11y(S.Site.pages()) == True{} : Bool}:
  All.split(3n, S.Site.pages(), Shown.c0(), All.split(3n, Out.drop(3n, S.Site.pages()), Shown.c1(), All.split(3n, Out.drop(3n, Out.drop(3n, S.Site.pages())), Shown.c2(), All.split(3n, Out.drop(3n, Out.drop(3n, Out.drop(3n, S.Site.pages()))), Shown.c3(), All.split(3n, Out.drop(3n, Out.drop(3n, Out.drop(3n, Out.drop(3n, S.Site.pages())))), Shown.c4(), Shown.c5())))))

def A11y.a11y(path, text, at):
  %at : {Ok.m(_) == True{} : Bool}
  Find.ok(S.Site.pages(), path, Shown.all())
