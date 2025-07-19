import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { ProgressBar, useGameLoader } from '../components/ProgressBar';
import type { WishlistResponse } from '../../types/steam';

export function FriendDetailPage() {
  const { steamId } = useParams<{ steamId: string }>();
  const { user } = useAuth();
  const { loading, progress, games, loadGames } = useGameLoader();
  const [friendData, setFriendData] = useState<WishlistResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [friendInfo, setFriendInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  const addDebugInfo = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    const log = `[${timestamp}] ${message}`;
    console.log(log);
    setDebugInfo(prev => [...prev.slice(-9), log]); // Keep last 10 messages
  }, []);

  useEffect(() => {
    if (!steamId) return;

    addDebugInfo(`Starting load for Steam ID: ${steamId}`);
    loadFriendData();
  }, [steamId, addDebugInfo]);

  const loadFriendData = async () => {
    try {
      setError(null);
      setErrorDetails(null);
      setIsLoading(true);
      setDebugInfo([]);

      addDebugInfo('=== DEBUG START ===');
      addDebugInfo(`Current Steam ID: ${steamId}`);

      // Load friend info first
      addDebugInfo('Loading friend info...');
      const friendResponse = await fetch(`/api/user/${steamId}`, {
        credentials: 'include',
      });

      if (!friendResponse.ok) {
        const errorData = await friendResponse.json();
        if (friendResponse.status === 404) {
          setError('User not found');
          setErrorDetails({
            title: 'Steam User Not Found',
            message: `No Steam user exists with ID: ${steamId}`,
            type: 'not_found'
          });
        } else if (friendResponse.status === 400) {
          setError('Invalid Steam ID');
          setErrorDetails({
            title: 'Invalid Steam ID',
            message: errorData.details || 'The Steam ID format is invalid',
            type: 'invalid_id'
          });
        } else {
          throw new Error(errorData.error || 'Failed to load user information');
        }
        setIsLoading(false);
        return;
      }

      const friend = await friendResponse.json();
      setFriendInfo(friend);
      addDebugInfo(`Loaded friend: ${friend.personaname}`);

      addDebugInfo('Fetching wishlist from API...');
      const wishlistResponse = await fetch(`/api/wishlist/${steamId}`, {
        credentials: 'include',
      });

      if (!wishlistResponse.ok) {
        const errorData = await wishlistResponse.json();
        
        if (wishlistResponse.status === 403) {
          setError('Access denied');
          setErrorDetails({
            title: 'Private Wishlist',
            message: errorData.details || 'This user has set their wishlist to private',
            type: 'private_wishlist',
            details: errorData
          });
        } else if (wishlistResponse.status === 404) {
          setError('Wishlist not found');
          setErrorDetails({
            title: 'Wishlist Not Found',
            message: 'Unable to find a wishlist for this user',
            type: 'wishlist_not_found'
          });
        } else {
          setError('Failed to load wishlist');
          setErrorDetails({
            title: 'Error Loading Wishlist',
            message: errorData.details || errorData.error || 'Unable to load wishlist data',
            type: 'wishlist_error'
          });
        }
        setIsLoading(false);
        return;
      }

      const wishlistData = await wishlistResponse.json();
      addDebugInfo(`✅ API Response: ${wishlistData.games?.length || 0} games`);
      
      setFriendData(wishlistData);
      addDebugInfo('=== DEBUG END ===');

    } catch (err) {
      addDebugInfo(`❌ ERROR: ${err instanceof Error ? err.message : String(err)}`);
      console.error('Error loading friend data:', err);
      setError('Connection failed');
      setErrorDetails({
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        type: 'connection_error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (price: string) => {
    return price || 'Free';
  };

  const getBestPrice = (regionalPrices: any[]) => {
    if (!regionalPrices || regionalPrices.length === 0) return null;
    
    return regionalPrices.reduce((best, current) => {
      const bestPrice = parseFloat(best.price.replace(/[^0-9.-]+/g, ''));
      const currentPrice = parseFloat(current.price.replace(/[^0-9.-]+/g, ''));
      return currentPrice < bestPrice ? current : best;
    });
  };

  const renderError = () => {
    if (!errorDetails) {
      return (
        <div className="friend-detail-page">
          <header className="page-header">
            <Link to="/friends" className="back-link">
              ← Back to Friends
            </Link>
            <h1>Error</h1>
          </header>
          <div className="error-container">
            <h2>Something went wrong</h2>
            <p>{error}</p>
            <button onClick={loadFriendData} className="retry-button">
              🔄 Try Again
            </button>
          </div>
        </div>
      );
    }

    let icon = '❌';
    let suggestions = [];

    switch (errorDetails.type) {
      case 'not_found':
        icon = '👤';
        suggestions = [
          'Check if the Steam ID is correct',
          'The user may have changed their Steam ID',
          'Try refreshing your friends list'
        ];
        break;
      case 'private_wishlist':
        icon = '🔒';
        suggestions = [
          'This user has chosen to keep their wishlist private',
          'You can still view public wishlists of your other friends',
          'Ask your friend to make their wishlist public'
        ];
        break;
      case 'wishlist_not_found':
        icon = '📋';
        suggestions = [
          'The user may not have a wishlist yet',
          'They might have an empty wishlist',
          'Check back later as they add games'
        ];
        break;
      case 'invalid_id':
        icon = '⚠️';
        suggestions = [
          'Steam IDs are 17-digit numbers',
          'Check the URL for typos',
          'Go back to friends list and try again'
        ];
        break;
      default:
        icon = '❌';
        suggestions = [
          'Check your internet connection',
          'Try refreshing the page',
          'Contact support if the problem persists'
        ];
    }

    return (
      <div className="friend-detail-page">
        <header className="page-header">
          <Link to="/friends" className="back-link">
            ← Back to Friends
          </Link>
          <h1>{errorDetails.title}</h1>
        </header>
        <div className="error-container">
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{icon}</div>
          <h2>{errorDetails.title}</h2>
          <p style={{ marginBottom: '1.5rem', color: '#666' }}>{errorDetails.message}</p>
          
          {suggestions.length > 0 && (
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem' }}>Suggestions:</h3>
              <ul style={{ textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
                {suggestions.map((suggestion, index) => (
                  <li key={index} style={{ marginBottom: '0.5rem', color: '#666' }}>{suggestion}</li>
                ))}
              </ul>
            </div>
          )}
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button onClick={loadFriendData} className="retry-button">
              🔄 Try Again
            </button>
            <Link to="/friends" className="retry-button" style={{ textDecoration: 'none' }}>
              👥 Back to Friends
            </Link>
          </div>
        </div>
      </div>
    );
  };

  if (error) {
    return renderError();
  }

  if (isLoading || !friendInfo) {
    return (
      <div className="friend-detail-page">
        <header className="page-header">
          <Link to="/friends" className="back-link">
            ← Back to Friends
          </Link>
          <h1>Loading...</h1>
        </header>
        <div className="loading-container">
          <div className="loading-spinner">🔄</div>
          <p>Loading friend information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="friend-detail-page">
      <header className="page-header">
        <div className="header-content">
          <Link to="/friends" className="back-link">
            ← Back to Friends
          </Link>
          <div className="friend-header">
            <img 
              src={friendInfo.avatarfull} 
              alt={friendInfo.personaname}
              className="friend-avatar-large"
            />
            <div className="friend-details">
              <h1>{friendInfo.personaname}'s Wishlist</h1>
              <p>Steam ID: {steamId}</p>
              {user?.steamid === steamId && (
                <span className="own-profile-badge">Your Profile</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="page-main">
        {/* Debug Console */}
        {debugInfo.length > 0 && (
          <div style={{
            backgroundColor: '#f5f5f5',
            border: '1px solid #ddd',
            borderRadius: '4px',
            padding: '10px',
            marginBottom: '20px',
            fontSize: '12px',
            fontFamily: 'monospace',
            maxHeight: '200px',
            overflow: 'auto'
          }}>
            <h4 style={{ marginTop: 0 }}>Debug Console</h4>
            {debugInfo.map((log, index) => (
              <div key={index} style={{ color: '#333' }}>{log}</div>
            ))}
          </div>
        )}

        <ProgressBar 
          total={friendData?.games?.length || 0}
          loaded={friendData?.games?.length || 0}
          isLoading={loading}
        />

        {friendData?.games && (
          <div className="wishlist-summary">
            <h2>
              Wishlist Summary ({friendData.games.length} games)
            </h2>
          </div>
        )}

        {friendData?.games && friendData.games.length > 0 ? (
          <div className="games-grid">
            {friendData.games.map((game) => {
              const bestPrice = getBestPrice(game.regionalPrices);
              
              return (
                <div key={game.appid} className="game-card">
                  <img 
                    src={game.header_image} 
                    alt={game.name}
                    className="game-image"
                  />
                  <div className="game-info">
                    <h3>{game.name}</h3>
                    <div className="price-info">
                      <span className="current-price">
                        {formatPrice(game.price_overview?.final_formatted || 'N/A')}
                      </span>
                      {game.price_overview && game.price_overview.discount_percent > 0 && (
                        <span className="discount-badge">
                          -{game.price_overview.discount_percent}%
                        </span>
                      )}
                    </div>
                    {bestPrice && (
                      <p className="best-price">
                        Best price: {bestPrice.price} in {bestPrice.regionName}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : friendData ? (
          <div className="empty-state">
            <h2>Empty Wishlist</h2>
            <p>
              {friendInfo.personaname} doesn't have any games in their wishlist yet.
            </p>
          </div>
        ) : (
          <div className="loading-container">
            <div className="loading-spinner">🔄</div>
            <p>Loading wishlist data...</p>
          </div>
        )}
      </main>
    </div>
  );
}