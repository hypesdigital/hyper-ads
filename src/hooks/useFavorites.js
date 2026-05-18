import { useState, useCallback } from 'react';

const KEY = 'hyperads_favorites';

function load() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(load);

  const toggle = useCallback((ad) => {
    setFavorites(prev => {
      const exists = prev.some(f => f.id === ad.id);
      const next = exists ? prev.filter(f => f.id !== ad.id) : [ad, ...prev];
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFav = useCallback((id) => favorites.some(f => f.id === id), [favorites]);

  return { favorites, toggle, isFav };
}
