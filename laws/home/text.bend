# gildrb.com's laws: the homepage, its text (R1, R2)
# ==================================================
#
# The terms shared by every section are in base/page.bend; LAWS.bend lists
# the requirements.

import Base
import ../base/html/tokens.bend as H
import ../base/page.bend as Laws

# Terms: the text in the raw HTML (R1)
# ------------------------------------
#
# One pass over the homepage's bytes. Before the body's start tag
# ("<body", any letter case, as a start tag: not in a comment, declaration,
# quoted value or raw text) the tags are read but nothing is counted; from
# its "<" to the end of the page: the markup, every byte of it, script
# content included (A1). In the markup each tag ("<" ... ">", ">" not right after
# "<"; quoted values hold ">"), comment ("<!--" ... "-->"), declaration
# ("<!" ... ">") and the content of style, script, title and textarea (any
# letter case) is no text, a tag reads as a space; then each character
# reference ("&", the letters, digits and "#" right after it, and a ";"
# right after those) is a space, each run of white space (JavaScript's \s)
# one space, the ends trimmed: the text (a browser decodes a reference to
# at least one character and shows what follows its name or number). The
# text counts up to the end of the last "</body>", which must end an end
# tag; anything left open at the end fails. The lexer (base/html/) reads
# the page the same way, and home_text needs it to accept the page.

# the characters of "</body>", by number; 7: any other
def Pc.of(c: Char) -> Nat:
  match c:
    case Chr{60}:
      0n
    case Chr{47}:
      1n
    case Chr{62}:
      2n
    case Chr{98}:
      3n
    case Chr{111}:
      4n
    case Chr{100}:
      5n
    case Chr{121}:
      6n
    case _:
      7n

def Word.end() -> List<&2, Nat>:
  [0n, 1n, 3n, 4n, 5n, 6n, 2n]

# a word being matched: what of it matched so far (reversed characters)
# and what is left of it (character numbers). Each word begins with "<",
# which is nowhere else in it.
type Seek is Data:
  Seek{held: String, rest: List<&2, Nat>}

# what one character does to a match: the word ends; the match goes on;
# or it stops and lets go of out (reversed): held, and c unless c begins
# the word again
type Sought is Data:
  Found{}
  Going{s: Seek}
  Missed{out: String, s: Seek}

def Seek.miss(b: Bool, c: Char, held: String, word: List<&2, Nat>) -> Sought:
  match b:
    case True{}:
      Missed{held, Seek{SCon{c, SNil{}}, List.tail(&2, Nat, word)}}
    case False{}:
      Missed{SCon{c, held}, Seek{SNil{}, word}}

def Seek.next(t: List<&2, Nat>, c: Char, held: String) -> Sought:
  match t:
    case Nil{}:
      Found{}
    case Con{h, r}:
      Going{Seek{SCon{c, held}, Con{h, r}}}

def Seek.on(b: Bool, +k: Nat, c: Char, held: String, t: List<&2, Nat>, word: List<&2, Nat>) -> Sought:
  match b:
    case True{}:
      Seek.next(t, c, held)
    case False{}:
      Seek.miss(Nat.is_eq(k, 0n), c, held, word)

def Seek.at(+k: Nat, c: Char, held: String, rest: List<&2, Nat>, word: List<&2, Nat>) -> Sought:
  match rest:
    case Nil{}:
      Going{Seek{SNil{}, word}}
    case Con{+h, t}:
      Seek.on(Nat.is_eq(k, h), k, c, held, t, word)

def Seek.step(s: Seek, c: Char, word: List<&2, Nat>) -> Sought:
  match s c:
    case Seek{held, rest} Chr{+x}:
      Seek.at(Pc.of(Chr{x}), Chr{x}, held, rest, word)

# the text so far: in a character reference or not, a space pending
# between words, any word seen, the text (reversed)
type Ent is Data:
  EntOut{}
  EntRef{}

type Tx is Data:
  Tx{e: Ent, gap: Bool, word: Bool, out: String}

def Tx.word(gap: Bool, word: Bool, out: String) -> String:
  match gap word:
    case True{} True{}:
      SCon{Chr{32}, out}
    case _ _:
      out

# white space (JavaScript's \s) waits as one space for the next word;
# any other character joins the text
def Tx.char(+c: Char, gap: Bool, +word: Bool, out: String) -> Tx:
  match c:
    case Chr{9}:
      Tx{EntOut{}, word, word, out}
    case Chr{10}:
      Tx{EntOut{}, word, word, out}
    case Chr{11}:
      Tx{EntOut{}, word, word, out}
    case Chr{12}:
      Tx{EntOut{}, word, word, out}
    case Chr{13}:
      Tx{EntOut{}, word, word, out}
    case Chr{32}:
      Tx{EntOut{}, word, word, out}
    case Chr{160}:
      Tx{EntOut{}, word, word, out}
    case Chr{5760}:
      Tx{EntOut{}, word, word, out}
    case Chr{8192}:
      Tx{EntOut{}, word, word, out}
    case Chr{8193}:
      Tx{EntOut{}, word, word, out}
    case Chr{8194}:
      Tx{EntOut{}, word, word, out}
    case Chr{8195}:
      Tx{EntOut{}, word, word, out}
    case Chr{8196}:
      Tx{EntOut{}, word, word, out}
    case Chr{8197}:
      Tx{EntOut{}, word, word, out}
    case Chr{8198}:
      Tx{EntOut{}, word, word, out}
    case Chr{8199}:
      Tx{EntOut{}, word, word, out}
    case Chr{8200}:
      Tx{EntOut{}, word, word, out}
    case Chr{8201}:
      Tx{EntOut{}, word, word, out}
    case Chr{8202}:
      Tx{EntOut{}, word, word, out}
    case Chr{8232}:
      Tx{EntOut{}, word, word, out}
    case Chr{8233}:
      Tx{EntOut{}, word, word, out}
    case Chr{8239}:
      Tx{EntOut{}, word, word, out}
    case Chr{8287}:
      Tx{EntOut{}, word, word, out}
    case Chr{12288}:
      Tx{EntOut{}, word, word, out}
    case Chr{65279}:
      Tx{EntOut{}, word, word, out}
    case c:
      Tx{EntOut{}, False{}, True{}, SCon{c, Tx.word(gap, word, out)}}

# a character of a reference's name or number: a letter, digit or "#"
def Ent.ref(c: Char) -> Bool:
  match c:
    case Chr{+x}:
      (U32.is_lt(47, x) && U32.is_lt(x, 58)) || (U32.is_lt(64, x) && U32.is_lt(x, 91)) || (U32.is_lt(96, x) && U32.is_lt(x, 123)) || U32.is_eq(x, 35)

# c outside a reference: "&" begins one, which reads as one space (a
# browser shows at least one character for it)
def Ent.out(c: Char, gap: Bool, +word: Bool, out: String) -> Tx:
  match c:
    case Chr{38}:
      Tx{EntRef{}, word, word, out}
    case c:
      Tx.char(c, gap, word, out)

# c in a reference: a letter, digit or "#" goes on with it; ";" ends it;
# any other character ends it and is read on its own
def Ent.in(b: Bool, +c: Char, gap: Bool, word: Bool, out: String) -> Tx:
  match b c:
    case True{} c:
      Tx{EntRef{}, gap, word, out}
    case False{} Chr{59}:
      Tx{EntOut{}, gap, word, out}
    case False{} c:
      Ent.out(c, gap, word, out)

def Ent.step(e: Ent, +c: Char, gap: Bool, word: Bool, out: String) -> Tx:
  match e:
    case EntOut{}:
      Ent.out(c, gap, word, out)
    case EntRef{}:
      Ent.in(Ent.ref(c), c, gap, word, out)

def Ent.feed(x: Tx, c: Char) -> Tx:
  match x:
    case Tx{e, gap, word, out}:
      Ent.step(e, c, gap, word, out)

# a tag's state. Outside one: text. "<" just seen. A tag's name so far
# (lower case, reversed). Inside a tag, or in a quoted value in it. "<!",
# "<!-". In a comment, after 0, 1 or 2 dashes ("<!--" counts as 2). In a
# declaration ("<!" and not "-", up to ">"). In the start tag of style,
# script, title or textarea, or in a quoted value in it; in its content;
# in "<" or "</" and part of its name after the content (rest: what is
# left). Only characters outside every tag, comment, declaration and such
# content are text.
# the elements whose content is no text
type Raw is Data:
  RScript{}
  RStyle{}
  RTitle{}
  RTextarea{}

def Raw.of(n: H.Name) -> Maybe<&2, Raw>:
  match n:
    case H.NScript{}:
      Some{RScript{}}
    case H.NStyle{}:
      Some{RStyle{}}
    case H.NTitle{}:
      Some{RTitle{}}
    case H.NTextarea{}:
      Some{RTextarea{}}
    case _:
      None{}

def Raw.name(r: Raw) -> String:
  match r:
    case RScript{}:
      "script"
    case RStyle{}:
      "style"
    case RTitle{}:
      "title"
    case RTextarea{}:
      "textarea"

type Tag is Data:
  TagOut{}
  TagLt{}
  TagName{name: String}
  TagIn{}
  TagDq{}
  TagSq{}
  TagBang{}
  TagBang1{}
  TagCom0{}
  TagCom1{}
  TagCom2{}
  TagDecl{}
  TagHid{r: Raw}
  TagHidDq{r: Raw}
  TagHidSq{r: Raw}
  TagHidden{r: Raw}
  TagHidLt{r: Raw}
  TagHidEnd{r: Raw, rest: String}

type TagTx is Data:
  TagTx{tag: Tag, x: Tx}

def Tag.out(c: Char, x: Tx) -> TagTx:
  match c:
    case Chr{60}:
      TagTx{TagLt{}, x}
    case c:
      TagTx{TagOut{}, Ent.feed(x, c)}

# inside a tag: quotes hold ">"
def Tag.in(c: Char) -> Tag:
  match c:
    case Chr{62}:
      TagOut{}
    case Chr{34}:
      TagDq{}
    case Chr{39}:
      TagSq{}
    case _:
      TagIn{}

def Tag.dq(c: Char) -> Tag:
  match c:
    case Chr{34}:
      TagIn{}
    case _:
      TagDq{}

def Tag.sq(c: Char) -> Tag:
  match c:
    case Chr{39}:
      TagIn{}
    case _:
      TagSq{}

# "<>" is no tag: both stay. A tag begins: it reads as a space.
def Tag.lt.k(k: H.Ck, c: Char, x: Tx) -> TagTx:
  match k:
    case H.CGt{}:
      TagTx{TagOut{}, Ent.feed(Ent.feed(x, Chr{60}), Chr{62})}
    case H.CBang{}:
      TagTx{TagBang{}, Ent.feed(x, Chr{32})}
    case H.CLetter{l}:
      TagTx{TagName{SCon{l, SNil{}}}, Ent.feed(x, Chr{32})}
    case _:
      TagTx{Tag.in(c), Ent.feed(x, Chr{32})}

def Tag.lt(+c: Char, x: Tx) -> TagTx:
  Tag.lt.k(H.Ck.of(c), c, x)

# the start tag of style, script, title or textarea: quotes hold ">"
def Tag.hid(c: Char, r: Raw) -> Tag:
  match c:
    case Chr{62}:
      TagHidden{r}
    case Chr{34}:
      TagHidDq{r}
    case Chr{39}:
      TagHidSq{r}
    case _:
      TagHid{r}

def Tag.hid_dq(c: Char, r: Raw) -> Tag:
  match c:
    case Chr{34}:
      TagHid{r}
    case _:
      TagHidDq{r}

def Tag.hid_sq(c: Char, r: Raw) -> Tag:
  match c:
    case Chr{39}:
      TagHid{r}
    case _:
      TagHidSq{r}

# the name ends at c: style, script, title and textarea hide their content
def Tag.named(m: Maybe<&2, Raw>, c: Char) -> Tag:
  match m:
    case Some{r}:
      Tag.hid(c, r)
    case None{}:
      Tag.in(c)

def Tag.name.k(k: H.Ck, c: Char, name: String) -> Tag:
  match k:
    case H.CLetter{l}:
      TagName{SCon{l, name}}
    case H.CName{d}:
      TagName{SCon{d, name}}
    case H.CDash{}:
      TagName{SCon{Chr{45}, name}}
    case _:
      Tag.named(Raw.of(H.Html.name(String.reverse(name))), c)

def Tag.name(+c: Char, name: String) -> Tag:
  Tag.name.k(H.Ck.of(c), c, name)

# "<!" and not "-": a declaration (or bogus comment), up to the first ">"
def Tag.decl(c: Char) -> Tag:
  match c:
    case Chr{62}:
      TagOut{}
    case _:
      TagDecl{}

def Tag.bang(c: Char) -> Tag:
  match c:
    case Chr{45}:
      TagBang1{}
    case c:
      Tag.decl(c)

def Tag.bang1(c: Char) -> Tag:
  match c:
    case Chr{45}:
      TagCom2{}
    case c:
      Tag.in(c)

def Tag.com(c: Char, two: Bool) -> Tag:
  match c two:
    case Chr{45} True{}:
      TagCom2{}
    case Chr{62} True{}:
      TagOut{}
    case c True{}:
      TagCom0{}
    case Chr{45} False{}:
      TagCom1{}
    case c False{}:
      TagCom0{}

def Tag.com1(c: Char) -> Tag:
  match c:
    case Chr{45}:
      TagCom2{}
    case _:
      TagCom0{}


def Tag.hidden(c: Char, r: Raw) -> Tag:
  match c:
    case Chr{60}:
      TagHidLt{r}
    case _:
      TagHidden{r}

def Tag.hid_lt(c: Char, +r: Raw) -> Tag:
  match c:
    case Chr{47}:
      TagHidEnd{r, Raw.name(r)}
    case c:
      Tag.hidden(c, r)

def Tag.hid_hit(b: Bool, c: Char, r: Raw, rest: String) -> Tag:
  match b:
    case True{}:
      TagHidEnd{r, rest}
    case False{}:
      Tag.hidden(c, r)

def Tag.hid_cmp(k: H.Ck, c: Char, r: Raw, h: Char, rest: String) -> Tag:
  match k:
    case H.CLetter{l}:
      Tag.hid_hit(Char.is_eq(l, h), c, r, rest)
    case _:
      Tag.hidden(c, r)

# after "</" and the whole r: a space, "/" or ">" ends the content
def Tag.hid_close(k: H.Ck, c: Char, r: Raw) -> Tag:
  match k:
    case H.CGt{}:
      TagOut{}
    case H.CSp{}:
      TagIn{}
    case H.CSl{}:
      TagIn{}
    case _:
      Tag.hidden(c, r)

def Tag.hid_end(+c: Char, r: Raw, rest: String) -> Tag:
  match rest:
    case SNil{}:
      Tag.hid_close(H.Ck.of(c), c, r)
    case SCon{h, t}:
      Tag.hid_cmp(H.Ck.of(c), c, r, h, t)

def Tag.feed(tag: Tag, c: Char, x: Tx) -> TagTx:
  match tag:
    case TagOut{}:
      Tag.out(c, x)
    case TagLt{}:
      Tag.lt(c, x)
    case TagName{name}:
      TagTx{Tag.name(c, name), x}
    case TagIn{}:
      TagTx{Tag.in(c), x}
    case TagDq{}:
      TagTx{Tag.dq(c), x}
    case TagSq{}:
      TagTx{Tag.sq(c), x}
    case TagBang{}:
      TagTx{Tag.bang(c), x}
    case TagBang1{}:
      TagTx{Tag.bang1(c), x}
    case TagCom0{}:
      TagTx{Tag.com(c, False{}), x}
    case TagCom1{}:
      TagTx{Tag.com1(c), x}
    case TagCom2{}:
      TagTx{Tag.com(c, True{}), x}
    case TagDecl{}:
      TagTx{Tag.decl(c), x}
    case TagHid{r}:
      TagTx{Tag.hid(c, r), x}
    case TagHidDq{r}:
      TagTx{Tag.hid_dq(c, r), x}
    case TagHidSq{r}:
      TagTx{Tag.hid_sq(c, r), x}
    case TagHidden{r}:
      TagTx{Tag.hidden(c, r), x}
    case TagHidLt{r}:
      TagTx{Tag.hid_lt(c, r), x}
    case TagHidEnd{r, rest}:
      TagTx{Tag.hid_end(c, r, rest), x}

# the markup so far (one "." per character, script content too), the tag's
# state, the text's
type Mark is Data:
  Mark{markup: String, tag: Tag, x: Tx}

def Mark.put(r: TagTx, markup: String) -> Mark:
  match r:
    case TagTx{tag, x}:
      Mark{markup, tag, x}

def Utf8.three(b: Bool, markup: String) -> String:
  match b:
    case True{}:
      SCon{Chr{46}, markup}
    case False{}:
      SCon{Chr{46}, SCon{Chr{46}, markup}}

def Utf8.two(b: Bool, +x: U32, markup: String) -> String:
  match b:
    case True{}:
      SCon{Chr{46}, markup}
    case False{}:
      SCon{Chr{46}, Utf8.three(U32.is_lt(x, 65536), markup)}

def Utf8.one(b: Bool, +x: U32, markup: String) -> String:
  match b:
    case True{}:
      SCon{Chr{46}, markup}
    case False{}:
      SCon{Chr{46}, Utf8.two(U32.is_lt(x, 2048), x, markup)}

# the markup grown by c's UTF-8 length: one "." per byte (1 below U+0080,
# 2 below U+0800, 3 below U+10000, else 4)
def Utf8.put(c: Char, markup: String) -> String:
  match c:
    case Chr{+x}:
      Utf8.one(U32.is_lt(x, 128), x, markup)

def Mark.feed(m: Mark, +c: Char) -> Mark:
  match m:
    case Mark{markup, tag, x}:
      Mark.put(Tag.feed(tag, c, x), Utf8.put(c, markup))

# the text when the last "</body>" so far ended: none yet, the text
# (reversed), or "</body>" not ending an end tag (in a comment, a
# script, ...)
type Snap is Data:
  SnapNone{}
  SnapText{text: String}
  SnapBad{}

def Snap.of(m: Mark) -> Snap:
  match m:
    case Mark{markup, TagOut{}, Tx{e, gap, word, out}}:
      SnapText{out}
    case _:
      SnapBad{}

# the body so far: the markup, "</body>" sought, the text at the last
type Body is Data:
  Body{m: Mark, end: Seek, snap: Snap}

def Body.found(+m: Mark) -> Body:
  Body{m, Seek{SNil{}, Word.end()}, Snap.of(m)}

def Body.ended(r: Sought, m: Mark, snap: Snap) -> Body:
  match r:
    case Found{}:
      Body.found(m)
    case Going{s}:
      Body{m, s, snap}
    case Missed{out, s}:
      Body{m, s, snap}

def Body.char(b: Body, +c: Char) -> Body:
  match b:
    case Body{m, end, snap}:
      Body.ended(Seek.step(end, c, Word.end()), Mark.feed(m, c), snap)

def Body.feeds(s: String, b: Body) -> Body:
  match s:
    case SNil{}:
      b
    case SCon{c, t}:
      Body.feeds(t, Body.char(b, c))

def Body.start() -> Body:
  Body{Mark{SNil{}, TagOut{}, Tx{EntOut{}, False{}, False{}, SNil{}}}, Seek{SNil{}, Word.end()}, SnapNone{}}

# the body's start tag begins: "<body" (its name read, c the character
# after it); the markup counts from its "<", in UTF-8 bytes
def Body.at(+c: Char) -> Body:
  Body{Mark{Utf8.put(c, "....."), Tag.in(c), Tx{EntOut{}, False{}, False{}, SNil{}}}, Seek{SNil{}, Word.end()}, SnapNone{}}

# a tag's name ends at c ("body" reversed is "ydob")
def Body.name(k: H.Ck, +name: String) -> Bool:
  match k:
    case H.CLetter{l}:
      False{}
    case H.CName{d}:
      False{}
    case H.CDash{}:
      False{}
    case _:
      String.eq(name, "ydob")

# the page: before the body's start tag (the tags read as in the body, so
# that a "<body" in a comment, declaration, quoted value or raw text is no
# start tag), or in the body
type Page is Data:
  Head{tag: Tag, x: Tx}
  In{b: Body}

def Page.put(r: TagTx) -> Page:
  match r:
    case TagTx{tag, x}:
      Head{tag, x}

def Page.body(b: Bool, +c: Char, name: String, x: Tx) -> Page:
  match b:
    case True{}:
      In{Body.at(c)}
    case False{}:
      Page.put(Tag.feed(TagName{name}, c, x))

def Page.head(tag: Tag, +c: Char, x: Tx) -> Page:
  match tag:
    case TagName{+name}:
      Page.body(Body.name(H.Ck.of(c), name), c, name, x)
    case t:
      Page.put(Tag.feed(t, c, x))

def Page.char(p: Page, +c: Char) -> Page:
  match p:
    case Head{tag, x}:
      Page.head(tag, c, x)
    case In{b}:
      In{Body.char(b, c)}

def Page.str(s: String, p: Page) -> Page:
  match s:
    case SNil{}:
      p
    case SCon{c, t}:
      Page.str(t, Page.char(p, c))

def Page.all(cs: List<&2, String>, p: Page) -> Page:
  match cs:
    case Nil{}:
      p
    case Con{s, t}:
      Page.all(t, Page.str(s, p))

# s has at least k characters
def Long.go(k: Nat, s: String) -> Bool:
  match k s:
    case 0n s:
      True{}
    case 1n+p SNil{}:
      False{}
    case 1n+p SCon{c, t}:
      Long.go(p, t)

# t with each character made 20
def Ratio.twenty(t: String) -> String:
  match t:
    case SNil{}:
      SNil{}
    case SCon{c, r}:
      String.append("....................", Ratio.twenty(r))

# m is no longer than n
def Ratio.le(m: String, n: String) -> Bool:
  match m n:
    case SNil{} n:
      True{}
    case SCon{c, mt} SNil{}:
      False{}
    case SCon{c, mt} SCon{d, nt}:
      Ratio.le(mt, nt)

# the text is at least 500 characters and at least 5% of the markup
def Text.enough(markup: String, +text: String) -> Bool:
  Long.go(500n, text) && Ratio.le(markup, Ratio.twenty(text))

def Text.snap(markup: String, snap: Snap) -> Bool:
  match snap:
    case SnapText{text}:
      Text.enough(markup, text)
    case _:
      False{}

# the end of the page: no tag, comment or script, style, title or
# textarea content open
def Text.end(+p: Page) -> Bool:
  match p:
    case In{Body{Mark{markup, TagOut{}, x}, end, snap}}:
      Text.snap(markup, snap)
    case In{Body{Mark{markup, TagLt{}, x}, end, snap}}:
      Text.snap(markup, snap)
    case _:
      False{}

def Text.of(m: Maybe<&2, List<&2, String>>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{text}:
      Text.end(Page.all(text, Head{TagOut{}, Tx{EntOut{}, False{}, False{}, SNil{}}}))

def Start.tag(ts: List<&2, H.Tok>) -> Bool:
  match ts:
    case Nil{}:
      False{}
    case Con{H.TOpen{H.NBody{}, a}, t}:
      True{}
    case Con{x, t}:
      Start.tag(t)

def Start.toks(m: Maybe<&2, List<&2, H.Tok>>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{ts}:
      Start.tag(ts)

# the lexer (base/html/) accepts the page and finds a body start tag:
# where it accepts a page, the pass above reads the tags as it does
def Start.real(m: Maybe<&2, List<&2, String>>) -> Bool:
  Start.toks(Laws.Spec.toks(m))

# the homepage carries its text in its raw HTML (R1)
def Spec.carries_text(+m: Maybe<&2, List<&2, String>>) -> Bool:
  Text.of(m) && Start.real(m)

# Terms: hidden elements (R2)
# ----------------------------

# a start tag with the hidden attribute: a div, or another element
def Hidden.div(x: H.Tok) -> Bool:
  match x:
    case H.TOpen{H.NDiv{}, attrs}:
      Laws.Spec.has(H.KHidden{}, attrs)
    case _:
      False{}

def Hidden.other(x: H.Tok) -> Bool:
  match x:
    case H.TOpen{H.NDiv{}, attrs}:
      False{}
    case H.TOpen{n, attrs}:
      Laws.Spec.has(H.KHidden{}, attrs)
    case _:
      False{}

def Hidden.shut(x: H.Tok) -> Bool:
  match x:
    case H.TShut{H.NDiv{}}:
      True{}
    case _:
      False{}

# an element with the hidden attribute shows nothing: each is an empty div
# ("<div ... hidden></div>"); open: the last tag opened one
def Hidden.go(ts: List<&2, H.Tok>, +open: Bool) -> Bool:
  match ts:
    case Nil{}:
      Bool.not(open)
    case Con{+x, t}:
      Bool.pick(Bool, open, Hidden.shut(x), True{}) && Bool.not(Hidden.other(x)) && Hidden.go(t, Hidden.div(x))

# an element whose text a browser does not show (or only after a click):
# svg and math (outside their text elements), dialog, details, video,
# audio, object, canvas, datalist, progress, meter. Matched by name
# whatever constructor tokens.bend reads it as (details and dialog are
# NBlock); an open dialog or details counts too (conservative).
def Unshown.tags() -> List<&2, String>:
  ["dialog", "details", "video", "audio", "object", "canvas", "datalist", "progress", "meter"]

def Unshown.tag(+t: String) -> Nat:
  Bool.pick(Nat, Nat.is_le(1n, Laws.Spec.count(Unshown.tags(), t)), 1n, 0n)

def Unshown.num(n: H.Name) -> Nat:
  match n:
    case H.NSvg{}:
      1n
    case H.NMath{}:
      1n
    case H.NOther{t}:
      Unshown.tag(t)
    case H.NBlock{t}:
      Unshown.tag(t)
    case H.NBreak{t}:
      Unshown.tag(t)
    case _:
      0n

# no text but white space inside such an element (d: how many are open;
# the tags nest, base/html/tree.bend)
def Unshown.go(ts: List<&2, H.Tok>, +d: Nat) -> Bool:
  match ts:
    case Nil{}:
      True{}
    case Con{H.TOpen{n, a}, t}:
      Unshown.go(t, Nat.add(d, Unshown.num(n)))
    case Con{H.TShut{n}, t}:
      Unshown.go(t, Nat.sub(d, Unshown.num(n)))
    case Con{H.TText{s}, t}:
      (Nat.is_eq(d, 0n) || H.Blank.is(s)) && Unshown.go(t, d)

def Hidden.of(m: Maybe<&2, List<&2, H.Tok>>) -> Bool:
  match m:
    case None{}:
      False{}
    case Some{+ts}:
      Hidden.go(ts, False{}) && Unshown.go(ts, 0n)

# the homepage hides no content (R2)
def Spec.shown(m: Maybe<&2, List<&2, String>>) -> Bool:
  Hidden.of(Laws.Spec.toks(m))

# Laws
# ----

# LAW home_text: in the homepage's bytes from the "<" of the body's start
# tag ("<body", any letter case, read as a start tag: not in a comment,
# declaration, quoted value or raw text) to the end of the page, script
# content included (the markup, A1), the characters outside every tag
# (quoted values hold ">"), comment, declaration and style, script, title
# or textarea content, up to the end of the last "</body>" (which ends an
# end tag), with each tag and each character reference ("&", the letters,
# digits and "#" right after it, a ";" right after those) made a space,
# white space runs made one space and the ends trimmed (the text): the
# text is at least 500 characters (code points) and 20 times its
# characters are at least the markup's length in UTF-8 bytes (each code
# point counted as its UTF-8 length, 1 to 4; not UTF-16 units). A tag,
# comment or such content left open fails, and so does a page the lexer
# (base/html/) refuses or finds no body start tag in (R1).
law home_text:
  {Spec.carries_text(Laws.Spec.page("index.html")) == True{} : Bool}

# LAW home_shown: every element of the homepage with the hidden attribute
# is an empty div, and no text but ASCII white space is inside svg, math,
# dialog, details, video, audio, object, canvas, datalist, progress or
# meter, matched by name whatever constructor the lexer gives it, open
# dialog and details included (a browser does not show it, or not without
# a click), so the text home_text counts is shown; text hidden by CSS is
# NOT checked (A3) (R2).
law home_shown:
  {Spec.shown(Laws.Spec.page("index.html")) == True{} : Bool}
