'use strict'
import axios from 'axios'
import BigNumber from 'bignumber.js'
import { AppConfig } from '../0_config/AppConfig'

const config = AppConfig.get()

/**
 * Interest rate to lend 1BTC for 1 hour.
 * @returns 
 */
export async function getFRR(): Promise<BigNumber | null> {
  try {
    const res = await axios.get('https://api-pub.bitfinex.com/v2/tickers?symbols=fBTC')
    const data = res.data
    if (!data || !Array.isArray(data)) {
      return null
    }
    const firstElement = data[0]
    if (!firstElement || !Array.isArray(firstElement)) {
      return null;
    }
    const ffr = firstElement[1];
    if (!ffr) {
      return null
    }
    return BigNumber(ffr)
  } catch (err) {
    console.log('Failed to get FRR')
    console.log(err)
    return null
  }
}


const DUST_LIMIT_SAT = 546
const MIN_PRICE_SAT = DUST_LIMIT_SAT * 2

/**
 * Channel fee in satoshi base on the lending rate.
 * @param channelExpiryWeeks 
 * @param lspBalanceSat 
 * @returns satoshi
 */
export async function getChannelFee (channelExpiryWeeks: number, lspBalanceSat: number, mockFrrRate?: number): Promise<number> {
  let frr: BigNumber;
  if(mockFrrRate) {
    frr = BigNumber(mockFrrRate)
  } else {
    frr = await getFRR()
  }
  if (!frr) {
    return null
  }
  // Price = Loan amount x Rate X Duration
  // Using: https://support.bitfinex.com/hc/en-us/articles/115004554309-Margin-Funding-interest-on-Bitfinex
  const daysOfLending = channelExpiryWeeks*7;
  const priceSat = frr.times(daysOfLending).times(lspBalanceSat).plus(config.channels.basePriceSat)
  if (priceSat.isNaN() || priceSat.lte(0)) {
    throw new Error('Failed to create channel fee')
  }

  const roundedPriceSat = Math.round(priceSat.toNumber())
  if (roundedPriceSat < MIN_PRICE_SAT) {
    return MIN_PRICE_SAT
  }

  return roundedPriceSat
}


