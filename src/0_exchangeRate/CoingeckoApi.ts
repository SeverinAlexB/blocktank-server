import { IExchangeRate } from "./IExchangeRate";
import axios from 'axios';

export class CoingeckoRateApi {
    private static url = 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'
    public static async pull(): Promise<IExchangeRate> {
            const response = await axios.get(this.url)
            const data = response.data
            const parsed = Number.parseFloat(data.bitcoin.usd)
            return {
                symbol: 'BTCUSD',
                lastPrice: parsed,
                timestamp: new Date()
            }
    }
}