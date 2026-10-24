# 2. Fikir doğrulama

Amaç: Tek bir fikri derinlemesine incelemek ve kararı (devam et, test et, pivot yap, bırak) kanıtlarla vermek. Rapor, `assets/semalar/dogrulama.json` şemasındaki her bölümü doldurur.

Kaynak yöntemler: MaxKmet/idea-validation-agents (9 adımlı doğrulama, en riskli varsayım deneyi), allexp1/business-idea-validator (bootstrap yolu, devler kontrolü, bırakma ölçütleri), ferdinandobons/startup-skill (rakip kartları, April Dunford konumlandırması), assimovt/productskills (problem doğrulama, JTBD, Mom Test), phuryn/pm-skills (varsayım haritası), agency-agents (ASO, SEO, Trend Researcher).

## Başlarken

Fikir belirsizse en fazla 2 netleştirici soru sor: Kim için? Hangi problemi çözüyor? Gerisini araştırmayla bul. Keşiften geliyorsa oradaki kanıtları başlangıç noktası olarak kullan ve tekrar arama yapma.

Kullanıcının fikir hakkında söylediği her şeyi ("rakip yok", "herkes istiyor") doğrulanacak bir **varsayım** olarak ele al; doğrudan kabul etme.

## Adımlar

### 1. Problem doğrulama → `problem_validation`, `scores.pain`
- Problem gerçekten var mı? Kaynak kullanıcıların kendi sözleri olmalı; en az 3, mümkünse 5 bağımsız kaynak bul.
- Sıklık ve acı düzeyi (düşük/orta/yüksek), kanıtıyla.
- İnsanlar bugün nasıl idare ediyor? (`current_workarounds`)
- `user_quotes`: Gerçek alıntılar ve linkleri. Alıntıyı değiştirme; çeviriyorsan "(çeviri)" ekle.

### 2. Hedef kitle → `audience`, `scores.willingness_to_pay`, `scores.reachability`
2-4 segment çıkar. En iyi uyanı en başa koy. Her segment için:
- **Kim oldukları** ve **büyüklük tahmini.** Tahminin nasıl yapıldığını yaz; ör. "Türkiye'de kayıtlı 12 bin diyetisyen (kaynak) × %30 serbest çalışan = ~3.600".
- **Ödeme isteği** ve kanıtı: Bugün neye, ne kadar ödüyorlar?
- **Beklentiler** (JTBD: "... olduğunda ... yapabilmek istiyorum ki ..."): işlevsel, duygusal, sosyal.
- **Acı noktaları.**
- **Sık kullandıkları platformlar**: belirli subreddit'ler, Facebook grupları, forumlar, LinkedIn grupları, YouTube kanalları, meslek dernekleri, bültenler. Adıyla ve linkiyle. "Sosyal medya" gibi genel ifadeler yazma.
- **Doğrulandı mı?** (`validated`): Ancak bu segmentin problemi yaşadığına ve para ödediğine dair kaynaklı kanıt varsa `true`.

`excluded_segments`: Problemi yaşayan ama para vermeyecek veya ulaşılması çok pahalı olan kitleler ve nedenleri.

### 3. Rakipler → `competitors`, `scores.market_room`, `scores.giant_safety`
startup-skill rakip kartı yaklaşımı. 5-8 rakip seç: doğrudan rakipler, dolaylı rakipler ve "manuel yöntem" (Excel, WhatsApp, danışman). Her biri için:
- Fiyat (fiyat sayfasından gerçek rakamlar)
- Ölçülen veri: puan, değerlendirme sayısı, indirme sayısı, kuruluş yılı, son güncelleme
- Güçlü yanlar
- Zayıf yanlar: 1-3 yıldızlı yorumlardan, temalara ayrılmış olarak ([veri-kaynaklari.md](veri-kaynaklari.md) bölüm 3)
- Büyük şirket mi? (`is_giant`)

Devler kontrolü (allexp1): Bu ürün ChatGPT, Gemini, Claude veya büyük bir platformun ücretsiz bir özelliği olabilir mi? Olabilirse `giant_safety` puanı düşük olur. Ürünü koruyacak şey nedir: nişe özel iş akışı, yerel mevzuat, özel veri, entegrasyon veya topluluk?

### 4. Pazardaki konum → `market_position`
- Doygunluk (düşük/orta/yüksek), [veri-kaynaklari.md](veri-kaynaklari.md) bölüm 2'deki kurala göre.
- Devler bu alanda ne yapıyor?
- Trend: rakamlarla (Trends MCP, last30days veya haber kaynakları).
- Boşluk: tek cümle.
- Neden şimdi: Teknoloji, mevzuat veya davranış değişikliği. Yoksa "belirgin bir zamanlama avantajı yok" yaz.

### 5. Konumlandırma → `positioning`
April Dunford "Obviously Awesome" sırasıyla:
1. **Rekabetçi alternatifler:** Müşteri bizi kullanmazsa ne yapar? (Rakip ürün, Excel, hiçbir şey yapmamak)
2. **Sadece bizde olanlar:** Alternatiflerde olmayan özellikler veya yetenekler
3. **Değer:** Bu özelliklerin müşteriye sağladığı somut fayda; mümkünse ölçülebilir (ör. "haftada 3 saat")
4. **En iyi uyan müşteri:** Bu değeri en çok önemseyen, en dar müşteri tanımı
5. **Pazar kategorisi:** Değeri en kolay anlaşılır kılan çerçeve

Sonra konumlandırma cümlesini yaz: "[En iyi uyan müşteri] için, [alternatif]ten farklı olarak, [değer] sağlayan [kategori]." Bir de kısa slogan (`tagline`) ekle.

**Değer denklemi** (`positioning.value_equation`; Alex Hormozi, *$100M Offers*, founder-skill üzerinden): Teklifin çekiciliğini 4 açıdan 0-10 puanla. Her birinde yüksek puan iyidir:
- `dream_outcome`: Müşterinin elde edeceği sonuç ne kadar büyük ve istenen bir sonuç?
- `likelihood`: Müşteri bu sonuca ulaşacağına inanır mı? (kanıt, referans, garanti)
- `speed`: Sonuç ne kadar çabuk görülür?
- `low_effort`: Müşteriden ne kadar az çaba isteniyor?

Teklifler çoğunlukla "ulaşma ihtimali" (kanıt yok) veya "çaba" (müşteriden çok şey isteniyor) yüzünden zayıf kalır. `improvement` alanına en zayıf halkayı ve onu güçlendirmenin yolunu yaz. Sadece fiyatı düşürmek bir fark sayılmaz.

### 6. Anahtar kelimeler → `keywords`
[aso-seo.md](aso-seo.md) yöntemini uygula. Pazar tercihine göre Türkçe ve/veya İngilizce. En az 8 ASO ve 8 SEO kelimesi.

### 7. İş modeli → `business`, `scores.buildability`
- **Fiyat modeli** ve nedeni: abonelik, tek seferlik, kullanım başı, freemium.
- **Önerilen fiyat:** Rakip fiyatlarıyla karşılaştırarak. Profesyonel ve B2B kitleye düşük fiyat koyma.
- **Kullanıcı başı aylık maliyet:** Yapay zeka API'si (kullanıcı başına tahmini istek × fiyat), sunucu, mağaza komisyonu (App Store/Play genelde %15-30), ödeme altyapısı. Hesabı açık yaz.
- **Brüt kâr marjı.**
- **Hedef için gereken müşteri:** Profildeki aylık gelir hedefi ÷ (fiyat × (1 − kesintiler)). Profil yoksa ayda 5.000 $ varsay ve bunu belirt.
- **Müşteri edinme maliyeti:** Kanal bazında kaba tahmin; içerik ve topluluk gibi ücretsiz kanallar varsa onları öne çıkar.

**Birim ekonomisi** (`unit_economics`; yaklaşım founder-skill/founder-cfo'dan uyarlandı). Yukarıdaki metin alanlarına ek olarak sayısal girdileri doldur. Hesabı sen yapma; `scripts/rapor.py` (veya şablon) başa baş noktasını, 12 aylık tabloyu, gereken nakdi, geri ödeme ayını ve "ya şöyle olursa" senaryolarını hesaplar.

| Alan | Ne yazılır |
|---|---|
| `para_birimi` | TL veya $ (raporun geneliyle aynı) |
| `birim` | Bir satış birimi, ör. "ödeme yapan diyetisyen-ay", "aylık abone" |
| `fiyat` | Birim başına aylık fiyat (vergi hariç). Tek seferlik satışta aylık ortalamaya çevir ve `notlar` alanında açıkla. |
| `degisken` | **Bir birimin** aylık maliyet kalemleri: yapay zeka API'si (kullanım × birim fiyat), sunucu payı, mağaza komisyonu (fiyat × oran), ödeme altyapısı komisyonu |
| `sabit_aylik` | Satıştan bağımsız aylık giderler: yazılım araçları, alan adı, muhasebe, (varsa) kurucu maaşı |
| `baslangic` | Bir kerelik harcamalar: geliştirme dışarıdan alınıyorsa, tasarım, hukuk ve KVKK danışmanlığı, lansman reklamı |
| `aylik_rampa` | İlk 12 ayın her birinde **gerçekçi** ödeme yapan müşteri sayısı. Küçük ekip için yavaş başlar; ilk ay genelde tek haneli. |
| `hedef_aylik_kar` | Profildeki aylık gelir/kâr hedefi |

Her kalemin `kaynak` alanına bir link (fiyat sayfası, komisyon oranı sayfası) ya da "tahmin: <gerekçe>" yaz. Tahmini gerçek gibi sunma. Komut çıktısındaki `uyarilar` listesini (ör. "her satış zarar ediyor", "12 ayda geri ödeme yok") özet ve risklerde mutlaka kullan.

### 8. İlk sürüm (MVP) → `mvp`
Shape Up yaklaşımıyla: problemi çözen **en küçük** ürün. 3-6 olmazsa olmaz özellik. "Şimdilik yapılmayacaklar" listesi en az olmazsa olmazlar kadar uzun olsun. 1-2 kişi + yapay zeka için gerçekçi süre ve teknoloji önerisi.

### 9. Riskler → `risks`, `legal_risk`
Her risk türünü değerlendir:
- **Yasal:** KVKK/GDPR (kişisel veri, özellikle sağlık verisi), sağlık iddiaları, finansal tavsiye, çocuk verisi, telif, App Store ve Google Play kuralları (abonelik, yapay zeka içerikleri). Yerel mevzuatı tarihli kaynakla doğrula.
- **Platform bağımlılığı:** Tek bir API'ye, mağazaya veya platform politikasına bağımlılık.
- **Dev şirketler:** 3. adımdaki kontrolün sonucu.
- **Teknik:** Yapay zeka çıktısının doğruluğu ne kadar önemli? Hatanın bedelini kim öder?
- **Pazar:** Mevsimsellik, küçük pazar, yüksek müşteri kaybı.

Her riskin önem derecesi ve azaltma yolu olsun.

### 10. Test planı → `validation_plan`
phuryn/pm-skills ve MaxKmet "en riskli varsayım testi" yaklaşımı:
1. Fikrin dayandığı varsayımları listele (talep, ödeme, ulaşılabilirlik, yapılabilirlik).
2. **En riskli** olanı seç: Yanlışsa fikri öldürecek ve en az kanıtı olan varsayım. Genellikle ödeme isteğidir.
3. Kod yazmadan, **2 hafta ve 100 $ altında** bir deney tasarla. Örnekler: ön satışlı tanıtım sayfası, el ile yürütülen hizmet (concierge), "yakında" butonuyla ilgi ölçme (fake door), hedef topluluklarda Mom Test görüşmeleri.
4. Sayısal başarı ölçütü koy (ör. "300 ziyaretçiden en az 15 ön kayıt ve 3 ön ödeme").
5. **İlk 100 kullanıcı:** 2. adımdaki platformlardan, kanal başına somut bir taktik.
6. **Bırakma ölçütleri:** Sayısal ve tarihli (ör. "6 hafta içinde 5 ödeme yapan müşteri bulunamazsa bırak").

Görüşme önerirken Mom Test kurallarını hatırlat: Fikri anlatma; geçmiş davranışı sor ("En son ne zaman ... yaşadınız? Nasıl çözdünüz? Ne kadar harcadınız?"). Gelecekle ilgili "kullanır mıydınız?" sorularına verilen yanıtlar kanıt sayılmaz.

### 11. Puan ve özet → `scores`, `summary`
[puanlama.md](puanlama.md) basamaklarına göre puanla, her puanın **güven düzeyini** yaz ve oradaki gerçeklik kontrolünü uygula. Karar "Belirsiz" çıkarsa, test planını güveni düşük bileşenleri ölçecek şekilde kur ve özette bunu açıkça söyle. `summary.verdict_reason` içinde kararın gerekçesini 3-4 cümleyle yaz. `biggest_risk` tek bir cümle olsun. `next_action` somut bir adım olsun (ör. "Bu hafta r/dietetics'te 10 kişiyle Mom Test görüşmesi").

`pivot_hints`: Puan 55'in altındaysa hangi 1-2 değişkenin değişmesi işe yarayabilir?
`data_gaps`: Doğrulayamadığın her şey.
`sources`: Kullandığın başlıca kaynaklar, başlık ve linkle.

## Önerilen ek grafikler (`ek_grafikler`)

Sadece **gerçek veri** varsa ekle:
- Rakiplerin değerlendirme sayıları veya puanları (bar)
- Anahtar kelime trendleri (line, Trends MCP)
- Yorum şikâyet temalarının dağılımı (bar veya doughnut; tema başına yorum sayısı)
- Fiyat karşılaştırması (bar)

Örnek yapılar için bkz. [rapor.md](rapor.md).

## Bitiş

Sohbette kısa özet ver: karar ve puan, 2 güçlü yan, en büyük risk, test planının ilk adımı ve raporun yolu. Puan 55'in altındaysa pivot önerisinde bulun.

## Sonraki aşama: founder-skill'e devir (kuruluysa)

Puan **55 ve üzeriyse** (Umut verici veya Güçlü) fikir, "işe dönüştürme" aşamasına hazırdır. Ortamda [founder-skill](https://github.com/Jakeschincariol/founder-skill) paketi kuruluysa (`founder-board`, `founder-offer`, `founder-cfo` vb. skill'ler listede görünüyorsa), kullanıcıya şu sırayı öner. Kullanıcı onaylamadan başlatma:

1. `founder-board`: Üç bakış açısıyla (Hormozi teklif, Thiel tekel, Jobs ürün) ikinci görüş.
2. `founder-offer`: Teklif paketi (bonuslar, garanti, isim). Değer denklemindeki en zayıf halkadan başla.
3. `founder-cfo`: Daha ayrıntılı kâr hesabı. Bu rapordaki `unit_economics` girdilerini başlangıç noktası olarak ver.
4. `founder-brand`: İsim, marka tescili, alan adı ve sosyal medya kullanıcı adı kontrolleri.
5. `founder-marketing` ve `founder-launch`: Lansman kampanyası ve takvimi. Bu rapordaki "İlk 100 kullanıcı" ve test planıyla tutarlı olmalı.
6. `founder-plan`: Hepsini tek iş planında birleştirir.

Devrederken bu raporun JSON dosyasının yolunu ve şu bilgileri aktar: en iyi uyan müşteri, rakipler ve şikâyetleri, fiyat önerisi, birim ekonomisi girdileri, en riskli varsayım. founder-skill kendi çıktılarını çalışma klasöründeki `founder/` altına yazar.

**Sanal alıcı paneli (`founder-consumer`) hakkında:** Bu panel, yapay zekanın canlandırdığı sanal müşterilerden oluşur; **gerçek veri değildir.** Sadece kullanıcı açıkça isterse çalıştır. İtirazları ve teklif fikirlerini keşfetmek için kullan; sonuçlarını hiçbir zaman ödeme isteğinin kanıtı sayma ve puanlara yansıtma. Rapora eklersen `ek_bolumler` içinde, başlıkta "Simülasyon (gerçek veri değil)" yazarak ekle. Panel çok sayıda alt ajan çalıştırdığı için maliyetlidir; önce `--quick` (20 alıcı) ile başlamayı öner.

founder-skill kurulu değilse kurmaya zorlama; README'deki kurulum adımlarını hatırlatmak yeterli.
