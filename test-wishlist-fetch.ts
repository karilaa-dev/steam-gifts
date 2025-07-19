#!/usr/bin/env bun

/**
 * Test script to verify wishlist fetching works correctly
 */

import { steamUserAPI } from './src/server/steam-user-api';

async function testWishlistFetching() {
  console.log('🧪 Testing wishlist fetching...');
  
  // Test with a known public Steam ID (Gabe Newell)
  const testSteamId = '76561197960265731';
  
  try {
    console.log(`📋 Testing wishlist for Steam ID: ${testSteamId}`);
    
    const wishlist = await steamUserAPI.getWishlistWithPrices(testSteamId);
    
    console.log(`✅ Successfully fetched ${wishlist.length} games`);
    
    if (wishlist.length > 0) {
      console.log('\n🎮 Sample games:');
      wishlist.slice(0, 3).forEach(game => {
        console.log(`  - ${game.name} (${game.appid})`);
        console.log(`    Header: ${game.header_image.substring(0, 50)}...`);
        console.log(`    Platforms: ${Object.keys(game.platforms).filter(p => game.platforms[p as keyof typeof game.platforms]).join(', ')}`);
        console.log(`    Regional prices: ${game.regionalPrices.length} regions`);
      });
    } else {
      console.log('ℹ️ Wishlist is empty or not accessible');
    }
    
  } catch (error) {
    console.error('❌ Wishlist fetch error:', error);
  }
}

// Run the test
testWishlistFetching().catch(console.error);