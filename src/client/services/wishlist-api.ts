import type { WishlistResponse } from '../../types/steam';

export class WishlistApiClient {
  private baseUrl = '/api';

  /**
   * Fetches a user's wishlist with enhanced game details and regional pricing
   */
  async getWishlist(steamId: string): Promise<WishlistResponse> {
    const response = await fetch(`${this.baseUrl}/wishlist/${steamId}`, {
      credentials: 'include',
      headers: {
        'Accept': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to fetch wishlist' }));
      throw new Error(errorData.error || `API error: ${response.status}`);
    }

    return response.json();
  }
}

export const wishlistApiClient = new WishlistApiClient();