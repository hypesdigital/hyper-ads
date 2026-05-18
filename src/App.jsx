import { useState } from 'react';
import Header from './components/Header';
import FeedPage from './pages/FeedPage';
import FavoritesPage from './pages/FavoritesPage';
import AnalyticsPage from './pages/AnalyticsPage';
import SettingsPage from './pages/SettingsPage';
import { useFavorites } from './hooks/useFavorites';
import './index.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('feed');
  const { favorites, toggle, isFav } = useFavorites();

  const handleTabChange = (tab) => setActiveTab(tab);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F0' }}>
      <Header
        activeTab={activeTab}
        onTabChange={handleTabChange}
        favCount={favorites.length}
      />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'feed' && (
          <FeedPage
            search=""
            onTabChange={handleTabChange}
            isFav={isFav}
            onToggleFav={toggle}
          />
        )}
        {activeTab === 'favorites' && (
          <FavoritesPage
            favorites={favorites}
            onToggleFav={toggle}
            isFav={isFav}
          />
        )}
        {activeTab === 'analytics' && <AnalyticsPage />}
        {activeTab === 'settings' && <SettingsPage />}
      </main>
    </div>
  );
}
