const BASE = 'https://api.apify.com/v2';
const ACTOR = 'apify~facebook-ads-scraper';

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

export async function searchAds({ query = '', country = 'BR', activeStatus = 'ACTIVE', limit = 20 } = {}) {
  const { data: run } = await apiFetch(`/acts/${ACTOR}/runs`, {
    method: 'POST',
    body: JSON.stringify({
      searchTerms: [query || 'curso'],
      countries: [country],
      adActiveStatus: activeStatus,
      maxResults: limit,
    }),
  });

  const datasetId = await pollRun(run.id);

  const { items } = await apiFetch(`/datasets/${datasetId}/items?clean=true&format=json`);
  return (items || []).map(normalizeAd);
}

function normalizeAd(raw) {
  const startDate = raw.startDate || raw.adCreationTime || '';
  const daysRunning = startDate
    ? Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000)
    : 0;

  return {
    id: raw.adArchiveID || raw.id || String(Math.random()),
    advertiserName: raw.pageName || raw.advertiserName || 'Anunciante',
    advertiserPage: raw.pageProfileUri || raw.advertiserProfileLink || '#',
    advertiserAvatar: raw.pageProfilePictureURL || `https://i.pravatar.cc/40?u=${raw.adArchiveID}`,
    thumbnail: raw.snapshot?.cards?.[0]?.resizedImageUrl
      || raw.snapshot?.images?.[0]?.resizedImageUrl
      || raw.creativeMediaUrl
      || `https://picsum.photos/seed/${raw.adArchiveID}/400/300`,
    isVideo: raw.snapshot?.cards?.[0]?.videoHdUrl != null
      || raw.snapshot?.videos?.length > 0
      || raw.contentType === 'VIDEO',
    status: raw.isActive || raw.adActiveStatus === 'ACTIVE' ? 'active' : 'inactive',
    daysRunning,
    adCount: raw.adCount || raw.totalAdsCount || 1,
    platforms: normalizePlatforms(raw.publisherPlatform || raw.platforms),
    language: raw.languageCode?.toUpperCase() || 'PT',
    gateway: detectGateway(raw),
    productType: 'Infoproduto',
    siteType: 'Landing Page',
    publishedAt: startDate || new Date().toISOString().slice(0, 10),
    copy: raw.snapshot?.body?.text || raw.adCreativeBody || raw.caption || '',
    fullCopy: raw.snapshot?.body?.text || raw.adCreativeBody || raw.caption || '',
    salesPageUrl: raw.snapshot?.cards?.[0]?.linkUrl || raw.websiteURL || '#',
    adLibraryUrl: `https://www.facebook.com/ads/library/?id=${raw.adArchiveID}`,
  };
}

function normalizePlatforms(raw) {
  if (!raw) return ['facebook'];
  const list = Array.isArray(raw) ? raw : [raw];
  return list
    .map(p => String(p).toLowerCase())
    .filter(p => ['facebook', 'instagram'].includes(p));
}

function detectGateway(raw) {
  const text = JSON.stringify(raw).toLowerCase();
  if (text.includes('hotmart')) return 'Hotmart';
  if (text.includes('kiwify')) return 'Kiwify';
  if (text.includes('cakto')) return 'Cakto';
  if (text.includes('eduzz')) return 'Eduzz';
  if (text.includes('monetizze')) return 'Monetizze';
  return 'Outro';
}
