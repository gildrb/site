# Proof of links_html (laws/links.bend)
# =====================================
#
# Html.all is Html.half on both halves of every page (R.Tags.half). Each
# half holds on S.Site.pages(): computed in chunks of pages, one def each
# (one budget per def; all.html's half alone takes about 70% of it),
# joined by Half.split; the last chunk is every page after the others.
# All.both joins the halves: open in fs, so its check computes nothing.

import Base
import ../../laws/base/html/tree.bend as T
import ../../build/site.bend as S
import ../../laws/links.bend as Links
import ../../laws/links/refs.bend as R
import ../base.bend as L
import ../meta/base.bend as B

# R10 on half h of the first n pages and of the rest: on all
def Half.split(+h: R.LHalf, n: Nat, fs: List<&2, S.Out>, +e1: {Links.Html.half(h, B.Out.take(n, fs)) == True{} : Bool}, e2: {Links.Html.half(h, B.Out.drop(n, fs)) == True{} : Bool}) -> {Links.Html.half(h, fs) == True{} : Bool}:
  match n fs:
    case 0n fs:
      e2
    case 1n+p Nil{}:
      {==}
    case 1n+p Con{S.Out{+path, +text}, +t}:
      L.And.both(Links.Html.toks(h, path, T.Html.toks(text)), Links.Html.half(h, t), L.And.l(Links.Html.toks(h, path, T.Html.toks(text)), Links.Html.half(h, B.Out.take(p, t)), e1), Half.split(h, p, t, L.And.r(Links.Html.toks(h, path, T.Html.toks(text)), Links.Html.half(h, B.Out.take(p, t)), e1), e2))

# both halves of every page of fs: R10 on fs
def All.both(+fs: List<&2, S.Out>, ev: {Links.Html.half(R.LkEv{}, fs) == True{} : Bool}, od: {Links.Html.half(R.LkOd{}, fs) == True{} : Bool}) -> {Links.Html.all(fs) == True{} : Bool}:
  L.And.both(Links.Html.half(R.LkEv{}, fs), Links.Html.half(R.LkOd{}, fs), ev, od)

# half Ev: chunks of 2, 1, 3, 3, 2, 3, 3 pages, then the rest

def Ev.c0() -> {Links.Html.half(R.LkEv{}, B.Out.take(2n, S.Site.pages())) == True{} : Bool}:
  {==}

def Ev.c1() -> {Links.Html.half(R.LkEv{}, B.Out.take(1n, B.Out.drop(2n, S.Site.pages()))) == True{} : Bool}:
  {==}

def Ev.c2() -> {Links.Html.half(R.LkEv{}, B.Out.take(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages())))) == True{} : Bool}:
  {==}

def Ev.c3() -> {Links.Html.half(R.LkEv{}, B.Out.take(3n, B.Out.drop(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages()))))) == True{} : Bool}:
  {==}

def Ev.c4() -> {Links.Html.half(R.LkEv{}, B.Out.take(2n, B.Out.drop(3n, B.Out.drop(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages())))))) == True{} : Bool}:
  {==}

def Ev.c5() -> {Links.Html.half(R.LkEv{}, B.Out.take(3n, B.Out.drop(2n, B.Out.drop(3n, B.Out.drop(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages()))))))) == True{} : Bool}:
  {==}

def Ev.c6() -> {Links.Html.half(R.LkEv{}, B.Out.take(3n, B.Out.drop(3n, B.Out.drop(2n, B.Out.drop(3n, B.Out.drop(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages())))))))) == True{} : Bool}:
  {==}

def Ev.c7() -> {Links.Html.half(R.LkEv{}, B.Out.drop(3n, B.Out.drop(3n, B.Out.drop(2n, B.Out.drop(3n, B.Out.drop(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages())))))))) == True{} : Bool}:
  {==}

def Ev.all() -> {Links.Html.half(R.LkEv{}, S.Site.pages()) == True{} : Bool}:
  Half.split(R.LkEv{}, 2n, S.Site.pages(), Ev.c0(), Half.split(R.LkEv{}, 1n, B.Out.drop(2n, S.Site.pages()), Ev.c1(), Half.split(R.LkEv{}, 3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages())), Ev.c2(), Half.split(R.LkEv{}, 3n, B.Out.drop(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages()))), Ev.c3(), Half.split(R.LkEv{}, 2n, B.Out.drop(3n, B.Out.drop(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages())))), Ev.c4(), Half.split(R.LkEv{}, 3n, B.Out.drop(2n, B.Out.drop(3n, B.Out.drop(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages()))))), Ev.c5(), Half.split(R.LkEv{}, 3n, B.Out.drop(3n, B.Out.drop(2n, B.Out.drop(3n, B.Out.drop(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages())))))), Ev.c6(), Ev.c7())))))))

# half Od: chunks of 2, 1, 3, 3, 2, 3, 3 pages, then the rest

def Od.c0() -> {Links.Html.half(R.LkOd{}, B.Out.take(2n, S.Site.pages())) == True{} : Bool}:
  {==}

def Od.c1() -> {Links.Html.half(R.LkOd{}, B.Out.take(1n, B.Out.drop(2n, S.Site.pages()))) == True{} : Bool}:
  {==}

def Od.c2() -> {Links.Html.half(R.LkOd{}, B.Out.take(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages())))) == True{} : Bool}:
  {==}

def Od.c3() -> {Links.Html.half(R.LkOd{}, B.Out.take(3n, B.Out.drop(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages()))))) == True{} : Bool}:
  {==}

def Od.c4() -> {Links.Html.half(R.LkOd{}, B.Out.take(2n, B.Out.drop(3n, B.Out.drop(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages())))))) == True{} : Bool}:
  {==}

def Od.c5() -> {Links.Html.half(R.LkOd{}, B.Out.take(3n, B.Out.drop(2n, B.Out.drop(3n, B.Out.drop(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages()))))))) == True{} : Bool}:
  {==}

def Od.c6() -> {Links.Html.half(R.LkOd{}, B.Out.take(3n, B.Out.drop(3n, B.Out.drop(2n, B.Out.drop(3n, B.Out.drop(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages())))))))) == True{} : Bool}:
  {==}

def Od.c7() -> {Links.Html.half(R.LkOd{}, B.Out.drop(3n, B.Out.drop(3n, B.Out.drop(2n, B.Out.drop(3n, B.Out.drop(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages())))))))) == True{} : Bool}:
  {==}

def Od.all() -> {Links.Html.half(R.LkOd{}, S.Site.pages()) == True{} : Bool}:
  Half.split(R.LkOd{}, 2n, S.Site.pages(), Od.c0(), Half.split(R.LkOd{}, 1n, B.Out.drop(2n, S.Site.pages()), Od.c1(), Half.split(R.LkOd{}, 3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages())), Od.c2(), Half.split(R.LkOd{}, 3n, B.Out.drop(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages()))), Od.c3(), Half.split(R.LkOd{}, 2n, B.Out.drop(3n, B.Out.drop(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages())))), Od.c4(), Half.split(R.LkOd{}, 3n, B.Out.drop(2n, B.Out.drop(3n, B.Out.drop(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages()))))), Od.c5(), Half.split(R.LkOd{}, 3n, B.Out.drop(3n, B.Out.drop(2n, B.Out.drop(3n, B.Out.drop(3n, B.Out.drop(1n, B.Out.drop(2n, S.Site.pages())))))), Od.c6(), Od.c7())))))))

def Links.links_html():
  All.both(S.Site.pages(), Ev.all(), Od.all())
