// Puanlama: yapay zeka her bileşene 0-10 arası puan verir,
// toplam puanı ve kararı burada kod hesaplar (modelin hesap hatası yapmaması için).
// Yöntem: allexp1/business-idea-validator (ağırlıklı bileşenler + kapılar)
// ve MaxKmet/idea-validation-agents (tek ölümcül zayıflık puanı düşürür) yaklaşımı.

export const COMPONENTS = [
  { key: 'pain', label: 'Problemin acısı ve sıklığı', weight: 20 },
  { key: 'willingness_to_pay', label: 'Para verme isteği (kanıtlı)', weight: 20 },
  { key: 'market_room', label: 'Pazarda yer var mı (doygun değil)', weight: 15 },
  { key: 'reachability', label: 'Kitleye ucuza ulaşılabilir mi', weight: 15 },
  { key: 'giant_safety', label: 'Devlerden ve yapay zeka şirketlerinden güvenli mi', weight: 10 },
  { key: 'buildability', label: '1-2 kişi + yapay zeka ile yapılabilir mi', weight: 10 },
  { key: 'founder_fit', label: 'Kurucu profiline uygun mu', weight: 10 },
];

export const VERDICTS = [
  { min: 75, key: 'strong', label: 'Güçlü: devam edin' },
  { min: 55, key: 'promising', label: 'Umut verici: önce test edin' },
  { min: 35, key: 'weak', label: 'Zayıf: pivot düşünün' },
  { min: 0, key: 'drop', label: 'Bırakın' },
];

const clamp = (n) => Math.max(0, Math.min(10, Number(n) || 0));

export function scoreIdea(scores, legalRisk) {
  let total = 0;
  for (const c of COMPONENTS) total += (clamp(scores?.[c.key]?.score) / 10) * c.weight;
  total = Math.round(total * 10) / 10;

  const caps = [];
  const s = (k) => clamp(scores?.[k]?.score);
  if (s('willingness_to_pay') <= 3) caps.push({ cap: 54, reason: 'Para verme isteğine dair kanıt çok zayıf' });
  if (s('pain') <= 3) caps.push({ cap: 54, reason: 'Problem yeterince acı vermiyor' });
  if (s('buildability') <= 3) caps.push({ cap: 54, reason: 'Küçük bir ekiple yapılması çok zor' });
  if (legalRisk === 'yüksek') caps.push({ cap: 54, reason: 'Yasal risk yüksek' });
  if (COMPONENTS.some((c) => s(c.key) <= 1)) caps.push({ cap: 34, reason: 'En az bir bileşende ölümcül zayıflık var' });

  const cap = caps.length ? Math.min(...caps.map((c) => c.cap)) : 100;
  const final = Math.min(total, cap);
  const verdict = VERDICTS.find((v) => final >= v.min);
  return { raw: total, total: final, capped: final < total, caps, verdict: verdict.key, verdict_label: verdict.label };
}
