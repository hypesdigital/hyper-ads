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

  console.log('[HyperAds] Iniciando busca:', { query, country, limit, url: adLibraryUrl });

  // Inicia o run — waitForFinish=45 aguarda server-side, retorna o run ao fim
  const startResp = await apiFetch(
    `/acts/${ACTOR}/runs?waitForFinish=45`,
    {
      method: 'POST',
      body: JSON.stringify({
        urls: [{ url: adLibraryUrl }],
        startUrls: [{ url: adLibraryUrl }],
        totalRecordsRequired: limit,
        limitPerUrl: limit,
        maxResults: limit,
        scrapeAdDetails: true,
      }),
    }
  );

  // O run pode estar em startResp.data ou direto em startResp
  const run = startResp?.data ?? startResp;
  const runId = run?.id;
  const datasetId = run?.defaultDatasetId;

  console.log('[HyperAds] Run status:', run?.status, '| runId:', runId, '| datasetId:', datasetId);

  // Aborta se ainda estiver rodando
  if (run?.status === 'RUNNING' || run?.status === 'READY') {
    console.log('[HyperAds] Abortando run para conter custos...');
    await abortRun(runId);
    // Aguarda 2s para Apify persistir os dados coletados antes do abort
    await new Promise(r => setTimeout(r, 2000));
  }

  if (!datasetId) {
    throw new Error('Não foi possível obter o dataset da busca. Tente novamente.');
  }

  // Sem clean=true — evita filtrar itens com campos raiz vazios
  // Sem limit na query — buscamos tudo e limitamos em JS
  const raw = await apiFetch(
    `/datasets/${datasetId}/items?format=json`
  );

  console.log('[HyperAds] Resposta dataset — tipo:', typeof raw, '| isArray:', Array.isArray(raw),
    '| length:', Array.isArray(raw) ? raw.length : raw?.items?.length ?? '?');

  // Apify retorna array direto OU { items: [...] } dependendo da versão
  const allItems = Array.isArray(raw)
    ? raw
    : Array.isArray(raw?.items) ? raw.items : [];

  console.log('[HyperAds] Total itens lidos:', allItems.length);

  // Log do primeiro item bruto — para depurar campos disponíveis
  if (allItems[0]) {
    const first = allItems[0];
    console.log('[HyperAds] Primeiro item (keys):', Object.keys(first));
    console.log('[HyperAds] snapshot keys:', first.snapshot ? Object.keys(first.snapshot) : 'sem snapshot');
    console.log('[HyperAds] snapshot.images:', JSON.stringify(first.snapshot?.images ?? first.snapshot?.image ?? null));
    console.log('[HyperAds] snapshot.videos:', JSON.stringify(first.snapshot?.videos ?? first.snapshot?.video ?? null));
    console.log('[HyperAds] snapshot.cards:', JSON.stringify(first.snapshot?.cards?.slice(0, 1) ?? null));
  }

  // Usa TODOS os itens coletados — já pagamos por eles, não faz sentido descartar
  // O limite de exibição é controlado no frontend (FilterPanel / slice no FeedPage)
  const results = allItems.map(normalizeAd);

  console.log('[HyperAds] Resultados após normalização:', results.length);

  if (results.length === 0) {
    throw new Error(
      `Nenhum resultado encontrado para "${query}". ` +
      'Tente outro termo (ex: "curso ingles", "emagrecimento", "tráfego pago").'
    );
  }

  return results;
}

// Converte Unix timestamp (segundos) ou string ISO para YYYY-MM-DD
function parseAdDate(val) {
  if (!val) return '';
  const num = Number(val);
  // Se for número grande → Unix timestamp em SEGUNDOS → converte para ms
  if (!isNaN(num) && num > 1_000_000_000) {
    return new Date(num * 1000).toISOString().slice(0, 10);
  }
  // Já é string de data
  const d = new Date(val);
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

function normalizeAd(raw) {
  const startDate = parseAdDate(
    raw.start_date || raw.startDate || raw.adCreationTime || raw.ad_creation_time || ''
  );
  const daysRunning = startDate
    ? Math.max(0, Math.floor((Date.now() - new Date(startDate).getTime()) / 86400000))
    : 0;

  const id = raw.ad_archive_id || raw.adArchiveID || raw.id || String(Math.random());

  // Copy: snapshot.body.text é o campo canônico do actor
  const copyText =
    raw.snapshot?.body?.text ||
    raw.snapshot?.cards?.[0]?.body ||
    raw.snapshot?.title ||
    raw.ad_creative_body ||
    raw.body ||
    '';

  // Thumbnail: schema confirmado — actor usa snake_case
  // Ordem: images[] > videos[].preview > cards[] > fallback
  const thumbnail =
    // images[] (anúncios de imagem)
    raw.snapshot?.images?.[0]?.original_image_url ||
    raw.snapshot?.images?.[0]?.resized_image_url ||
    raw.snapshot?.images?.[0]?.watermarked_resized_image_url ||
    // videos[] — poster frame (anúncios de vídeo)
    raw.snapshot?.videos?.[0]?.video_preview_image_url ||
    // cards[] — carrossel (only original_image_url at card level)
    raw.snapshot?.cards?.[0]?.original_image_url ||
    // extra_images[]
    raw.snapshot?.extra_images?.[0]?.original_image_url ||
    raw.snapshot?.extra_images?.[0]?.resized_image_url ||
    // campos flat no root (fallback para actors sem snapshot)
    raw.image_url ||
    raw.creative_media_url ||
    `https://picsum.photos/seed/${id}/400/300`;

  const isVideo =
    (raw.snapshot?.videos?.length > 0) ||
    !!(raw.snapshot?.videos?.[0]?.video_hd_url || raw.snapshot?.videos?.[0]?.video_sd_url) ||
    raw.snapshot?.display_format === 'VIDEO';

  return {
    id,
    advertiserName:
      raw.page_name || raw.pageName || raw.snapshot?.page_name || 'Anunciante',
    advertiserPage:
      raw.snapshot?.page_profile_uri || raw.pageProfileUri || raw.page_profile_uri || '#',
    advertiserAvatar:
      raw.snapshot?.page_profile_picture_url ||
      raw.snapshot?.pageProfilePictureUrl ||
      raw.snapshot?.pageProfilePictureURL ||
      raw.pageProfilePictureURL ||
      raw.page_profile_picture_url ||
      `https://i.pravatar.cc/40?u=${id}`,
    thumbnail,
    isVideo,
    status: (raw.is_active ?? raw.isActive ?? true) ? 'active' : 'inactive',
    daysRunning,
    adCount: raw.collation_count || raw.adCount || raw.collationCount || 1,
    platforms: normalizePlatforms(raw.publisher_platform || raw.publisherPlatform),
    language: (raw.language_code || raw.languageCode || 'PT').toUpperCase().slice(0, 2),
    gateway: detectGateway(raw),
    productType: detectProductType(raw),
    siteType: 'Landing Page',
    publishedAt: startDate || new Date().toISOString().slice(0, 10),
    copy: copyText,
    fullCopy: copyText,
    salesPageUrl:
      raw.snapshot?.link_url ||
      raw.snapshot?.cards?.[0]?.link_url ||
      raw.website_url || '#',
    adLibraryUrl:
      raw.ad_library_url ||
      `https://www.facebook.com/ads/library/?id=${id}`,
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
