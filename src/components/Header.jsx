import { useState } from 'react';
import { Bell, Zap, Heart } from 'lucide-react';

export default function Header({ activeTab, onTabChange, favCount = 0 }) {
  const tabs = [
    { id: 'feed', label: 'Feed' },
    { id: 'favorites', label: 'Favoritos', badge: favCount },
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

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`relative px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'text-black shadow-sm'
                    : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'
                }`}
                style={activeTab === tab.id ? { backgroundColor: '#F5C400' } : {}}
              >
                {tab.id === 'favorites' && <Heart size={13} className="inline mr-1 -mt-0.5" />}
                {tab.label}
                {tab.badge > 0 && (
                  <span style={{ backgroundColor: '#FF6B35' }}
                    className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-white text-[10px] font-bold flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Right */}
          <div className="flex items-center gap-2 shrink-0">
            <button className="relative w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center
                text-gray-500 hover:bg-gray-100 transition-all">
              <Bell size={16} />
            </button>
            <div style={{ backgroundColor: '#F5C400' }}
              className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm cursor-pointer">
              HA
            </div>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex md:hidden gap-1 pb-2 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 ${
                activeTab === tab.id ? 'text-black' : 'text-gray-500'
              }`}
              style={activeTab === tab.id ? { backgroundColor: '#F5C400' } : {}}
            >
              {tab.label}
              {tab.badge > 0 && (
                <span style={{ backgroundColor: '#FF6B35' }}
                  className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full text-white text-[9px] font-bold flex items-center justify-center">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
