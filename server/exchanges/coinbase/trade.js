
const axios = require('axios')
const { createSignature } = require('./utils/sign')
const wait = require('../../utils/wait')

const isProd = process.env.NODE_ENV === 'production'
const COINBASE_BASE = isProd ? 'https://api.pro.coinbase.com' : 'https://api-public.sandbox.pro.coinbase.com'

const TICKER_INTERVAL = parseFloat(process.env.TICKER_INTERVAL)

async function waitOrder (orderId) {
  // return new Promise(async (resolve, reject) => {
  //   while (true) {
  //     await wait(TICKER_INTERVAL * 1000)
  //     const requestPath = `/orders/${orderId}`
  //     const headers = createSignature('GET', requestPath)
  //     const res = await axios.get(`${COINBASE_BASE}${requestPath}?market_type=spot`, {
  //       headers
  //     })

  //     const data = res.data
  //     if (data.status === 'done') {
  //       resolve()
  //       break
  //     } else if (
  //       data.status === 'rejected' ||
  //       data.status === ''
  //     )
  //   }
  // })
}

async function buy (productId, price, quantity) {
  const requestPath = '/orders'
  const body = {
    type: 'limit',
    side: 'buy',
    product_id: productId,
    price,
    size: quantity,
    post_only: true
  }

  const headers = createSignature('POST', requestPath, body)
  const res = await axios.post(`${COINBASE_BASE}${requestPath}`, body, {
    headers
  })

  console.log(res.data)
}

async function sell () {}

module.exports = { buy, sell }
