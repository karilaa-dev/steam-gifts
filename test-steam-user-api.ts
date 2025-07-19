#!/usr/bin/env bun

/**
 * Test script for the new steam-user API implementation
 */

import { steamUserAPI } from './src/server/steam-user-api';

async function testSteamUserAPI() {
  console.log('🧪 Testing Steam User API Implementation...');
  
  // Test with a well-known public app ID (Portal 2)
  const testAppId = 620;
  
  console.log(`\n🔍 Testing game details for app ${testAppId}...`);
  try {
    const gameDetails = await steamUserAPI.getGameDetails(testAppId);
    if (gameDetails) {
      console.log('✅ Game details:', {
        name: gameDetails.name,
        header_image: gameDetails.header_image?.substring(0, 50) + '...',
        platforms: gameDetails.platforms
      });
    } else {
      console.log('⚠️ Game details not found');
    }
  } catch (error) {
    console.log('❌ Game details error:', error);
  }

  console.log(`\n🔍 Testing regional prices for app ${testAppId}...`);
  try {
    const regionalPrices = await steamUserAPI.getRegionalPrices(testAppId);
    console.log('✅ Regional prices:', regionalPrices);
  } catch (error) {
    console.log('❌ Regional prices error:', error);
  }

  console.log('\n🎯 Testing wishlist functionality...');
  try {
    // Test with a public Steam ID (Valve's Gabe Newell)
    const testSteamId = '76561197960265731';
    
    console.log(`\n📋 Testing enhanced wishlist for Steam ID: ${testSteamId}`);
    const wishlist = await steamUserAPI.getWishlistWithPrices(testSteamId);
    
    console.log(`✅ Successfully processed ${wishlist.length} games with regional pricing`);
    
    if (wishlist.length > 0) {
      const firstGame = wishlist[0];
      console.log('\n🎮 Sample game:', {
        name: firstGame?.name,
        appid: firstGame?.appid,
        regionalPrices: firstGame?.regionalPrices
      });
    }
    
  } catch (error) {
    console.log('❌ Wishlist test error:', error);
  }

  // Close the connection
  await steamUserAPI.close();
  
  console.log('\n🧪 Test Complete!');
}

// Run the test
testSteamUserAPI().catch(console.error);