# 2. Kitap doğrulama

Amaç: Tek bir kitap fikrini derinlemesine incelemek ve kararı (yaz, test et, açıyı değiştir, bırak) kanıtlarla vermek. Rapor `assets/semalar/dogrulama.json` şemasındaki bölümleri doldurur.

Fikir belirsizse en fazla 2 soru sor: Kim için? Okur kitabı bitirdiğinde ne yapabiliyor olacak? Kullanıcının iddialarını ("kimse yazmamış") varsayım olarak ele al ve kontrol et.

## Adımlar

### 1. Okur kitlesi → `readers`, `scores.reachability`
2-3 okur segmenti. Her biri için büyüklük tahmini ve dayanağı, bu konuda kitap veya kaynak satın aldığının kanıtı, beklentiler, sorunlar ve toplandıkları yerler (adıyla ve linkiyle). Kanıtlıysa `validated: true`. Kitap almayacak okurları `excluded_segments` alanına yaz (ör. "bilgiyi YouTube'dan bedava almayı tercih eden genç kitle").

### 2. Talep → `demand`, `scores.demand`, `scores.evergreen`
- Amazon arama önerileri (`amazon_suggestions`): en az 3 tohum ifade ve önerileri. Türkçe kitapta Google ve platform aramaları.
- İlk kitapların satış sıralaması özeti ve yorumu (`bsr_summary`), [veri-kaynaklari.md](veri-kaynaklari.md) bölüm 1'deki tabloya göre.
- Trend ve kalıcılık.

### 3. Rakip kitaplar → `competitor_books`, `scores.competition_gap`
5-10 kitap: başlık, yazar, link, yıl, format, fiyat, sayfa, puan, yorum sayısı, satış sıralaması, güçlü yanlar ve **okur şikâyetleri** (düşük puanlı yorumlardan, temalara ayrılmış). Büyük yayınevi mi?

### 4. Pazardaki konum → `market_position`, `scores.ai_resilience`
Doygunluk, boşluk, neden şimdi (yeni mevzuat, yeni teknoloji, demografik değişim) ve **yapay zeka tehdidi**: Bu kitabın sorularına bir yapay zeka asistanı ne kadar iyi cevap veriyor; kitap neden yine de değerli?

### 5. Konumlandırma → `positioning`
"[Okur] için, [mevcut kitaplar]dan farklı olarak, [vaat] sunan [kitap türü]." Açı, okura somut vaat, sadece bu kitapta olanlar (vakalar, şablonlar, yerel bilgi), karşılaştırma için benzer başlıklar.

### 6. Başlık, anahtar kelimeler, kategoriler → `metadata`
[metadata.md](metadata.md) yöntemini uygula: 3-5 başlık ve alt başlık seçeneği, 7 anahtar kelime alanı, 2-3 kategori, satış sayfası açıklamasının girişi.

### 7. İçerik → `outline`
8-15 bölümlük içindekiler taslağı (her bölüm için 1 cümle) ve kitabı yapay zekadan ayıran ekler (kontrol listeleri, şablonlar, çalışma sayfaları, indirilebilir dosyalar).

### 8. Format, fiyat, kapak, seri → `format_and_price`, `cover_brief`, `series_potential`, `scores.earning`
- Formatlar ve önerilen fiyat: rakip fiyatlarıyla karşılaştır.
- Sayfa sayısı: rakiplerin ortalamasına ve konunun derinliğine göre.
- Kapak tarifi: kategorideki kapaklara bak; okurun hemen anlayacağı ama rakiplerden ayrışan bir tasarım. Rakip kapakları taklit etme.
- Seri potansiyeli: aynı okur için 2-4 devam kitabı mümkün mü?

### 9. Kitap başı kazanç → `kazanc`
[yayin-ve-kazanc.md](yayin-ve-kazanc.md) yöntemini uygula. Telif oranı, baskı maliyeti ve kesintileri **güncel resmi sayfadan** al ve `kaynak` alanına linkini yaz. Aylık satış senaryolarını (düşük, orta, yüksek) rakiplerin satış sıralamalarından gerekçelendir ve "tahmin" olarak işaretle. Hesabı `scripts/rapor.py` yapar.

### 10. Alternatif açılar → `alternative_angles`
Puan 55'in altındaysa (veya kullanıcı isterse) 2-3 yeniden konumlandırma seçeneği: okuru daraltmak, bağlam eklemek (ülke, meslek), formatı değiştirmek (rehber yerine çalışma kitabı), dil değiştirmek. Her biri en fazla 1-2 şeyi değiştirsin.

### 11. Riskler → `risks`, `policy_risk`, `ymyl`
- **Yayın politikası:** Platformun yapay zeka beyanı kuralları, içerik kuralları, günlük yayın sınırları. Güncel resmi sayfayı kontrol et.
- **Yasal:** Sağlık, hukuk ve finans tavsiyesi sorumluluğu; telif (alıntılar, görseller); Türkiye'de basılı kitapta ISBN ve bandrol yükümlülükleri (güncel durumu resmi kaynaktan kontrol et).
- **Uzmanlık:** Yazar uzmanlığı yetersizse okura zarar ve güven kaybı.
- **Pazar ve yapay zeka:** Talebin azalması, yapay zekanın konuyu bedava karşılaması.

### 12. Yayın planı → `launch_plan`
Yayından önce (okur topluluklarında değer paylaşımı, e-posta listesi, ön okuyucu ekibi), yayın haftası, ilk 90 gün. Yorumlar için sadece dürüst yöntemler (ücretsiz ön okuma kopyası verip dürüst yorum rica etmek). Sahte veya karşılıklı yorum asla. Reklam önerisi bütçeyle uyumlu olsun.

### 13. Test planı → `validation_plan`
Kitabı yazmadan önce talebi test et: en riskli varsayım ve 2 hafta içinde, düşük bütçeyle yapılabilecek bir deney. Örnekler:
- Bölüm özeti veya kontrol listesi içeren bir ön kayıt sayfası (hedef: belirli sayıda e-posta)
- Okur topluluklarında taslak içindekileri paylaşıp geri bildirim toplamak
- Kitabın kısa bir bölümünü ücretsiz veya düşük fiyatlı yayınlayıp ilgiyi ölçmek

Sayısal başarı ölçütü ve tarihli bırakma ölçütleri koy.

### 14. Puan ve özet → `scores`, `summary`
[puanlama.md](puanlama.md)'ye göre 7 bileşen, her birinin **güven düzeyi** ve gerçeklik kontrolü. Karar "Belirsiz" çıkarsa test planını güveni düşük bileşenleri ölçecek şekilde kur. `summary`: kararın 3-4 cümlelik gerekçesi, en büyük risk, somut bir sonraki adım.

`data_gaps`: doğrulayamadıkların. `sources`: başlıca kaynaklar.

## Önerilen ek grafikler (sadece gerçek veriyle)

- Rakip kitapların yorum sayıları veya satış sıralamaları (bar)
- Rakip fiyatları ve sayfa sayıları (scatter: x fiyat, y sayfa)
- Okur şikâyet temalarının dağılımı (bar)
- Konunun trend verisi (line)

## Bitiş

Sohbette kısa özet: karar ve puan, en iyi başlık önerisi, en güçlü kanıt, en büyük risk, test planının ilk adımı ve raporun yolu.
