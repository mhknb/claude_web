# Puanlama

Her fikri 7 bileşende 0-10 arası **tam sayı** ile puanla. Yüksek puan her zaman iyidir; "devlerden güvenli" bileşeninde 10, "hiç dev riski yok" demektir. Her puanın yanına 1-2 cümlelik, kanıta dayalı gerekçe yaz (`reason`).

Toplam puanı ve kararı sen hesaplama: `scripts/rapor.py` veya HTML şablonu hesaplar. Burada formül sadece bilgin olsun diye var.

## Bileşenler ve ağırlıklar

| Anahtar | Bileşen | Ağırlık |
|---|---|---|
| `pain` | Problemin acısı ve sıklığı | %20 |
| `willingness_to_pay` | Para verme isteği (kanıtlı) | %20 |
| `market_room` | Pazarda yer var mı (doygun değil) | %15 |
| `reachability` | Kitleye ucuza ulaşılabilir mi | %15 |
| `giant_safety` | Devlerden ve yapay zeka şirketlerinden güvenli mi | %10 |
| `buildability` | 1-2 kişi + yapay zeka ile yapılabilir mi | %10 |
| `founder_fit` | Kurucu profiline uygun mu | %10 |

Toplam = Σ (puan / 10 × ağırlık), 0-100 arası.

## Puan basamakları

Bir basamağa çıkmak için o basamaktaki kanıtın **bulunmuş** olması gerekir. Emin değilsen düşük olanı seç.

### pain: Problemin acısı ve sıklığı
- **0-2:** Problem anlatılıyor ama kimse şikâyet etmiyor; kanıt yok.
- **3-4:** Ara sıra yaşanan küçük bir rahatsızlık; birkaç dağınık şikâyet var.
- **5-6:** Ayda birkaç kez yaşanıyor ve can sıkıyor; birden fazla toplulukta benzer şikâyetler var.
- **7-8:** Haftalık veya günlük yaşanıyor, zaman veya para kaybettiriyor. İnsanlar el yordamıyla çözüm kurmuş (Excel, birkaç aracı birleştirme, el ile süreç).
- **9-10:** İşi durduruyor veya ciddi kayba yol açıyor. Çok sayıda bağımsız kaynakta aynı acı, ısrarla anlatılıyor.

### willingness_to_pay: Para verme isteği
"Kullanırdım", "harika fikir" gibi sözler kanıt değildir. Sadece **davranış** sayılır.
- **0-2:** Kitle ücretsiz bekliyor; bu alanda ödeme yapan neredeyse yok.
- **3-4:** Ödeme isteği varsayımsal ("ödeyebilirim" deniyor), ama kimse ödemiyor.
- **5-6:** Benzer ürünlere düşük tutarlar ödeniyor (ör. ayda 1-5 $). Rakiplerin ücretli planları var ama küçük.
- **7-8:** Kitle bugün eksik çözümlere düzenli ödeme yapıyor (abonelik, danışman, ajans, ücretli araç). Rakipler ayda 10 $ ve üzeri alıyor ve kullanıcısı var.
- **9-10:** İşletme bütçesinden ödeniyor veya doğrudan gelir ya da tasarruf getiriyor. Yüksek fiyatlı rakipler bile tercih ediliyor.

### market_room: Pazarda yer var mı
- **0-2:** Anahtar kelimede çok sayıda güçlü uygulama var (ilk 10'da çoğu 10 bin+ değerlendirme). Fark yaratmak çok zor.
- **3-4:** Birkaç güçlü oyuncu var, boşluklar küçük.
- **5-6:** Rakipler var ama şikâyetler net bir boşluk gösteriyor (ör. ilk 10'da 1-3 güçlü uygulama, gerisi zayıf veya eski).
- **7-8:** Rakipler zayıf, eski veya genel amaçlı; bu niş için özel bir çözüm yok.
- **9-10:** Neredeyse hiç özel çözüm yok ama talep kanıtlı. Talep kanıtı yoksa 9-10 verme; bu genellikle "pazar yok" demektir.

### reachability: Kitleye ucuza ulaşılabilir mi
- **0-2:** Kitlenin toplandığı belirli bir yer yok; sadece pahalı reklamla ulaşılır.
- **3-4:** Ulaşılabilir ama kalabalık kanallar üzerinden (genel sosyal medya reklamları).
- **5-6:** Kitlenin aktif olduğu belirli topluluklar var (subreddit, Facebook grubu, forum, meslek derneği).
- **7-8:** Topluluklar büyük ve aktif. Arama talebi (SEO/ASO) var ve rekabet düşük-orta. İçerikle ücretsiz ulaşılabilir.
- **9-10:** Kurucunun zaten erişimi var (takipçi, sektör ağı) veya ürün kendiliğinden yayılıyor (paylaşılan çıktı, davet).

### giant_safety: Devlerden güvenli mi
- **0-2:** Büyük bir şirketin ana ürününe bir özellik olarak eklenebilecek bir şey; ya da ChatGPT veya Gemini'nin kendisi bunu zaten yapıyor.
- **3-4:** Büyük şirketler yakın alanda; yakında yapabilirler.
- **5-6:** Genel araçlar kısmen çözüyor ama nişe özel iş akışı yok.
- **7-8:** Niş, devlerin ilgilenmeyeceği kadar küçük veya özel (sektöre özel veri, yerel mevzuat, belirli bir meslek).
- **9-10:** Dışarıdan kopyalanması zor bir avantaj var (özel veri, entegrasyon, topluluk, yerel bilgi).

### buildability: 1-2 kişi + yapay zeka ile yapılabilir mi
- **0-2:** Donanım, lisans, büyük veri seti, ağır regülasyon veya büyük satış ekibi gerekiyor.
- **3-4:** Teknik olarak çok zor ya da ilk sürüm 6 aydan uzun sürer.
- **5-6:** 3-6 ayda yapılabilir, birkaç zor parça var.
- **7-8:** Hazır servislerle 1-3 ayda ilk sürüm çıkar.
- **9-10:** Birkaç haftada çalışır bir ilk sürüm çıkar.

### founder_fit: Kurucu profiline uygun mu
- **0-2:** Kurucunun becerileri, ilgisi veya erişimiyle hiç örtüşmüyor.
- **3-4:** Gerekli becerilerin önemli bir kısmı eksik.
- **5-6:** Teknik olarak yapabilir ama alanı bilmiyor veya kitleye erişimi yok.
- **7-8:** Becerileri uygun ve alanı tanıyor ya da kitleye erişimi var.
- **9-10:** Kurucu bu kitlenin bir parçası, alanın uzmanı ve dağıtım avantajı var.

Profil yoksa `founder_fit` puanını 5 ver ve gerekçeye "profil bilgisi yok" yaz.

### İkinci bakış: Hormozi pazar ölçütleri ve Thiel tekel testi

founder-skill/founder-board'un özetlediği iki yayımlanmış çerçeve, puanları çapraz kontrol etmek için kullanılır:

- **Hormozi, *$100M Offers*: iyi pazarın 4 şartı.** Acı büyük (`pain`), alıcıların parası var (`willingness_to_pay`), kolay bulunup ulaşılıyorlar (`reachability`), pazar büyüyor (trend). Bunlardan biri belirgin şekilde zayıfsa, en iyi teklif bile kurtaramaz.
- **Thiel, *Zero to One*: küçük pazarda tekel.** Önce küçük ve belirli bir pazarı tamamen ele geçirmek, sonra genişlemek. Şunları sor: Bu ürün en iyi alternatiften açıkça (Thiel'e göre yaklaşık 10 kat) daha iyi mi, yoksa sadece biraz mı iyi? Zamanla büyüyen bir avantaj (veri, ağ etkisi, entegrasyon, marka) var mı? İlk hedeflenen pazar, liderliği ele geçirecek kadar küçük mü? Cevaplar "hayır" ise `market_room` ve `giant_safety` puanları 6'yı geçmemeli.

## Kapılar (puanı sınırlayan durumlar)

Bunlar toplamı otomatik olarak sınırlar. İyi bir bileşen, ölümcül bir zayıflığı telafi edemez.

| Durum | Toplam en fazla |
|---|---|
| `willingness_to_pay` ≤ 3 | 54 |
| `pain` ≤ 3 | 54 |
| `buildability` ≤ 3 | 54 |
| `legal_risk` = "yüksek" | 54 |
| Herhangi bir bileşen ≤ 1 | 34 |

## Karar

| Toplam | Karar |
|---|---|
| 75 ve üzeri | Güçlü: devam edin |
| 55-74 | Umut verici: önce test edin |
| 35-54 | Zayıf: pivot düşünün |
| 35'in altı | Bırakın |

## Gerçeklik kontrolü (puanı vermeden önce)

Rapor verisini kaydetmeden önce kendine şunları sor (agency-agents "Reality Checker" yaklaşımı):

- 7 veya üstü verdiğin her bileşen için gerekçede **kaynaklı** bir kanıt var mı? Yoksa puanı düşür.
- Toplam 80'in üzerinde mi çıkacak? Bu nadirdir. Kanıtları tekrar gözden geçir.
- `willingness_to_pay` gerekçesi bir **ödeme davranışına** mı dayanıyor, yoksa bir görüşe mi?
- "Pazarda hiç rakip yok" diyorsan: talep kanıtı var mı? Rakip yokluğu çoğu zaman talep yokluğudur.
- Profil yoksa `founder_fit` 5 mi?
