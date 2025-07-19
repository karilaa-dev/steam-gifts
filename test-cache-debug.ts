// Cache debugging test script
import { wishlistCache } from './src/client/services/wishlist-cache';
import { bunGameCache } from './src/client/services/bun-cache';
import type { WishlistResponse } from './src/types/steam';

// Test data
const testSteamId = '76561198159738731';
const testWishlist: WishlistResponse = {
  steamId: testSteamId,
  games: [
    {
      appid: 12345,
      name: 'Test Game 1',
      header_image: 'https://example.com/test1.jpg',
      price_overview: { final_formatted: '$19.99', discount_percent: 0 },
      platforms: { windows: true, mac: false, linux: false },
      regionalPrices: [{ regionName: 'US', price: '$19.99' }]
    },
    {
      appid: 67890,
      name: 'Test Game 2',
      header_image: 'https://example.com/test2.jpg',
      price_overview: { final_formatted: '$29.99', discount_percent: 50 },
      platforms: { windows: true, mac: true, linux: false },
      regionalPrices: [{ regionName: 'US', price: '$29.99' }]
    }
  ]
};

console.log('=== CACHE DEBUGGING TEST ===');

// Test 1: Cache clearing
console.log('\n1. Clearing cache...');
wishlistCache.clear();
bunGameCache.clear();

// Test 2: Setting cache
console.log('\n2. Setting cache...');
wishlistCache.set(testSteamId, testWishlist);
console.log(`Set wishlist cache for ${testSteamId}: ${testWishlist.games.length} games`);

// Test 3: Checking cache
console.log('\n3. Checking cache...');
const cached = wishlistCache.get(testSteamId);
if (cached) {
  console.log('✅ Cache retrieved successfully:', {
    steamId: cached.steamId,
    gameCount: cached.games?.length || 0,
    firstGame: cached.games?.[0]?.name
  });
} else {
  console.log('❌ Cache retrieval failed');
}

// Test 4: Cache statistics
console.log('\n4. Cache statistics:');
console.log('Wishlist cache:', wishlistCache.getStats());
console.log('Game cache:', bunGameCache.getStats());

// Test 5: Cache contents
console.log('\n5. Cache contents:');
const contents = (wishlistCache as any).getCacheContents?.() || [];
console.log('Wishlist cache contents:', contents);

console.log('\n=== TEST COMPLETE ===');

// Helper function to run in browser console
console.log(`
To test cache in browser:
1. Open browser console
2. Run: debugWishlistCache()
3. Or run: wishlistCache.get("76561198159738731")
`);