// Modelin verdiği JSON'u şemaya göre kontrol eder ve eksikleri güvenli varsayılanlarla doldurur.
// Böylece model bir alanı unutsa bile rapor ekranı bozulmaz; eksikler listelenir.

const MISSING = 'Veri bulunamadı';

function defaultFor(schema) {
  if (schema.enum) return schema.enum.includes('orta') ? 'orta' : schema.enum[0];
  switch (schema.type) {
    case 'object':
      return conform(schema, {}, '', []);
    case 'array':
      return [];
    case 'integer':
    case 'number':
      return 0;
    case 'boolean':
      return false;
    default:
      return MISSING;
  }
}

/** value'yu schema'ya uydurur; her sorunu errors listesine "yol: açıklama" olarak ekler. */
export function conform(schema, value, path, errors) {
  const at = path || 'kök';
  if (schema.enum) {
    if (schema.enum.includes(value)) return value;
    const match = typeof value === 'string' && schema.enum.find((e) => e.toLocaleLowerCase('tr') === value.trim().toLocaleLowerCase('tr'));
    if (match) return match;
    errors.push(`${at}: "${value}" geçersiz, şunlardan biri olmalı: ${schema.enum.join(', ')}`);
    return defaultFor(schema);
  }
  switch (schema.type) {
    case 'object': {
      if (!value || typeof value !== 'object' || Array.isArray(value)) {
        if (value !== undefined) errors.push(`${at}: nesne olmalı`);
        value = {};
      }
      const out = {};
      for (const [k, sub] of Object.entries(schema.properties)) {
        if (value[k] === undefined || value[k] === null) {
          errors.push(`${path ? `${path}.` : ''}${k}: eksik`);
          out[k] = defaultFor(sub);
        } else {
          out[k] = conform(sub, value[k], `${path ? `${path}.` : ''}${k}`, errors);
        }
      }
      return out;
    }
    case 'array':
      if (!Array.isArray(value)) {
        errors.push(`${at}: liste olmalı`);
        return value == null ? [] : [conform(schema.items, value, `${at}[0]`, errors)];
      }
      return value.map((v, i) => conform(schema.items, v, `${at}[${i}]`, errors));
    case 'integer':
    case 'number': {
      const n = Number(value);
      if (Number.isNaN(n)) {
        errors.push(`${at}: sayı olmalı`);
        return 0;
      }
      return schema.type === 'integer' ? Math.round(n) : n;
    }
    case 'boolean':
      if (typeof value === 'boolean') return value;
      if (value === 'true' || value === 'evet') return true;
      if (value === 'false' || value === 'hayır') return false;
      errors.push(`${at}: true/false olmalı`);
      return false;
    default:
      if (typeof value === 'string') return value;
      if (typeof value === 'number' || typeof value === 'boolean') return String(value);
      errors.push(`${at}: metin olmalı`);
      return JSON.stringify(value);
  }
}

/** Model yanıtından JSON nesnesini çıkarır (düşünme blokları ve ``` işaretleri temizlenir). */
export function extractJson(text) {
  let t = stripThinking(text || '');
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) t = fence[1];
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end <= start) throw new SyntaxError('Yanıtta JSON bulunamadı');
  return JSON.parse(t.slice(start, end + 1));
}

export function stripThinking(text) {
  return (text || '').replace(/<think>[\s\S]*?<\/think>/gi, '').replace(/^[\s\S]*?<\/think>/i, '').trim();
}
