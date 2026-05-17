import { TrendingUp, Zap, Clock, CreditCard } from 'lucide-react';

export default function StatsBar({ stats }) {
  const items = [
    { icon: Zap, label: 'Total de Anúncios', value: stats.totalAds.toLocaleString('pt-BR'), accent: true },
    { icon: TrendingUp, label: 'Anúncios Ativos', value: stats.activeAds.toLocaleString('pt-BR'), accent: false },
    { icon: Clock, label: 'Média de Dias', value: `${stats.avgDaysRunning} dias`, accent: false },
    { icon: CreditCard, label: 'Top Gateway', value: stats.topGateway, accent: false },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
      {items.map((item, i) => (
        <div key={i}
          className={`rounded-2xl p-4 flex items-center gap-3 shadow-sm border transition-all hover:shadow-md ${
            item.accent ? 'border-yellow-200' : 'bg-white border-gray-100'
          }`}
          style={item.accent ? { backgroundColor: '#F5C400' } : {}}>
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            item.accent ? 'bg-black/10' : ''
          }`}
            style={!item.accent ? { backgroundColor: '#F5F5F0' } : {}}>
            <item.icon size={18} className={item.accent ? 'text-black' : 'text-gray-600'} />
          </div>
          <div className="min-w-0">
            <p className={`text-xs font-semibold ${item.accent ? 'text-black/60' : 'text-gray-400'}`}>
              {item.label}
            </p>
            <p className={`text-xl font-black truncate ${item.accent ? 'text-black' : 'text-gray-900'}`}>
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
