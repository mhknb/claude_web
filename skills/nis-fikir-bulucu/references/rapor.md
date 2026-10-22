# Rapor verisi ve HTML rapor

Rapor iki parçadan oluşur:
- **Veri:** Senin hazırladığın JSON dosyası.
- **Şablon:** `assets/rapor-sablonu.html`. Veriyi okur; tabloları, grafikleri ve puanı kendisi oluşturur.

Sen sadece **veriyi** hazırlarsın. HTML yazmazsın, şablonu değiştirmezsin. Böylece raporlar tutarlı olur ve puan hesabı kodda kalır.

## Dosya adı ve yer

`nis-raporlari/<YYYY-AA-GG>-<kisa-ad>-<tur>.json`. Örnek: `nis-raporlari/2026-10-22-diyetisyen-asistani-dogrulama.json`. Klasör yoksa oluştur. Kısa adda Türkçe karakter ve boşluk kullanma.

## Şemalar

| Tür | Şema |
|---|---|
| Keşif | `assets/semalar/kesif.json` |
| Doğrulama | `assets/semalar/dogrulama.json` |
| Pivot | `assets/semalar/pivot.json` |

Kurallar:
- `tur` alanı `kesif`, `dogrulama` veya `pivot` olmalı.
- `meta` alanı zorunludur: `baslik`, `tarih` (YYYY-AA-GG); isteğe bağlı olarak `pazar`, `kullanilan_kaynaklar`, `sinirlamalar`.
- Şemadaki her zorunlu alanı doldur. Bilgi yoksa metin alanlarına "Veri bulunamadı" yaz ve konuyu `data_gaps` alanına ekle (doğrulama raporunda).
- `enum` olan alanlarda sadece listelenen değerleri kullan (ör. `düşük`, `orta`, `yüksek`; küçük harf ve Türkçe karakterle).
- Puanlar 0-10 arası tam sayıdır. `score` alanlarını sen yazma; kod hesaplar.
- Linkler `http://` veya `https://` ile başlamalı.
- Metinlerde HTML kullanma; şablon bunları düz metin olarak gösterir.

## İsteğe bağlı: ek grafikler (`ek_grafikler`)

Sadece **gerçek veriye** dayanan grafikleri ekle. Her grafik:

```json
{
  "baslik": "Rakiplerin App Store değerlendirme sayıları (ABD)",
  "tur": "bar",
  "etiketler": ["Rakip A", "Rakip B", "Rakip C"],
  "seriler": [{ "ad": "Değerlendirme sayısı", "veri": [12400, 3100, 860] }],
  "aciklama": "App Store araması, 2026-10-22",
  "kaynak_url": "https://apps.apple.com/..."
}
```

`tur` şunlardan biri olabilir: `bar`, `line`, `pie`, `doughnut`, `radar`, `scatter`. Trend için `line` kullan: `etiketler` aylar, birden fazla seri farklı kelimelerdir. Dağılım grafiğinde (`scatter`) `veri` öğeleri `{"x": .., "y": ..}` biçiminde olur.

İnternet bağlantısı yoksa grafik yerine aynı verinin tablosu gösterilir.

## İsteğe bağlı: ek bölümler (`ek_bolumler`)

Şemada yeri olmayan önemli bilgiler için (ör. rakip fiyat planlarının ayrıntılı tablosu, Mom Test görüşme soruları, yerel mevzuat notları):

```json
{
  "baslik": "Mom Test görüşme soruları",
  "metin": "Görüşmelerde fikri anlatmayın.\n\nGeçmiş davranışı sorun.",
  "tablo": { "basliklar": ["Soru", "Neyi öğrenmek için"], "satirlar": [["En son ne zaman ...?", "Sıklık"]] }
}
```

`metin` içinde boş satır yeni paragraf demektir.

## Üretme

**Kod çalıştırabiliyorsan:**
```bash
python3 <skill>/scripts/rapor.py nis-raporlari/<dosya>.json
```
Çıktıdaki `eksik_veya_hatali_alanlar` listesini oku. 3'ten fazla sorun varsa veriyi düzeltip tekrar çalıştır. Komut aynı adla bir `.html` dosyası yazar ve puanı gösterir.

**Kod çalıştıramıyorsan:** `assets/rapor-sablonu.html` dosyasını oku. İçindeki `/*RAPOR_VERISI*/null` metnini JSON verinle (tek satır olabilir) değiştir. JSON içinde `</` geçiyorsa `<\/` olarak yaz. Sonucu tam HTML dosyası olarak ver (claude.ai'de artifact olarak). Şablonun başka hiçbir yerini değiştirme.

## Kullanıcıya teslim

- Raporun dosya yolunu ver. Kullanıcı Mac'teyse `open <dosya>.html` komutuyla açılabileceğini söyle.
- Sohbette kısa özet: karar ve puan, en güçlü yanlar, en büyük risk, sonraki adım.
