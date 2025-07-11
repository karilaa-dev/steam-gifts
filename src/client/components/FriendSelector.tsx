import React, { useState, useEffect } from 'react';
import type { SteamFriend } from '../../types/steam';

interface FriendSelectorProps {
  steamId: string;
  userName: string;
  onFriendSelect: (friend: SteamFriend) => void;
  onLogout?: () => void;
  disabled: boolean;
}

export function FriendSelector({ steamId, userName, onFriendSelect, onLogout, disabled }: FriendSelectorProps) {
  const [friends, setFriends] = useState<SteamFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadFriends();
  }, [steamId]);

  const loadFriends = async () => {
    try {
      console.log('🔍 DEBUG: Starting loadFriends');
      setLoading(true);
      setError(null);

      console.log('🔍 DEBUG: Fetching /api/friends');
      const response = await fetch('/api/friends');
      console.log('🔍 DEBUG: Response status:', response.status);
      
      if (!response.ok) {
        console.log('🔍 DEBUG: Response not ok, status:', response.status);
        const errorData = await response.json() as { error?: string };
        console.log('🔍 DEBUG: Error data:', errorData);
        throw new Error(errorData.error || 'Failed to load friends');
      }

      const friendsData = await response.json() as SteamFriend[];
      console.log('🔍 DEBUG: Friends data received:', friendsData.length, 'friends');
      console.log('🔍 DEBUG: First few friends:', friendsData.slice(0, 3));
      setFriends(friendsData);
    } catch (err) {
      console.error('🔍 DEBUG: Error in loadFriends:', err);
      setError(err instanceof Error ? err.message : 'Failed to load friends');
    } finally {
      setLoading(false);
    }
  };

  const filteredFriends = friends.filter(friend =>
    friend.personaname.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="friend-selector">
        <div className="loading-state">
          <div className="loading-spinner">🔄</div>
          <p>Loading friends list...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="friend-selector">
        <div className="error-state">
          <h2>Error Loading Friends</h2>
          <p>{error}</p>
          <div className="action-buttons">
            <button onClick={loadFriends} className="retry-button">
              🔄 Retry
            </button>
            {onLogout && (
              <button onClick={onLogout} className="logout-button">
                🚪 Logout
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="friend-selector">
      <div className="selector-header">
        <div className="header-info">
          <h2>Select a Friend</h2>
          <p>Choose a friend to view their Steam wishlist</p>
        </div>
        {onLogout && (
          <button onClick={onLogout} className="logout-button" disabled={disabled}>
            🚪 Logout
          </button>
        )}
      </div>

      {friends.length === 0 ? (
        <div className="empty-state">
          <h3>No Friends Found</h3>
          <p>This Steam account has no friends or the friends list is private.</p>
        </div>
      ) : (
        <>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search friends..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              disabled={disabled}
            />
          </div>

          <div className="friends-grid">
            {filteredFriends.map((friend) => (
              <div
                key={friend.steamid}
                className="friend-card"
                onClick={() => !disabled && onFriendSelect(friend)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                    onFriendSelect(friend);
                  }
                }}
              >
                <img
                  src={friend.avatarmedium}
                  alt={`${friend.personaname}'s avatar`}
                  className="friend-avatar"
                />
                <div className="friend-info">
                  <h3 className="friend-name">{friend.personaname}</h3>
                </div>
              </div>
            ))}
          </div>

          {filteredFriends.length === 0 && searchTerm && (
            <div className="no-results">
              <p>No friends found matching "{searchTerm}"</p>
            </div>
          )}

          <div className="friends-summary">
            <p>
              Showing {filteredFriends.length} of {friends.length} friends
            </p>
          </div>
        </>
      )}
    </div>
  );
} 