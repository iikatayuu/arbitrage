
const Market = require('./market')
const { getBalance, getFees } = require('./account')
const { buy, sell, normalize } = require('./trade')

module.exports = {
  name: 'binance',
  buy,
  sell,
  normalize,
  getBalance,
  getFees,
  Market
}
