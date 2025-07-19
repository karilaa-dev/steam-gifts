import React, { useState } from 'react';
import type { WishlistResponse, WishlistGameWithPrices } from '../../types/steam';

interface WishlistViewerProps {
  wishlistData: WishlistResponse;
  onBack: () => void;
  onReset: () => void;
}

export function WishlistViewer({ wishlistData, onBack, onReset }: WishlistViewerProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'wishlist' | 'name' | 'price'>('wishlist');

  const filteredGames = wishlistData.games.filter(game =>
    game.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedGames = [...filteredGames].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.name.localeCompare(b.name);
      case 'price':
        // Sort by US price if available, otherwise by first region price
        const priceA = a.regionalPrices.find(p => p.region === 'US') || a.regionalPrices[0];
        const priceB = b.regionalPrices.find(p => p.region === 'US') || b.regionalPrices[0];
        const numA = parseFloat(priceA?.price.replace(/[^0-9.]/g, '') || '999999');
        const numB = parseFloat(priceB?.price.replace(/[^0-9.]/g, '') || '999999');
        return numA - numB;
      case 'wishlist':
      default:
        return a.wishlist_priority - b.wishlist_priority;
    }
  });

  

  return (
    <div className="wishlist-viewer">
      <header className="viewer-header">
        <div className="header-controls">
          <button onClick={onBack} className="back-button">
            ← Back
          </button>
          <button onClick={onReset} className="reset-button">
            🏠 Home
          </button>
        </div>
        
        <div className="header-info">
          <h2>{wishlistData.user.personaname}'s Wishlist</h2>
          <p>{wishlistData.totalCount} games</p>
        </div>

        <div className="user-avatar">
          <img 
            src={wishlistData.user.avatarmedium} 
            alt={`${wishlistData.user.personaname}'s avatar`}
          />
        </div>
      </header>

      <div className="viewer-controls">
        <div className="search-sort-bar">
          <input
            type="text"
            placeholder="Search games..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'wishlist' | 'name' | 'price')}
            className="sort-select"
          >
            <option value="wishlist">Wishlist Order</option>
            <option value="name">Name (A-Z)</option>
            <option value="price">Price (Low to High)</option>
          </select>
        </div>

        <div className="results-info">
          <p>Showing {sortedGames.length} of {wishlistData.totalCount} games</p>
        </div>
      </div>

      {sortedGames.length === 0 ? (
        <div className="empty-results">
          <h3>No Games Found</h3>
          <p>
            {searchTerm 
              ? `No games match "${searchTerm}"`
              : 'This wishlist is empty'
            }
          </p>
        </div>
      ) : (
        <div className="games-grid">
          {sortedGames.map((game) => (
            <div key={game.appid} className="game-card">
              <div className="game-header">
                <img
                  src={game.header_image}
                  alt={game.name}
                  className="game-image"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDYwIiBoZWlnaHQ9IjIxNSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
                  }}
                />
                <div className="game-info">
                  <h3 className="game-title">{game.name}</h3>
                  <p className="wishlist-position">#{game.wishlist_priority + 1} on wishlist</p>
                </div>
              </div>

              <div className="price-comparison">
                <h4>Regional Prices:</h4>
                <div className="prices-grid">
                  {game.regionalPrices.map((regionPrice) => (
                    <div key={regionPrice.region} className="price-item">
                      <div className="price-region">
                        <strong>{regionPrice.regionName}</strong>
                      </div>
                      <div className="price-value">
                        {regionPrice.discount && regionPrice.discount > 0 ? (
                          <>
                            <span className="original-price">{regionPrice.originalPrice}</span>
                            <span className="discounted-price">{regionPrice.price}</span>
                            <span className="discount-badge">-{regionPrice.discount}%</span>
                          </>
                        ) : (
                          <span className="regular-price">{regionPrice.price}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="game-actions">
                <a
                  href={`https://store.steampowered.com/app/${game.appid}/`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="steam-link"
                >
                  View on Steam →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 