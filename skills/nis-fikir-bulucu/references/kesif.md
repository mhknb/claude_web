# 1. Niş keşfi

Amaç: Kurucu profiline uyan, **para veren** kitlelerin çözülmemiş ve tekrarlayan problemlerini gerçek verilerden bulmak ve 5-10 aday niş fikri puanlamak.

Kaynak yöntemler: MaxKmet/idea-validation-agents (fikir üretme, trend ve yorum madenciliği), assimovt/productskills (problem doğrulama, JTBD), allexp1/business-idea-validator (bootstrap ölçütü).

## Başlarken

Kullanıcıya bir cümleyle ne yapacağını söyle: "Profilinize göre para veren kitlelerin sorunlarını araştırıp 8 aday fikir çıkaracağım; bu biraz zaman alacak."

Kullanıcı bir alan verdiyse (ör. "evcil hayvan sahipleri") o alanda kal. Vermediyse profildeki sektör ve topluluk erişiminden başla. O da yoksa, para harcama alışkanlığı güçlü 4-6 geniş kitle seç ve önce bunları geniş tara. Örnek kitleler: küçük işletme sahipleri, serbest çalışanlar, sağlık ve hukuk gibi meslek grupları, hobisine para harcayanlar, emlakçılar, eğitmenler, içerik üreticileri.

## Adımlar

### A. Kitle ve problem taraması (geniş)

Her aday kitle için [veri-kaynaklari.md](veri-kaynaklari.md) bölüm 1'deki kaynaklarla şunları ara:
- İşlerinde veya hobilerinde tekrar tekrar yaptıkları sıkıcı, zaman alan işler
- "Hangi aracı kullanıyorsunuz" soruları ve bunlara verilen dağınık cevaplar (pazarın oturmadığının işareti)
- Excel, WhatsApp ve el ile yürütülen süreçler (el yordamıyla çözüm = acı + fırsat)
- Mevcut araçlara dair şikâyetler

Her kitle için şunu not et: bugün neye para ödüyorlar? Bu sorunun cevabı yoksa veya "hiçbir şeye" ise, kitleyi `excluded_audiences` listesine ekle ve nedenini yaz.

### B. Problemleri ön eleme

Bulduğun her problemi kısaca şu açılardan değerlendir (productskills problem doğrulama yöntemi):

| Ölçüt | Soru |
|---|---|
| Sıklık | Ne sık yaşanıyor? (günlük, haftalık, aylık) |
| Yoğunluk | Ne kadar can yakıyor? (iş durduruyor mu, para veya zaman kaybettiriyor mu) |
| El yordamıyla çözüm | İnsanlar kendi çözümünü kurmuş mu? (Excel, birkaç aracı birleştirme) |
| Ödeme | Bugün eksik bir çözüme para ödeniyor mu? |

El yordamıyla çözüm kurulmamışsa, problem büyük ihtimalle yeterince acı vermiyordur. Bunu ele.

### C. Rakip ve doygunluk kontrolü

Kalan her problem için [veri-kaynaklari.md](veri-kaynaklari.md) bölüm 2 ve 3'ü uygula: mağaza aramaları, SaaS rakipleri, en güçlü 2-3 rakibin düşük puanlı yorumları. Doygun veya devlerin hâkim olduğu alanları ele.

### D. Trend kontrolü

Bölüm 4'e göre ilginin yönüne bak. Düşen alanları ele veya puanını düşür.

### E. Fikre dönüştür ve puanla

Kalan her problem için somut bir ürün fikri yaz:
- **Dar ve net hedef kitle.** "Herkes" değil; "Türkiye'de serbest çalışan diyetisyenler" gibi.
- **Tek cümlelik ürün tanımı.**
- **Ürün tipi**, profildeki tercihe uygun.
- **Boşluk:** Rakiplerin şikâyetlerinden çıkan fark.

Sonra [puanlama.md](puanlama.md) basamaklarına göre 7 bileşeni puanla. Her adaya en az 3 kaynaklı kanıt ekle. Yasal risk seviyesini belirle (sağlık, finans, çocuk verisi, hukuk gibi alanlar en az "orta"dır).

İstenen sayıda (varsayılan 8) aday çıkar. Kanıt bulamadığın adayı listeye ekleme; az ama sağlam aday, çok ama zayıf adaydan iyidir. Sayıyı tutturamazsan nedenini `market_notes` alanına yaz.

## Çıktı

`assets/semalar/kesif.json` şemasına uygun veri hazırla ve [rapor.md](rapor.md)'ye göre raporu üret. Önerilen ek grafik: adayların trend büyüme oranlarını karşılaştıran bir bar grafiği (Trends MCP varsa).

Sohbette en iyi 3 adayı birer cümleyle özetle ve sor: "Hangisini derinlemesine doğrulayalım?"
