# gildrb.com's laws: the HTML they read, its tokens
# ==================================================
#
# What lexer.bend reads a page into: tags by name, the attributes the laws
# read, text (title and textarea text too); and each character of a tag.
# tree.bend checks how the tags nest. LAWS.bend lists the requirements.

import Base

# Terms
# -----

# an element by name. The ones the laws read or a browser's tree builder
# treats on its own have a constructor; NVoid: one more element with no
# end tag (link, hr, img and meta have their own); NBlock: one more
# element whose start tag ends an open p; NBreak: one more element whose
# start tag breaks out of svg or math; NBanned: an element the lexer
# refuses; NOther: any other element, by its name.
type Name is Data:
  NA{}
  NBody{}
  NDiv{}
  NH1{}
  NH2{}
  NH3{}
  NH4{}
  NH5{}
  NH6{}
  NLink{}
  NNav{}
  NSvg{}
  NMath{}
  NScript{}
  NStyle{}
  NTitle{}
  NTextarea{}
  NHtml{}
  NHead{}
  NP{}
  NLi{}
  NDd{}
  NDt{}
  NDl{}
  NUl{}
  NOl{}
  NMenu{}
  NButton{}
  NForm{}
  NNobr{}
  NHr{}
  NImg{}
  NMeta{}
  NVoid{tag: String}
  NBlock{tag: String}
  NBreak{tag: String}
  NBanned{}
  NOther{tag: String}

# the attributes the laws read; the lexer drops every other one (KLabelled:
# aria-labelledby; KLabel: aria-label; KTitle: the title attribute;
# KAriaHidden: aria-hidden)
type Key is Data:
  KId{}
  KHref{}
  KRel{}
  KLabelled{}
  KHidden{}
  KLang{}
  KContent{}
  KName{}
  KProperty{}
  KSrc{}
  KSrcset{}
  KPoster{}
  KAlt{}
  KLabel{}
  KTitle{}
  KAriaHidden{}
  KOther{}

type Attr is Data:
  Attr{key: Key, val: String}

# a start tag, an end tag, or a run of text
type Tok is Data:
  TOpen{name: Name, attrs: List<&2, Attr>}
  TShut{name: Name}
  TText{text: String}

def Html.name(s: String) -> Name:
  match s:
    # "a"
    case SCon{Chr{97}, SNil{}}:
      NA{}
    # "div"
    case SCon{Chr{100}, SCon{Chr{105}, SCon{Chr{118}, SNil{}}}}:
      NDiv{}
    # "body"
    case SCon{Chr{98}, SCon{Chr{111}, SCon{Chr{100}, SCon{Chr{121}, SNil{}}}}}:
      NBody{}
    # "h1"
    case SCon{Chr{104}, SCon{Chr{49}, SNil{}}}:
      NH1{}
    # "h2"
    case SCon{Chr{104}, SCon{Chr{50}, SNil{}}}:
      NH2{}
    # "h3"
    case SCon{Chr{104}, SCon{Chr{51}, SNil{}}}:
      NH3{}
    # "h4"
    case SCon{Chr{104}, SCon{Chr{52}, SNil{}}}:
      NH4{}
    # "h5"
    case SCon{Chr{104}, SCon{Chr{53}, SNil{}}}:
      NH5{}
    # "h6"
    case SCon{Chr{104}, SCon{Chr{54}, SNil{}}}:
      NH6{}
    # "link"
    case SCon{Chr{108}, SCon{Chr{105}, SCon{Chr{110}, SCon{Chr{107}, SNil{}}}}}:
      NLink{}
    # "nav"
    case SCon{Chr{110}, SCon{Chr{97}, SCon{Chr{118}, SNil{}}}}:
      NNav{}
    # "svg"
    case SCon{Chr{115}, SCon{Chr{118}, SCon{Chr{103}, SNil{}}}}:
      NSvg{}
    # "math"
    case SCon{Chr{109}, SCon{Chr{97}, SCon{Chr{116}, SCon{Chr{104}, SNil{}}}}}:
      NMath{}
    # "script"
    case SCon{Chr{115}, SCon{Chr{99}, SCon{Chr{114}, SCon{Chr{105}, SCon{Chr{112}, SCon{Chr{116}, SNil{}}}}}}}:
      NScript{}
    # "style"
    case SCon{Chr{115}, SCon{Chr{116}, SCon{Chr{121}, SCon{Chr{108}, SCon{Chr{101}, SNil{}}}}}}:
      NStyle{}
    # "title"
    case SCon{Chr{116}, SCon{Chr{105}, SCon{Chr{116}, SCon{Chr{108}, SCon{Chr{101}, SNil{}}}}}}:
      NTitle{}
    # "textarea"
    case SCon{Chr{116}, SCon{Chr{101}, SCon{Chr{120}, SCon{Chr{116}, SCon{Chr{97}, SCon{Chr{114}, SCon{Chr{101}, SCon{Chr{97}, SNil{}}}}}}}}}:
      NTextarea{}
    # "html"
    case SCon{Chr{104}, SCon{Chr{116}, SCon{Chr{109}, SCon{Chr{108}, SNil{}}}}}:
      NHtml{}
    # "head"
    case SCon{Chr{104}, SCon{Chr{101}, SCon{Chr{97}, SCon{Chr{100}, SNil{}}}}}:
      NHead{}
    # "p"
    case SCon{Chr{112}, SNil{}}:
      NP{}
    # "li"
    case SCon{Chr{108}, SCon{Chr{105}, SNil{}}}:
      NLi{}
    # "dd"
    case SCon{Chr{100}, SCon{Chr{100}, SNil{}}}:
      NDd{}
    # "dt"
    case SCon{Chr{100}, SCon{Chr{116}, SNil{}}}:
      NDt{}
    # "dl"
    case SCon{Chr{100}, SCon{Chr{108}, SNil{}}}:
      NDl{}
    # "ul"
    case SCon{Chr{117}, SCon{Chr{108}, SNil{}}}:
      NUl{}
    # "ol"
    case SCon{Chr{111}, SCon{Chr{108}, SNil{}}}:
      NOl{}
    # "menu"
    case SCon{Chr{109}, SCon{Chr{101}, SCon{Chr{110}, SCon{Chr{117}, SNil{}}}}}:
      NMenu{}
    # "button"
    case SCon{Chr{98}, SCon{Chr{117}, SCon{Chr{116}, SCon{Chr{116}, SCon{Chr{111}, SCon{Chr{110}, SNil{}}}}}}}:
      NButton{}
    # "form"
    case SCon{Chr{102}, SCon{Chr{111}, SCon{Chr{114}, SCon{Chr{109}, SNil{}}}}}:
      NForm{}
    # "nobr"
    case SCon{Chr{110}, SCon{Chr{111}, SCon{Chr{98}, SCon{Chr{114}, SNil{}}}}}:
      NNobr{}
    # "hr"
    case SCon{Chr{104}, SCon{Chr{114}, SNil{}}}:
      NHr{}
    # "area"
    case SCon{Chr{97}, SCon{Chr{114}, SCon{Chr{101}, SCon{Chr{97}, SNil{}}}}}:
      NVoid{"area"}
    # "br"
    case SCon{Chr{98}, SCon{Chr{114}, SNil{}}}:
      NVoid{"br"}
    # "embed"
    case SCon{Chr{101}, SCon{Chr{109}, SCon{Chr{98}, SCon{Chr{101}, SCon{Chr{100}, SNil{}}}}}}:
      NVoid{"embed"}
    # "img"
    case SCon{Chr{105}, SCon{Chr{109}, SCon{Chr{103}, SNil{}}}}:
      NImg{}
    # "input"
    case SCon{Chr{105}, SCon{Chr{110}, SCon{Chr{112}, SCon{Chr{117}, SCon{Chr{116}, SNil{}}}}}}:
      NVoid{"input"}
    # "keygen"
    case SCon{Chr{107}, SCon{Chr{101}, SCon{Chr{121}, SCon{Chr{103}, SCon{Chr{101}, SCon{Chr{110}, SNil{}}}}}}}:
      NVoid{"keygen"}
    # "meta"
    case SCon{Chr{109}, SCon{Chr{101}, SCon{Chr{116}, SCon{Chr{97}, SNil{}}}}}:
      NMeta{}
    # "param"
    case SCon{Chr{112}, SCon{Chr{97}, SCon{Chr{114}, SCon{Chr{97}, SCon{Chr{109}, SNil{}}}}}}:
      NVoid{"param"}
    # "source"
    case SCon{Chr{115}, SCon{Chr{111}, SCon{Chr{117}, SCon{Chr{114}, SCon{Chr{99}, SCon{Chr{101}, SNil{}}}}}}}:
      NVoid{"source"}
    # "track"
    case SCon{Chr{116}, SCon{Chr{114}, SCon{Chr{97}, SCon{Chr{99}, SCon{Chr{107}, SNil{}}}}}}:
      NVoid{"track"}
    # "wbr"
    case SCon{Chr{119}, SCon{Chr{98}, SCon{Chr{114}, SNil{}}}}:
      NVoid{"wbr"}
    # "basefont"
    case SCon{Chr{98}, SCon{Chr{97}, SCon{Chr{115}, SCon{Chr{101}, SCon{Chr{102}, SCon{Chr{111}, SCon{Chr{110}, SCon{Chr{116}, SNil{}}}}}}}}}:
      NVoid{"basefont"}
    # "bgsound"
    case SCon{Chr{98}, SCon{Chr{103}, SCon{Chr{115}, SCon{Chr{111}, SCon{Chr{117}, SCon{Chr{110}, SCon{Chr{100}, SNil{}}}}}}}}:
      NVoid{"bgsound"}
    # "address"
    case SCon{Chr{97}, SCon{Chr{100}, SCon{Chr{100}, SCon{Chr{114}, SCon{Chr{101}, SCon{Chr{115}, SCon{Chr{115}, SNil{}}}}}}}}:
      NBlock{"address"}
    # "article"
    case SCon{Chr{97}, SCon{Chr{114}, SCon{Chr{116}, SCon{Chr{105}, SCon{Chr{99}, SCon{Chr{108}, SCon{Chr{101}, SNil{}}}}}}}}:
      NBlock{"article"}
    # "aside"
    case SCon{Chr{97}, SCon{Chr{115}, SCon{Chr{105}, SCon{Chr{100}, SCon{Chr{101}, SNil{}}}}}}:
      NBlock{"aside"}
    # "blockquote"
    case SCon{Chr{98}, SCon{Chr{108}, SCon{Chr{111}, SCon{Chr{99}, SCon{Chr{107}, SCon{Chr{113}, SCon{Chr{117}, SCon{Chr{111}, SCon{Chr{116}, SCon{Chr{101}, SNil{}}}}}}}}}}}:
      NBlock{"blockquote"}
    # "center"
    case SCon{Chr{99}, SCon{Chr{101}, SCon{Chr{110}, SCon{Chr{116}, SCon{Chr{101}, SCon{Chr{114}, SNil{}}}}}}}:
      NBlock{"center"}
    # "details"
    case SCon{Chr{100}, SCon{Chr{101}, SCon{Chr{116}, SCon{Chr{97}, SCon{Chr{105}, SCon{Chr{108}, SCon{Chr{115}, SNil{}}}}}}}}:
      NBlock{"details"}
    # "dialog"
    case SCon{Chr{100}, SCon{Chr{105}, SCon{Chr{97}, SCon{Chr{108}, SCon{Chr{111}, SCon{Chr{103}, SNil{}}}}}}}:
      NBlock{"dialog"}
    # "dir"
    case SCon{Chr{100}, SCon{Chr{105}, SCon{Chr{114}, SNil{}}}}:
      NBlock{"dir"}
    # "fieldset"
    case SCon{Chr{102}, SCon{Chr{105}, SCon{Chr{101}, SCon{Chr{108}, SCon{Chr{100}, SCon{Chr{115}, SCon{Chr{101}, SCon{Chr{116}, SNil{}}}}}}}}}:
      NBlock{"fieldset"}
    # "figcaption"
    case SCon{Chr{102}, SCon{Chr{105}, SCon{Chr{103}, SCon{Chr{99}, SCon{Chr{97}, SCon{Chr{112}, SCon{Chr{116}, SCon{Chr{105}, SCon{Chr{111}, SCon{Chr{110}, SNil{}}}}}}}}}}}:
      NBlock{"figcaption"}
    # "figure"
    case SCon{Chr{102}, SCon{Chr{105}, SCon{Chr{103}, SCon{Chr{117}, SCon{Chr{114}, SCon{Chr{101}, SNil{}}}}}}}:
      NBlock{"figure"}
    # "footer"
    case SCon{Chr{102}, SCon{Chr{111}, SCon{Chr{111}, SCon{Chr{116}, SCon{Chr{101}, SCon{Chr{114}, SNil{}}}}}}}:
      NBlock{"footer"}
    # "header"
    case SCon{Chr{104}, SCon{Chr{101}, SCon{Chr{97}, SCon{Chr{100}, SCon{Chr{101}, SCon{Chr{114}, SNil{}}}}}}}:
      NBlock{"header"}
    # "hgroup"
    case SCon{Chr{104}, SCon{Chr{103}, SCon{Chr{114}, SCon{Chr{111}, SCon{Chr{117}, SCon{Chr{112}, SNil{}}}}}}}:
      NBlock{"hgroup"}
    # "main"
    case SCon{Chr{109}, SCon{Chr{97}, SCon{Chr{105}, SCon{Chr{110}, SNil{}}}}}:
      NBlock{"main"}
    # "search"
    case SCon{Chr{115}, SCon{Chr{101}, SCon{Chr{97}, SCon{Chr{114}, SCon{Chr{99}, SCon{Chr{104}, SNil{}}}}}}}:
      NBlock{"search"}
    # "section"
    case SCon{Chr{115}, SCon{Chr{101}, SCon{Chr{99}, SCon{Chr{116}, SCon{Chr{105}, SCon{Chr{111}, SCon{Chr{110}, SNil{}}}}}}}}:
      NBlock{"section"}
    # "summary"
    case SCon{Chr{115}, SCon{Chr{117}, SCon{Chr{109}, SCon{Chr{109}, SCon{Chr{97}, SCon{Chr{114}, SCon{Chr{121}, SNil{}}}}}}}}:
      NBlock{"summary"}
    # "pre"
    case SCon{Chr{112}, SCon{Chr{114}, SCon{Chr{101}, SNil{}}}}:
      NBlock{"pre"}
    # "listing"
    case SCon{Chr{108}, SCon{Chr{105}, SCon{Chr{115}, SCon{Chr{116}, SCon{Chr{105}, SCon{Chr{110}, SCon{Chr{103}, SNil{}}}}}}}}:
      NBlock{"listing"}
    # "b"
    case SCon{Chr{98}, SNil{}}:
      NBreak{"b"}
    # "big"
    case SCon{Chr{98}, SCon{Chr{105}, SCon{Chr{103}, SNil{}}}}:
      NBreak{"big"}
    # "code"
    case SCon{Chr{99}, SCon{Chr{111}, SCon{Chr{100}, SCon{Chr{101}, SNil{}}}}}:
      NBreak{"code"}
    # "em"
    case SCon{Chr{101}, SCon{Chr{109}, SNil{}}}:
      NBreak{"em"}
    # "font"
    case SCon{Chr{102}, SCon{Chr{111}, SCon{Chr{110}, SCon{Chr{116}, SNil{}}}}}:
      NBreak{"font"}
    # "i"
    case SCon{Chr{105}, SNil{}}:
      NBreak{"i"}
    # "ruby"
    case SCon{Chr{114}, SCon{Chr{117}, SCon{Chr{98}, SCon{Chr{121}, SNil{}}}}}:
      NBreak{"ruby"}
    # "s"
    case SCon{Chr{115}, SNil{}}:
      NBreak{"s"}
    # "small"
    case SCon{Chr{115}, SCon{Chr{109}, SCon{Chr{97}, SCon{Chr{108}, SCon{Chr{108}, SNil{}}}}}}:
      NBreak{"small"}
    # "span"
    case SCon{Chr{115}, SCon{Chr{112}, SCon{Chr{97}, SCon{Chr{110}, SNil{}}}}}:
      NBreak{"span"}
    # "strong"
    case SCon{Chr{115}, SCon{Chr{116}, SCon{Chr{114}, SCon{Chr{111}, SCon{Chr{110}, SCon{Chr{103}, SNil{}}}}}}}:
      NBreak{"strong"}
    # "strike"
    case SCon{Chr{115}, SCon{Chr{116}, SCon{Chr{114}, SCon{Chr{105}, SCon{Chr{107}, SCon{Chr{101}, SNil{}}}}}}}:
      NBreak{"strike"}
    # "sub"
    case SCon{Chr{115}, SCon{Chr{117}, SCon{Chr{98}, SNil{}}}}:
      NBreak{"sub"}
    # "sup"
    case SCon{Chr{115}, SCon{Chr{117}, SCon{Chr{112}, SNil{}}}}:
      NBreak{"sup"}
    # "tt"
    case SCon{Chr{116}, SCon{Chr{116}, SNil{}}}:
      NBreak{"tt"}
    # "u"
    case SCon{Chr{117}, SNil{}}:
      NBreak{"u"}
    # "var"
    case SCon{Chr{118}, SCon{Chr{97}, SCon{Chr{114}, SNil{}}}}:
      NBreak{"var"}
    # "noscript"
    case SCon{Chr{110}, SCon{Chr{111}, SCon{Chr{115}, SCon{Chr{99}, SCon{Chr{114}, SCon{Chr{105}, SCon{Chr{112}, SCon{Chr{116}, SNil{}}}}}}}}}:
      NBanned{}
    # "template"
    case SCon{Chr{116}, SCon{Chr{101}, SCon{Chr{109}, SCon{Chr{112}, SCon{Chr{108}, SCon{Chr{97}, SCon{Chr{116}, SCon{Chr{101}, SNil{}}}}}}}}}:
      NBanned{}
    # "plaintext"
    case SCon{Chr{112}, SCon{Chr{108}, SCon{Chr{97}, SCon{Chr{105}, SCon{Chr{110}, SCon{Chr{116}, SCon{Chr{101}, SCon{Chr{120}, SCon{Chr{116}, SNil{}}}}}}}}}}:
      NBanned{}
    # "xmp"
    case SCon{Chr{120}, SCon{Chr{109}, SCon{Chr{112}, SNil{}}}}:
      NBanned{}
    # "iframe"
    case SCon{Chr{105}, SCon{Chr{102}, SCon{Chr{114}, SCon{Chr{97}, SCon{Chr{109}, SCon{Chr{101}, SNil{}}}}}}}:
      NBanned{}
    # "noembed"
    case SCon{Chr{110}, SCon{Chr{111}, SCon{Chr{101}, SCon{Chr{109}, SCon{Chr{98}, SCon{Chr{101}, SCon{Chr{100}, SNil{}}}}}}}}:
      NBanned{}
    # "noframes"
    case SCon{Chr{110}, SCon{Chr{111}, SCon{Chr{102}, SCon{Chr{114}, SCon{Chr{97}, SCon{Chr{109}, SCon{Chr{101}, SCon{Chr{115}, SNil{}}}}}}}}}:
      NBanned{}
    # "base": it changes where every link goes
    case SCon{Chr{98}, SCon{Chr{97}, SCon{Chr{115}, SCon{Chr{101}, SNil{}}}}}:
      NBanned{}
    # "table": tables move what is in them
    case SCon{Chr{116}, SCon{Chr{97}, SCon{Chr{98}, SCon{Chr{108}, SCon{Chr{101}, SNil{}}}}}}:
      NBanned{}
    # "caption"
    case SCon{Chr{99}, SCon{Chr{97}, SCon{Chr{112}, SCon{Chr{116}, SCon{Chr{105}, SCon{Chr{111}, SCon{Chr{110}, SNil{}}}}}}}}:
      NBanned{}
    # "colgroup"
    case SCon{Chr{99}, SCon{Chr{111}, SCon{Chr{108}, SCon{Chr{103}, SCon{Chr{114}, SCon{Chr{111}, SCon{Chr{117}, SCon{Chr{112}, SNil{}}}}}}}}}:
      NBanned{}
    # "col"
    case SCon{Chr{99}, SCon{Chr{111}, SCon{Chr{108}, SNil{}}}}:
      NBanned{}
    # "tbody"
    case SCon{Chr{116}, SCon{Chr{98}, SCon{Chr{111}, SCon{Chr{100}, SCon{Chr{121}, SNil{}}}}}}:
      NBanned{}
    # "thead"
    case SCon{Chr{116}, SCon{Chr{104}, SCon{Chr{101}, SCon{Chr{97}, SCon{Chr{100}, SNil{}}}}}}:
      NBanned{}
    # "tfoot"
    case SCon{Chr{116}, SCon{Chr{102}, SCon{Chr{111}, SCon{Chr{111}, SCon{Chr{116}, SNil{}}}}}}:
      NBanned{}
    # "tr"
    case SCon{Chr{116}, SCon{Chr{114}, SNil{}}}:
      NBanned{}
    # "td"
    case SCon{Chr{116}, SCon{Chr{100}, SNil{}}}:
      NBanned{}
    # "th"
    case SCon{Chr{116}, SCon{Chr{104}, SNil{}}}:
      NBanned{}
    # "select": a browser drops most tags inside it
    case SCon{Chr{115}, SCon{Chr{101}, SCon{Chr{108}, SCon{Chr{101}, SCon{Chr{99}, SCon{Chr{116}, SNil{}}}}}}}:
      NBanned{}
    # "option"
    case SCon{Chr{111}, SCon{Chr{112}, SCon{Chr{116}, SCon{Chr{105}, SCon{Chr{111}, SCon{Chr{110}, SNil{}}}}}}}:
      NBanned{}
    # "optgroup"
    case SCon{Chr{111}, SCon{Chr{112}, SCon{Chr{116}, SCon{Chr{103}, SCon{Chr{114}, SCon{Chr{111}, SCon{Chr{117}, SCon{Chr{112}, SNil{}}}}}}}}}:
      NBanned{}
    # "frameset"
    case SCon{Chr{102}, SCon{Chr{114}, SCon{Chr{97}, SCon{Chr{109}, SCon{Chr{101}, SCon{Chr{115}, SCon{Chr{101}, SCon{Chr{116}, SNil{}}}}}}}}}:
      NBanned{}
    # "frame"
    case SCon{Chr{102}, SCon{Chr{114}, SCon{Chr{97}, SCon{Chr{109}, SCon{Chr{101}, SNil{}}}}}}:
      NBanned{}
    # "image": a browser reads it as img
    case SCon{Chr{105}, SCon{Chr{109}, SCon{Chr{97}, SCon{Chr{103}, SCon{Chr{101}, SNil{}}}}}}:
      NBanned{}
    # "rb"
    case SCon{Chr{114}, SCon{Chr{98}, SNil{}}}:
      NBanned{}
    # "rp"
    case SCon{Chr{114}, SCon{Chr{112}, SNil{}}}:
      NBanned{}
    # "rt"
    case SCon{Chr{114}, SCon{Chr{116}, SNil{}}}:
      NBanned{}
    # "rtc"
    case SCon{Chr{114}, SCon{Chr{116}, SCon{Chr{99}, SNil{}}}}:
      NBanned{}
    case t:
      NOther{t}

# an element with no end tag: a browser never holds it open
def Html.void(n: Name) -> Bool:
  match n:
    case NVoid{t}:
      True{}
    case NLink{}:
      True{}
    case NHr{}:
      True{}
    case NImg{}:
      True{}
    case NMeta{}:
      True{}
    case _:
      False{}

def Html.key(s: String) -> Key:
  match s:
    # "id"
    case SCon{Chr{105}, SCon{Chr{100}, SNil{}}}:
      KId{}
    # "href"
    case SCon{Chr{104}, SCon{Chr{114}, SCon{Chr{101}, SCon{Chr{102}, SNil{}}}}}:
      KHref{}
    # "rel"
    case SCon{Chr{114}, SCon{Chr{101}, SCon{Chr{108}, SNil{}}}}:
      KRel{}
    # "aria-labelledby"
    case SCon{Chr{97}, SCon{Chr{114}, SCon{Chr{105}, SCon{Chr{97}, SCon{Chr{45}, SCon{Chr{108}, SCon{Chr{97}, SCon{Chr{98}, SCon{Chr{101}, SCon{Chr{108}, SCon{Chr{108}, SCon{Chr{101}, SCon{Chr{100}, SCon{Chr{98}, SCon{Chr{121}, SNil{}}}}}}}}}}}}}}}}:
      KLabelled{}
    # "lang"
    case SCon{Chr{108}, SCon{Chr{97}, SCon{Chr{110}, SCon{Chr{103}, SNil{}}}}}:
      KLang{}
    # "content"
    case SCon{Chr{99}, SCon{Chr{111}, SCon{Chr{110}, SCon{Chr{116}, SCon{Chr{101}, SCon{Chr{110}, SCon{Chr{116}, SNil{}}}}}}}}:
      KContent{}
    # "name"
    case SCon{Chr{110}, SCon{Chr{97}, SCon{Chr{109}, SCon{Chr{101}, SNil{}}}}}:
      KName{}
    # "property"
    case SCon{Chr{112}, SCon{Chr{114}, SCon{Chr{111}, SCon{Chr{112}, SCon{Chr{101}, SCon{Chr{114}, SCon{Chr{116}, SCon{Chr{121}, SNil{}}}}}}}}}:
      KProperty{}
    # "src"
    case SCon{Chr{115}, SCon{Chr{114}, SCon{Chr{99}, SNil{}}}}:
      KSrc{}
    # "srcset"
    case SCon{Chr{115}, SCon{Chr{114}, SCon{Chr{99}, SCon{Chr{115}, SCon{Chr{101}, SCon{Chr{116}, SNil{}}}}}}}:
      KSrcset{}
    # "poster"
    case SCon{Chr{112}, SCon{Chr{111}, SCon{Chr{115}, SCon{Chr{116}, SCon{Chr{101}, SCon{Chr{114}, SNil{}}}}}}}:
      KPoster{}
    # "alt"
    case SCon{Chr{97}, SCon{Chr{108}, SCon{Chr{116}, SNil{}}}}:
      KAlt{}
    # "aria-label"
    case SCon{Chr{97}, SCon{Chr{114}, SCon{Chr{105}, SCon{Chr{97}, SCon{Chr{45}, SCon{Chr{108}, SCon{Chr{97}, SCon{Chr{98}, SCon{Chr{101}, SCon{Chr{108}, SNil{}}}}}}}}}}}:
      KLabel{}
    # "title"
    case SCon{Chr{116}, SCon{Chr{105}, SCon{Chr{116}, SCon{Chr{108}, SCon{Chr{101}, SNil{}}}}}}:
      KTitle{}
    # "hidden"
    case SCon{Chr{104}, SCon{Chr{105}, SCon{Chr{100}, SCon{Chr{100}, SCon{Chr{101}, SCon{Chr{110}, SNil{}}}}}}}:
      KHidden{}
    # "aria-hidden"
    case SCon{Chr{97}, SCon{Chr{114}, SCon{Chr{105}, SCon{Chr{97}, SCon{Chr{45}, SCon{Chr{104}, SCon{Chr{105}, SCon{Chr{100}, SCon{Chr{100}, SCon{Chr{101}, SCon{Chr{110}, SNil{}}}}}}}}}}}}:
      KAriaHidden{}
    case _:
      KOther{}

# a raw-text element: its text ends only at its end tag
def Html.raw(n: Name) -> Maybe<&2, String>:
  match n:
    case NScript{}:
      Some{"script"}
    case NStyle{}:
      Some{"style"}
    case NTitle{}:
      Some{"title"}
    case NTextarea{}:
      Some{"textarea"}
    case _:
      None{}

# Characters
# ----------

# one character inside a tag; letters folded to lower case
type Ck is Data:
  CLt{}
  CGt{}
  CSl{}
  CBang{}
  CDash{}
  CEq{}
  CDq{}
  CSq{}
  CTick{}
  CSp{}
  CLetter{c: Char}
  CName{c: Char}
  COther{c: Char}

def Ck.of(c: Char) -> Ck:
  match c:
    case Chr{60}:
      CLt{}
    case Chr{62}:
      CGt{}
    case Chr{47}:
      CSl{}
    case Chr{33}:
      CBang{}
    case Chr{45}:
      CDash{}
    case Chr{61}:
      CEq{}
    case Chr{34}:
      CDq{}
    case Chr{39}:
      CSq{}
    case Chr{96}:
      CTick{}
    case Chr{32}:
      CSp{}
    case Chr{9}:
      CSp{}
    case Chr{10}:
      CSp{}
    case Chr{12}:
      CSp{}
    case Chr{13}:
      CSp{}
    case Chr{48}:
      CName{Chr{48}}
    case Chr{49}:
      CName{Chr{49}}
    case Chr{50}:
      CName{Chr{50}}
    case Chr{51}:
      CName{Chr{51}}
    case Chr{52}:
      CName{Chr{52}}
    case Chr{53}:
      CName{Chr{53}}
    case Chr{54}:
      CName{Chr{54}}
    case Chr{55}:
      CName{Chr{55}}
    case Chr{56}:
      CName{Chr{56}}
    case Chr{57}:
      CName{Chr{57}}
    case Chr{97}:
      CLetter{Chr{97}}
    case Chr{98}:
      CLetter{Chr{98}}
    case Chr{99}:
      CLetter{Chr{99}}
    case Chr{100}:
      CLetter{Chr{100}}
    case Chr{101}:
      CLetter{Chr{101}}
    case Chr{102}:
      CLetter{Chr{102}}
    case Chr{103}:
      CLetter{Chr{103}}
    case Chr{104}:
      CLetter{Chr{104}}
    case Chr{105}:
      CLetter{Chr{105}}
    case Chr{106}:
      CLetter{Chr{106}}
    case Chr{107}:
      CLetter{Chr{107}}
    case Chr{108}:
      CLetter{Chr{108}}
    case Chr{109}:
      CLetter{Chr{109}}
    case Chr{110}:
      CLetter{Chr{110}}
    case Chr{111}:
      CLetter{Chr{111}}
    case Chr{112}:
      CLetter{Chr{112}}
    case Chr{113}:
      CLetter{Chr{113}}
    case Chr{114}:
      CLetter{Chr{114}}
    case Chr{115}:
      CLetter{Chr{115}}
    case Chr{116}:
      CLetter{Chr{116}}
    case Chr{117}:
      CLetter{Chr{117}}
    case Chr{118}:
      CLetter{Chr{118}}
    case Chr{119}:
      CLetter{Chr{119}}
    case Chr{120}:
      CLetter{Chr{120}}
    case Chr{121}:
      CLetter{Chr{121}}
    case Chr{122}:
      CLetter{Chr{122}}
    case Chr{65}:
      CLetter{Chr{97}}
    case Chr{66}:
      CLetter{Chr{98}}
    case Chr{67}:
      CLetter{Chr{99}}
    case Chr{68}:
      CLetter{Chr{100}}
    case Chr{69}:
      CLetter{Chr{101}}
    case Chr{70}:
      CLetter{Chr{102}}
    case Chr{71}:
      CLetter{Chr{103}}
    case Chr{72}:
      CLetter{Chr{104}}
    case Chr{73}:
      CLetter{Chr{105}}
    case Chr{74}:
      CLetter{Chr{106}}
    case Chr{75}:
      CLetter{Chr{107}}
    case Chr{76}:
      CLetter{Chr{108}}
    case Chr{77}:
      CLetter{Chr{109}}
    case Chr{78}:
      CLetter{Chr{110}}
    case Chr{79}:
      CLetter{Chr{111}}
    case Chr{80}:
      CLetter{Chr{112}}
    case Chr{81}:
      CLetter{Chr{113}}
    case Chr{82}:
      CLetter{Chr{114}}
    case Chr{83}:
      CLetter{Chr{115}}
    case Chr{84}:
      CLetter{Chr{116}}
    case Chr{85}:
      CLetter{Chr{117}}
    case Chr{86}:
      CLetter{Chr{118}}
    case Chr{87}:
      CLetter{Chr{119}}
    case Chr{88}:
      CLetter{Chr{120}}
    case Chr{89}:
      CLetter{Chr{121}}
    case Chr{90}:
      CLetter{Chr{122}}
    case Chr{x}:
      COther{Chr{x}}

# s is ASCII white space only
def Blank.is(s: String) -> Bool:
  match s:
    case SNil{}:
      True{}
    case SCon{Chr{9}, t}:
      Blank.is(t)
    case SCon{Chr{10}, t}:
      Blank.is(t)
    case SCon{Chr{12}, t}:
      Blank.is(t)
    case SCon{Chr{13}, t}:
      Blank.is(t)
    case SCon{Chr{32}, t}:
      Blank.is(t)
    case SCon{c, t}:
      False{}
