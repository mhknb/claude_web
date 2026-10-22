#!/usr/bin/env python3
"""Niş Fikir Bulucu: ücretsiz veri toplama komutları.

Sadece Python standart kütüphanesi kullanır (Google Play komutları hariç:
onlar için `pip install google-play-scraper` gerekir). Çıktı her zaman JSON'dur.

Örnekler:
  python3 veri.py appstore-ara "diyet takip" --ulke tr
  python3 veri.py appstore-yorum 1234567890 --ulke tr --en-fazla-puan 3
  python3 veri.py play-ara "diet tracker" --ulke us --dil en
  python3 veri.py play-yorum com.ornek.uygulama --ulke us --dil en --en-fazla-puan 3
  python3 veri.py oneri google "diyetisyen" "diyet listesi" --dil tr --ulke tr
  python3 veri.py oneri appstore "diet" --ulke us
  python3 veri.py oneri youtube "meal prep" --dil en --ulke us
  python3 veri.py sayfa https://ornek.com/fiyatlar
"""
import argparse
import html
import json
import plistlib
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


# ---------- App Store ----------
def appstore_ara(a):
    q = urllib.parse.urlencode({"entity": "software", "term": a.terim, "country": a.ulke, "limit": min(max(a.limit, 1), 50)})
    d = get_json(f"https://itunes.apple.com/search?{q}")
    apps = []
    for x in d.get("results", []):
        apps.append({
            "id": x.get("trackId"),
            "ad": x.get("trackName"),
            "gelistirici": x.get("sellerName"),
            "puan": round(x["averageUserRating"], 2) if x.get("averageUserRating") else None,
            "degerlendirme_sayisi": x.get("userRatingCount", 0),
            "fiyat": x.get("formattedPrice"),
            "kategori": x.get("primaryGenreName"),
            "ilk_yayin": (x.get("releaseDate") or "")[:10],
            "son_guncelleme": (x.get("currentVersionReleaseDate") or "")[:10],
            "url": x.get("trackViewUrl"),
            "aciklama": clip(x.get("description"), 300),
        })
    guclu = [x for x in apps if (x["degerlendirme_sayisi"] or 0) >= 1000]
    return {
        "terim": a.terim,
        "ulke": a.ulke,
        "sonuc_sayisi": d.get("resultCount"),
        "doygunluk_sinyali": {
            "1000+_degerlendirmeli_uygulama": len(guclu),
            "ilk_10_toplam_degerlendirme": sum((x["degerlendirme_sayisi"] or 0) for x in apps[:10]),
            "yorum": "İlk 10'da 1000+ değerlendirmeli uygulama sayısı arttıkça bu kelimede rekabet artar.",
        },
        "uygulamalar": apps,
    }


def appstore_yorum(a):
    url = f"https://itunes.apple.com/{a.ulke}/rss/customerreviews/page=1/id={a.id}/sortby=mostrecent/json"
    d = get_json(url)
    entries = d.get("feed", {}).get("entry", [])
    if isinstance(entries, dict):
        entries = [entries]
    out = []
    for e in entries:
        if "im:rating" not in e:
            continue
        r = int(e["im:rating"]["label"])
        if a.en_fazla_puan and r > a.en_fazla_puan:
            continue
        out.append({"puan": r, "baslik": e.get("title", {}).get("label"), "metin": clip(e.get("content", {}).get("label"), 600), "tarih": (e.get("updated", {}).get("label") or "")[:10]})
    return {"id": a.id, "ulke": a.ulke, "adet": len(out), "yorumlar": out[:50]}


# ---------- Google Play (isteğe bağlı paket) ----------
def _gplay():
    try:
        import google_play_scraper  # noqa: F401
        return google_play_scraper
    except ImportError:
        raise RuntimeError("Google Play komutları için şu paketi kurun: pip install google-play-scraper")


def play_ara(a):
    g = _gplay()
    res = g.search(a.terim, lang=a.dil, country=a.ulke, n_hits=min(max(a.limit, 1), 30))
    apps = []
    for x in res[: a.limit]:
        item = {"id": x.get("appId"), "ad": x.get("title"), "gelistirici": x.get("developer"), "puan": x.get("score"), "fiyat": "Ücretsiz" if x.get("free") else x.get("price")}
        try:
            d = g.app(x["appId"], lang=a.dil, country=a.ulke)
            item.update({
                "indirme": d.get("installs"),
                "degerlendirme_sayisi": d.get("ratings"),
                "uygulama_ici_satin_alma": d.get("inAppProductPrice") or bool(d.get("offersIAP")),
                "kategori": d.get("genre"),
                "son_guncelleme": d.get("lastUpdatedOn"),
                "url": d.get("url"),
                "ozet": clip(d.get("summary"), 200),
            })
        except Exception as e:  # ayrıntı alınamazsa özetle devam
            item["not"] = f"ayrıntı alınamadı: {e}"
        apps.append(item)
    return {"terim": a.terim, "ulke": a.ulke, "uygulamalar": apps}


def play_yorum(a):
    g = _gplay()
    result, _ = g.reviews(a.id, lang=a.dil, country=a.ulke, sort=g.Sort.NEWEST, count=200)
    out = []
    for r in result:
        if a.en_fazla_puan and r["score"] > a.en_fazla_puan:
            continue
        out.append({"puan": r["score"], "metin": clip(r.get("content"), 600), "tarih": str(r.get("at"))[:10], "begeni": r.get("thumbsUpCount")})
    return {"id": a.id, "ulke": a.ulke, "adet": len(out), "yorumlar": out[:50]}


# ---------- Otomatik tamamlama önerileri ----------
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
            elif a.kaynak == "appstore":
                u = "https://search.itunes.apple.com/WebObjects/MZSearchHints.woa/wa/hints?" + urllib.parse.urlencode({"clientApplication": "Software", "term": q, "cc": a.ulke})
                body, _, _ = get(u)
                p = plistlib.loads(body)
                sonuc[q] = [h.get("term") for h in p.get("hints", []) if h.get("term")]
            else:  # play
                g = _gplay()
                sonuc[q] = g.suggest(q, lang=a.dil, country=a.ulke) if hasattr(g, "suggest") else {"hata": "Bu paket sürümünde öneri desteği yok"}
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
    p = argparse.ArgumentParser(description="Niş Fikir Bulucu veri komutları")
    sub = p.add_subparsers(dest="komut", required=True)

    s = sub.add_parser("appstore-ara"); s.add_argument("terim"); s.add_argument("--ulke", default="us"); s.add_argument("--limit", type=int, default=15); s.set_defaults(f=appstore_ara)
    s = sub.add_parser("appstore-yorum"); s.add_argument("id"); s.add_argument("--ulke", default="us"); s.add_argument("--en-fazla-puan", type=int, default=0); s.set_defaults(f=appstore_yorum)
    s = sub.add_parser("play-ara"); s.add_argument("terim"); s.add_argument("--ulke", default="us"); s.add_argument("--dil", default="en"); s.add_argument("--limit", type=int, default=8); s.set_defaults(f=play_ara)
    s = sub.add_parser("play-yorum"); s.add_argument("id"); s.add_argument("--ulke", default="us"); s.add_argument("--dil", default="en"); s.add_argument("--en-fazla-puan", type=int, default=0); s.set_defaults(f=play_yorum)
    s = sub.add_parser("oneri"); s.add_argument("kaynak", choices=["google", "youtube", "appstore", "play"]); s.add_argument("sorgular", nargs="+"); s.add_argument("--dil", default="en"); s.add_argument("--ulke", default="us"); s.set_defaults(f=oneri)
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
