# Veri kaynakları ve nasıl kullanılır

Her sinyal türü için kullanılabilen **en güçlü** kaynağı seç. Bir kaynak çalışmazsa bir alttakine geç ve bunu `meta.sinirlamalar` alanına yaz.

`<skill>`, bu skill'in klasörüdür (SKILL.md'nin bulunduğu yer). Komutları bu yolla çalıştır.

## 0. Komutlar ağ hatası verirse

`scripts/veri.py` komutları "403", "Tunnel connection failed" veya "timed out" gibi bir hata verirse, bulunduğun ortam bu sitelere doğrudan erişimi engelliyor olabilir. Bu durum sık görülür, özellikle bulut ortamlarında. Bu durumda bir **sayfa okuma aracın** varsa (Firecrawl, web_fetch, kendi web okuma aracın), aynı ücretsiz adresleri onunla oku; bu araçlar sayfayı kendi sunucularından alır:

| Veri | Adres |
|---|---|
| App Store araması | `https://itunes.apple.com/search?term=<kelime>&country=tr&entity=software&limit=15` |
| App Store uygulama ayrıntısı | `https://itunes.apple.com/lookup?id=<id1>,<id2>&country=tr` |
| App Store yorumları | `https://itunes.apple.com/tr/rss/customerreviews/page=1/id=<id>/sortby=mostrecent/json` |
| Google önerileri | `https://suggestqueries.google.com/complete/search?client=firefox&hl=tr&gl=tr&q=<kelime>` |
| YouTube önerileri | `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&hl=tr&gl=tr&q=<kelime>` |

Dönen JSON'u kendin yorumla. Doygunluk için bölüm 2'deki kuralı uygula. Hiçbir yol çalışmazsa durumu `meta.sinirlamalar` alanına yaz.

## 1. Gerçek kullanıcı şikâyeti ve talebi (problem, acı, beklenti)

En değerli sinyal: insanların **kendi cümleleriyle** anlattığı sorunlar ve "keşke ... olsa" istekleri.

1. **`last30days` skill'i kuruluysa:** Konuyu ona ver (ör. `/last30days diyetisyenlerin danışan takibi sorunları`). Kendi talimatlarını izlemesine izin ver. Dönen özetteki alıntıları, oy ve beğeni sayılarını ve linkleri kanıt olarak kullan. Son 30 günle sınırlı olduğunu unutma; kalıcı sorunlar için web aramasıyla destekle.
2. **`agent-reach` kuruluysa:** Önce `agent-reach doctor` ile hangi platformların açık olduğuna bak. Açık olan platformlarda (Reddit, YouTube altyazıları, X) arama yap. Giriş gerektiren platformlar için kullanıcıdan çerez ya da giriş isteme; kapalıysa geç.
3. **RivalSearch MCP bağlıysa:** `social_search` (Reddit, Hacker News, Product Hunt, Dev.to, Lobsters vb.).
4. **Web araması** (her zaman): Aşağıdaki sorgu kalıplarını kullan.

### Sorgu kalıpları

Konuyu `<X>`, kitleyi `<K>` ile değiştir.

İngilizce:
- `site:reddit.com <K> "I hate" OR "so frustrating" OR "wish there was" <X>`
- `site:reddit.com <K> "what do you use for" <X>`
- `"is there an app" OR "is there a tool" <X> <K>`
- `<X> "alternative to" <rakip>`
- `site:news.ycombinator.com "Ask HN" <X>`
- `site:producthunt.com <X>`
- `<rakip> reviews complaints`, `site:g2.com <rakip>`, `site:capterra.com <rakip>`

Türkçe:
- `site:eksisozluk.com <X>`
- `site:sikayetvar.com <X> OR <rakip>`
- `<K> "hangi uygulamayı kullanıyorsunuz" <X>`
- `<X> "keşke" OR "bir uygulama olsa" <K>`
- `site:donanimhaber.com <X>`, `site:reddit.com/r/Turkey <X>`
- Facebook gruplarını ve LinkedIn gönderilerini web aramasıyla bul (`<K> facebook grubu`), içeriklerine giriş gerektirmeden ulaşabildiğin kadarını kullan.

Her bulguda şunları not et: alıntı, kaynak linki, tarih, etkileşim (oy, beğeni, yorum sayısı).

## 2. Rakipler ve pazar doygunluğu

**Kod çalıştırabiliyorsan:**

```bash
python3 <skill>/scripts/veri.py appstore-ara "<anahtar kelime>" --ulke tr       # veya us
python3 <skill>/scripts/veri.py play-ara "<anahtar kelime>" --ulke tr --dil tr  # pip install google-play-scraper gerekir
```

`appstore-ara` çıktısındaki `doygunluk_sinyali` alanını kullan. Pratik kural:

| İlk 10 sonuçta 1000+ değerlendirmeli uygulama | Doygunluk |
|---|---|
| 0-1 | düşük |
| 2-4 | orta |
| 5 ve üzeri | yüksek |

Ayrıca son güncelleme tarihlerine bak: güçlü rakiplerin çoğu 1 yıldan uzun süredir güncellenmiyorsa boşluk vardır.

**Kod çalıştıramıyorsan:** Web aramasıyla `site:apps.apple.com <anahtar kelime>` ve `site:play.google.com <anahtar kelime>` sorgularını kullan. Rakip sayfalarından puan, değerlendirme sayısı ve fiyatı oku.

SaaS rakipleri için: `<X> software`, `<X> tool pricing`, `best <X> tools <yıl>`, G2 ve Capterra kategori sayfaları. Rakiplerin fiyat sayfalarını aç ve gerçek fiyatları not et.

## 3. Yorum madenciliği (rakiplerin boşlukları)

agency-agents "Feedback Synthesizer" yaklaşımı: yorumları tek tek aktarma, **temalara grupla**.

```bash
python3 <skill>/scripts/veri.py appstore-yorum <id> --ulke us --en-fazla-puan 3
python3 <skill>/scripts/veri.py play-yorum <paket.adi> --ulke us --dil en --en-fazla-puan 3
```

En güçlü 3-5 rakibin 1-3 yıldızlı yorumlarını al. Sonra:
1. Şikâyetleri temalara ayır (ör. "fiyat yüksek", "senkronizasyon bozuk", "Türkçe yok", "X özelliği eksik").
2. Her temanın kaç yorumda geçtiğini say.
3. En sık 3 temayı rakiplerin zayıf yanları ve fikrin olası farkı olarak kullan. Her temadan birer gerçek alıntı ekle.

Ayrıca 3 yıldızlı yorumlar çok değerlidir: kullanıcı ürünü kullanmaya devam ediyor ama bir şey eksik.

## 4. Trend ve zamanlama

1. **Trends MCP bağlıysa:** `get_growth` ile anahtar kelimelerin 3, 12 ve 24 aylık değişimini al (Google, YouTube, TikTok, Amazon, Reddit). İstersen `get_time_series` ile grafik verisi çek ve raporun `ek_grafikler` alanına ekle.
2. **`last30days`** son 30 günün tartışma yoğunluğunu verir.
3. **Web araması:** Sektör haberleri, yatırım haberleri, mevzuat değişiklikleri ("neden şimdi" sorusu için).

Trend yorumu: hızla yükselen, yükselen, sabit veya düşen. Düşen bir alanda fikir zayıflar. Çok hızlı yükselen bir alanda ise devlerin girme riski artar.

## 5. Anahtar kelimeler (ASO ve SEO)

```bash
python3 <skill>/scripts/veri.py oneri google "<kelime 1>" "<kelime 2>" --dil tr --ulke tr
python3 <skill>/scripts/veri.py oneri appstore "<kelime>" --ulke us
python3 <skill>/scripts/veri.py oneri youtube "<kelime>" --dil en --ulke us
```

Öneri listelerinde çıkan ifadeler insanların **gerçekten aradığı** ifadelerdir, ancak arama hacmi değildir. Hacim bilgisi uydurma; sadece "önerilerde çıkıyor / çıkmıyor" ve rekabet bilgisini kullan. Yöntem: [aso-seo.md](aso-seo.md).

## 6. Sayfa okuma

Arama sonucunda bulduğun bir sayfayı okumak için kendi web okuma aracını kullan. Yoksa:

```bash
python3 <skill>/scripts/veri.py sayfa https://ornek.com/fiyatlandirma
```

## Kanıt kaydı

Araştırma sırasında bulduğun her önemli bilgiyi kısa bir not olarak tut: iddia, kaynak linki ve tarih. Rapordaki `evidence`, `user_quotes` ve `sources` alanları bu notlardan oluşur. Linki olmayan iddia rapora giremez.
