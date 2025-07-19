declare module 'steam-user' {
  export default class SteamUser {
    constructor(options?: any);
    logOn(options: any): void;
    logOff(): void;
    getProductInfo(apps: number[], packages?: any[], options?: any): Promise<any>;
    getUserOwnedApps(steamId: string, options?: any): Promise<any>;
    loggedOn: boolean;
  }
}