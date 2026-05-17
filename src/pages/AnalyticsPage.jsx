import { TrendingUp, Award, Clock, Layers, BarChart2, PieChart } from 'lucide-react';
import { mockAds } from '../data/mockAds';

function Bar({ label, value, max, color }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-semibold text-gray-600 w-16 shrink-0">{label}</span>
      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-bold text-gray-700 w-6 text-right">{value}</span>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, accent }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: accent ? '#FFF8E0' : '#F5F5F0' }}>
          <Icon size={15} style={{ color: accent ? '#B8960A' : '#6B7280' }} />
        </div>
      </div>
      <p className="text-3xl font-black text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

export default function AnalyticsPage() {
  const active = mockAds.filter(a => a.status === 'active');
  const avgDays = Math.round(mockAds.reduce((s, a) => s + a.daysRunning, 0) / mockAds.length);
  const topAd = [...mockAds].sort((a, b) => b.daysRunning - a.daysRunning)[0];

  const gatewayCount = mockAds.reduce((acc, a) => {
    acc[a.gateway] = (acc[a.gateway] || 0) + 1;
    return acc;
  }, {});

  const typeCount = mockAds.reduce((acc, a) => {
    const t = a.isVideo ? 'Vídeo' : 'Imagem';
    acc[t] = (acc[t] || 0) + 1;
    return acc;
  }, {});

  const langCount = mockAds.reduce((acc, a) => {
    acc[a.language] = (acc[a.language] || 0) + 1;
    return acc;
  }, {});

  const maxGW = Math.max(...Object.values(gatewayCount));
  const colors = ['#F5C400', '#FF6B35', '#4ADE80', '#60A5FA'];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Analytics</h1>
        <p className="text-sm text-gray-500 mt-1">Visão geral dos anúncios na base de dados mock</p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Layers} label="Total anúncios" value={mockAds.length} sub="na base mock" accent />
        <StatCard icon={TrendingUp} label="Ativos" value={active.length}
          sub={`${Math.round(active.length / mockAds.length * 100)}% do total`} />
        <StatCard icon={Clock} label="Média dias" value={`${avgDays}d`} sub="todos os anúncios" />
        <StatCard icon={Award} label="Maior longevidade" value={`${topAd.daysRunning}d`}
          sub={topAd.advertiserName} accent />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

        {/* Gateway distribution */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 size={16} className="text-gray-400" />
            <h3 className="font-bold text-gray-900">Por Gateway</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(gatewayCount).map(([gw, count], i) => (
              <Bar key={gw} label={gw} value={count} max={maxGW} color={colors[i % colors.length]} />
            ))}
          </div>
        </div>

        {/* Type distribution */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <PieChart size={16} className="text-gray-400" />
            <h3 className="font-bold text-gray-900">Tipo de criativo</h3>
          </div>
          <div className="space-y-4 mt-2">
            {Object.entries(typeCount).map(([type, count], i) => {
              const pct = Math.round(count / mockAds.length * 100);
              return (
                <div key={type}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold text-gray-700">{type}</span>
                    <span className="font-bold" style={{ color: colors[i] }}>{pct}%</span>
                  </div>
                  <div className="bg-gray-100 rounded-full h-4 overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: colors[i] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Language distribution */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-gray-400" />
            <h3 className="font-bold text-gray-900">Por Idioma</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(langCount).map(([lang, count], i) => (
              <Bar key={lang} label={lang} value={count} max={mockAds.length} color={colors[i % colors.length]} />
            ))}
          </div>
        </div>
      </div>

      {/* Top ads table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-5 border-b border-gray-50">
          <h3 className="font-bold text-gray-900">Top anúncios por longevidade</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">#</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Anunciante</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Gateway</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Dias</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Anúncios</th>
                <th className="text-left px-5 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {[...mockAds].sort((a, b) => b.daysRunning - a.daysRunning).map((ad, i) => (
                <tr key={ad.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 font-bold text-gray-400">{i + 1}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <img src={ad.advertiserAvatar} alt={ad.advertiserName}
                        className="w-7 h-7 rounded-lg object-cover" />
                      <span className="font-semibold text-gray-800">{ad.advertiserName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-gray-600">{ad.gateway}</td>
                  <td className="px-5 py-3">
                    <span className="font-bold" style={{ color: '#B8960A' }}>{ad.daysRunning}d</span>
                  </td>
                  <td className="px-5 py-3 font-semibold text-gray-700">{ad.adCount}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                      ad.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                    }`}>
                      {ad.status === 'active' ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
