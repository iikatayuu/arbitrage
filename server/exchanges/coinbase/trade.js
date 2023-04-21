
const axios = require('axios')
const { createSignature } = require('./utils/sign')
const wait = require('../../utils/wait')

const isProd = process.env.NODE_ENV === 'production'
const COINBASE_BASE = isProd ? 'https://api.exchange.coinbase.com' : 'https://api-public.sandbox.exchange.coinbase.com'

const TICKER_INTERVAL = parseFloat(process.env.TICKER_INTERVAL)

async function waitOrder (id) {
  return new Promise(async (resolve, reject) => {
    while (true) {
      await wait(TICKER_INTERVAL * 1000)
      const requestPath = `/orders/${id}?market_type=spot`
      const headers = createSignature('GET', requestPath)
      const res = await axios.get(`${COINBASE_BASE}${requestPath}`, {
        headers
      })

      const data = res.data
      if (data.settled && data.status === 'done') {
        resolve()
        break
      } else if (data.status === 'rejected') {
        reject()
        break
      }
    }
  })
}

async function buy (productId, price, quantity) {
  const requestPath = '/orders'
  const body = {
    type: 'limit',
    side: 'buy',
    product_id: productId,
    price,
    size: quantity
  }

  const headers = createSignature('POST', requestPath, body)
  const res = await axios.post(`${COINBASE_BASE}${requestPath}`, body, {
    headers
  })

  const id = res.data.id
  await waitOrder(id)
}

async function sell (productId, price, quantity) {
  const requestPath = '/orders'
  const body = {
    type: 'limit',
    side: 'sell',
    product_id: productId,
    price,
    size: quantity
  }

  const headers = createSignature('POST', requestPath, body)
  const res = await axios.post(`${COINBASE_BASE}${requestPath}`, body, {
    headers
  })

  const id = res.data.id
  await waitOrder(id)
}

module.exports = { buy, sell }
