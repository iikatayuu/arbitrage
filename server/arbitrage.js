
const BigNumber = require('bignumber.js')
const coinbase = require('./exchanges/coinbase')
const binance = require('./exchanges/binance')
const wait = require('./utils/wait')

const ARBITRAGE_MIN_DIFF = parseFloat(process.env.ARBITRAGE_MIN_DIFF)
const ARBITRAGE_INTERVAL = parseFloat(process.env.ARBITRAGE_INTERVAL)

const isVerbose = process.env.VERBOSE !== ''
const pair = []

function hasStopped () {
  for (let i = 0; i < pair.length; i++) {
    if (pair.stopped) return true
  }

  return false
}

async function start () {
  const promises = []
  const markets = [
    {
      object: coinbase,
      symbol: 'BTC-USD',
      base: 'BTC',
      quote: 'USD'
    },
    {
      object: binance,
      symbol: 'BTCUSDT',
      base: 'BTC',
      quote: 'USDT'
    }
  ]

  for (let i = 0; i < markets.length; i++) {
    const exchangeMarket = markets[i]
    const exchange = exchangeMarket.object
    const symbol = exchangeMarket.symbol
    const base = exchangeMarket.base
    const quote = exchangeMarket.quote
    const market = new exchange.Market(symbol, isVerbose)
    pair.push({
      name: exchange.name,
      symbol,
      quote,
      base,
      buy: exchange.buy,
      sell: exchange.sell,
      getMaxNotation: exchange.getMaxNotation,
      getBalance: exchange.getBalance,
      calculateFee: exchange.calculateFee,
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

    market.start()
    promises.push(market.starting.promise)
  }

  await Promise.all(promises)
  while (!hasStopped()) {
    await arbitrage()
    await wait(ARBITRAGE_INTERVAL)
  }
}

async function arbitrage () {
  let buyEx = null
  let sellEx = null
  let diff = null

  const exa = pair[0]
  const exb = pair[1]
  const diffA = exa.ask.minus(exb.bid)
  const diffB = exb.ask.minus(exa.bid)

  if (diffA.isGreaterThan(diffB)) {
    buyEx = exb
    sellEx = exa
    diff = diffA
  } else {
    buyEx = exa
    sellEx = exb
    diff = diffB
  }

  if (isVerbose) console.log('Calculating balances and fees')
  const buyUsdBal = await buyEx.getBalance(buyEx.quote)
  const buyUsd = await buyEx.calculateFee(buyUsdBal)
  const sellBtcBal = await sellEx.getBalance(sellEx.base)
  const sellUsdBal = sellBtcBal.multipliedBy(sellEx.ask)
  const sellUsd = await sellEx.calculateFee(sellUsdBal)
  const sellBtc = sellUsd.dividedBy(sellEx.ask)
  const difference = sellUsd.minus(buyUsd)

  if (
    buyUsd.isLessThanOrEqualTo(2.5) ||
    sellUsd.isLessThanOrEqualTo(2.5) ||
    difference.isLessThan(ARBITRAGE_MIN_DIFF)
  ) return

  const promises = []
  const buyMaxNotation = buyEx.getMaxNotation(buyEx.symbol)
  if (isVerbose) console.log('Executing buy from %s', buyEx.name)
  promises.push(buyEx.buy(buyEx.symbol, buyEx.bid, buyUsd, buyMaxNotation, 8))

  const sellMaxNotation = sellEx.getMaxNotation(sellEx.symbol)
  const sellMaxNotationBtc = sellMaxNotation.dividedBy(sellEx.ask).decimalPlaces(8, BigNumber.ROUND_FLOOR)
  console.log('Executing sell from %s', sellEx.name)
  promises.push(sellEx.sell(sellEx.symbol, sellEx.ask, sellBtc, sellMaxNotationBtc, 2))

  await Promise.all(promises)
}

module.exports = { start }
