# Niş Fikir Bulucu (AI agent skill)

Gerçek verilere bakarak küçük bir ekibin (1-2 kişi + yapay zeka) yapıp satabileceği **kârlı niş ürün fikirleri** bulan, bu fikirleri **doğrulayan** ve gerekirse **yeniden konumlandıran** bir yapay zeka skill'i. Sonucu tablolu ve grafikli bir **HTML rapor** olarak verir.

Skill'i kullandığınız yapay zeka (Claude, Claude Code, ChatGPT/Codex, Gemini, Hermes vb.) çalıştırır. **Ayrı bir API anahtarı gerekmez.** Düşünme ve web aramasını o yapay zekanın kendisi yapar.

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

## Kurulum

### Claude Code

```bash
claude plugin marketplace add mhknb/claude_web
claude plugin install nis-fikir-bulucu@nis-fikir-bulucu
```

Ya da elle: `skills/nis-fikir-bulucu` klasörünü `~/.claude/skills/` altına kopyalayın.

### Claude (claude.ai web ve masaüstü uygulaması)

1. Bu repoyu indirin ve `skills` klasöründe şu komutu çalıştırın: `zip -r nis-fikir-bulucu.zip nis-fikir-bulucu`
2. Claude'da **Ayarlar → Yetenekler (Capabilities) → Skills → Skill yükle** bölümünden zip dosyasını yükleyin.
3. Ayarlarda **kod çalıştırma** ve **web araması** açık olmalı.

### Codex, Gemini CLI, Cursor, OpenCode ve diğer Agent Skills destekleyen araçlar

```bash
npx skills add mhknb/claude_web -g
```

Ya da `skills/nis-fikir-bulucu` klasörünü aracınızın skill klasörüne kopyalayın.

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

## Kullanım örnekleri

- "Niş fikir bul. Türkiye pazarı, 2 kişiyiz, biri yazılımcı."
- "Serbest çalışan muhasebeciler için SaaS fikri bul."
- "Şu fikri doğrula: diyetisyenler için danışan yemek fotoğraflarını yapay zekayla analiz eden mobil uygulama."
- "Bu raporu B2B'ye kaydırarak yeniden konumlandır."

Raporlar çalışma klasöründeki `nis-raporlari/` altına kaydedilir: veri `.json`, rapor `.html` olarak. HTML raporu tarayıcıda açılır, yazdırılabilir ve paylaşılabilir.

## Klasör yapısı

```
skills/nis-fikir-bulucu/
├── SKILL.md                 # ana talimatlar
├── references/              # adım rehberleri: keşif, doğrulama, pivot, puanlama, veri kaynakları, ASO/SEO, rapor
├── scripts/
│   ├── veri.py              # App Store / Google Play / öneriler / sayfa okuma (Python, ek kurulum gerekmez)
│   └── rapor.py             # veriyi kontrol eder, puanı hesaplar, HTML rapor üretir
└── assets/
    ├── rapor-sablonu.html   # grafikli rapor şablonu
    └── semalar/             # rapor veri şemaları
```

## Yöntemin kaynakları

MaxKmet/idea-validation-agents, allexp1/business-idea-validator-AI-skill, ferdinandobons/startup-skill, assimovt/productskills, phuryn/pm-skills, msitarzewski/agency-agents ve Jakeschincariol/founder-skill projelerinin yöntemlerinden uyarlanmıştır. Hepsi MIT lisanslıdır; ayrıntılar `skills/nis-fikir-bulucu/references/kaynaklar.md` dosyasında.

## Eski web uygulaması

Bu repo önce bir web uygulamasıydı (NVIDIA NIM ile çalışan sürüm). Git geçmişinde `c977198` numaralı kayıtta duruyor. Geri getirmek için:

```bash
git checkout c977198 -- lib public server.js package.json package-lock.json .env.example
```
