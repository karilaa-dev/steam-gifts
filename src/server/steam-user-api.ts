import { config } from '../../config';
import type { SteamGame, WishlistGameWithPrices, RegionalPrice } from '../types/steam';

export class SteamUserAPI {
  private steamApiUrl = 'https://api.steampowered.com';
  private storeUrl = 'https://store.steampowered.com';
  private readonly CONCURRENCY_LIMIT = 10; // Limit concurrent requests to prevent rate limiting

  /**
   * Get game details from Steam Store API
   */
  async getGameDetails(appId: number): Promise<SteamGame | null> {
    try {
      const response = await fetch(`${this.storeUrl}/api/appdetails?appids=${appId}&l=english`);
      
      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      const gameData = data[appId.toString()];
      
      if (!gameData || !gameData.success) {
        return null;
      }

      const game = gameData.data;
      
      return {
        appid: appId,
        name: game.name || `App ${appId}`,
        header_image: game.header_image || '',
        short_description: game.short_description || '',
        platforms: {
          windows: game.platforms?.windows || false,
          mac: game.platforms?.mac || false,
          linux: game.platforms?.linux || false
        }
      };
    } catch (error) {
      console.error('Error fetching game details:', error);
      return null;
    }
  }

  /**
   * Get game details with regional pricing for a single game
   */
  async getGameDetailsWithPrices(appId: number, steamId?: string): Promise<WishlistGameWithPrices | null> {
    try {
      const [gameDetails, regionalPrices] = await Promise.all([
        this.getGameDetails(appId),
        this.getRegionalPrices(appId)
      ]);

      if (!gameDetails) {
        return null;
      }

      return {
        appid: appId,
        name: gameDetails.name,
        header_image: gameDetails.header_image || '',
        platforms: gameDetails.platforms || { windows: true, mac: false, linux: false },
        wishlist_priority: 0,
        price_overview: undefined,
        regionalPrices
      };
    } catch (error) {
      console.error('Error fetching game details with prices:', error);
      return null;
    }
  }

  /**
   * Get regional prices for a game
   */
  async getRegionalPrices(appId: number): Promise<RegionalPrice[]> {
    const regions = [
      { region: 'US', regionName: 'United States', currency: 'USD' },
      { region: 'RU', regionName: 'Russia', currency: 'RUB' },
      { region: 'UA', regionName: 'Ukraine', currency: 'UAH' }
    ];

    const prices: RegionalPrice[] = [];

    for (const region of regions) {
      try {
        const response = await fetch(`${this.storeUrl}/api/appdetails?appids=${appId}&cc=${region.currency}&l=english`);
        
        if (!response.ok) {
          prices.push({
            region: region.region,
            regionName: region.regionName,
            currency: region.currency,
            price: 'Unavailable'
          });
          continue;
        }

        const data = await response.json();
        const gameData = data[appId.toString()];
        
        if (!gameData || !gameData.success) {
          prices.push({
            region: region.region,
            regionName: region.regionName,
            currency: region.currency,
            price: 'Unavailable'
          });
          continue;
        }

        const priceInfo = gameData.data.price_overview;
        if (priceInfo) {
          const discountPercent = priceInfo.discount_percent || 0;
          const originalPrice = (priceInfo.initial || 0) / 100;
          const finalPrice = (priceInfo.final || 0) / 100;
          
          // Always use the requested region's currency, even if Steam returns USD
          const formattedPrice = this.formatPrice(finalPrice, region.currency);
          
          prices.push({
            region: region.region,
            regionName: region.regionName,
            currency: region.currency,
            price: formattedPrice,
            discount: discountPercent > 0 ? discountPercent : undefined,
            originalPrice: discountPercent > 0 ? this.formatPrice(originalPrice, region.currency) : undefined
          });
        } else {
          prices.push({
            region: region.region,
            regionName: region.regionName,
            currency: region.currency,
            price: 'Free'
          });
        }
      } catch (error) {
        console.error(`Error fetching price for ${region.region}:`, error);
        prices.push({
          region: region.region,
          regionName: region.regionName,
          currency: region.currency,
          price: 'Error'
        });
      }
    }

    return prices;
  }

  /**
   * Batch fetch game details for multiple games
   */
  async getGameDetailsBatch(appIds: number[]): Promise<(SteamGame | null)[]> {
    const startTime = Date.now();
    console.log(`🚀 Fetching game details for ${appIds.length} games...`);
    
    // Process in batches to avoid overwhelming the API
    const batches = this.createBatches(appIds, this.CONCURRENCY_LIMIT);
    const results: (SteamGame | null)[] = [];
    
    for (const batch of batches) {
      const batchPromises = batch.map(appId => this.getGameDetails(appId));
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Handle results and errors
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Failed to fetch game details for ${batch[index]}:`, result.reason);
          results.push(null);
        }
      });
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Game details fetched in ${duration}ms`);
    
    return results;
  }

  /**
   * Batch fetch regional prices for multiple games
   */
  async getRegionalPricesBatch(appIds: number[]): Promise<RegionalPrice[][]> {
    const startTime = Date.now();
    console.log(`🚀 Fetching regional prices for ${appIds.length} games...`);
    
    // Process in batches to avoid overwhelming the API
    const batches = this.createBatches(appIds, this.CONCURRENCY_LIMIT);
    const results: RegionalPrice[][] = [];
    
    for (const batch of batches) {
      const batchPromises = batch.map(appId => this.getRegionalPrices(appId));
      const batchResults = await Promise.allSettled(batchPromises);
      
      // Handle results and errors
      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          console.error(`Failed to fetch regional prices for ${batch[index]}:`, result.reason);
          // Return empty regional prices array for failed requests
          results.push([
            { region: 'US', regionName: 'United States', currency: 'USD', price: 'Error' },
            { region: 'RU', regionName: 'Russia', currency: 'RUB', price: 'Error' },
            { region: 'UA', regionName: 'Ukraine', currency: 'UAH', price: 'Error' }
          ]);
        }
      });
    }
    
    const duration = Date.now() - startTime;
    console.log(`✅ Regional prices fetched in ${duration}ms`);
    
    return results;
  }

  /**
   * Create batches from an array
   */
  private createBatches<T>(array: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < array.length; i += batchSize) {
      batches.push(array.slice(i, i + batchSize));
    }
    return batches;
  }

  private formatPrice(price: number, currency: string): string {
    switch (currency) {
      case 'USD':
        return `$${price.toFixed(2)}`;
      case 'RUB':
        return `${price.toFixed(0)}₽`;
      case 'UAH':
        return `${price.toFixed(0)}₴`;
      default:
        return `${price.toFixed(2)} ${currency}`;
    }
  }

  /**
   * Get wishlist with enhanced game details and regional pricing (optimized with async batch processing)
   */
  async getWishlistWithPrices(steamId: string): Promise<WishlistGameWithPrices[]> {
    const startTime = Date.now();
    console.log(`🚀 DEBUG: Starting optimized wishlist fetch for Steam ID: ${steamId}`);
    
    try {
      // Try the new Steam API endpoint
      const apiResponse = await fetch(`${this.steamApiUrl}/IWishlistService/GetWishlist/v1/?steamid=${steamId}`, {
        headers: {
          'User-Agent': 'Steam Wishlist App',
          'Accept': 'application/json'
        }
      });
      
      if (apiResponse.ok) {
        const apiData = await apiResponse.json();
        const items = apiData.response?.items || [];
        
        if (items.length === 0) {
          console.log('✅ DEBUG: Empty wishlist');
          return [];
        }
        
        console.log(`📊 DEBUG: Found ${items.length} games in wishlist`);
        
        // Extract app IDs for batch processing
        const appIds = items.map((item: any) => item.appid);
        
        // Batch fetch game details and regional prices in parallel
        const [gameDetailsList, regionalPricesList] = await Promise.all([
          this.getGameDetailsBatch(appIds),
          this.getRegionalPricesBatch(appIds)
        ]);
        
        // Combine the results
        const wishlist: WishlistGameWithPrices[] = items.map((item: any, index: number) => {
          const gameDetails = gameDetailsList[index];
          const regionalPrices = regionalPricesList[index];
          
          return {
            appid: item.appid,
            name: gameDetails?.name || item.name || `App ${item.appid}`,
            header_image: gameDetails?.header_image || '',
            platforms: gameDetails?.platforms || { windows: true, mac: false, linux: false },
            wishlist_priority: item.priority || 0,
            price_overview: item.discounted_price || item.original_price,
            regionalPrices
          };
        });
        
        const duration = Date.now() - startTime;
        console.log(`✅ DEBUG: Optimized wishlist fetch completed in ${duration}ms`);
        
        return wishlist.sort((a, b) => a.wishlist_priority - b.wishlist_priority);
      }

      console.log('❌ DEBUG: Steam API endpoint failed, returning empty array');
      return [];
    } catch (error) {
      console.error('Error fetching wishlist:', error);
      return [];
    }
  }
}