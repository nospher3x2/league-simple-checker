import { LeagueAccount } from "../../domain/LeagueAccount";

export type LedgeAuthResult = {
    accessToken: string | null;
    punishment: string | null;
}

export default interface ILedgeAuthProvider {
    execute(account: LeagueAccount): Promise<LedgeAuthResult>;
};