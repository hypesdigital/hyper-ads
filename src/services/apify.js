const BASE = 'https://api.apify.com/v2';
const ACTOR = 'curious_coder~facebook-ads-library-scraper';

export function getToken() {
  return localStorage.getItem('apify_token') || '';
}

async function apiFetch(path, options = {}) {
  const token = getToken();
  if (!token) throw new Error('Token Apify não configurado. Vá em Settings e insira seu token.');

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Erro ${res.status} na API Apify`);
  }

  return res.json();
}

async function abortRun(runId) {
  try {
    await apiFetch(`/actor-runs/${runId}/abort`, { method: 'POST' });
  } catch (_) { /* silencia */ }
}

function buildAdLibraryUrl({ query = '', country = 'BR' } = {}) {
  const params = new URLSearchParams({
    active_status: 'active',
    ad_type: 'all',
    country,
    q: query,
    media_type: 'all',
  });
  return `https://www.facebook.com/ads/library/?${params.toString()}`;
}

export async function searchAds({ query = '', country = 'BR', limit = 20 } = {}) {
  const adLibraryUrl = buildAdLibraryUrl({ query, country });

  // Inicia o run e aguarda no máx. 45s server-side
  // Actor leva ~11s só de startup — 45s garante coleta de ~50-100 ads antes do abort
  const { data: run } = await apiFetch(
    `/acts/${ACTOR}/runs?waitForFinish=45`,
    {
      method: 'POST',
      body: JSON.stringify({
        // Tentamos os dois formatos de URL que o actor pode aceitar
        startUrls: [{ url: adLibraryUrl }],
        urls: [{ url: adLibraryUrl }],
        // Limite pelos três nomes de campo possíveis
        totalRecordsRequired: limit,
        limitPerUrl: limit,
        maxResults: limit,
        scrapeAdDetails: false,
      }),
    }
  );

  const runId = run.id;
  const datasetId = run.defaultDatasetId;

  // Se ainda estiver rodando após 20s → aborta imediatamente para parar o custo
  if (run.status === 'RUNNING' || run.status === 'READY') {
    await abortRun(runId);
  }

  // Usa os resultados parciais que foram coletados até o abort
  // ?limit=N garante que pegamos no máximo o que o usuário pediu
  const { items } = await apiFetch(
    `/datasets/${datasetId}/items?clean=true&format=json&limit=${limit}`
  );

  const results = (items || []).map(normalizeAd);

  if (results.length === 0) {
    throw new Error(
      'Nenhum resultado encontrado para este termo. ' +
      'Tente palavras diferentes (ex: "curso ingles", "emagrecimento", "tráfego pago").'
    );
  }

  return results;
}

function normalizeAd(raw) {
  const startDate = raw.startDate || raw.adCreationTime || raw.start_date || '';
  const daysRunning = startDate
    ? Math.max(0, Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000))
    : 0;

  return {
    id: raw.adArchiveID || raw.ad_archive_id || raw.id || String(Math.random()),
    advertiserName: raw.pageName || raw.page_name || raw.advertiserName || 'Anunciante',
    advertiserPage: raw.pageProfileUri || raw.page_profile_uri || '#',
    advertiserAvatar:
      raw.pageProfilePictureURL ||
      raw.page_profile_picture_url ||
      `https://i.pravatar.cc/40?u=${raw.adArchiveID || raw.id}`,
    thumbnail:
      raw.snapshot?.cards?.[0]?.resizedImageUrl ||
      raw.snapshot?.images?.[0]?.resizedImageUrl ||
      raw.creative_media_url ||
      `https://picsum.photos/seed/${raw.adArchiveID || raw.id}/400/300`,
    isVideo:
      !!raw.snapshot?.cards?.[0]?.videoHdUrl ||
      (raw.snapshot?.videos?.length > 0) ||
      raw.contentType === 'VIDEO',
    status: raw.isActive || raw.is_active || raw.adActiveStatus === 'ACTIVE'
      ? 'active' : 'inactive',
    daysRunning,
    adCount: raw.adCount || raw.total_ads_count || raw.collationCount || 1,
    platforms: normalizePlatforms(raw.publisherPlatform || raw.publisher_platform),
    language: (raw.languageCode || raw.language_code || 'PT').toUpperCase(),
    gateway: detectGateway(raw),
    productType: detectProductType(raw),
    siteType: 'Landing Page',
    publishedAt: startDate || new Date().toISOString().slice(0, 10),
    copy:
      raw.snapshot?.body?.text ||
      raw.ad_creative_body ||
      raw.adCreativeBody ||
      raw.caption || '',
    fullCopy:
      raw.snapshot?.body?.text ||
      raw.ad_creative_body ||
      raw.adCreativeBody ||
      raw.caption || '',
    salesPageUrl:
      raw.snapshot?.cards?.[0]?.linkUrl ||
      raw.website_url ||
      raw.websiteURL || '#',
    adLibraryUrl: `https://www.facebook.com/ads/library/?id=${raw.adArchiveID || raw.id}`,
  };
}

function normalizePlatforms(raw) {
  if (!raw) return ['facebook'];
  const list = Array.isArray(raw) ? raw : [raw];
  const mapped = list
    .map(p => String(p).toLowerCase())
    .filter(p => ['facebook', 'instagram'].includes(p));
  return mapped.length > 0 ? mapped : ['facebook'];
}

function detectGateway(raw) {
  const text = JSON.stringify(raw).toLowerCase();
  if (text.includes('hotmart')) return 'Hotmart';
  if (text.includes('kiwify')) return 'Kiwify';
  if (text.includes('cakto')) return 'Cakto';
  if (text.includes('eduzz')) return 'Eduzz';
  if (text.includes('monetizze')) return 'Monetizze';
  if (text.includes('braip')) return 'Braip';
  return 'Outro';
}

function detectProductType(raw) {
  const text = JSON.stringify(raw).toLowerCase();
  if (
    text.includes('curso') || text.includes('treinamento') ||
    text.includes('ebook') || text.includes('mentoria') ||
    text.includes('hotmart') || text.includes('kiwify')
  ) return 'Infoproduto';
  return 'Físico';
}
