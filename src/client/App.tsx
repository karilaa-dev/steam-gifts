import React, { useState, useEffect } from 'react';
import { LoginButton } from './components/LoginButton';
import { LogoutButton } from './components/LogoutButton';
import { WishlistViewer } from './components/WishlistViewer';
import { FriendSelector } from './components/FriendSelector';
import type { WishlistResponse, SteamFriend } from '../types/steam';
import type { AuthenticatedUser } from '../server/auth';
import './App.css';

type AppState = 'loading' | 'login' | 'friends' | 'wishlist';

interface AppData {
  authenticatedUser?: AuthenticatedUser;
  selectedFriend?: SteamFriend;
  wishlistData?: WishlistResponse;
}

export function App() {
  console.log('🔍 DEBUG: App component initializing');
  
  const [state, setState] = useState<AppState>('loading');
  const [data, setData] = useState<AppData>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  console.log('🔍 DEBUG: App state:', { state, loading, error: !!error });

  // Check authentication status on page load
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/me');
      
      if (response.ok) {
        const user = await response.json() as AuthenticatedUser;
        setData({ authenticatedUser: user });
        setState('friends');
      } else {
        setState('login');
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      setState('login');
    }
  };

  const handleFriendSelect = async (friend: SteamFriend) => {
    setLoading(true);
    setError(null);
    
    try {
      setData(prev => ({ ...prev, selectedFriend: friend }));
      await loadWishlist(friend.steamid);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load friend\'s wishlist');
    } finally {
      setLoading(false);
    }
  };

  const loadWishlist = async (steamId: string) => {
    const response = await fetch(`/api/wishlist/${steamId}`);
    
    if (!response.ok) {
      const errorData = await response.json() as { error?: string };
      throw new Error(errorData.error || 'Failed to load wishlist');
    }
    
    const wishlistData = await response.json() as WishlistResponse;
    setData(prev => ({ ...prev, wishlistData }));
    setState('wishlist');
  };

  const handleBack = () => {
    if (state === 'wishlist') {
      setState('friends');
      setData(prev => ({ ...prev, wishlistData: undefined, selectedFriend: undefined }));
    }
    setError(null);
  };

  const handleLogout = () => {
    setData({});
    setState('login');
    setError(null);
  };

  const handleAuthError = () => {
    // Check for auth error in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
      switch (errorParam) {
        case 'auth_failed':
          setError('Steam authentication failed. Please try again.');
          break;
        case 'user_not_found':
          setError('Steam user not found. Please try again.');
          break;
        case 'auth_error':
          setError('Authentication error occurred. Please try again.');
          break;
        default:
          setError('An error occurred during authentication.');
      }
      
      // Clear error parameter from URL
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Check for auth errors on component mount
  useEffect(() => {
    handleAuthError();
  }, []);

  return (
    <div className="app">
      <header className="app-header">
        <h1>🎮 Steam Wishlist Review</h1>
        <p>Compare Steam game prices across different regions</p>
        {data.authenticatedUser && (
          <LogoutButton
            user={data.authenticatedUser}
            onLogout={handleLogout}
          />
        )}
      </header>

      <main className="app-main">
        {error && (
          <div className="error-banner">
            <p>❌ {error}</p>
            <button onClick={() => setError(null)} className="error-close">✕</button>
          </div>
        )}

        {loading && (
          <div className="loading-overlay">
            <div className="loading-spinner">🔄</div>
            <p>Loading...</p>
          </div>
        )}

        {state === 'loading' && (
          <div className="loading-overlay">
            <div className="loading-spinner">🔄</div>
            <p>Checking authentication...</p>
          </div>
        )}

        {state === 'login' && (
          <LoginButton disabled={loading} />
        )}

        {state === 'friends' && data.authenticatedUser && (
          <FriendSelector
            steamId={data.authenticatedUser.steamid}
            userName={data.authenticatedUser.personaname}
            onFriendSelect={handleFriendSelect}
            onLogout={handleLogout}
            disabled={loading}
          />
        )}

        {state === 'wishlist' && data.wishlistData && (
          <WishlistViewer
            wishlistData={data.wishlistData}
            onBack={handleBack}
            onReset={handleLogout}
          />
        )}
      </main>

      <footer className="app-footer">
        <p>
          Built with React + Bun. Sign in with Steam to view your friends' wishlists.
        </p>
      </footer>
    </div>
  );
}