#!/usr/bin/env python3
"""Swap one slide's background image for a user-supplied local file.

Use this when the auto-sourced photo for a slide is wrong or unusable
(license risk, wrong subject, distracting text/logo) and you have your own
legally-usable replacement (a company logo, a photo you took, a purchased
stock image, etc). It crops/encodes the image the same way fetch_bg_image.py
does, drops it into assets/<slot>-bg.jpg, and updates the PHOTO credit line
in the matching .dc.html.

This only touches the local run folder. After running it, you still need to:
  1. re-run seed-canvas.mjs to rebuild the published canvas file
  2. republish it via the Artifact tool (same URL, to update in place)
  3. re-run tools/export_cardnews.mjs to refresh output/<run>/*.png

Usage:
    python tools/replace_image.py --dir runs/2026-08-31-brand --slot point4 \
        --image "C:\\Users\\me\\Downloads\\musinsa-logo.jpg" --credit "무신사 제공"

    python tools/replace_image.py --dir runs/2026-08-31-brand --slot cover \
        --image street-photo.jpg --credit "본인 촬영"

    python tools/replace_image.py --dir runs/2026-08-31-brand --slot point2 \
        --image logo.png --fit contain --no-credit

--fit cover (default) fills the frame and crops overflow, matching every
other background image in this pipeline - best for photos.
--fit contain letterboxes the image (no cropping) onto a solid background -
best for logos or anything where cropping would cut off the subject.

--credit sets the "PHOTO — ..." line text (e.g. a company name or "본인 촬영").
--no-credit removes the photo-credit line entirely (use when no attribution
applies, e.g. you own the image outright). One of the two is required.
"""
import argparse
import os
import re
import sys
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fetch_bg_image import cover_crop, encode_under_budget  # noqa: E402

from PIL import Image

# slot -> (dc.html filename, asset filename, is a dark-background template)
SLOTS = {
    "cover": ("Main.dc.html", "cover-bg.jpg", True),
    "point1": ("Point1.dc.html", "point1-bg.jpg", False),
    "point2": ("Point2.dc.html", "point2-bg.jpg", False),
    "point3": ("Point3.dc.html", "point3-bg.jpg", False),
    "point4": ("Point4.dc.html", "point4-bg.jpg", False),
    "point5": ("Point5.dc.html", "point5-bg.jpg", False),
    "point6": ("Point6.dc.html", "point6-bg.jpg", False),
    "stat": ("Stat.dc.html", "stat-bg.jpg", True),
    "closing": ("Closing.dc.html", "closing-bg.jpg", True),
}

DARK_PAD = "#111010"
LIGHT_PAD = "#f4f3f1"


def hex_to_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def contain_fit(img, target_w, target_h, pad_rgb):
    src_w, src_h = img.size
    scale = min(target_w / src_w, target_h / src_h)
    new_w, new_h = max(1, int(src_w * scale)), max(1, int(src_h * scale))
    resized = img.resize((new_w, new_h), Image.LANCZOS)
    canvas = Image.new("RGB", (target_w, target_h), pad_rgb)
    canvas.paste(resized, ((target_w - new_w) // 2, (target_h - new_h) // 2))
    return canvas


def main():
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dir", required=True, help="run folder, e.g. runs/2026-08-31-brand")
    ap.add_argument("--slot", required=True, choices=sorted(SLOTS))
    ap.add_argument("--image", required=True, help="path to your replacement image file")
    ap.add_argument("--credit", help='new credit text, e.g. "무신사 제공" or "본인 촬영"')
    ap.add_argument("--no-credit", action="store_true", help="remove the photo-credit line entirely")
    ap.add_argument("--fit", choices=["cover", "contain"], default="cover",
                     help="cover = fill+crop (default, matches other slides); contain = letterbox, no cropping (good for logos)")
    ap.add_argument("--pad-color", help="hex color for contain-fit letterbox background (default: matches the slide's own background)")
    ap.add_argument("--width", type=int, default=1080)
    ap.add_argument("--height", type=int, default=1350)
    ap.add_argument("--max-kb", type=float, default=70)
    args = ap.parse_args()

    if not args.credit and not args.no_credit:
        print("error: pass --credit \"...\" or --no-credit", file=sys.stderr)
        sys.exit(1)
    if args.credit and args.no_credit:
        print("error: pass either --credit or --no-credit, not both", file=sys.stderr)
        sys.exit(1)
    if not os.path.isfile(args.image):
        print(f"error: {args.image} not found", file=sys.stderr)
        sys.exit(1)

    dc_name, img_name, is_dark = SLOTS[args.slot]
    run_dir = Path(args.dir)
    dc_path = run_dir / dc_name
    img_path = run_dir / "assets" / img_name

    if not dc_path.exists():
        print(f"error: {dc_path} not found (wrong --dir or --slot?)", file=sys.stderr)
        sys.exit(1)

    src = Image.open(args.image)
    if src.mode in ("RGBA", "P", "LA"):
        # flatten transparency onto the slide's own background color
        pad_hex = args.pad_color or (DARK_PAD if is_dark else LIGHT_PAD)
        bg = Image.new("RGB", src.size, hex_to_rgb(pad_hex))
        rgba = src.convert("RGBA")
        bg.paste(rgba, mask=rgba.split()[-1])
        src = bg
    else:
        src = src.convert("RGB")

    if args.fit == "cover":
        processed = cover_crop(src, args.width, args.height)
    else:
        pad_hex = args.pad_color or (DARK_PAD if is_dark else LIGHT_PAD)
        processed = contain_fit(src, args.width, args.height, hex_to_rgb(pad_hex))

    encoded, quality, size_kb, out_dims = encode_under_budget(processed, args.max_kb)
    img_path.parent.mkdir(parents=True, exist_ok=True)
    with open(img_path, "wb") as f:
        f.write(encoded)

    html = dc_path.read_text(encoding="utf-8")
    if args.no_credit:
        new_html, n = re.subn(
            r'[ \t]*<!-- photo credit -->\n[ \t]*<div[^>]*>\n[ \t]*PHOTO — [^\n]*\n[ \t]*</div>\n\n?',
            '',
            html,
        )
        if n == 0:
            print(f"warning: no photo-credit block found in {dc_path} (nothing removed)", file=sys.stderr)
        html = new_html
    else:
        new_html, n = re.subn(r'(PHOTO — )[^\n<]*', lambda m: m.group(1) + args.credit, html)
        if n == 0:
            print(f"warning: no \"PHOTO — \" line found in {dc_path} (credit not set)", file=sys.stderr)
        html = new_html
    dc_path.write_text(html, encoding="utf-8")

    print(f"ok: wrote {img_path} ({size_kb:.1f} KB, quality {quality}, {out_dims[0]}x{out_dims[1]}, fit={args.fit})")
    print(f"ok: {dc_path} credit " + ("removed" if args.no_credit else f'set to "{args.credit}"'))
    print("next: re-seed the canvas, republish the Artifact, and re-run tools/export_cardnews.mjs")


if __name__ == "__main__":
    main()
