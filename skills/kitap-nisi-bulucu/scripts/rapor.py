#!/usr/bin/env python3
"""Kitap Nişi Bulucu: rapor verisini kontrol eder, puanı ve kitap başı kazancı hesaplar, HTML rapor üretir.

Kullanım:
  python3 rapor.py veri.json                # veri.html üretir
  python3 rapor.py veri.json -o rapor.html
  python3 rapor.py veri.json --kontrol      # sadece kontrol ve puan

veri.json, assets/semalar/ altındaki kesif.json veya dogrulama.json şemasına uymalıdır.
"""
import argparse
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MISSING = "Veri bulunamadı"

# 7 bileşen, her biri 0-10 (yüksek iyi). Ağırlıklar toplamı 100.
COMPONENTS = [
    ("demand", "Talep", 20),
    ("competition_gap", "Rekabet boşluğu", 20),
    ("ai_resilience", "Yapay zekaya dayanıklılık", 15),
    ("author_fit", "Yazar uyumu ve güvenilirlik", 15),
    ("earning", "Kazanç gücü", 10),
    ("evergreen", "Kalıcılık", 10),
    ("reachability", "Okura ulaşılabilirlik", 10),
]
LABELS = {k: l for k, l, _ in COMPONENTS}
CORE = ("demand", "competition_gap", "ai_resilience", "earning")
VERDICTS = [(75, "strong", "Güçlü: yazın"), (55, "promising", "Umut verici: önce test edin"), (35, "weak", "Zayıf: açıyı değiştirin"), (0, "drop", "Bırakın")]


def score_book(scores, policy_risk, ymyl):
    """Ağırlıklı toplam + kapılar (sadece güveni orta/yüksek bileşenlerde). Temel bileşenlerde güven düşükse 'Belirsiz'."""
    def s(k):
        try:
            return max(0.0, min(10.0, float((scores or {}).get(k, {}).get("score", 0))))
        except (TypeError, ValueError):
            return 0.0

    def low(k):
        return ((scores or {}).get(k, {}) or {}).get("confidence") == "düşük"

    raw = jround(sum(s(k) / 10 * w for k, _, w in COMPONENTS), 1)
    caps = []
    if s("demand") <= 3 and not low("demand"):
        caps.append((54, "Talep çok zayıf"))
    if s("competition_gap") <= 2 and not low("competition_gap"):
        caps.append((54, "Rakip kitapların bıraktığı boşluk yok"))
    if s("ai_resilience") <= 2 and not low("ai_resilience"):
        caps.append((54, "Yapay zeka bu bilgiyi bedava ve yeterince iyi veriyor"))
    if ymyl and s("author_fit") <= 4 and not low("author_fit"):
        caps.append((54, "Sağlık, hukuk veya finans konusunda yazarın yeterli uzmanlığı yok"))
    if policy_risk == "yüksek":
        caps.append((54, "Yayın politikası veya yasal risk yüksek"))
    if any(s(k) <= 1 and not low(k) for k, _, _ in COMPONENTS):
        caps.append((34, "En az bir bileşende ölümcül zayıflık var"))
    cap = min([c for c, _ in caps], default=100)
    total = min(raw, cap)
    v = next(v for v in VERDICTS if total >= v[0])
    out = {"raw": raw, "total": total, "capped": total < raw, "caps": [{"cap": c, "reason": r} for c, r in caps],
           "verdict": v[1], "verdict_label": v[2], "low_confidence": [LABELS[k] for k, _, _ in COMPONENTS if low(k)]}
    if low("demand") or sum(low(k) for k in CORE) >= 2:
        out.update({"likely_verdict_label": v[2], "verdict": "uncertain", "verdict_label": "Belirsiz: önce test edin"})
    return out


def default_for(schema):
    if "const" in schema:
        return schema["const"]
    if "enum" in schema:
        return "orta" if "orta" in schema["enum"] else schema["enum"][0]
    t = schema.get("type")
    if t == "object":
        return conform(schema, {}, "", [])
    return {"array": [], "integer": 0, "number": 0, "boolean": False}.get(t, MISSING)


def conform(schema, value, path, errors):
    """value'yu şemaya uydurur; sorunları errors listesine ekler. Şemada olmayan ek alanlar korunur."""
    at = path or "kök"
    if "const" in schema:
        if value != schema["const"]:
            errors.append(f"{at}: '{schema['const']}' olmalı")
        return schema["const"]
    if "enum" in schema:
        if value in schema["enum"]:
            return value
        if isinstance(value, str):
            for e in schema["enum"]:
                if e.casefold() == value.strip().casefold():
                    return e
        errors.append(f"{at}: '{value}' geçersiz; şunlardan biri olmalı: {', '.join(schema['enum'])}")
        return default_for(schema)
    t = schema.get("type")
    if t == "object":
        if not isinstance(value, dict):
            if value is not None:
                errors.append(f"{at}: nesne olmalı")
            value = {}
        out = dict(value)
        required = set(schema.get("required", []))
        for k, sub in schema.get("properties", {}).items():
            p = f"{path}.{k}" if path else k
            if value.get(k) is None:
                if k in required:
                    errors.append(f"{p}: eksik")
                    out[k] = default_for(sub)
                else:
                    out.pop(k, None)
            else:
                out[k] = conform(sub, value[k], p, errors)
        return out
    if t == "array":
        if not isinstance(value, list):
            errors.append(f"{at}: liste olmalı")
            return [] if value is None else [conform(schema.get("items", {}), value, f"{at}[0]", errors)]
        items = schema.get("items")
        return [conform(items, v, f"{at}[{i}]", errors) for i, v in enumerate(value)] if items else value
    if t in ("integer", "number"):
        try:
            n = float(value)
        except (TypeError, ValueError):
            errors.append(f"{at}: sayı olmalı")
            return 0
        return int(round(n)) if t == "integer" else n
    if t == "boolean":
        if isinstance(value, bool):
            return value
        if str(value).lower() in ("true", "evet"):
            return True
        if str(value).lower() in ("false", "hayır", "hayir"):
            return False
        errors.append(f"{at}: true/false olmalı")
        return False
    if t == "string":
        if isinstance(value, str):
            return value
        if isinstance(value, (int, float, bool)):
            return str(value)
        errors.append(f"{at}: metin olmalı")
        return json.dumps(value, ensure_ascii=False)
    return value


def jround(x, nd=0):
    """Tarayıcıdaki Math.round ile aynı yuvarlama (yarımlar yukarı); iki hesap birebir aynı sonucu versin diye."""
    f = 10 ** nd
    v = math.floor(x * f + 0.5) / f
    return int(v) if nd == 0 else v


def _total(items):
    t = 0.0
    for it in items or []:
        try:
            t += float(it.get("tutar", 0) if isinstance(it, dict) else it)
        except (TypeError, ValueError):
            pass
    return t


def earnings(k):
    """Kopya başı net kazanç (format payına göre ağırlıklı), başa baş adedi ve aylık senaryolar."""
    formats = []
    for f in k.get("formatlar") or []:
        try:
            price = float(f.get("liste_fiyati") or 0)
            rate = float(f.get("telif_orani") or 0)
            net = price * rate - float(f.get("baski_maliyeti") or 0) - _total(f.get("kesintiler"))
        except (TypeError, ValueError):
            net = 0.0
        formats.append({"format": f.get("format"), "platform": f.get("platform"), "net": net, "pay": float(f.get("pay") or 0)})
    share = sum(x["pay"] for x in formats)
    if formats and share <= 0:
        for x in formats:
            x["pay"] = 1 / len(formats)
        share = 1.0
    weighted = sum(x["net"] * x["pay"] for x in formats) / share if share else 0.0
    startup = _total(k.get("baslangic"))
    shown = [dict(x, net=jround(x["net"], 2)) for x in formats]
    out = {"formatlar": shown, "kopya_basi_net": jround(weighted, 2), "baslangic_toplam": jround(startup, 2), "uyarilar": []}
    out["basa_bas_adet"] = math.ceil(startup / weighted) if weighted > 0 else None
    if k.get("hedef_aylik_gelir") and weighted > 0:
        out["hedef_icin_aylik_adet"] = math.ceil(float(k["hedef_aylik_gelir"]) / weighted)
    rows = []
    for s in k.get("aylik_satis_senaryolari") or []:
        n = float(s.get("adet") or 0)
        monthly = n * weighted
        payback = math.ceil(startup / monthly) if monthly > 0 else None
        rows.append({"senaryo": s.get("senaryo"), "aylik_adet": n, "aylik_gelir": jround(monthly), "yillik_gelir": jround(monthly * 12),
                     "ilk_yil_net": jround(monthly * 12 - startup), "geri_odeme_ayi": payback})
    out["senaryolar"] = rows
    if any(x["net"] <= 0 for x in formats):
        out["uyarilar"].append("En az bir formatta kopya başı kazanç sıfır veya negatif.")
    if weighted > 0 and weighted < 1.5 and k.get("para_birimi", "$") in ("$", "USD", "€", "£"):
        out["uyarilar"].append("Kopya başı kazanç çok düşük; anlamlı gelir için çok yüksek satış adedi gerekir.")
    return out


def add_scores(data):
    if data["tur"] == "kesif":
        for c in data["candidates"]:
            c["score"] = score_book(c.get("scores"), c.get("policy_risk"), c.get("ymyl"))
        data["candidates"].sort(key=lambda c: -c["score"]["total"])
    else:
        data["score"] = score_book(data.get("scores"), data.get("policy_risk"), data.get("ymyl"))
        if isinstance(data.get("kazanc"), dict):
            data["kazanc_hesap"] = earnings(data["kazanc"])
    return data


def main():
    ap = argparse.ArgumentParser(description="Kitap rapor verisini kontrol et ve HTML rapor üret")
    ap.add_argument("veri")
    ap.add_argument("-o", "--cikti")
    ap.add_argument("--kontrol", action="store_true")
    a = ap.parse_args()
    with open(a.veri, encoding="utf-8") as f:
        data = json.load(f)
    tur = data.get("tur")
    if tur not in ("kesif", "dogrulama"):
        print(json.dumps({"hata": "'tur' alanı kesif veya dogrulama olmalı"}, ensure_ascii=False))
        sys.exit(1)
    with open(os.path.join(ROOT, "assets", "semalar", f"{tur}.json"), encoding="utf-8") as f:
        schema = json.load(f)
    errors = []
    data = add_scores(conform(schema, data, "", errors))
    summary = {"tur": tur, "eksik_veya_hatali_alanlar": errors[:60], "eksik_sayisi": len(errors)}
    if tur == "dogrulama":
        summary["puan"] = data["score"]
        if data.get("kazanc_hesap"):
            h = data["kazanc_hesap"]
            summary["kazanc"] = {k: h.get(k) for k in ("kopya_basi_net", "basa_bas_adet", "hedef_icin_aylik_adet", "senaryolar", "uyarilar")}
        else:
            summary["uyari"] = "kazanc alanı yok; raporda sayısal kazanç hesabı olmayacak."
    else:
        summary["puanlar"] = [{"nis": c.get("niche"), "baslik": c.get("working_title"), "puan": c["score"]["total"], "karar": c["score"]["verdict_label"]} for c in data["candidates"]]
    if not a.kontrol:
        with open(os.path.join(ROOT, "assets", "rapor-sablonu.html"), encoding="utf-8") as f:
            tpl = f.read()
        marker = "/*RAPOR_VERISI*/null"
        if marker not in tpl:
            print(json.dumps({"hata": "Şablonda veri işareti bulunamadı"}, ensure_ascii=False))
            sys.exit(1)
        page = tpl.replace(marker, json.dumps(data, ensure_ascii=False).replace("</", "<\\/"), 1)
        title = (data.get("meta") or {}).get("baslik") or "Kitap Nişi Raporu"
        page = page.replace("<title>Kitap Nişi Raporu</title>", f"<title>{title.replace('<', '').replace('>', '')}</title>", 1)
        out = a.cikti or os.path.splitext(a.veri)[0] + ".html"
        with open(out, "w", encoding="utf-8") as f:
            f.write(page)
        summary["html"] = os.path.abspath(out)
    print(json.dumps(summary, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
