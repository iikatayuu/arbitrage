
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
  const usd = await coinbase.calculateFee(usdBalance)
  await coinbase.buy('BTC-USD', market.bid, usd, undefined, 8)

  // GET BALANCE
  usdBalance = await coinbase.getBalance('USD')
  btcBalance = await coinbase.getBalance('BTC')
  console.log('Balance (USD): %s', usdBalance)
  console.log('Balance (BTC): %s', btcBalance)

  // SELL
  console.log('Sell test (BTC -> USDT)...')
  const btc = await coinbase.calculateFee(btcBalance)
  await coinbase.sell('BTC-USD', market.ask, btc, undefined, 2)

  usdBalance = await coinbase.getBalance('USD')
  btcBalance = await coinbase.getBalance('BTC')
  console.log('Balance (USD): %s', usdBalance)
  console.log('Balance (BTC): %s', btcBalance)
}

start().catch(console.error)
