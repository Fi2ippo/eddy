#!/usr/bin/env python3
"""Icone di Eddy: "E" bianca su quadrato blu Inchiostro con punto arancio (stesso disegno di icon.svg).

  python make_icons.py OUT_ICONS

Scrive icon-48/72/96/144/192/512.png (angoli arrotondati trasparenti), maskable-512.png e apple-touch-icon.png
(a tutta superficie, disegno ridotto nella zona sicura), logo-l.png e logo-d.png (logo della testata dell'app).
"""
import os
import sys

from PIL import Image, ImageDraw

BLUE = (43, 63, 214, 255)
WHITE = (255, 255, 255, 255)
ORANGE = (255, 122, 61, 255)
SS = 4  # disegno 4 volte più grande e poi riduco: bordi lisci


def draw(size, rounded=True, scale=1.0):
    """Icona su griglia 64x64: quadrato (rx 16), E (x 18-40, y 15-49), punto (47,45) r 4."""
    big = size * SS
    im = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    u = big / 64
    if rounded:
        d.rounded_rectangle([0, 0, big - 1, big - 1], radius=16 * u, fill=BLUE)
    else:
        d.rectangle([0, 0, big, big], fill=BLUE)
    c = 32 * u  # centro: il disegno si riduce attorno al centro per la zona sicura

    def p(x, y):
        return (c + (x * u - c) * scale, c + (y * u - c) * scale)

    for x0, y0, x1, y1 in [(18, 15, 26.5, 49), (18, 15, 40, 22.5), (18, 28, 38, 35.5), (18, 41.5, 40, 49)]:
        d.rectangle([*p(x0, y0), *p(x1, y1)], fill=WHITE)
    cx, cy = p(47, 45)
    r = 4 * u * scale
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=ORANGE)
    return im.resize((size, size), Image.LANCZOS)


def main(out):
    os.makedirs(out, exist_ok=True)
    for s in (48, 72, 96, 144, 192, 512):
        draw(s).save(os.path.join(out, f"icon-{s}.png"), optimize=True)
    draw(512, rounded=False, scale=0.78).save(os.path.join(out, "maskable-512.png"), optimize=True)
    draw(180, rounded=False).save(os.path.join(out, "apple-touch-icon.png"), optimize=True)
    for name in ("logo-l.png", "logo-d.png"):
        draw(136).save(os.path.join(out, name), optimize=True)


if __name__ == "__main__":
    main(sys.argv[1])
