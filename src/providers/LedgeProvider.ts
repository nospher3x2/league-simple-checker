import request, { RequestPromiseAPI } from "request-promise";
import { LeagueAccount } from "../domain/LeagueAccount";

type ResponseDTO = {
    service: string;
    data: any
};

class LedgeProvider {

    private static readonly WEB_REGION: { [key: string]: any } = {
        "LA1": "lan",
        "LA2": "las",
        "EUN1": "eune",
        "OC1": "oce",
    }

    private readonly api: RequestPromiseAPI;

    constructor(private account: LeagueAccount) {
        const { region, ledgeAuthorization } = account;

        const displayRegion = region.toUpperCase().startsWith("LA") ? region : region.replace(/[0-9]/g, '');
        const webRegionDisplay = LedgeProvider.WEB_REGION[region] ? LedgeProvider.WEB_REGION[region] : displayRegion.toLowerCase();

        this.api = request.defaults({
            baseUrl: `https://${webRegionDisplay}-blue.lol.sgp.pvp.net`,
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${ledgeAuthorization}`
            },
            json: true
        });
    }

    public async getSummoner(): Promise<ResponseDTO> {
        return await this.api.get(`/summoner-ledge/v1/regions/${this.account.region}/summoners/puuid/${this.account.puuid}`)
            .then((response) => { return { service: 'summoner', data: response } })
            .catch(async (error) => { return error?.response?.body ? { service: 'summoner', data: error.response.body } : await this.getSummoner() });
    }

    public async getElo(): Promise<ResponseDTO> {
        return await this.api.get(`/leagues-ledge/v2/rankedStats/puuid/${this.account.puuid}`)
            .then((response) => { return { service: 'elo', data: response } })
            .catch(async (error) => { return error?.response?.body ? { service: 'elo', data: error.response.body } : await this.getElo() });
    }

    public async getInventory(): Promise<ResponseDTO> {
        return await this.api.get(`/lolinventoryservice-ledge/v1/inventoriesWithLoyalty?puuid=${this.account.puuid}&accountId=${this.account.accountId}&inventoryTypes=CHAMPION&inventoryTypes=CHAMPION_SKIN`)
            .then((response) => { return { service: 'inventory', data: response.data.items } })
            .catch(async (error) => { return error?.response?.body ? { service: 'inventory', data: error.response.body } : await this.getInventory() });
    }

    public async getWalletBalance(): Promise<ResponseDTO> {
        return await this.api.get(`/lolinventoryservice-ledge/v1/walletsbalances?puuid=${this.account.puuid}&accountId=${this.account.accountId}&currencyTypes=lol_blue_essence&currencyTypes=RP`)
            .then((response) => { return { service: 'wallet', data: response.data.balances } })
            .catch(async (error) => { return error?.response?.body ? { service: 'wallet', data: error.response.body } : await this.getWalletBalance() });
    }

}

export default LedgeProvider;