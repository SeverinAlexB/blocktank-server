import express, { Express, Request, Response } from 'express';
import { nodeInfo } from './routes/v2/nodeInfo';
import { AppConfig } from '../0_config/AppConfig';

const config = AppConfig.get()

export async function createApp() {
    const app: Express = express();
    const v2: Express = express();
    app.get('/', (req: Request, res: Response) => {
        res.send(`Welcome to ${config.workerName}!`);
    });
    app.use('/api/v2/', v2)
    
    await nodeInfo(v2)

    return app
}

