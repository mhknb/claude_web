#!/usr/bin/env python3
"""Kitap Nişi Bulucu: ücretsiz veri toplama komutları (sadece Python standart kütüphanesi). Çıktı JSON'dur.

Örnekler:
  python3 veri.py amazon-oneri "caregiver log" "dementia care" --pazar us
  python3 veri.py openlibrary "caregiver handbook" --limit 20
  python3 veri.py google-kitap "bakım veren rehberi" --dil tr
  python3 veri.py oneri google "evde yaşlı bakımı" --dil tr --ulke tr
  python3 veri.py oneri youtube "dementia caregiver tips" --dil en --ulke us
  python3 veri.py sayfa https://www.amazon.com/dp/XXXXXXXXXX

Amazon arama sonuçları ve ürün sayfaları (satış sıralaması) bu komutlarla değil, ajanın sayfa okuma
aracıyla okunmalıdır; Amazon otomatik istekleri sık engeller.
"""
import argparse
import html
import json
import re
import sys
import urllib.parse
import urllib.request

UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36"


def get(url, timeout=20):
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept-Language": "tr,en;q=0.8"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        charset = r.headers.get_content_charset() or "utf-8"
        return r.read(), charset, r.headers.get("Content-Type", "")


def get_json(url):
    body, charset, _ = get(url)
    return json.loads(body.decode(charset, errors="replace"))


def clip(s, n):
    return s if not isinstance(s, str) or len(s) <= n else s[:n] + "…"



# ---------- Amazon kitap arama önerileri ----------
PAZAR = {
    "us": ("https://completion.amazon.com", "ATVPDKIKX0DER"),
    "uk": ("https://completion.amazon.co.uk", "A1F83G8C2ARO7P"),
    "ca": ("https://completion.amazon.ca", "A2EUQ1WTGCTBG2"),
    "de": ("https://completion.amazon.de", "A1PA6795UKMFR9"),
}


def amazon_oneri(a):
    host, mid = PAZAR[a.pazar]
    sonuc = {}
    for q in a.sorgular[:15]:
        try:
            u = f"{host}/api/2017/suggestions?" + urllib.parse.urlencode({"limit": 11, "prefix": q, "alias": "stripbooks", "mid": mid, "site-variant": "desktop", "client-info": "amazon-search-ui"})
            d = get_json(u)
            sonuc[q] = [s.get("value") for s in d.get("suggestions", []) if s.get("value")]
        except Exception as e:
            sonuc[q] = {"hata": str(e)}
    return {"pazar": a.pazar, "oneriler": sonuc,
            "not": "Amazon'da insanların gerçekten aradığı ifadeler. Arama hacmi değildir; listede çıkması talebin işaretidir."}


# ---------- Open Library ----------
def openlibrary(a):
    q = urllib.parse.urlencode({"q": a.terim, "limit": min(max(a.limit, 1), 50), "fields": "title,author_name,first_publish_year,edition_count,number_of_pages_median,ratings_average,ratings_count,language,key"})
    d = get_json(f"https://openlibrary.org/search.json?{q}")
    docs = d.get("docs", [])
    years = [x.get("first_publish_year") for x in docs if x.get("first_publish_year")]
    return {
        "terim": a.terim,
        "toplam_sonuc": d.get("numFound"),
        "son_5_yilda_yayinlanan": sum(1 for y in years if y >= 2021),
        "kitaplar": [{"baslik": x.get("title"), "yazar": ", ".join(x.get("author_name", [])[:2]), "ilk_yayin": x.get("first_publish_year"),
                      "baski_sayisi": x.get("edition_count"), "sayfa": x.get("number_of_pages_median"),
                      "puan": round(x["ratings_average"], 2) if x.get("ratings_average") else None, "puan_sayisi": x.get("ratings_count"),
                      "url": f"https://openlibrary.org{x['key']}" if x.get("key") else None} for x in docs],
        "not": "Open Library tüm kitapları kapsamaz; rekabetin büyüklüğü ve konunun yaşı için kaba bir sinyaldir.",
    }


# ---------- Google Books (kota sınırlı olabilir) ----------
def google_kitap(a):
    params = {"q": a.terim, "maxResults": 20, "printType": "books"}
    if a.dil:
        params["langRestrict"] = a.dil
    d = get_json("https://www.googleapis.com/books/v1/volumes?" + urllib.parse.urlencode(params))
    items = []
    for it in d.get("items", []):
        v = it.get("volumeInfo", {})
        items.append({"baslik": v.get("title"), "alt_baslik": v.get("subtitle"), "yazar": ", ".join(v.get("authors", [])[:2]), "yayinevi": v.get("publisher"),
                      "tarih": v.get("publishedDate"), "sayfa": v.get("pageCount"), "puan": v.get("averageRating"), "puan_sayisi": v.get("ratingsCount"),
                      "kategoriler": v.get("categories"), "url": v.get("infoLink")})
    return {"terim": a.terim, "toplam_sonuc": d.get("totalItems"), "kitaplar": items}


def oneri(a):
    sonuc = {}
    for q in a.sorgular[:15]:
        try:
            if a.kaynak == "google":
                u = "https://suggestqueries.google.com/complete/search?" + urllib.parse.urlencode({"client": "firefox", "hl": a.dil, "gl": a.ulke, "q": q})
                sonuc[q] = get_json(u)[1]
            elif a.kaynak == "youtube":
                u = "https://suggestqueries.google.com/complete/search?" + urllib.parse.urlencode({"client": "firefox", "ds": "yt", "hl": a.dil, "gl": a.ulke, "q": q})
                sonuc[q] = get_json(u)[1]
        except Exception as e:
            sonuc[q] = {"hata": str(e)}
    return {"kaynak": a.kaynak, "dil": a.dil, "ulke": a.ulke, "oneriler": sonuc,
            "not": "Öneri listesinde çıkan ifadeler insanların gerçekten aradığı ifadelerdir; sıralama yaklaşık popülerliği yansıtır, arama hacmi değildir."}



# ---------- Sayfa okuma ----------
def sayfa(a):
    if not re.match(r"^https?://", a.url, re.I):
        raise RuntimeError("Adres http veya https ile başlamalı")
    body, charset, ctype = get(a.url, timeout=30)
    text = body.decode(charset, errors="replace")
    title = ""
    if "html" in ctype:
        m = re.search(r"<title[^>]*>(.*?)</title>", text, re.I | re.S)
        title = html.unescape(m.group(1).strip()) if m else ""
        text = re.sub(r"<(script|style|noscript|svg|nav|footer|header)[^>]*>.*?</\1>", " ", text, flags=re.I | re.S)
        text = re.sub(r"<br\s*/?>|</(p|div|li|h[1-6]|tr)>", "\n", text, flags=re.I)
        text = html.unescape(re.sub(r"<[^>]+>", " ", text))
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n\s*\n+", "\n", text).strip()
    return {"url": a.url, "baslik": title, "metin": text[: a.karakter]}


def main():
    p = argparse.ArgumentParser(description="Kitap Nişi Bulucu veri komutları")
    sub = p.add_subparsers(dest="komut", required=True)
    s = sub.add_parser("amazon-oneri"); s.add_argument("sorgular", nargs="+"); s.add_argument("--pazar", choices=sorted(PAZAR), default="us"); s.set_defaults(f=amazon_oneri)
    s = sub.add_parser("openlibrary"); s.add_argument("terim"); s.add_argument("--limit", type=int, default=20); s.set_defaults(f=openlibrary)
    s = sub.add_parser("google-kitap"); s.add_argument("terim"); s.add_argument("--dil", default=""); s.set_defaults(f=google_kitap)
    s = sub.add_parser("oneri"); s.add_argument("kaynak", choices=["google", "youtube"]); s.add_argument("sorgular", nargs="+"); s.add_argument("--dil", default="en"); s.add_argument("--ulke", default="us"); s.set_defaults(f=oneri)
    s = sub.add_parser("sayfa"); s.add_argument("url"); s.add_argument("--karakter", type=int, default=12000); s.set_defaults(f=sayfa)
    a = p.parse_args()
    try:
        out = a.f(a)
        code = 0
    except Exception as e:
        out = {"hata": str(e), "komut": a.komut}
        code = 1
    json.dump(out, sys.stdout, ensure_ascii=False, indent=1)
    print()
    sys.exit(code)


if __name__ == "__main__":
    main()
