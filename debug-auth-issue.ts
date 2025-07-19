#!/usr/bin/env node
/**
 * Debug script to identify why Steam authentication isn't working for friends' wishlists
 * This will test the direct Steam access and identify specific issues
 */

import { steamDirectClient } from './src/client/services/steam-direct.js';

const testUserId = '76561198198873298';

async function debugAuthentication() {
  console.log('🔍 Debugging Steam authentication for friends wishlist access');
  console.log('============================================================');
  
  // Test 1: Check if user has Steam auth
  console.log('\n1. Checking Steam authentication...');
  try {
    const hasAuth = await steamDirectClient.hasSteamAuth();
    console.log('✅ Has Steam auth:', hasAuth);
    
    if (!hasAuth) {
      console.log('❌ User needs to log into Steam in this browser');
      return;
    }
  } catch (error) {
    console.log('❌ Error checking Steam auth:', error);
    return;
  }
  
  // Test 2: Try to access the wishlist directly
  console.log('\n2. Testing direct wishlist access...');
  try {
    const wishlist = await steamDirectClient.getWishlist(testUserId);
    console.log('✅ Wishlist loaded:', wishlist.length, 'items');
    
    if (wishlist.length > 0) {
      console.log('Sample games:', wishlist.slice(0, 3).map(g => g.name));
    }
  } catch (error) {
    console.log('❌ Error accessing wishlist:', error.message);
    
    if (error.message.includes('private')) {
      console.log('🔍 This suggests the wishlist is private or Steam login is required');
    } else if (error.message.includes('Steam login required')) {
      console.log('🔍 User needs to be logged into Steam');
    } else {
      console.log('🔍 Other error occurred:', error);
    }
  }
  
  // Test 3: Check user info
  console.log('\n3. Testing user info access...');
  try {
    const userInfo = await steamDirectClient.getUserInfo(testUserId);
    if (userInfo) {
      console.log('✅ User info:', userInfo.personaname);
      console.log('Profile URL:', userInfo.profileurl);
    } else {
      console.log('❌ User info not available');
    }
  } catch (error) {
    console.log('❌ User info error:', error);
  }
  
  console.log('\n4. Recommendations:');
  console.log('• Ensure you are logged into Steam in this browser');
  console.log('• Check browser dev tools for Steam cookies');
  console.log('• Try accessing the direct URL in browser:');
  console.log(`  https://store.steampowered.com/wishlist/profiles/${testUserId}/wishlistdata/`);
}

debugAuthentication().catch(console.error);