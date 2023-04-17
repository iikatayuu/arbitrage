
const Market = require('./market')
const { getBalance, getFees } = require('./account')
const { buy, sell } = require('./trade')

module.exports = {
  name: 'coinbase',
  buy,
  sell,
  getBalance,
  getFees,
  Market
}
