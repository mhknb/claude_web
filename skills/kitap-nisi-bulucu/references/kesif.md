# 1. Kitap nişi keşfi

Amaç: Yazar profiline uyan, gerçek talebi olan, mevcut kitapların iyi hizmet etmediği ve yapay zekanın bedava veremeyeceği değeri olan 5-8 **spesifik** bilgi/rehber kitap fikri bulmak.

## Başlarken

Bir cümleyle ne yapacağını söyle. Kullanıcı bir alan verdiyse o alanda kal. Vermediyse profildeki uzmanlık ve deneyimden başla; kitap türünde en güçlü avantaj yazarın kendi deneyimidir.

Taramaya başlamadan önce aklına ilk gelen 3 kitap fikrini not et ve bunları bilerek dışarıda bırak. İlk akla gelenler genellikle herkesin yazdığı konulardır.

## Niş bulma açıları

Geniş bir alanı şu açılarla daralt (her biri yeni bir niş üretir):
- **Kim için?** Meslek, yaş grubu, yaşam durumu (yeni anne, emekli, göçmen, bakım veren, yeni teşhis almış)
- **Hangi durumda?** Belirli bir olay veya geçiş (taşınma, iş değiştirme, ilk işletme, boşanma, sınav)
- **Nerede?** Ülke, şehir, sistem (Türkiye'deki kurallar, Almanya'daki Türkler, ABD'deki göçmenler)
- **Hangi seviyede?** Yeni başlayan, ileri seviye, profesyonel
- **Hangi biçimde?** Adım adım rehber, çalışma kitabı, başvuru kitabı, vaka kitabı, sınav hazırlık

## Adımlar

### A. Aday nişleri çıkar
Profil ve verilen alandan 15-25 ham niş çıkar. Her biri "kim için + hangi sorun + hangi bağlam" içersin.

### B. Hızlı talep taraması
Her ham niş için [veri-kaynaklari.md](veri-kaynaklari.md) bölüm 1'deki kaynaklarla hızlı kontrol: Amazon (veya Türkçe platformlar) önerilerinde çıkıyor mu, ilk sonuçlarda satan kitap var mı, topluluklarda kitap soruluyor mu? Talep izi olmayanları ele ve `excluded_niches` alanına nedeniyle yaz.

### C. Rekabet ve boşluk kontrolü
Kalanlar için ilk 10 kitaba ve okur şikâyetlerine bak (bölüm 2). Büyük yayınevlerinin ve binlerce yorumlu kitapların hâkim olduğu, okurların memnun olduğu nişleri ele.

### D. Yapay zeka testi
Bilgisi genel ve kolayca bulunabilir olan nişleri ele veya açısını değiştir (bölüm 3).

### E. Kitap fikrine dönüştür ve puanla
Kalan her niş için:
- Çalışma başlığı ve alt başlık (spesifik, okurun sorununu ve vaadini içeren)
- Kitap türü, dil, ana satış platformu
- Hedef okur, okurun sorunu (onun diliyle), neden satın aldığına dair kanıt
- Rakip durumu ve boşluk
- En az 3 kaynaklı kanıt
- [puanlama.md](puanlama.md)'ye göre 7 bileşen puanı ve **güven düzeyi**
- Hassas konu (`ymyl`) mu, yayın/yasal risk (`policy_risk`), en büyük risk

### Çeşitlilik kuralı
- Aynı okur kitlesinden en fazla 2 aday.
- En az 3 farklı okur tipi (meslek, yaşam olayı, hobi/ilgi, yer/göç gibi).
- En az 2 farklı kitap türü (ör. rehber ve çalışma kitabı).
- Pazar "İkisi" ise hem Türkçe hem İngilizce adaylar.

Kanıt bulamadığın adayı listeye ekleme. Az ama sağlam aday, çok ama zayıf adaydan iyidir.

## Çıktı

`assets/semalar/kesif.json` şemasına uygun veri hazırla ve [rapor.md](rapor.md)'ye göre raporu üret. Gerçek veri varsa ek grafik öner: adayların Amazon önerisi sayısı, ilk 10'da satan kitap sayısı veya trend büyümesi.

Sohbette en iyi 3 adayı birer cümleyle özetle ve sor: "Hangisini derinlemesine doğrulayalım?"
