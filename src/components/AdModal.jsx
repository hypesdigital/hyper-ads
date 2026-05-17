import { useEffect } from 'react';
import { X, Play, Clock, Layers, Calendar, Globe, ExternalLink, ShoppingCart, Tag, Monitor } from 'lucide-react';

const FbIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const IgIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

function InfoRow({ icon: Icon, label, value, accent }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
        style={{ backgroundColor: accent ? '#FFF8E0' : '#F5F5F0' }}>
        <Icon size={15} style={{ color: accent ? '#F5C400' : '#6B7280' }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 font-medium">{label}</p>
        <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  );
}

function PlatformBadge({ platform }) {
  const isIG = platform === 'instagram';
  return (
    <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold text-white"
      style={{
        backgroundColor: isIG ? undefined : '#1877F2',
        background: isIG ? 'linear-gradient(135deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888)' : undefined
      }}>
      {isIG ? <IgIcon /> : <FbIcon />}
      {isIG ? 'Instagram' : 'Facebook'}
    </span>
  );
}

export default function AdModal({ ad, onClose }) {
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!ad) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>

      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <img src={ad.advertiserAvatar} alt={ad.advertiserName}
              className="w-10 h-10 rounded-xl object-cover" />
            <div>
              <h2 className="font-black text-base text-gray-900">{ad.advertiserName}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                  ad.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                }`}>
                  {ad.status === 'active' ? '● Ativo' : '○ Inativo'}
                </span>
                <span className="text-xs text-gray-400">{ad.siteType}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose}
            className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center
              text-gray-400 hover:text-gray-700 hover:bg-gray-50 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1">

          {/* Creative preview */}
          <div className="relative bg-gray-900 h-56">
            <img src={ad.thumbnail} alt="Criativo" className="w-full h-full object-cover opacity-90" />
            {ad.isVideo && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center cursor-pointer hover:scale-105 transition-transform">
                  <Play size={22} className="text-white ml-1" fill="white" />
                </div>
              </div>
            )}
          </div>

          <div className="p-5">

            {/* Stats chips */}
            <div className="flex gap-2 flex-wrap mb-5">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold"
                style={{ backgroundColor: '#FFF8E0', color: '#B8960A' }}>
                <Clock size={13} />
                {ad.daysRunning} dias rodando
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-bold"
                style={{ backgroundColor: '#FFF3EE', color: '#C04A20' }}>
                <Layers size={13} />
                {ad.adCount} anúncios
              </div>
              {ad.platforms.map(p => <PlatformBadge key={p} platform={p} />)}
            </div>

            {/* Copy */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Copy do anúncio</p>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{ad.fullCopy}</p>
            </div>

            {/* Info grid */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Detalhes</p>
              <InfoRow icon={Calendar} label="Data de publicação" value={new Date(ad.publishedAt).toLocaleDateString('pt-BR')} accent />
              <InfoRow icon={Globe} label="Página anunciante" value={ad.advertiserPage} />
              <InfoRow icon={ShoppingCart} label="Gateway" value={ad.gateway} accent />
              <InfoRow icon={Monitor} label="Tipo de site" value={ad.siteType} />
              <InfoRow icon={Tag} label="Tipo de produto" value={ad.productType} />
            </div>

            {/* CTA buttons */}
            <div className="flex gap-3">
              <a href={ad.adLibraryUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold
                  border-2 border-gray-200 text-gray-700 hover:bg-gray-50 transition-all">
                <span style={{ color: '#1877F2' }}><FbIcon /></span>
                Ver no Facebook
              </a>
              <a href={ad.salesPageUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold
                  text-black transition-all hover:opacity-90"
                style={{ backgroundColor: '#F5C400' }}>
                <ExternalLink size={14} />
                Abrir página de venda
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
