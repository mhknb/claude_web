// Niş Fikir Bulucu: arayüz.
const app = document.getElementById('app');
let status = null;
let pollTimer = null;

// ---------- yardımcılar ----------
const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const safeUrl = (u) => (/^https?:\/\//i.test(u || '') ? u : null);
const link = (url, text) => {
  const u = safeUrl(url);
  return u ? `<a href="${esc(u)}" target="_blank" rel="noopener noreferrer">${esc(text || hostOf(u))}</a>` : esc(text || '');
};
const hostOf = (u) => {
  try {
    return new URL(u).hostname.replace(/^www\./, '');
  } catch {
    return u;
  }
};
const list = (items) => (items?.length ? `<ul>${items.map((i) => `<li>${esc(i)}</li>`).join('')}</ul>` : '<p class="muted">Veri yok</p>');
const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' }) : '');
const usd = (n) => `$${(n ?? 0).toFixed(2)}`;
// highIsGood: "yüksek" iyi bir şey mi (ödeme isteği) yoksa kötü mü (rekabet, risk)?
const levelTag = (v, highIsGood = false) => {
  const tone = v === 'orta' ? 'mid' : (v === 'yüksek') === highIsGood ? 'good' : 'bad';
  return `<span class="tag t-${tone}">${esc(v)}</span>`;
};

async function api(path, opts = {}) {
  const res = await fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
  return data;
}

function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
}

const verdictClass = (v) => ({ strong: 'v-strong', promising: 'v-promising', weak: 'v-weak', drop: 'v-drop' })[v] || '';
const scoreBadge = (score) =>
  score ? `<span class="badge ${verdictClass(score.verdict)}" title="${esc(score.verdict_label)}">${Math.round(score.total)}<small>/100</small></span>` : '';

// ---------- başlık: veri kaynakları ----------
async function loadStatus() {
  status = await api('/api/status');
  const s = status.sources;
  const chip = (ok, label, hint) => `<span class="chip ${ok ? 'ok' : 'off'}" title="${esc(hint)}">${ok ? '●' : '○'} ${label}</span>`;
  document.getElementById('sources').innerHTML =
    chip(s.anthropic, 'Claude', s.anthropic ? 'API anahtarı tanımlı' : '.env dosyasına ANTHROPIC_API_KEY ekleyin') +
    chip(s.rivalsearch, 'Topluluk araması', 'RivalSearchMCP: Reddit, Hacker News, Product Hunt, haberler') +
    chip(s.trends, 'Trend verisi', s.trends ? 'Trends MCP açık' : 'Ücretsiz anahtar için .env dosyasına TRENDSMCP_API_KEY ekleyin') +
    chip(true, 'Mağaza verisi', 'App Store, Google Play ve Google önerileri (ücretsiz)');
}

// ---------- sayfalar ----------
function setTab(name) {
  document.querySelectorAll('.tabs a').forEach((a) => a.classList.toggle('active', a.dataset.tab === name));
}

function mountTemplate(id) {
  app.innerHTML = '';
  app.appendChild(document.getElementById(id).content.cloneNode(true));
  app.querySelectorAll('.model-slot').forEach((slot) => {
    slot.replaceWith(document.getElementById('tpl-model').content.cloneNode(true));
  });
  app.querySelectorAll('select[name=model]').forEach((sel) => {
    sel.innerHTML = Object.entries(status.models)
      .map(([id, label]) => `<option value="${esc(id)}" ${id === status.defaultModel ? 'selected' : ''}>${esc(label)}</option>`)
      .join('');
  });
}

async function profilePage() {
  setTab('profil');
  mountTemplate('tpl-profil');
  const form = document.getElementById('profile-form');
  const p = await api('/api/profile');
  for (const [k, v] of Object.entries(p)) {
    const els = form.querySelectorAll(`[name="${k}"]`);
    if (!els.length) continue;
    if (els[0].type === 'radio') els.forEach((e) => (e.checked = e.value === v));
    else if (els[0].type === 'checkbox') els.forEach((e) => (e.checked = Array.isArray(v) && v.includes(e.value)));
    else els[0].value = v;
  }
  form.onsubmit = async (e) => {
    e.preventDefault();
    const fd = new FormData(form);
    const data = Object.fromEntries([...fd.entries()].filter(([k]) => k !== 'product_types'));
    data.product_types = fd.getAll('product_types');
    await api('/api/profile', { method: 'PUT', body: data });
    document.getElementById('profile-saved').textContent = 'Kaydedildi.';
    setTimeout(() => (location.hash = '#/kesif'), 600);
  };
}

async function warnIfNoProfile() {
  const p = await api('/api/profile');
  if (!p.market) {
    app.insertAdjacentHTML('afterbegin', `<div class="notice">Önce <a href="#/profil">profilinizi</a> doldurmanız önerilir. Fikirler buna göre süzülür.</div>`);
  }
}

async function startJob(body, form) {
  const err = form?.querySelector('.error');
  try {
    const btn = form?.querySelector('button[type=submit]');
    if (btn) btn.disabled = true;
    const { id } = await api('/api/jobs', { method: 'POST', body });
    location.hash = `#/is/${id}`;
  } catch (e) {
    if (err) {
      err.hidden = false;
      err.textContent = e.message;
    } else alert(e.message);
    form?.querySelector('button[type=submit]')?.removeAttribute('disabled');
  }
}

async function discoverPage() {
  setTab('kesif');
  mountTemplate('tpl-kesif');
  await warnIfNoProfile();
  const form = document.getElementById('discover-form');
  form.onsubmit = (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(form));
    startJob({ type: 'discover', model: fd.model, effort: fd.effort, input: { theme: fd.theme, notes: fd.notes, count: Number(fd.count) } }, form);
  };
}

async function validatePage() {
  setTab('dogrula');
  mountTemplate('tpl-dogrula');
  await warnIfNoProfile();
  const form = document.getElementById('validate-form');
  form.onsubmit = (e) => {
    e.preventDefault();
    const fd = Object.fromEntries(new FormData(form));
    startJob({ type: 'validate', model: fd.model, effort: fd.effort, input: { idea: fd.idea } }, form);
  };
}

const TYPE_LABEL = { discover: 'Niş keşfi', validate: 'Doğrulama', pivot: 'Pivot' };
const STATUS_LABEL = { running: 'Sürüyor', done: 'Tamamlandı', error: 'Hata', cancelled: 'Durduruldu' };

async function historyPage() {
  setTab('gecmis');
  const jobs = await api('/api/jobs');
  app.innerHTML = `<section class="card"><h1>Geçmiş analizler</h1>
    ${
      jobs.length
        ? `<table class="table"><thead><tr><th>Analiz</th><th>Tür</th><th>Durum</th><th>Puan</th><th>Maliyet</th><th>Tarih</th><th></th></tr></thead><tbody>
      ${jobs
        .map(
          (j) => `<tr>
        <td><a href="#/is/${esc(j.id)}">${esc(j.title)}</a></td>
        <td>${esc(TYPE_LABEL[j.type])}</td>
        <td><span class="status s-${esc(j.status)}">${esc(STATUS_LABEL[j.status])}</span></td>
        <td>${j.score != null ? `${Math.round(j.score)} · ${esc(j.verdict)}` : ''}</td>
        <td>${usd(j.cost)}</td>
        <td>${fmtDate(j.createdAt)}</td>
        <td><button class="link danger" data-del="${esc(j.id)}">Sil</button></td></tr>`,
        )
        .join('')}</tbody></table>`
        : '<p class="muted">Henüz analiz yok.</p>'
    }</section>`;
  app.querySelectorAll('[data-del]').forEach((b) => {
    b.onclick = async () => {
      if (!confirm('Bu analiz silinsin mi?')) return;
      await api(`/api/jobs/${b.dataset.del}`, { method: 'DELETE' });
      historyPage();
    };
  });
}

// ---------- analiz görünümü ----------
async function jobPage(id) {
  setTab(null);
  let job;
  try {
    job = await api(`/api/jobs/${id}`);
  } catch {
    app.innerHTML = '<section class="card"><p>Analiz bulunamadı.</p></section>';
    return;
  }
  renderJob(job);
  if (job.status === 'running') {
    pollTimer = setTimeout(() => {
      if (location.hash === `#/is/${id}`) jobPage(id);
    }, 3000);
  }
}

function renderJob(job) {
  const elapsed = Math.round(((job.finishedAt ? new Date(job.finishedAt) : new Date()) - new Date(job.createdAt)) / 60000);
  const head = `<section class="card job-head">
    <div class="job-title">
      <div><span class="muted">${esc(TYPE_LABEL[job.type])}</span><h1>${esc(job.title)}</h1></div>
      <div class="job-meta">
        <span class="status s-${esc(job.status)}">${esc(STATUS_LABEL[job.status])}${job.status === 'running' ? ` · ${esc(job.phase)}` : ''}</span>
        <span>${elapsed} dk</span>
        <span title="Tahmini Claude API maliyeti">${usd(job.usage?.costUsd)}</span>
      </div>
    </div>
    ${job.error ? `<p class="error">${esc(job.error)}</p>` : ''}
    <div class="actions no-print">
      ${job.status === 'running' ? '<button id="cancel" class="danger">Durdur</button>' : ''}
      ${job.status === 'done' ? '<button id="dl-md">Markdown indir</button><button id="dl-json">JSON indir</button><button id="print">Yazdır / PDF</button>' : ''}
      ${job.status === 'error' || job.status === 'cancelled' ? '<button id="retry">Yeniden başlat</button>' : ''}
    </div>
    <details class="log no-print" ${job.status === 'running' ? 'open' : ''}>
      <summary>Araştırma adımları (${job.log.length})</summary>
      <ol>${job.log.slice().reverse().map((l) => `<li><span class="muted">${new Date(l.t).toLocaleTimeString('tr-TR')}</span> ${esc(l.msg)}</li>`).join('')}</ol>
    </details>
  </section>`;

  let body = '';
  if (job.status === 'done' && job.result) {
    if (job.type === 'discover') body = renderDiscovery(job);
    if (job.type === 'validate') body = renderValidation(job);
    if (job.type === 'pivot') body = renderPivot(job);
  }
  if (job.notes && job.status === 'done') {
    body += `<section class="card no-print"><details><summary>Ham araştırma notları</summary><pre class="notes">${esc(job.notes)}</pre></details></section>`;
  }
  app.innerHTML = head + body;

  const on = (id, fn) => document.getElementById(id) && (document.getElementById(id).onclick = fn);
  on('cancel', async () => {
    await api(`/api/jobs/${job.id}/cancel`, { method: 'POST' });
    jobPage(job.id);
  });
  on('dl-json', () => download(`${job.id}.json`, JSON.stringify(job.result, null, 2), 'application/json'));
  on('dl-md', () => download(`${job.id}.md`, toMarkdown(job), 'text/markdown'));
  on('print', () => window.print());
  on('retry', () => startJob({ type: job.type, model: job.model, effort: job.effort, input: job.type === 'pivot' ? { sourceJobId: job.parentId, notes: job.input.notes } : job.input }));

  app.querySelectorAll('[data-validate]').forEach((b) => {
    b.onclick = () => {
      const src = JSON.parse(b.dataset.validate);
      startJob({ type: 'validate', model: job.model, effort: job.effort, input: { ...src, sourceJobId: job.id } });
    };
  });
  on('pivot', () => {
    const notes = prompt('Pivot için bir notunuz var mı? (isteğe bağlı, ör. "B2B yönüne kaydırmayı dene")') ?? '';
    startJob({ type: 'pivot', model: job.model, effort: job.effort, input: { sourceJobId: job.id, notes } });
  });
}

function scoreBreakdown(scores, score) {
  const rows = status.components
    .map((c) => {
      const s = scores?.[c.key] || {};
      const pct = Math.max(0, Math.min(10, s.score || 0)) * 10;
      return `<div class="sb-row">
        <div class="sb-label">${esc(c.label)} <span class="muted">%${c.weight}</span></div>
        <div class="sb-bar"><span style="width:${pct}%"></span></div>
        <div class="sb-val">${s.score ?? '-'}/10</div>
        <div class="sb-reason muted">${esc(s.reason)}</div>
      </div>`;
    })
    .join('');
  const caps = score?.capped ? `<p class="notice">Puan ${Math.round(score.raw)} idi, şu nedenle sınırlandı: ${esc(score.caps.map((c) => c.reason).join('; '))}</p>` : '';
  return `<div class="score-breakdown">${rows}</div>${caps}`;
}

const evidenceList = (ev) =>
  ev?.length ? `<ul class="evidence">${ev.map((e) => `<li>${esc(e.claim)} ${e.url ? `<span class="src">(${link(e.url)})</span>` : ''}</li>`).join('')}</ul>` : '<p class="muted">Kanıt yok</p>';

function renderDiscovery(job) {
  const r = job.result;
  return `<section class="card"><h2>Pazar gözlemi</h2><p>${esc(r.market_notes)}</p>
    ${r.excluded_audiences?.length ? `<h3>Elenen kitleler</h3><ul>${r.excluded_audiences.map((x) => `<li><b>${esc(x.audience)}</b>: ${esc(x.reason)}</li>`).join('')}</ul>` : ''}
  </section>
  ${r.candidates
    .map((c, i) => {
      const idea = `${c.name}: ${c.one_liner}\nHedef kitle: ${c.target_audience}\nProblem: ${c.problem}\nÜrün tipi: ${c.product_type}, pazar: ${c.market}`;
      const context = `Para verme kanıtı: ${c.why_they_pay}\nMevcut alternatifler: ${c.existing_alternatives}\nBoşluk: ${c.gap}\nKanıtlar:\n${c.evidence.map((e) => `- ${e.claim} (${e.url})`).join('\n')}`;
      return `<section class="card candidate">
      <div class="cand-head">
        <div><span class="muted">#${i + 1} · ${esc(c.product_type)} · ${esc(c.market)}</span><h2>${esc(c.name)}</h2><p class="lead">${esc(c.one_liner)}</p></div>
        <div class="cand-score">${scoreBadge(c.score)}<div class="muted small">${esc(c.score?.verdict_label)}</div></div>
      </div>
      <dl class="facts">
        <dt>Hedef kitle</dt><dd>${esc(c.target_audience)}</dd>
        <dt>Problem</dt><dd>${esc(c.problem)}</dd>
        <dt>Neden para verirler</dt><dd>${esc(c.why_they_pay)}</dd>
        <dt>Bugünkü alternatifler</dt><dd>${esc(c.existing_alternatives)}</dd>
        <dt>Boşluk</dt><dd>${esc(c.gap)}</dd>
        <dt>En büyük risk</dt><dd>${esc(c.main_risk)} · Yasal risk: ${levelTag(c.legal_risk)}</dd>
      </dl>
      <details><summary>Puan ayrıntısı ve kanıtlar</summary>${scoreBreakdown(c.scores, c.score)}<h3>Kanıtlar</h3>${evidenceList(c.evidence)}</details>
      <div class="actions no-print"><button class="primary" data-validate="${esc(JSON.stringify({ idea, context, title: c.name }))}">Bu fikri doğrula</button></div>
    </section>`;
    })
    .join('')}`;
}

function section(title, html) {
  return `<section class="card"><h2>${title}</h2>${html}</section>`;
}

function renderValidation(job) {
  const r = job.result;
  const s = r.summary;
  const kwTable = (rows, cols) =>
    rows?.length
      ? `<table class="table"><thead><tr>${cols.map((c) => `<th>${c[1]}</th>`).join('')}</tr></thead><tbody>${rows
          .map((row) => `<tr>${cols.map((c) => `<td>${c[0] === 'competition' ? levelTag(row[c[0]]) : c[0] === 'relevance' ? levelTag(row[c[0]], true) : esc(row[c[0]])}</td>`).join('')}</tr>`)
          .join('')}</tbody></table>`
      : '<p class="muted">Veri yok</p>';

  return `
  <section class="card verdict ${verdictClass(r.score.verdict)}">
    <div class="verdict-top">
      <div><h2>${esc(s.idea_name)}</h2><p class="lead">${esc(s.one_liner)}</p></div>
      <div class="cand-score">${scoreBadge(r.score)}<div class="small"><b>${esc(r.score.verdict_label)}</b></div></div>
    </div>
    <p>${esc(s.verdict_reason)}</p>
    <dl class="facts"><dt>En büyük risk</dt><dd>${esc(s.biggest_risk)}</dd><dt>Sonraki adım</dt><dd>${esc(s.next_action)}</dd></dl>
    <div class="actions no-print"><button id="pivot">Pivot / yeniden konumlandır</button></div>
  </section>
  ${section('Puan ayrıntısı', scoreBreakdown(r.scores, r.score))}
  ${section(
    'Problem doğrulama',
    `<p>${esc(r.problem_validation.problem)}</p>
    <p>Sıklık: ${levelTag(r.problem_validation.frequency, true)} · Acı düzeyi: ${levelTag(r.problem_validation.intensity, true)}</p>
    <h3>İnsanlar bugün nasıl idare ediyor</h3>${list(r.problem_validation.current_workarounds)}
    <h3>Kullanıcıların kendi sözleri</h3>${
      r.problem_validation.user_quotes?.length
        ? r.problem_validation.user_quotes.map((q) => `<blockquote>“${esc(q.quote)}” <span class="src">${link(q.url)}</span></blockquote>`).join('')
        : '<p class="muted">Veri yok</p>'
    }`,
  )}
  ${section(
    'Hedef kitle',
    r.audience.segments
      .map(
        (seg) => `<div class="segment">
      <h3>${esc(seg.name)} ${seg.validated ? '<span class="tag ok">doğrulandı</span>' : '<span class="tag warn">doğrulanmadı</span>'} <span class="muted small">Ödeme isteği:</span> ${levelTag(seg.willingness_to_pay, true)}</h3>
      <p>${esc(seg.description)}</p>
      <dl class="facts"><dt>Büyüklük</dt><dd>${esc(seg.size_estimate)}</dd><dt>Ödeme kanıtı</dt><dd>${esc(seg.wtp_evidence)}</dd></dl>
      <div class="cols"><div><h4>Beklentiler</h4>${list(seg.expectations)}</div><div><h4>Acı noktaları</h4>${list(seg.pains)}</div></div>
      <h4>Sık kullandıkları platformlar</h4>
      <ul>${seg.platforms.map((p) => `<li><b>${link(p.url, p.name)}</b>${p.note ? `: ${esc(p.note)}` : ''}</li>`).join('')}</ul>
      <details><summary>Kanıtlar</summary>${evidenceList(seg.evidence)}</details>
    </div>`,
      )
      .join('') +
      (r.audience.excluded_segments?.length
        ? `<h3>Hedeflenmemesi gereken kitleler</h3><ul>${r.audience.excluded_segments.map((x) => `<li><b>${esc(x.name)}</b>: ${esc(x.reason)}</li>`).join('')}</ul>`
        : ''),
  )}
  ${section(
    'Rakipler',
    `<div class="table-wrap"><table class="table"><thead><tr><th>Rakip</th><th>Tür</th><th>Platform</th><th>Fiyat</th><th>Ölçülen veri</th><th>Güçlü</th><th>Zayıf (şikâyetler)</th></tr></thead><tbody>
    ${r.competitors
      .map(
        (c) => `<tr><td><b>${link(c.url, c.name)}</b>${c.is_giant ? ' <span class="tag warn">dev</span>' : ''}</td><td>${esc(c.kind)}</td><td>${esc(c.platform)}</td><td>${esc(c.pricing)}</td><td>${esc(c.traction)}</td><td>${list(c.strengths)}</td><td>${list(c.weaknesses)}</td></tr>`,
      )
      .join('')}</tbody></table></div>`,
  )}
  ${section(
    'Pazardaki konum',
    `<dl class="facts"><dt>Doygunluk</dt><dd>${levelTag(r.market_position.saturation)}</dd><dt>Devler</dt><dd>${esc(r.market_position.giants_present)}</dd><dt>Trend</dt><dd>${esc(r.market_position.trend)}</dd><dt>Boşluk</dt><dd>${esc(r.market_position.gap)}</dd><dt>Neden şimdi</dt><dd>${esc(r.market_position.why_now)}</dd></dl>`,
  )}
  ${section(
    'Konumlandırma',
    `<p class="statement">${esc(r.positioning.statement)}</p>
    <p><b>Slogan:</b> ${esc(r.positioning.tagline)}</p>
    <dl class="facts"><dt>Kategori</dt><dd>${esc(r.positioning.category)}</dd><dt>En iyi uyan müşteri</dt><dd>${esc(r.positioning.best_fit_customer)}</dd><dt>Değer</dt><dd>${esc(r.positioning.value)}</dd></dl>
    <div class="cols"><div><h4>Müşterinin alternatifleri</h4>${list(r.positioning.competitive_alternatives)}</div><div><h4>Sadece bizde olanlar</h4>${list(r.positioning.unique_attributes)}</div></div>`,
  )}
  ${section(
    'ASO ve SEO anahtar kelimeleri',
    `<dl class="facts"><dt>Mağaza adı önerileri</dt><dd>${esc(r.keywords.app_name_ideas.join(' · '))}</dd><dt>Alt başlık</dt><dd>${esc(r.keywords.app_subtitle)}</dd></dl>
    <h3>ASO (uygulama mağazası)</h3>${kwTable(r.keywords.aso, [['keyword', 'Kelime'], ['language', 'Dil'], ['competition', 'Rekabet'], ['relevance', 'Uygunluk'], ['source', 'Kaynak']])}
    <h3>SEO (Google)</h3>${kwTable(r.keywords.seo, [['keyword', 'Kelime'], ['language', 'Dil'], ['intent', 'Niyet'], ['competition', 'Rekabet'], ['content_idea', 'İçerik fikri']])}`,
  )}
  ${section(
    'Gelir ve maliyet',
    `<dl class="facts"><dt>Fiyat modeli</dt><dd>${esc(r.business.pricing_model)}</dd><dt>Önerilen fiyat</dt><dd>${esc(r.business.suggested_price)}</dd><dt>Kullanıcı başı maliyet</dt><dd>${esc(r.business.cost_per_user_month)}</dd><dt>Brüt kâr marjı</dt><dd>${esc(r.business.gross_margin)}</dd><dt>Hedef için gereken müşteri</dt><dd>${esc(r.business.customers_for_target)}</dd><dt>Müşteri edinme maliyeti</dt><dd>${esc(r.business.acquisition_cost)}</dd></dl>`,
  )}
  ${section(
    'İlk sürüm (MVP)',
    `<div class="cols"><div><h4>Olmazsa olmazlar</h4>${list(r.mvp.core_features)}</div><div><h4>Şimdilik yapılmayacaklar</h4>${list(r.mvp.not_now)}</div></div>
    <dl class="facts"><dt>Teknoloji</dt><dd>${esc(r.mvp.tech_suggestion)}</dd><dt>Süre</dt><dd>${esc(r.mvp.build_weeks)}</dd></dl>`,
  )}
  ${section(
    'Riskler',
    `<p>Genel yasal risk: ${levelTag(r.legal_risk)}</p><table class="table"><thead><tr><th>Tür</th><th>Risk</th><th>Önem</th><th>Nasıl azaltılır</th></tr></thead><tbody>${r.risks
      .map((x) => `<tr><td>${esc(x.type)}</td><td>${esc(x.description)}</td><td>${levelTag(x.severity)}</td><td>${esc(x.mitigation)}</td></tr>`)
      .join('')}</tbody></table>`,
  )}
  ${section(
    'Doğrulama planı',
    `<dl class="facts"><dt>En riskli varsayım</dt><dd>${esc(r.validation_plan.riskiest_assumption)}</dd>
    <dt>Deney</dt><dd>${esc(r.validation_plan.experiment.method)}</dd><dt>Bütçe / süre</dt><dd>${esc(r.validation_plan.experiment.budget)} · ${esc(r.validation_plan.experiment.duration)}</dd>
    <dt>Başarı ölçütü</dt><dd>${esc(r.validation_plan.experiment.success_criteria)}</dd></dl>
    <h4>Adımlar</h4>${list(r.validation_plan.experiment.steps)}
    <h4>İlk 100 kullanıcı</h4><ul>${r.validation_plan.first_100_users.map((u) => `<li><b>${esc(u.channel)}</b>: ${esc(u.tactic)}</li>`).join('')}</ul>
    <h4>Şu olursa bırakın</h4>${list(r.validation_plan.kill_criteria)}`,
  )}
  ${section('Pivot ipuçları', list(r.pivot_hints))}
  ${section('Doğrulanamayanlar', list(r.data_gaps))}
  ${section('Kaynaklar', `<ol class="sources-list">${r.sources.map((x) => `<li>${link(x.url, x.title || x.url)}</li>`).join('')}</ol>`)}`;
}

function renderPivot(job) {
  const r = job.result;
  return `${section(
    'Zayıflıkların kök nedenleri',
    `<table class="table"><thead><tr><th>Zayıflık</th><th>Neden türü</th><th>Açıklama</th></tr></thead><tbody>${r.root_causes
      .map((c) => `<tr><td>${esc(c.weakness)}</td><td>${esc(c.cause_type)}</td><td>${esc(c.explanation)}</td></tr>`)
      .join('')}</tbody></table>`,
  )}
  ${section('Öneri', `<p>${esc(r.recommendation)}</p>`)}
  ${r.options
    .map(
      (o) => `<section class="card candidate">
    <div class="cand-head"><div><span class="muted">Değişen: ${esc(o.changed_variables.join(', '))} · Çaba: ${esc(o.effort)}</span><h2>${esc(o.title)}</h2><p class="lead">${esc(o.new_idea)}</p></div>
    <div class="cand-score">${scoreBadge(o.score)}<div class="muted small">${esc(o.score?.verdict_label)}</div></div></div>
    <dl class="facts"><dt>Yeni hedef kitle</dt><dd>${esc(o.new_target_audience)}</dd><dt>Yeni konumlandırma</dt><dd>${esc(o.new_positioning)}</dd><dt>Neden daha iyi</dt><dd>${esc(o.why_better)}</dd><dt>Korunan güçlü yön</dt><dd>${esc(o.kept_strengths)}</dd><dt>Yasal risk</dt><dd>${levelTag(o.legal_risk)}</dd></dl>
    <details><summary>Puan ayrıntısı ve kanıtlar</summary>${scoreBreakdown(o.scores, o.score)}<h3>Kanıtlar</h3>${evidenceList(o.evidence)}</details>
    <div class="actions no-print"><button class="primary" data-validate="${esc(JSON.stringify({ idea: o.new_idea, context: `Pivot gerekçesi: ${o.why_better}\nYeni kitle: ${o.new_target_audience}`, title: o.title }))}">Bu seçeneği doğrula</button></div>
  </section>`,
    )
    .join('')}`;
}

// ---------- Markdown dışa aktarma ----------
function toMarkdown(job) {
  const r = job.result;
  const L = (a) => (a || []).map((x) => `- ${x}`).join('\n');
  const S = (scores, score) =>
    status.components.map((c) => `| ${c.label} | ${scores[c.key]?.score}/10 | ${scores[c.key]?.reason} |`).join('\n') +
    `\n\n**Toplam: ${Math.round(score.total)}/100 · ${score.verdict_label}**${score.capped ? ` (sınırlandı: ${score.caps.map((c) => c.reason).join('; ')})` : ''}`;
  const head = '| Bileşen | Puan | Gerekçe |\n|---|---|---|\n';

  if (job.type === 'discover') {
    return `# ${job.title}\n\n${r.market_notes}\n\n## Elenen kitleler\n${r.excluded_audiences.map((x) => `- **${x.audience}**: ${x.reason}`).join('\n')}\n\n${r.candidates
      .map(
        (c, i) =>
          `## ${i + 1}. ${c.name} (${Math.round(c.score.total)}/100)\n${c.one_liner}\n\n- **Hedef kitle:** ${c.target_audience}\n- **Problem:** ${c.problem}\n- **Neden para verirler:** ${c.why_they_pay}\n- **Alternatifler:** ${c.existing_alternatives}\n- **Boşluk:** ${c.gap}\n- **Risk:** ${c.main_risk} (yasal: ${c.legal_risk})\n\n${head}${S(c.scores, c.score)}\n\n**Kanıtlar**\n${c.evidence.map((e) => `- ${e.claim} (${e.url})`).join('\n')}`,
      )
      .join('\n\n')}\n`;
  }
  if (job.type === 'pivot') {
    return `# ${job.title}\n\n## Öneri\n${r.recommendation}\n\n## Kök nedenler\n${r.root_causes.map((c) => `- **${c.weakness}** (${c.cause_type}): ${c.explanation}`).join('\n')}\n\n${r.options
      .map((o) => `## ${o.title} (${Math.round(o.score.total)}/100)\n${o.new_idea}\n\n- **Değişen:** ${o.changed_variables.join(', ')}\n- **Yeni kitle:** ${o.new_target_audience}\n- **Konumlandırma:** ${o.new_positioning}\n- **Neden daha iyi:** ${o.why_better}\n\n${head}${S(o.scores, o.score)}`)
      .join('\n\n')}\n`;
  }
  const s = r.summary;
  return `# ${s.idea_name}
${s.one_liner}

**Karar: ${r.score.verdict_label} (${Math.round(r.score.total)}/100)**

${s.verdict_reason}

- **En büyük risk:** ${s.biggest_risk}
- **Sonraki adım:** ${s.next_action}

## Puanlar
${head}${S(r.scores, r.score)}

## Problem
${r.problem_validation.problem}

Sıklık: ${r.problem_validation.frequency} · Acı düzeyi: ${r.problem_validation.intensity}

**Bugün nasıl idare ediyorlar**
${L(r.problem_validation.current_workarounds)}

**Kullanıcı sözleri**
${r.problem_validation.user_quotes.map((q) => `> "${q.quote}" (${q.url})`).join('\n\n')}

## Hedef kitle
${r.audience.segments
  .map(
    (g) => `### ${g.name}${g.validated ? ' (doğrulandı)' : ' (doğrulanmadı)'}
${g.description}

- **Büyüklük:** ${g.size_estimate}
- **Ödeme isteği:** ${g.willingness_to_pay}: ${g.wtp_evidence}

**Beklentiler**
${L(g.expectations)}

**Acı noktaları**
${L(g.pains)}

**Platformlar**
${g.platforms.map((p) => `- ${p.name}${p.url ? ` (${p.url})` : ''}${p.note ? `: ${p.note}` : ''}`).join('\n')}`,
  )
  .join('\n\n')}

**Hedeflenmemesi gerekenler**
${r.audience.excluded_segments.map((x) => `- ${x.name}: ${x.reason}`).join('\n')}

## Rakipler
| Rakip | Tür | Platform | Fiyat | Veri | Zayıf yanlar |
|---|---|---|---|---|---|
${r.competitors.map((c) => `| [${c.name}](${c.url}) | ${c.kind} | ${c.platform} | ${c.pricing} | ${c.traction} | ${c.weaknesses.join('; ')} |`).join('\n')}

## Pazardaki konum
- **Doygunluk:** ${r.market_position.saturation}
- **Devler:** ${r.market_position.giants_present}
- **Trend:** ${r.market_position.trend}
- **Boşluk:** ${r.market_position.gap}
- **Neden şimdi:** ${r.market_position.why_now}

## Konumlandırma
> ${r.positioning.statement}

- **Slogan:** ${r.positioning.tagline}
- **Kategori:** ${r.positioning.category}
- **En iyi uyan müşteri:** ${r.positioning.best_fit_customer}
- **Sadece bizde olanlar:** ${r.positioning.unique_attributes.join('; ')}

## ASO anahtar kelimeleri
Mağaza adı önerileri: ${r.keywords.app_name_ideas.join(' · ')}
Alt başlık: ${r.keywords.app_subtitle}

| Kelime | Dil | Rekabet | Uygunluk |
|---|---|---|---|
${r.keywords.aso.map((k) => `| ${k.keyword} | ${k.language} | ${k.competition} | ${k.relevance} |`).join('\n')}

## SEO anahtar kelimeleri
| Kelime | Dil | Niyet | Rekabet | İçerik fikri |
|---|---|---|---|---|
${r.keywords.seo.map((k) => `| ${k.keyword} | ${k.language} | ${k.intent} | ${k.competition} | ${k.content_idea} |`).join('\n')}

## Gelir ve maliyet
- **Fiyat modeli:** ${r.business.pricing_model}
- **Önerilen fiyat:** ${r.business.suggested_price}
- **Kullanıcı başı maliyet:** ${r.business.cost_per_user_month}
- **Brüt marj:** ${r.business.gross_margin}
- **Hedef için müşteri sayısı:** ${r.business.customers_for_target}
- **Müşteri edinme maliyeti:** ${r.business.acquisition_cost}

## MVP
${L(r.mvp.core_features)}

Şimdilik yok:
${L(r.mvp.not_now)}

Teknoloji: ${r.mvp.tech_suggestion} · Süre: ${r.mvp.build_weeks}

## Riskler (genel yasal risk: ${r.legal_risk})
${r.risks.map((x) => `- **${x.type} (${x.severity}):** ${x.description}. Önlem: ${x.mitigation}`).join('\n')}

## Doğrulama planı
- **En riskli varsayım:** ${r.validation_plan.riskiest_assumption}
- **Deney:** ${r.validation_plan.experiment.method} (${r.validation_plan.experiment.budget}, ${r.validation_plan.experiment.duration})
- **Başarı ölçütü:** ${r.validation_plan.experiment.success_criteria}

${L(r.validation_plan.experiment.steps)}

**İlk 100 kullanıcı**
${r.validation_plan.first_100_users.map((u) => `- ${u.channel}: ${u.tactic}`).join('\n')}

**Şu olursa bırakın**
${L(r.validation_plan.kill_criteria)}

## Doğrulanamayanlar
${L(r.data_gaps)}

## Kaynaklar
${r.sources.map((x) => `- ${x.title || x.url}: ${x.url}`).join('\n')}
`;
}

// ---------- yönlendirme ----------
async function route() {
  clearTimeout(pollTimer);
  if (!status) await loadStatus();
  const [, page, id] = location.hash.split('/');
  try {
    if (page === 'profil') await profilePage();
    else if (page === 'dogrula') await validatePage();
    else if (page === 'gecmis') await historyPage();
    else if (page === 'is' && id) await jobPage(id);
    else {
      const p = await api('/api/profile');
      if (!location.hash && !p.market) location.hash = '#/profil';
      else await discoverPage();
    }
  } catch (e) {
    app.innerHTML = `<section class="card"><p class="error">${esc(e.message)}</p></section>`;
  }
}

window.addEventListener('hashchange', route);
route();
