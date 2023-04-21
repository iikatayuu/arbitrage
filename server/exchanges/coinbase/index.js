
const Market = require('./market')
const { getBalance, calculateFee } = require('./account')
const { buy, sell } = require('./trade')

module.exports = {
  name: 'coinbase',
  buy,
  sell,
  getBalance,
  calculateFee,
  Market
}
