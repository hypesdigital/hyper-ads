import { useState, useMemo } from 'react';
import { SearchX, RefreshCw, AlertCircle, Search, Zap } from 'lucide-react';
import AdCard from '../components/AdCard';
import AdModal from '../components/AdModal';
import FilterPanel from '../components/FilterPanel';
import StatsBar from '../components/StatsBar';
import SkeletonCard from '../components/SkeletonCard';
import { mockAds, statsData } from '../data/mockAds';
import { searchAds, getToken } from '../services/apify';

const LIMIT_OPTIONS = [10, 20, 30, 50];
const MIN_ADS_DEFAULT = 10; // só traz criativos com 10+ anúncios ativos

const defaultFilters = {
  daysMin: '', daysMax: '',
  adsMin: String(MIN_ADS_DEFAULT), adsMax: '',
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
      if (ad.isVideo !== (filters.adType === 'Vídeo')) return false;
    }
    if (filters.language !== 'Todos' && ad.language !== filters.language) return false;
    if (filters.gateway !== 'Todos' && ad.gateway !== filters.gateway) return false;
    if (filters.productType !== 'Todos' && ad.productType !== filters.productType) return false;
    return true;
  });
}

// Estado inicial: aguardando busca
function EmptyState({ hasToken, onTabChange }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-5 shadow-sm"
        style={{ backgroundColor: '#F5C400' }}>
        <Search size={32} className="text-black" />
      </div>
      <h3 className="text-xl font-black text-gray-900 mb-2">
        {hasToken ? 'Pronto para espionar a concorrência' : 'Modo demonstração ativo'}
      </h3>
      <p className="text-sm text-gray-400 max-w-sm leading-relaxed">
        {hasToken
          ? 'Digite um termo acima e clique em Buscar para trazer anúncios reais da Facebook Ad Library.'
          : 'Configure seu token Apify em Settings para buscar anúncios reais.'}
      </p>
      {!hasToken && (
        <button
          onClick={() => onTabChange?.('settings')}
          style={{ backgroundColor: '#F5C400' }}
          className="mt-5 px-5 py-2.5 rounded-xl text-sm font-bold text-black hover:opacity-90 transition-all">
          Configurar token
        </button>
      )}
    </div>
  );
}

export default function FeedPage({ search, onTabChange }) {
  const hasToken = Boolean(getToken());

  // Sem auto-load: feed começa vazio
  const [ads, setAds] = useState([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(defaultFilters);
  const [selectedAd, setSelectedAd] = useState(null);
  const [sortBy, setSortBy] = useState('adCount');
  const [searchQuery, setSearchQuery] = useState('');
  const [limit, setLimit] = useState(20);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    if (!hasToken) {
      // Modo demo: filtra os mocks pelo termo
      setHasSearched(true);
      return;
    }

    setLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const results = await searchAds({
        query: searchQuery.trim(),
        country: 'BR',
        limit,
        minAds: +filters.adsMin || MIN_ADS_DEFAULT,
      });
      // Filtra server-side por minAds para garantir
      const minAds = +filters.adsMin || MIN_ADS_DEFAULT;
      setAds(results.filter(a => a.adCount >= minAds));
    } catch (e) {
      setError(e.message);
      setAds([]);
    } finally {
      setLoading(false);
    }
  };

  // Para modo demo, filtra os mocks pelo searchQuery
  const baseAds = hasToken ? ads : (
    hasSearched
      ? mockAds.filter(a =>
          !searchQuery || [a.advertiserName, a.copy, a.gateway]
            .some(f => f.toLowerCase().includes(searchQuery.toLowerCase()))
        )
      : []
  );

  const effectiveSearch = hasToken ? '' : search;

  const filtered = useMemo(() => {
    const result = applyFilters(baseAds, filters, effectiveSearch);
    return [...result].sort((a, b) => {
      if (sortBy === 'daysRunning') return b.daysRunning - a.daysRunning;
      if (sortBy === 'adCount') return b.adCount - a.adCount;
      if (sortBy === 'recent') return new Date(b.publishedAt) - new Date(a.publishedAt);
      return 0;
    });
  }, [baseAds, filters, effectiveSearch, sortBy]);

  const stats = {
    totalAds: ads.length || (hasSearched ? baseAds.length : 0),
    activeAds: baseAds.filter(a => a.status === 'active').length,
    avgDaysRunning: baseAds.length
      ? Math.round(baseAds.reduce((s, a) => s + a.daysRunning, 0) / baseAds.length)
      : 0,
    topGateway: (() => {
      const counts = baseAds.reduce((acc, a) => {
        acc[a.gateway] = (acc[a.gateway] || 0) + 1; return acc;
      }, {});
      return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || '—';
    })(),
  };

  return (
    <>
      <StatsBar stats={hasSearched ? stats : statsData} />

      {/* Search bar principal */}
      <div className="flex gap-2 mb-4">
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder={hasToken
              ? 'Digite um nicho ou produto (ex: curso de inglês, emagrecimento)…'
              : 'Buscar nos dados de demonstração…'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white
              focus:outline-none focus:ring-2 transition-all"
          />
        </div>

        {/* Limite de resultados — só no modo real */}
        {hasToken && (
          <select
            value={limit}
            onChange={e => setLimit(+e.target.value)}
            title="Limite de anúncios buscados (afeta custo)"
            className="px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold
              text-gray-700 focus:outline-none shadow-sm cursor-pointer shrink-0"
          >
            {LIMIT_OPTIONS.map(n => (
              <option key={n} value={n}>{n} anúncios</option>
            ))}
          </select>
        )}

        <button
          onClick={handleSearch}
          disabled={loading || !searchQuery.trim()}
          style={{ backgroundColor: '#F5C400' }}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-black
            hover:opacity-90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
          {loading
            ? <><span className="w-3.5 h-3.5 border-2 border-black/30 border-t-black rounded-full animate-spin" /> Buscando…</>
            : <><Zap size={14} fill="black" /> Buscar</>
          }
        </button>
      </div>

      {/* Aviso custo — só no modo real */}
      {hasToken && (
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl mb-4 text-xs font-medium"
          style={{ backgroundColor: '#F5F5F0', color: '#6B7280' }}>
          <AlertCircle size={12} />
          Busca abortada em <strong className="text-gray-800">20s</strong> para controlar custo
          {' '}· Exibe até <strong className="text-gray-800">{limit} anúncios</strong>
          {' '}· Custo máx. estimado: <strong className="text-gray-800">~$0.05</strong> por busca
        </div>
      )}

      {/* Mock mode badge */}
      {!hasToken && (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl mb-4 text-sm font-medium"
          style={{ backgroundColor: '#FFF8E0', color: '#92700A' }}>
          <AlertCircle size={14} />
          Modo demonstração — dados simulados.{' '}
          <button className="font-bold underline" onClick={() => onTabChange?.('settings')}>
            Configurar token Apify
          </button>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-3 px-4 py-3 rounded-xl mb-4 text-sm"
          style={{ backgroundColor: '#FFF0EE', color: '#C04A20' }}>
          <AlertCircle size={15} />
          <span>{error}</span>
          <button onClick={handleSearch} className="ml-auto font-bold underline shrink-0">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Controls row — só aparece após primeira busca */}
      {hasSearched && !loading && (
        <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
          <div className="flex items-center gap-3">
            <FilterPanel filters={filters} onApply={setFilters} />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold
                text-gray-700 focus:outline-none shadow-sm cursor-pointer"
            >
              <option value="adCount">Mais anúncios ativos</option>
              <option value="daysRunning">Mais antigos primeiro</option>
              <option value="recent">Mais recentes</option>
            </select>
          </div>
          <div className="text-sm text-gray-400">
            <span className="font-semibold text-gray-700">{filtered.length}</span> resultados
          </div>
        </div>
      )}

      {/* Feed grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: limit > 10 ? 8 : 4 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : !hasSearched ? (
        <EmptyState hasToken={hasToken} onTabChange={onTabChange} />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: '#FFF8E0' }}>
            <SearchX size={28} style={{ color: '#B8960A' }} />
          </div>
          <h3 className="text-lg font-bold text-gray-800 mb-2">Nenhum anúncio encontrado</h3>
          <p className="text-sm text-gray-400 max-w-xs">
            Tente outro termo de busca ou ajuste o filtro de mínimo de anúncios ativos.
          </p>
          <button
            onClick={() => setFilters(defaultFilters)}
            style={{ backgroundColor: '#F5C400' }}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold
              text-black transition-all hover:opacity-90">
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
