// NVIDIA NIM (OpenAI uyumlu) ile araştırma döngüsü ve son raporun JSON olarak alınması.
import OpenAI from 'openai';
import { toolDefinitions, runLocalTool } from './tools.js';
import { connectMcp } from './mcp.js';
import { conform, extractJson, stripThinking } from './conform.js';

export const BASE_URL = process.env.LLM_BASE_URL || 'https://integrate.api.nvidia.com/v1';
export const DEFAULT_MODEL = process.env.LLM_MODEL || 'z-ai/glm-5.2';

// Araç kullanabilen, önerilen modeller. Hesabınızda açık olan diğer modeller de sayfadan seçilebilir.
export const RECOMMENDED_MODELS = {
  'z-ai/glm-5.2': 'GLM 5.2 (önerilen)',
  'z-ai/glm-5.3-flash': 'GLM 5.3 Flash (daha hızlı)',
  'deepseek-ai/deepseek-v4-pro': 'DeepSeek V4 Pro',
  'deepseek-ai/deepseek-v4.1-flash': 'DeepSeek V4.1 Flash (daha hızlı)',
};

const MAX_TURNS = 30;
const MAX_TOOL_CALLS = 45;
const MAX_TOOL_RESULT_CHARS = 12000;
const MIN_GAP_MS = Number(process.env.LLM_MIN_GAP_MS || 1600); // ücretsiz NIM: dakikada ~40 istek

export function apiKey() {
  return process.env.NVIDIA_API_KEY || process.env.LLM_API_KEY || '';
}

export function makeClient() {
  // NIM bazen uzun süre sırada bekletiyor; zaman aşımı ve tekrar deneme cömert tutuldu.
  return new OpenAI({ apiKey: apiKey(), baseURL: BASE_URL, timeout: 10 * 60 * 1000, maxRetries: 6 });
}

export async function listModels() {
  try {
    const res = await makeClient().models.list();
    return res.data.map((m) => m.id).sort();
  } catch {
    return [];
  }
}

export class Usage {
  constructor(model) {
    this.model = model;
    this.requests = 0;
    this.input = 0;
    this.output = 0;
    this.toolCalls = 0;
  }
  add(u) {
    this.requests += 1;
    this.input += u?.prompt_tokens || 0;
    this.output += u?.completion_tokens || 0;
  }
  toJSON() {
    return { model: this.model, requests: this.requests, input: this.input, output: this.output, toolCalls: this.toolCalls };
  }
}

// Ücretsiz katmanın dakika başı sınırına takılmamak için istekler arasında kısa bekleme.
let lastCall = 0;
async function throttle() {
  const wait = lastCall + MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((r) => setTimeout(r, wait));
  lastCall = Date.now();
}

/** Tek bir sohbet isteği. Model "düşünme" ayarını desteklemezse ayarsız tekrar dener. */
async function chat(client, params, { thinking, signal, usage }) {
  const body = { ...params };
  if (thinking) body.chat_template_kwargs = { enable_thinking: true };
  await throttle();
  try {
    const res = await client.chat.completions.create(body, { signal });
    usage.add(res.usage);
    return res;
  } catch (err) {
    if (err instanceof OpenAI.BadRequestError && (body.chat_template_kwargs || body.response_format)) {
      delete body.chat_template_kwargs;
      delete body.response_format;
      await throttle();
      const res = await client.chat.completions.create(body, { signal });
      usage.add(res.usage);
      return res;
    }
    throw err;
  }
}

const localTools = toolDefinitions.map((t) => ({
  type: 'function',
  function: { name: t.name, description: t.description, parameters: t.input_schema },
}));

function describeCall(name, args) {
  const names = {
    fetch_page: 'Sayfa okunuyor',
    appstore_search: 'App Store araması',
    appstore_reviews: 'App Store yorumları',
    playstore_search: 'Google Play araması',
    playstore_reviews: 'Google Play yorumları',
    keyword_suggestions: `Anahtar kelime önerileri (${args.source || ''})`,
    rival_web_search: 'Web araması',
    rival_social_search: 'Topluluk araması (Reddit, HN, Product Hunt...)',
    rival_news_aggregation: 'Haber araması',
    rival_research_topic: 'Konu araştırması',
  };
  const label = names[name] || (name.startsWith('trends_') ? `Trend verisi (${name.slice(7)})` : name);
  const what = args.query || args.term || args.keyword || args.topic || args.url || (args.queries && args.queries.join(', ')) || args.app_id || '';
  return `${label}${what ? `: ${String(what).slice(0, 120)}` : ''}`;
}

function collectUrls(text, sources) {
  for (const m of String(text).matchAll(/https?:\/\/[^\s"'<>)\]]+/g)) {
    if (sources.size < 300) sources.add(m[0].replace(/[.,;]+$/, ''));
  }
}

/**
 * Araştırma döngüsü: model araçları kullanarak araştırır, sonunda araştırma notlarını yazar.
 */
export async function runResearch({ client, model, thinking, system, prompt, usage, log, signal }) {
  const mcp = await connectMcp(log);
  const tools = [...localTools, ...mcp.tools];
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: prompt },
  ];
  const sources = new Set();
  let askedForNotes = false;

  try {
    for (let turn = 0; turn < MAX_TURNS; turn++) {
      const budgetLeft = usage.toolCalls < MAX_TOOL_CALLS;
      const res = await chat(
        client,
        { model, messages, tools, tool_choice: budgetLeft ? 'auto' : 'none', max_tokens: 16000 },
        { thinking, signal, usage },
      );
      const msg = res.choices[0].message;
      const calls = budgetLeft ? msg.tool_calls || [] : [];

      const assistant = { role: 'assistant', content: msg.content || '' };
      if (msg.reasoning_content) assistant.reasoning_content = msg.reasoning_content;
      if (calls.length) assistant.tool_calls = calls;
      messages.push(assistant);

      if (!calls.length) {
        const notes = stripThinking(msg.content);
        // Model notları yazmadan bitirdiyse bir kez hatırlat.
        if (!/ARAŞTIRMA NOTLARI/i.test(notes) && notes.length < 1500 && !askedForNotes) {
          askedForNotes = true;
          messages.push({ role: 'user', content: 'Şimdi bulduğun her şeyi kaynak linkleriyle birlikte "ARAŞTIRMA NOTLARI" başlığı altında eksiksiz yaz.' });
          continue;
        }
        collectUrls(notes, sources);
        return { notes, sources: [...sources].map((url) => ({ url, title: '' })) };
      }

      const results = await Promise.all(
        calls.map(async (c) => {
          usage.toolCalls += 1;
          let args = {};
          try {
            args = JSON.parse(c.function.arguments || '{}');
          } catch {
            return { role: 'tool', tool_call_id: c.id, content: 'Hata: araç argümanları geçerli JSON değil. Tekrar dene.' };
          }
          log(describeCall(c.function.name, args));
          try {
            const out = mcp.has(c.function.name) ? await mcp.call(c.function.name, args) : await runLocalTool(c.function.name, args);
            const text = typeof out === 'string' ? out : JSON.stringify(out);
            collectUrls(text, sources);
            return { role: 'tool', tool_call_id: c.id, content: text.slice(0, MAX_TOOL_RESULT_CHARS) };
          } catch (e) {
            log(`Uyarı: ${c.function.name} çalışmadı (${e.message})`);
            return { role: 'tool', tool_call_id: c.id, content: `Hata: ${e.message}` };
          }
        }),
      );
      messages.push(...results);
      if (usage.toolCalls >= MAX_TOOL_CALLS) {
        log('Araştırma bütçesi doldu, notlar yazdırılıyor.');
        messages.push({ role: 'user', content: 'Araştırma bütçesi doldu. Daha fazla araç kullanmadan ARAŞTIRMA NOTLARI\'nı eksiksiz yaz.' });
      }
    }
    throw new Error('Model araştırmayı tur sınırı içinde bitiremedi. Daha hızlı bir modelle veya daha dar bir konuyla tekrar deneyin.');
  } finally {
    await mcp.close();
  }
}

/**
 * Araştırma notlarını şemaya uygun JSON'a dönüştürür.
 * Hatalı JSON gelirse bir kez düzelttirir; kalan eksikler varsayılanlarla doldurulur ve gaps olarak döner.
 */
export async function synthesize({ client, model, system, prompt, schema, usage, log, signal }) {
  const instruction = `${prompt}

YANIT BİÇİMİ: Yanıtın yalnızca aşağıdaki JSON şemasına uyan tek bir JSON nesnesi olsun. Açıklama, başlık veya \`\`\` işareti ekleme. Şemadaki her alanı doldur; "enum" olan alanlarda yalnızca listelenen değerlerden birini kullan.

JSON ŞEMASI:
${JSON.stringify(schema)}`;

  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: instruction },
  ];

  let parsed = null;
  let errors = [];
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await chat(
      client,
      { model, messages, max_tokens: 32000, response_format: { type: 'json_object' } },
      { thinking: false, signal, usage },
    );
    const text = res.choices[0].message.content || '';
    messages.push({ role: 'assistant', content: text });
    try {
      const raw = extractJson(text);
      errors = [];
      parsed = conform(schema, raw, '', errors);
      if (errors.length <= 3) break;
      log(`Raporda ${errors.length} biçim sorunu var, düzeltmesi isteniyor.`);
      messages.push({ role: 'user', content: `JSON'da şu sorunlar var:\n${errors.slice(0, 40).join('\n')}\n\nDüzeltilmiş JSON nesnesinin tamamını tekrar ver.` });
    } catch (e) {
      log(`Rapor okunamadı (${e.message}), tekrar isteniyor.`);
      messages.push({ role: 'user', content: 'Yanıtın geçerli bir JSON değildi. Sadece şemaya uyan geçerli JSON nesnesini ver.' });
    }
  }
  if (!parsed) throw new Error('Model geçerli bir rapor üretemedi. Başka bir modelle tekrar deneyin.');
  return { result: parsed, formatIssues: errors };
}
