#!/usr/bin/env python3
"""Find a free-to-use background photo for a card news slide and prepare it for embedding.

Searches one of several no-API-key-required sources for openly-licensed images,
downloads the first candidate that is large enough and not ND-licensed (we crop
and overlay every image, which counts as a derivative), center-crops/resizes it
to the target size (mimicking CSS `background-size: cover`), and re-encodes it
as JPEG under a size budget so it can be embedded as base64 in a Design Component.

Sources (--source):
    openverse (default) - aggregates Flickr, rawpixel, and others; broadest coverage
    wikimedia           - Wikimedia Commons; best for specific real people, places,
                           landmarks, and historical subjects
    nasa                - NASA Image and Video Library; public domain, space/science

Usage:
    python fetch_bg_image.py --query "night sky stars galaxy" --out ../assets/cover-bg.jpg \
        --width 1080 --height 1920 --max-kb 70
    python fetch_bg_image.py --source wikimedia --query "Sagrada Familia" --out cover-bg.jpg \
        --width 1080 --height 1350
    python fetch_bg_image.py --source nasa --query "Hubble nebula" --out cover-bg.jpg \
        --width 1080 --height 1350
"""
import argparse
import io
import json
import re
import sys
import urllib.parse
import urllib.request

from PIL import Image

OPENVERSE_API_URL = "https://api.openverse.org/v1/images/"
WIKIMEDIA_API_URL = "https://commons.wikimedia.org/w/api.php"
NASA_API_URL = "https://images-api.nasa.gov/search"
USER_AGENT = "cosmos-cardnews-tool/1.0 (background image research)"


def _get_json(url):
    req = urllib.request.Request(url, headers={"User-Agent": USER_AGENT, "Accept": "application/json"})
    with urllib.request.urlopen(req, timeout=20) as resp:
        return json.load(resp)


def is_nd_license(license_str):
    """True if the license forbids derivatives (we crop + overlay every image)."""
    s = (license_str or "").lower().replace("-", " ")
    return bool(re.search(r"\bnd\b", s))


def strip_html(s):
    return re.sub(r"<[^>]+>", "", s or "").strip()


def search_openverse(query, page_size=20):
    params = {
        "q": query,
        "license_type": "commercial,modification",
        "mature": "false",
        "page_size": str(page_size),
    }
    data = _get_json(OPENVERSE_API_URL + "?" + urllib.parse.urlencode(params))
    candidates = []
    for r in data.get("results", []):
        if not r.get("url"):
            continue
        candidates.append({
            "id": r.get("id"),
            "title": r.get("title"),
            "url": r.get("url"),
            "creator": r.get("creator"),
            "creator_url": r.get("creator_url"),
            "license": r.get("license"),
            "license_version": r.get("license_version"),
            "license_url": r.get("license_url"),
            "foreign_landing_url": r.get("foreign_landing_url"),
            "provider": r.get("provider") or "openverse",
        })
    return candidates


def search_wikimedia(query, page_size=20):
    search_params = {
        "action": "query", "list": "search", "srsearch": query,
        "srnamespace": "6", "srlimit": str(page_size), "format": "json",
    }
    data = _get_json(WIKIMEDIA_API_URL + "?" + urllib.parse.urlencode(search_params))
    titles = [item["title"] for item in data.get("query", {}).get("search", [])]
    if not titles:
        return []

    info_params = {
        "action": "query", "titles": "|".join(titles), "prop": "imageinfo",
        "iiprop": "url|size|extmetadata", "format": "json",
    }
    data2 = _get_json(WIKIMEDIA_API_URL + "?" + urllib.parse.urlencode(info_params))
    pages_by_title = {p.get("title"): p for p in data2.get("query", {}).get("pages", {}).values()}

    candidates = []
    for title in titles:
        page = pages_by_title.get(title)
        infos = page.get("imageinfo") if page else None
        if not infos:
            continue
        info = infos[0]
        meta = info.get("extmetadata", {})
        candidates.append({
            "id": title,
            "title": title.replace("File:", ""),
            "url": info.get("url"),
            "creator": strip_html(meta.get("Artist", {}).get("value")) or None,
            "creator_url": None,
            "license": meta.get("LicenseShortName", {}).get("value") or meta.get("License", {}).get("value"),
            "license_version": "",
            "license_url": meta.get("LicenseUrl", {}).get("value"),
            "foreign_landing_url": info.get("descriptionurl"),
            "provider": "wikimedia",
        })
    return candidates


def _resolve_nasa_asset_url(manifest_url):
    urls = _get_json(manifest_url)
    if not isinstance(urls, list) or not urls:
        return None
    for marker in ("~orig", "~large"):
        for u in urls:
            if marker in u:
                return u
    jpgs = [u for u in urls if u.lower().endswith((".jpg", ".jpeg", ".png"))]
    return (jpgs or urls)[-1]


def search_nasa(query, page_size=20):
    params = {"q": query, "media_type": "image"}
    data = _get_json(NASA_API_URL + "?" + urllib.parse.urlencode(params))
    items = data.get("collection", {}).get("items", [])[:page_size]
    candidates = []
    for item in items:
        meta_list = item.get("data") or []
        if not meta_list or not item.get("href"):
            continue
        meta = meta_list[0]
        nasa_id = meta.get("nasa_id")
        candidates.append({
            "id": nasa_id,
            "title": meta.get("title"),
            "manifest_url": item.get("href"),
            "creator": meta.get("photographer") or meta.get("secondary_creator") or "NASA",
            "creator_url": None,
            "license": "public domain (NASA)",
            "license_version": "",
            "license_url": "https://www.nasa.gov/nasa-brand-center/images-and-media/",
            "foreign_landing_url": f"https://images.nasa.gov/details-{nasa_id}" if nasa_id else None,
            "provider": "nasa",
        })
    return candidates


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


SOURCES = {
    "openverse": search_openverse,
    "wikimedia": search_wikimedia,
    "nasa": search_nasa,
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--source", choices=sorted(SOURCES), default="openverse")
    ap.add_argument("--query", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--width", type=int, required=True)
    ap.add_argument("--height", type=int, required=True)
    ap.add_argument("--max-kb", type=int, default=70)
    ap.add_argument("--min-source-dim", type=int, default=1080)
    args = ap.parse_args()

    results = SOURCES[args.source](args.query)
    if not results:
        print(f"no results for query: {args.query} (source: {args.source})", file=sys.stderr)
        sys.exit(1)

    for candidate in results:
        if is_nd_license(candidate.get("license")):
            print(f"skip (no-derivatives license, we crop/overlay every image): {candidate.get('id')}", file=sys.stderr)
            continue

        img_url = candidate.get("url")
        if not img_url and candidate.get("manifest_url"):
            try:
                img_url = _resolve_nasa_asset_url(candidate["manifest_url"])
            except Exception as e:
                print(f"skip (manifest resolve failed): {candidate.get('id')}: {e}", file=sys.stderr)
                continue
        if not img_url:
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
            "source": args.source,
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

    print("no suitable candidate found (all too small, ND-licensed, or failed to download)", file=sys.stderr)
    sys.exit(1)


if __name__ == "__main__":
    main()
