
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

  // GET BALANCE
  let usdtBalance, btcBalance
  usdtBalance = await binance.getBalance('USDT')
  btcBalance = await binance.getBalance('BTC')
  console.log('Balance (USDT): %s', usdtBalance)
  console.log('Balance (BTC): %s', btcBalance)

  // BUY
  const maxNotation = new BigNumber(10000)
  console.log('Buy test (USDT -> BTC)...')
  const buys = []
  const buyLoops = usdtBalance.dividedBy(maxNotation).decimalPlaces(0, BigNumber.ROUND_CEIL)
  let usdt = usdtBalance
  for (let i = 0; i < buyLoops; i++) {
    const quote = usdt.isGreaterThan(maxNotation) ? maxNotation : usdt
    const btc = quote.dividedBy(market.bid).decimalPlaces(8, BigNumber.ROUND_FLOOR)
    const btcRounded = await binance.normalize('BTCUSDT', btc)
    console.log('%s USDT -> %s BTC', quote.toString(), btcRounded.toString())
    const buy = binance.buy('BTCUSDT', market.bid.toNumber().toFixed(8), btcRounded.toNumber())
    usdt = usdt.minus(quote)
    buys.push(buy)
  }
  await Promise.all(buys)

  // GET BALANCE
  usdtBalance = await binance.getBalance('USDT')
  btcBalance = await binance.getBalance('BTC')
  console.log('Balance (USDT): %s', usdtBalance)
  console.log('Balance (BTC): %s', btcBalance)

  // SELL
  console.log('Sell test (BTC -> USDT)...')
  const maxNotationBtc = maxNotation.dividedBy(market.ask).decimalPlaces(8, BigNumber.ROUND_FLOOR)
  const sells = []
  const sellLoops = btcBalance.dividedBy(maxNotationBtc).decimalPlaces(0, BigNumber.ROUND_CEIL)
  let btc = btcBalance
  for (let i = 0; i < sellLoops; i++) {
    const base = btc.isGreaterThan(maxNotationBtc) ? maxNotationBtc : btc
    const baseRounded = await binance.normalize('BTCUSDT', base)
    const baseUsdt = baseRounded.multipliedBy(market.ask).decimalPlaces(8, BigNumber.ROUND_FLOOR)
    console.log('%s BTC -> %s USDT', baseRounded.toString(), baseUsdt.toString())
    const sell = binance.sell('BTCUSDT', market.ask.toNumber().toFixed(8), baseRounded)
    btc = btc.minus(base)
    sells.push(sell)
  }
  await Promise.all(sells)

  usdtBalance = await binance.getBalance('USDT')
  btcBalance = await binance.getBalance('BTC')
  console.log('Balance (USDT): %s', usdtBalance)
  console.log('Balance (BTC): %s', btcBalance)
}

start().catch(console.error)
