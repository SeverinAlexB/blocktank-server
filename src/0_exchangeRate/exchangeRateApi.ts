import { getAppLogger } from '../1_logger/logger';
import { BitfinexRateApi } from './BitfinexApi';
import { CoingeckoRateApi } from './CoingeckoApi';
import { IExchangeRate } from './IExchangeRate';

const logger = getAppLogger()


/**
 * ExchangeRate API that pulls the latest exchange rate every 2hrs from Bitfinex or, if not available, Coingecko.
 */
export class ExchangeRateApi {

    private _latest: IExchangeRate
    private intervalId: NodeJS.Timer;

    async init() {
        if (this.intervalId) {
            // Already initialized
            return
        }
        this._latest = await this.pull()
        this.intervalId = setInterval(async () => {
            try {
                this._latest = await this.pull()
            } catch (e) {
                if (this.isLatestRateTooOld) {
                    throw e
                }
                // Dont mind if the rate is not older than 1 day.
            }
        }, 30*60*1000) // Pull rate every 30min
    }

    get isInitialied(): boolean {
        return !!this.intervalId
    }

    private get isLatestRateTooOld(): boolean {
        if (!this._latest) {
            return true
        }
        const ageMs = new Date().getTime() - this._latest.timestamp.getTime()
        const ageDays = ageMs/(1000*60*60*24)
        return ageDays > 1
    }

    stop() {
        clearInterval(this.intervalId)
        this.intervalId = undefined
    }

    private async pull(): Promise<IExchangeRate> {
        let rate: IExchangeRate
        try {
            rate = await BitfinexRateApi.pull()
        } catch (e) {
            logger.warn({error: e.message}, 'Failed to pull Bitfinex BTCUSD exchange rate.')
        }

        if (!rate) {
            try {
                logger.info('Use Coingecko Exchange rate api as a Bitfinex fallback.')
                rate = await CoingeckoRateApi.pull()
            } catch (e) {
                logger.warn({error: e.code}, 'Failed to pull Coingecko BTCUSD exchange rate.')
            }
        }

        if (!rate && !this._latest) {
            logger.fatal('Failed to pull BTCUSD exchange rate and no previous rate is available.')
            throw new Error('Failed to pull BTCUSD exchange rate and no previous rate is available.')
        }
        logger.debug(`Pulled current BTCUSD exchange rate ${rate.lastPrice}.`)
        return rate
    }

    /**
     * Get BTCUSD exchange rate
     * @returns 
     */
    async getRate(): Promise<IExchangeRate> {
        if (!this.isInitialied) {
            await this.init()
        }

        if (!this._latest) {
            this._latest = await this.pull()
        }
        return this._latest
    }

    /**
     * Convert satoshi to USD
     * @param satoshi 
     * @returns 
     */
    async toUsd(satoshi: number): Promise<number> {
        const btc = satoshi/(100*1000*1000)
        const rate = await this.getRate()
        const usd = btc * rate.lastPrice
        return Math.round(usd * 100)/100
    }

    /**
     * Convert USD to satoshi
     * @param usd 
     * @returns 
     */
    async toSatoshi(usd: number): Promise<number> {
        const rate = await this.getRate()
        const btc = usd / rate.lastPrice
        return Math.round(btc * 100*1000*1000)
    }
}

const exchangeRateApi = new ExchangeRateApi()
export default exchangeRateApi