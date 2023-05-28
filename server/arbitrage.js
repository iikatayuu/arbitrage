
const BigNumber = require('bignumber.js')
const coinbase = require('./exchanges/coinbase')
const binance = require('./exchanges/binance')
const database = require('./database/')
const wait = require('./utils/wait')

const ARBITRAGE_MIN_DIFF = parseFloat(process.env.ARBITRAGE_MIN_DIFF)
const ARBITRAGE_INTERVAL = parseFloat(process.env.ARBITRAGE_INTERVAL)

const isVerbose = process.env.VERBOSE !== ''
let pair = []

function hasStopped () {
  for (let i = 0; i < pair.length; i++) {
    if (pair.stopped) return true
  }

  return !(pair.length > 0)
}

function getPair () {
  return pair
}

function stop () {
  for (let i = 0; i < pair.length; i++) {
    const market = pair[i].market
    market.stop()
  }

  pair = []
}

async function start (symbolIdx) {
  const promises = []
  const coinbaseSymbols = [
    {
      symbol: 'BTC-USD',
      base: 'BTC',
      baseDecimals: 8,
      quote: 'USD',
      quoteDecimals: 2
    },
    {
      symbol: 'ETH-USD',
      base: 'ETH',
      baseDecimals: 8,
      quote: 'USD',
      quoteDecimals: 2
    }
  ]

  const binanceSymbols = [
    {
      symbol: 'BTCUSDT',
      base: 'BTC',
      baseDecimals: 8,
      quote: 'USDT',
      quoteDecimals: 2
    },
    {
      symbol: 'ETHUSDT',
      base: 'ETH',
      baseDecimals: 8,
      quote: 'USDT',
      quoteDecimals: 2
    }
  ]

  const coinbaseSymbol = coinbaseSymbols[symbolIdx]
  const binanceSymbol = binanceSymbols[symbolIdx]
  const markets = [
    {
      object: coinbase,
      ...coinbaseSymbol
    },
    {
      object: binance,
      ...binanceSymbol
    }
  ]

  for (let i = 0; i < markets.length; i++) {
    const exchangeMarket = markets[i]
    const exchange = exchangeMarket.object
    const symbol = exchangeMarket.symbol
    const base = exchangeMarket.base
    const baseDecimals = exchangeMarket.baseDecimals
    const quote = exchangeMarket.quote
    const quoteDecimals = exchangeMarket.quoteDecimals
    const market = new exchange.Market(symbol, isVerbose)
    pair.push({
      name: exchange.name,
      symbol,
      quote,
      quoteDecimals,
      base,
      baseDecimals,
      market,
      buy: exchange.buy,
      sell: exchange.sell,
      getMaxNotation: exchange.getMaxNotation,
      getBalance: exchange.getBalance,
      calculateFee: exchange.calculateFee,
      stopped: false,
      ask: new BigNumber(0),
      bid: new BigNumber(0),
      timestamp: 0
    })

    market.on('update', (ask, bid) => {
      pair[i].timestamp = Math.floor(Date.now() / 1000)
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

  const exa = pair[0]
  const exb = pair[1]
  const diffA = exa.ask.minus(exb.bid)
  const diffB = exb.ask.minus(exa.bid)

  if (diffA.isGreaterThan(diffB)) {
    buyEx = exb
    sellEx = exa
  } else {
    buyEx = exa
    sellEx = exb
  }

  if (isVerbose) console.log('Calculating balances and fees')
  const buyQuoteBal = await buyEx.getBalance(buyEx.quote)
  const buyQuote = await buyEx.calculateFee(buyQuoteBal)
  const buyBase = buyQuote.dividedBy(buyEx.bid)
  const sellBaseBal = await sellEx.getBalance(sellEx.base)
  const sellBase = await sellEx.calculateFee(sellBaseBal)
  const sellQuoteBal = buyBase.multipliedBy(sellEx.ask)
  const sellQuote = await sellEx.calculateFee(sellQuoteBal)
  const difference = sellQuote.minus(buyQuote)

  if (
    sellBase.isLessThan(buyBase) ||
    buyQuote.isLessThanOrEqualTo(2.5) ||
    sellQuote.isLessThanOrEqualTo(2.5) ||
    difference.isLessThan(ARBITRAGE_MIN_DIFF)
  ) {
    console.log('No balance or not enough profit')
    return
  }

  const promises = []
  const buyMaxNotation = buyEx.getMaxNotation(buyEx.symbol)
  if (isVerbose) console.log('Executing buy from %s', buyEx.name)
  promises.push(buyEx.buy(buyEx.symbol, buyEx.bid, buyQuote, buyMaxNotation, buyEx.baseDecimals))

  const sellMaxNotation = sellEx.getMaxNotation(sellEx.symbol)
  const sellMaxNotationBase = sellMaxNotation.dividedBy(sellEx.ask).decimalPlaces(sellEx.baseDecimals, BigNumber.ROUND_FLOOR)
  console.log('Executing sell from %s', sellEx.name)
  promises.push(sellEx.sell(sellEx.symbol, sellEx.ask, buyBase, sellMaxNotationBase, sellEx.quoteDecimals))

  if (isVerbose) console.log('Waiting for transactions...')
  await Promise.all(promises)

  if (isVerbose) console.log('Saving to database...')
  const sql = 'INSERT INTO trades (buy_ex, sell_ex, buy_symbol, sell_symbol, buy_bid, sell_ask, buy_quote, sell_base, profit) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
  const values = [
    buyEx.name,
    sellEx.name,
    buyEx.symbol,
    sellEx.symbol,
    buyEx.bid.toNumber(),
    sellEx.ask.toNumber(),
    buyQuote.toNumber(),
    buyBase.toNumber(),
    difference.toNumber()
  ]

  await database.query(sql, values)
}

module.exports = { start, stop, getPair }
