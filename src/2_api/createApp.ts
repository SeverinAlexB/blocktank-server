import express, { Express, Request, Response } from 'express';
import { nodeInfo } from './routes/nodeInfo';

export async function createApp() {
    const app: Express = express();
    const v2: Express = express();
    app.get('/', (req: Request, res: Response) => {
        res.send('GET blocktank-lsp-http');
    });
    app.use('/api/v2/', v2)
    
    await nodeInfo(v2)

    return app
}

