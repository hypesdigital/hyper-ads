import { useState } from 'react';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';

const defaultFilters = {
  daysMin: '',
  daysMax: '',
  adsMin: '',
  adsMax: '',
  dateFrom: '',
  dateTo: '',
  adType: 'Todos',
  language: 'Todos',
  gateway: 'Todos',
  productType: 'Todos',
};

export default function FilterPanel({ filters, onApply }) {
  const [open, setOpen] = useState(false);
  const [local, setLocal] = useState(filters || defaultFilters);

  const set = (key, val) => setLocal(prev => ({ ...prev, [key]: val }));

  const apply = () => {
    onApply(local);
    setOpen(false);
  };

  const clear = () => {
    setLocal(defaultFilters);
    onApply(defaultFilters);
  };

  const activeCount = Object.entries(local).filter(([k, v]) => {
    if (k === 'adType' || k === 'language' || k === 'gateway' || k === 'productType') return v !== 'Todos';
    return v !== '';
  }).length;

  const SelectField = ({ label, options, value, onChange }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full appearance-none pl-3 pr-8 py-2 text-sm rounded-xl border border-gray-200
            bg-white focus:outline-none focus:ring-2 transition-all cursor-pointer"
        >
          {options.map(o => <option key={o}>{o}</option>)}
        </select>
        <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
      </div>
    </div>
  );

  const RangeField = ({ label, minKey, maxKey, placeholder }) => (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
      <div className="flex gap-2">
        <input type="number" min="0" placeholder="Min" value={local[minKey]}
          onChange={e => set(minKey, e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 transition-all" />
        <input type="number" min="0" placeholder="Max" value={local[maxKey]}
          onChange={e => set(maxKey, e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 transition-all" />
      </div>
    </div>
  );

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white
          text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-all shadow-sm"
      >
        <SlidersHorizontal size={15} />
        Filtros
        {activeCount > 0 && (
          <span style={{ backgroundColor: '#F5C400' }}
            className="w-5 h-5 rounded-full text-xs font-bold flex items-center justify-center text-black">
            {activeCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-12 z-50 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Filtros</h3>
              <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            </div>

            <div className="space-y-4">
              <RangeField label="Dias rodando" minKey="daysMin" maxKey="daysMax" />
              <RangeField label="Nº de anúncios ativos" minKey="adsMin" maxKey="adsMax" />

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Data de publicação</label>
                <div className="flex gap-2">
                  <input type="date" value={local.dateFrom} onChange={e => set('dateFrom', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none transition-all" />
                  <input type="date" value={local.dateTo} onChange={e => set('dateTo', e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 focus:outline-none transition-all" />
                </div>
              </div>

              <SelectField label="Tipo de anúncio" value={local.adType} onChange={v => set('adType', v)}
                options={['Todos', 'Imagem', 'Vídeo']} />
              <SelectField label="Idioma" value={local.language} onChange={v => set('language', v)}
                options={['Todos', 'PT', 'ES', 'EN']} />
              <SelectField label="Gateway" value={local.gateway} onChange={v => set('gateway', v)}
                options={['Todos', 'Hotmart', 'Kiwify', 'Cakto']} />
              <SelectField label="Tipo de produto" value={local.productType} onChange={v => set('productType', v)}
                options={['Todos', 'Infoproduto', 'Físico']} />
            </div>

            <div className="flex gap-3 mt-5">
              <button onClick={clear}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold
                  text-gray-600 hover:bg-gray-50 transition-all">
                Limpar
              </button>
              <button onClick={apply}
                style={{ backgroundColor: '#F5C400' }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black hover:opacity-90 transition-all shadow-sm">
                Aplicar
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
