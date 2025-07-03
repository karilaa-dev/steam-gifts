export const config = {
  // Get your Steam Web API key from: https://steamcommunity.com/dev/apikey
  steamApiKey: process.env.STEAM_API_KEY || 'D2587496EEA69EDC92994EC11D86A11D',
  
  // Steam OpenID configuration
  steamOpenIdRealm: 'http://localhost:5173',
  steamOpenIdReturnUrl: 'http://localhost:5173/api/auth/steam/return',
  
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