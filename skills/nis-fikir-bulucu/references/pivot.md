# 3. Pivot / yeniden konumlandırma

Amaç: Puanı düşük veya riskli çıkan bir fikri tamamen atmak yerine, en iyi versiyonunu bulmak. Kaynak yöntem: MaxKmet/idea-validation-agents "pivot-engine" (aynı fikir testi, kök neden sınıflaması).

Girdi: Bir doğrulama raporu (JSON). Sohbette yoksa `nis-raporlari/` klasöründeki son doğrulama verisini oku. Kullanıcının bir yön önerisi varsa (ör. "B2B'ye kaydır") onu seçeneklerden biri olarak mutlaka değerlendir.

## Adımlar

### 1. Kök neden → `root_causes`
Puanı 6 ve altında olan her bileşeni ve en büyük riskleri sınıflandır:
- **değiştirilemez:** Pazarın yapısı (ör. kitle hiç ödemiyor, devin ana ürünü)
- **zamanla düzelir:** Teknoloji veya pazar henüz hazır değil
- **bilgi eksikliği:** Yeterli veri bulunamadı; daha fazla araştırma veya görüşmeyle netleşir
- **düzeltilebilir:** Hedef kitle, niş, fiyat veya konumlandırma değişikliğiyle çözülebilir

Sadece **bilgi eksikliği** ve **düzeltilebilir** olanlar için pivot üret. Bütün zayıflıklar değiştirilemez türdense bunu açıkça söyle ve bırakmayı öner.

### 2. Seçenekler → `options` (2-3 tane)
Her seçenek için "aynı fikir testi"ni uygula:
- En fazla **1-2 değişken** değiştirir (`changed_variables`): hedef kitle, niş, fiyat modeli, özellik odağı, platform, pazar/ülke, konumlandırma.
- Mevcut fikrin en az bir **güçlü yönünü korur** (`kept_strengths`).
- Tamamen başka bir fikir pivot sayılmaz.

Yaygın ve çoğu zaman işe yarayan pivotlar:
- **B2C → B2B / profesyonel:** Aynı problemi işini bununla yapan, ödeme bütçesi olan kitleye taşı.
- **Genel → dikey:** Genel bir aracı belirli bir meslek veya sektöre özel hale getir; devlerden korunma sağlar.
- **Uygulama → hizmet + yazılım:** İlk müşterilere el ile hizmet ver, yazılımı sonra otomatikleştir.
- **Global → yerel** (veya tersi): Türkçe, yerel mevzuat veya ödeme sistemi bir boşluksa.
- **Özellik → tek iş:** Çok şey yapan fikri, en acı veren tek işe indir.

### 3. Her seçeneği gerçek veriyle kontrol et
Her seçenek için hızlı bir doğrulama yap. Doğrulama rehberinin tamamını uygulamana gerek yok; şu soruları cevapla:
- Yeni kitle bugün neye para ödüyor? (kanıt)
- Yeni nişte rakip durumu nasıl? (mağaza ve web araması, doygunluk)
- Trend var mı?
- Hangi zayıflığı nasıl düzeltiyor? (`why_better`)

Her seçeneğe en az 2 kaynaklı kanıt ekle. [puanlama.md](puanlama.md) ile 7 bileşeni puanla ve güven düzeylerini yaz. Çaba düzeyini (düşük/orta/yüksek) kurucu profiline göre belirle.

### 4. Öneri → `recommendation`
Hangisini önerdiğini ve nedenini yaz. Hiçbir seçenek mevcut fikirden belirgin şekilde daha iyi değilse bunu açıkça söyle.

`new_idea` alanını doğrulamaya doğrudan verilebilecek açıklıkta, tek paragraf olarak yaz.

## Çıktı

`assets/semalar/pivot.json` şemasına uygun veri hazırla ve [rapor.md](rapor.md)'ye göre raporu üret. Rapor, seçenekleri radar grafikte karşılaştırır.

Sohbette sor: "Hangi seçeneği tam doğrulamadan geçirelim?"
