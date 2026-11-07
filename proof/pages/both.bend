# Proof of headings and lang, shared part (laws/pages.bend)
# ========================================================
#
# Every page of S.Site.pages() has Spec.both (headings and lang, from one
# lexing): All.both holds for the whole list (Both.all), computed in
# chunks of 6 pages, one def each (one def's check has one fuel budget,
# and 18 pages overflow it), joined by All.split; the last chunk is every
# page after the first 12. Spec.find returns None or the text of one of
# the pages (Find.ok, by induction on the list: Pick.ok takes each branch
# of its Bool.pick). The page at path is Some{text} (at), so Spec.both
# holds for text (Both.page); headings.bend and lang.bend take each half.

import Base
import ../../build/site.bend as S
import ../../laws/base/page.bend as P
import ../../laws/pages.bend as Pages
import ../base.bend as L

# the outline of every file of fs holds
def All.both(fs: List<&2, S.Out>) -> Bool:
  match fs:
    case Nil{}:
      True{}
    case Con{S.Out{p, text}, t}:
      Bool.and(Pages.Spec.both(text), All.both(t))

# the file found, if any, has an outline that holds
def Ok.m(m: Maybe<&2, List<&2, String>>) -> Bool:
  match m:
    case None{}:
      True{}
    case Some{text}:
      Pages.Spec.both(text)

def Pick.ok(b: Bool, -x: Maybe<&2, List<&2, String>>, -y: Maybe<&2, List<&2, String>>, ex: {Ok.m(x) == True{} : Bool}, ey: {Ok.m(y) == True{} : Bool}) -> {Ok.m(Bool.pick(Maybe<&2, List<&2, String>>, b, x, y)) == True{} : Bool}:
  match b:
    case True{}:
      ex
    case False{}:
      ey

def Find.ok(fs: List<&2, S.Out>, +path: String, +ok: {All.both(fs) == True{} : Bool}) -> {Ok.m(P.Spec.find(fs, path)) == True{} : Bool}:
  match fs:
    case Nil{}:
      {==}
    case Con{S.Out{p, +text}, +t}:
      Pick.ok(String.eq(p, path), Some{text}, P.Spec.find(t, path), L.And.l(Pages.Spec.both(text), All.both(t), ok), Find.ok(t, path, L.And.r(Pages.Spec.both(text), All.both(t), ok)))

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

# the outlines of the first n files and of the rest hold: all hold
def All.split(n: Nat, fs: List<&2, S.Out>, +e1: {All.both(Out.take(n, fs)) == True{} : Bool}, e2: {All.both(Out.drop(n, fs)) == True{} : Bool}) -> {All.both(fs) == True{} : Bool}:
  match n fs:
    case 0n fs:
      e2
    case 1n+p Nil{}:
      {==}
    case 1n+p Con{S.Out{path, +text}, +t}:
      L.And.both(Pages.Spec.both(text), All.both(t), L.And.l(Pages.Spec.both(text), All.both(Out.take(p, t)), e1), All.split(p, t, L.And.r(Pages.Spec.both(text), All.both(Out.take(p, t)), e1), e2))

# the site in chunks of 6 pages, each computed
def Both.c0() -> {All.both(Out.take(6n, S.Site.pages())) == True{} : Bool}:
  {==}

def Both.c1() -> {All.both(Out.take(6n, Out.drop(6n, S.Site.pages()))) == True{} : Bool}:
  {==}

def Both.c2() -> {All.both(Out.drop(6n, Out.drop(6n, S.Site.pages()))) == True{} : Bool}:
  {==}

# the whole site
def Both.all() -> {All.both(S.Site.pages()) == True{} : Bool}:
  All.split(6n, S.Site.pages(), Both.c0(), All.split(6n, Out.drop(6n, S.Site.pages()), Both.c1(), Both.c2()))

def Both.page(+path: String, -text: List<&2, String>, at: {P.Spec.page(path) == Some{text} : Maybe<&2, List<&2, String>>}) -> {Pages.Spec.both(text) == True{} : Bool}:
  %at : {Ok.m(_) == True{} : Bool}
  Find.ok(S.Site.pages(), path, Both.all())
