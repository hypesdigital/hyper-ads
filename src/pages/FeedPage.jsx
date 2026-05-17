import { useState, useEffect, useMemo, useCallback } from 'react';
import { SearchX, RefreshCw, AlertCircle, Search } from 'lucide-react';
import AdCard from '../components/AdCard';
import AdModal from '../components/AdModal';
import FilterPanel from '../components/FilterPanel';
import StatsBar from '../components/StatsBar';
import SkeletonCard from '../components/SkeletonCard';
import { mockAds, statsData } from '../data/mockAds';
import { searchAds, getToken } from '../services/apify';

const defaultFilters = {
  daysMin: '', daysMax: '',
  adsMin: '', adsMax: '',
  dateFrom: '', dateTo: '',
  adType: 'Todos', language: 'Todos',
  gateway: 'Todos', productType: 'Todos',
};

function applyFilters(ads, filters, search) {
  return ads.filter(ad => {
    if (search) {
      const q = search.toLowerCase();
      const hits = [ad.advertiserName, ad.copy, ad.gateway, ad.productType]
        .some(f => f.toLowerCase().includes(q));
      if (!hits) return false;
    }
    if (filters.daysMin && ad.daysRunning < +filters.daysMin) return false;
    if (filters.daysMax && ad.daysRunning > +filters.daysMax) return false;
    if (filters.adsMin && ad.adCount < +filters.adsMin) return false;
    if (filters.adsMax && ad.adCount > +filters.adsMax) return false;
    if (filters.adType !== 'Todos') {
      const isVid = filters.adType === 'Vídeo';
      if (ad.isVideo !== isVid) return false;
    }
    if (filters.language !== 'Todos' && ad.language !== filters.language) return false;
    if (filters.gateway !== 'Todos' && ad.gateway !== filters.gateway) return false;
    if (filters.productType !== 'Todos' && ad.productType !== filters.productType) return false;
    return true;
  });
}

export default function FeedPage({ search }) {
  const hasToken = Boolean(getToken());

  const [ads, setAds] = useState(hasToken ? [] : mockAds);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedAd, setSelectedAd] = useState(null);
  const [sortBy, setSortBy] = useState('daysRunning');
  const [searchQuery, setSearchQuery] = useState('');
  const [liveSearch, setLiveSearch] = useState('');

  const loadAds = useCallback(async (query = '') => {
    if (!hasToken) {
      await new Promise(r => setTimeout(r, 1000));
      setAds(mockAds);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const results = await searchAds({ query, country: 'BR', limit: 30 });
      setAds(results.length > 0 ? results : mockAds);
    } catch (e) {
      setError(e.message);
      setAds(mockAds);
    } finally {
      setLoading(false);
    }
  }, [hasToken]);

  useEffect(() => {
    loadAds();
  }, [loadAds]);

  const handleSearch = () => {
    if (hasToken) loadAds(searchQuery);
    else setLiveSearch(searchQuery);
  };

  const effectiveSearch = hasToken ? '' : (liveSearch || search);

  const filtered = useMemo(() => {
    const result = applyFilters(ads, filters, effectiveSearch);
    return [...result].sort((a, b) => {
      if (sortBy === 'daysRunning') return b.daysRunning - a.daysRunning;
      if (sortBy === 'adCount') return b.adCount - a.adCount;
      if (sortBy === 'recent') return new Date(b.publishedAt) - new Date(a.publishedAt);
      return 0;
    });
  }, [ads, filters, effectiveSearch, sortBy]);

  const stats = {
    totalAds: ads.length,
    activeAds: ads.filter(a => a.status === 'active').length,
    avgDaysRunning: ads.length
      ? Math.round(ads.reduce((s, a) => s + a.daysRunning, 0) / ads.length)
      : 0,
    topGateway: (() => {
      const counts = ads.reduce((acc, a) => { acc[a.gateway] = (acc[a.gateway] || 0) + 1; return acc; }, {});
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    })(),
  };

  return (
    <>
      <StatsBar stats={hasToken ? stats : statsData} />

      {/* Search bar (real API mode) */}
      {hasToken && (
        <div className="flex gap-2 mb-5">
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar anúncios na Facebook Ad Library..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white
                focus:outline-none focus:ring-2 transition-all"
            />
          </div>
          <button onClick={handleSearch} disabled={loading}
            style={{ backgroundColor: '#F5C400' }}
            className="px-5 py-2.5 rounded-xl text-sm font-bold text-black hover:opacity-90
              transition-all disabled:opacity-50">
            {loading ? 'Buscando…' : 'Buscar'}
          </button>
        </div>
      )}

      {/* Mock mode badge */}
      {!hasToken && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-5 text-sm font-medium"
          style={{ backgroundColor: '#FFF8E0', color: '#92700A' }}>
          <AlertCircle size={14} />
          Modo demonstração — dados simulados. Configure seu token Apify em{' '}
          <button className="font-bold underline" onClick={() => {}}>Settings</button> para dados reais.
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5 text-sm"
          style={{ backgroundColor: '#FFF0EE', color: '#C04A20' }}>
          <AlertCircle size={15} />
          <span>{error} — exibindo dados de demonstração.</span>
          <button onClick={() => loadAds(searchQuery)} className="ml-auto font-bold underline">Tentar novamente</button>
        </div>
      )}

      {/* Controls row */}
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <div className="flex items-center gap-3">
          <FilterPanel filters={filters} onApply={setFilters} />
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold
              text-gray-700 focus:outline-none shadow-sm cursor-pointer"
          >
            <option value="daysRunning">Mais antigos primeiro</option>
            <option value="adCount">Mais anúncios</option>
            <option value="recent">Mais recentes</option>
          </select>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="font-semibold text-gray-700">{filtered.length}</span> resultados
        </div>
      </div>

      {/* Feed grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: '#FFF8E0' }}>
            <SearchX size={28} style={{ color: '#B8960A' }} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Nenhum anúncio encontrado</h3>
          <p className="text-sm text-gray-400 max-w-xs">
            Tente ajustar os filtros ou use outro termo de busca.
          </p>
          <button onClick={() => setFilters(defaultFilters)}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold
              text-black transition-all hover:opacity-90"
            style={{ backgroundColor: '#F5C400' }}>
            <RefreshCw size={13} />
            Limpar filtros
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((ad, i) => (
            <AdCard
              key={ad.id}
              ad={ad}
              onDetails={setSelectedAd}
              size={i === 0 || i === 5 ? 'large' : 'normal'}
            />
          ))}
        </div>
      )}

      {selectedAd && (
        <AdModal ad={selectedAd} onClose={() => setSelectedAd(null)} />
      )}
    </>
  );
}
