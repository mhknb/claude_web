// Claude ile araştırma döngüsü ve son raporun yapılandırılmış (JSON) çıktısı.
import Anthropic from '@anthropic-ai/sdk';
import { toolDefinitions, runLocalTool } from './tools.js';

export const MODELS = {
  'claude-opus-5-5': { label: 'Claude Opus 5.5 (önerilen, en iyi sonuç)', input: 4, output: 20, cacheRead: 0.2 },
  'claude-sonnet-5-5': { label: 'Claude Sonnet 5.5 (yaklaşık yarı fiyatına)', input: 2, output: 10, cacheRead: 0.2 },
};
const WEB_SEARCH_PRICE = 0.01; // arama başına $

// Bir model ret verirse aynı isteği Anthropic'in önerdiği modelle sunucu tarafında tekrar dener.
const BETAS = ['mcp-client-2025-11-20', 'server-side-fallback-2026-07-01'];
const MAX_TURNS = 40;
const MAX_TOOL_RESULT_CHARS = 30000;

export class Usage {
  constructor(model) {
    this.model = model;
    this.input = 0;
    this.output = 0;
    this.cacheRead = 0;
    this.cacheWrite = 0;
    this.webSearches = 0;
  }
  add(u) {
    if (!u) return;
    this.input += u.input_tokens || 0;
    this.output += u.output_tokens || 0;
    this.cacheRead += u.cache_read_input_tokens || 0;
    this.cacheWrite += u.cache_creation_input_tokens || 0;
    this.webSearches += u.server_tool_use?.web_search_requests || 0;
  }
  get cost() {
    const p = MODELS[this.model] || MODELS['claude-opus-5-5'];
    const usd =
      (this.input * p.input + this.cacheWrite * p.input * 1.25 + this.cacheRead * p.cacheRead + this.output * p.output) / 1e6 +
      this.webSearches * WEB_SEARCH_PRICE;
    return Math.round(usd * 100) / 100;
  }
  toJSON() {
    return { model: this.model, input: this.input, output: this.output, cacheRead: this.cacheRead, cacheWrite: this.cacheWrite, webSearches: this.webSearches, costUsd: this.cost };
  }
}

export function sourceStatus() {
  return {
    anthropic: Boolean(process.env.ANTHROPIC_API_KEY),
    rivalsearch: process.env.RIVALSEARCH_ENABLED !== 'false',
    trends: Boolean(process.env.TRENDSMCP_API_KEY),
  };
}

function mcpConfig(disabled) {
  const servers = [];
  const toolsets = [];
  const status = sourceStatus();
  if (status.rivalsearch && !disabled.has('rivalsearch')) {
    servers.push({ type: 'url', name: 'rivalsearch', url: process.env.RIVALSEARCH_URL || 'https://RivalSearchMCP.fastmcp.app/mcp' });
    // Sadece işimize yarayan araçları açıyoruz. Onların "web_search" aracı Claude'un kendi web_search aracıyla aynı adı taşıdığı için kapalı.
    toolsets.push({
      type: 'mcp_toolset',
      mcp_server_name: 'rivalsearch',
      default_config: { enabled: false },
      configs: { social_search: { enabled: true }, news_aggregation: { enabled: true }, research_topic: { enabled: true } },
    });
  }
  if (status.trends && !disabled.has('trends')) {
    servers.push({ type: 'url', name: 'trends', url: 'https://api.trendsmcp.ai/mcp', authorization_token: process.env.TRENDSMCP_API_KEY });
    toolsets.push({ type: 'mcp_toolset', mcp_server_name: 'trends' });
  }
  return { servers, toolsets };
}

function describeBlock(b) {
  if (b.type === 'server_tool_use') {
    if (b.name === 'web_search') return `Web araması: "${b.input?.query}"`;
    if (b.name === 'web_fetch') return `Sayfa okunuyor: ${b.input?.url}`;
    return `Araç: ${b.name}`;
  }
  if (b.type === 'mcp_tool_use') {
    const q = b.input?.query || b.input?.keyword || b.input?.topic || b.input?.type || '';
    return `${b.server_name === 'trends' ? 'Trend verisi' : 'Topluluk/haber araması'} (${b.name})${q ? `: "${q}"` : ''}`;
  }
  if (b.type === 'tool_use') {
    const i = b.input || {};
    const what = i.term || (i.queries && i.queries.join(', ')) || i.app_id || '';
    const names = {
      appstore_search: 'App Store araması',
      appstore_reviews: 'App Store yorumları',
      playstore_search: 'Google Play araması',
      playstore_reviews: 'Google Play yorumları',
      keyword_suggestions: `Anahtar kelime önerileri (${i.source})`,
    };
    return `${names[b.name] || b.name}${what ? `: ${what}` : ''}`;
  }
  return null;
}

function collectSources(content, sources) {
  for (const b of content) {
    if (b.type === 'web_search_tool_result' && Array.isArray(b.content)) {
      for (const r of b.content) if (r.url) sources.set(r.url, r.title || '');
    }
    if (b.type === 'web_fetch_tool_result' && b.content?.url) {
      sources.set(b.content.url, b.content.content?.title || '');
    }
  }
}

const isMcpError = (err) => err instanceof Anthropic.BadRequestError && /mcp|server/i.test(err.message);

/**
 * Araştırma döngüsü: Claude araçları kullanarak araştırır, sonunda araştırma notlarını yazar.
 * log(msg): ilerleme mesajı; signal: iptal için.
 */
export async function runResearch({ client, model, effort, system, prompt, usage, log, signal }) {
  const messages = [{ role: 'user', content: prompt }];
  const sources = new Map();
  const disabled = new Set();
  let mcp = mcpConfig(disabled);

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const tools = [
      { type: 'web_search_20260209', name: 'web_search', max_uses: 12 },
      { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 8 },
      ...toolDefinitions,
      ...mcp.toolsets,
    ];

    let message;
    try {
      const stream = client.beta.messages.stream(
        {
          model,
          max_tokens: 64000,
          betas: BETAS,
          fallbacks: 'default',
          output_config: { effort },
          cache_control: { type: 'ephemeral' },
          system,
          tools,
          mcp_servers: mcp.servers,
          messages,
        },
        { signal },
      );
      stream.on('contentBlock', (b) => {
        const d = describeBlock(b);
        if (d) log(d);
      });
      message = await stream.finalMessage();
    } catch (err) {
      // Bir MCP sunucusuna bağlanılamazsa o kaynak olmadan devam et (sadece ilk turda; sonra geçmiş değiştirilemez).
      if (turn === 0 && isMcpError(err) && mcp.servers.length) {
        for (const s of mcp.servers) disabled.add(s.name);
        log(`Uyarı: ek veri kaynaklarına bağlanılamadı (${[...disabled].join(', ')}). Onlar olmadan devam ediliyor. Hata: ${err.message}`);
        mcp = mcpConfig(disabled);
        turn--;
        continue;
      }
      throw err;
    }

    usage.add(message.usage);
    collectSources(message.content, sources);
    messages.push({ role: 'assistant', content: message.content });

    if (message.stop_reason === 'refusal') {
      throw new Error(`Model bu isteği yanıtlamayı reddetti. ${message.stop_details?.explanation || ''}`);
    }
    if (message.stop_reason === 'pause_turn') continue; // sunucu tarafı araçlar sürüyor, kaldığı yerden devam

    const toolUses = message.content.filter((b) => b.type === 'tool_use');
    if (message.stop_reason !== 'tool_use' || toolUses.length === 0) {
      const notes = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
      return { notes, sources: [...sources].map(([url, title]) => ({ url, title })).slice(0, 150) };
    }

    const results = await Promise.all(
      toolUses.map(async (t) => {
        try {
          const out = JSON.stringify(await runLocalTool(t.name, t.input));
          return { type: 'tool_result', tool_use_id: t.id, content: out.slice(0, MAX_TOOL_RESULT_CHARS) };
        } catch (e) {
          log(`Uyarı: ${t.name} çalışmadı (${e.message})`);
          return { type: 'tool_result', tool_use_id: t.id, is_error: true, content: `Hata: ${e.message}` };
        }
      }),
    );
    messages.push({ role: 'user', content: results });
  }

  // Tur sınırına ulaşıldı: araç olmadan notları yazmasını iste.
  log('Araştırma tur sınırına ulaştı, notlar yazdırılıyor.');
  messages.push({ role: 'user', content: 'Araştırma bütçesi doldu. Daha fazla araç kullanmadan, şimdiye kadarki bulgularla ARAŞTIRMA NOTLARI\'nı eksiksiz yaz.' });
  const final = await client.beta.messages
    .stream(
      { model, max_tokens: 64000, betas: BETAS, fallbacks: 'default', output_config: { effort }, system, tools: [{ type: 'web_search_20260209', name: 'web_search', max_uses: 12 }, { type: 'web_fetch_20260209', name: 'web_fetch', max_uses: 8 }, ...toolDefinitions, ...mcp.toolsets], tool_choice: { type: 'none' }, mcp_servers: mcp.servers, messages },
      { signal },
    )
    .finalMessage();
  usage.add(final.usage);
  const notes = final.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
  return { notes, sources: [...sources].map(([url, title]) => ({ url, title })).slice(0, 150) };
}

/** Araştırma notlarını verilen şemaya uygun JSON'a dönüştürür. */
export async function synthesize({ client, model, system, prompt, schema, usage, signal }) {
  const message = await client.beta.messages
    .stream(
      {
        model,
        max_tokens: 64000,
        betas: ['server-side-fallback-2026-07-01'],
        fallbacks: 'default',
        output_config: { effort: 'medium', format: { type: 'json_schema', schema } },
        system,
        messages: [{ role: 'user', content: prompt }],
      },
      { signal },
    )
    .finalMessage();
  usage.add(message.usage);
  if (message.stop_reason === 'refusal') throw new Error('Model raporu yazmayı reddetti.');
  if (message.stop_reason === 'max_tokens') throw new Error('Rapor çok uzun olduğu için yarıda kesildi.');
  const text = message.content.filter((b) => b.type === 'text').map((b) => b.text).join('');
  return JSON.parse(text);
}
