export interface SteamGame {
  appid: number;
  name: string;
  header_image?: string;
  short_description?: string;
  platforms?: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
}

export interface WishlistItem {
  appid: number;
  name: string;
  header_image: string;
  price_overview?: {
    currency: string;
    initial: number;
    final: number;
    discount_percent: number;
    initial_formatted: string;
    final_formatted: string;
  };
  platforms: {
    windows: boolean;
    mac: boolean;
    linux: boolean;
  };
  wishlist_priority: number;
}

export interface RegionalPrice {
  region: string;
  regionName: string;
  currency: string;
  price: string;
  discount?: number;
  originalPrice?: string;
}

export interface WishlistGameWithPrices extends WishlistItem {
  regionalPrices: RegionalPrice[];
}

export interface SteamFriend {
  steamid: string;
  relationship: string;
  friend_since: number;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  personastate: number;
  communityvisibilitystate: number;
}

export interface SteamUser {
  steamid: string;
  personaname: string;
  profileurl: string;
  avatar: string;
  avatarmedium: string;
  avatarfull: string;
  communityvisibilitystate: number;
}

export interface WishlistResponse {
  user: SteamUser;
  games: WishlistGameWithPrices[];
  totalCount: number;
} 