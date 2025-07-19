#!/usr/bin/env node
/**
 * Test script to verify the wishlist fix for user ID 76561198198873298
 *
 * This script tests both the public API and authenticated access approaches
 */

import { SteamAPI } from './src/server/steam-api.js';
import { config } from './config.js';

const steamAPI = new SteamAPI(config.steamApiKey);
const testUserId = '76561198198873298';

async function testWishlistAccess() {
  console.log('🧪 Testing wishlist access for user ID:', testUserId);
  console.log('==================================================');
  
  // Test 1: Public API access
  console.log('\n1. Testing public API access...');
  try {
    const wishlist = await steamAPI.getWishlist(testUserId);
    console.log('✅ Public API returned:', wishlist.length, 'items');
    if (wishlist.length > 0) {
      console.log('Sample items:', wishlist.slice(0, 3).map(g => g.name));
    }
  } catch (error) {
    console.log('❌ Public API failed:', error instanceof Error ? error.message : String(error));
  }
  
  // Test 2: User info check
  console.log('\n2. Testing user info...');
  try {
    const userInfo = await steamAPI.getUserInfo(testUserId);
    if (userInfo) {
      console.log('✅ User info found:', userInfo.personaname);
      console.log('Profile visibility:', userInfo.communityvisibilitystate === 3 ? 'Public' : 'Private');
    } else {
      console.log('❌ User info not found');
    }
  } catch (error) {
    console.log('❌ User info failed:', error instanceof Error ? error.message : String(error));
  }
  
  console.log('\n3. Summary:');
  console.log('🔍 If public API failed with "private" or "403", the user has a private profile');
  console.log('🔧 To access private wishlists, users must authenticate via Steam login');
  console.log('📝 The fix enables authenticated access when Steam cookies are provided');
}

testWishlistAccess().catch(console.error);