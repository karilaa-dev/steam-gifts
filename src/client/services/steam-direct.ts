import type { WishlistItem } from '../../types/steam';

export class SteamDirectClient {
  private baseUrl = 'https://store.steampowered.com';
  private apiUrl = 'https://api.steampowered.com';

  /**
   * Fetches a user's wishlist from Steam using the correct API endpoints
   * Updated for 2024 Steam API changes
   */
  async getWishlist(steamId: string): Promise<WishlistItem[]> {
    try {
      console.log('🔍 DIRECT: Fetching wishlist for Steam ID:', steamId);
      
      // Use the correct Steam API endpoint for 2024
      const apiUrl = `${this.baseUrl}/api/wishlist/`;
      const params = new URLSearchParams({
        steamid: steamId,
        count: '1000',
        language: 'english'
      });
      
      const wishlistUrl = `${apiUrl}?${params.toString()}`;
      console.log('🔍 DIRECT: Using correct API URL:', wishlistUrl);
      
      const response = await fetch(wishlistUrl, {
        credentials: 'include', // Include Steam authentication cookies
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Referer': 'https://store.steampowered.com/'
        }
      });

      console.log('🔍 DIRECT: Response status:', response.status);
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Steam login required - please log into Steam in this browser');
        } else if (response.status === 403) {
          throw new Error('This Steam profile wishlist is private');
        } else if (response.status === 404) {
          throw new Error('Steam user not found');
        } else {
          throw new Error(`Steam API error: ${response.status}`);
        }
      }

      const data = await response.json();
      
      if (!data || !data.wishlist) {
        return [];
      }

      // Convert Steam API format to our internal format
      const wishlistItems: WishlistItem[] = [];
      
      if (Array.isArray(data.wishlist)) {
        for (const item of data.wishlist) {
          wishlistItems.push({
            appid: item.appid || item.app_id,
            name: item.name || `App ${item.appid || item.app_id}`,
            header_image: item.header_image || item.image || '',
            price_overview: item.price_overview || null,
            platforms: item.platforms || { windows: false, mac: false, linux: false },
            wishlist_priority: item.priority || item.display_order || 0
          });
        }
      } else if (typeof data.wishlist === 'object') {
        // Handle object format
        Object.entries(data.wishlist).forEach(([appid, gameData]: [string, any]) => {
          wishlistItems.push({
            appid: parseInt(appid),
            name: gameData.name || `App ${appid}`,
            header_image: gameData.header_image || '',
            price_overview: gameData.price_overview || null,
            platforms: gameData.platforms || { windows: false, mac: false, linux: false },
            wishlist_priority: gameData.priority || 0
          });
        });
      }

      // Sort by priority
      return wishlistItems.sort((a, b) => a.wishlist_priority - b.wishlist_priority);
      
    } catch (error) {
      console.error('🔍 DIRECT: Error fetching wishlist:', error);
      
      // Try the dynamic store endpoint as fallback
      try {
        return await this.getWishlistFromDynamicStore(steamId);
      } catch (fallbackError) {
        throw error; // Original error is more informative
      }
    }
  }

  /**
   * Fallback method using Steam's dynamic store endpoint
   */
  private async getWishlistFromDynamicStore(steamId: string): Promise<WishlistItem[]> {
    try {
      const dynamicStoreUrl = `${this.baseUrl}/dynamicstore/userdata/`;
      console.log('🔍 DIRECT: Using dynamic store fallback:', dynamicStoreUrl);
      
      const response = await fetch(dynamicStoreUrl, {
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });

      if (!response.ok) {
        throw new Error('Dynamic store access failed');
      }

      const data = await response.json();
      
      if (!data || !data.rgWishlist) {
        return [];
      }

      return data.rgWishlist.map((appid: number) => ({
        appid,
        name: `App ${appid}`,
        header_image: '',
        price_overview: null,
        platforms: { windows: false, mac: false, linux: false },
        wishlist_priority: 0
      }));
      
    } catch (error) {
      console.error('🔍 DIRECT: Dynamic store fallback failed:', error);
      throw error;
    }
  }

  /**
   * Checks if the browser has Steam authentication cookies
   */
  async hasSteamAuth(): Promise<boolean> {
    try {
      const response = await fetch('https://store.steampowered.com/account/', {
        credentials: 'include',
        method: 'HEAD'
      });
      
      return response.ok && !response.url.includes('login');
    } catch {
      return false;
    }
  }

  /**
   * Gets user info from Steam API (public endpoint)
   */
  async getUserInfo(steamId: string) {
    try {
      const response = await fetch(
        `${this.apiUrl}/ISteamUser/GetPlayerSummaries/v0002/?key=DEMO_KEY&steamids=${steamId}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch user info');
      }
      
      const data = await response.json();
      return data.response?.players?.[0] || null;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  }
}

export const steamDirectClient = new SteamDirectClient();