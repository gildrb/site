# /// script
# requires-python = ">=3.11"
# dependencies = ["fonttools[woff]==4.60.2", "certifi"]
# ///
"""Builds the site's monospace from the official Paper Mono release.

    uv run scripts/paper-mono.py

public/fonts/paper-mono.woff2: Paper Mono 400, the site's characters (the ranges in
`monoRanges`, src/layout.tsx), its `calt` and `kern`. The character variants and stylistic sets
stay out: the defaults are the face.
"""

import io
import ssl
import urllib.request
from pathlib import Path

import certifi
from fontTools import subset
from fontTools.ttLib import TTFont

SOURCE = "https://raw.githubusercontent.com/paper-design/paper-mono/v1.000/"
MEMBER = "fonts/ttf/PaperMono-Regular.ttf"
LICENSE = "OFL.txt"
ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "public/fonts/paper-mono.woff2"
LICENSE_OUTPUT = ROOT / "public/fonts/PaperMono-OFL.txt"
# Must match `monoRanges` in src/layout.tsx.
RANGES = [
    (0x0020, 0x007E), (0x00A0, 0x00FF), (0x0131, 0x0131), (0x0152, 0x0153), (0x02C6, 0x02C6),
    (0x02DA, 0x02DA), (0x02DC, 0x02DC), (0x2010, 0x205E), (0x20AC, 0x20AC), (0x2122, 0x2122),
    (0x2190, 0x21FF), (0x2212, 0x2212), (0x2500, 0x257F),
]
FEATURES = ["calt", "kern"]


def fetch(path: str) -> bytes:
    # certifi's CA bundle, so the download verifies on any machine, whatever its system store.
    context = ssl.create_default_context(cafile=certifi.where())
    with urllib.request.urlopen(SOURCE + path, context=context) as response:
        return response.read()


def main() -> None:
    font = TTFont(io.BytesIO(fetch(MEMBER)), lazy=False)
    characters = sorted({c for start, end in RANGES for c in range(start, end + 1)} & set(font.getBestCmap()))
    options = subset.Options()
    options.layout_features = FEATURES
    options.name_IDs = ["*"]
    options.notdef_outline = True
    subsetter = subset.Subsetter(options)
    subsetter.populate(unicodes=characters)
    subsetter.subset(font)
    font.flavor = "woff2"
    font.save(OUTPUT)
    LICENSE_OUTPUT.write_bytes(fetch(LICENSE))
    print(f"{OUTPUT.relative_to(ROOT)}: {len(characters)} characters, {OUTPUT.stat().st_size} bytes")


if __name__ == "__main__":
    main()
