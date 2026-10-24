# Yayın kanalları ve kitap başı kazanç

Bu sayfadaki bilgiler **yön göstermek içindir**. Telif oranları, fiyat aralıkları, baskı maliyetleri ve kurallar sık değişir. Kaynaklar arasında da çelişki vardır: 2026'da bazı kaynaklar KDP e-kitap %70 telif aralığının üst sınırının 9,99 $'dan 12,99 $'a çıktığını söylüyor, KDP'nin kendi sayfaları ise hâlâ eski rakamı gösterebiliyor. Bu yüzden **her analizde** güncel resmi sayfayı kontrol et ve `kaynak` alanına linkini yaz.

## İngilizce: Amazon KDP

Kontrol edilecek resmi sayfalar:
- KDP e-kitap telif seçenekleri ve fiyat aralıkları ("eBook Royalty", "List Price Requirements")
- KDP basılı kitap telifi ve baskı maliyeti ("Paperback Royalty", "Printing Costs")
- KDP içerik yönergeleri ve yapay zeka beyanı ("Content Guidelines", "AI-generated content")
- KDP dil listesi ("Supported Languages")

Genel yapı (her seferinde güncel rakamla doğrula):
- **E-kitap:** İki telif seçeneği var (yaklaşık %35 ve %70). Yüksek oran yalnızca belirli bir fiyat aralığında geçerli ve dosya boyutuna göre bir teslimat ücreti düşülüyor.
- **Basılı kitap:** Kopya başı kazanç = liste fiyatı × telif oranı − baskı maliyeti. Baskı maliyeti sayfa sayısına, renge ve pazara göre değişir. Bazı kaynaklar belirli bir fiyatın altında daha düşük telif oranı uygulandığını söylüyor; kontrol et.
- **Kindle Unlimited:** Okunan sayfa başına ödeme; aylık fon değişkendir. Tahminlerde ana gelir kalemi yapma.
- **Yapay zeka beyanı:** Yapay zekayla üretilen metin, görsel ve çevirinin beyan edilmesi gerekir. Yapay zekayla yalnızca düzenleme ve fikir alma için beyan gerekmeyebilir. Güncel kuralı resmi sayfadan oku. Beyan etmemek kitabın kaldırılmasına ve hesabın kapatılmasına yol açabilir.

## Türkçe

Amazon KDP'nin resmi dil listesinde Türkçe yok; listeyi yine de kontrol et. Kanallar (güncel koşulları her seferinde araştır):
- **E-kitap:** Google Play Kitaplar İş Ortağı Merkezi; yerli e-kitap platformları
- **Basılı:** Talep üzerine baskı yapan matbaalar ve hizmetler; yayınevleriyle anlaşma (telif genellikle düşüktür); Kitapyurdu, D&R ve Trendyol gibi pazar yerlerinde satış
- **Doğrudan satış:** Kendi sitenizden PDF veya basılı kitap (Shopier, iyzico gibi ödeme altyapıları); en yüksek kâr payı ama tanıtım tamamen size kalır
- **Yükümlülükler:** ISBN (Kültür ve Turizm Bakanlığı ISBN Türkiye Ajansı), basılı kitapta bandrol, yayıncı kaydı. Kuralları resmi kaynaktan kontrol et ve emin olamadığını `data_gaps` alanına yaz.

## Kazanç girdileri (`kazanc`)

| Alan | Ne yazılır |
|---|---|
| `para_birimi` | $ veya TL |
| `formatlar` | Her format için: `format`, `platform`, `liste_fiyati`, `telif_orani` (0-1), `baski_maliyeti` (basılıysa kopya başı), `kesintiler` (teslimat ücreti, ödeme komisyonu), `pay` (satışların bu formattan gelen tahmini payı), `kaynak` (resmi sayfa linki) |
| `baslangic` | Bir kerelik masraflar: editör, düzelti, kapak, ISBN, reklam, ön okuma kopyaları |
| `aylik_satis_senaryolari` | En az 3 senaryo (düşük, orta, yüksek), tüm formatların toplam aylık satışı. Rakiplerin satış sıralamalarından gerekçelendir; gerekçeyi `notlar` alanına yaz. |
| `hedef_aylik_gelir` | Profildeki hedef (varsa) |

Satış adetleri **tahmindir**. Satış sıralamasını adet tahminine çeviren resmi bir formül yoktur. Kullandığın aracı veya mantığı `notlar` alanında açıkla ve rakamları temkinli tut.
