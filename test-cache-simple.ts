// Simple cache test for Node.js
import { wishlistCache } from './src/client/services/wishlist-cache';

// Mock data
const testSteamId = '76561198159738731';
const testWishlist = {
  steamId: testSteamId,
  games: [
    {
      appid: 12345,
      name: 'Test Game',
      header_image: 'test.jpg',
      price_overview: { 
        currency: 'USD', 
        initial: 1999, 
        final: 1999, 
        discount_percent: 0,
        initial_formatted: '$19.99',
        final_formatted: '$19.99'
      },
      platforms: { windows: true, mac: false, linux: false },
      regionalPrices: [{ region: 'US', currency: 'USD', price: '$19.99', regionName: 'United States' }]
    }
  ]
};

console.log('=== WISHLIST CACHE TEST ===');

// Test 1: Clear cache
console.log('\n1. Clearing cache...');
wishlistCache.clear();

// Test 2: Check cache stats
console.log('\n2. Initial stats:', wishlistCache.getStats());

// Test 3: Set cache
console.log('\n3. Setting cache...');
wishlistCache.set(testSteamId, testWishlist);

// Test 4: Get cache
console.log('\n4. Getting cache...');
const cached = wishlistCache.get(testSteamId);
console.log('Cache retrieved:', cached ? 'SUCCESS' : 'FAILED');
if (cached) {
  console.log(`Games: ${cached.games.length}`);
}

// Test 5: Check cache stats again
console.log('\n5. Final stats:', wishlistCache.getStats());

console.log('\n=== TEST COMPLETE ===');