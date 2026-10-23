"""Download anime character portraits from AniList for the Anime Clash set.

Personal, non-commercial fan project only — images are (c) their creators.

Usage:  python3 scripts/fetch_anime_images.py [id ...]
Writes public/cards/anime/<id>.webp
"""
import io
import json
import sys
import time
import urllib.error
import urllib.request
from pathlib import Path

from PIL import Image

# card id -> (AniList search name, word that must appear in one of the character's series titles)
CHARACTERS = {
    # Jujutsu Kaisen
    "yuji": ("Yuuji Itadori", "Jujutsu"),
    "megumi": ("Megumi Fushiguro", "Jujutsu"),
    "nobara": ("Nobara Kugisaki", "Jujutsu"),
    "gojo": ("Satoru Gojou", "Jujutsu"),
    "sukuna": ("Ryoumen Sukuna", "Jujutsu"),
    "nanami": ("Kento Nanami", "Jujutsu"),
    # Attack on Titan
    "eren": ("Eren Yeager", "Shingeki"),
    "mikasa": ("Mikasa Ackerman", "Shingeki"),
    "armin": ("Armin Arlert", "Shingeki"),
    "levi": ("Levi", "Shingeki"),
    "erwin": ("Erwin Smith", "Shingeki"),
    "hange": ("Hange Zoe", "Shingeki"),
    # Oregairu
    "hachiman": ("Hachiman Hikigaya", "Seishun"),
    "yukino": ("Yukino Yukinoshita", "Seishun"),
    "yui-yuigahama": ("Yui Yuigahama", "Seishun"),
    "iroha": ("Iroha Isshiki", "Seishun"),
    # Love, Chunibyo & Other Delusions
    "rikka": ("Rikka Takanashi", "Chuunibyou"),
    "yuta": ("Yuuta Togashi", "Chuunibyou"),
    "shinka": ("Shinka Nibutani", "Chuunibyou"),
    "dekomori": ("Sanae Dekomori", "Chuunibyou"),
    # Horimiya
    "hori": ("Kyouko Hori", "Horimiya"),
    "miyamura": ("Izumi Miyamura", "Horimiya"),
    "ishikawa": ("Tooru Ishikawa", "Horimiya"),
    "yoshikawa": ("Yuki Yoshikawa", "Horimiya"),
    # Toradora!
    "taiga": ("Taiga Aisaka", "Toradora"),
    "ryuji": ("Ryuuji Takasu", "Toradora"),
    "ami": ("Ami Kawashima", "Toradora"),
    "minori": ("Minori Kushieda", "Toradora"),
    # Frieren
    "frieren": ("Frieren", "Frieren"),
    "fern": ("Fern", "Frieren"),
    "stark": ("Stark", "Frieren"),
    "himmel": ("Himmel", "Frieren"),
    "eisen": ("Eisen", "Frieren"),
    # My Dress-Up Darling
    "marin": ("Marin Kitagawa", "Bisque"),
    "wakana": ("Wakana Gojou", "Bisque"),
    "juju": ("Sajuna Inui", "Bisque"),
    # Anohana
    "jinta": ("Jinta Yadomi", "Ano Hi"),
    "menma": ("Meiko Honma", "Ano Hi"),
    "anaru": ("Naruko Anjou", "Ano Hi"),
    "yukiatsu": ("Atsumu Matsuyuki", "Ano Hi"),
    # Grand Blue
    "iori": ("Iori Kitahara", "Grand Blue"),
    "kohei": ("Kouhei Imamura", "Grand Blue"),
    "chisa": ("Chisa Kotegawa", "Grand Blue"),
    "kotobuki": ("Ryuujirou Kotobuki", "Grand Blue"),
    # Wotakoi
    "narumi": ("Narumi Momose", "Wotaku"),
    "hirotaka": ("Hirotaka Nifuji", "Wotaku"),
    "hanako": ("Hanako Koyanagi", "Wotaku"),
    "kabakura": ("Tarou Kabakura", "Wotaku"),
    # Silver Spoon
    "hachiken": ("Yuugo Hachiken", "Gin no Saji"),
    "aki": ("Aki Mikage", "Gin no Saji"),
    "komaba": ("Ichirou Komaba", "Gin no Saji"),
    "tamako": ("Tamako Inada", "Gin no Saji"),
}

OUT = Path(__file__).resolve().parent.parent / "public" / "cards" / "anime"
API = "https://graphql.anilist.co"
UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"
QUERY = """query($s:String){Page(perPage:10){characters(search:$s){id name{full}
  image{large} media(perPage:10){nodes{title{romaji english}}}}}}"""
# card art window is 92 x 108 (cqw); crop portraits to that from the top
SLOT_RATIO = 92 / 108


def post(query: str, variables: dict) -> dict:
    body = json.dumps({"query": query, "variables": variables}).encode()
    headers = {"Content-Type": "application/json", "Accept": "application/json", "User-Agent": UA}
    for attempt in range(5):
        try:
            with urllib.request.urlopen(urllib.request.Request(API, body, headers), timeout=60) as r:
                return json.load(r)
        except urllib.error.HTTPError as e:
            if e.code != 429 or attempt == 4:
                raise
            time.sleep(int(e.headers.get("Retry-After") or 30) + 1)  # rate limited: wait it out
    raise RuntimeError("unreachable")


def find_image(name: str, series: str) -> tuple[str, str]:
    chars = post(QUERY, {"s": name})["data"]["Page"]["characters"]
    for c in chars:
        titles = [t for n in c["media"]["nodes"] for t in (n["title"]["romaji"], n["title"]["english"]) if t]
        if any(series.lower() in t.lower() for t in titles):
            return c["name"]["full"], c["image"]["large"]
    raise RuntimeError(f"no '{series}' match for {name}: {[c['name']['full'] for c in chars]}")


def to_slot(img: Image.Image) -> Image.Image:
    img = img.convert("RGB")
    w, h = img.size
    ch = min(h, round(w / SLOT_RATIO))
    return img.crop((0, 0, w, ch))


def main(ids: list[str]) -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    failed = []
    for cid in ids or CHARACTERS:
        name, series = CHARACTERS[cid]
        try:
            found, url = find_image(name, series)
            req = urllib.request.Request(url, headers={"User-Agent": UA})
            with urllib.request.urlopen(req, timeout=60) as r:
                img = Image.open(io.BytesIO(r.read()))
            to_slot(img).save(OUT / f"{cid}.webp", "WEBP", quality=90)
            print(f"ok   {cid:14} {found:24} {url}")
        except Exception as e:  # keep going; report at the end
            failed.append(cid)
            print(f"FAIL {cid:14} {e}")
        time.sleep(2.1)  # AniList allows ~30 requests a minute
    if failed:
        sys.exit(f"failed: {', '.join(failed)}")


if __name__ == "__main__":
    main(sys.argv[1:])
