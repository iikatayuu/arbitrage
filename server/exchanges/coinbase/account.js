
const axios = require('axios').default
const BigNumber = require('bignumber.js')
const { createSignature } = require('./utils/sign')

const isProd = process.env.NODE_ENV === 'production'
const COINBASE_BASE = isProd ? 'https://api.pro.coinbase.com' : 'https://api-public.sandbox.pro.coinbase.com'

async function getBalance (currency) {
  const requestPath = '/accounts'
  const headers = createSignature('GET', requestPath)
  const res = await axios.get(`${COINBASE_BASE}${requestPath}`, {
    headers
  })

  let balance = new BigNumber(0)
  for (let i = 0; i < res.data.length; i++) {
    const account = res.data[i]
    if (account.currency === currency) {
      balance = new BigNumber(account.balance)
      break
    }
  }

  return balance
}

async function calculateFee (amount) {
  const amountBN = new BigNumber(amount)
  const requestPath = '/fees'
  const headers = createSignature('GET', requestPath)
  const res = await axios.get(`${COINBASE_BASE}${requestPath}`, {
    headers
  })

  const fee = new BigNumber(res.data.taker_fee_rate)
  return amountBN.minus(amountBN.multipliedBy(fee))
}

module.exports = { getBalance, calculateFee }
