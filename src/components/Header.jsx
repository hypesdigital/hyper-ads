import { useState } from 'react';
import { Search, Bell, Settings, Zap, User } from 'lucide-react';

export default function Header({ search, onSearchChange, activeTab, onTabChange }) {
  const [notifOpen, setNotifOpen] = useState(false);

  const tabs = [
    { id: 'feed', label: 'Feed' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'settings', label: 'Settings' },
  ];

  return (
    <header style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #EBEBEB' }}
      className="sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">

          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div style={{ backgroundColor: '#F5C400' }}
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm">
              <Zap size={18} className="text-black" fill="black" />
            </div>
            <span className="font-black text-xl tracking-tight text-gray-900 hidden sm:block">
              Hyper<span style={{ color: '#F5C400' }}>Ads</span>
            </span>
          </div>

          {/* Search */}
          <div className="flex-1 max-w-md">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar anunciante, copy ou produto..."
                value={search}
                onChange={e => onSearchChange(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50
                  focus:outline-none focus:ring-2 focus:border-transparent transition-all"
                style={{ '--tw-ring-color': '#F5C400' }}
              />
            </div>
          </div>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'text-black shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
                style={activeTab === tab.id ? { backgroundColor: '#F5C400' } : {}}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Right icons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              className="relative w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center
                text-gray-500 hover:bg-gray-100 transition-all"
              onClick={() => setNotifOpen(v => !v)}
            >
              <Bell size={16} />
              <span style={{ backgroundColor: '#FF6B35' }}
                className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" />
            </button>
            <div style={{ backgroundColor: '#F5C400' }}
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer">
              HA
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden gap-1 pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id ? 'text-black' : 'text-gray-500'
              }`}
              style={activeTab === tab.id ? { backgroundColor: '#F5C400' } : {}}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
