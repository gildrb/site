# gildrb.com's laws: internal links (R10), what is served
# =======================================================
#
# Terms of ../links.bend, which states the laws.

import Base
import ../base/html/tokens.bend as H
import ../base/page.bend as Laws
import ../../build/site.bend as S
import ./url.bend as U

# Terms: which keys are served
# ----------------------------

# the order of two strings, character by character (code points); one
# recursive call per character
def Ord.next(c: Cmp, rest: Cmp) -> Cmp:
  match c:
    case EQ{}:
      rest
    case LT{}:
      LT{}
    case GT{}:
      GT{}

def Ord.go(a: String, b: String) -> Cmp:
  match a:
    case SNil{}:
      match b:
        case SNil{}:
          EQ{}
        case SCon{y, bt}:
          LT{}
    case SCon{Chr{x}, at}:
      match b:
        case SNil{}:
          GT{}
        case SCon{Chr{y}, bt}:
          Ord.next(U32.cmp(x, y), Ord.go(at, bt))

def Ord.is_eq(c: Cmp) -> Bool:
  match c:
    case EQ{}:
      True{}
    case _:
      False{}

# two strings are equal (Ord.go)
def Ord.eq(a: String, b: String) -> Bool:
  Ord.is_eq(Ord.go(a, b))

# s is in xs (Ord.eq)
def Ord.mem(xs: List<&2, String>, +s: String) -> Bool:
  match xs:
    case Nil{}:
      False{}
    case Con{x, t}:
      Ord.eq(x, s) || Ord.mem(t, s)

# Terms: keys in a compact form
# -----------------------------

# a character as keys compare it: printable ASCII as its 7 bits, high bit
# first, any other character as itself (a Char is 32 bits, and comparing
# two costs a step per bit). Cp.chr undoes Cp.of
type LCp is Data:
  LkA{b6: Bool, b5: Bool, b4: Bool, b3: Bool, b2: Bool, b1: Bool, b0: Bool}
  LkU{c: Char}

def Cp.of(c: Char) -> LCp:
  match c:
    case Chr{32}:
      LkA{False{}, True{}, False{}, False{}, False{}, False{}, False{}}
    case Chr{33}:
      LkA{False{}, True{}, False{}, False{}, False{}, False{}, True{}}
    case Chr{34}:
      LkA{False{}, True{}, False{}, False{}, False{}, True{}, False{}}
    case Chr{35}:
      LkA{False{}, True{}, False{}, False{}, False{}, True{}, True{}}
    case Chr{36}:
      LkA{False{}, True{}, False{}, False{}, True{}, False{}, False{}}
    case Chr{37}:
      LkA{False{}, True{}, False{}, False{}, True{}, False{}, True{}}
    case Chr{38}:
      LkA{False{}, True{}, False{}, False{}, True{}, True{}, False{}}
    case Chr{39}:
      LkA{False{}, True{}, False{}, False{}, True{}, True{}, True{}}
    case Chr{40}:
      LkA{False{}, True{}, False{}, True{}, False{}, False{}, False{}}
    case Chr{41}:
      LkA{False{}, True{}, False{}, True{}, False{}, False{}, True{}}
    case Chr{42}:
      LkA{False{}, True{}, False{}, True{}, False{}, True{}, False{}}
    case Chr{43}:
      LkA{False{}, True{}, False{}, True{}, False{}, True{}, True{}}
    case Chr{44}:
      LkA{False{}, True{}, False{}, True{}, True{}, False{}, False{}}
    case Chr{45}:
      LkA{False{}, True{}, False{}, True{}, True{}, False{}, True{}}
    case Chr{46}:
      LkA{False{}, True{}, False{}, True{}, True{}, True{}, False{}}
    case Chr{47}:
      LkA{False{}, True{}, False{}, True{}, True{}, True{}, True{}}
    case Chr{48}:
      LkA{False{}, True{}, True{}, False{}, False{}, False{}, False{}}
    case Chr{49}:
      LkA{False{}, True{}, True{}, False{}, False{}, False{}, True{}}
    case Chr{50}:
      LkA{False{}, True{}, True{}, False{}, False{}, True{}, False{}}
    case Chr{51}:
      LkA{False{}, True{}, True{}, False{}, False{}, True{}, True{}}
    case Chr{52}:
      LkA{False{}, True{}, True{}, False{}, True{}, False{}, False{}}
    case Chr{53}:
      LkA{False{}, True{}, True{}, False{}, True{}, False{}, True{}}
    case Chr{54}:
      LkA{False{}, True{}, True{}, False{}, True{}, True{}, False{}}
    case Chr{55}:
      LkA{False{}, True{}, True{}, False{}, True{}, True{}, True{}}
    case Chr{56}:
      LkA{False{}, True{}, True{}, True{}, False{}, False{}, False{}}
    case Chr{57}:
      LkA{False{}, True{}, True{}, True{}, False{}, False{}, True{}}
    case Chr{58}:
      LkA{False{}, True{}, True{}, True{}, False{}, True{}, False{}}
    case Chr{59}:
      LkA{False{}, True{}, True{}, True{}, False{}, True{}, True{}}
    case Chr{60}:
      LkA{False{}, True{}, True{}, True{}, True{}, False{}, False{}}
    case Chr{61}:
      LkA{False{}, True{}, True{}, True{}, True{}, False{}, True{}}
    case Chr{62}:
      LkA{False{}, True{}, True{}, True{}, True{}, True{}, False{}}
    case Chr{63}:
      LkA{False{}, True{}, True{}, True{}, True{}, True{}, True{}}
    case Chr{64}:
      LkA{True{}, False{}, False{}, False{}, False{}, False{}, False{}}
    case Chr{65}:
      LkA{True{}, False{}, False{}, False{}, False{}, False{}, True{}}
    case Chr{66}:
      LkA{True{}, False{}, False{}, False{}, False{}, True{}, False{}}
    case Chr{67}:
      LkA{True{}, False{}, False{}, False{}, False{}, True{}, True{}}
    case Chr{68}:
      LkA{True{}, False{}, False{}, False{}, True{}, False{}, False{}}
    case Chr{69}:
      LkA{True{}, False{}, False{}, False{}, True{}, False{}, True{}}
    case Chr{70}:
      LkA{True{}, False{}, False{}, False{}, True{}, True{}, False{}}
    case Chr{71}:
      LkA{True{}, False{}, False{}, False{}, True{}, True{}, True{}}
    case Chr{72}:
      LkA{True{}, False{}, False{}, True{}, False{}, False{}, False{}}
    case Chr{73}:
      LkA{True{}, False{}, False{}, True{}, False{}, False{}, True{}}
    case Chr{74}:
      LkA{True{}, False{}, False{}, True{}, False{}, True{}, False{}}
    case Chr{75}:
      LkA{True{}, False{}, False{}, True{}, False{}, True{}, True{}}
    case Chr{76}:
      LkA{True{}, False{}, False{}, True{}, True{}, False{}, False{}}
    case Chr{77}:
      LkA{True{}, False{}, False{}, True{}, True{}, False{}, True{}}
    case Chr{78}:
      LkA{True{}, False{}, False{}, True{}, True{}, True{}, False{}}
    case Chr{79}:
      LkA{True{}, False{}, False{}, True{}, True{}, True{}, True{}}
    case Chr{80}:
      LkA{True{}, False{}, True{}, False{}, False{}, False{}, False{}}
    case Chr{81}:
      LkA{True{}, False{}, True{}, False{}, False{}, False{}, True{}}
    case Chr{82}:
      LkA{True{}, False{}, True{}, False{}, False{}, True{}, False{}}
    case Chr{83}:
      LkA{True{}, False{}, True{}, False{}, False{}, True{}, True{}}
    case Chr{84}:
      LkA{True{}, False{}, True{}, False{}, True{}, False{}, False{}}
    case Chr{85}:
      LkA{True{}, False{}, True{}, False{}, True{}, False{}, True{}}
    case Chr{86}:
      LkA{True{}, False{}, True{}, False{}, True{}, True{}, False{}}
    case Chr{87}:
      LkA{True{}, False{}, True{}, False{}, True{}, True{}, True{}}
    case Chr{88}:
      LkA{True{}, False{}, True{}, True{}, False{}, False{}, False{}}
    case Chr{89}:
      LkA{True{}, False{}, True{}, True{}, False{}, False{}, True{}}
    case Chr{90}:
      LkA{True{}, False{}, True{}, True{}, False{}, True{}, False{}}
    case Chr{91}:
      LkA{True{}, False{}, True{}, True{}, False{}, True{}, True{}}
    case Chr{92}:
      LkA{True{}, False{}, True{}, True{}, True{}, False{}, False{}}
    case Chr{93}:
      LkA{True{}, False{}, True{}, True{}, True{}, False{}, True{}}
    case Chr{94}:
      LkA{True{}, False{}, True{}, True{}, True{}, True{}, False{}}
    case Chr{95}:
      LkA{True{}, False{}, True{}, True{}, True{}, True{}, True{}}
    case Chr{96}:
      LkA{True{}, True{}, False{}, False{}, False{}, False{}, False{}}
    case Chr{97}:
      LkA{True{}, True{}, False{}, False{}, False{}, False{}, True{}}
    case Chr{98}:
      LkA{True{}, True{}, False{}, False{}, False{}, True{}, False{}}
    case Chr{99}:
      LkA{True{}, True{}, False{}, False{}, False{}, True{}, True{}}
    case Chr{100}:
      LkA{True{}, True{}, False{}, False{}, True{}, False{}, False{}}
    case Chr{101}:
      LkA{True{}, True{}, False{}, False{}, True{}, False{}, True{}}
    case Chr{102}:
      LkA{True{}, True{}, False{}, False{}, True{}, True{}, False{}}
    case Chr{103}:
      LkA{True{}, True{}, False{}, False{}, True{}, True{}, True{}}
    case Chr{104}:
      LkA{True{}, True{}, False{}, True{}, False{}, False{}, False{}}
    case Chr{105}:
      LkA{True{}, True{}, False{}, True{}, False{}, False{}, True{}}
    case Chr{106}:
      LkA{True{}, True{}, False{}, True{}, False{}, True{}, False{}}
    case Chr{107}:
      LkA{True{}, True{}, False{}, True{}, False{}, True{}, True{}}
    case Chr{108}:
      LkA{True{}, True{}, False{}, True{}, True{}, False{}, False{}}
    case Chr{109}:
      LkA{True{}, True{}, False{}, True{}, True{}, False{}, True{}}
    case Chr{110}:
      LkA{True{}, True{}, False{}, True{}, True{}, True{}, False{}}
    case Chr{111}:
      LkA{True{}, True{}, False{}, True{}, True{}, True{}, True{}}
    case Chr{112}:
      LkA{True{}, True{}, True{}, False{}, False{}, False{}, False{}}
    case Chr{113}:
      LkA{True{}, True{}, True{}, False{}, False{}, False{}, True{}}
    case Chr{114}:
      LkA{True{}, True{}, True{}, False{}, False{}, True{}, False{}}
    case Chr{115}:
      LkA{True{}, True{}, True{}, False{}, False{}, True{}, True{}}
    case Chr{116}:
      LkA{True{}, True{}, True{}, False{}, True{}, False{}, False{}}
    case Chr{117}:
      LkA{True{}, True{}, True{}, False{}, True{}, False{}, True{}}
    case Chr{118}:
      LkA{True{}, True{}, True{}, False{}, True{}, True{}, False{}}
    case Chr{119}:
      LkA{True{}, True{}, True{}, False{}, True{}, True{}, True{}}
    case Chr{120}:
      LkA{True{}, True{}, True{}, True{}, False{}, False{}, False{}}
    case Chr{121}:
      LkA{True{}, True{}, True{}, True{}, False{}, False{}, True{}}
    case Chr{122}:
      LkA{True{}, True{}, True{}, True{}, False{}, True{}, False{}}
    case Chr{123}:
      LkA{True{}, True{}, True{}, True{}, False{}, True{}, True{}}
    case Chr{124}:
      LkA{True{}, True{}, True{}, True{}, True{}, False{}, False{}}
    case Chr{125}:
      LkA{True{}, True{}, True{}, True{}, True{}, False{}, True{}}
    case Chr{126}:
      LkA{True{}, True{}, True{}, True{}, True{}, True{}, False{}}
    case _:
      LkU{c}

def Cp.chr(p: LCp) -> Char:
  match p:
    case LkA{b6, b5, b4, b3, b2, b1, b0}:
      Chr{U32{WCon{b0, WCon{b1, WCon{b2, WCon{b3, WCon{b4, WCon{b5, WCon{b6, Word.zero(25n)}}}}}}}}}
    case LkU{c}:
      c

def Cp.str(s: String) -> List<&2, LCp>:
  match s:
    case SNil{}:
      []
    case SCon{c, t}:
      Cp.of(c) <> Cp.str(t)

def Cp.back(k: List<&2, LCp>) -> String:
  match k:
    case Nil{}:
      SNil{}
    case Con{p, t}:
      SCon{Cp.chr(p), Cp.back(t)}

def Cp.strs(ks: List<&2, String>) -> List<&2, List<&2, LCp>>:
  match ks:
    case Nil{}:
      []
    case Con{k, t}:
      Cp.str(k) <> Cp.strs(t)

def Cp.backs(ks: List<&2, List<&2, LCp>>) -> List<&2, String>:
  match ks:
    case Nil{}:
      []
    case Con{k, t}:
      Cp.back(k) <> Cp.backs(t)

def Cp.bit(a: Bool, b: Bool, rest: Cmp) -> Cmp:
  match a b:
    case False{} False{}:
      rest
    case False{} True{}:
      LT{}
    case True{} False{}:
      GT{}
    case True{} True{}:
      rest

# the order of two characters: by code point, but printable ASCII before
# any other character (S.Site.paths holds no other ASCII)
def Cp.cmp(a: LCp, b: LCp) -> Cmp:
  match a b:
    case LkA{a6, a5, a4, a3, a2, a1, a0} LkA{b6, b5, b4, b3, b2, b1, b0}:
      Cp.bit(a6, b6, Cp.bit(a5, b5, Cp.bit(a4, b4, Cp.bit(a3, b3, Cp.bit(a2, b2, Cp.bit(a1, b1, Cp.bit(a0, b0, EQ{})))))))
    case LkA{a6, a5, a4, a3, a2, a1, a0} LkU{y}:
      LT{}
    case LkU{x} LkA{b6, b5, b4, b3, b2, b1, b0}:
      GT{}
    case LkU{Chr{x}} LkU{Chr{y}}:
      U32.cmp(x, y)

# the order of two keys, character by character (Cp.cmp)
def Key.go(a: List<&2, LCp>, b: List<&2, LCp>) -> Cmp:
  match a:
    case Nil{}:
      match b:
        case Nil{}:
          EQ{}
        case Con{y, bt}:
          LT{}
    case Con{x, at}:
      match b:
        case Nil{}:
          GT{}
        case Con{y, bt}:
          Ord.next(Cp.cmp(x, y), Key.go(at, bt))

# Key.tri compares a key with a path as Key.go does, and gives the path
# back whole, so that Df never copies a path: a path's characters are
# converted (Cp.str is lazy) only as far as they are compared. Tr.loop
# walks the common prefix, keeping the path's characters seen (reversed)
type LTri is Data:
  LkTri{c: Cmp, p: List<&2, LCp>}

type LTr is Data:
  LkTr{q: List<&2, LCp>, p: List<&2, LCp>, seen: List<&2, LCp>}
  LkTrEnd{r: LTri}

def Tr.dec(c: Cmp, y: LCp, qt: List<&2, LCp>, pt: List<&2, LCp>, seen: List<&2, LCp>) -> LTr:
  match c:
    case EQ{}:
      LkTr{qt, pt, y <> seen}
    case LT{}:
      LkTrEnd{LkTri{LT{}, List.reverse.go(&2, LCp, seen, y <> pt)}}
    case GT{}:
      LkTrEnd{LkTri{GT{}, List.reverse.go(&2, LCp, seen, y <> pt)}}

def Tr.con(p: List<&2, LCp>, x: LCp, qt: List<&2, LCp>, seen: List<&2, LCp>) -> LTr:
  match p:
    case Nil{}:
      LkTrEnd{LkTri{GT{}, List.reverse.go(&2, LCp, seen, [])}}
    case Con{+y, pt}:
      Tr.dec(Cp.cmp(x, y), y, qt, pt, seen)

def Tr.nil(p: List<&2, LCp>, seen: List<&2, LCp>) -> LTr:
  match p:
    case Nil{}:
      LkTrEnd{LkTri{EQ{}, List.reverse.go(&2, LCp, seen, [])}}
    case Con{y, pt}:
      LkTrEnd{LkTri{LT{}, List.reverse.go(&2, LCp, seen, y <> pt)}}

def Tr.step(q: List<&2, LCp>, p: List<&2, LCp>, seen: List<&2, LCp>) -> LTr:
  match q:
    case Nil{}:
      Tr.nil(p, seen)
    case Con{x, qt}:
      Tr.con(p, x, qt, seen)

# out of fuel: LT (the key counts as not found)
def Tr.fin(st: LTr) -> LTri:
  match st:
    case LkTr{q, p, seen}:
      LkTri{LT{}, List.reverse.go(&2, LCp, seen, p)}
    case LkTrEnd{r}:
      r

def Tr.loop(fuel: Nat, st: LTr) -> LTri:
  match fuel:
    case 0n:
      Tr.fin(st)
    case 1n+f:
      match st:
        case LkTr{q, p, seen}:
          Tr.loop(f, Tr.step(q, p, seen))
        case LkTrEnd{r}:
          r

# fuel: one step per character of the key, one to end
def Key.tri(+q: List<&2, LCp>, p: List<&2, LCp>) -> LTri:
  Tr.loop(2n+List.length(&2, LCp, q), LkTr{q, p, []})

# Df.loop walks a list of keys and the list of paths, both sorted
# (Key.go), and keeps the keys that are not paths: one step drops
# the first key (found when equal to the first path, else kept) or the
# first path (when the first key is greater). Each step is computed by
# Df.step (one recursive call per def; a value used in two branches, or
# a parameter used in two branches of a match on a later parameter, is
# copied at every step: Df copies each key, never a path)
type LDf is Data:
  LkDf{qs: List<&2, List<&2, LCp>>, ps: List<&2, List<&2, LCp>>, out: List<&2, List<&2, LCp>>}

def Df.dec(c: Cmp, q: List<&2, LCp>, qt: List<&2, List<&2, LCp>>, p: List<&2, LCp>, pt: List<&2, List<&2, LCp>>, out: List<&2, List<&2, LCp>>) -> LDf:
  match c:
    case EQ{}:
      LkDf{qt, Con{p, pt}, out}
    case LT{}:
      LkDf{qt, Con{p, pt}, q <> out}
    case GT{}:
      LkDf{Con{q, qt}, pt, out}

def Df.at(t: LTri, q: List<&2, LCp>, qt: List<&2, List<&2, LCp>>, pt: List<&2, List<&2, LCp>>, out: List<&2, List<&2, LCp>>) -> LDf:
  match t:
    case LkTri{c, p}:
      Df.dec(c, q, qt, p, pt, out)

def Df.step(ps: List<&2, List<&2, LCp>>, +q: List<&2, LCp>, qt: List<&2, List<&2, LCp>>, out: List<&2, List<&2, LCp>>) -> LDf:
  match ps:
    case Nil{}:
      LkDf{[], [], q <> List.append(&2, List<&2, LCp>, qt, out)}
    case Con{p, pt}:
      Df.at(Key.tri(q, p), q, qt, pt, out)

# out of fuel: every key left counts as not found
def Df.fin(st: LDf) -> List<&2, List<&2, LCp>>:
  match st:
    case LkDf{qs, ps, out}:
      List.append(&2, List<&2, LCp>, qs, out)

def Df.loop(fuel: Nat, st: LDf) -> List<&2, List<&2, LCp>>:
  match fuel:
    case 0n:
      Df.fin(st)
    case 1n+f:
      match st:
        case LkDf{qs, ps, out}:
          match qs:
            case Nil{}:
              out
            case Con{q, qt}:
              Df.loop(f, Df.step(ps, q, qt, out))

# the keys of qs that are not in ps, both sorted (Key.go); n: the length
# of ps (ps is read lazily); fuel: one step per key and per path
def Df.of(+qs: List<&2, List<&2, LCp>>, ps: List<&2, List<&2, LCp>>, n: Nat) -> List<&2, List<&2, LCp>>:
  Df.loop(1n+Nat.add(List.length(&2, List<&2, LCp>, qs), n), LkDf{qs, ps, []})

# Sort: a bottom-up merge sort by Key.go that keeps each key once.
# Mg.loop merges two sorted runs; one step moves the smaller head onto the
# merged prefix (reversed), or on a tie the first run's head, dropping the
# second's. Each def matches its first parameter and makes one recursive
# call (see Df.loop)
type LMg is Data:
  LkMg{xs: List<&2, List<&2, LCp>>, ys: List<&2, List<&2, LCp>>, acc: List<&2, List<&2, LCp>>}
  LkMgEnd{out: List<&2, List<&2, LCp>>}

def Mg.dec(c: Cmp, x: List<&2, LCp>, xt: List<&2, List<&2, LCp>>, y: List<&2, LCp>, yt: List<&2, List<&2, LCp>>, acc: List<&2, List<&2, LCp>>) -> LMg:
  match c:
    case GT{}:
      LkMg{x <> xt, yt, y <> acc}
    case EQ{}:
      LkMg{xt, yt, x <> acc}
    case LT{}:
      LkMg{xt, y <> yt, x <> acc}

def Mg.at(ys: List<&2, List<&2, LCp>>, +x: List<&2, LCp>, xt: List<&2, List<&2, LCp>>, acc: List<&2, List<&2, LCp>>) -> LMg:
  match ys:
    case Nil{}:
      LkMgEnd{List.reverse.go(&2, List<&2, LCp>, acc, x <> xt)}
    case Con{+y, yt}:
      Mg.dec(Key.go(x, y), x, xt, y, yt, acc)

def Mg.step(xs: List<&2, List<&2, LCp>>, ys: List<&2, List<&2, LCp>>, acc: List<&2, List<&2, LCp>>) -> LMg:
  match xs:
    case Nil{}:
      LkMgEnd{List.reverse.go(&2, List<&2, LCp>, acc, ys)}
    case Con{x, xt}:
      Mg.at(ys, x, xt, acc)

# out of fuel: the runs as they are
def Mg.fin(st: LMg) -> List<&2, List<&2, LCp>>:
  match st:
    case LkMg{xs, ys, acc}:
      List.reverse.go(&2, List<&2, LCp>, acc, List.append(&2, List<&2, LCp>, xs, ys))
    case LkMgEnd{out}:
      out

def Mg.loop(fuel: Nat, st: LMg) -> List<&2, List<&2, LCp>>:
  match fuel:
    case 0n:
      Mg.fin(st)
    case 1n+f:
      match st:
        case LkMg{xs, ys, acc}:
          Mg.loop(f, Mg.step(xs, ys, acc))
        case LkMgEnd{out}:
          out

# two sorted runs merged; fuel: one step per element, one to end
def Mg.of(+xs: List<&2, List<&2, LCp>>, +ys: List<&2, List<&2, LCp>>) -> List<&2, List<&2, LCp>>:
  Mg.loop(1n+Nat.add(List.length(&2, List<&2, LCp>, xs), List.length(&2, List<&2, LCp>, ys)), LkMg{xs, ys, []})

# one pass: neighbouring runs merged
def Srt.pass(rs: List<&2, List<&2, List<&2, LCp>>>) -> List<&2, List<&2, List<&2, LCp>>>:
  match rs:
    case Nil{}:
      []
    case Con{r, Nil{}}:
      [r]
    case Con{r, Con{r2, t}}:
      Mg.of(r, r2) <> Srt.pass(t)

# passes until one run is left; fuel: one pass per run (out of fuel: the
# runs in order)
def Srt.go(fuel: Nat, rs: List<&2, List<&2, List<&2, LCp>>>) -> List<&2, List<&2, LCp>>:
  match fuel:
    case 0n:
      List.concat(&2, List<&2, LCp>, rs)
    case 1n+f:
      match rs:
        case Nil{}:
          []
        case Con{r, Nil{}}:
          r
        case Con{r, Con{r2, t}}:
          Srt.go(f, Srt.pass(r <> r2 <> t))

def Srt.runs(ks: List<&2, List<&2, LCp>>) -> List<&2, List<&2, List<&2, LCp>>>:
  match ks:
    case Nil{}:
      []
    case Con{k, t}:
      [k] <> Srt.runs(t)

# ks sorted by Key.go, each key once
def Srt.of(+ks: List<&2, List<&2, LCp>>) -> List<&2, List<&2, LCp>>:
  Srt.go(List.length(&2, List<&2, LCp>, ks), Srt.runs(ks))

# the key is "" or ends in "/": a folder
def Dir.like(+k: String) -> Bool:
  Ord.eq(k, "") || String.ends_with(k, "/")

# key.html, or a folder's key + "index.html", is a page (S.Site.pages is
# every .html file of dist/)
def Key.pretty(+k: String) -> Bool:
  +pg = Laws.Spec.page_paths()
  Ord.mem(pg, String.append(k, ".html")) || (Dir.like(k) && Ord.mem(pg, String.append(k, "index.html")))

def Res.at(b: Bool, k: String, rest: List<&2, String>) -> List<&2, String>:
  match b:
    case True{}:
      rest
    case False{}:
      k <> rest

def Res.left(ks: List<&2, String>) -> List<&2, String>:
  match ks:
    case Nil{}:
      []
    case Con{+k, t}:
      Res.at(Key.pretty(k), k, Res.left(t))

# the keys that are no file of dist/ (S.Site.paths, in Python's order,
# which is Key.go's), no P.html and no folder's index.html
def Res.files(+s: List<&2, List<&2, LCp>>) -> List<&2, String>:
  Res.left(Cp.backs(Df.of(s, Cp.strs(S.Site.paths()), List.length(&2, String, S.Site.paths()))))

# A4: the paths functions/ serves, as keys
def Fn.routes() -> List<&2, String>:
  ["mcp", "mcp/server-card", ".well-known/mcp", "api", "api/v1", "api/profile", "api/v1/profile", "api/status", "api/v1/status", "porthmeus/install"]

# Terms: _redirects
# -----------------

# a rule: its source and its target, as keys
type LRule is Data:
  LkRule{src: String, tgt: String}

# no splat or placeholder
def Rd.plain(s: String) -> Bool:
  match s:
    case SNil{}:
      True{}
    case SCon{Chr{42}, t}:
      False{}
    case SCon{Chr{58}, t}:
      False{}
    case SCon{c, t}:
      Rd.plain(t)

def Rd.src(s: String) -> Maybe<&2, String>:
  match s:
    case SCon{Chr{47}, +t}:
      Bool.pick(Maybe<&2, String>, Rd.plain(t), Some{t}, None{})
    case _:
      None{}

def Rd.tk(m: Maybe<&2, String>) -> Maybe<&2, String>:
  match m:
    case None{}:
      None{}
    case Some{p}:
      Some{U.Dot.key(U.Cut.path(p))}

def Rd.tgt(t: String) -> Maybe<&2, String>:
  Rd.tk(U.Url.path("", U.Url.cls(t)))

def Rd.status(ws: List<&2, String>) -> Bool:
  match ws:
    case Nil{}:
      True{}
    case Con{s, t}:
      Ord.mem(["200", "301", "302", "303", "307", "308"], s)

def Rd.mk(ms: Maybe<&2, String>, mt: Maybe<&2, String>, ok: Bool) -> List<&2, LRule>:
  match ms:
    case None{}:
      []
    case Some{s}:
      match mt:
        case None{}:
          []
        case Some{t}:
          Bool.pick(List<&2, LRule>, ok, [LkRule{s, t}], [])

# a line's fields: source, target, status
def Rd.line(ws: List<&2, String>) -> List<&2, LRule>:
  match ws:
    case Con{s, Con{t, rest}}:
      Rd.mk(Rd.src(s), Rd.tgt(t), Rd.status(rest))
    case _:
      []

# s cut at each newline (cur: the line so far, reversed; a literal match
# per character, as Base's String.split compares 32-bit words)
def Ln.go(s: String, cur: String, acc: List<&2, String>) -> List<&2, String>:
  match s:
    case SNil{}:
      List.reverse(&2, String, String.reverse(cur) <> acc)
    case SCon{Chr{10}, t}:
      Ln.go(t, "", String.reverse(cur) <> acc)
    case SCon{c, t}:
      Ln.go(t, SCon{c, cur}, acc)

def Rd.lns(m: Maybe<&2, List<&2, String>>) -> List<&2, String>:
  match m:
    case None{}:
      []
    case Some{cs}:
      Ln.go(Laws.Spec.cat(cs), "", [])

# a source path ("/...") with a splat or placeholder
def Rd.wsrc(s: String) -> Bool:
  match s:
    case SCon{Chr{47}, t}:
      Bool.not(Rd.plain(t))
    case _:
      False{}

def Rd.wline(ws: List<&2, String>) -> Bool:
  match ws:
    case Con{s, Con{t, rest}}:
      Rd.wsrc(s)
    case _:
      False{}

# _redirects read once: its exact rules that serve a path (the file's
# lines in order: Pages applies the first rule whose source matches), and
# wild: a rule's source is a path with "*" or ":name". Such a rule could
# match an internal reference, which then fails (the site has none;
# "https://www.gildrb.com/*" is not a path: it matches only requests to
# the host www.gildrb.com, never a reference on gildrb.com)
type LRd is Data:
  LkRd{rules: List<&2, LRule>, wild: Bool}

def Rd.add(rest: LRd, +ws: List<&2, String>) -> LRd:
  match rest:
    case LkRd{r, w}:
      LkRd{List.append(&2, LRule, Rd.line(ws), r), Rd.wline(ws) || w}

def Rd.lines(ls: List<&2, String>) -> LRd:
  match ls:
    case Nil{}:
      LkRd{[], False{}}
    case Con{l, t}:
      Rd.add(Rd.lines(t), Laws.Spec.words(l))

def Rd.of() -> LRd:
  Rd.lines(Rd.lns(Laws.Spec.file("_redirects")))

# the target of the first rule whose source is k (Pages matches a static
# source exactly)
def Rd.find(rs: List<&2, LRule>, +k: String) -> Maybe<&2, String>:
  match rs:
    case Nil{}:
      None{}
    case Con{LkRule{s, t}, rest}:
      Bool.pick(Maybe<&2, String>, Ord.eq(s, k), Some{t}, Rd.find(rest, k))

# files Pages does not serve
def Hid.list() -> List<&2, String>:
  ["_headers", "_redirects", "_routes.json"]

# a key served by a file (not _headers, _redirects or _routes.json), as
# P.html or as a folder's index.html
def Key.file(+k: String) -> Bool:
  (Ord.mem(S.Site.paths(), k) && Bool.not(Ord.mem(Hid.list(), k))) || Key.pretty(k)

# m: the target of the rule a key matched, resolved as Pages does, at
# most n rules on: a function route (functions take no redirects); the
# source of a rule (redirects come before files); else a file (Key.file)
def Rd.chain(n: Nat, +rules: List<&2, LRule>, m: Maybe<&2, String>) -> Bool:
  match n:
    case 0n:
      False{}
    case 1n+p:
      match m:
        case None{}:
          False{}
        case Some{+t}:
          Ord.mem(Fn.routes(), t) || Bool.pick(Bool, Maybe.is_some(&2, String, Rd.find(rules, t)), Rd.chain(p, rules, Rd.find(rules, t)), Key.file(t))

def Rd.ok(+rules: List<&2, LRule>, +k: String) -> Bool:
  Rd.chain(List.length(&2, LRule, rules), rules, Rd.find(rules, k))

# each key is a function route (A4) or the source of a rule whose target
# is served (Rd.ok)
def Rest.ok(+rules: List<&2, LRule>, rs: List<&2, String>) -> Bool:
  match rs:
    case Nil{}:
      True{}
    case Con{+r, t}:
      (Ord.mem(Fn.routes(), r) || Rd.ok(rules, r)) && Rest.ok(rules, t)

def Rd.srcs(rs: List<&2, LRule>) -> List<&2, String>:
  match rs:
    case Nil{}:
      []
    case Con{LkRule{s, t}, rest}:
      s <> Rd.srcs(rest)

# the keys of r that are in s (both sorted, each key once): r without
# those of r not in s
def Both.of(+r: List<&2, List<&2, LCp>>, +s: List<&2, List<&2, LCp>>) -> List<&2, List<&2, LCp>>:
  +m = Srt.of(Df.of(r, s, List.length(&2, List<&2, LCp>, s)))
  Df.of(r, m, List.length(&2, List<&2, LCp>, m))

# R10's "served", as Cloudflare Pages resolves a path: a function route
# (A4; functions take no redirects); else, when the path is the source of
# a rule of _redirects, as its target (redirects come before files); else
# a file of dist/ but _headers, _redirects and _routes.json (Pages does
# not serve them), P.html, or a folder's index.html. A path rule with "*"
# or ":name" fails every file (wild: LRd). ks: every key of a file
def Served.with(+rules: List<&2, LRule>, wild: Bool, ks: List<&2, String>) -> Bool:
  +s = Srt.of(Cp.strs(ks))
  Bool.not(wild) && List.is_empty(&2, List<&2, LCp>, Both.of(Srt.of(Cp.strs(Hid.list())), s)) && Rest.ok(rules, Res.files(s)) && Rest.ok(rules, Cp.backs(Both.of(Srt.of(Cp.strs(Rd.srcs(rules))), s)))

# Terms: fragments
# ----------------

# the page a key is served from (at most n rules on): a function route
# (none), the source of a rule (its target's page), else the page, a file
# that is no page (None), P.html, a folder's index.html
def Pg.at(+k: String, rest: Maybe<&2, String>) -> Maybe<&2, String>:
  +pg = Laws.Spec.page_paths()
  Bool.pick(Maybe<&2, String>, Ord.mem(pg, k), Some{k}, Bool.pick(Maybe<&2, String>, Ord.mem(S.Site.paths(), k), None{}, Bool.pick(Maybe<&2, String>, Ord.mem(pg, String.append(k, ".html")), Some{String.append(k, ".html")}, Bool.pick(Maybe<&2, String>, Dir.like(k) && Ord.mem(pg, String.append(k, "index.html")), Some{String.append(k, "index.html")}, rest))))

def Pg.go(n: Nat, +rules: List<&2, LRule>, m: Maybe<&2, String>) -> Maybe<&2, String>:
  match n:
    case 0n:
      None{}
    case 1n+p:
      match m:
        case None{}:
          None{}
        case Some{+k}:
          Bool.pick(Maybe<&2, String>, Ord.mem(Fn.routes(), k), None{}, Bool.pick(Maybe<&2, String>, Maybe.is_some(&2, String, Rd.find(rules, k)), Pg.go(p, rules, Rd.find(rules, k)), Pg.at(k, None{})))

# the page a key is served from, if any (as Served.with resolves it)
def Pg.start(+rules: List<&2, LRule>, k: String) -> Maybe<&2, String>:
  Pg.go(1n+List.length(&2, LRule, rules), rules, Some{k})

def Frag.of(m: Maybe<&2, List<&2, H.Tok>>) -> List<&2, String>:
  match m:
    case None{}:
      []
    case Some{ts}:
      Laws.Spec.ids(ts)

# the id values of the page at q
def Frag.ids(q: String) -> List<&2, String>:
  Frag.of(Laws.Spec.toks(Laws.Spec.page(q)))

def Frag.in(mp: Maybe<&2, String>, +self: String, +ids: List<&2, String>, +f: String) -> Bool:
  match mp:
    case None{}:
      True{}
    case Some{+q}:
      Bool.pick(Bool, Ord.eq(q, self), Ord.mem(ids, f), Ord.mem(Frag.ids(q), f))

# a reference's fragment is empty, or the reference is not to an HTML
# page, or the fragment is an id on that page (ids: the ids of the file
# at self, the one this reference is in); a URL not in canonical form
# (U.LkBadRef) fails
def Frag.ok(+rules: List<&2, LRule>, +self: String, +ids: List<&2, String>, r: U.LRef) -> Bool:
  match r:
    case U.LkRef{k, None{}}:
      True{}
    case U.LkRef{k, Some{SNil{}}}:
      True{}
    case U.LkRef{+k, Some{SCon{+c, +t}}}:
      Bool.pick(Bool, Ord.eq(k, self), Ord.mem(ids, SCon{c, t}), Frag.in(Pg.start(rules, k), self, ids, SCon{c, t}))
    case U.LkBadRef{}:
      False{}

def Frag.all(+rules: List<&2, LRule>, +self: String, +ids: List<&2, String>, rs: List<&2, U.LRef>) -> Bool:
  match rs:
    case Nil{}:
      True{}
    case Con{r, t}:
      Frag.ok(rules, self, ids, r) && Frag.all(rules, self, ids, t)
