
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

async function buy (symbol, price, quote, maxQuote, baseDp) {
  const buys = []
  const buyLoops = quote.dividedBy(maxQuote).decimalPlaces(0, BigNumber.ROUND_CEIL)
  let balance = quote
  for (let i = 0; i < buyLoops; i++) {
    const step = balance.isGreaterThan(maxQuote) ? maxQuote : balance
    const base = step.dividedBy(price).decimalPlaces(baseDp, BigNumber.ROUND_FLOOR)
    const baseRounded = await normalize(symbol, base)
    console.log('Symbol (%s): %s -> %s', symbol, step.toString(), baseRounded.toString())

    const buy = client.newOrder(symbol, 'BUY', 'LIMIT', {
      price,
      quantity: baseRounded,
      timeInForce: 'GTC'
    })

    balance = balance.minus(step)
    buys.push(buy)
  }

  const responses = await Promise.all(buys)
  const orders = []
  for (let i = 0; i < responses.length; i++) {
    const data = responses[i].data
    const order = waitOrder(symbol, data.orderId)
    orders.push(order)
  }

  await Promise.all(orders)
}

async function sell (symbol, price, base, maxBase, baseDp) {
  const sells = []
  const sellLoops = base.dividedBy(maxBase).decimalPlaces(0, BigNumber.ROUND_CEIL)
  let balance = base
  for (let i = 0; i < sellLoops; i++) {
    const step = balance.isGreaterThan(maxBase) ? maxBase : balance
    const stepRounded = await normalize('BTCUSDT', step)
    const stepQuote = stepRounded.multipliedBy(price).decimalPlaces(baseDp, BigNumber.ROUND_FLOOR)
    console.log('Symbol (%s): %s -> %s', symbol, stepRounded.toString(), stepQuote.toString())
    const sell = client.newOrder(symbol, 'SELL', 'LIMIT', {
      price,
      quantity: stepRounded,
      timeInForce: 'GTC'
    })

    balance = balance.minus(step)
    sells.push(sell)
  }

  const responses = await Promise.all(sells)
  const orders = []
  for (let i = 0; i < responses.length; i++) {
    const data = responses[i].data
    const order = waitOrder(symbol, data.orderId)
    orders.push(order)
  }

  await Promise.all(orders)
}

module.exports = { buy, sell }
