// Yapay zekanın son raporu hangi biçimde vereceğini tanımlayan JSON şemaları.
// Structured outputs kuralı: her nesnede additionalProperties=false ve tüm alanlar zorunlu.
import { COMPONENTS } from './scoring.js';

const withDesc = (schema, description) => (description ? { ...schema, description } : schema);
const str = (description) => withDesc({ type: 'string' }, description);
const int = (description) => withDesc({ type: 'integer' }, description);
const bool = (description) => withDesc({ type: 'boolean' }, description);
const oneOf = (values, description) => withDesc({ type: 'string', enum: values }, description);
const arr = (items, description) => withDesc({ type: 'array', items }, description);
const obj = (properties, description) => ({
  ...withDesc({ type: 'object' }, description),
  properties,
  required: Object.keys(properties),
  additionalProperties: false,
});

const LEVEL = ['düşük', 'orta', 'yüksek'];

const evidence = obj({
  claim: str('Kanıtlanan iddia, kısa'),
  url: str('Kaynak linki. Kaynak yoksa boş bırakma, iddiayı hiç yazma.'),
});

const scores = obj(
  Object.fromEntries(
    COMPONENTS.map((c) => [
      c.key,
      obj({ score: int(`${c.label}: 0-10 arası tam sayı`), reason: str('Puanın gerekçesi, kanıta dayalı, 1-2 cümle') }),
    ]),
  ),
  'Her bileşen 0-10. Yüksek puan her zaman iyi demektir.',
);

export const discoverySchema = obj({
  market_notes: str('Araştırılan alan ve pazar hakkında genel gözlem, 3-5 cümle'),
  excluded_audiences: arr(
    obj({ audience: str('Elenen kitle'), reason: str('Neden elendi (ör. ödeme alışkanlığı yok)') }),
    'Para vermeyeceği için elenen kitleler',
  ),
  candidates: arr(
    obj({
      name: str('Kısa çalışma adı'),
      one_liner: str('Tek cümlelik ürün tanımı'),
      product_type: oneOf(['mobil uygulama', 'SaaS', 'yapay zeka aracı', 'tarayıcı eklentisi', 'web uygulaması', 'diğer'], 'Ürün tipi'),
      market: oneOf(['Türkiye', 'Global', 'İkisi'], 'Hedef pazar'),
      target_audience: str('Kime satılacak, net ve dar tanım'),
      problem: str('Çözülen problem, kullanıcının diliyle'),
      why_they_pay: str('Bu kitlenin para vereceğine dair kanıt (bugün neye para ödüyorlar?)'),
      existing_alternatives: str('Bugün bu problemi nasıl çözüyorlar, hangi rakipler var'),
      gap: str('Rakiplerin bıraktığı boşluk'),
      evidence: arr(evidence, 'En az 3 kaynaklı kanıt'),
      scores,
      legal_risk: oneOf(LEVEL, 'Yasal risk seviyesi'),
      main_risk: str('En büyük risk'),
    }),
    'Aday niş fikirler',
  ),
});

export const validationSchema = obj({
  summary: obj({
    idea_name: str('Ürünün çalışma adı'),
    one_liner: str('Tek cümlelik tanım'),
    verdict_reason: str('Kararın 3-4 cümlelik gerekçesi'),
    biggest_risk: str('En büyük tek risk'),
    next_action: str('Bir sonraki somut adım'),
  }),
  scores,
  problem_validation: obj({
    problem: str('Problem tanımı'),
    frequency: oneOf(LEVEL, 'Problem ne sık yaşanıyor'),
    intensity: oneOf(LEVEL, 'Ne kadar acı veriyor'),
    current_workarounds: arr(str(''), 'İnsanlar bugün nasıl idare ediyor'),
    user_quotes: arr(obj({ quote: str('Kullanıcının kendi sözü (forum, yorum)'), url: str('Kaynak') }), 'Gerçek kullanıcı ifadeleri'),
  }),
  audience: obj({
    segments: arr(
      obj({
        name: str('Segment adı'),
        description: str('Kim bunlar'),
        size_estimate: str('Büyüklük tahmini ve nasıl hesaplandığı'),
        willingness_to_pay: oneOf(LEVEL, 'Ödeme isteği'),
        wtp_evidence: str('Ödeme isteğinin kanıtı'),
        expectations: arr(str(''), 'Üründen beklentileri'),
        pains: arr(str(''), 'Acı noktaları'),
        platforms: arr(obj({ name: str('Platform/topluluk adı (ör. r/xyz, Facebook grubu, LinkedIn, TikTok)'), url: str('Link, biliniyorsa'), note: str('Orada ne konuşuluyor') }), 'Sık kullandıkları platformlar'),
        validated: bool('Bu segment gerçek veriyle doğrulandı mı'),
        evidence: arr(evidence, 'Kanıtlar'),
      }),
      'Hedef kitle segmentleri, en iyi uyan önce',
    ),
    excluded_segments: arr(obj({ name: str(''), reason: str('Neden hedeflenmemeli') }), 'Hedeflenmemesi gereken kitleler'),
  }),
  competitors: arr(
    obj({
      name: str('Rakip adı'),
      kind: oneOf(['doğrudan', 'dolaylı', 'manuel yöntem'], 'Rakip türü'),
      platform: str('iOS, Android, web vb.'),
      url: str('Link'),
      pricing: str('Fiyatlandırma'),
      traction: str('Puan, yorum sayısı, indirme vb. ölçülen veri'),
      strengths: arr(str(''), 'Güçlü yanlar'),
      weaknesses: arr(str(''), 'Zayıf yanlar, kullanıcı şikâyetlerinden'),
      is_giant: bool('Büyük şirket mi'),
    }),
    'Rakipler',
  ),
  market_position: obj({
    saturation: oneOf(LEVEL, 'Pazar doygunluğu'),
    giants_present: str('Devler bu alanda mı, ne yapıyorlar'),
    trend: str('İlgi artıyor mu azalıyor mu, trend verisiyle'),
    gap: str('Pazardaki boşluk'),
    why_now: str('Neden şimdi'),
  }),
  positioning: obj({
    statement: str('Konumlandırma cümlesi: [kitle] için, [alternatif]ten farklı olarak, [değer] sağlayan [kategori]'),
    category: str('Pazar kategorisi'),
    competitive_alternatives: arr(str(''), 'Müşteri bizi kullanmazsa ne kullanır'),
    unique_attributes: arr(str(''), 'Sadece bizde olanlar'),
    value: str('Bu özelliklerin müşteriye sağladığı değer'),
    best_fit_customer: str('En iyi uyan müşteri'),
    tagline: str('Kısa slogan'),
  }),
  keywords: obj({
    app_name_ideas: arr(str(''), 'Mağaza başlığı önerileri (anahtar kelime içeren)'),
    app_subtitle: str('Mağaza alt başlığı önerisi'),
    aso: arr(
      obj({ keyword: str(''), language: oneOf(['tr', 'en'], ''), competition: oneOf(LEVEL, 'Bu kelimede kaç güçlü uygulama var'), relevance: oneOf(LEVEL, ''), source: str('Nereden bulundu: öneri listesi, rakip başlığı vb.') }),
      'ASO anahtar kelimeleri',
    ),
    seo: arr(
      obj({ keyword: str(''), language: oneOf(['tr', 'en'], ''), intent: oneOf(['bilgi', 'karşılaştırma', 'satın alma'], 'Arama niyeti'), competition: oneOf(LEVEL, ''), content_idea: str('Bu kelime için içerik/sayfa fikri') }),
      'SEO anahtar kelimeleri',
    ),
  }),
  business: obj({
    pricing_model: str('Abonelik, tek seferlik, kullanım başı vb. ve neden'),
    suggested_price: str('Önerilen fiyat ve rakip fiyatlarıyla karşılaştırma'),
    cost_per_user_month: str('Kullanıcı başına aylık tahmini maliyet (yapay zeka, sunucu)'),
    gross_margin: str('Tahmini brüt kâr marjı'),
    customers_for_target: str('Kurucunun aylık gelir hedefine kaç ödeyen müşteriyle ulaşılır'),
    acquisition_cost: str('Müşteri edinme maliyeti tahmini ve kanal'),
  }),
  mvp: obj({
    core_features: arr(str(''), 'İlk sürümde mutlaka olması gerekenler'),
    not_now: arr(str(''), 'Şimdilik yapılmayacaklar'),
    tech_suggestion: str('Teknoloji önerisi'),
    build_weeks: str('1-2 kişi + yapay zeka ile tahmini süre'),
  }),
  risks: arr(
    obj({
      type: oneOf(['yasal', 'platform', 'dev şirketler', 'teknik', 'pazar', 'diğer'], ''),
      description: str(''),
      severity: oneOf(LEVEL, ''),
      mitigation: str('Nasıl azaltılır'),
    }),
    'Riskler',
  ),
  legal_risk: oneOf(LEVEL, 'Genel yasal risk seviyesi (KVKK/GDPR, sağlık, finans, mağaza kuralları)'),
  validation_plan: obj({
    riskiest_assumption: str('Fikri en çok öldürebilecek varsayım'),
    experiment: obj({
      method: str('Yöntem (tanıtım sayfası, ön satış, el ile hizmet vb.)'),
      steps: arr(str(''), 'Adımlar'),
      budget: str('Bütçe'),
      duration: str('Süre'),
      success_criteria: str('Başarı ölçütü, sayısal'),
    }),
    first_100_users: arr(obj({ channel: str('Kanal'), tactic: str('Somut taktik') }), 'İlk 100 kullanıcıya ulaşma yolları'),
    kill_criteria: arr(str(''), '"Şu olursa bırak" ölçütleri, sayısal ve tarihli'),
  }),
  pivot_hints: arr(str(''), 'Puan düşükse hangi değişken değiştirilebilir'),
  data_gaps: arr(str(''), 'Doğrulanamayan veya veri bulunamayan konular'),
  sources: arr(obj({ title: str(''), url: str('') }), 'Kullanılan başlıca kaynaklar'),
});

export const pivotSchema = obj({
  root_causes: arr(
    obj({
      weakness: str('Zayıf bileşen veya sorun'),
      cause_type: oneOf(['değiştirilemez', 'zamanla düzelir', 'bilgi eksikliği', 'düzeltilebilir'], 'Kök neden türü'),
      explanation: str(''),
    }),
    'Zayıflıkların kök nedenleri',
  ),
  options: arr(
    obj({
      title: str('Pivot adı'),
      changed_variables: arr(oneOf(['hedef kitle', 'niş', 'fiyat modeli', 'özellik odağı', 'platform', 'pazar/ülke', 'konumlandırma'], ''), 'Değişen 1-2 değişken'),
      new_idea: str('Yeni fikrin tek paragraf tanımı (doğrulamaya gönderilecek metin)'),
      new_target_audience: str(''),
      new_positioning: str(''),
      why_better: str('Hangi zayıflığı nasıl düzeltiyor'),
      evidence: arr(evidence, 'Kanıtlar'),
      kept_strengths: str('Korunan güçlü yön'),
      effort: oneOf(LEVEL, 'Gereken çaba'),
      scores,
      legal_risk: oneOf(LEVEL, ''),
    }),
    '2-3 pivot seçeneği',
  ),
  recommendation: str('Hangisi öneriliyor ve neden. Hiçbiri iyi değilse açıkça söyle.'),
});
