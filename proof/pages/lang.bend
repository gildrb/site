# Proof of lang (laws/pages.bend)
# =================================
#
# Spec.both(text) is Heads.of(toks) && Lang.of(toks) for the page's tokens
# (both.bend proves it for the page at path); lang is its right half.

import Base
import ../../laws/base/html/tree.bend as T
import ../../laws/pages.bend as Pages
import ../base.bend as L
import ./both.bend as B

def Pages.lang(path, text, at):
  L.And.r(Pages.Heads.of(T.Html.toks(text)), Pages.Lang.of(T.Html.toks(text)), B.Both.page(path, text, at))
