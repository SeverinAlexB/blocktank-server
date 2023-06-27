import axios from 'axios';
import { IExchangeRate } from './IExchangeRate';


export class BitfinexRateApi {
    private static url = 'https://api.bitfinex.com/v1/pubticker/BTCUSD'

    public static async pull(): Promise<IExchangeRate> {
            const response = await axios.get(this.url)
            const data = response.data
            const parsed = Number.parseFloat(data.last_price)
            return {
                symbol: 'BTCUSD',
                lastPrice: parsed,
                timestamp: new Date(response.data.timestamp*1000)
            }
    }


}

