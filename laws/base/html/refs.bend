# gildrb.com's laws: the HTML they read, character references
# ============================================================
#
# Cr.step / Cr.fin decode the character references of an attribute value
# (lexer.bend), and Cr.dec of any string, as a browser does, for the
# references written in the one form every browser reads the same way:
#
# - "&amp;" "&lt;" "&gt;" "&quot;" "&apos;" "&nbsp;" (with the ";", case
#   as written): & < > " ' and U+00A0;
# - "&#" decimal digits ";" and "&#x" (or "&#X") hex digits ";", for a
#   code point a browser keeps as it is: tab, LF, FF, U+0020-U+007E,
#   U+00A0-U+D7FF, U+E000-U+10FFFF;
# - a "&" not followed by an ASCII letter, digit or "#" (or at the end) is
#   the character "&" itself.
#
# Every other reference is refused (None): any other name (a browser knows
# about 2,200, and reads some without the ";"), a name or number with no
# ";", "&#" with no digits, and a number a browser replaces or reads as
# another character (0, CR, other controls, U+007F-U+009F, surrogates,
# past U+10FFFF).

import Base

# the decoder's state: after plain text, after "&", in a name (reversed),
# after "&#", in a decimal number, after "&#x", in a hex number; refused
type Cr is Data:
  CrLit{}
  CrAmp{}
  CrName{name: String}
  CrHash{}
  CrDec{n: U32}
  CrHex0{}
  CrHex{n: U32}
  CrBad{}

# the state and the text decoded so far, reversed
type Crun is Data:
  Crun{st: Cr, out: String}

def Cr.new() -> Crun:
  Crun{CrLit{}, SNil{}}

def Cr.bad() -> Crun:
  Crun{CrBad{}, SNil{}}

# an ASCII letter or digit
def Cr.alnum(c: Char) -> Bool:
  match c:
    case Chr{+x}:
      ((x >= 48 : U32) && (x <= 57 : U32)) || ((x >= 65 : U32) && (x <= 90 : U32)) || ((x >= 97 : U32) && (x <= 122 : U32))

# the value of a decimal digit
def Cr.digit(c: Char) -> Maybe<&2, U32>:
  match c:
    case Chr{+x}:
      Bool.pick(Maybe<&2, U32>, (x >= 48 : U32) && (x <= 57 : U32), Some{(x - 48 : U32)}, None{})

# the value of a hex digit
def Cr.hex(c: Char) -> Maybe<&2, U32>:
  match c:
    case Chr{+x}:
      Bool.pick(Maybe<&2, U32>, (x >= 48 : U32) && (x <= 57 : U32), Some{(x - 48 : U32)}, Bool.pick(Maybe<&2, U32>, (x >= 97 : U32) && (x <= 102 : U32), Some{(x - 87 : U32)}, Bool.pick(Maybe<&2, U32>, (x >= 65 : U32) && (x <= 70 : U32), Some{(x - 55 : U32)}, None{})))

# the character a known name stands for
def Cr.named(n: String) -> Maybe<&2, Char>:
  +s = n
  Bool.pick(Maybe<&2, Char>, String.eq(s, "amp"), Some{Chr{38}}, Bool.pick(Maybe<&2, Char>, String.eq(s, "lt"), Some{Chr{60}}, Bool.pick(Maybe<&2, Char>, String.eq(s, "gt"), Some{Chr{62}}, Bool.pick(Maybe<&2, Char>, String.eq(s, "quot"), Some{Chr{34}}, Bool.pick(Maybe<&2, Char>, String.eq(s, "apos"), Some{Chr{39}}, Bool.pick(Maybe<&2, Char>, String.eq(s, "nbsp"), Some{Chr{160}}, None{}))))))

def Cr.put(m: Maybe<&2, Char>, out: String) -> Crun:
  match m:
    case Some{c}:
      Crun{CrLit{}, SCon{c, out}}
    case None{}:
      Cr.bad()

# a number a browser keeps as the code point it names
def Cr.keeps(+n: U32) -> Bool:
  U32.is_eq(n, 9) || U32.is_eq(n, 10) || U32.is_eq(n, 12) || ((n >= 32 : U32) && (n <= 126 : U32)) || ((n >= 160 : U32) && (n <= 55295 : U32)) || ((n >= 57344 : U32) && (n <= 1114111 : U32))

def Cr.code(+n: U32, out: String) -> Crun:
  Bool.pick(Crun, Cr.keeps(n), Crun{CrLit{}, SCon{Chr{n}, out}}, Cr.bad())

# a number grown by one digit; past U+10FFFF it is refused (so it never wraps)
def Cr.grow(+n: U32, hex: Bool, out: String) -> Crun:
  Bool.pick(Crun, (n > 1114111 : U32), Cr.bad(), Crun{Bool.pick(Cr, hex, CrHex{n}, CrDec{n}), out})

def Cr.lit(c: Char, out: String) -> Crun:
  match c:
    case Chr{38}:
      Crun{CrAmp{}, out}
    case c:
      Crun{CrLit{}, SCon{c, out}}

# after "&": a name starts at a letter or digit; any other character
# leaves the "&" as it is
def Cr.amp_to(b: Bool, c: Char, out: String) -> Crun:
  match b:
    case True{}:
      Crun{CrName{SCon{c, SNil{}}}, out}
    case False{}:
      Crun{CrLit{}, SCon{c, SCon{Chr{38}, out}}}

def Cr.amp(+c: Char, out: String) -> Crun:
  match c:
    case Chr{35}:
      Crun{CrHash{}, out}
    case Chr{38}:
      Crun{CrAmp{}, SCon{Chr{38}, out}}
    case c:
      Cr.amp_to(Cr.alnum(c), c, out)

def Cr.name(+c: Char, name: String, out: String) -> Crun:
  match c:
    case Chr{59}:
      Cr.put(Cr.named(String.reverse(name)), out)
    case c:
      Bool.pick(Crun, Cr.alnum(c), Crun{CrName{SCon{c, name}}, out}, Cr.bad())

def Cr.first(m: Maybe<&2, U32>, hex: Bool, out: String) -> Crun:
  match m:
    case Some{d}:
      Cr.grow(d, hex, out)
    case None{}:
      Cr.bad()

def Cr.hash(c: Char, out: String) -> Crun:
  match c:
    case Chr{120}:
      Crun{CrHex0{}, out}
    case Chr{88}:
      Crun{CrHex0{}, out}
    case c:
      Cr.first(Cr.digit(c), False{}, out)

def Cr.more(m: Maybe<&2, U32>, +n: U32, +base: U32, hex: Bool, out: String) -> Crun:
  match m:
    case Some{d}:
      Cr.grow((n * base + d : U32), hex, out)
    case None{}:
      Cr.bad()

def Cr.decn(c: Char, +n: U32, out: String) -> Crun:
  match c:
    case Chr{59}:
      Cr.code(n, out)
    case c:
      Cr.more(Cr.digit(c), n, 10, False{}, out)

def Cr.hexn(c: Char, +n: U32, out: String) -> Crun:
  match c:
    case Chr{59}:
      Cr.code(n, out)
    case c:
      Cr.more(Cr.hex(c), n, 16, True{}, out)

# one character on
def Cr.step(c: Char, r: Crun) -> Crun:
  match r:
    case Crun{CrLit{}, out}:
      Cr.lit(c, out)
    case Crun{CrAmp{}, out}:
      Cr.amp(c, out)
    case Crun{CrName{name}, out}:
      Cr.name(c, name, out)
    case Crun{CrHash{}, out}:
      Cr.hash(c, out)
    case Crun{CrDec{n}, out}:
      Cr.decn(c, n, out)
    case Crun{CrHex0{}, out}:
      Cr.first(Cr.hex(c), True{}, out)
    case Crun{CrHex{n}, out}:
      Cr.hexn(c, n, out)
    case Crun{CrBad{}, out}:
      Cr.bad()

# the text decoded, at its end; None when a reference is refused or cut off
def Cr.fin(r: Crun) -> Maybe<&2, String>:
  match r:
    case Crun{CrLit{}, out}:
      Some{String.reverse(out)}
    case Crun{CrAmp{}, out}:
      Some{String.reverse(SCon{Chr{38}, out})}
    case Crun{st, out}:
      None{}

def Cr.go(s: String, r: Crun) -> Crun:
  match s:
    case SNil{}:
      r
    case SCon{c, t}:
      Cr.go(t, Cr.step(c, r))

# s with its character references decoded; None when one is refused
def Cr.dec(s: String) -> Maybe<&2, String>:
  Cr.fin(Cr.go(s, Cr.new()))
