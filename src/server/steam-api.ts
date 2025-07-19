import fetch from 'node-fetch';
import type { RequestInit } from 'node-fetch';
import type { SteamFriend, SteamUser, WishlistItem, RegionalPrice, WishlistGameWithPrices } from '../types/steam.ts';

interface GameDetails {
  appid: number;
  name: string;
  header_image: string;
  short_description: string;
  platforms: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  price_overview?: {
    currency: string;
    initial: number;
    final: number;
    discount_percent: number;
    initial_formatted: string;
    final_formatted: string;
  };
}

interface RegionalPriceData {
  currency: string;
  initial: number;
  final: number;
  discount_percent: number;
  initial_formatted: string;
  final_formatted: string;
}

export class SteamAPI {
  private apiKey: string;
  private baseUrl = 'https://api.steampowered.com';
  private storeUrl = 'https://store.steampowered.com';
  private gameDetailsCache = new Map<number, GameDetails>();
  private regionalPriceCache = new Map<string, RegionalPrice>();

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
          
          // Enhance with game details and regional pricing
          const enhancedItems = await Promise.all(
            items.map(async (item: any) => {
              const gameDetails = await this.getGameDetails(item.appid);
              return {
                appid: item.appid,
                name: gameDetails?.name || `App ${item.appid}`,
                header_image: gameDetails?.header_image || '',
                price_overview: gameDetails?.price_overview || null,
                platforms: gameDetails?.platforms || { windows: false, mac: false, linux: false },
                wishlist_priority: item.priority || 0
              };
            })
          );
          
          return enhancedItems.sort((a, b) => a.wishlist_priority - b.wishlist_priority);
        }
      }
      
      // Fallback to authenticated approach
      return this.getWishlistFromSteamCommunity(steamId);
      
    } catch (error) {
      console.error('🔍 DEBUG: Error in getWishlist:', error);
      throw error;
    }
  }

  async getGameDetails(appid: number): Promise<GameDetails | null> {
    try {
      // Check cache first
      if (this.gameDetailsCache.has(appid)) {
        return this.gameDetailsCache.get(appid)!;
      }

      const url = `${this.storeUrl}/api/appdetails?appids=${appid}&l=english`;
      console.log('🔍 DEBUG: Fetching game details for appid:', appid);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Steam-Gifts-App/1.0'
        }
      });

      if (!response.ok) {
        console.log('🔍 DEBUG: Game details API response not ok:', response.status);
        return null;
      }

      const data = await response.json() as any;
      
      if (data[appid.toString()]?.success) {
        const gameData = data[appid.toString()].data;
        const gameDetails: GameDetails = {
          appid,
          name: gameData.name || `App ${appid}`,
          header_image: gameData.header_image || '',
          short_description: gameData.short_description || '',
          platforms: {
            windows: gameData.platforms?.windows || false,
            mac: gameData.platforms?.mac || false,
            linux: gameData.platforms?.linux || false
          },
          price_overview: gameData.price_overview || undefined
        };
        
        // Cache for 1 hour
        this.gameDetailsCache.set(appid, gameDetails);
        return gameDetails;
      }
      
      return null;
    } catch (error) {
      console.error('🔍 DEBUG: Error fetching game details:', error);
      return null;
    }
  }

  async getRegionalPrices(appid: number): Promise<RegionalPrice[]> {
    const regions = [
      { code: 'US', name: 'United States', currency: 'USD' },
      { code: 'RU', name: 'Russia', currency: 'RUB' },
      { code: 'UA', name: 'Ukraine', currency: 'UAH' }
    ];

    try {
      const regionalPrices: RegionalPrice[] = [];

      for (const region of regions) {
        const cacheKey = `${appid}-${region.code}`;
        
        // Check cache first
        if (this.regionalPriceCache.has(cacheKey)) {
          regionalPrices.push(this.regionalPriceCache.get(cacheKey)!);
          continue;
        }

        const url = `${this.storeUrl}/api/appdetails?appids=${appid}&cc=${region.code}&l=english`;
        
        const response = await fetch(url, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Steam-Gifts-App/1.0'
          }
        });

        if (response.ok) {
          const data = await response.json() as any;
          
          if (data[appid.toString()]?.success) {
            const gameData = data[appid.toString()].data;
            const priceData = gameData.price_overview;
            
            if (priceData) {
              const regionalPrice: RegionalPrice = {
                region: region.code,
                regionName: region.name,
                currency: region.currency,
                price: priceData.final_formatted,
                discount: priceData.discount_percent > 0 ? priceData.discount_percent : undefined,
                originalPrice: priceData.discount_percent > 0 ? priceData.initial_formatted : undefined
              };
              
              regionalPrices.push(regionalPrice);
              this.regionalPriceCache.set(cacheKey, regionalPrice);
            }
          }
        }
      }

      return regionalPrices;
    } catch (error) {
      console.error('🔍 DEBUG: Error fetching regional prices:', error);
      return [];
    }
  }

  async getWishlistWithPrices(steamId: string): Promise<WishlistGameWithPrices[]> {
    try {
      const wishlist = await this.getWishlist(steamId);
      
      const enhancedWishlist = await Promise.all(
        wishlist.map(async (game) => {
          const regionalPrices = await this.getRegionalPrices(game.appid);
          return {
            ...game,
            regionalPrices
          };
        })
      );
      
      return enhancedWishlist;
    } catch (error) {
      console.error('🔍 DEBUG: Error getting wishlist with prices:', error);
      throw error;
    }
  }

  private async getWishlistFromSteamCommunity(steamId: string): Promise<WishlistItem[]> {
    try {
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

  async getFriendsList(steamId: string): Promise<SteamFriend[]> {
    try {
      console.log('🔍 DEBUG: Starting getFriendsList for Steam ID:', steamId);
      
      const url = `${this.baseUrl}/ISteamUser/GetFriendList/v0001/?key=${this.apiKey}&steamid=${steamId}&relationship=friend`;
      console.log('🔍 DEBUG: Steam Friends API URL:', url.replace(this.apiKey, 'REDACTED_API_KEY'));
      
      const response = await fetch(url);
      console.log('🔍 DEBUG: Steam Friends API response status:', response.status);
      
      if (!response.ok) {
        console.log('🔍 DEBUG: Steam Friends API response not ok:', response.status);
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
        console.log('🔍 DEBUG: No friends found in response');
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

  async getProxiedWishlist(steamId: string, cookie: string): Promise<any> {
    try {
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
      console.error('🔍 DEBUG: Error fetching authenticated wishlist:', error);
      throw error;
    }
  }

  async processAuthenticatedWishlist(rawData: any): Promise<WishlistItem[]> {
    try {
      const items = rawData.response?.items || [];
      
      // Enhance with game details and regional pricing
      const enhancedItems = await Promise.all(
        items.map(async (item: any) => {
          const gameDetails = await this.getGameDetails(item.appid);
          return {
            appid: item.appid,
            name: gameDetails?.name || item.name || `App ${item.appid}`,
            header_image: gameDetails?.header_image || item.header_image || '',
            price_overview: gameDetails?.price_overview || item.price_overview || null,
            platforms: gameDetails?.platforms || item.platforms || { windows: false, mac: false, linux: false },
            wishlist_priority: item.priority || item.display_order || 0
          };
        })
      );
      
      return enhancedItems.sort((a, b) => a.wishlist_priority - b.wishlist_priority);
    } catch (error) {
      console.error('🔍 DEBUG: Error processing authenticated wishlist:', error);
      throw error;
    }
  }

  async processAuthenticatedWishlistWithPrices(rawData: any): Promise<WishlistGameWithPrices[]> {
    try {
      const items = rawData.response?.items || [];
      
      const enhancedItems = await Promise.all(
        items.map(async (item: any) => {
          const gameDetails = await this.getGameDetails(item.appid);
          const regionalPrices = await this.getRegionalPrices(item.appid);
          
          return {
            appid: item.appid,
            name: gameDetails?.name || item.name || `App ${item.appid}`,
            header_image: gameDetails?.header_image || item.header_image || '',
            price_overview: gameDetails?.price_overview || item.price_overview || null,
            platforms: gameDetails?.platforms || item.platforms || { windows: false, mac: false, linux: false },
            wishlist_priority: item.priority || item.display_order || 0,
            regionalPrices
          };
        })
      );
      
      return enhancedItems.sort((a, b) => a.wishlist_priority - b.wishlist_priority);
    } catch (error) {
      console.error('🔍 DEBUG: Error processing authenticated wishlist with prices:', error);
      throw error;
    }
  }
}