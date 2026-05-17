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

async function pollRun(runId, intervalMs = 3000, maxWaitMs = 120000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const { data } = await apiFetch(`/actor-runs/${runId}`);
    if (data.status === 'SUCCEEDED') return data.defaultDatasetId;
    if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(data.status)) {
      throw new Error(`Run ${data.status.toLowerCase()}. Verifique os parâmetros de busca.`);
    }
    await new Promise(r => setTimeout(r, intervalMs));
  }
  throw new Error('Timeout: a busca demorou mais de 2 minutos.');
}

// Monta a URL da Ad Library com o termo de busca
function buildAdLibraryUrl({ query = '', country = 'BR', activeStatus = 'ACTIVE' } = {}) {
  const status = activeStatus === 'ACTIVE' ? 'active' : 'all';
  const params = new URLSearchParams({
    active_status: status,
    ad_type: 'all',
    country,
    q: query || 'curso',
    media_type: 'all',
  });
  return `https://www.facebook.com/ads/library/?${params.toString()}`;
}

export async function searchAds({ query = '', country = 'BR', activeStatus = 'ACTIVE', limit = 30 } = {}) {
  const url = buildAdLibraryUrl({ query, country, activeStatus });

  const { data: run } = await apiFetch(`/acts/${ACTOR}/runs`, {
    method: 'POST',
    body: JSON.stringify({
      urls: [{ url }],
      totalRecordsRequired: limit,
      scrapeAdDetails: false,
    }),
  });

  const datasetId = await pollRun(run.id);

  const { items } = await apiFetch(`/datasets/${datasetId}/items?clean=true&format=json`);
  return (items || []).map(normalizeAd);
}

function normalizeAd(raw) {
  const startDate = raw.startDate || raw.adCreationTime || raw.start_date || '';
  const daysRunning = startDate
    ? Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000)
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
      raw.contentType === 'VIDEO' ||
      raw.ad_creative_link_captions?.includes('video'),
    status: raw.isActive || raw.is_active || raw.adActiveStatus === 'ACTIVE' ? 'active' : 'inactive',
    daysRunning: Math.max(0, daysRunning),
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
