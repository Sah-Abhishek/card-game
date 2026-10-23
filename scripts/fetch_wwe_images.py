"""Download official WWE.com promo cutouts and crop them to the card photo slot.

Personal, non-commercial fan project only — images are (c) WWE.

Usage:  python3 scripts/fetch_wwe_images.py [id ...]
Writes public/cards/wwe/<id>.webp (690x810, transparent background).
"""
import io
import re
import sys
import urllib.request
from pathlib import Path

from PIL import Image

# card id -> wwe.com/superstars/<slug>
SLUGS = {
    "the-rock": "the-rock",
    "undertaker": "undertaker",
    "stone-cold": "stone-cold-steve-austin",
    "john-cena": "john-cena",
    "shawn-michaels": "shawn-michaels",
    "rey-mysterio": "reymysterio",
    "triple-h": "triple-h",
    "kane": "kane",
    "randy-orton": "randy-orton",
    "edge": "edge",
    "batista": "batista",
    "roman-reigns": "roman-reigns",
    "seth-rollins": "seth-rollins",
    "cm-punk": "cmpunk",
    "brock-lesnar": "brock-lesnar",
    "cody-rhodes": "cody-rhodes",
    "bret-hart": "brethart",
    "hulk-hogan": "hulkhogan",
    "ric-flair": "ricflair",
    "randy-savage": "randysavage",
    "andre-the-giant": "andrethegiant",
    "eddie-guerrero": "eddieguerrero",
    "mick-foley": "mick-foley",
    "kurt-angle": "kurt-angle",
    "aj-styles": "aj-styles",
    "becky-lynch": "becky-lynch",
    "rhea-ripley": "rhea-ripley",
    "charlotte-flair": "charlotte-flair",
    "trish-stratus": "trish-stratus",
    "bianca-belair": "bianca-belair",
    # trump-card set (52 cards = the 30 above + these)
    "big-show": "big-show",
    "great-khali": "the-great-khali",
    "mark-henry": "mark-henry",
    "goldberg": "goldberg",
    "bobby-lashley": "bobby-lashley",
    "drew-mcintyre": "drew-mcintyre",
    "braun-strowman": "braun-strowman",
    "sheamus": "sheamus",
    "kevin-owens": "kevin-owens",
    "sami-zayn": "sami-zayn",
    "gunther": "gunther",
    "finn-balor": "finn-balor",
    "the-miz": "the-miz",
    "jinder-mahal": "jinder-mahal",
    "ultimate-warrior": "ultimatewarrior",
    "daniel-bryan": "daniel-bryan",
    "jey-uso": "jey-uso",
    "solo-sikoa": "solo-sikoa",
    "la-knight": "la-knight",
    "bron-breakker": "bron-breakker",
    "damian-priest": "damian-priest",
    "rob-van-dam": "rob-van-dam",
}

UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
OUT = Path(__file__).resolve().parent.parent / "public" / "cards" / "wwe"
SLOT_W, SLOT_H = 690, 810
# promos featuring other talent that appear on every superstar page
NOISE = re.compile(r"HarlemLewis|Kelani|LivTitle", re.I)


def get(url: str, timeout: int = 60) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.read()


def find_image(slug: str) -> tuple[str, str]:
    html = get(f"https://www.wwe.com/superstars/{slug}").decode("utf-8", "ignore")
    profiles = [
        m for m in re.findall(r'/f/styles/talent_champion_lg/public/[^"\' ]+?\.png', html)
        if re.search(r"profile|_pro", m, re.I) and not NOISE.search(m)
    ]
    if profiles:
        return "profile", "https://www.wwe.com" + profiles[0]
    stats = [
        m for m in re.findall(r'/f/styles/gallery_img_s/public/([^"\' ]+?stat[^"\' ]*?\.png)', html, re.I)
        if not NOISE.search(m)
    ]
    if stats:
        # the unstyled original is much larger than the gallery thumbnail
        return "stat", "https://www.wwe.com/f/" + stats[0]
    raise RuntimeError(f"no promo image found for {slug}")


def to_slot(img: Image.Image, kind: str) -> Image.Image:
    img = img.convert("RGBA")
    l, t, r, b = img.getbbox()
    if kind == "stat":
        # full-body render: keep head to waist
        b = t + int((b - t) * 0.42)
    pad = 30
    l, r = max(0, l - pad), min(img.width, r + pad)
    w = r - l
    h = round(w * SLOT_H / SLOT_W)
    top = b - h  # anchor the subject to the bottom; pad above when needed
    piece = img.crop((l, max(0, top), r, b))
    canvas = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    canvas.paste(piece, (0, h - piece.height), piece)
    return canvas.resize((SLOT_W, SLOT_H), Image.LANCZOS)


def main(ids: list[str]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    failed = []
    for cid in ids or SLUGS:
        try:
            kind, url = find_image(SLUGS[cid])
            img = Image.open(io.BytesIO(get(url)))
            to_slot(img, kind).save(OUT / f"{cid}.webp", "WEBP", quality=86)
            print(f"ok   {cid:16} {kind:8} {url}")
        except Exception as e:  # keep going; report at the end
            failed.append(cid)
            print(f"FAIL {cid:16} {e}")
    if failed:
        sys.exit(f"failed: {', '.join(failed)}")


if __name__ == "__main__":
    main(sys.argv[1:])
