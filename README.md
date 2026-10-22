# Niş Fikir Bulucu

Gerçek verilere bakarak küçük bir ekibin (1-2 kişi + yapay zeka) yapıp satabileceği, kârlı niş ürün fikirleri bulan, bu fikirleri doğrulayan ve gerekirse yeniden konumlandıran bir araç. Bilgisayarınızda çalışır, tarayıcıdan kullanılır.

## Ne yapar?

1. **Profil:** Becerilerinizi, bütçenizi, ayırabileceğiniz zamanı, gelir hedefinizi ve pazarı (Türkiye / Global / ikisi) girersiniz. Fikirler buna göre süzülür.
2. **Niş keşfi:** Para veren kitlelerin çözülmemiş problemlerini arar. Doymuş pazarları, devlerin hâkim olduğu alanları ve para vermeyen kitleleri eler. Kalan aday fikirleri kanıt linkleriyle puanlar.
3. **Doğrulama:** Seçtiğiniz fikir ya da kendi fikriniz için tam bir rapor hazırlar:
   - karar ve 100 üzerinden puan
   - problem doğrulama ve kullanıcıların kendi sözleri
   - hedef kitle segmentleri, beklentileri ve sık kullandıkları platformlar
   - rakipler: fiyat, puan, indirme sayısı ve kullanıcı şikâyetleri
   - pazardaki konum ve konumlandırma (April Dunford yöntemi)
   - ASO ve SEO anahtar kelimeleri (Türkçe ve İngilizce)
   - gelir ve maliyet hesabı, riskler (yasal, platform, büyük şirketler)
   - kod yazmadan önce yapılacak test, ilk 100 kullanıcıya ulaşma yolları ve "şu olursa bırakın" ölçütleri
4. **Pivot:** Puanı düşük çıkan fikir için 1-2 değişkeni değiştiren 2-3 alternatif önerir. Her alternatif tek tıkla yeniden doğrulanabilir.
5. **Geçmiş:** Bütün analizler bilgisayarınızda (`data/` klasörü) saklanır. Markdown, JSON veya PDF olarak dışa aktarılabilir.

## Kullandığı veri kaynakları

| Kaynak | Ne için | Ücret |
|---|---|---|
| [NVIDIA NIM](https://build.nvidia.com) | Yapay zeka modeli (varsayılan GLM 5.2) | Ücretsiz, dakikada yaklaşık 40 istek sınırı |
| Sayfa okuma (uygulamanın kendisi) | Bulunan sayfaların içeriğini okuma | Ücretsiz |
| App Store ve Google Play | Rakipler, puanlar, indirme sayıları, 1-3 yıldızlı yorumlar | Ücretsiz |
| Google ve Google Play otomatik tamamlama | İnsanların gerçekten aradığı kelimeler (SEO/ASO) | Ücretsiz |
| [RivalSearchMCP](https://github.com/damionrashford/RivalSearchMCP) | Web araması, Reddit, Hacker News, Product Hunt, haberler | Ücretsiz |
| [Trends MCP](https://github.com/trendsmcp-ai/Trends-MCP) | Google, TikTok, YouTube, Amazon trendleri | Ayda 100 sorgu ücretsiz (isteğe bağlı) |

Yöntem şu açık kaynak projelerden derlendi: [idea-validation-agents](https://github.com/MaxKmet/idea-validation-agents), [business-idea-validator](https://github.com/allexp1/business-idea-validator-AI-skill), [startup-skill](https://github.com/ferdinandobons/startup-skill), [productskills](https://github.com/assimovt/productskills), [pm-skills](https://github.com/phuryn/pm-skills).

## Mac'e kurulum (bir kez)

1. **Node.js kurun:** [nodejs.org](https://nodejs.org) adresinden "LTS" sürümünü indirip kurun. Homebrew kullanıyorsanız `brew install node` da olur.
2. **Projeyi indirin:** Terminal'i açıp şunları yazın:
   ```bash
   git clone https://github.com/mhknb/claude_web.git
   cd claude_web
   git checkout claude/niche-product-idea-tool-gn4r1e
   npm install
   ```
3. **Anahtarları girin:**
   ```bash
   cp .env.example .env
   open -e .env
   ```
   Açılan dosyada `NVIDIA_API_KEY=` satırına NVIDIA anahtarınızı yapıştırın. Anahtarı ücretsiz olarak [build.nvidia.com](https://build.nvidia.com) adresinden alabilirsiniz: giriş yapın, sağ üstteki profilden **API Keys** bölümüne gidin. Anahtar `nvapi-` ile başlar.

   Trend verisi istiyorsanız [trendsmcp.ai](https://www.trendsmcp.ai/account) adresinden ücretsiz anahtar alıp `TRENDSMCP_API_KEY=` satırına yapıştırın. Dosyayı kaydedin.

## Kullanım

```bash
cd claude_web
npm start
```

Sonra tarayıcıda **http://localhost:3000** adresini açın. Kapatmak için Terminal'de `Ctrl + C` tuşlarına basın.

- Bir analiz 15-30 dakika sürer. Sayfayı kapatsanız bile analiz devam eder, sonra **Geçmiş** sekmesinden açabilirsiniz. Terminal açık kalmalı ve Mac uykuya geçmemeli.
- Sayfanın üstündeki işaretler hangi veri kaynaklarının açık olduğunu gösterir.

## Model seçimi ve hız

- Varsayılan model **GLM 5.2**. Sayfadaki "Model" kutusundan GLM 5.3 Flash, DeepSeek V4 ya da NVIDIA hesabınızda açık olan başka bir model seçilebilir. Seçilen modelin araç kullanabilmesi (tool calling) gerekir.
- NVIDIA'nın ücretsiz katmanında dakikada yaklaşık 40 istek sınırı var. Uygulama istekleri buna göre aralıklı gönderir. Bu yüzden bir analiz 15-30 dakika sürebilir.
- NVIDIA sunucuları yoğunken yanıtlar gecikebilir. Analiz hata verirse "Yeniden başlat" butonunu kullanın ya da daha hızlı bir model (GLM 5.3 Flash) seçin.
- "Araştırma derinliği: Derin" seçeneğinde model düşünerek çalışır. Daha iyi sonuç verir ama daha yavaştır.

## Bilmeniz gerekenler

- Bu araç karar vermenize yardım eder, kararı sizin yerinize vermez. Raporlardaki her önemli bilginin yanında kaynak linki vardır; önemli kararlardan önce linkleri kontrol edin. Doğrulanamayan konular raporun "Doğrulanamayanlar" bölümünde listelenir.
- Model raporu yanlış biçimde verirse uygulama düzeltmesini ister. Yine de eksik kalan alanlar "Veri bulunamadı" olarak gösterilir ve adımlar listesinde belirtilir.
- Puanı yapay zeka değil kod hesaplar: yapay zeka 7 bileşene 0-10 arası puan verir, toplam puan ve karar ağırlıklı ortalamayla bulunur. Para verme isteği, problemin acısı veya yapılabilirlik çok düşükse ya da yasal risk yüksekse puan otomatik olarak sınırlanır.
- Uygulama yalnızca sizin bilgisayarınızdan erişilebilir (`127.0.0.1`). Ağdaki başka cihazlar açamaz.
- Bazı mağaza verileri (Google Play gibi) resmi olmayan yollarla okunur. Bir kaynak çalışmazsa analiz o kaynak olmadan devam eder ve durum adımlar listesinde görünür.
