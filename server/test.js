
const path = require('path')
const configPath = path.resolve(__dirname, '../.env.local')
require('dotenv').config({ path: configPath })
process.env.NODE_ENV = 'production'

const BigNumber = require('bignumber.js')
const coinbase = require('./exchanges/coinbase')
const binance = require('./exchanges/binance')
const coinzoom = require('./exchanges/coinzoom')
const kraken = require('./exchanges/kraken')
const kucoin = require('./exchanges/kucoin')
const okx = require('./exchanges/okx')
const bittrex = require('./exchanges/bittrex')
const gemini = require('./exchanges/gemini')
const wait = require('./utils/wait')

async function start () {
  const starters = []
  const markets = [
    {
      name: 'coinbase',
      ask: new BigNumber(0),
      bid: new BigNumber(0)
    },
    {
      name: 'binance',
      ask: new BigNumber(0),
      bid: new BigNumber(0)
    },
    {
      name: 'coinzoom',
      ask: new BigNumber(0),
      bid: new BigNumber(0)
    },
    {
      name: 'kraken',
      ask: new BigNumber(0),
      bid: new BigNumber(0)
    },
    {
      name: 'kucoin',
      ask: new BigNumber(0),
      bid: new BigNumber(0)
    },
    {
      name: 'okx',
      ask: new BigNumber(0),
      bid: new BigNumber(0)
    },
    {
      name: 'bittrex',
      ask: new BigNumber(0),
      bid: new BigNumber(0)
    },
    {
      name: 'gemini',
      ask: new BigNumber(0),
      bid: new BigNumber(0)
    }
  ]

  const coinbaseMarket = new coinbase.Market('BTC-USDT', true)
  coinbaseMarket.on('update', (ask, bid) => {
    markets[0].ask = ask
    markets[0].bid = bid
  })
  starters.push(coinbaseMarket.starting)
  coinbaseMarket.start()

  const binanceMarket = new binance.Market('BTCUSDT', true)
  binanceMarket.on('update', (ask, bid) => {
    markets[1].ask = ask
    markets[1].bid = bid
  })
  starters.push(binanceMarket.starting)
  binanceMarket.start()

  const coinzoomMarket = new coinzoom.Market('BTC/USDT', true)
  coinzoomMarket.on('update', (ask, bid) => {
    markets[2].ask = ask
    markets[2].bid = bid
  })
  starters.push(coinzoomMarket.starting)
  coinzoomMarket.start()

  const krakenMarket = new kraken.Market('BTC/USDT', true)
  krakenMarket.on('update', (ask, bid) => {
    markets[3].ask = ask
    markets[3].bid = bid
  })
  starters.push(krakenMarket.starting)
  krakenMarket.start()

  const kucoinMarket = new kucoin.Market('BTC-USDT', true)
  kucoinMarket.on('update', (ask, bid) => {
    markets[4].ask = ask
    markets[4].bid = bid
  })
  starters.push(kucoinMarket.starting)
  kucoinMarket.start()

  const okxMarket = new okx.Market('BTC-USDT-SWAP', true)
  okxMarket.on('update', (ask, bid) => {
    markets[5].ask = ask
    markets[5].bid = bid
  })
  starters.push(okxMarket.starting)
  okxMarket.start()

  const bittrexMarket = new bittrex.Market('BTC-USDT', true)
  bittrexMarket.on('update', (ask, bid) => {
    markets[6].ask = ask
    markets[6].bid = bid
  })
  starters.push(bittrexMarket.starting)
  bittrexMarket.start()

  const geminiMarket = new gemini.Market('btcusdt', true)
  geminiMarket.on('update', (ask, bid) => {
    markets[7].ask = ask
    markets[7].bid = bid
  })
  starters.push(geminiMarket.starting)
  geminiMarket.start()

  console.log('Waiting for starters...')
  await Promise.all(starters)

  while (true) {
    let buyEx = null
    let secondBuyEx = null
    let sellEx = null
    let secondSellEx = null

    for (let i = 0; i < markets.length; i++) {
      const exchange = markets[i]
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
    if (sellValue.isLessThan(buyValue) || sellValue.isEqualTo(0) || buyValue.isEqualTo(0)) {
      await wait(2000)
      continue
    }

    const difference = sellValue.minus(buyValue)
    console.log('Buying from "%s" amounting "%s"', fromEx.name, buyValue.toString())
    console.log('Selling to "%s" amounting "%s"', toEx.name, sellValue.toString())
    console.log('Potential profit: %s\n', difference.toString())
    await wait(2000)
  }
}

start()
