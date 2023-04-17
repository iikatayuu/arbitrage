
const BigNumber = require('bignumber.js')
const client = require('./utils/spot')
const wait = require('../../utils/wait')

const TICKER_INTERVAL = parseFloat(process.env.TICKER_INTERVAL)

async function waitOrder (symbol, orderId) {
  return new Promise(async (resolve, reject) => {
    console.log('Waiting for Binance order: %s', orderId)
    while (true) {
      await wait(TICKER_INTERVAL * 1000)
      const orderRes = await client.getOrder(symbol, { orderId })
      const order = orderRes.data
      if (order.status === 'FILLED') {
        resolve()
        break
      } else if (
        order.status === 'CANCELED' ||
        order.status === 'REJECTED' ||
        order.status === 'EXPIRED' ||
        order.status === 'EXPIRED_IN_MATCH'
      ) {
        reject()
        break
      }
    }
  })
}

async function normalize (symbol, quantity) {
  const infoRes = await client.exchangeInfo({ symbol })
  const info = infoRes.data
  const symbolInfo = info.symbols[0]
  const filters = symbolInfo.filters
  let stepSize = new BigNumber(0)

  for (let i = 0; i < filters.length; i++) {
    const filter = filters[i]
    if (filter.filterType === 'LOT_SIZE') {
      stepSize = new BigNumber(filter.stepSize)
    }
  }

  const stepDecimals = stepSize.decimalPlaces()
  return quantity.decimalPlaces(stepDecimals, BigNumber.ROUND_FLOOR)
}

async function buy (symbol, price, quantity) {
  const buyRes = await client.newOrder(symbol, 'BUY', 'LIMIT', {
    price,
    quantity,
    timeInForce: 'GTC'
  })

  const buy = buyRes.data
  await waitOrder(symbol, buy.orderId)
  return buy.orderId
}

async function sell (symbol, price, quantity) {
  const sellRes = await client.newOrder(symbol, 'SELL', 'LIMIT', {
    price,
    quantity,
    timeInForce: 'GTC'
  })

  const sell = sellRes.data
  await waitOrder(symbol, sell.orderId)
  return sell.orderId
}

module.exports = { buy, sell, normalize }
