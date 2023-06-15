import { AppConfig } from '../0_config/AppConfig';
import {getChannelFee, getFRR} from './pricing'
jest.setTimeout(60*1000)

afterEach(() => {
    const config = AppConfig.get()
    config.channels.basePriceSat = 0
})

describe('pricing', () => {

    test('getChannelFee 1BTC 1 year', async () => {
        const frr = 1.6164383561643836e-7; // Current rate at 14th of June 2023
        const feeSat = await getChannelFee(53, 100*1000*1000, frr)
        expect(feeSat).toEqual(5997)
    });

    test('getChannelFee basePriceSat', async () => {
        const config = AppConfig.get()
        config.channels.basePriceSat = 5000
        const frr = 1.6164383561643836e-7; // Current rate at 14th of June 2023
        const feeSat = await getChannelFee(53, 100*1000*1000, frr)
        expect(feeSat).toEqual(5997 + config.channels.basePriceSat)
    });


});


