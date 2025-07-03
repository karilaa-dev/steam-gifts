import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SteamAPI } from './steam-api.js';
import { SteamAuth } from './auth.js';
import type { WishlistResponse } from '../types/steam.js';

// Import configuration (you'll need to create config.ts from config.example.ts)
let config: any;
try {
  config = await import('../../config.js');
} catch {
  console.error('Please create config.ts from config.example.ts and add your Steam API key');
  process.exit(1);
}

const app = new Hono();

// Enable CORS for frontend
app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST', 'OPTIONS'],
  allowHeaders: ['Content-Type']
}));

// Initialize Steam API
const steamAPI = new SteamAPI(config.config.steamApiKey);

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Get user information by Steam ID
app.get('/api/user/:steamId', async (c) => {
  const steamId = c.req.param('steamId');
  
  if (!steamId) {
    return c.json({ error: 'Steam ID is required' }, 400);
  }

  try {
    const user = await steamAPI.getUserInfo(steamId);
    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }
    return c.json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    return c.json({ error: 'Failed to fetch user information' }, 500);
  }
});

// Get friends list for authenticated user
app.get('/api/friends', async (c) => {
  console.log('🔍 DEBUG: /api/friends endpoint called');
  
  // Get authenticated user from JWT token
  const steamAuth = new SteamAuth();
  const user = steamAuth.getAuthenticatedUser(c.req.raw);
  
  if (!user) {
    console.log('🔍 DEBUG: No authenticated user found');
    return c.json({ error: 'Authentication required' }, 401);
  }
  
  console.log('🔍 DEBUG: Authenticated user Steam ID:', user.steamid);

  try {
    console.log('🔍 DEBUG: Fetching friends list for Steam ID:', user.steamid);
    const friends = await steamAPI.getFriendsList(user.steamid);
    console.log('🔍 DEBUG: Friends fetched successfully, count:', friends.length);
    return c.json(friends);
  } catch (error) {
    console.error('🔍 DEBUG: Error fetching friends:', error);
    return c.json({ error: 'Failed to fetch friends list' }, 500);
  }
});

// Get friends list for a Steam ID
app.get('/api/friends/:steamId', async (c) => {
  const steamId = c.req.param('steamId');
  
  if (!steamId) {
    return c.json({ error: 'Steam ID is required' }, 400);
  }

  try {
    const friends = await steamAPI.getFriendsList(steamId);
    return c.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    return c.json({ error: 'Failed to fetch friends list' }, 500);
  }
});

// Get wishlist for a Steam ID with regional pricing
app.get('/api/wishlist/:steamId', async (c) => {
  const steamId = c.req.param('steamId');
  const regions = c.req.query('regions') || config.config.priceRegions.join(',');
  
  if (!steamId) {
    return c.json({ error: 'Steam ID is required' }, 400);
  }

  try {
    const regionsArray = regions.split(',').map((r: string) => r.trim().toUpperCase());
    
    // Get user info and wishlist in parallel
    const [user, games] = await Promise.all([
      steamAPI.getUserInfo(steamId),
      steamAPI.getWishlistWithPrices(steamId, regionsArray)
    ]);

    if (!user) {
      return c.json({ error: 'User not found' }, 404);
    }

    const response: WishlistResponse = {
      user,
      games,
      totalCount: games.length
    };

    return c.json(response);
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    if (error instanceof Error && error.message.includes('not accessible')) {
      return c.json({ error: 'Wishlist is private or user not found' }, 403);
    }
    return c.json({ error: 'Failed to fetch wishlist' }, 500);
  }
});

// Validate and extract Steam ID from URL or ID
app.post('/api/validate-steam-id', async (c) => {
  const { input } = await c.req.json();
  
  if (!input) {
    return c.json({ error: 'Input is required' }, 400);
  }

  try {
    const steamId = SteamAPI.extractSteamId(input);
    
    if (!steamId) {
      return c.json({ error: 'Invalid Steam ID or URL' }, 400);
    }

    // Verify the Steam ID exists
    const user = await steamAPI.getUserInfo(steamId);
    if (!user) {
      return c.json({ error: 'Steam user not found' }, 404);
    }

    return c.json({ steamId, user });
  } catch (error) {
    console.error('Error validating Steam ID:', error);
    return c.json({ error: 'Failed to validate Steam ID' }, 500);
  }
});

// Get available regions for pricing
app.get('/api/regions', (c) => {
  return c.json({
    regions: config.config.priceRegions,
    regionNames: config.config.regionNames
  });
});

// Error handling middleware
app.onError((err, c) => {
  console.error('Server error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Endpoint not found' }, 404);
});

export default app; 