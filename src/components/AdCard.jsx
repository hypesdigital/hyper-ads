import { Play, Clock, Layers, ExternalLink, Eye, Heart, Download } from 'lucide-react';

const IgIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

function PlatformIcon({ platform }) {
  if (platform === 'facebook') return (
    <span className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
      style={{ backgroundColor: '#1877F2' }}>f</span>
  );
  if (platform === 'instagram') return (
    <span className="w-6 h-6 rounded-full flex items-center justify-center text-white"
      style={{ background: 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' }}>
      <IgIcon />
    </span>
  );
  return null;
}

async function downloadImage(url, filename) {
  try {
    const res = await fetch(url, { mode: 'cors' });
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename || 'ad-image.jpg';
    a.click();
    URL.revokeObjectURL(blobUrl);
  } catch {
    // Se CORS bloquear, abre em nova aba
    window.open(url, '_blank');
  }
}

export default function AdCard({ ad, onDetails, size = 'normal', isFav = false, onToggleFav }) {
  const isLarge = size === 'large';
  const adId = ad.id || '';

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden
      hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 flex flex-col">

      {/* Thumbnail */}
      <div className={`relative overflow-hidden bg-gray-100 ${isLarge ? 'h-52' : 'h-44'}`}>
        <img
          src={ad.thumbnail}
          alt={ad.advertiserName}
          className="w-full h-full object-cover"
          loading="lazy"
          onError={e => { e.target.src = `https://picsum.photos/seed/${adId}/400/300`; }}
        />
        {ad.isVideo && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center">
              <Play size={20} className="text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}

        {/* Status badge */}
        <div className="absolute top-3 left-3">
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
            ad.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
          }`}>
            {ad.status === 'active' ? 'Ativo' : 'Inativo'}
          </span>
        </div>

        {/* Type badge */}
        <div className="absolute top-3 right-3">
          <span style={{ backgroundColor: '#F5C400' }}
            className="px-2.5 py-1 rounded-full text-xs font-bold text-black">
            {ad.isVideo ? 'Vídeo' : 'Imagem'}
          </span>
        </div>

        {/* Top-right action buttons */}
        <div className="absolute bottom-3 right-3 flex gap-1.5">
          {/* Download */}
          {ad.thumbnail && !ad.thumbnail.includes('picsum') && (
            <button
              onClick={e => { e.stopPropagation(); downloadImage(ad.thumbnail, `hyperads-${adId}.jpg`); }}
              title="Baixar imagem"
              className="w-8 h-8 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center
                text-white hover:bg-black/70 transition-all"
            >
              <Download size={13} />
            </button>
          )}
          {/* Favorito */}
          <button
            onClick={e => { e.stopPropagation(); onToggleFav?.(ad); }}
            title={isFav ? 'Remover dos favoritos' : 'Favoritar'}
            className="w-8 h-8 rounded-xl bg-black/50 backdrop-blur-sm flex items-center justify-center
              text-white hover:bg-black/70 transition-all"
          >
            <Heart size={13} fill={isFav ? 'white' : 'none'} />
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="p-4 flex flex-col flex-1">
        {/* Advertiser */}
        <div className="flex items-center gap-2 mb-3">
          <img src={ad.advertiserAvatar} alt={ad.advertiserName}
            className="w-8 h-8 rounded-full object-cover border-2 border-gray-100"
            onError={e => { e.target.src = `https://i.pravatar.cc/40?u=${adId}`; }} />
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900 truncate">{ad.advertiserName}</p>
            <p className="text-xs text-gray-400">{ad.gateway} · {ad.productType}</p>
          </div>
          <div className="flex gap-1 ml-auto shrink-0">
            {ad.platforms.map(p => <PlatformIcon key={p} platform={p} />)}
          </div>
        </div>

        {/* Copy */}
        <p className="text-sm text-gray-600 line-clamp-2 mb-3 flex-1">{ad.copy}</p>

        {/* Stats row */}
        <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Clock size={12} style={{ color: '#F5C400' }} />
            <span className="font-semibold text-gray-700">{ad.daysRunning}d</span> rodando
          </div>
          <div className="w-px h-3 bg-gray-200" />
          <div className="flex items-center gap-1">
            <Layers size={12} style={{ color: '#FF6B35' }} />
            <span className="font-semibold text-gray-700">{ad.adCount}</span> anúncios
          </div>
          <div className="w-px h-3 bg-gray-200" />
          <span className="font-medium text-gray-500">{ad.language}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => onDetails(ad)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold
              text-black transition-all hover:opacity-90"
            style={{ backgroundColor: '#F5C400' }}
          >
            <Eye size={13} />
            Ver detalhes
          </button>
          <a
            href={ad.salesPageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold
              border border-gray-200 text-gray-600 hover:bg-gray-50 transition-all"
          >
            <ExternalLink size={12} />
            Saiba mais
          </a>
        </div>
      </div>
    </div>
  );
}
