// Yerel (bilgisayarınızda çalışan) veri araçları.
// Claude bu araçları çağırır, sonuçları biz toplayıp geri göndeririz.
// Hepsi ücretsiz ve API anahtarı gerektirmez.
import gplay from 'google-play-scraper';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126 Safari/537.36';

async function getJson(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA }, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`${url} -> HTTP ${res.status}`);
  return res.json();
}

const clip = (s, n) => (typeof s === 'string' && s.length > n ? s.slice(0, n) + '…' : s);

export const toolDefinitions = [
  {
    name: 'appstore_search',
    description:
      'Apple App Store\'da arama yapar (iTunes Search API). Rakip uygulamaları, puanlarını, değerlendirme sayılarını, fiyatlarını, son güncelleme tarihlerini döndürür. Bir anahtar kelimedeki rekabeti ve pazarın ne kadar dolu olduğunu ölçmek için kullanın. country: iki harfli ülke kodu (tr, us, gb, de...).',
    input_schema: {
      type: 'object',
      properties: {
        term: { type: 'string', description: 'Aranacak kelime veya ifade' },
        country: { type: 'string', description: 'Ülke kodu, ör. tr veya us' },
        limit: { type: 'integer', description: 'En fazla kaç sonuç (1-25)' },
      },
      required: ['term', 'country'],
    },
  },
  {
    name: 'appstore_reviews',
    description:
      'Bir App Store uygulamasının en yeni kullanıcı yorumlarını getirir. max_rating=3 verirseniz sadece 1-3 yıldızlı yorumlar gelir: kullanıcıların neyden şikâyet ettiğini, rakibin hangi boşluğu bıraktığını bulmak için kullanın.',
    input_schema: {
      type: 'object',
      properties: {
        app_id: { type: 'integer', description: 'appstore_search sonucundaki trackId' },
        country: { type: 'string', description: 'Ülke kodu, ör. tr veya us' },
        max_rating: { type: 'integer', description: 'Bu puan ve altındaki yorumlar (1-5). Boş bırakılırsa hepsi.' },
      },
      required: ['app_id', 'country'],
    },
  },
  {
    name: 'playstore_search',
    description:
      'Google Play\'de arama yapar. İlk sonuçlar için indirme sayısı, puan, değerlendirme sayısı, fiyat, uygulama içi satın alma ve son güncelleme bilgisi döner. Rekabeti ve talebi (indirme sayıları) ölçmek için kullanın.',
    input_schema: {
      type: 'object',
      properties: {
        term: { type: 'string' },
        country: { type: 'string', description: 'Ülke kodu, ör. tr veya us' },
        lang: { type: 'string', description: 'Dil kodu, ör. tr veya en' },
        limit: { type: 'integer', description: 'En fazla kaç sonuç (1-10)' },
      },
      required: ['term', 'country', 'lang'],
    },
  },
  {
    name: 'playstore_reviews',
    description:
      'Bir Google Play uygulamasının en yeni yorumlarını getirir. max_rating=3 ile sadece şikâyetleri alın.',
    input_schema: {
      type: 'object',
      properties: {
        app_id: { type: 'string', description: 'Paket adı, ör. com.ornek.uygulama' },
        country: { type: 'string' },
        lang: { type: 'string' },
        max_rating: { type: 'integer' },
      },
      required: ['app_id', 'country', 'lang'],
    },
  },
  {
    name: 'keyword_suggestions',
    description:
      'Gerçek kullanıcı aramalarından gelen otomatik tamamlama önerilerini getirir. source="google" Google aramasını (SEO), source="playstore" Google Play aramasını (ASO) temsil eder. Önerilerde çıkan ifade, insanların gerçekten aradığı bir ifadedir. Birden çok sorgu tek seferde verilebilir (en fazla 10).',
    input_schema: {
      type: 'object',
      properties: {
        queries: { type: 'array', items: { type: 'string' }, description: 'Başlangıç ifadeleri' },
        source: { type: 'string', enum: ['google', 'playstore'] },
        lang: { type: 'string', description: 'tr veya en' },
        country: { type: 'string', description: 'tr veya us' },
      },
      required: ['queries', 'source', 'lang', 'country'],
    },
  },
];

async function appstoreSearch({ term, country, limit = 15 }) {
  const n = Math.min(Math.max(limit, 1), 25);
  const url = `https://itunes.apple.com/search?entity=software&term=${encodeURIComponent(term)}&country=${country}&limit=${n}`;
  const data = await getJson(url);
  return {
    term,
    country,
    result_count: data.resultCount,
    apps: (data.results || []).map((a) => ({
      trackId: a.trackId,
      name: a.trackName,
      developer: a.sellerName,
      rating: a.averageUserRating ? Number(a.averageUserRating.toFixed(2)) : null,
      rating_count: a.userRatingCount ?? 0,
      price: a.formattedPrice,
      genre: a.primaryGenreName,
      first_release: a.releaseDate?.slice(0, 10),
      last_update: a.currentVersionReleaseDate?.slice(0, 10),
      url: a.trackViewUrl,
      description: clip(a.description, 300),
    })),
  };
}

async function appstoreReviews({ app_id, country, max_rating }) {
  const url = `https://itunes.apple.com/${country}/rss/customerreviews/page=1/id=${app_id}/sortby=mostrecent/json`;
  const data = await getJson(url);
  let entries = data?.feed?.entry || [];
  if (!Array.isArray(entries)) entries = [entries];
  let reviews = entries
    .filter((e) => e['im:rating'])
    .map((e) => ({
      rating: Number(e['im:rating'].label),
      title: e.title?.label,
      text: clip(e.content?.label, 600),
      date: e.updated?.label?.slice(0, 10),
    }));
  if (max_rating) reviews = reviews.filter((r) => r.rating <= max_rating);
  return { app_id, country, count: reviews.length, reviews: reviews.slice(0, 40) };
}

async function playstoreSearch({ term, country, lang, limit = 8 }) {
  const n = Math.min(Math.max(limit, 1), 10);
  const results = await gplay.search({ term, num: n, country, lang, fullDetail: false });
  const detailed = await Promise.all(
    results.slice(0, n).map(async (r) => {
      try {
        const a = await gplay.app({ appId: r.appId, country, lang });
        return {
          appId: a.appId,
          name: a.title,
          developer: a.developer,
          installs: a.installs,
          rating: a.score ? Number(a.score.toFixed(2)) : null,
          rating_count: a.ratings,
          price: a.free ? 'Ücretsiz' : a.priceText,
          in_app_purchases: a.offersIAP ? a.IAPRange || 'var' : 'yok',
          genre: a.genre,
          released: a.released,
          last_update: a.updated ? new Date(a.updated).toISOString().slice(0, 10) : null,
          url: a.url,
          summary: clip(a.summary, 200),
        };
      } catch {
        return { appId: r.appId, name: r.title, developer: r.developer, rating: r.score, url: r.url };
      }
    }),
  );
  return { term, country, apps: detailed };
}

async function playstoreReviews({ app_id, country, lang, max_rating }) {
  const { data } = await gplay.reviews({ appId: app_id, country, lang, sort: gplay.sort.NEWEST, num: 150 });
  let reviews = data.map((r) => ({
    rating: r.score,
    text: clip(r.text, 600),
    date: r.date ? new Date(r.date).toISOString().slice(0, 10) : null,
    thumbs_up: r.thumbsUp,
  }));
  if (max_rating) reviews = reviews.filter((r) => r.rating <= max_rating);
  return { app_id, country, count: reviews.length, reviews: reviews.slice(0, 40) };
}

async function keywordSuggestions({ queries, source, lang, country }) {
  const list = (queries || []).slice(0, 10);
  const out = {};
  for (const q of list) {
    try {
      if (source === 'playstore') {
        out[q] = await gplay.suggest({ term: q, lang, country });
      } else {
        const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=${lang}&gl=${country}&q=${encodeURIComponent(q)}`;
        const data = await getJson(url);
        out[q] = data[1] || [];
      }
    } catch (e) {
      out[q] = { error: e.message };
    }
  }
  return { source, lang, country, suggestions: out };
}

const handlers = {
  appstore_search: appstoreSearch,
  appstore_reviews: appstoreReviews,
  playstore_search: playstoreSearch,
  playstore_reviews: playstoreReviews,
  keyword_suggestions: keywordSuggestions,
};

export async function runLocalTool(name, input) {
  const fn = handlers[name];
  if (!fn) throw new Error(`Bilinmeyen araç: ${name}`);
  return fn(input || {});
}
