import fs from 'fs';
import colors from 'colors';
import IAccountRepository from '../../application/repositories/IAccountRepository';
import ILedgeAuthProvider from '../../providers/auth/ILedgeAuthProvider';
import PrismaAccountRepository from '../prisma/repositories/PrismaAccountRepository';
import LedgeAuthProvider from '../../providers/auth/implementations/LedgeAuthProvider';
import Account from '../../domain/Account';
import config from '../../config';
import LeagueAuthProvider from '../../providers/auth/implementations/LeagueAuthProvider';
import HydraAuthProvider from '../../providers/auth/implementations/HydraAuthProvider';
import LeagueChecker from '../../application/usecases/LeagueChecker';

const FILE_PATH = `${process.cwd()}/accounts.txt`
export class App {

    private readonly accountRepository: IAccountRepository;
    private readonly ledgeAuthProvider: ILedgeAuthProvider;
    private list: string[] = [];

    constructor() {
        this.accountRepository = new PrismaAccountRepository();
        this.ledgeAuthProvider = new LedgeAuthProvider();
    }

    async start() {
        console.log(colors.magenta('[LEAGUE CHECKER] Reading pending accounts in database. '))
        for (const account of await this.accountRepository.getPendingAccounts()) {
            this.list.push(`${account.username}|${account.password}`);
        }

        console.log(colors.magenta(`[LEAGUE CHECKER] Found ${this.list.length} pending accounts.`))
        console.log(colors.magenta('[LEAGUE CHECKER] Reading new accounts in accounts.txt. SEPARATOR: | '))
        while (true) {
            const line = this.removeFirstLineFromFile();
            if (!line) break;
            if (this.list.includes(line)) continue;

            const [username, password] = line.split('|');
            if (username && password) {
                await this.accountRepository.createAccount(
                    new Account(username, password),
                    'WAITING'
                );

                this.list.push(line);
            }
        }

        console.log(colors.magenta(`[LEAGUE CHECKER] Total ${this.list.length} accounts to check.`));
        for (let i = 0; i < config.MAX_WORKERS; i++) {
            this.handle();
        }
    }

    async handle(): Promise<void> {
        const line = this.list.shift();
        if (!line) return;

        const [username, password] = line.split('|');
        if (!(username && password)) {
            return await this.handle();
        }

        const auth = config.AUTH_TYPE === 'RIOT' ? new LeagueAuthProvider() : new HydraAuthProvider();

        const account = new Account(username, password);
        const checker = new LeagueChecker(auth, this.ledgeAuthProvider, this.accountRepository);
        await checker.execute(account);

        return await this.handle();
    }

    private removeFirstLineFromFile = (): string | undefined => {
        const data = fs.readFileSync(FILE_PATH, 'utf8').replace(/\r/g, '').split('\n');
        const line = data.shift();
        if (data.length == 1 && line == '') {
            return undefined;
        }

        fs.writeFileSync(FILE_PATH, data.join('\n'));
        return line;
    }
}