# Archetypon: convert SVG to PNG, ICO, WebP, JPEG and PDF

## Every logo file from one SVG

Drop SVG files on this page, with the .ttf, .otf or .ttc fonts that their text uses.

![](media:archetypon-finder)

## Too many exports

A logo needs favicons, app icons, PNG for slides, PDF for print and WebP for the web. Each export by hand can get a size or a background wrong.

## Every file at once

Drop the SVG on this page and download one ZIP. It holds optimized SVG, PNG, WebP and JPEG from 16 to 4096 pixels, one ICO favicon with many sizes, and a vector PDF. If the SVG has text, add its font files. Archetypon runs on the device, in WebAssembly, and uploads nothing.

## Command line

The `typ` command uses the same engine, for scripts and builds:

```sh
typ -f png,ico -s 64,512 logo.svg
```

Build it from source:

```sh
git clone https://github.com/gildrb/archetypon
cd archetypon
make
sudo make install
```
