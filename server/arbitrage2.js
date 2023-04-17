
const BigNumber = require('bignumber.js')
const coinbase = require('./exchanges/coinbase')
const binance = require('./exchanges/binance')
const wait = require('./utils/wait')

const ARBITRAGE_MIN_DIFF = parseFloat(process.env.ARBITRAGE_MIN_DIFF)
const ARBITRAGE_INTERVAL = parseFloat(process.env.ARBITRAGE_INTERVAL)
const ARBITRAGE_HOLDER = process.env.ARBITRAGE_HOLDER

const isVerbose = process.env.VERBOSE === '1'
const pair = []
let holderExIndex = -1

async function start () {
  const promises = []
  const markets = [
    {
      object: coinbase,
      symbol: 'BTC-USDT'
    },
    {
      object: binance,
      symbol: 'BTCUSDT'
    }
  ]

  for (let i = 0; i < markets.length; i++) {
    const exchangeMarket = markets[i]
    const exchange = exchangeMarket.object
    const symbol = exchangeMarket.symbol
    const market = new exchange.Market(symbol, isVerbose)
    pair.push({
      name: exchange.name,
      buy: exchange.buy,
      sell: exchange.sell,
      transfer: exchange.transfer,
      getBalance: exchange.getBalance,
      getReceiver: exchange.getReceiver,
      waitDeposit: exchange.waitDeposit,
      stopped: false,
      ask: new BigNumber(0),
      bid: new BigNumber(0)
    })

    market.on('update', (ask, bid) => {
      if (ask.c !== null) pair[i].ask = ask
      if (bid.c !== null) pair[i].bid = bid
    })
  
    market.on('stop', () => {
      pair[i].stopped = true
    })

    promises.push(market.starting.promise)
    market.start()

    if (ARBITRAGE_HOLDER === exchange.name) holderExIndex = i
  }

  if (holderExIndex < 0) {
    throw new Error('ARBITRAGE_HOLDER is not a valid holder')
  }

  await Promise.all(promises)
  while (!hasStopped()) {
    await arbitrage()
    await wait(ARBITRAGE_INTERVAL)
  }
}

function hasStopped () {
  let running = 0
  for (let i = 0; i < pair.length; i++) {
    const exchange = pair[i]
    if (!exchange.stopped) running++
  }

  return running < 2
}

async function arbitrage () {
  let buyEx = null
  let secondBuyEx = null
  let sellEx = null
  let secondSellEx = null

  for (let i = 0; i < pair.length; i++) {
    const exchange = pair[i]
    if (buyEx === null || exchange.bid.isLessThan(buyEx.bid)) {
      secondBuyEx = buyEx
      buyEx = exchange
    } else if (secondBuyEx === null || exchange.bid.isLessThan(secondBuyEx.bid)) {
      secondBuyEx = exchange
    }

    if (sellEx === null || exchange.ask.isGreaterThan(sellEx.ask)) {
      secondSellEx = sellEx
      sellEx = exchange
    } else if (secondSellEx === null || exchange.ask.isGreaterThan(secondSellEx.ask)) {
      secondSellEx = exchange
    }
  }

  let fromEx = buyEx
  let toEx = sellEx
  if (buyEx.name === sellEx.name) {
    const diffA = sellEx.ask.minus(secondBuyEx.bid).toNumber()
    const diffB = secondSellEx.ask.minus(buyEx.bid).toNumber()
    if (diffA > diffB) fromEx = secondBuyEx
    else if (diffA < diffB) toEx = secondSellEx
  }

  const buyValue = fromEx.bid
  const sellValue = toEx.ask
  if (sellValue.isLessThan(buyValue) || sellValue.isEqualTo(0) || buyValue.isEqualTo(0)) return

  // Calculate the difference then trigger strategy based on that
  const difference = sellValue.minus(buyValue)

  // Check holder's balance
  const holderEx = pair[holderExIndex]

  if (isVerbose) console.log('Getting holder\'s balance...')
  const balance = await holderEx.getBalance('USDT')
  let leftBalance = balance
  if (balance <= 0) throw new Error('Holder do not have balance')

  // Transfer the holder's balance to exchange we're buying from
  if (holderEx.name !== fromEx.name) {
    const receiver = await fromEx.getReceiver('USDT')
    if (isVerbose) console.log('Transferring from "%s" to "%s" (address "%s")', holderEx.name, fromEx.name, receiver)
    const fee = await holderEx.transfer(receiver, 'USDT', balance)
    leftBalance -= fee
    await fromEx.waitDeposit('USDT', leftBalance)
  }

  console.log('From exchange "%s": %d', fromEx.name, buyValue.toNumber())
  console.log('To exchange "%s": %d', toEx.name, sellValue.toNumber())
  console.log('Difference: %d\n', difference.toNumber())

  if (difference.isGreaterThan(ARBITRAGE_MIN_DIFF)) {
  }
}

module.exports = { start }
