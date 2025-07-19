import { Hono } from 'hono';
import type { Context, Next } from 'hono';
import { cors } from 'hono/cors';
import { SteamAuth } from './auth-service';
import { SteamUserAPI } from './steam-user-api';
import { config } from '../../config';

const app = new Hono();
const steamApiUrl = 'https://api.steampowered.com';
const steamUserAPI = new SteamUserAPI();

// CORS for the frontend
app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:4173'],
  allowMethods: ['GET', 'POST'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  credentials: true,
}));

// Auth middleware
const authMiddleware = async (c: Context, next: Next) => {
  const auth = new SteamAuth();
  const user = auth.getAuthenticatedUser(c.req.raw);

  if (!user) {
    return c.json({ error: 'Authentication required' }, 401);
  }

  // Attach user to context for downstream use if needed
  c.set('user', user);
  await next();
};

// Apply auth middleware to all wishlist routes
app.use('/wishlist/*', authMiddleware);

// Health check endpoint
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// Friends endpoint - uses Steam Web API
app.get('/friends', authMiddleware, async (c: Context) => {
  try {
    const user = c.get('user');
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    console.log('🔍 DEBUG: Fetching friends for authenticated user:', user.steamid);
    
    // Use Steam Web API to get friends list
    const response = await fetch(
      `${steamApiUrl}/ISteamUser/GetFriendList/v0001/?key=${config.steamApiKey}&steamid=${user.steamid}&relationship=friend`
    );

    if (!response.ok) {
      throw new Error(`Steam API error: ${response.status}`);
    }

    const data = await response.json();
    const friendsList = data.friendslist?.friends || [];
    
    console.log('🔍 DEBUG: Raw friends count:', friendsList.length);
    
    // Get detailed friend info
    if (friendsList.length > 0) {
      const friendIds = friendsList.map((f: any) => f.steamid).join(',');
      const detailsResponse = await fetch(
        `${steamApiUrl}/ISteamUser/GetPlayerSummaries/v0002/?key=${config.steamApiKey}&steamids=${friendIds}`
      );
      
      if (detailsResponse.ok) {
        const detailsData = await detailsResponse.json();
        const players = detailsData.response?.players || [];
        
        // Map to our friend format
        const friends = players.map((player: any) => ({
          steamid: player.steamid,
          personaname: player.personaname,
          profileurl: player.profileurl,
          avatar: player.avatar,
          avatarmedium: player.avatarmedium,
          avatarfull: player.avatarfull,
          personastate: player.personastate,
          communityvisibilitystate: player.communityvisibilitystate,
          relationship: 'friend',
          friend_since: friendsList.find((f: any) => f.steamid === player.steamid)?.friend_since || 0
        }));
        
        console.log('🔍 DEBUG: Friends endpoint returning:', friends.length, 'friends');
        return c.json(friends);
      }
    }
    
    return c.json([]);
  } catch (error) {
    console.error('Friends endpoint error:', error);
    return c.json({ error: 'Failed to load friends' }, 500);
  }
});

// Wishlist endpoint - returns the wishlist for a specific Steam ID
app.get('/wishlist/:steamId', authMiddleware, async (c: Context) => {
  try {
    const steamId = c.req.param('steamId');
    const user = c.get('user');
    
    if (!steamId) {
      return c.json({ error: 'Steam ID is required' }, 400);
    }

    console.log('🔍 DEBUG: Fetching wishlist for Steam ID:', steamId);
    console.log('🔍 DEBUG: Authenticated user:', user?.steamid);

    // Check if this is the authenticated user's own wishlist
    const isOwnWishlist = user?.steamid === steamId;
    
    // Check if they're friends (only if not own wishlist)
    let isFriend = false;
    if (user && !isOwnWishlist) {
      try {
        const friendsResponse = await fetch(
          `${steamApiUrl}/ISteamUser/GetFriendList/v0001/?key=${config.steamApiKey}&steamid=${user.steamid}&relationship=friend`
        );
        
        if (friendsResponse.ok) {
          const friendsData = await friendsResponse.json();
          const friendsList = friendsData.friendslist?.friends || [];
          isFriend = friendsList.some((friend: any) => friend.steamid === steamId);
          console.log('🔍 DEBUG: Is target user a friend?', isFriend);
        }
      } catch (friendsError) {
        console.log('🔍 DEBUG: Error checking friends list:', friendsError);
      }
    }

    try {
      console.log('🔍 DEBUG: Fetching wishlist with prices...');
      const gamesWithPrices = await steamUserAPI.getWishlistWithPrices(steamId);
      
      console.log('✅ DEBUG: Wishlist found:', gamesWithPrices.length, 'items');
      
      // Fetch user information for the profile
      const userResponse = await fetch(
        `${steamApiUrl}/ISteamUser/GetPlayerSummaries/v0002/?key=${config.steamApiKey}&steamids=${steamId}`
      );
      
      let userInfo = {
        steamid: steamId,
        personaname: 'Unknown User',
        profileurl: `https://steamcommunity.com/profiles/${steamId}`,
        avatar: '',
        avatarmedium: '',
        avatarfull: ''
      };
      
      if (userResponse.ok) {
        const userData = await userResponse.json();
        const players = userData.response?.players || [];
        if (players.length > 0) {
          const player = players[0];
          userInfo = {
            steamid: player.steamid,
            personaname: player.personaname || 'Unknown User',
            profileurl: player.profileurl || `https://steamcommunity.com/profiles/${steamId}`,
            avatar: player.avatar || '',
            avatarmedium: player.avatarmedium || '',
            avatarfull: player.avatarfull || ''
          };
        }
      }
      
      return c.json({
        user: userInfo,
        games: gamesWithPrices,
        totalCount: gamesWithPrices.length,
        isOwnWishlist,
        isFriend,
        source: 'steam-user-api'
      });
    } catch (error) {
      console.error('❌ Wishlist fetch error:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Wishlist unavailable';
      
      if (errorMessage.includes('private') || errorMessage.includes('404')) {
        let details = 'The user has set their wishlist to private.';
        
        if (isOwnWishlist) {
          details = 'Your wishlist appears to be private or you need to be logged in to Steam.';
        } else if (isFriend) {
          details = 'Your friend has set their wishlist to private. Even as a friend, you cannot access it.';
        }
        
        return c.json({
          error: 'This Steam profile wishlist is private or not found',
          details,
          isOwnWishlist,
          isFriend
        }, 403);
      } else {
        return c.json({
          error: 'Failed to load wishlist',
          details: errorMessage
        }, 500);
      }
    }
  } catch (error) {
    console.error('Wishlist endpoint error:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    return c.json({
      error: 'Failed to load wishlist',
      details: errorMessage
    }, 500);
  }
});

// Individual game details with regional pricing
app.get('/game-details/:steamId/:appid', authMiddleware, async (c: Context) => {
  try {
    const steamId = c.req.param('steamId');
    const appid = parseInt(c.req.param('appid'));
    const user = c.get('user');
    
    if (!user) {
      return c.json({ error: 'Authentication required' }, 401);
    }

    // Check if target user is a friend or self
    const isOwnWishlist = user.steamid === steamId;
    let isFriend = false;
    
    if (!isOwnWishlist) {
      try {
        const friendsResponse = await fetch(
          `${steamApiUrl}/ISteamUser/GetFriendList/v0001/?key=${config.steamApiKey}&steamid=${user.steamid}&relationship=friend`
        );
        
        if (friendsResponse.ok) {
          const friendsData = await friendsResponse.json();
          const friendsList = friendsData.friendslist?.friends || [];
          isFriend = friendsList.some((friend: any) => friend.steamid === steamId);
        }
      } catch (friendsError) {
        console.log('Error checking friends list:', friendsError);
      }
    }

    if (!isOwnWishlist && !isFriend) {
      return c.json({ error: 'Access denied' }, 403);
    }

    // Get detailed game info with regional pricing
    const gameDetails = await steamUserAPI.getGameDetailsWithPrices(appid, steamId);
    return c.json(gameDetails);
    
  } catch (error) {
    console.error('Game details endpoint error:', error);
    return c.json({ 
      error: 'Failed to load game details', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

// Get user profile information
app.get('/user/:steamId', async (c: Context) => {
  try {
    const steamId = c.req.param('steamId');
    
    // Validate Steam ID format
    if (!/^\d{17}$/.test(steamId)) {
      return c.json({ 
        error: 'Invalid Steam ID format', 
        details: 'Steam ID must be a 17-digit number' 
      }, 400);
    }
    
    // Fetch user information from Steam API
    const response = await fetch(
      `${steamApiUrl}/ISteamUser/GetPlayerSummaries/v0002/?key=${config.steamApiKey}&steamids=${steamId}`
    );
    
    if (!response.ok) {
      throw new Error(`Steam API error: ${response.status}`);
    }
    
    const data = await response.json();
    const players = data.response?.players || [];
    
    if (players.length === 0) {
      return c.json({ 
        error: 'User not found', 
        details: 'No Steam user found with this ID' 
      }, 404);
    }
    
    const player = players[0];
    const userInfo = {
      steamid: player.steamid,
      personaname: player.personaname || 'Unknown User',
      profileurl: player.profileurl || `https://steamcommunity.com/profiles/${steamId}`,
      avatar: player.avatar || '',
      avatarmedium: player.avatarmedium || '',
      avatarfull: player.avatarfull || '',
      personastate: player.personastate || 0,
      communityvisibilitystate: player.communityvisibilitystate || 0
    };
    
    return c.json(userInfo);
  } catch (error) {
    console.error('User endpoint error:', error);
    
    return c.json({ 
      error: 'Failed to load user', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, 500);
  }
});

export default app;