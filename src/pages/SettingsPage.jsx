import { useState, useEffect } from 'react';
import { Key, CheckCircle, XCircle, Save, Eye, EyeOff, Zap, ExternalLink } from 'lucide-react';

export default function SettingsPage() {
  const [token, setToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [saved, setSaved] = useState(false);
  const [status, setStatus] = useState(null); // 'connected' | 'disconnected' | null

  useEffect(() => {
    const stored = localStorage.getItem('apify_token');
    if (stored) {
      setToken(stored);
      setStatus('connected');
    }
  }, []);

  const handleSave = () => {
    if (!token.trim()) return;
    localStorage.setItem('apify_token', token.trim());
    setStatus('connected');
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleClear = () => {
    localStorage.removeItem('apify_token');
    setToken('');
    setStatus('disconnected');
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Configurações</h1>
        <p className="text-sm text-gray-500 mt-1">Gerencie sua integração com a Apify</p>
      </div>

      {/* API Token Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-4">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: '#FFF8E0' }}>
            <Key size={18} style={{ color: '#B8960A' }} />
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Apify API Token</h2>
            <p className="text-xs text-gray-400">Necessário para buscar anúncios em tempo real</p>
          </div>
        </div>

        {/* Status indicator */}
        <div className={`flex items-center gap-2 px-4 py-2.5 rounded-xl mb-5 text-sm font-semibold ${
          status === 'connected'
            ? 'bg-green-50 text-green-700'
            : status === 'disconnected'
            ? 'bg-red-50 text-red-600'
            : 'bg-gray-50 text-gray-500'
        }`}>
          {status === 'connected'
            ? <><CheckCircle size={15} /> Conectado — Token configurado</>
            : status === 'disconnected'
            ? <><XCircle size={15} /> Desconectado</>
            : <><Zap size={15} /> Aguardando configuração</>
          }
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
              Token de acesso
            </label>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                value={token}
                onChange={e => setToken(e.target.value)}
                placeholder="apify_api_xxxxxxxxxxxxxxxxxxxxxxxx"
                className="w-full px-4 py-3 pr-10 text-sm rounded-xl border border-gray-200
                  focus:outline-none focus:ring-2 bg-gray-50 font-mono transition-all"
              />
              <button
                onClick={() => setShowToken(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showToken ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleSave} disabled={!token.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold
                text-black transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#F5C400' }}>
              <Save size={14} />
              {saved ? 'Salvo!' : 'Salvar token'}
            </button>
            {status === 'connected' && (
              <button onClick={handleClear}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200
                  text-gray-600 hover:bg-gray-50 transition-all">
                Remover
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-3">Como obter seu token</h3>
        <ol className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-2"><span className="font-bold text-gray-400">1.</span> Acesse console.apify.com e crie uma conta gratuita</li>
          <li className="flex gap-2"><span className="font-bold text-gray-400">2.</span> Vá em Settings → Integrations → API tokens</li>
          <li className="flex gap-2"><span className="font-bold text-gray-400">3.</span> Clique em "Create new token"</li>
          <li className="flex gap-2"><span className="font-bold text-gray-400">4.</span> Copie o token e cole acima</li>
        </ol>
        <div className="mt-4 p-3 rounded-xl text-xs font-medium text-amber-700"
          style={{ backgroundColor: '#FFF8E0' }}>
          <strong>Nota:</strong> Na versão MVP os dados são mockados. A integração real com a Apify
          estará disponível na v2.
        </div>
      </div>
    </div>
  );
}
