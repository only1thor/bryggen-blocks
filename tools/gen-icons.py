#!/usr/bin/env python3
"""Generate PWA icons for Bryggen Blocks — pure Python stdlib PNG writer."""

import struct
import zlib
import os

def create_png(width, height, pixels):
    """Create a PNG file from RGBA pixel data.
    pixels: list of rows, each row is list of (r,g,b,a) tuples.
    """
    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack('>I', zlib.crc32(c) & 0xFFFFFFFF)
        return struct.pack('>I', len(data)) + c + crc

    # IHDR
    ihdr = struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)  # 8-bit RGBA

    # IDAT
    raw = b''
    for row in pixels:
        raw += b'\x00'  # filter none
        for r, g, b, a in row:
            raw += struct.pack('BBBB', r, g, b, a)
    idat = zlib.compress(raw)

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', ihdr)
    png += chunk(b'IDAT', idat)
    png += chunk(b'IEND', b'')
    return png

def draw_tetris_icon(size):
    """Draw a stylized Tetris block icon with Bryggen colors.
    A 3x3 block arrangement: T-piece or L-piece shape.
    """
    # Background: dark navy
    bg = (26, 26, 46, 255)
    pixels = [[bg] * size for _ in range(size)]

    margin = size // 6
    cell = (size - 2 * margin) // 3
    start = margin

    # Draw a T-shaped piece using Bryggen colors
    #   [ ][R][ ]
    #   [O][Y][W]
    colors = [
        (196, 148, 58, 255),   # ochre
        (245, 240, 232, 255),  # white
        (186, 59, 46, 255),    # red
        (232, 197, 71, 255),   # yellow
    ]

    # T-piece layout (row, col, color_index)
    blocks = [
        (0, 1, 2),  # red top-center
        (1, 0, 0),  # ochre left
        (1, 1, 3),  # yellow center
        (1, 2, 1),  # white right
    ]

    for br, bc, ci in blocks:
        x0 = start + bc * cell
        y0 = start + br * cell
        # Fill block
        for y in range(y0, y0 + cell):
            for x in range(x0, x0 + cell):
                if 0 <= x < size and 0 <= y < size:
                    # Subtle bevel
                    if x < x0 + 3 or y < y0 + 3:
                        # highlight
                        r, g, b = [min(255, c + 30) for c in colors[ci][:3]]
                        pixels[y][x] = (r, g, b, 255)
                    elif x >= x0 + cell - 3 or y >= y0 + cell - 3:
                        # shadow
                        r, g, b = [max(0, c - 30) for c in colors[ci][:3]]
                        pixels[y][x] = (r, g, b, 255)
                    else:
                        pixels[y][x] = colors[ci]

    return pixels

def main():
    out_dir = os.path.dirname(os.path.abspath(__file__))
    project_dir = os.path.join(out_dir, '..')

    for s in [192, 512]:
        pixels = draw_tetris_icon(s)
        png_data = create_png(s, s, pixels)
        path = os.path.join(project_dir, f'icon-{s}.png')
        with open(path, 'wb') as f:
            f.write(png_data)
        print(f'Created {path} ({len(png_data)} bytes)')

if __name__ == '__main__':
    main()
