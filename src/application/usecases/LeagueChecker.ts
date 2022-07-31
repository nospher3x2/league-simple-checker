import Account from "../../domain/Account";
import IAuthProvider from "../../providers/auth/IAuthProvider";
import ILedgeAuthProvider from "../../providers/auth/ILedgeAuthProvider";
import LedgeProvider from "../../providers/LedgeProvider";
import IAccountRepository from "../repositories/IAccountRepository";
import moment from 'moment';
import colors from 'colors';

export class LeagueChecker {

    constructor(
        private readonly authProvider: IAuthProvider,
        private readonly ledgeAuthProvider: ILedgeAuthProvider,
        private readonly accountRepository: IAccountRepository
    ) { }

    async execute(account: Account): Promise<void> {
        try {
            const authResult = await this.authProvider.execute(account);
            if (!authResult.success) {
                console.log(colors.red(`[DEAD] ${account.username}:${account.password} » ${authResult.result}`));
                await this.accountRepository.updateAccount(account, 'FINISHED', 'DEAD', authResult.result as string);
                return;
            }

            const ledgeAuthResult = await this.ledgeAuthProvider.execute(account.league);
            if (!ledgeAuthResult.accessToken) {
                console.log(colors.yellow(`[BANNED] ${account.username}:${account.password} (${account.region}) » ${ledgeAuthResult.punishment?.toUpperCase()}`));
                await this.accountRepository.updateAccount(account, 'FINISHED', 'BANNED', ledgeAuthResult.punishment?.toUpperCase() as string);
                return;
            }

            account.league.ledgeAuthorization = ledgeAuthResult.accessToken;

            const ledgeProvider = new LedgeProvider(account.league);
            let data: { [key: string]: any } = {}
            await Promise.all([
                await ledgeProvider.getSummoner(),
                await ledgeProvider.getInventory(),
                await ledgeProvider.getElo(),
                await ledgeProvider.getWalletBalance(),
            ]).then((result) => result.map((response) => data[response.service] = response.data));


            const { summoner, inventory, elo, wallet } = data;

            const lastGame = moment(summoner.lastGameDate).format('L');
            const eloDisplay = elo.queues.map((queue: any) => `${queue.tier || 'UNRANKED'} ${queue.rank ? `${queue.rank} ` : ''}(${queue.queueType.replace('RANKED_', '')})`).filter((eloData: string) => !eloData.includes("TFT_")).join(' » ');

            const response = `NICKNAME: ${summoner.name} | BE: ${wallet.lol_blue_essence} | RP: ${wallet.RP} | CHAMPIONS: ${inventory.CHAMPION.length} | SKINS: ${inventory.CHAMPION_SKIN.length} | ELO: ${eloDisplay} | LAST GAME: ${lastGame}`;
            console.log(colors.green(`[LIVE] ${account.username}:${account.password} (${account.region}) » ${response}`));

            await this.accountRepository.updateAccount(account, 'FINISHED', 'LIVE', response);
            return;
        } catch {
            return await this.execute(account);
        }
    }
}

export default LeagueChecker;