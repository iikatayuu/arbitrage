
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const rootPath = path.resolve(__dirname, '../../../')
const defaultConfigPath = path.resolve(rootPath, '.env')
const envPath = path.resolve(rootPath, '.env.development')

dotenv.config({ path: defaultConfigPath })
if (fs.existsSync(envPath)) dotenv.config({ path: envPath, override: true })

const BigNumber = require('bignumber.js')
const binance = require('./')

let market = {
  ask: new BigNumber(0),
  bid: new BigNumber(0)
}

async function start () {
  const binanceMarket = new binance.Market('BTCUSDT', true)
  binanceMarket.on('update', (ask, bid) => {
    market.ask = ask
    market.bid = bid
  })

  binanceMarket.start()
  await binanceMarket.starting.promise

  const maxNotation = new BigNumber(10000)
  const maxNotationBtc = maxNotation.dividedBy(market.ask).decimalPlaces(8, BigNumber.ROUND_FLOOR)

  // GET BALANCE
  let usdtBalance, btcBalance
  usdtBalance = await binance.getBalance('USDT')
  btcBalance = await binance.getBalance('BTC')
  console.log('Balance (USDT): %s', usdtBalance)
  console.log('Balance (BTC): %s', btcBalance)

  // BUY
  console.log('Buy test (USDT -> BTC)...')
  const usdt = await binance.calculateFee(usdtBalance)
  await binance.buy('BTCUSDT', market.bid, usdt, maxNotation, 8)

  // GET BALANCE
  usdtBalance = await binance.getBalance('USDT')
  btcBalance = await binance.getBalance('BTC')
  console.log('Balance (USDT): %s', usdtBalance)
  console.log('Balance (BTC): %s', btcBalance)

  // SELL
  console.log('Sell test (BTC -> USDT)...')
  const btc = await binance.calculateFee(btcBalance)
  await binance.sell('BTCUSDT', market.ask, btc, maxNotationBtc, 2)

  usdtBalance = await binance.getBalance('USDT')
  btcBalance = await binance.getBalance('BTC')
  console.log('Balance (USDT): %s', usdtBalance)
  console.log('Balance (BTC): %s', btcBalance)
}

start().catch(console.error)
