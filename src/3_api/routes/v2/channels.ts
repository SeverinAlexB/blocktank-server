import { BlocktankDatabase } from '@synonymdev/blocktank-worker2';
import { Express } from 'express';
import { z } from "zod";
import { validateRequest, TypedRequestBody } from 'zod-express-middleware';
import { Order } from '../../../1_database/entities/Order.entity';
import { OrderStateEnum } from '../../../1_database/entities/OrderStateEnum';
import { OrderService } from '../../../2_services/OrderService';
import { parseConnectionString } from '@synonymdev/ln-constr-parser';



const postChannelsRequest = z.object({
  lspBalanceSat: z.number().int().lte(Number.MAX_SAFE_INTEGER).gte(0),
  clientBalanceSat: z.number().int().lte(Number.MAX_SAFE_INTEGER).gte(0),
  channelExpiryWeeks: z.number().int().gte(1).lte(53),
  couponCode: z.string().max(512).optional(),
  refundOnchainAddress: z.string().max(512).optional()
}).refine(obj => {
  return !(obj.lspBalanceSat < obj.clientBalanceSat)
}, {
  message: 'clientBalanceSat MUST be less than lspBalanceSat.',
  path: [
    'lspBalanceSat',
    'clientBalanceSat'
  ],
})

const postChannelOpenRequest = z.object({
  connectionString: z.string().refine(value => {
    try {
      return parseConnectionString(value)
    } catch (e) {
      return false
    }
  }, {
    message: 'Invalid connection string.'
  }),
  announceChannel: z.boolean()
})

const postChannelRefundRequest = z.object({
  onchainAddress: z.string()
})



export async function setupChannels(express: Express) {

  /**
   * Create order
   */
  express.post('/channels', validateRequest({
    body: postChannelsRequest,
  }), async (req: TypedRequestBody<typeof postChannelsRequest>, res) => {
    const em = BlocktankDatabase.createEntityManager()
    const repo = em.getRepository(Order)

    const data = req.body
    const order = await repo.createByBalance(data.lspBalanceSat, data.clientBalanceSat, data.channelExpiryWeeks, data.couponCode, data.refundOnchainAddress)
    await em.flush()
    return res.status(201).send(order)
  })

  /**
   * Get order information
   */
  express.get('/channels/:id', validateRequest({
    params: z.object({
      id: z.string().uuid()
    }),
  }), async (req, res) => {
    const em = BlocktankDatabase.createEntityManager()
    const repo = em.getRepository(Order)

    const id = req.params.id
    const order = await repo.findOne({
      id: id
    })
    if (!order) {
      return res.status(404).send('Not found')
    }

    return res.status(200).send(order)
  })

  /**
   * Open the channel synchonously
   */
  express.post('/channels/:id/open', validateRequest({
    params: z.object({
      id: z.string().uuid()
    }),
    body: postChannelOpenRequest
  }), async (req: TypedRequestBody<typeof postChannelOpenRequest>, res) => {
    const em = BlocktankDatabase.createEntityManager()
    const repo = em.getRepository(Order)

    const id = req.params.id
    let order = await repo.findOne({
      id: id
    })
    if (!order) {
      return res.status(404).send('Not found')
    }

    if (order.state !== OrderStateEnum.PAID) {
      return res.status(412).send('Precondition Failed - To open the channel it must be in the "paid" state.')
    }

    try {
      await OrderService.openChannel(order, req.body.connectionString, req.body.announceChannel)
    } catch (e) {
      console.log('Open failed', e)
      return res.status(500).send(e)
    }

    order = await repo.findOne({
      id: id
    })
    return res.status(200).send(order)
  })

  /**
   * Add onchain refund address after order creation.
   */
  express.post('/channels/:id/refund', validateRequest({
    params: z.object({
      id: z.string().uuid()
    }),
    body: postChannelRefundRequest
  }), async (req: TypedRequestBody<typeof postChannelRefundRequest>, res) => {
    const em = BlocktankDatabase.createEntityManager()
    const repo = em.getRepository(Order)

    const id = req.params.id
    let order = await repo.findOne({
      id: id
    })
    if (!order) {
      return res.status(404).send('Not found')
    }

    const refundIsPossible = order.state == OrderStateEnum.REFUND_AVAILABLE || order.state === OrderStateEnum.CREATED || order.state === OrderStateEnum.PAID
    if (!refundIsPossible) {
      return res.status(412).send('Precondition Failed - Order is not in a state that a refund is still possible.')
    }

    order.payment.onchainRefundAddress = req.body.onchainAddress
    await em.persistAndFlush(order)
    return res.status(200).send(order)
  })

  
}