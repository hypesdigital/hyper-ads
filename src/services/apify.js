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

// Aborta o run para parar de gastar créditos
async function abortRun(runId) {
  try {
    await apiFetch(`/actor-runs/${runId}/abort`, { method: 'POST' });
  } catch (_) {
    // silencia — se já terminou, tudo bem
  }
}

function buildAdLibraryUrl({ query = '', country = 'BR' } = {}) {
  const params = new URLSearchParams({
    active_status: 'active',
    ad_type: 'all',
    country,
    q: query || 'curso',
    media_type: 'all',
  });
  return `https://www.facebook.com/ads/library/?${params.toString()}`;
}

export async function searchAds({ query = '', country = 'BR', limit = 20 } = {}) {
  const url = buildAdLibraryUrl({ query, country });

  // waitForFinish=90 → Apify aguarda até 90s server-side e devolve o run
  // assim não fazemos polling e controlamos o tempo exato
  const { data: run } = await apiFetch(
    `/acts/${ACTOR}/runs?waitForFinish=90`,
    {
      method: 'POST',
      body: JSON.stringify({
        urls: [{ url }],
        // Enviamos o limite pelos dois campos que o actor pode aceitar
        totalRecordsRequired: limit,
        maxResults: limit,
        limitPerUrl: limit,
        scrapeAdDetails: false,
      }),
    }
  );

  // Se ainda estiver rodando após 90s → ABORTA para não gastar mais
  if (run.status === 'RUNNING' || run.status === 'READY') {
    await abortRun(run.id);
    throw new Error(
      `A busca ultrapassou 90 segundos e foi interrompida para proteger seus créditos. ` +
      `Tente um termo mais específico ou um limite menor.`
    );
  }

  if (['FAILED', 'ABORTED', 'TIMED-OUT'].includes(run.status)) {
    throw new Error(`A busca falhou (${run.status}). Tente novamente com outro termo.`);
  }

  // Busca apenas N itens do dataset — mesmo que o actor tenha coletado mais
  const { items } = await apiFetch(
    `/datasets/${run.defaultDatasetId}/items?clean=true&format=json&limit=${limit}`
  );

  return (items || []).map(normalizeAd);
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
    status: raw.isActive || raw.is_active || raw.adActiveStatus === 'ACTIVE' ? 'active' : 'inactive',
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
