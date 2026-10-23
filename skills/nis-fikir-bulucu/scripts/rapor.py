#!/usr/bin/env python3
"""Niş Fikir Bulucu: rapor verisini kontrol eder, puanı hesaplar ve HTML rapor üretir.

Kullanım:
  python3 rapor.py veri.json                # veri.html üretir
  python3 rapor.py veri.json -o rapor.html
  python3 rapor.py veri.json --kontrol      # sadece kontrol ve puan, HTML yazmaz

veri.json, assets/semalar/ altındaki şemalardan birine (kesif, dogrulama, pivot) uymalıdır.
Eksik alanlar "Veri bulunamadı" ile doldurulur ve listelenir. Puan, bu dosyadaki formülle hesaplanır.
"""
import argparse
import json
import math
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
MISSING = "Veri bulunamadı"

# Puanlama: 7 bileşen, her biri 0-10 (yüksek her zaman iyi). Ağırlıklar toplamı 100.
COMPONENTS = [
    ("pain", "Problemin acısı ve sıklığı", 20),
    ("willingness_to_pay", "Para verme isteği (kanıtlı)", 20),
    ("market_room", "Pazarda yer var mı (doygun değil)", 15),
    ("reachability", "Kitleye ucuza ulaşılabilir mi", 15),
    ("giant_safety", "Devlerden ve yapay zeka şirketlerinden güvenli mi", 10),
    ("buildability", "1-2 kişi + yapay zeka ile yapılabilir mi", 10),
    ("founder_fit", "Kurucu profiline uygun mu", 10),
]
VERDICTS = [(75, "strong", "Güçlü: devam edin"), (55, "promising", "Umut verici: önce test edin"), (35, "weak", "Zayıf: pivot düşünün"), (0, "drop", "Bırakın")]


def score_idea(scores, legal_risk):
    def s(k):
        try:
            return max(0.0, min(10.0, float((scores or {}).get(k, {}).get("score", 0))))
        except (TypeError, ValueError):
            return 0.0

    raw = round(sum(s(k) / 10 * w for k, _, w in COMPONENTS), 1)
    caps = []
    if s("willingness_to_pay") <= 3:
        caps.append((54, "Para verme isteğine dair kanıt çok zayıf"))
    if s("pain") <= 3:
        caps.append((54, "Problem yeterince acı vermiyor"))
    if s("buildability") <= 3:
        caps.append((54, "Küçük bir ekiple yapılması çok zor"))
    if legal_risk == "yüksek":
        caps.append((54, "Yasal risk yüksek"))
    if any(s(k) <= 1 for k, _, _ in COMPONENTS):
        caps.append((34, "En az bir bileşende ölümcül zayıflık var"))
    cap = min([c for c, _ in caps], default=100)
    total = min(raw, cap)
    v = next(v for v in VERDICTS if total >= v[0])
    return {"raw": raw, "total": total, "capped": total < raw, "caps": [{"cap": c, "reason": r} for c, r in caps], "verdict": v[1], "verdict_label": v[2]}


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


def _total(items):
    t = 0.0
    for it in items or []:
        try:
            t += float(it.get("tutar", 0) if isinstance(it, dict) else it)
        except (TypeError, ValueError):
            pass
    return t


def _year(price, var, fixed, startup, ramp):
    """12 aylık tablo: her ay ödeme yapan müşteri × katkı − sabit gider; kümülatif nakit başlangıç harcamasıyla başlar."""
    cum = -startup
    rows, low = [], cum
    payback = None
    for i, n in enumerate(ramp[:12]):
        revenue = n * price
        cost = n * var + fixed
        profit = revenue - cost
        cum += profit
        low = min(low, cum)
        if payback is None and cum >= 0:
            payback = i + 1
        rows.append({"ay": i + 1, "musteri": n, "gelir": round(revenue), "maliyet": round(cost), "kar": round(profit), "kumulatif": round(cum)})
    return rows, sum(r["kar"] for r in rows), round(-low) if low < 0 else 0, payback


def unit_economics(ue):
    """Birim ekonomisi (founder-skill/founder-cfo yaklaşımından uyarlandı, aylık abonelik için)."""
    price = float(ue.get("fiyat") or 0)
    var = _total(ue.get("degisken"))
    fixed = _total(ue.get("sabit_aylik"))
    startup = _total(ue.get("baslangic"))
    ramp = [float(x or 0) for x in (ue.get("aylik_rampa") or [])][:12]
    ramp += [ramp[-1] if ramp else 0] * (12 - len(ramp))
    contribution = price - var
    out = {
        "katki_payi": round(contribution, 2),
        "katki_marji_yuzde": round(contribution / price * 100, 1) if price else 0,
        "degisken_toplam": round(var, 2),
        "sabit_toplam": round(fixed, 2),
        "baslangic_toplam": round(startup, 2),
        "uyarilar": [],
    }
    out["basa_bas_musteri"] = math.ceil(fixed / contribution) if contribution > 0 else None
    if ue.get("hedef_aylik_kar") and contribution > 0:
        out["hedef_icin_musteri"] = math.ceil((fixed + float(ue["hedef_aylik_kar"])) / contribution)
    rows, profit, cash, payback = _year(price, var, fixed, startup, ramp)
    out.update({"aylar": rows, "yil1_kar": round(profit), "gereken_nakit": cash, "geri_odeme_ayi": payback})

    def scenario(name, p=price, v=var, f=fixed, k=1.0):
        c = p - v
        _, pr, ca, pb = _year(p, v, f, startup, [x * k for x in ramp])
        return {"senaryo": name, "katki_payi": round(c, 2), "basa_bas_musteri": math.ceil(f / c) if c > 0 else None, "yil1_kar": round(pr), "gereken_nakit": ca, "geri_odeme_ayi": pb}

    out["senaryolar"] = [
        scenario("Plan"),
        scenario("Fiyat %20 düşük", p=price * 0.8),
        scenario("Müşteri %30 az", k=0.7),
        scenario("Müşteri başı maliyet %30 fazla", v=var * 1.3),
        scenario("Sabit gider %20 fazla", f=fixed * 1.2),
    ]
    if contribution <= 0:
        out["uyarilar"].append("Her satış zarar ediyor: müşteri başı maliyet fiyattan yüksek veya eşit.")
    elif out["katki_marji_yuzde"] < 50:
        out["uyarilar"].append("Katkı marjı %50'nin altında; yazılım işi için düşük.")
    if payback is None:
        out["uyarilar"].append("Plan ile ilk 12 ayda başlangıç harcaması geri kazanılamıyor.")
    if out["basa_bas_musteri"] and ramp and ramp[-1] < out["basa_bas_musteri"]:
        out["uyarilar"].append(f"12. aydaki müşteri sayısı ({int(ramp[-1])}) başa baş için gereken sayının ({out['basa_bas_musteri']}) altında.")
    return out


def add_scores(data):
    tur = data["tur"]
    if tur == "kesif":
        for c in data["candidates"]:
            c["score"] = score_idea(c.get("scores"), c.get("legal_risk"))
        data["candidates"].sort(key=lambda c: -c["score"]["total"])
    elif tur == "dogrulama":
        data["score"] = score_idea(data.get("scores"), data.get("legal_risk"))
        if isinstance(data.get("unit_economics"), dict):
            data["unit_economics_hesap"] = unit_economics(data["unit_economics"])
    else:
        for o in data["options"]:
            o["score"] = score_idea(o.get("scores"), o.get("legal_risk"))
        data["options"].sort(key=lambda o: -o["score"]["total"])
    return data


def main():
    ap = argparse.ArgumentParser(description="Rapor verisini kontrol et ve HTML rapor üret")
    ap.add_argument("veri", help="Rapor verisi (JSON dosyası)")
    ap.add_argument("-o", "--cikti", help="HTML dosyası (varsayılan: veri dosyasıyla aynı ad)")
    ap.add_argument("--kontrol", action="store_true", help="Sadece kontrol ve puan; HTML yazma")
    a = ap.parse_args()

    with open(a.veri, encoding="utf-8") as f:
        data = json.load(f)
    tur = data.get("tur")
    if tur not in ("kesif", "dogrulama", "pivot"):
        print(json.dumps({"hata": "'tur' alanı kesif, dogrulama veya pivot olmalı"}, ensure_ascii=False))
        sys.exit(1)
    with open(os.path.join(ROOT, "assets", "semalar", f"{tur}.json"), encoding="utf-8") as f:
        schema = json.load(f)

    errors = []
    data = add_scores(conform(schema, data, "", errors))

    summary = {"tur": tur, "eksik_veya_hatali_alanlar": errors[:60], "eksik_sayisi": len(errors)}
    if tur == "dogrulama":
        summary["puan"] = data["score"]
        ue = data.get("unit_economics_hesap")
        if ue:
            summary["birim_ekonomisi"] = {k: ue[k] for k in ("katki_payi", "katki_marji_yuzde", "basa_bas_musteri", "yil1_kar", "gereken_nakit", "geri_odeme_ayi", "uyarilar")}
        else:
            summary["uyari"] = "unit_economics alanı yok; raporda sayısal kâr hesabı olmayacak."

    else:
        items = data["candidates"] if tur == "kesif" else data["options"]
        summary["puanlar"] = [{"ad": i.get("name") or i.get("title"), "puan": i["score"]["total"], "karar": i["score"]["verdict_label"]} for i in items]

    if not a.kontrol:
        with open(os.path.join(ROOT, "assets", "rapor-sablonu.html"), encoding="utf-8") as f:
            tpl = f.read()
        payload = json.dumps(data, ensure_ascii=False).replace("</", "<\\/")
        marker = "/*RAPOR_VERISI*/null"
        if marker not in tpl:
            print(json.dumps({"hata": "Şablonda veri işareti bulunamadı"}, ensure_ascii=False))
            sys.exit(1)
        page = tpl.replace(marker, payload, 1)
        title = (data.get("meta") or {}).get("baslik") or "Niş Fikir Raporu"
        page = page.replace("<title>Niş Fikir Raporu</title>", f"<title>{title.replace('<', '').replace('>', '')}</title>", 1)
        out = a.cikti or os.path.splitext(a.veri)[0] + ".html"
        with open(out, "w", encoding="utf-8") as f:
            f.write(page)
        summary["html"] = os.path.abspath(out)

    print(json.dumps(summary, ensure_ascii=False, indent=1))


if __name__ == "__main__":
    main()
