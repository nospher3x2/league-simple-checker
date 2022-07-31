import request, { RequestPromiseAPI } from "request-promise";
import IAuthProvider, { AuthResult } from "../IAuthProvider";
import { HttpsCookieAgent } from "http-cookie-agent/http";
import { CookieJar } from 'tough-cookie';
import config from "../../../config";
import Account from "../../../domain/Account";

class LeagueAuthProvider implements IAuthProvider {

    private static readonly CIPHERS = [
        'TLS_CHACHA20_POLY1305_SHA256',
        'TLS_AES_128_GCM_SHA256',
        'TLS_AES_256_GCM_SHA384',
        'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
        'TLS_AES_128_CCM_8_SHA256',
        'TLS_AES_128_CCM_SHA256',
    ]

    private readonly api: RequestPromiseAPI;

    constructor() {
        const jar = new CookieJar();

        this.api = request.defaults({
            baseUrl: config.RIOT_AUTH_URL,
            headers: {
                'Content-Type': 'application/json',
                'User-Agent': 'RiotClient/51.0.0.4429735.4381201 rso-auth (Windows;10;;Professional, x64)'
            },
            proxy: config.RIOT_AUTH_PROXY || undefined,
            json: true,
            agent: new HttpsCookieAgent({
                cookies: { jar },
                keepAlive: true,
                ciphers: LeagueAuthProvider.CIPHERS.join(":"),
                honorCipherOrder: true,
                minVersion: 'TLSv1.2',
                maxVersion: 'TLSv1.3',
            })
        });
    }

    async execute(account: Account): Promise<AuthResult> {
        const { username, password } = account;

        await this.api.post("/api/v1/authorization", {
            body: {
                "acr_values": "",
                "claims": "",
                "client_id": 'lol',
                "code_challenge": "",
                "code_challenge_method": "",
                "nonce": "dZdBedwyfLIdkKXrAikImg",
                "redirect_uri": "http://localhost/redirect",
                "response_type": "token id_token",
                "scope": "openid link ban lol_region account"
            }
        }).catch((error) => error.response.data);

        const data = await this.api.put("/api/v1/authorization", {
            body: {
                "language": "en_US",
                "username": username,
                "password": password,
                "region": null,
                "remember": false,
                "type": "auth",
            }
        }).catch((error) => error.response.body);

        if (!data) return await this.execute(account);

        if (data.error) {
            return { success: false, result: data.error || "Unknown error." };
        }

        const tokens = data?.response?.parameters?.uri?.match(/access_token=((?:[a-zA-Z]|\d|\.|-|_)*)/);
        if (!tokens) return await this.execute(account);

        const [, authorization,] = tokens;
        account.setLeagueAccount(authorization);

        return {
            success: true,
            result: account,
        }
    }
}

export default LeagueAuthProvider;