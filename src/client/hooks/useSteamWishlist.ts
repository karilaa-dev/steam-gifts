import { useState, useEffect } from 'react';
import { steamDirectClient } from '../services/steam-direct';
import type { WishlistItem, SteamUser } from '../../types/steam';

interface UseSteamWishlistReturn {
  wishlist: WishlistItem[] | null;
  loading: boolean;
  error: string | null;
  userInfo: SteamUser | null;
  refetch: () => void;
}

export function useSteamWishlist(steamId: string, userName: string) {
  const [wishlist, setWishlist] = useState<WishlistItem[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<SteamUser | null>(null);

  const fetchWishlist = async () => {
    if (!steamId) return;

    setLoading(true);
    setError(null);

    try {
      // Create mock user info since we're not fetching via API
      const mockUser: SteamUser = {
        steamid: steamId,
        personaname: userName,
        profileurl: `https://steamcommunity.com/profiles/${steamId}`,
        avatar: '',
        avatarmedium: '',
        avatarfull: '',
        communityvisibilitystate: 3
      };

      setUserInfo(mockUser);

      // Fetch wishlist directly from Steam
      const items = await steamDirectClient.getWishlist(steamId);
      setWishlist(items);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      
      // Handle specific Steam errors
      if (errorMessage.includes('private')) {
        setError('This Steam profile wishlist is private. Please ensure you are logged into Steam in this browser.');
      } else if (errorMessage.includes('Steam login required')) {
        setError('Please log into Steam in this browser to access private wishlists.');
      } else if (errorMessage.includes('not found')) {
        setError('Steam user not found or wishlist is unavailable.');
      } else {
        setError(errorMessage);
      }
      
      setWishlist(null);
      setUserInfo(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWishlist();
  }, [steamId, userName]);

  const refetch = () => {
    fetchWishlist();
  };

  return {
    wishlist,
    loading,
    error,
    userInfo,
    refetch
  };
}