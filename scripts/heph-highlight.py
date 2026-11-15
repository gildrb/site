# /// script
# requires-python = ">=3.11"
# dependencies = ["pillow==11.3.0", "numpy"]
# ///
"""Builds the homepage's Archive picture of Heph: its glass window over the whole painting.

    uv run scripts/heph-highlight.py

public/images/optimized/gil-rodrigues-heph-highlight-<width>.webp, 16:10, the frame the homepage
previews in (`preview-frame.ts`). The capture (`heph-terminal`) is the painting (`heph-forge`) at
4:3 under the window, dimmed by the desktop; at 16:10 the window would fill the frame edge to edge.
So the window is cut out of the capture and set, smaller, over the painting, which is dimmed the
same way: each channel's gain and offset fitted on the capture's border, where only painting shows.
"""

from pathlib import Path

import numpy as np
from PIL import Image, ImageChops, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
IMAGES = ROOT / "public/images/optimized"
PAINTING = IMAGES / "gil-rodrigues-heph-forge-1600.webp"
CAPTURE = IMAGES / "gil-rodrigues-heph-terminal-1600.webp"
WIDTHS = [480, 720, 960, 1280, 1600]
SIZE = (1600, 1000)
# The capture is the painting at the same scale, shifted up by this many pixels.
CAPTURE_TOP = 8
# The window's box in the capture, rim included, and its corner radius.
WINDOW = (97, 107, 1503, 1082)
RADIUS = 28
# The window's height in the frame, as a share of it.
WINDOW_SHARE = 0.8


def dimming(painting: np.ndarray, capture: np.ndarray) -> list[tuple[float, float]]:
    """Each channel's gain and offset from painting to capture, fitted where only painting shows."""
    height, width = capture.shape[:2]
    under = painting[CAPTURE_TOP : CAPTURE_TOP + height, :width]
    border = np.zeros((height, width), bool)
    border[: int(height * 0.06)] = True
    border[int(height * 0.95) :] = True
    border[:, : int(width * 0.025)] = True
    border[:, int(width * 0.975) :] = True
    return [tuple(np.polyfit(under[..., c][border], capture[..., c][border], 1)) for c in range(3)]


def ground(painting: Image.Image, fit: list[tuple[float, float]]) -> Image.Image:
    """The painting dimmed as the desktop dims it, scaled and cropped about its centre to SIZE."""
    scale = max(SIZE[0] / painting.width, SIZE[1] / painting.height)
    scaled = painting.resize((round(painting.width * scale), round(painting.height * scale)), Image.LANCZOS)
    left, top = (scaled.width - SIZE[0]) // 2, (scaled.height - SIZE[1]) // 2
    pixels = np.asarray(scaled.crop((left, top, left + SIZE[0], top + SIZE[1])), float)
    dimmed = np.stack([gain * pixels[..., c] + offset for c, (gain, offset) in enumerate(fit)], -1)
    return Image.fromarray(np.clip(dimmed, 0, 255).astype("uint8"))


def rounded(size: tuple[int, int], radius: int) -> Image.Image:
    mask = Image.new("L", size, 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, size[0] - 1, size[1] - 1), radius, fill=255)
    return mask


def main() -> None:
    painting = Image.open(PAINTING).convert("RGB")
    capture = Image.open(CAPTURE).convert("RGB")
    frame = ground(painting, dimming(np.asarray(painting, float), np.asarray(capture, float)))

    window = capture.crop(WINDOW)
    scale = SIZE[1] * WINDOW_SHARE / window.height
    window = window.resize((round(window.width * scale), round(window.height * scale)), Image.LANCZOS)
    mask = rounded(window.size, round(RADIUS * scale))
    left, top = (SIZE[0] - window.width) // 2, (SIZE[1] - window.height) // 2

    # A soft shadow below the window, as the desktop casts it.
    shadow = Image.new("L", SIZE, 0)
    shadow.paste(mask, (left, top + round(16 * scale)))
    shadow = shadow.filter(ImageFilter.GaussianBlur(28 * scale))
    frame.paste(Image.new("RGB", SIZE, (8, 6, 4)), (0, 0), ImageChops.multiply(shadow, Image.new("L", SIZE, 140)))
    frame.paste(window, (left, top), mask)

    for width in WIDTHS:
        output = IMAGES / f"gil-rodrigues-heph-highlight-{width}.webp"
        frame.resize((width, round(width * SIZE[1] / SIZE[0])), Image.LANCZOS).save(output, quality=86, method=6)
        print(f"{output.relative_to(ROOT)}: {output.stat().st_size} bytes")


if __name__ == "__main__":
    main()
