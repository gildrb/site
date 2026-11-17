# /// script
# requires-python = ">=3.11"
# dependencies = ["fonttools[woff]==4.60.2", "certifi"]
# ///
"""Builds the site's two Allo files from the official Allo release.

    uv run scripts/allo.py

public/fonts/allo.woff2, for the page: the site's characters (the ranges in `alloRanges`,
src/layout.tsx), the features the page uses (`fontFeatures`, src/tokens.stylex.ts; `tnum` for
dates), weights 380 to 600, optical size pinned at Text (14) and roundness at Friendly (50).

src/fonts/allo-share.woff2, for the link-preview image (src/og.tsx), whose renderer cannot turn
on OpenType features: the same font with the case forms the page turns on built in as well, for
the hyphen and the arrows, which the image only sets beside capitals and figures.
"""

import io
import ssl
import urllib.request
from pathlib import Path

import certifi
from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer

SOURCE = "https://raw.githubusercontent.com/joshpuckett/allo/v1.0.1/"
MEMBER = "fonts/variable/AlloVariable.ttf"
LICENSE = "OFL.txt"
ROOT = Path(__file__).resolve().parent.parent
PAGE = ROOT / "public/fonts/allo.woff2"
SHARE = ROOT / "src/fonts/allo-share.woff2"
LICENSE_OUTPUT = ROOT / "public/fonts/Allo-OFL.txt"
# Must match `alloRanges` in src/layout.tsx.
RANGES = [
    (0x0020, 0x007E), (0x00A0, 0x00FF), (0x0100, 0x017F), (0x0131, 0x0131), (0x0152, 0x0153),
    (0x02C6, 0x02C6), (0x02DA, 0x02DA), (0x02DC, 0x02DC), (0x2010, 0x205E), (0x20AC, 0x20AC),
    (0x2122, 0x2122), (0x2190, 0x21FF), (0x2212, 0x2212), (0x2500, 0x257F),
]
FEATURES = ["calt", "case", "dnom", "frac", "kern", "liga", "locl", "numr", "tnum"]
AXES = {"opsz": 14, "ROND": 50, "wght": (380, 600)}
# The hyphen and every arrow the font has a case form for.
SHARE_CASE = {0x002D} | set(range(0x2190, 0x2200))


def fetch(path: str) -> bytes:
    # certifi's CA bundle, so the download verifies on any machine, whatever its system store.
    context = ssl.create_default_context(cafile=certifi.where())
    with urllib.request.urlopen(SOURCE + path, context=context) as response:
        return response.read()


def single_substitutions(font: TTFont, tag: str) -> dict[str, str]:
    table = font["GSUB"].table
    mapping: dict[str, str] = {}
    for record in table.FeatureList.FeatureRecord:
        if record.FeatureTag != tag:
            continue
        for index in record.Feature.LookupListIndex:
            for sub in table.LookupList.Lookup[index].SubTable:
                inner = getattr(sub, "ExtSubTable", sub)
                mapping.update(getattr(inner, "mapping", None) or {})
    if not mapping:
        raise SystemExit(f"Allo has no single substitutions for {tag}")
    return mapping


def build(source: bytes, output: Path, case: set[int]) -> None:
    font = TTFont(io.BytesIO(source), lazy=False)
    characters = sorted({c for start, end in RANGES for c in range(start, end + 1)} & set(font.getBestCmap()))
    if case:
        case_forms = single_substitutions(font, "case")
        for cmap in font["cmap"].tables:
            if cmap.isUnicode():
                for codepoint, glyph in list(cmap.cmap.items()):
                    if codepoint in case:
                        cmap.cmap[codepoint] = case_forms.get(glyph, glyph)

    options = subset.Options()
    options.layout_features = FEATURES
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=characters)
    subsetter.subset(font)
    font = instancer.instantiateVariableFont(font, AXES)
    font.flavor = "woff2"
    output.parent.mkdir(parents=True, exist_ok=True)
    font.save(output)
    print(f"{output.relative_to(ROOT)}: {len(characters)} characters, {output.stat().st_size} bytes")


def main() -> None:
    source = fetch(MEMBER)
    build(source, PAGE, case=set())
    build(source, SHARE, case=SHARE_CASE)
    LICENSE_OUTPUT.write_bytes(fetch(LICENSE))


if __name__ == "__main__":
    main()
