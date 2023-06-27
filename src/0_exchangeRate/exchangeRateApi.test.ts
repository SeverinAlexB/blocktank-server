import exchangeRateApi from  './exchangeRateApi'

describe('Exchange rate', () => {
    test('get', async () => {
        const res = await exchangeRateApi.getRate()
        expect(res.lastPrice).toBeGreaterThan(10000)
        expect(res.lastPrice).toBeLessThan(9999999)
    })

});
