#!/usr/bin/env python3
"""Icone di Eddy: logo "Tre notizie", tre strisce arrotondate sfalsate verso destra su quadrato bianco.

  python make_icons.py OUT_ICONS

Geometria (docs/design-definitivo/logo/eddy-icona.svg): griglia 120x120, quadrato bianco con raggio 28,
strisce 50x12 (raggio 6) spostate di (25, 35): rossa a x 0 y 0, blu a x 10 y 19, arancio a x 20 y 38.
Per Android (maskable) il fondo è pieno e le strisce sono ridotte a 0,72 attorno al centro (zona sicura).

Scrive icon-48/72/96/144/192/512.png (angoli arrotondati trasparenti), maskable-512.png e apple-touch-icon.png
(a tutta superficie: gli angoli li arrotonda il telefono).
"""
import os
import sys

from PIL import Image, ImageDraw

WHITE = (255, 255, 255, 255)
STRIPES = [  # (x, y, colore) su griglia 70x50
    (0, 0, (0xD0, 0x02, 0x1B, 255)),   # rossa
    (10, 19, (0x3D, 0x5F, 0xC4, 255)),  # blu
    (20, 38, (0xC2, 0x54, 0x00, 255)),  # arancio
]
SS = 4  # disegno 4 volte più grande e poi riduco: bordi lisci


def draw(size, rounded=True, maskable=False):
    big = size * SS
    im = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    u = big / 120
    if rounded:
        d.rounded_rectangle([0, 0, big - 1, big - 1], radius=28 * u, fill=WHITE)
    else:
        d.rectangle([0, 0, big, big], fill=WHITE)
    ox, oy, k = (35, 41, 0.72) if maskable else (25, 35, 1.0)
    for x, y, col in STRIPES:
        x0, y0 = (ox + x * k) * u, (oy + y * k) * u
        d.rounded_rectangle([x0, y0, x0 + 50 * k * u, y0 + 12 * k * u], radius=6 * k * u, fill=col)
    return im.resize((size, size), Image.LANCZOS)


def main(out):
    os.makedirs(out, exist_ok=True)
    for s in (48, 72, 96, 144, 192, 512):
        draw(s).save(os.path.join(out, f"icon-{s}.png"), optimize=True)
    draw(512, rounded=False, maskable=True).save(os.path.join(out, "maskable-512.png"), optimize=True)
    draw(180, rounded=False).save(os.path.join(out, "apple-touch-icon.png"), optimize=True)


if __name__ == "__main__":
    main(sys.argv[1])
