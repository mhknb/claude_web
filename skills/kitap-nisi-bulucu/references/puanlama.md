# Puanlama

Her kitap fikrini 7 bileşende 0-10 arası **tam sayı** ile puanla. Yüksek puan her zaman iyidir. Toplamı ve kararı `scripts/rapor.py` veya şablon hesaplar.

| Anahtar | Bileşen | Ağırlık |
|---|---|---|
| `demand` | Talep | %20 |
| `competition_gap` | Rekabet boşluğu | %20 |
| `ai_resilience` | Yapay zekaya dayanıklılık | %15 |
| `author_fit` | Yazar uyumu ve güvenilirlik | %15 |
| `earning` | Kazanç gücü | %10 |
| `evergreen` | Kalıcılık | %10 |
| `reachability` | Okura ulaşılabilirlik | %10 |

## Puan ve güven ayrı şeylerdir

Her bileşen için:
- **`score`:** Bulduklarına göre en olası durum.
- **`confidence`:** Kanıtın gücü.
  - **yüksek:** Birden fazla bağımsız, doğrudan kanıt var.
  - **orta:** En az bir doğrudan kanıt var.
  - **düşük:** Doğrudan kanıt yok; puan akıl yürütmeye dayanıyor.

Kanıt bulamadığında puanı düşürme. En olası puanı ver ve güveni "düşük" işaretle. Düşük puan için **zayıflığın kanıtı** gerekir. 7 ve üstü için o basamağın kanıtı gerçekten bulunmuş olmalı; yoksa en fazla 6 ver ve güveni "düşük" yap.

## Puan basamakları

### demand: Talep
- **0-2:** Amazon önerilerinde konuyla ilgili ifade çıkmıyor. İlk sonuçlardaki kitapların çoğu çok yüksek satış sıralamasında (ör. 1 milyonun üstünde) veya hiç yorumsuz.
- **3-4:** Birkaç öneri var ama ilk 10 kitabın neredeyse hepsi zayıf satıyor (sıralama 500 binin üstünde).
- **5-6:** Konu önerilerde çıkıyor. İlk 10'da 1-2 kitap düzenli satıyor (sıralama 100 binin altında).
- **7-8:** Birden fazla öneri ifadesi var. İlk 10'da en az 3 kitap 100 binin altında; topluluklarda ("hangi kitabı önerirsiniz?") düzenli sorular var.
- **9-10:** Güçlü ve sürekli talep: çok sayıda kitap iyi satıyor, konu her yıl tekrar aranıyor, okurlar kurs ve danışmanlığa da para ödüyor.

Satış sıralaması eşikleri **topluluk sezgisidir**, kesin değildir; kategoriye ve pazara göre değişir. Türkçe pazarda satış sıralaması yerine çok satanlar listeleri, yorum sayıları ve baskı sayısı kullanılır.

### competition_gap: Rekabet boşluğu
Rakip sayısını değil, **boşluğu** ölç. Satan rakipler talebin kanıtıdır.
- **0-2:** Konu, büyük yayınevlerinin veya binlerce yorumlu güçlü kitapların elinde. Okurlar memnun, belirgin bir eksik yok.
- **3-4:** İyi kitaplar var; fark yaratmak ancak küçük ayrıntılarla mümkün.
- **5-6:** Kitaplar var ama düşük puanlı yorumlarda tekrar eden şikâyetler var (eski bilgi, çok yüzeysel, uygulama yok, Türkiye'ye uygun değil).
- **7-8:** Mevcut kitaplar eski, genel veya bu okura uygun değil; bunu gösteren yorumlar var.
- **9-10:** Talep kanıtlı ama bu okur için yazılmış ciddi bir kitap yok.

### ai_resilience: Yapay zekaya dayanıklılık
- **0-2:** Bilgi genel ve kolayca aranabilir; ChatGPT aynı içeriği bedava ve yeterince iyi veriyor.
- **3-4:** Kitap biraz düzen ve kolaylık sağlıyor ama özgün bir değer yok.
- **5-6:** Kitabın yapısı, şablonları veya uygulama planı yapay zekanın bir seferde vermediği değer katıyor.
- **7-8:** Yazarın gerçek deneyimi, vakaları veya yerel ve güncel bilgisi var; okur bunu güvenilir bir kaynaktan almak istiyor.
- **9-10:** Kitap bir uzmanlık otoritesi veya topluluk/kursla birlikte geliyor; okur kişiye ve yönteme güveniyor.

### author_fit: Yazar uyumu ve güvenilirlik
- **0-2:** Yazarın konuyla ilgisi yok; hassas bir konuysa okura zarar verme riski var.
- **3-4:** Yazar konuyu araştırarak yazabilir ama deneyimi yok.
- **5-6:** İlgili deneyim var ama uzmanlık belgesi veya kitleye erişim yok.
- **7-8:** Yazar bu konunun uzmanı veya bu okurun kendisi.
- **9-10:** Uzman ve bilinen bir isim; kitleye doğrudan erişimi var.

Profil yoksa 5 ver ve güveni "düşük" işaretle. `ymyl` doğruysa ve yazar uyumu 4 veya altındaysa puan sınırlanır.

### earning: Kazanç gücü
- **0-2:** Kategorideki kitaplar çok ucuz (ör. 0,99-2,99 $) ve ince; kopya başı kazanç ihmal edilebilir.
- **3-4:** Düşük fiyat bandı; kazanç ancak çok yüksek adetle anlamlı.
- **5-6:** Orta fiyat bandı (ör. e-kitap 4,99-9,99 $, basılı 12-20 $).
- **7-8:** Profesyonel veya özel okur, yüksek fiyatı kabul ediyor; basılı ve e-kitap birlikte satıyor.
- **9-10:** Kitap; kurs, danışmanlık, şablon paketi veya seri için giriş kapısı. Okur başına toplam gelir yüksek.

### evergreen: Kalıcılık
- **0-2:** Geçici bir trende bağlı; birkaç ay içinde ilgi kaybolur.
- **3-4:** Hızla eskiyen bilgi (yazılım sürümü, yıllık mevzuat) ve güncelleme zor.
- **5-6:** Birkaç yıl geçerli; yıllık küçük güncellemelerle yaşatılabilir.
- **7-8:** Her yıl yeniden aranan, temel bir ihtiyaç.
- **9-10:** Kuşaktan kuşağa süren bir ihtiyaç (ör. belirli bir hastalıkla yaşamak, belirli bir meslek sınavı).

### reachability: Okura ulaşılabilirlik
- **0-2:** Okurların toplandığı belirli bir yer yok.
- **3-4:** Sadece genel sosyal medya ve reklamla ulaşılabilir.
- **5-6:** Belirli topluluklar var (subreddit, Facebook grubu, forum, dernek).
- **7-8:** Büyük ve aktif topluluklar var. Amazon'da kitap aranan bir konu (öneriler çıkıyor).
- **9-10:** Yazarın kitleye doğrudan erişimi var (takipçi, e-posta listesi, meslek ağı).

## İkinci bakış: Thiel tekel testi

Peter Thiel'in *Zero to One* kitabındaki "küçük pazarda tekel" fikrini kitaba uygula: Bu kitap kendi küçük nişinde "o konunun kitabı" olabilir mi? Mevcut en iyi kitaptan açıkça daha iyi mi, yoksa sadece biraz mı? Cevap "sadece biraz" ise `competition_gap` puanı 6'yı geçmemeli.

## Kapılar

Kapılar sadece güveni orta veya yüksek olan bileşenlere uygulanır.

| Durum | Toplam en fazla |
|---|---|
| `demand` ≤ 3 | 54 |
| `competition_gap` ≤ 2 | 54 |
| `ai_resilience` ≤ 2 | 54 |
| `ymyl` doğru ve `author_fit` ≤ 4 | 54 |
| `policy_risk` = "yüksek" | 54 |
| Herhangi bir bileşen ≤ 1 | 34 |

## Karar

| Toplam | Karar |
|---|---|
| 75+ | Güçlü: yazın |
| 55-74 | Umut verici: önce test edin |
| 35-54 | Zayıf: açıyı değiştirin |
| <35 | Bırakın |
| güven düşükse | Belirsiz: önce test edin |

**Belirsiz:** `demand` güveni düşükse veya şu dört bileşenden en az ikisinin güveni düşükse: `demand`, `competition_gap`, `ai_resilience`, `earning`.

## Gerçeklik kontrolü

- 7+ verdiğin her puanın kaynaklı kanıtı var mı?
- Düşük puan verdiğin yerde zayıflığın kanıtı mı var, yoksa sadece kanıt mı bulamadın?
- Her aday 45-60 arasına mı düşüyor? Puanları kanıta göre yayılmış ver.
- Satış adedi veya gelir rakamı yazdıysan "tahmin" olarak işaretledin mi?
