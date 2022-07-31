import { LeagueAccount } from "./LeagueAccount";

class Account {

    public readonly username: string;
    public readonly password: string;

    public league!: LeagueAccount;
    public punishment!: string | null;

    constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
    }

    get authorization(): string {
        return this.league.authorization;
    }

    get puuid(): string {
        return this.league.puuid;
    }

    get accountId(): number {
        return this.league.accountId;
    }

    get region(): string {
        return this.league.region;
    }

    public setLeagueAccount(authorization: string) {
        const payload = JSON.parse(Buffer.from(
            authorization.split('.')[1],
            'base64'
        ).toString());

        this.league = {
            authorization,
            puuid: payload.sub,
            accountId: payload.dat.u,
            region: payload.dat.r,
            ledgeAuthorization: null
        };
    } 
}

export default Account;