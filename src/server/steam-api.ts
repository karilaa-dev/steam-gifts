import fetch from 'node-fetch';
import type { SteamFriend, SteamUser, WishlistItem, RegionalPrice, WishlistGameWithPrices } from '../types/steam.ts';

export class SteamAPI {
  private apiKey: string;
  private baseUrl = 'https://api.steampowered.com';
  private storeUrl = 'https://store.steampowered.com';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
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
          avatarfull: player.avatarfull
        };
      }
      console.log('🔍 DEBUG: No players found in response');
      return null;
    } catch (error) {
      console.error('🔍 DEBUG: Error fetching user info:', error);
      return null;
    }
  }

  async getFriendsList(steamId: string): Promise<SteamFriend[]> {
    try {
      console.log('🔍 DEBUG: Starting getFriendsList for Steam ID:', steamId);
      
      const url = `${this.baseUrl}/ISteamUser/GetFriendList/v0001/?key=${this.apiKey}&steamid=${steamId}&relationship=friend`;
      console.log('🔍 DEBUG: Steam Friends API URL:', url.replace(this.apiKey, 'REDACTED_API_KEY'));
      
      const response = await fetch(url);
      console.log('🔍 DEBUG: Steam Friends API response status:', response.status);
      
      if (!response.ok) {
        console.log('🔍 DEBUG: Steam Friends API response not ok:', response.status);
        if (response.status === 401) {
          console.log('🔍 DEBUG: 401 Unauthorized - friends list may be private');
        } else if (response.status === 404) {
          console.log('🔍 DEBUG: 404 Not Found - user may not exist');
        }
        return [];
      }
      
      const data = await response.json() as any;
      console.log('🔍 DEBUG: Steam Friends API response data:', JSON.stringify(data, null, 2));
      
      if (data.friendslist?.friends) {
        console.log('🔍 DEBUG: Found friends in response:', data.friendslist.friends.length);
        const friendIds = data.friendslist.friends.map((f: any) => f.steamid);
        console.log('🔍 DEBUG: Friend IDs:', friendIds.slice(0, 5), '...');
        
        const friendsInfo = await this.getUsersInfo(friendIds);
        console.log('🔍 DEBUG: Friends info fetched:', friendsInfo.length);
        
        const mappedFriends = data.friendslist.friends.map((friend: any) => {
          const info = friendsInfo.find(f => f.steamid === friend.steamid);
          return {
            ...friend,
            ...info
          };
        });
        
        console.log('🔍 DEBUG: Mapped friends count:', mappedFriends.length);
        return mappedFriends;
      } else {
        console.log('🔍 DEBUG: No friends found in response or response format unexpected');
        if (data.friendslist) {
          console.log('🔍 DEBUG: Friendslist object keys:', Object.keys(data.friendslist));
        }
        return [];
      }
    } catch (error) {
      console.error('🔍 DEBUG: Error fetching friends list:', error);
      return [];
    }
  }

  private async getUsersInfo(steamIds: string[]): Promise<SteamUser[]> {
    try {
      const idsString = steamIds.join(',');
      const response = await fetch(
        `${this.baseUrl}/ISteamUser/GetPlayerSummaries/v0002/?key=${this.apiKey}&steamids=${idsString}`
      );
      const data = await response.json() as any;
      
      return data.response?.players || [];
    } catch (error) {
      console.error('Error fetching users info:', error);
      return [];
    }
  }

  async getWishlist(steamId: string): Promise<WishlistItem[]> {
    try {
      console.log('🔍 DEBUG: Starting wishlist fetch for Steam ID:', steamId);
      
      // Steam wishlist endpoint - public endpoint, no API key needed
      const wishlistUrl = `${this.storeUrl}/wishlist/profiles/${steamId}/wishlistdata/`;
      console.log('🔍 DEBUG: Wishlist URL:', wishlistUrl);
      
      const response = await fetch(wishlistUrl);
      
      console.log('🔍 DEBUG: Wishlist response status:', response.status);
      console.log('🔍 DEBUG: Wishlist response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.log('🔍 DEBUG: Wishlist response not ok, status:', response.status);
        throw new Error(`Wishlist not accessible: ${response.status}`);
      }
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type');
      console.log('🔍 DEBUG: Content type:', contentType);
      
      const text = await response.text();
      console.log('🔍 DEBUG: Response text length:', text.length);
      console.log('🔍 DEBUG: Response text preview:', text.substring(0, 200) + '...');
      
      // Check for Steam login page or privacy message
      const isLoginPage = text.includes('g_steamID') || text.includes('steamLoginSecure');
      const isPrivacyPage = text.includes('This profile is private') || text.includes('wishlist is private');
      const isErrorPage = text.includes('error') || text.includes('not found');
      
      console.log('🔍 DEBUG: Response analysis:');
      console.log('  - Is login page:', isLoginPage);
      console.log('  - Is privacy page:', isPrivacyPage);
      console.log('  - Is error page:', isErrorPage);
      console.log('  - Content type is JSON:', contentType?.includes('application/json'));
      
      if (!contentType || !contentType.includes('application/json')) {
        console.log('🔍 DEBUG: Content type is not JSON - wishlist likely private');
        
        if (isLoginPage) {
          throw new Error('Steam login required - wishlist is private');
        } else if (isPrivacyPage) {
          throw new Error('This Steam profile wishlist is private');
        } else if (isErrorPage) {
          throw new Error('Steam user not found or wishlist unavailable');
        } else {
          throw new Error('Wishlist is private or user not found');
        }
      }
      
      if (!text.trim()) {
        console.log('🔍 DEBUG: Empty response text');
        throw new Error('Empty wishlist or user not found');
      }
      
      let data: any;
      try {
        data = JSON.parse(text);
        console.log('🔍 DEBUG: Successfully parsed JSON, keys:', Object.keys(data).length);
      } catch (parseError) {
        console.error('🔍 DEBUG: JSON Parse Error:', parseError);
        console.error('🔍 DEBUG: Response text:', text.substring(0, 200) + '...');
        throw new Error('Wishlist is private or user not found');
      }
      
      const wishlistItems: WishlistItem[] = Object.entries(data).map(([appid, gameData]: [string, any]) => ({
        appid: parseInt(appid),
        name: gameData.name,
        header_image: gameData.header_image || '',
        price_overview: gameData.price_overview,
        platforms: gameData.platforms || { windows: false, mac: false, linux: false },
        wishlist_priority: gameData.priority || 0
      }));

      console.log('🔍 DEBUG: Processed wishlist items count:', wishlistItems.length);
      
      // Sort by wishlist priority (Steam's internal ordering)
      return wishlistItems.sort((a, b) => a.wishlist_priority - b.wishlist_priority);
    } catch (error) {
      console.error('🔍 DEBUG: Error in getWishlist:', error);
      throw error;
    }
  }

  async getRegionalPrices(appId: number, regions: string[]): Promise<RegionalPrice[]> {
    const prices: RegionalPrice[] = [];
    
    for (const region of regions) {
      try {
        const response = await fetch(
          `${this.storeUrl}/api/appdetails?appids=${appId}&cc=${region}&filters=price_overview`
        );
        
        if (!response.ok) {
          throw new Error(`Failed to fetch price data: ${response.status}`);
        }
        
        const text = await response.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch (parseError) {
          console.error(`Price parse error for region ${region}:`, parseError);
          throw new Error('Invalid price data format');
        }
        
        if (data[appId]?.success && data[appId]?.data?.price_overview) {
          const priceData = data[appId].data.price_overview;
          prices.push({
            region,
            regionName: this.getRegionName(region),
            currency: priceData.currency,
            price: priceData.final_formatted,
            discount: priceData.discount_percent || 0,
            originalPrice: priceData.discount_percent > 0 ? priceData.initial_formatted : undefined
          });
        } else {
          // Game might be free or not available in this region
          prices.push({
            region,
            regionName: this.getRegionName(region),
            currency: 'N/A',
            price: 'Not Available'
          });
        }
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Error fetching price for region ${region}:`, error);
        prices.push({
          region,
          regionName: this.getRegionName(region),
          currency: 'N/A',
          price: 'Error'
        });
      }
    }
    
    return prices;
  }

  async getWishlistWithPrices(steamId: string, regions: string[]): Promise<WishlistGameWithPrices[]> {
    const wishlist = await this.getWishlist(steamId);
    const gamesWithPrices: WishlistGameWithPrices[] = [];

    for (const game of wishlist) {
      const regionalPrices = await this.getRegionalPrices(game.appid, regions);
      gamesWithPrices.push({
        ...game,
        regionalPrices
      });
    }

    return gamesWithPrices;
  }

  private getRegionName(regionCode: string): string {
    const regionNames: { [key: string]: string } = {
      'US': 'United States',
      'EU': 'European Union',
      'RU': 'Russia',
      'UK': 'United Kingdom',
      'CA': 'Canada',
      'AU': 'Australia',
      'JP': 'Japan',
      'CN': 'China',
      'BR': 'Brazil',
      'IN': 'India'
    };
    return regionNames[regionCode] || regionCode;
  }

  // Extract Steam ID from Steam profile URL or validate Steam ID64
  static extractSteamId(input: string): string | null {
    // Check if it's already a valid Steam ID64 (17 digits starting with 7656119)
    if (/^7656119\d{10}$/.test(input)) {
      return input;
    }

    // Extract from Steam profile URL
    const profileMatch = input.match(/steamcommunity\.com\/profiles\/(\d+)/);
    if (profileMatch && profileMatch[1]) {
      return profileMatch[1];
    }

    // Extract from Steam ID URL (custom URL)
    const idMatch = input.match(/steamcommunity\.com\/id\/([^\/]+)/);
    if (idMatch) {
      // This would need additional API call to resolve custom URL to Steam ID64
      // For now, return null as we need the numeric Steam ID64
      return null;
    }

    return null;
  }
} 