import Account from "../../domain/Account";

export type AuthResult = {
    success: boolean;
    result: Account | string;
}

export default interface IAuthProvider {
    execute(account: Account): Promise<AuthResult>;
};