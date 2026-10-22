// Niş Fikir Bulucu: yerel web sunucusu.
// Çalıştırma: npm start  ->  tarayıcıda http://localhost:3000
import path from 'node:path';
import { fileURLToPath } from 'node:url';

try {
  process.loadEnvFile('.env');
} catch {
  // .env yoksa ortam değişkenleri kullanılır
}

const express = (await import('express')).default;
const { startJob, cancelJob } = await import('./lib/jobs.js');
const { readProfile, saveProfile, readJob, listJobs, deleteJob, markInterrupted } = await import('./lib/store.js');
const { sourceStatus, MODELS } = await import('./lib/agent.js');
const { COMPONENTS } = await import('./lib/scoring.js');

const here = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(here, 'public')));

markInterrupted();

app.get('/api/status', (req, res) => {
  res.json({
    sources: sourceStatus(),
    models: Object.fromEntries(Object.entries(MODELS).map(([id, m]) => [id, m.label])),
    defaultModel: process.env.MODEL || 'claude-opus-5-5',
    components: COMPONENTS,
  });
});

app.get('/api/profile', (req, res) => res.json(readProfile() || {}));
app.put('/api/profile', (req, res) => {
  saveProfile(req.body || {});
  res.json({ ok: true });
});

app.get('/api/jobs', (req, res) => res.json(listJobs()));
app.get('/api/jobs/:id', (req, res) => {
  const job = readJob(req.params.id);
  if (!job) return res.status(404).json({ error: 'Bulunamadı' });
  res.json(job);
});
app.post('/api/jobs', (req, res) => {
  try {
    const job = startJob(req.body || {});
    res.json({ id: job.id });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});
app.post('/api/jobs/:id/cancel', (req, res) => res.json({ ok: cancelJob(req.params.id) }));
app.delete('/api/jobs/:id', (req, res) => {
  cancelJob(req.params.id);
  deleteJob(req.params.id);
  res.json({ ok: true });
});

const port = Number(process.env.PORT) || 3000;
// Sadece bu bilgisayardan erişilebilir (127.0.0.1).
app.listen(port, '127.0.0.1', () => {
  const s = sourceStatus();
  console.log(`\nNiş Fikir Bulucu çalışıyor: http://localhost:${port}\n`);
  if (!s.anthropic) console.log('UYARI: ANTHROPIC_API_KEY yok. .env dosyasını oluşturun (README\'ye bakın).');
  console.log(`Trend verisi (Trends MCP): ${s.trends ? 'açık' : 'kapalı (TRENDSMCP_API_KEY yok)'}`);
  console.log(`Topluluk araması (RivalSearchMCP): ${s.rivalsearch ? 'açık' : 'kapalı'}\n`);
});
