import { config } from '../../config.ts';
import jwt from 'jsonwebtoken';
import type { SteamUser } from '../types/steam.ts';

export interface AuthenticatedUser {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
}

export class SteamAuth {
  // Generate Steam OpenID authentication URL
  async getAuthUrl(): Promise<string> {
    const params = new URLSearchParams({
      'openid.ns': 'http://specs.openid.net/auth/2.0',
      'openid.mode': 'checkid_setup',
      'openid.return_to': config.steamOpenIdReturnUrl,
      'openid.realm': config.steamOpenIdRealm,
      'openid.identity': 'http://specs.openid.net/auth/2.0/identifier_select',
      'openid.claimed_id': 'http://specs.openid.net/auth/2.0/identifier_select'
    });

    return `https://steamcommunity.com/openid/login?${params.toString()}`;
  }

  // Verify Steam OpenID response
  async verifyAssertion(url: string): Promise<string | null> {
    const urlObj = new URL(url);
    const params = urlObj.searchParams;

    // Check if the response is positive
    if (params.get('openid.mode') !== 'id_res') {
      return null;
    }

    // Extract claimed identity
    const claimedId = params.get('openid.claimed_id');
    if (!claimedId) {
      return null;
    }

    // Verify the signature with Steam
    const verifyParams = new URLSearchParams();
    for (const [key, value] of params.entries()) {
      verifyParams.set(key, value);
    }
    verifyParams.set('openid.mode', 'check_authentication');

    try {
      const response = await fetch('https://steamcommunity.com/openid/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: verifyParams.toString()
      });

      const verifyText = await response.text();
      
      if (verifyText.includes('is_valid:true')) {
        // Extract Steam ID from claimed identity
        const steamId = this.extractSteamId(claimedId);
        return steamId;
      }
    } catch (error) {
      console.error('Error verifying Steam OpenID:', error);
    }

    return null;
  }

  // Extract Steam ID from OpenID identifier
  private extractSteamId(identifier: string): string | null {
    const match = identifier.match(/\/id\/(\d+)$/);
    return match && match[1] ? match[1] : null;
  }

  // Generate JWT token for authenticated user
  generateToken(user: AuthenticatedUser): string {
    return jwt.sign(
      {
        steamid: user.steamid,
        personaname: user.personaname,
        profileurl: user.profileurl,
        avatar: user.avatar,
        avatarmedium: user.avatarmedium,
        avatarfull: user.avatarfull
      },
      config.jwtSecret,
      { 
        expiresIn: '24h',
        issuer: 'steam-gifts-app'
      }
    );
  }

  // Verify JWT token and return user data
  verifyToken(token: string): AuthenticatedUser | null {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as any;
      return {
        steamid: decoded.steamid,
        personaname: decoded.personaname,
        profileurl: decoded.profileurl,
        avatar: decoded.avatar,
        avatarmedium: decoded.avatarmedium,
        avatarfull: decoded.avatarfull
      };
    } catch (error) {
      return null;
    }
  }

  // Parse JWT token from cookie string
  parseTokenFromCookie(cookieHeader: string | null): string | null {
    if (!cookieHeader) return null;
    
    const cookies = cookieHeader.split(';').map(c => c.trim());
    const authCookie = cookies.find(c => c.startsWith('auth-token='));
    
    if (authCookie) {
      const parts = authCookie.split('=');
      return parts[1] || null;
    }
    
    return null;
  }

  // Get authenticated user from request
  getAuthenticatedUser(req: Request): AuthenticatedUser | null {
    const cookieHeader = req.headers.get('cookie');
    const token = this.parseTokenFromCookie(cookieHeader);
    
    if (!token) return null;
    
    return this.verifyToken(token);
  }
}