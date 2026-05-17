import { useState } from 'react';
import Header from './components/Header';
import FeedPage from './pages/FeedPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import './index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('feed');
  const [search, setSearch] = useState('');

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F0' }}>
      <Header
        search={search}
        onSearchChange={setSearch}
        activeTab={activeTab}
        onTabChange={tab => { setActiveTab(tab); setSearch(''); }}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'feed' && <FeedPage search={search} />}
        {activeTab === 'analytics' && <AnalyticsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}
