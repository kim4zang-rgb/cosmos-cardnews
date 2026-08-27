#!/usr/bin/env python3
"""Find a CC-licensed background photo for a card news slide and prepare it for embedding.

Searches Openverse (no API key required) for openly-licensed images, downloads the
first candidate that is large enough, center-crops/resizes it to the target size
(mimicking CSS `background-size: cover`), and re-encodes it as JPEG under a size
budget so it can be embedded as base64 in a Design Component.

Usage:
    python fetch_bg_image.py --query "night sky stars galaxy" --out ../assets/cover-bg.jpg \
        --width 1080 --height 1920 --max-kb 70
"""
import argparse
import io
import json
import sys
import urllib.parse
import urllib.request

from PIL import Image

API_URL = "https://api.openverse.org/v1/images/"
USER_AGENT = "cosmos-cardnews-tool/1.0 (background image research)"


def search(query, page_size=20):
    params = {
        "q": query,
        "license_type": "commercial,modification",
        "mature": "false",
        "page_size": str(page_size),
    }
    url = API_URL + "?" + urllib.parse.urlencode(params)
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.load(resp)


def download(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return resp.read()


def cover_crop(img, target_w, target_h):
    src_w, src_h = img.size
    src_ratio = src_w / src_h
    target_ratio = target_w / target_h
    if src_ratio > target_ratio:
        new_h = src_h
        new_w = int(src_h * target_ratio)
    else:
        new_w = src_w
        new_h = int(src_w / target_ratio)
    left = (src_w - new_w) // 2
    top = (src_h - new_h) // 2
    cropped = img.crop((left, top, left + new_w, top + new_h))
    return cropped.resize((target_w, target_h), Image.LANCZOS)


def encode_under_budget(img, max_kb):
    rgb = img.convert("RGB")
    best = None
    for scale in (1.0, 0.85, 0.7):
        candidate_img = rgb if scale == 1.0 else rgb.resize(
            (max(1, int(rgb.width * scale)), max(1, int(rgb.height * scale))), Image.LANCZOS
        )
        for quality in range(85, 19, -5):
            buf = io.BytesIO()
            candidate_img.save(buf, format="JPEG", quality=quality, optimize=True)
            size_kb = buf.tell() / 1024
            best = (buf.getvalue(), quality, size_kb, candidate_img.size)
            if size_kb <= max_kb:
                return best
    return best


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--query", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--width", type=int, required=True)
    ap.add_argument("--height", type=int, required=True)
    ap.add_argument("--max-kb", type=int, default=70)
    ap.add_argument("--min-source-dim", type=int, default=1080)
    args = ap.parse_args()

    data = search(args.query)
    results = data.get("results", [])
    if not results:
        print(f"no results for query: {args.query}", file=sys.stderr)
        sys.exit(1)

    for candidate in results:
        img_url = candidate.get("url")
        if not img_url:
            continue
        license_slug = (candidate.get("license") or "").lower()
        if "nd" in license_slug.split("-"):
            print(f"skip (no-derivatives license, we crop/overlay every image): {candidate.get('id')}", file=sys.stderr)
            continue
        try:
            raw = download(img_url)
            img = Image.open(io.BytesIO(raw))
            img.load()
        except Exception as e:
            print(f"skip (download/open failed): {candidate.get('id')}: {e}", file=sys.stderr)
            continue

        if min(img.size) < args.min_source_dim:
            print(f"skip (too small {img.size}): {candidate.get('id')}", file=sys.stderr)
            continue

        cropped = cover_crop(img, args.width, args.height)
        encoded, quality, size_kb, out_dims = encode_under_budget(cropped, args.max_kb)

        with open(args.out, "wb") as f:
            f.write(encoded)

        attribution = {
            "title": candidate.get("title"),
            "creator": candidate.get("creator"),
            "creator_url": candidate.get("creator_url"),
            "license": candidate.get("license"),
            "license_version": candidate.get("license_version"),
            "license_url": candidate.get("license_url"),
            "foreign_landing_url": candidate.get("foreign_landing_url"),
            "provider": candidate.get("provider"),
            "source_image_url": img_url,
            "output_file": args.out,
            "output_size_kb": round(size_kb, 1),
            "jpeg_quality": quality,
            "canvas_dimensions": [args.width, args.height],
            "encoded_dimensions": list(out_dims),
        }
        print(json.dumps(attribution, ensure_ascii=False, indent=2))
        return

    print("no suitable candidate found (all too small or failed to download)", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
