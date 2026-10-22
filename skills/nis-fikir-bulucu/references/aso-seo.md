# ASO ve SEO anahtar kelimeleri

ASO (App Store Optimization): Uygulamanın mağaza aramalarında bulunabilmesi. SEO: Web sitesinin Google'da bulunabilmesi.

Kaynak yöntemler: agency-agents "App Store Optimizer" ve "SEO Specialist", MaxKmet/idea-validation-agents ASO değerlendirmesi.

## Temel kural

Arama hacmi rakamı **uydurma**. Ücretsiz kaynaklar hacim vermez. Bunun yerine şu iki sinyali kullan:
1. **Talep sinyali:** İfade otomatik tamamlama önerilerinde çıkıyor mu, kaçıncı sırada? Önerilerde çıkması, insanların bunu gerçekten aradığını gösterir.
2. **Rekabet sinyali:** O kelimeyle mağazada veya Google'da çıkan ilk sonuçlar ne kadar güçlü?

## ASO yöntemi

1. **Tohum kelimeler:** Problemi ve çözümü kullanıcının diliyle anlatan 5-10 kelime. Kullanıcı yorumlarındaki ifadelerden ve rakip uygulama başlıklarından çıkar.
2. **Genişlet:**
   ```bash
   python3 <skill>/scripts/veri.py oneri appstore "<tohum>" --ulke us
   python3 <skill>/scripts/veri.py oneri google "<tohum> app" "<tohum> uygulama" --dil tr --ulke tr
   ```
   Kod çalıştıramıyorsan web aramasında rakip başlıklarını ve "best <X> app" listelerini kullan.
3. **Rekabeti ölç:** Her aday kelime için `appstore-ara` çalıştır ve `doygunluk_sinyali` alanına bak (0-1 güçlü uygulama: düşük, 2-4: orta, 5+: yüksek).
4. **Uygunluk:** Kelime, ürünün ana işini tam anlatıyorsa yüksek, kısmen anlatıyorsa orta, uzaksa düşük.
5. **Seçim:** Önce "uygunluk yüksek + rekabet düşük veya orta" olan kelimeler. Uzun kuyruklu ifadeler (3+ kelime, ör. "diyetisyen danışan takip") daha az aranır ama niyeti daha net ve rekabeti daha düşüktür; küçük ekip için genelde daha iyidir.
6. **Mağaza başlığı ve alt başlık önerisi:**
   - App Store: başlık en fazla 30 karakter, alt başlık 30 karakter, gizli anahtar kelime alanı 100 karakter.
   - Google Play: başlık 30 karakter, kısa açıklama 80 karakter.
   - Başlık yapısı: `[Marka] - [Ana kelime + fayda]` veya `[Ana kelime]: [Fayda]`. Karakter sınırını aşma.

`keywords.aso` alanında her kelime için: `keyword`, `language`, `competition`, `relevance`, `source` (ör. "App Store önerisi, 2. sıra" veya "rakip başlığı: X").

## SEO yöntemi

1. **Tohum ve genişletme:**
   ```bash
   python3 <skill>/scripts/veri.py oneri google "<tohum>" "<tohum> nasıl" "<tohum> fiyat" "<rakip> alternatif" --dil tr --ulke tr
   python3 <skill>/scripts/veri.py oneri youtube "<tohum>" --dil tr --ulke tr
   ```
   YouTube önerileri, video içerik talebini gösterir.
2. **Niyete göre ayır:**
   - **bilgi:** "nasıl", "nedir", "ne kadar" (blog ve rehber içerikleri)
   - **karşılaştırma:** "en iyi", "alternatif", "vs" (karşılaştırma sayfaları; dönüşümü yüksektir)
   - **satın alma:** "fiyat", "indir", "program", "uygulama" (ürün sayfası)
3. **Rekabet:** Kelimeyi web aramasında ara. İlk sonuçlar büyük siteler (Wikipedia, büyük medya, devler) ise rekabet yüksektir. Forumlar, küçük bloglar ve eski içerikler ise rekabet düşüktür ve fırsat vardır.
4. Her kelimeye somut bir içerik veya sayfa fikri yaz (`content_idea`).

Küçük ekip için öncelik: **karşılaştırma** ve **satın alma** niyetli, rekabeti düşük-orta, uzun kuyruklu kelimeler.

## Dil

- Pazar "Türkiye" ise Türkçe kelimeler; ama sektörde yaygın İngilizce terimler (ör. "CRM") varsa onları da ekle.
- Pazar "Global" ise İngilizce kelimeler.
- Pazar "İkisi" ise iki dilde ayrı listeler.
