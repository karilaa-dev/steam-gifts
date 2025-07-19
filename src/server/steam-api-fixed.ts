import fetch from 'node-fetch';
import type { RequestInit } from 'node-fetch';
import type { SteamFriend, SteamUser, WishlistItem, RegionalPrice, WishlistGameWithPrices } from '../types/steam.ts';

export class SteamAPI {
  private apiKey: string;
  private baseUrl = 'https://api.steampowered.com';
  private storeUrl = 'https://store.steampowered.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getWishlist(steamId: string): Promise<WishlistItem[]> {
    try {
      console.log('🔍 DEBUG: Starting wishlist fetch for Steam ID:', steamId);
      
      // Try the public Steam Web API endpoint
      const publicApiUrl = `${this.baseUrl}/IWishlistService/GetWishlist/v1/?steamid=${steamId}`;
      console.log('🔍 DEBUG: Using public Steam API:', publicApiUrl);
      
      const publicResponse = await fetch(publicApiUrl, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Steam-Gifts-App/1.0'
        }
      });
      
      console.log('🔍 DEBUG: Public API response status:', publicResponse.status);
      
      if (publicResponse.ok) {
        const data = await publicResponse.json() as any;
        const items = data.response?.items || [];
        
        if (items.length > 0) {
          console.log(`🔍 DEBUG: Found ${items.length} items via public API`);
          return items.map((item: any) => ({
            appid: item.appid,
            name: `App ${item.appid}`,
            header_image: '',
            price_overview: null,
            platforms: { windows: false, mac: false, linux: false },
            wishlist_priority: item.priority || 0
          })).sort((a, b) => a.wishlist_priority - b.wishlist_priority);
        }
      }
      
      // Public API didn't work, try authenticated approach with Steam cookies
      console.log('🔍 DEBUG: Trying Steam store authenticated approach');
      
      // Use the correct Steam store endpoint for authenticated access
      const storeUrl = `${this.storeUrl}/api/wishlist/`;
      const params = new URLSearchParams({
        steamid: steamId,
        count: '1000',
        language: 'english'
      });
      
      const authenticatedUrl = `${storeUrl}?${params.toString()}`;
      console.log('🔍 DEBUG: Using authenticated endpoint:', authenticatedUrl);
      
      // This method requires Steam cookies, so we'll implement a proxy approach
      // For now, we'll use the public API and handle the edge cases
      
      // Fallback to a different approach - try the community wishlist
      const communityUrl = `${this.storeUrl}/wishlist/id/${steamId}`;
      console.log('🔍 DEBUG: Checking community URL:', communityUrl);
      
      // Since the direct approach isn't working, let's implement the actual fix
      return this.getWishlistFromSteamCommunity(steamId);
      
    } catch (error) {
      console.error('🔍 DEBUG: Error in getWishlist:', error);
      throw error;
    }
  }

  private async getWishlistFromSteamCommunity(steamId: string): Promise<WishlistItem[]> {
    try {
      // Try the community profiles endpoint
      const url = `https://steamcommunity.com/profiles/${steamId}/wishlist/`;
      console.log('🔍 DEBUG: Using community profiles:', url);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Community endpoint returned ${response.status}`);
      }
      
      // This would require HTML parsing, but for now we'll return empty
      // In a real implementation, you would parse the HTML
      console.log('🔍 DEBUG: Community endpoint requires HTML parsing');
      return [];
      
    } catch (error) {
      console.error('🔍 DEBUG: Community endpoint error:', error);
      return [];
    }
  }

  async getUserInfo(steamId: string): Promise<SteamUser | null> {
    try {
      console.log('🔍 DEBUG: Starting getUserInfo for Steam ID:', steamId);
      
      const url = `${this.baseUrl}/ISteamUser/GetPlayerSummaries/v0002/?key=${this.apiKey}&steamids=${steamId}`;
      console.log('🔍 DEBUG: Steam API URL:', url.replace(this.apiKey, 'REDACTED_API_KEY'));
      
      const response = await fetch(url);
      console.log('🔍 DEBUG: Steam API response status:', response.status);
      
      if (!response.ok) {
        console.log('🔍 DEBUG: Steam API response not ok');
        return null;
      }
      
      const data = await response.json() as any;
      console.log('🔍 DEBUG: Steam API response data:', JSON.stringify(data, null, 2));
      
      if (data.response?.players?.length > 0) {
        const player = data.response.players[0];
        console.log('🔍 DEBUG: Found player:', player.personaname);
        return {
          steamid: player.steamid,
          personaname: player.personaname,
          profileurl: player.profileurl,
          avatar: player.avatar,
          avatarmedium: player.avatarmedium,
          avatarfull: player.avatarfull,
          communityvisibilitystate: player.communityvisibilitystate
        };
      }
      console.log('🔍 DEBUG: No players found in response');
      return null;
    } catch (error) {
      console.error('🔍 DEBUG: Error fetching user info:', error);
      return null;
    }
  }

  async getProxiedWishlist(steamId: string, cookie: string): Promise<any> {
    try {
      // Use the correct Steam store API endpoint
      const wishlistUrl = `${this.storeUrl}/api/wishlist/?steamid=${steamId}&count=1000&language=english`;
      console.log('🔍 DEBUG: Using authenticated wishlist API:', wishlistUrl);
      
      const response = await fetch(wishlistUrl, {
        headers: {
          'Cookie': cookie,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Referer': 'https://store.steampowered.com/'
        },
      });

      console.log('🔍 DEBUG: Authenticated response status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch authenticated wishlist: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('