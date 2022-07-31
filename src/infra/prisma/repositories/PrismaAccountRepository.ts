import IAccountRepository, { AccountResult, AccountState } from "../../../application/repositories/IAccountRepository";
import Account from "../../../domain/Account";
import { prisma } from "../client";

export default class PrismaAccountRepository implements IAccountRepository {

    async getPendingAccounts(): Promise<Account[]> {
        const accounts = await prisma.account.findMany({
            where: {
                OR: [
                    { result: 'UNTESTED' },
                    { state: 'IN_PROGRESS' },
                    { state: 'WAITING' }
                ]
            },
        });

        return accounts.map(account => new Account(account.username, account.password));
    }

    async getFinishedAccounts(): Promise<string[]> {
        const accounts = await prisma.account.findMany({
            where: {
                AND: [
                    { result: 'LIVE' },
                    { state:  'FINISHED'}
                ]
            },
        });

        return accounts.map(account => `${account.username}:${account.password} » ${account.response}`);
    }

    async createAccount(account: Account, state: AccountState): Promise<void> {
        const existAccount = await prisma.account.findUnique({
            where: {
                username: account.username
            }
        });

        if (existAccount) return;

        await prisma.account.create({
            data: {
                username: account.username,
                password: account.password,
                state: state,
                result: 'UNTESTED',
                response: ''
            }
        });
    }

    async updateAccount(account: Account, state: AccountState, result: AccountResult, response: string): Promise<void> {
        await prisma.account.update({
            where: {
                username: account.username
            },
            data: {
                state: state,
                result: result,
                response: response
            }
        });
    }
}