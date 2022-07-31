export type REGION = 'BR1' | 'LA1' | 'LA2' | 'NA1' | 'OC1' | 'RU' | 'TR1' | 'EUN1' | 'EUW1' | 'JP1';

export type LeagueAccount = {
    readonly puuid: string;
    readonly accountId: number;
    readonly region: REGION;
    readonly authorization: string;
    ledgeAuthorization: string | null;
}