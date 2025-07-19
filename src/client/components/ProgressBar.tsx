import React, { useEffect } from 'react';

interface ProgressBarProps {
  total: number;
  loaded: number;
  isLoading: boolean;
  className?: string;
}

export function ProgressBar({ total, loaded, isLoading, className = '' }: ProgressBarProps) {
  const percentage = total > 0 ? Math.round((loaded / total) * 100) : 0;
  const remaining = total - loaded;

  if (!isLoading || total === 0) {
    return null;
  }

  return (
    <div className={`progress-bar ${className}`}>
      <div className="progress-info">
        <span className="progress-text">
          Loading games... {loaded} of {total} ({percentage}%)
        </span>
        {remaining > 0 && (
          <span className="remaining-text">
            {remaining} remaining
          </span>
        )}
      </div>
      <div className="progress-track">
        <div 
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Hook for managing game loading with Bun Workers
export function useGameLoader() {
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState({ loaded: 0, total: 0 });
  const [games, setGames] = React.useState<any[]>([]);

  const loadGames = async (steamId: string, gameIds: number[]) => {
    setLoading(true);
    setProgress({ loaded: 0, total: gameIds.length });
    setGames([]);

    try {
      const response = await fetch(`/api/wishlist/${steamId}`);
      if (!response.ok) {
        throw new Error('Failed to load wishlist');
      }

      const wishlistData = await response.json();
      const allGames = wishlistData.games || [];

      setGames(allGames);
      setProgress({ loaded: allGames.length, total: allGames.length });
      setLoading(false);

      return allGames;
    } catch (error) {
      console.error('Error loading games:', error);
      setLoading(false);
      throw error;
    }
  };

  const reset = () => {
    setLoading(false);
    setProgress({ loaded: 0, total: 0 });
    setGames([]);
  };

  return {
    loading,
    progress,
    games,
    loadGames,
    reset
  };
}