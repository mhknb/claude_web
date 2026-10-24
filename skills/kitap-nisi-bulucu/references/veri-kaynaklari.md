# Veri kaynakları

`<skill>`, bu skill'in klasörüdür. Her sinyal için kullanılabilen en güçlü kaynağı seç; çalışmayanı `meta.sinirlamalar` alanına yaz.

## 0. Komutlar ağ hatası verirse

`scripts/veri.py` "403", "Tunnel connection failed" veya "timed out" hatası verirse ortam bu sitelere doğrudan erişimi engelliyor olabilir. Bir sayfa okuma aracın (Firecrawl, web_fetch, kendi web okuma aracın) varsa aynı ücretsiz adresleri onunla oku:

| Veri | Adres |
|---|---|
| Amazon kitap arama önerileri (ABD) | `https://completion.amazon.com/api/2017/suggestions?limit=11&prefix=<ifade>&alias=stripbooks&mid=ATVPDKIKX0DER&site-variant=desktop&client-info=amazon-search-ui` |
| Amazon kitap araması | `https://www.amazon.com/s?k=<ifade>&i=stripbooks` |
| Open Library | `https://openlibrary.org/search.json?q=<ifade>&limit=20` |
| Google önerileri | `https://suggestqueries.google.com/complete/search?client=firefox&hl=tr&gl=tr&q=<ifade>` |
| YouTube önerileri | `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&hl=tr&gl=tr&q=<ifade>` |

## 1. Talep

**Amazon arama önerileri** (en değerli ücretsiz sinyal):
```bash
python3 <skill>/scripts/veri.py amazon-oneri "<ifade 1>" "<ifade 2>" --pazar us
```
Tohum ifadeyi harf harf genişlet ("caregiver a", "caregiver b"...) veya soru kalıpları ekle ("... for beginners", "... guide", "... workbook"). Önerilerde çıkan ifade, insanların Amazon'da kitap ararken yazdığı ifadedir.

**Satış sıralaması (BSR):** Sayfa okuma aracıyla Amazon arama sonuçlarını aç ve ilk 10 kitabı not et. En az 3-5 kitabın ürün sayfasını açıp "Best Sellers Rank" değerini oku. Yorumlama (kaba topluluk sezgisi, kesin değildir):

| İlk 10'da sıralaması 100 binin altında olan kitap sayısı | Talep |
|---|---|
| 0 | zayıf |
| 1-2 | orta |
| 3 ve üzeri | güçlü |

İlk 10'un çoğu 5 binin altında ve binlerce yorumluysa talep güçlüdür ama rekabet de çok serttir.

**Türkçe pazar:** Amazon KDP Türkçeyi desteklemiyor (resmi dil listesini her analizde kontrol et). Talep için şunları kullan:
- Kitapyurdu, D&R, Idefix ve Trendyol'da arama sonuçları ve çok satanlar listeleri
- Yorum ve değerlendirme sayıları, baskı sayısı
- Google ve YouTube önerileri: `python3 <skill>/scripts/veri.py oneri google "<ifade>" --dil tr --ulke tr`
- Ekşi Sözlük ve forumlarda "bu konuda kitap önerisi" başlıkları
- Türkiye Yayıncılar Birliği kitap pazarı raporları (genel pazar büyüklüğü için)

**Okur konuşmaları:** Kuruluysa `last30days` skill'ini konuyla çalıştır (Reddit, YouTube, TikTok/BookTok). Değilse web araması:
- `site:reddit.com "book recommendation" <konu>`
- `site:reddit.com "is there a book" <konu>`
- `site:goodreads.com <konu>`
- `<konu> "kitap önerisi"`, `site:eksisozluk.com <konu> kitap`

**Trend:** Trends MCP bağlıysa `get_growth` (Google, Amazon, YouTube kaynakları). Değilse haberler ve yıllık arama ilgisi.

## 2. Rekabet ve boşluk

- Amazon arama sonuçlarının ilk 10-15 kitabı: başlık, yazar, yayın yılı, fiyat, sayfa sayısı, puan, yorum sayısı, satış sıralaması, büyük yayınevi mi.
- **Okur şikâyetleri:** En güçlü 3-5 kitabın 1-3 yıldızlı yorumlarını oku (ürün sayfasındaki yorumlar veya Goodreads). Şikâyetleri temalara ayır (ör. "çok yüzeysel", "eski bilgi", "uygulama yok", "ABD'ye özel, bizde geçersiz"), her temanın kaç kez geçtiğini say. 3 yıldızlı yorumlar özellikle değerlidir.
- Konunun yaşı ve hacmi: `python3 <skill>/scripts/veri.py openlibrary "<konu>"` (son 5 yılda kaç kitap çıkmış). `google-kitap` komutu kotaya takılabilir; hata verirse atla.

## 3. Yapay zekaya dayanıklılık

Kitabın ana sorularını bir yapay zeka asistanına sorulmuş gibi düşün: Cevap yeterli ve güvenilir olur muydu? Okur şikâyetlerinde "internette bedava var" gibi ifadeler geçiyor mu? Kitabı değerli kılacak unsurları belirle: yazarın vakaları, yerel ve güncel bilgi, şablonlar, kontrol listeleri, topluluk.

## 4. Okura ulaşılabilirlik

Okurların toplandığı belirli yerleri adıyla ve linkiyle bul: subreddit'ler, Facebook grupları, forumlar, dernekler, YouTube kanalları, bültenler, podcast'ler. "Sosyal medya" gibi genel ifadeler yazma.

## 5. Kanıt kaydı

Her önemli bilgi için iddia, link ve tarih tut. Linksiz iddia rapora girmez.
