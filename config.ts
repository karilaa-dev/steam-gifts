export const config = {
  // Get your Steam Web API key from: https://steamcommunity.com/dev/apikey
  steamApiKey: process.env.STEAM_API_KEY || '575197A7E8050D465B893EB74F1B08A6',
  
  // Steam OpenID configuration
  steamOpenIdRealm: 'http://localhost:3000',
  steamOpenIdReturnUrl: 'http://localhost:3000/auth/steam/return',
  
  // JWT secret for session management
  jwtSecret: process.env.JWT_SECRET || 'your-jwt-secret-key-change-this-in-production',
  
  // Server configuration
  port: parseInt(process.env.PORT || '3000'),
  
  // Supported regions for price comparison (Steam store country codes)
  priceRegions: ['US', 'EU', 'RU'],
  
  // Regional price display names
  regionNames: {
    'US': 'United States',
    'EU': 'European Union',
    'RU': 'Russia'
  }
};