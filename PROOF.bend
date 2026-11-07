# gildrb.com: the proofs
# ======================
#
# Each law of laws/ is proven in its own file in proof/<area>/, from the
# lemmas in proof/base.bend. `bend PROOF.bend` checks them all (the gate);
# `--verdict` rechecks them with the Lean-proven kernel (optional, slow).

import Base
import ./LAWS.bend as Laws
import ./proof/home/home_text.bend as HomeText
import ./proof/home/home_shown.bend as HomeShown
import ./proof/pages/headings.bend as Headings
import ./proof/pages/lang.bend as Lang
import ./proof/pages/home_page.bend as HomePage
import ./proof/agents/poppy.bend as Poppy
import ./proof/a11y/a11y.bend as A11y
import ./proof/meta/canonical.bend as Canonical
import ./proof/meta/metadata.bend as Metadata
import ./proof/crawl/sitemap.bend as Sitemap
import ./proof/crawl/robots.bend as Robots
import ./proof/links/links_html.bend as LinksHtml
import ./proof/links/links_text.bend as LinksText
