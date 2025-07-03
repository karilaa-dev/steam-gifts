import { config } from '../../config.ts';
import { SteamAPI } from './steam-api.ts';
import { SteamAuth } from './auth.ts';
import type { WishlistResponse } from '../types/steam.ts';

console.log('🔍 DEBUG: Starting Steam Wishlist Review Server...');
console.log(`🔍 DEBUG: Server will run on http://localhost:${config.port}`);

if (config.steamApiKey === 'your_steam_api_key_here') {
  console.warn('⚠️  Warning: Please set your Steam API key in config.ts');
  console.warn('   Get your API key from: https://steamcommunity.com/dev/apikey');
}

// Initialize Steam API and Auth
const steamAPI = new SteamAPI(config.steamApiKey);
const steamAuth = new SteamAuth();

// Serve static HTML file
async function serveHTML() {
  const html = await Bun.file('./index.html').text();
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

export default Bun.serve({
  port: config.port,
  
  async fetch(req) {
    const url = new URL(req.url);
    const pathname = url.pathname;
    
    // Add CORS headers to all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Serve main HTML file
      if (pathname === '/') {
        return await serveHTML();
      }
      
      // API Routes
      if (pathname === '/api/health') {
        return new Response(JSON.stringify({
          status: 'ok',
          timestamp: new Date().toISOString()
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Authentication Routes
      if (pathname === '/api/auth/steam') {
        try {
          const authUrl = await steamAuth.getAuthUrl();
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': authUrl
            }
          });
        } catch (error) {
          console.error('Error generating Steam auth URL:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to generate authentication URL' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      if (pathname === '/api/auth/steam/return') {
        try {
          const steamId = await steamAuth.verifyAssertion(req.url);
          
          if (!steamId) {
            return new Response(null, {
              status: 302,
              headers: {
                ...corsHeaders,
                'Location': '/?error=auth_failed'
              }
            });
          }
          
          // Get user info from Steam API
          const user = await steamAPI.getUserInfo(steamId);
          if (!user) {
            return new Response(null, {
              status: 302,
              headers: {
                ...corsHeaders,
                'Location': '/?error=user_not_found'
              }
            });
          }
          
          // Generate JWT token
          const token = steamAuth.generateToken(user);
          
          // Set cookie and redirect to main page
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Set-Cookie': `auth=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`,
              'Location': '/'
            }
          });
        } catch (error) {
          console.error('Error during Steam auth callback:', error);
          return new Response(null, {
            status: 302,
            headers: {
              ...corsHeaders,
              'Location': '/?error=auth_error'
            }
          });
        }
      }
      
      if (pathname === '/api/auth/logout') {
        return new Response(JSON.stringify({ success: true }), {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
            'Set-Cookie': 'auth=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax'
          }
        });
      }
      
      if (pathname === '/api/me') {
        const user = steamAuth.getAuthenticatedUser(req);
        if (!user) {
          return new Response(
            JSON.stringify({ error: 'Not authenticated' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        return new Response(JSON.stringify(user), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Get user info
      const userMatch = pathname.match(/^\/api\/user\/(.+)$/);
      if (userMatch && userMatch[1]) {
        const steamId = userMatch[1];
        
        try {
          const user = await steamAPI.getUserInfo(steamId);
          if (!user) {
            return new Response(
              JSON.stringify({ error: 'User not found' }), 
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          return new Response(JSON.stringify(user), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Error fetching user:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch user information' }), 
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Get friends list (authenticated users only)
      if (pathname === '/api/friends') {
        const user = steamAuth.getAuthenticatedUser(req);
        if (!user) {
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        
        try {
          const friends = await steamAPI.getFriendsList(user.steamid);
          return new Response(JSON.stringify(friends), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Error fetching friends:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to fetch friends list' }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Get wishlist
      const wishlistMatch = pathname.match(/^\/api\/wishlist\/(.+)$/);
      if (wishlistMatch && wishlistMatch[1]) {
        const steamId = wishlistMatch[1];
        const regions = url.searchParams.get('regions') || config.priceRegions.join(',');
        
        console.log('🔍 DEBUG: Wishlist request received');
        console.log('🔍 DEBUG: Steam ID:', steamId);
        console.log('🔍 DEBUG: Regions:', regions);
        console.log('🔍 DEBUG: Request URL:', req.url);
        console.log('🔍 DEBUG: Server port:', config.port);
        
        try {
          const regionsArray = regions.split(',').map((r: string) => r.trim().toUpperCase());
          
          console.log('🔍 DEBUG: Starting parallel requests for user info and wishlist');
          
          // Get user info and wishlist in parallel
          const [user, games] = await Promise.all([
            steamAPI.getUserInfo(steamId),
            steamAPI.getWishlistWithPrices(steamId, regionsArray)
          ]);

          console.log('🔍 DEBUG: User info result:', user ? 'Found' : 'Not found');
          console.log('🔍 DEBUG: Games count:', games.length);

          if (!user) {
            console.log('🔍 DEBUG: Returning 404 - User not found');
            return new Response(
              JSON.stringify({ error: 'User not found' }),
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const response: WishlistResponse = {
            user,
            games,
            totalCount: games.length
          };

          console.log('🔍 DEBUG: Returning successful response');
          return new Response(JSON.stringify(response), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('🔍 DEBUG: Error in wishlist endpoint:', error);
          console.error('🔍 DEBUG: Error type:', error instanceof Error ? error.constructor.name : typeof error);
          console.error('🔍 DEBUG: Error message:', error instanceof Error ? error.message : String(error));
          console.error('🔍 DEBUG: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
          
          if (error instanceof Error && (error.message.includes('not accessible') || error.message.includes('private') || error.message.includes('not found'))) {
            console.log('🔍 DEBUG: Returning 403 - Wishlist not accessible');
            console.log('🔍 DEBUG: Specific error message:', error.message);
            
            let userMessage = 'Wishlist is private or user not found. Please make your Steam wishlist public to use this feature.';
            
            if (error.message.includes('login required')) {
              userMessage = 'Steam login required - this user\'s wishlist is private. Please make your Steam wishlist public to use this feature.';
            } else if (error.message.includes('profile wishlist is private')) {
              userMessage = 'This Steam profile\'s wishlist is private. Please make your Steam wishlist public to use this feature.';
            } else if (error.message.includes('user not found')) {
              userMessage = 'Steam user not found or wishlist unavailable. Please check the Steam ID and try again.';
            }
            
            return new Response(
              JSON.stringify({ error: userMessage }),
              { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }
          console.log('🔍 DEBUG: Returning 500 - Internal server error');
          return new Response(
            JSON.stringify({ error: 'Failed to fetch wishlist', details: error instanceof Error ? error.message : String(error) }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Validate Steam ID
      if (pathname === '/api/validate-steam-id' && req.method === 'POST') {
        try {
          const { input } = await req.json() as { input: string };
          
          if (!input) {
            return new Response(
              JSON.stringify({ error: 'Input is required' }), 
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          const steamId = SteamAPI.extractSteamId(input);
          
          if (!steamId) {
            return new Response(
              JSON.stringify({ error: 'Invalid Steam ID or URL' }), 
              { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          // Verify the Steam ID exists
          const user = await steamAPI.getUserInfo(steamId);
          if (!user) {
            return new Response(
              JSON.stringify({ error: 'Steam user not found' }), 
              { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
          }

          return new Response(JSON.stringify({ steamId, user }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        } catch (error) {
          console.error('Error validating Steam ID:', error);
          return new Response(
            JSON.stringify({ error: 'Failed to validate Steam ID' }), 
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }
      
      // Get regions
      if (pathname === '/api/regions') {
        return new Response(JSON.stringify({
          regions: config.priceRegions,
          regionNames: config.regionNames
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
      
      // Serve static files
      if (pathname.startsWith('/src/client/') || pathname.startsWith('/public/')) {
        const file = Bun.file('.' + pathname);
        if (await file.exists()) {
          return new Response(file);
        }
      }
      
      // 404 for unmatched routes
      return new Response('Not Found', { 
        status: 404,
        headers: corsHeaders
      });
      
    } catch (error) {
      console.error('Server error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }), 
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  },
  
  error(error) {
    console.error('Server error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});