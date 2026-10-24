# Niş Fikir Bulucu ve Kitap Nişi Bulucu (AI agent skill'leri)

Bu repoda iki skill var. İkisi de gerçek verilere bakar, sonucu tablolu ve grafikli bir **HTML rapor** olarak verir ve skill'i çalıştıran yapay zekayla (Claude, Claude Code, ChatGPT/Codex, Gemini, Hermes vb.) çalışır. **Ayrı bir API anahtarı gerekmez.**

| Skill | Ne bulur |
|---|---|
| [`nis-fikir-bulucu`](skills/nis-fikir-bulucu) | Küçük bir ekibin (1-2 kişi + yapay zeka) yapıp satabileceği **kârlı niş ürün fikirleri** (mobil uygulama, SaaS, yapay zeka aracı); doğrulama ve yeniden konumlandırma |
| [`kitap-nisi-bulucu`](skills/kitap-nisi-bulucu) | Satılabilir, **niş ve spesifik bilgi/rehber kitap başlıkları** (Türkçe veya İngilizce; Amazon KDP, Kitapyurdu, D&R, Google Play Kitaplar); doğrulama, başlık ve anahtar kelime önerileri, kitap başı kazanç |

İki skill de puanı kodla hesaplar. Her puanın yanında bir **güven düzeyi** vardır: kanıt zayıfsa karar "Zayıf" değil **"Belirsiz: önce test edin"** olur. Böylece "bilmiyoruz" ile "kötü" birbirine karışmaz.

---

# Niş Fikir Bulucu

## Ne yapar?

| Adım | Ne istersiniz | Ne alırsınız |
|---|---|---|
| **Profil** | İlk kullanımda birkaç soruya cevap verirsiniz | Fikirler becerilerinize, bütçenize ve hedefinize göre süzülür |
| **Niş keşfi** | "Bana niş fikir bul" veya "evcil hayvan sahipleri için fikir bul" | 5-10 aday fikir, kanıt linkleri, puan matrisi ve karşılaştırma grafiği |
| **Doğrulama** | "Şu fikri doğrula: ..." | Tam rapor (ayrıntısı aşağıda) |
| **Pivot** | "Puan düşük, yeniden konumlandır" | 2-3 alternatif, kök neden analizi, radar grafik karşılaştırması |

Doğrulama raporunda şunlar bulunur:
- karar ve 100 üzerinden puan
- problemin gerçekliği ve kullanıcıların kendi sözleri
- doğrulanmış hedef kitle segmentleri, beklentileri ve **sık kullandıkları platformlar**
- rakipler: fiyat, puan, indirme sayısı ve şikâyetler
- pazardaki konum ve trend, konumlandırma cümlesi ve slogan
- **ASO ve SEO anahtar kelimeleri** (Türkçe ve İngilizce)
- gelir ve maliyet hesabı; **birim ekonomisi**: başa baş noktası, 12 aylık kâr/zarar ve nakit grafiği, gereken sermaye, "ya fiyat düşerse" senaryoları
- teklifin çekiciliği (değer denklemi), ilk sürüm (MVP) kapsamı
- riskler (yasal, platform, büyük şirketler)
- kod yazmadan önce yapılacak test, ilk 100 kullanıcıya ulaşma yolları ve "şu olursa bırakın" ölçütleri

Puanı yapay zeka değil kod hesaplar. Para verme isteği veya problemin acısı çok zayıfsa ya da yasal risk yüksekse puan otomatik olarak sınırlanır. Böylece yapay zeka fikri gereğinden fazla överemez.

## Hangi ortamda ne kadar çalışır?

| Özellik | Gerektirdiği | Yoksa |
|---|---|---|
| Web araması | Yapay zekanın kendi web araması | **Zorunlu.** Skill gerçek veriye bakamayacağını söyler. |
| App Store ve Google Play verisi, Google / YouTube / App Store önerileri | Kod çalıştırma (Claude Code, Codex, Gemini CLI, claude.ai'de kod çalıştırma) | Web aramasıyla toplanır, daha az ayrıntılı olur |
| Rapor üretme | Kod çalıştırma | Yapay zeka şablona veriyi kendisi yerleştirir |
| Reddit, X, YouTube, TikTok tartışmaları (son 30 gün) | İsteğe bağlı [last30days](https://github.com/mvanhorn/last30days-skill) skill'i | Web aramasıyla yapılır |
| Platform erişimi (Reddit, YouTube altyazıları, X, LinkedIn) | İsteğe bağlı [Agent-Reach](https://github.com/Panniantong/Agent-Reach) | Web aramasıyla yapılır |
| Topluluk ve haber araması | İsteğe bağlı [RivalSearch MCP](https://github.com/damionrashford/RivalSearchMCP) (ücretsiz) | Web aramasıyla yapılır |
| Google, TikTok ve Amazon trend verisi | İsteğe bağlı [Trends MCP](https://github.com/trendsmcp-ai/Trends-MCP) (ayda 100 sorgu ücretsiz) | Trend yorumu haberlere dayanır |

| Fikri işe dönüştürme: teklif, marka, lansman, iş planı | İsteğe bağlı [founder-skill](https://github.com/Jakeschincariol/founder-skill) | Skill doğrulamada durur |

**En iyi sonuç:** Claude Code (veya benzeri, kod çalıştırabilen bir araç) + last30days + RivalSearch MCP.


---

# Kitap Nişi Bulucu

Yazarın uzmanlığına ve deneyimine uyan, gerçek talebi olan ve mevcut kitapların iyi hizmet etmediği **spesifik bilgi ve rehber kitapları** bulur.

**Ne yapar?**
- **Keşif:** "Ne hakkında kitap yazsam?" sorusuna 5-8 aday kitap. Her biri için çalışma başlığı ve alt başlık, okur, talep kanıtı, rakip kitapların durumu, boşluk ve puan veriliyor. Adaylar puan matrisinde karşılaştırılıyor.
- **Doğrulama:** Seçilen kitap fikri için tam rapor:
  - okur kitlesi ve toplandığı yerler
  - talep kanıtı: Amazon arama önerileri ve satış sıralamaları
  - rakip kitaplar ve okur şikâyetleri, yapay zekaya dayanıklılık
  - 3-5 başlık ve alt başlık seçeneği, 7 anahtar kelime, kategoriler, açıklama metni
  - içindekiler taslağı, format, fiyat ve kapak tarifi
  - **kitap başı kazanç** ve satış senaryoları
  - alternatif açılar, riskler (yayın politikası, yapay zeka beyanı, hassas konular), yayın planı ve yazmadan önceki test

**Güncel durumla ilgili bilinmesi gerekenler** (skill bunları her analizde resmi kaynaktan yeniden kontrol eder):
- Amazon KDP, yapay zekayla üretilen içeriğin beyan edilmesini istiyor ve günlük yeni kitap sınırı uyguluyor.
- KDP'nin resmi dil listesinde Türkçe yok. Türkçe kitaplar için Google Play Kitaplar, Kitapyurdu, D&R, talep üzerine baskı ve doğrudan satış yolları değerlendirilir.
- Telif oranları ve fiyat aralıkları 2026'da değişmiş olabilir. Skill bu rakamları hafızadan yazmaz, güncel sayfadan alır.

**Kullanım örnekleri:**
- "Ne hakkında kitap yazsam? 15 yıllık yoğun bakım hemşiresiyim."
- "Almanya'daki Türkler için niş kitap fikirleri bul."
- "Şu kitap fikrini doğrula: yeni teşhis almış tip 1 diyabetli çocukların ebeveynleri için ilk 90 gün rehberi."

Raporlar çalışma klasöründeki `kitap-raporlari/` altına kaydedilir.

---

## Kurulum

Aşağıdaki adımlar iki skill için de geçerlidir.

### Claude Code

```bash
claude plugin marketplace add mhknb/claude_web
claude plugin install nis-fikir-bulucu@nis-fikir-bulucu
```

Eklenti iki skill'i birlikte kurar. Ya da elle: `skills/nis-fikir-bulucu` ve `skills/kitap-nisi-bulucu` klasörlerini `~/.claude/skills/` altına kopyalayın.

### Claude (claude.ai web ve masaüstü uygulaması)

1. Bu repoyu indirin ve `skills` klasöründe şu komutları çalıştırın: `zip -r nis-fikir-bulucu.zip nis-fikir-bulucu` ve `zip -r kitap-nisi-bulucu.zip kitap-nisi-bulucu`
2. Claude'da **Ayarlar → Yetenekler (Capabilities) → Skills → Skill yükle** bölümünden zip dosyalarını yükleyin.
3. Ayarlarda **kod çalıştırma** ve **web araması** açık olmalı.

### Codex, Gemini CLI, Cursor, OpenCode ve diğer Agent Skills destekleyen araçlar

```bash
npx skills add mhknb/claude_web -g
```

Ya da `skills/` altındaki klasörleri aracınızın skill klasörüne kopyalayın.

### ChatGPT ve skill desteği olmayan araçlar

`skills/nis-fikir-bulucu/SKILL.md` dosyasının içeriğini talimat olarak verin. `references/` dosyalarını ve şablonu da yükleyin. Kod çalıştırma yoksa rapor, şablona veri yerleştirilerek üretilir.

### GLM Coding Plan ile kullanım

GLM Coding Plan aboneliği yalnızca desteklenen araçlarda (Claude Code, OpenCode, Cline vb.) kullanılabilir ([z.ai SSS](https://docs.z.ai/devpack/faq)). Bu skill'i o araçların içinde çalıştırmak bu kurala uygundur. Bu durumda web araması için z.ai'nin planla gelen web arama aracını [z.ai belgelerine](https://docs.z.ai/devpack/overview) göre ekleyin, ya da RivalSearch MCP kullanın.

## İsteğe bağlı veri araçları

Hiçbiri zorunlu değil. Kuruluysa skill onları otomatik kullanır.

- **Google Play verisi:** `pip install google-play-scraper`
- **last30days:** Claude Code'da `/plugin marketplace add mvanhorn/last30days-skill` ve ardından `/plugin install last30days`; diğer araçlarda `npx skills add mvanhorn/last30days-skill -g`
- **Agent-Reach:** [Kurulum rehberi](https://github.com/Panniantong/Agent-Reach). Reddit ve X için tarayıcı girişi gerekir.
- **RivalSearch MCP:** Claude Code'da `claude mcp add RivalSearchMCP --url https://RivalSearchMCP.fastmcp.app/mcp`
- **founder-skill:** Claude Code'da `/plugin marketplace add Jakeschincariol/founder-skill` ve ardından `/plugin install founder-skill@founder-skill`. İyi puan alan bir fikirden sonra skill, teklif, kâr, marka ve lansman adımları için bu paketi önerir. İçindeki sanal alıcı paneli gerçek veri değildir; skill onu sadece siz isterseniz ve "simülasyon" etiketiyle kullanır.
- **Trends MCP:** [trendsmcp.ai](https://www.trendsmcp.ai/account) adresinden ücretsiz anahtar alıp kendi sayfasındaki adımlarla ekleyin.

## Kullanım örnekleri (Niş Fikir Bulucu)

- "Niş fikir bul. Türkiye pazarı, 2 kişiyiz, biri yazılımcı."
- "Serbest çalışan muhasebeciler için SaaS fikri bul."
- "Şu fikri doğrula: diyetisyenler için danışan yemek fotoğraflarını yapay zekayla analiz eden mobil uygulama."
- "Bu raporu B2B'ye kaydırarak yeniden konumlandır."

Raporlar çalışma klasöründeki `nis-raporlari/` altına kaydedilir: veri `.json`, rapor `.html` olarak. HTML raporu tarayıcıda açılır, yazdırılabilir ve paylaşılabilir.

## Klasör yapısı

```
skills/
├── nis-fikir-bulucu/
│   ├── SKILL.md             # ana talimatlar
│   ├── references/          # keşif, doğrulama, pivot, puanlama, veri kaynakları, ASO/SEO, rapor
│   ├── scripts/
│   │   ├── veri.py          # App Store / Google Play / öneriler / sayfa okuma
│   │   └── rapor.py         # veri kontrolü, puan, birim ekonomisi, HTML rapor
│   └── assets/              # rapor şablonu ve veri şemaları
└── kitap-nisi-bulucu/
    ├── SKILL.md
    ├── references/          # keşif, doğrulama, puanlama, veri kaynakları, başlık ve anahtar kelime, yayın ve kazanç, rapor
    ├── scripts/
    │   ├── veri.py          # Amazon kitap önerileri / Open Library / Google Books / öneriler / sayfa okuma
    │   └── rapor.py         # veri kontrolü, puan, kitap başı kazanç, HTML rapor
    └── assets/
```

## Yöntemin kaynakları

MaxKmet/idea-validation-agents, allexp1/business-idea-validator-AI-skill, ferdinandobons/startup-skill, assimovt/productskills, phuryn/pm-skills, msitarzewski/agency-agents ve Jakeschincariol/founder-skill projelerinin yöntemlerinden uyarlanmıştır. Hepsi MIT lisanslıdır; ayrıntılar `skills/nis-fikir-bulucu/references/kaynaklar.md` dosyasında.

## Eski web uygulaması

Bu repo önce bir web uygulamasıydı (NVIDIA NIM ile çalışan sürüm). Git geçmişinde `c977198` numaralı kayıtta duruyor. Geri getirmek için:

```bash
git checkout c977198 -- lib public server.js package.json package-lock.json .env.example
```
