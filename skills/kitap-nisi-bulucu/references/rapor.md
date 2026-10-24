# Rapor verisi ve HTML rapor

Sen sadece **veriyi** (JSON) hazırlarsın. Tablolar, grafikler, puan ve kazanç hesabı `assets/rapor-sablonu.html` ve `scripts/rapor.py` tarafından yapılır. HTML yazma, şablonu değiştirme.

## Dosya adı

`kitap-raporlari/<YYYY-AA-GG>-<kisa-ad>-<tur>.json`. Kısa adda Türkçe karakter ve boşluk kullanma.

## Şemalar

| Tür | Şema |
|---|---|
| Keşif | `assets/semalar/kesif.json` |
| Doğrulama | `assets/semalar/dogrulama.json` |

Kurallar:
- `tur`: `kesif` veya `dogrulama`. `meta` zorunlu: `baslik`, `tarih`; isteğe bağlı `pazar`, `kullanilan_kaynaklar`, `sinirlamalar`.
- Her zorunlu alanı doldur. Bilgi yoksa "Veri bulunamadı" yaz ve `data_gaps` alanına ekle.
- `enum` alanlarında yalnızca listelenen değerler (`düşük`, `orta`, `yüksek` vb.).
- Puanlar 0-10 tam sayı ve her biri `confidence` ile birlikte. `score` ve `kazanc_hesap` alanlarını sen yazma.
- Linkler `http://` veya `https://` ile başlar. Metinlerde HTML kullanma.

## İsteğe bağlı: ek grafikler ve bölümler

`ek_grafikler` ve `ek_bolumler` biçimi `nis-fikir-bulucu` skill'iyle aynıdır:

```json
{
  "baslik": "Rakip kitapların yorum sayıları",
  "tur": "bar",
  "etiketler": ["Kitap A", "Kitap B"],
  "seriler": [{ "ad": "Yorum sayısı", "veri": [1240, 310] }],
  "aciklama": "Amazon.com, 2026-10-24",
  "kaynak_url": "https://www.amazon.com/s?k=..."
}
```

Sadece gerçek veriyle grafik ekle.

## Üretme

**Kod çalıştırabiliyorsan:**
```bash
python3 <skill>/scripts/rapor.py kitap-raporlari/<dosya>.json
```
3'ten fazla eksik veya hatalı alan varsa düzeltip tekrar çalıştır. Çıktıdaki kazanç `uyarilar` listesini özette kullan.

**Kod çalıştıramıyorsan:** `assets/rapor-sablonu.html` içindeki `/*RAPOR_VERISI*/null` ifadesini JSON verinle değiştir (`</` yerine `<\/` yaz) ve HTML olarak ver.

## Teslim

Raporun yolunu ver (Mac'te `open <dosya>.html`). Sohbette kısa özet ver; raporun tamamını sohbete kopyalama.
