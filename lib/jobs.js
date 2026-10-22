// Analiz işlerini arka planda çalıştırır: araştırma -> rapor -> puanlama.
import OpenAI from 'openai';
import { runResearch, synthesize, Usage, makeClient, apiKey, DEFAULT_MODEL } from './llm.js';
import { baseSystem, discoverPrompt, validatePrompt, pivotPrompt, synthesisPrompt } from './prompts.js';
import { discoverySchema, validationSchema, pivotSchema } from './schemas.js';
import { scoreIdea } from './scoring.js';
import { newJobId, saveJob, readJob, readProfile } from './store.js';

const running = new Map(); // id -> AbortController

const KINDS = {
  discover: { prompt: discoverPrompt, schema: discoverySchema },
  validate: { prompt: validatePrompt, schema: validationSchema },
  pivot: { prompt: pivotPrompt, schema: pivotSchema },
};

function titleFor(type, input) {
  if (type === 'discover') return `Niş keşfi${input.theme ? `: ${input.theme}` : ''}`;
  if (type === 'validate') return `Doğrulama: ${input.title || input.idea.slice(0, 80)}`;
  return `Pivot: ${input.title || ''}`;
}

function addScores(type, result) {
  if (type === 'discover') {
    for (const c of result.candidates) c.score = scoreIdea(c.scores, c.legal_risk);
    result.candidates.sort((a, b) => b.score.total - a.score.total);
  } else if (type === 'validate') {
    result.score = scoreIdea(result.scores, result.legal_risk);
  } else {
    for (const o of result.options) o.score = scoreIdea(o.scores, o.legal_risk);
    result.options.sort((a, b) => b.score.total - a.score.total);
  }
  return result;
}

export function startJob({ type, input, model, depth }) {
  if (!KINDS[type]) throw new Error('Geçersiz analiz türü');
  if (!apiKey()) throw new Error('NVIDIA_API_KEY tanımlı değil. .env dosyasına ekleyin.');
  model = typeof model === 'string' && /^[\w./:-]{3,100}$/.test(model.trim()) ? model.trim() : DEFAULT_MODEL;
  depth = depth === 'normal' ? 'normal' : 'deep';

  if (type === 'validate' && !input?.idea?.trim()) throw new Error('Doğrulanacak fikri yazın.');
  if (type === 'pivot') {
    const src = readJob(input?.sourceJobId);
    if (!src?.result || src.type !== 'validate') throw new Error('Pivot için tamamlanmış bir doğrulama raporu gerekli.');
    input = { ...input, report: src.result, title: src.result.summary?.idea_name };
  }

  const profile = readProfile();
  const job = {
    id: newJobId(),
    type,
    title: titleFor(type, input),
    status: 'running',
    phase: 'Araştırma',
    createdAt: new Date().toISOString(),
    parentId: input.sourceJobId || null,
    input: { ...input, report: undefined },
    profile,
    model,
    depth,
    log: [],
    usage: null,
    result: null,
    error: null,
  };
  saveJob(job);
  run(job, input, profile).catch(() => {});
  return job;
}

async function run(job, input, profile) {
  const controller = new AbortController();
  running.set(job.id, controller);
  const usage = new Usage(job.model);
  const client = makeClient();
  const kind = KINDS[job.type];
  const system = baseSystem(profile);

  const log = (msg) => {
    job.log.push({ t: new Date().toISOString(), msg });
    job.usage = usage.toJSON();
    saveJob(job);
  };

  try {
    log('Araştırma başladı.');
    const research = await runResearch({
      client,
      model: job.model,
      thinking: job.depth === 'deep',
      system,
      prompt: kind.prompt(input),
      usage,
      log,
      signal: controller.signal,
    });
    job.notes = research.notes;
    job.sources = research.sources;
    job.phase = 'Rapor yazılıyor';
    log(`Araştırma bitti (${research.sources.length} kaynak). Rapor hazırlanıyor.`);

    const { result, formatIssues } = await synthesize({
      client,
      model: job.model,
      system,
      prompt: synthesisPrompt(job.type, research.notes, research.sources),
      schema: kind.schema,
      usage,
      log,
      signal: controller.signal,
    });
    if (formatIssues.length) log(`Not: raporda ${formatIssues.length} alan eksik geldi ve "Veri bulunamadı" ile dolduruldu.`);
    job.result = addScores(job.type, result);
    job.status = 'done';
    job.phase = 'Tamamlandı';
    job.finishedAt = new Date().toISOString();
    log('Tamamlandı.');
  } catch (err) {
    const cancelled = controller.signal.aborted;
    job.status = cancelled ? 'cancelled' : 'error';
    job.error = cancelled ? 'Analiz durduruldu.' : friendlyError(err);
    job.finishedAt = new Date().toISOString();
    log(cancelled ? 'Durduruldu.' : `Hata: ${job.error}`);
  } finally {
    running.delete(job.id);
  }
}

function friendlyError(err) {
  if (err instanceof OpenAI.AuthenticationError) return 'API anahtarı geçersiz. .env dosyasındaki NVIDIA_API_KEY değerini kontrol edin.';
  if (err instanceof OpenAI.PermissionDeniedError) return `Bu model için yetkiniz yok. build.nvidia.com'da modeli açın veya başka bir model seçin. (${err.message})`;
  if (err instanceof OpenAI.NotFoundError) return `Model bulunamadı. Model adını kontrol edin veya başka bir model seçin. (${err.message})`;
  if (err instanceof OpenAI.RateLimitError) return 'NVIDIA dakika başı istek sınırına takıldı. Birkaç dakika sonra tekrar deneyin.';
  if (err instanceof OpenAI.BadRequestError) return `İstek reddedildi: ${err.message}`;
  if (err instanceof OpenAI.APIConnectionTimeoutError) return 'NVIDIA sunucusu zamanında yanıt vermedi. Biraz sonra veya daha hızlı bir modelle tekrar deneyin.';
  if (err instanceof OpenAI.APIConnectionError) return 'NVIDIA API\'ye bağlanılamadı. İnternet bağlantınızı kontrol edin.';
  if (err instanceof OpenAI.APIError) return `NVIDIA API hatası (${err.status}): ${err.message}`;
  return err.message || String(err);
}

export function cancelJob(id) {
  const c = running.get(id);
  if (c) c.abort();
  return Boolean(c);
}
