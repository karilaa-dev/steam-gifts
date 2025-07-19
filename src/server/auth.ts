import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { SteamAuth as SteamAuthService } from './auth-service';
import { SteamAPI } from './steam-api';
import { config } from '../../config';

const app = new Hono();
const steamAuth = new SteamAuthService();
const steamAPI = new SteamAPI(config.steamApiKey);

// Configure CORS for auth endpoints
app.use('/*', cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  allowMethods: ['GET', 'POST'],
  allowHeaders: ['Content-Type', 'Authorization', 'Cookie'],
  credentials: true,
}));

// Route to initiate Steam login
app.get('/steam', async (c) => {
  try {
    console.log('🔍 DEBUG: Generating Steam auth URL with config:', {
      returnUrl: config.steamOpenIdReturnUrl,
      realm: config.steamOpenIdRealm
    });
    
    const authUrl = await steamAuth.getAuthUrl();
    console.log('✅ DEBUG: Generated auth URL:', authUrl);
    return c.redirect(authUrl);
  } catch (error) {
    console.error('❌ Error generating Steam auth URL:', error);
    return c.json({ error: 'Failed to generate authentication URL' }, 500);
  }
});

// Callback route for Steam OpenID
app.get('/steam/return', async (c) => {
  try {
    console.log('🔍 DEBUG: Steam auth callback received:', c.req.url);
    
    const steamId = await steamAuth.verifyAssertion(c.req.url);
    console.log('🔍 DEBUG: Verified Steam ID:', steamId);
    
    if (!steamId) {
      console.log('❌ DEBUG: Steam verification failed');
      return c.redirect(`/?error=auth_failed`);
    }

    const user = await steamAPI.getUserInfo(steamId);
    console.log('🔍 DEBUG: Retrieved user info:', user?.personaname);
    
    if (!user) {
      console.log('❌ DEBUG: User not found');
      return c.redirect(`/?error=user_not_found`);
    }

    const token = steamAuth.generateToken(user);
    console.log('✅ DEBUG: Generated token successfully');
    
    c.header('Set-Cookie', `auth-token=${token}; HttpOnly; Path=/; Max-Age=86400; SameSite=Lax`);
    return c.redirect('http://localhost:5173');

  } catch (error) {
    console.error('❌ Error during Steam auth callback:', error);
    return c.redirect('http://localhost:5173/?error=auth_error');
  }
});

// Logout route
app.post('/logout', (c) => {
  c.header('Set-Cookie', 'auth-token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
  return c.json({ success: true });
});

// Me route to check session
app.get('/me', (c) => {
    console.log('🔍 DEBUG: /auth/me endpoint hit, checking authentication...');
    const user = steamAuth.getAuthenticatedUser(c.req.raw);
    console.log('🔍 DEBUG: Authentication check result:', !!user);
    
    if (!user) {
        return c.json({ error: 'Not authenticated' }, 401);
    }
    return c.json(user);
});


export default app;