import {sleep} from '@synonymdev/blocktank-worker2/dist/utils';
import {RedisLock} from './RedisLock'
import Client from "ioredis";


jest.setTimeout(60*1000)




describe('RedisLock', () => {

    test('simple run', async () => {
        const lock = new RedisLock()
        let didRun = false
        const retVal = await lock.run('resource1', 10*1000, (signal) => {
            didRun = true
            return "hello"
        })
        expect(retVal).toEqual("hello")
        expect(didRun).toEqual(true)
        lock.disconnect()
    });

    test('Already locked', async () => {
        const lock = new RedisLock()
        const promise = lock.run('resource1', 2*1000, async (signal) => {
            console.log('run 1 start')
            await sleep(1*1000)
            console.log('run 1 end')
        })
        await sleep(100)
        expect(lock.run('resource1', 10*1000, async (signal) => {
            console.log('run 2 start')
            await sleep(1*1000)
            console.log('run 2 end')
        })).rejects.toThrow()

        await promise // Wait until test is done.
        lock.disconnect()
    });

    test('throw error', async () => {
        const lock = new RedisLock()
        expect(lock.run('resource1', 10*1000, async (signal) => {
            throw new Error('yolo')
        })).rejects.toThrow()
        lock.disconnect()
    });


});


