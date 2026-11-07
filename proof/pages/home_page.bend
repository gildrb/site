# Proof of home_page (laws/pages.bend)
# ====================================
#
# The witness is the homepage's text as the build holds it; both sides then
# compute to the same Some.

import Base
import ../../laws/base/page.bend as P
import ../../laws/pages.bend as Pages

# a page's text, or no text when there is no such page (then the law is false)
def Home.text(m: Maybe<&2, List<&2, String>>) -> List<&2, String>:
  match m:
    case Some{text}:
      text
    case None{}:
      []

def Pages.home_page():
  (Home.text(P.Spec.page("index.html")), {==})
