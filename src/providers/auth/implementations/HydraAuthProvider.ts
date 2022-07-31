import request, { RequestPromiseAPI } from 'request-promise';
import config from '../../../config';
import Account from '../../../domain/Account';
import IAuthProvider, { AuthResult } from '../IAuthProvider';

class HydraAuthProvider implements IAuthProvider {

    private readonly api: RequestPromiseAPI;

    constructor() {
        this.api = request.defaults({
            baseUrl: config.HYDRA_AUTH_URL,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            json: true
        });
    }

    async execute(account: Account): Promise<AuthResult> {
        const { username, password } = account;
        const result = await this.api.post('', {
            body: {
                "login": username,
                "pass": password,
                "hnkey": config.HYDRA_AUTH_TOKEN,
                "client_id": 'lol'
            }
        }).catch((error)=> error.response.body);

        if(result?.error) {
            return { success: false, result: result.error || "Unknown error." };
        }

        account.setLeagueAccount(result.token);

        return {
            success: true,
            result: account
        }
    }
}

export default HydraAuthProvider;