import { Express } from 'express';


export async function nodeInfo(express: Express) {
    express.get('/node/info', (req, res) => {
        res.status(200).json({
            nodes: [
                {
                    alias: 'asfd',
                    pubkey: 'afas',
                    connectionStrings: [
                        ''
                    ]
                }
            ],
            options: {
                "min_channel_size":1000000,
                "max_channel_size":50000000,
                "min_chan_expiry":1,
                "max_chan_expiry":12,
                "max_node_usd_capacity":9999,
                "max_chan_receiving":"3867745",
                "max_chan_receiving_usd":"999",
                "max_chan_spending":"3867745",
                "max_chan_spending_usd":998.99985605
            }
        })
    })
}