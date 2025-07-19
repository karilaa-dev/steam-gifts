import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/auth-context';
import { LogoutButton } from '../components/LogoutButton';
import type { SteamFriend } from '../../types/steam';

export function FriendsListPage() {
  const { user, isAuthenticated } = useAuth();
  const [friends, setFriends] = useState<SteamFriend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAuthenticated || !user) return;

    loadFriends();
  }, [user, isAuthenticated]);

  const loadFriends = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/friends', {
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to load friends: ${response.status}`);
      }

      const friendsData = await response.json() as SteamFriend[];
      
      // Sort alphabetically by personaname
      const sortedFriends = friendsData.sort((a, b) => 
        a.personaname.localeCompare(b.personaname, undefined, { sensitivity: 'base' })
      );
      
      setFriends(sortedFriends);
    } catch (err) {
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
      <div className="friends-list-page">
        <header className="page-header">
          <h1>Steam Friends</h1>
          <p>Loading your friends list...</p>
        </header>
        <div className="loading-container">
          <div className="loading-spinner">🔄</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="friends-list-page">
        <header className="page-header">
          <h1>Steam Friends</h1>
          <LogoutButton />
        </header>
        <div className="error-container">
          <h2>Error Loading Friends</h2>
          <p>{error}</p>
          <button onClick={loadFriends} className="retry-button">
            🔄 Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="friends-list-page">
      <header className="page-header">
        <div className="header-content">
          <h1>Steam Friends</h1>
          <p>Welcome, {user?.personaname}! Select a friend to view their wishlist.</p>
        </div>
        <LogoutButton />
      </header>

      <main className="page-main">
        <div className="search-section">
          <input
            type="text"
            placeholder="Search friends..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <div className="search-info">
            Showing {filteredFriends.length} of {friends.length} friends
            {searchTerm && ` (filtered)`}
          </div>
        </div>

        {friends.length === 0 ? (
          <div className="empty-state">
            <h2>No Friends Found</h2>
            <p>
              This Steam account has no friends or the friends list is private.
              Try adding some friends on Steam first!
            </p>
          </div>
        ) : filteredFriends.length === 0 ? (
          <div className="empty-state">
            <h2>No Matching Friends</h2>
            <p>
              No friends found matching "{searchTerm}"
            </p>
          </div>
        ) : (
          <div className="friends-grid">
            {filteredFriends.map((friend) => (
              <Link
                key={friend.steamid}
                to={`/friend/${friend.steamid}`}
                className="friend-card-link"
              >
                <div className="friend-card">
                  <img
                    src={friend.avatarmedium}
                    alt={`${friend.personaname}'s avatar`}
                    className="friend-avatar"
                  />
                  <div className="friend-info">
                    <h3 className="friend-name">{friend.personaname}</h3>
                    <p className="friend-id">Steam ID: {friend.steamid}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}