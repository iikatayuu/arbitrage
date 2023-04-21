
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const rootPath = path.resolve(__dirname, '../../../')
const defaultConfigPath = path.resolve(rootPath, '.env')
const envPath = path.resolve(rootPath, '.env.development')

dotenv.config({ path: defaultConfigPath })
if (fs.existsSync(envPath)) dotenv.config({ path: envPath, override: true })

const BigNumber = require('bignumber.js')
const coinbase = require('./')

let market = {
  ask: new BigNumber(0),
  bid: new BigNumber(0)
}

async function start () {
  const coinbaseMarket = new coinbase.Market('BTC-USD', true)
  coinbaseMarket.on('update', (ask, bid) => {
    market.ask = ask
    market.bid = bid
  })

  coinbaseMarket.start()
  await coinbaseMarket.starting.promise

  // GET BALANCE
  let usdBalance, btcBalance
  usdBalance = await coinbase.getBalance('USD')
  btcBalance = await coinbase.getBalance('BTC')
  console.log('Balance (USD): %s', usdBalance)
  console.log('Balance (BTC): %s', btcBalance)

  // BUY
  console.log('Buy test (USD -> BTC)...')
  const usd = await coinbase.calculateFee(new BigNumber(usdBalance.decimalPlaces(2, BigNumber.ROUND_FLOOR)))
  const btc = usd.dividedBy(market.bid).decimalPlaces(8, BigNumber.ROUND_FLOOR)
  console.log('%s USD (%s USD per BTC) -> %s BTC', usd.toString(), market.bid.toString(), btc.toString())
  await coinbase.buy('BTC-USD', market.bid.toNumber(), btc.toNumber())

  // GET BALANCE
  usdBalance = await coinbase.getBalance('USD')
  btcBalance = await coinbase.getBalance('BTC')
  console.log('Balance (USD): %s', usdBalance)
  console.log('Balance (BTC): %s', btcBalance)

  // SELL
  console.log('Sell test (BTC -> USDT)...')
  const sellUsdFull = btcBalance.multipliedBy(market.ask).decimalPlaces(2, BigNumber.ROUND_FLOOR)
  const sellUsd = await coinbase.calculateFee(sellUsdFull)
  const sellBtc = sellUsd.dividedBy(market.ask).decimalPlaces(8, BigNumber.ROUND_FLOOR)
  console.log('%s USD (%s USD per BTC) -> %s BTC', sellUsd.toString(), market.ask.toString(), sellBtc.toString())
  await coinbase.sell('BTC-USD', market.ask.toNumber(), sellBtc.toNumber())

  usdBalance = await coinbase.getBalance('USD')
  btcBalance = await coinbase.getBalance('BTC')
  console.log('Balance (USD): %s', usdBalance)
  console.log('Balance (BTC): %s', btcBalance)
}

start().catch(console.error)
