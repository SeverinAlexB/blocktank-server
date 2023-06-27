import express, { Express, Request, Response, NextFunction } from 'express';
import { nodeInfo } from './routes/v2/nodeInfo';
import { AppConfig } from '../0_config/AppConfig';
import { setupChannels } from './routes/v2/channels';
import { getAppLogger } from '../1_logger/logger';
import 'express-async-errors';

const logger = getAppLogger()
const config = AppConfig.get()

export async function createApp() {
    const app: Express = express();


    app.get('/', (req: Request, res: Response) => {
        res.send(`Welcome to ${config.workerName}!`);
    });
    const v2: Express = express();
    v2.use(express.json());
    await nodeInfo(v2)
    await setupChannels(v2)
    
    // Error handler
    v2.use((err: any, req: Request, res: Response, next: NextFunction) => {
        logger.error({
            error: err,
            path: req.path,
            method: req.method,
            body: req.body,
            query: req.query,
            params: req.params
        }, `Uncaught express error on ${req.method} ${req.path}.`)
        res.status(500).send('Internal Server Error - Something broke!')
        return next(err)
    })

    app.use('/api/v2/', v2)
    return app
}

