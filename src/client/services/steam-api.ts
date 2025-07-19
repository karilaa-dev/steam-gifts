import type { SteamFriend, SteamUser } from '../../types/steam';

const STEAM_API_BASE = 'https://api.steampowered.com';

/**
 * Fetches the friends list for a given Steam ID directly from the public Steam API.
 * Note: This requires the user's profile to be public.
 * @param steamId The 64-bit Steam ID of the user.
 * @returns A promise that resolves to an array of SteamFriend objects.
 */
export async function getFriendsList(steamId: string): Promise<SteamFriend[]> {
  // This is a placeholder URL. The actual endpoint for friends requires authentication
  // and will be handled by the backend proxy. This function serves as a template
  // for other public, non-key-required API calls.
  // We will adjust this later to use the proxied endpoint.
  console.warn('getFriendsList currently uses a placeholder and needs to be wired to the secure proxy.');
  return []; 
}

/**
 * Fetches public profile information for a given Steam ID.
 * @param steamId The 64-bit Steam ID of the user.
 * @returns A promise that resolves to a SteamUser object.
 */
export async function getUserInfo(steamId: string): Promise<SteamUser | null> {
  // This endpoint does not require an API key for basic public information.
  // However, we will use our proxy to be consistent and to leverage backend caching.
  const response = await fetch(`/api/proxy/ISteamUser/GetPlayerSummaries/v0002/?steamids=${steamId}`);
  if (!response.ok) {
    throw new Error('Failed to fetch user info');
  }
  const data = await response.json();
  const player = data.response.players[0];
  
  if (!player) {
    return null;
  }
  
  return {
    steamid: player.steamid,
    personaname: player.personaname,
    profileurl: player.profileurl,
    avatar: player.avatar,
    avatarmedium: player.avatarmedium,
    avatarfull: player.avatarfull,
    communityvisibilitystate: player.communityvisibilitystate,
  };
}