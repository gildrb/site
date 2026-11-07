# gildrb.com's proofs: canonical and metadata from one lexing per page
# ===================================================================
#
# Two.all computes, from one lexing of each page (Two.toks takes the
# tokens once), both Canon.all (law canonical) and Snip.all (law
# metadata): Two.all_eq, by induction. Each chunk (B.Pg.a-f: 3 pages
# each; 6 ran out of fuel) is computed once (Two.ca .. Two.cf), which
# gives R5 on the chunk (Two.canon_a, ...) and Snip.all of it equal to
# F.Fall.all of it (Two.snip_a, ...).

import Base
import ../../laws/base/html/tokens.bend as H
import ../../laws/base/html/tree.bend as T
import ../../build/site.bend as S
import ../../laws/meta.bend as Meta
import ./base.bend as B
import ./fall.bend as F

# R5 on one page, and what R6 reads from it
type Two is Data:
  Two{ok: Bool, snip: Maybe<&2, Meta.Snip>}

# R5 on pages, and what R6 reads from them
type Twos is Data:
  Twos{ok: Bool, snips: Maybe<&2, List<&2, Meta.Snip>>}

def Two.toks(+p: String, +ts: List<&2, H.Tok>) -> Two:
  Two{Meta.Canon.toks(p, ts), Meta.Snip.toks(p, ts)}

def Two.of(+p: String, m: Maybe<&2, List<&2, H.Tok>>) -> Two:
  match m:
    case None{}:
      Two{False{}, None{}}
    case Some{ts}:
      Two.toks(p, ts)

def Two.next(b: Bool, s: Maybe<&2, Meta.Snip>, ss: Maybe<&2, List<&2, Meta.Snip>>) -> Maybe<&2, List<&2, Meta.Snip>>:
  match b:
    case True{}:
      ss
    case False{}:
      Meta.Snip.cons(s, ss)

def Two.step(x: Two, b: Bool, r: Twos) -> Twos:
  match x r:
    case Two{c, s} Twos{cs, ss}:
      Twos{Bool.and(c, cs), Two.next(b, s, ss)}

def Two.all(fs: List<&2, S.Out>) -> Twos:
  match fs:
    case Nil{}:
      Twos{True{}, Some{[]}}
    case Con{S.Out{+p, text}, t}:
      Two.step(Two.of(p, T.Html.toks(text)), Meta.Url.lost(p), Two.all(t))

def Twos.okf(x: Twos) -> Bool:
  match x:
    case Twos{c, s}:
      c

def Twos.snf(x: Twos) -> Maybe<&2, List<&2, Meta.Snip>>:
  match x:
    case Twos{c, s}:
      s

# Two.all is Canon.all and Snip.all
# ---------------------------------

def Two.eq(+p: String, m: Maybe<&2, List<&2, H.Tok>>) -> {Two{Meta.Canon.of(p, m), Meta.Snip.page(p, m)} == Two.of(p, m) : Two}:
  match m:
    case None{}:
      {==}
    case Some{ts}:
      {==}

def Two.nx(b: Bool, -p: String, -text: List<&2, String>, -ss: Maybe<&2, List<&2, Meta.Snip>>) -> {Meta.Snip.next(b, p, text, ss) == Two.next(b, Meta.Snip.page(p, T.Html.toks(text)), ss) : Maybe<&2, List<&2, Meta.Snip>>}:
  match b:
    case True{}:
      {==}
    case False{}:
      {==}

def Two.all_eq(fs: List<&2, S.Out>) -> {Twos{Meta.Canon.all(fs), Meta.Snip.all(fs)} == Two.all(fs) : Twos}:
  match fs:
    case Nil{}:
      {==}
    case Con{S.Out{+p, +text}, +t}:
      %Two.eq(p, T.Html.toks(text)) : {Twos{Bool.and(Meta.Canon.of(p, T.Html.toks(text)), Meta.Canon.all(t)), Meta.Snip.next(Meta.Url.lost(p), p, text, Meta.Snip.all(t))} == Two.step(_, Meta.Url.lost(p), Two.all(t)) : Twos}
      %Two.all_eq(t) : {Twos{Bool.and(Meta.Canon.of(p, T.Html.toks(text)), Meta.Canon.all(t)), Meta.Snip.next(Meta.Url.lost(p), p, text, Meta.Snip.all(t))} == Two.step(Two{Meta.Canon.of(p, T.Html.toks(text)), Meta.Snip.page(p, T.Html.toks(text))}, Meta.Url.lost(p), _) : Twos}
      %Two.nx(Meta.Url.lost(p), p, text, Meta.Snip.all(t)) : {Twos{Bool.and(Meta.Canon.of(p, T.Html.toks(text)), Meta.Canon.all(t)), Meta.Snip.next(Meta.Url.lost(p), p, text, Meta.Snip.all(t))} == Twos{Bool.and(Meta.Canon.of(p, T.Html.toks(text)), Meta.Canon.all(t)), _} : Twos}
      {==}

# The chunks, each computed once
# ------------------------------

def Two.ca() -> {Two.all(B.Pg.a()) == Twos{True{}, F.Fall.all(B.Pg.a())} : Twos}:
  {==}

def Two.cb() -> {Two.all(B.Pg.b()) == Twos{True{}, F.Fall.all(B.Pg.b())} : Twos}:
  {==}

def Two.cc() -> {Two.all(B.Pg.c()) == Twos{True{}, F.Fall.all(B.Pg.c())} : Twos}:
  {==}

def Two.cd() -> {Two.all(B.Pg.d()) == Twos{True{}, F.Fall.all(B.Pg.d())} : Twos}:
  {==}

def Two.ce() -> {Two.all(B.Pg.e()) == Twos{True{}, F.Fall.all(B.Pg.e())} : Twos}:
  {==}

def Two.cf() -> {Two.all(B.Pg.f()) == Twos{True{}, F.Fall.all(B.Pg.f())} : Twos}:
  {==}

# a chunk's computed Two.all, as Canon.all and Snip.all
def Two.chunk(fs: List<&2, S.Out>, e: {Two.all(fs) == Twos{True{}, F.Fall.all(fs)} : Twos}) -> {Twos{Meta.Canon.all(fs), Meta.Snip.all(fs)} == Twos{True{}, F.Fall.all(fs)} : Twos}:
  Equal.trans(Twos, Twos{Meta.Canon.all(fs), Meta.Snip.all(fs)}, Two.all(fs), Twos{True{}, F.Fall.all(fs)}, Two.all_eq(fs), e)

def Two.canon(+fs: List<&2, S.Out>, e: {Two.all(fs) == Twos{True{}, F.Fall.all(fs)} : Twos}) -> {Meta.Canon.all(fs) == True{} : Bool}:
  Equal.cong(Twos, Bool, Twos.okf, Twos{Meta.Canon.all(fs), Meta.Snip.all(fs)}, Twos{True{}, F.Fall.all(fs)}, Two.chunk(fs, e))

def Two.snip(+fs: List<&2, S.Out>, e: {Two.all(fs) == Twos{True{}, F.Fall.all(fs)} : Twos}) -> {Meta.Snip.all(fs) == F.Fall.all(fs) : Maybe<&2, List<&2, Meta.Snip>>}:
  Equal.cong(Twos, Maybe<&2, List<&2, Meta.Snip>>, Twos.snf, Twos{Meta.Canon.all(fs), Meta.Snip.all(fs)}, Twos{True{}, F.Fall.all(fs)}, Two.chunk(fs, e))

def Two.canon_a() -> {Meta.Canon.all(B.Pg.a()) == True{} : Bool}:
  Two.canon(B.Pg.a(), Two.ca())

def Two.canon_b() -> {Meta.Canon.all(B.Pg.b()) == True{} : Bool}:
  Two.canon(B.Pg.b(), Two.cb())

def Two.canon_c() -> {Meta.Canon.all(B.Pg.c()) == True{} : Bool}:
  Two.canon(B.Pg.c(), Two.cc())

def Two.canon_d() -> {Meta.Canon.all(B.Pg.d()) == True{} : Bool}:
  Two.canon(B.Pg.d(), Two.cd())

def Two.canon_e() -> {Meta.Canon.all(B.Pg.e()) == True{} : Bool}:
  Two.canon(B.Pg.e(), Two.ce())

def Two.canon_f() -> {Meta.Canon.all(B.Pg.f()) == True{} : Bool}:
  Two.canon(B.Pg.f(), Two.cf())

def Two.snip_a() -> {Meta.Snip.all(B.Pg.a()) == F.Fall.all(B.Pg.a()) : Maybe<&2, List<&2, Meta.Snip>>}:
  Two.snip(B.Pg.a(), Two.ca())

def Two.snip_b() -> {Meta.Snip.all(B.Pg.b()) == F.Fall.all(B.Pg.b()) : Maybe<&2, List<&2, Meta.Snip>>}:
  Two.snip(B.Pg.b(), Two.cb())

def Two.snip_c() -> {Meta.Snip.all(B.Pg.c()) == F.Fall.all(B.Pg.c()) : Maybe<&2, List<&2, Meta.Snip>>}:
  Two.snip(B.Pg.c(), Two.cc())

def Two.snip_d() -> {Meta.Snip.all(B.Pg.d()) == F.Fall.all(B.Pg.d()) : Maybe<&2, List<&2, Meta.Snip>>}:
  Two.snip(B.Pg.d(), Two.cd())

def Two.snip_e() -> {Meta.Snip.all(B.Pg.e()) == F.Fall.all(B.Pg.e()) : Maybe<&2, List<&2, Meta.Snip>>}:
  Two.snip(B.Pg.e(), Two.ce())

def Two.snip_f() -> {Meta.Snip.all(B.Pg.f()) == F.Fall.all(B.Pg.f()) : Maybe<&2, List<&2, Meta.Snip>>}:
  Two.snip(B.Pg.f(), Two.cf())
