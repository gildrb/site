# Proof of headings (laws/pages.bend)
# =====================================
#
# Spec.both(text) is Heads.of(toks) && Lang.of(toks) for the page's tokens
# (both.bend proves it for the page at path); headings is its left half.

import Base
import ../../laws/base/html/tree.bend as T
import ../../laws/pages.bend as Pages
import ../base.bend as L
import ./both.bend as B

def Pages.headings(path, text, at):
  L.And.l(Pages.Heads.of(T.Html.toks(text)), Pages.Lang.of(T.Html.toks(text)), B.Both.page(path, text, at))
