import Account from "../../domain/Account";

export type AccountState = 'WAITING' | 'IN_PROGRESS' | 'FINISHED' | 'ERROR';
export type AccountResult = 'LIVE' | 'DEAD' | 'BANNED' | 'UNTESTED';

interface IAccountRepository {
    getPendingAccounts(): Promise<Account[]>;
    getFinishedAccounts(): Promise<string[]>;
    createAccount(account: Account, state: AccountState): Promise<void>;
    updateAccount(account: Account, state: AccountState, result: AccountResult, response: string): Promise<void>;
}

export default IAccountRepository;