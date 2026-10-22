// Uzak MCP sunucularına (RivalSearch, Trends MCP) bilgisayarınızdan bağlanır
// ve araçlarını modelin kullanabileceği fonksiyonlara çevirir.
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

function serverConfigs() {
  const list = [];
  if (process.env.RIVALSEARCH_ENABLED !== 'false') {
    list.push({
      prefix: 'rival',
      label: 'RivalSearch',
      url: process.env.RIVALSEARCH_URL || 'https://RivalSearchMCP.fastmcp.app/mcp',
      // Sadece işimize yarayan araçlar
      allow: ['web_search', 'social_search', 'news_aggregation', 'research_topic'],
    });
  }
  if (process.env.TRENDSMCP_API_KEY) {
    list.push({
      prefix: 'trends',
      label: 'Trends MCP',
      url: 'https://api.trendsmcp.ai/mcp',
      headers: { Authorization: `Bearer ${process.env.TRENDSMCP_API_KEY}` },
      allow: null,
    });
  }
  return list;
}

/**
 * Tüm MCP sunucularına bağlanır. Bağlanamayan sunucu atlanır (log ile bildirilir).
 * Dönen nesne: { tools: OpenAI fonksiyon tanımları, call(name, args), close() }
 */
export async function connectMcp(log) {
  const sessions = [];
  const tools = [];
  const routes = new Map(); // fonksiyon adı -> { client, toolName }

  for (const cfg of serverConfigs()) {
    try {
      const client = new Client({ name: 'nis-fikir-bulucu', version: '1.0.0' });
      const transport = new StreamableHTTPClientTransport(new URL(cfg.url), { requestInit: { headers: cfg.headers || {} } });
      await client.connect(transport);
      const { tools: remote } = await client.listTools();
      for (const t of remote) {
        if (cfg.allow && !cfg.allow.includes(t.name)) continue;
        const fname = `${cfg.prefix}_${t.name}`.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 64);
        routes.set(fname, { client, toolName: t.name });
        tools.push({
          type: 'function',
          function: {
            name: fname,
            description: `[${cfg.label}] ${(t.description || '').slice(0, 900)}`,
            parameters: t.inputSchema || { type: 'object', properties: {} },
          },
        });
      }
      sessions.push(client);
      log(`${cfg.label} bağlandı.`);
    } catch (e) {
      log(`Uyarı: ${cfg.label} bağlanamadı, onsuz devam ediliyor (${e.message}).`);
    }
  }

  return {
    tools,
    has: (name) => routes.has(name),
    async call(name, args) {
      const r = routes.get(name);
      const res = await r.client.callTool({ name: r.toolName, arguments: args || {} }, undefined, { timeout: 180000 });
      if (res.structuredContent) return res.structuredContent;
      return (res.content || []).map((c) => (c.type === 'text' ? c.text : `[${c.type}]`)).join('\n');
    },
    async close() {
      await Promise.allSettled(sessions.map((c) => c.close()));
    },
  };
}
