import React, { useState } from 'react';

interface SteamIdInputProps {
  onSubmit: (steamId: string, userName: string, loadFriends: boolean) => void;
  disabled: boolean;
}

export function SteamIdInput({ onSubmit, disabled }: SteamIdInputProps) {
  const [input, setInput] = useState('');
  const [loadFriends, setLoadFriends] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!input.trim()) {
      setError('Please enter a Steam ID or profile URL');
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch('/api/validate-steam-id', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ input: input.trim() }),
      });

      const data = await response.json() as { steamId?: string; user?: { personaname: string }; error?: string };

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate Steam ID');
      }

      if (data.steamId && data.user) {
        onSubmit(data.steamId, data.user.personaname, loadFriends);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="steam-id-input">
      <div className="input-card">
        <h2>Enter Steam Information</h2>
        <p className="subtitle">
          Enter a Steam ID64 or Steam profile URL to view wishlists
        </p>

        <form onSubmit={handleSubmit} className="input-form">
          <div className="input-group">
            <label htmlFor="steam-input">Steam ID or Profile URL:</label>
            <input
              id="steam-input"
              type="text"
              value={input}
              onChange={(e) => setInput((e.target as HTMLInputElement).value)}
              placeholder="76561198123456789 or https://steamcommunity.com/profiles/76561198123456789"
              disabled={disabled || isValidating}
              className="steam-input"
            />
          </div>

          <div className="checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={loadFriends}
                onChange={(e) => setLoadFriends((e.target as HTMLInputElement).checked)}
                disabled={disabled || isValidating}
              />
              Load friends list (to view private wishlists)
            </label>
          </div>

          {error && (
            <div className="error-message">
              ⚠️ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={disabled || isValidating || !input.trim()}
            className="submit-button"
          >
            {isValidating ? '🔄 Validating...' : loadFriends ? '👥 Load Friends' : '🎮 View Wishlist'}
          </button>
        </form>

        <div className="help-section">
          <h3>How to find your Steam ID:</h3>
          <ul>
            <li>Go to your Steam profile page</li>
            <li>Copy the URL (e.g., steamcommunity.com/profiles/76561198123456789)</li>
            <li>Or just copy the number part (76561198123456789)</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 