
const BigNumber = require('bignumber.js')
const client = require('./utils/spot')

async function getBalance (currency) {
  const accountRes = await client.account()
  const account = accountRes.data
  const balances = account.balances
  let free = new BigNumber(0)
  for (let i = 0; i < balances.length; i++) {
    const balance = balances[i]
    if (balance.asset === currency) {
      free = new BigNumber(balance.free)
      break
    }
  }

  return free
}

async function getFees () {
  return new BigNumber(0)
}

module.exports = { getBalance, getFees }
