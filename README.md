# blocktank-lsp-http

Blocktank is an LSP that allows businesses, apps, or online platforms to integrate, automate, and monetize services from your Lightning node. This includes channel configuration, channel purchases, channel info and more. This service provides a HTTP API for websites to purchase channels.


#### [Live Version](http://synonym.to/blocktank)
#### [API Docs](https://synonym.readme.io/reference/nodeinfo)


## Order expiry with onchain payments

Order expiration with onchain payments is tricky when the order is short-lived. Assuming the order expires after 30min, is paid with an onchain transaction and requires 1 confirmation, the following can happen:
There is a 5% chance that a block takes longer than 30min to be mined. In this case, blocktank will not expire the order up to 60min after. After
tx confirmation, the user will have 5min to open the channel before blocktank will expire the order.


