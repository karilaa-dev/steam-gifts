export const config = {
  // Get your Steam Web API key from: https://steamcommunity.com/dev/apikey
  steamApiKey: 'your_steam_api_key_here',
  
  // Steam OpenID configuration
  steamOpenIdRealm: 'http://localhost:3000',
  steamOpenIdReturnUrl: 'http://localhost:3000/auth/steam/return',
  
  // Server configuration
  port: 3000,
  
  // Supported regions for price comparison (Steam store country codes)
  priceRegions: ['US', 'EU', 'RU'],
  
  // Regional price display names
  regionNames: {
    'US': 'United States',
    'EU': 'European Union', 
    'RU': 'Russia'
  }
};

// Copy this file to config.ts and update with your actual Steam API key 