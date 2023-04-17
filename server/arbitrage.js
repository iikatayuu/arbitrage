
const BigNumber = require('bignumber.js')
const coinbase = require('./exchanges/coinbase')
const binance = require('./exchanges/binance')
const wait = require('./utils/wait')

const ARBITRAGE_MIN_DIFF = parseFloat(process.env.ARBITRAGE_MIN_DIFF)
const ARBITRAGE_INTERVAL = parseFloat(process.env.ARBITRAGE_INTERVAL)

const isVerbose = process.env.VERBOSE !== ''
const pair = []

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
      getBalance: exchange.getBalance,
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

async function arbitrage () {
}
