
const { Spot } = require('@binance/connector')

const isProd = process.env.NODE_ENV === 'production'
const BINANCE_API_KEY = process.env.BINANCE_API_KEY
const BINANCE_API_SECRET = process.env.BINANCE_API_SECRET

const client = new Spot(BINANCE_API_KEY, BINANCE_API_SECRET, {
  baseURL: isProd ? 'https://api.binance.com' :  'https://testnet.binance.vision'
})

module.exports = client
