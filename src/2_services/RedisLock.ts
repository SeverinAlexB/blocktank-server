import Client from "ioredis";
import Redlock, { ExecutionError, RedlockAbortSignal, ResourceLockedError } from "redlock";


export class RedisLock {
    private client: Client;
    private lock: Redlock;

    constructor(public retryCount = 1) {
        this.client = new Client(6379, 'localhost');

        this.lock = new Redlock([this.client], {
            retryCount: retryCount
        })
    }

    /**
     * Tries to lock once. Throws an error otherwise.
     * @param lockKey 
     * @param timeoutMs 
     * @param run 
     * @returns 
     */
    async run<T>(lockKey: string, timeoutMs: number, run: (signal: RedlockAbortSignal) => T): Promise<T> {
        return await this.lock.using<T>([lockKey], timeoutMs, async (signal) => {
            return await run(signal)
        })
    }

    disconnect() {
        this.client.disconnect()
    }

    /**
     * Tries to lock once. Throws an error otherwise.
     * @param lockKey 
     * @param timeoutMs 
     * @param run 
     * @returns 
     */
    static async run<T>(lockKey: string, timeoutMs: number, run: (signal: RedlockAbortSignal) => T): Promise<T>  {
        const lock = new RedisLock(1)
        try {
            return await lock.run(lockKey, timeoutMs, run)
        } finally {
            lock.disconnect()
        }
    }
}