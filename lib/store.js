// Analizleri ve profili bilgisayarınızdaki data/ klasörüne JSON olarak kaydeder.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = path.resolve(process.env.DATA_DIR || 'data');
const JOBS_DIR = path.join(DATA_DIR, 'jobs');
fs.mkdirSync(JOBS_DIR, { recursive: true });

const jobFile = (id) => path.join(JOBS_DIR, `${id.replace(/[^a-z0-9-]/gi, '')}.json`);

function writeJson(file, data) {
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
  fs.renameSync(tmp, file);
}

export function readProfile() {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, 'profile.json'), 'utf8'));
  } catch {
    return null;
  }
}

export function saveProfile(profile) {
  writeJson(path.join(DATA_DIR, 'profile.json'), profile);
}

export function newJobId() {
  return `${new Date().toISOString().slice(0, 10)}-${crypto.randomBytes(4).toString('hex')}`;
}

export function saveJob(job) {
  writeJson(jobFile(job.id), job);
}

export function readJob(id) {
  try {
    return JSON.parse(fs.readFileSync(jobFile(id), 'utf8'));
  } catch {
    return null;
  }
}

export function deleteJob(id) {
  fs.rmSync(jobFile(id), { force: true });
}

export function listJobs() {
  return fs
    .readdirSync(JOBS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      try {
        const j = JSON.parse(fs.readFileSync(path.join(JOBS_DIR, f), 'utf8'));
        return { id: j.id, type: j.type, title: j.title, status: j.status, createdAt: j.createdAt, cost: j.usage?.costUsd ?? 0, score: j.result?.score?.total ?? null, verdict: j.result?.score?.verdict_label ?? null, parentId: j.parentId || null };
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

// Sunucu kapanırken yarıda kalan işleri işaretle.
export function markInterrupted() {
  for (const j of listJobs()) {
    if (j.status === 'running') {
      const job = readJob(j.id);
      job.status = 'error';
      job.error = 'Uygulama kapatıldığı için analiz yarıda kaldı. Yeniden başlatabilirsiniz.';
      saveJob(job);
    }
  }
}
