# Proof of links_text (laws/links.bend)
# =====================================
#
# Text.all holds on S.Site.files(): computed in chunks of files, one def
# each (one budget per def; llms-full.txt and sitemap.xml are the
# costliest), joined by Text.split; the last chunk is every file after
# the others.

import Base
import ../../build/site.bend as S
import ../../laws/links.bend as Links
import ../base.bend as L
import ../meta/base.bend as B

# R10 on the first n files and on the rest: on all
def Text.split(n: Nat, fs: List<&2, S.Out>, +e1: {Links.Text.all(B.Out.take(n, fs)) == True{} : Bool}, e2: {Links.Text.all(B.Out.drop(n, fs)) == True{} : Bool}) -> {Links.Text.all(fs) == True{} : Bool}:
  match n fs:
    case 0n fs:
      e2
    case 1n+p Nil{}:
      {==}
    case 1n+p Con{S.Out{+path, +text}, +t}:
      L.And.both(Links.Text.file(path, text), Links.Text.all(t), L.And.l(Links.Text.file(path, text), Links.Text.all(B.Out.take(p, t)), e1), Text.split(p, t, L.And.r(Links.Text.file(path, text), Links.Text.all(B.Out.take(p, t)), e1), e2))

# chunks of 19 files, then the rest

def Text.c0() -> {Links.Text.all(B.Out.take(19n, S.Site.files())) == True{} : Bool}:
  {==}

def Text.c1() -> {Links.Text.all(B.Out.drop(19n, S.Site.files())) == True{} : Bool}:
  {==}

def Links.links_text():
  Text.split(19n, S.Site.files(), Text.c0(), Text.c1())
