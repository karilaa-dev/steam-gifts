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
  const [requestController, setRequestController] = useState<AbortController | null>(null);

  useEffect(() => {
    loadFriends();
    
    // Cleanup function to abort ongoing requests
    return () => {
      if (requestController) {
        requestController.abort();
      }
    };
  }, [steamId]);

  const loadFriends = async () => {
    try {
      console.log('🔍 DEBUG: Starting loadFriends');
      setLoading(true);
      setError(null);

      // Abort any ongoing request
      if (requestController) {
        requestController.abort();
      }

      // Create new abort controller for this request
      const controller = new AbortController();
      setRequestController(controller);

      console.log('🔍 DEBUG: Fetching /api/friends');
      const response = await fetch('/api/friends', {
        signal: controller.signal,
        credentials: 'include', // Include cookies for authentication
      });
      
      console.log('🔍 DEBUG: Response status:', response.status);
      
      if (!response.ok) {
        console.log('🔍 DEBUG: Response not ok, status:', response.status);
        
        // Handle different error types
        let errorMessage = 'Failed to load friends';
        
        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorData = await response.json();
            errorMessage = errorData.error || errorData.message || `HTTP ${response.status}`;
          } else {
            const text = await response.text();
            errorMessage = text || `HTTP ${response.status}`;
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `HTTP ${response.status}`;
        }
        
        throw new Error(errorMessage);
      }

      const friendsData = await response.json() as SteamFriend[];
      console.log('🔍 DEBUG: Friends data received:', friendsData.length, 'friends');
      console.log('🔍 DEBUG: First few friends:', friendsData.slice(0, 3));
      setFriends(friendsData);
    } catch (err) {
      if (err instanceof Error) {
        if (err.name === 'AbortError') {
          console.log('Request was aborted');
          return;
        }
        console.error('🔍 DEBUG: Error in loadFriends:', err);
        setError(err.message);
      } else {
        console.error('🔍 DEBUG: Unknown error in loadFriends:', err);
        setError('Failed to load friends');
      }
    } finally {
      setLoading(false);
      setRequestController(null);
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
                onClick={() => {
                  console.log('🔍 DEBUG: Friend card clicked:', friend.personaname, 'disabled:', disabled);
                  if (!disabled) {
                    onFriendSelect(friend);
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
                    console.log('🔍 DEBUG: Friend card activated via keyboard:', friend.personaname);
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