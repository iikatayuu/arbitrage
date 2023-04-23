
const Market = require('./market')
const { getBalance, calculateFee } = require('./account')
const { buy, sell, getMaxNotation } = require('./trade')

module.exports = {
  name: 'coinbase',
  buy,
  sell,
  getMaxNotation,
  getBalance,
  calculateFee,
  Market
}
