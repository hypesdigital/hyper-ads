import { useState } from 'react';
import { Heart, Trash2 } from 'lucide-react';
import AdCard from '../components/AdCard';
import AdModal from '../components/AdModal';

export default function FavoritesPage({ favorites, onToggleFav, isFav }) {
  const [selectedAd, setSelectedAd] = useState(null);

  if (favorites.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5"
          style={{ backgroundColor: '#FFF8E0' }}>
          <Heart size={32} style={{ color: '#B8960A' }} />
        </div>
        <h3 className="text-xl font-black text-gray-900 mb-2">Nenhum favorito ainda</h3>
        <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
          Clique no ícone de coração nos cards para salvar os anúncios que você tem interesse.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Favoritos</h1>
          <p className="text-sm text-gray-400 mt-1">{favorites.length} anúncio{favorites.length !== 1 ? 's' : ''} salvos</p>
        </div>
        <button
          onClick={() => { if (window.confirm('Remover todos os favoritos?')) favorites.forEach(f => onToggleFav(f)); }}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold
            border border-gray-200 text-gray-500 hover:bg-gray-50 transition-all">
          <Trash2 size={14} />
          Limpar tudo
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {favorites.map((ad, i) => (
          <AdCard
            key={ad.id}
            ad={ad}
            onDetails={setSelectedAd}
            size={i === 0 ? 'large' : 'normal'}
            isFav={isFav(ad.id)}
            onToggleFav={onToggleFav}
          />
        ))}
      </div>

      {selectedAd && <AdModal ad={selectedAd} onClose={() => setSelectedAd(null)} />}
    </>
  );
}
