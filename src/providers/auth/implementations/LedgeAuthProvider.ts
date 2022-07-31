import ILedgeAuthProvider, { LedgeAuthResult } from "../ILedgeAuthProvider";
import request from "request-promise"
import { LeagueAccount, REGION } from "../../../domain/LeagueAccount";

class LedgeAuthProvider implements ILedgeAuthProvider {

    private static readonly USW_REGION = {
        'BR1': 'usw',
        'LA1': 'usw',
        'LA2': 'usw',
        'NA1': 'usw',
        'OC1': 'usw',
        'RU': 'euc',
        'TR1': 'euc',
        'EUN1': 'euc',
        'EUW1': 'euc',
        'JP1': 'apne'
    };

    async execute(account: LeagueAccount): Promise<LedgeAuthResult> {
        const { authorization, region, puuid } = account;

        const entitlementsToken = await this.getEntitlementsToken(authorization);
        const userinfo = await this.getUserInfo(authorization);

        const api = request.defaults({
            baseUrl: `https://${LedgeAuthProvider.USW_REGION[region.toUpperCase() as REGION]}.pp.riotgames.com`,
            json: true
        });

        const session = await api.post(`/login-queue/v2/login/products/lol/regions/${region.toUpperCase()}`, {
            body: {
                "clientName": "lcu",
                "entitlements": entitlementsToken,
                "userinfo": userinfo
            },
            headers: {
                Authorization: `Bearer ${authorization}`
            },
        }).then((response) => response.token)
            .catch((error) => error.response.body)

        if (session.httpStatus === 400 && session.message === 'Player Banned') {
            const punishment = session.restrictions.find((restriction: any) => restriction.dat.expirationMillis && restriction.dat.expirationMillis > Date.now())
            if (punishment) {
                return {
                    accessToken: null,
                    punishment: `${session.message} ${punishment.reason} (${punishment.type})`
                }
            }
        }

        const accessToken = await api.post('/session-external/v1/session/create', {
            body: {
                "claims": {
                    "cname": "lcu"
                },
                "product": "lol",
                "puuid": puuid,
                "region": region.toLowerCase()
            },
            headers: {
                'Authorization': `Bearer ${session}`
            },
        });

        return {
            accessToken: accessToken,
            punishment: null
        }
    }

    private async getEntitlementsToken(authorization: string): Promise<string> {
        return await request.post(`https://entitlements.auth.riotgames.com/api/token/v1`, {
            headers: {
                'Authorization': `Bearer ${authorization}`
            },
            body: {},
            json: true
        }).then((response) => response.entitlements_token)
    }

    private async getUserInfo(authorization: string): Promise<string> {
        return await request.get(`https://auth.riotgames.com/userinfo`, {
            headers: {
                'Authorization': `Bearer ${authorization}`
            },
            json: true
        })
    }
}

export default LedgeAuthProvider;