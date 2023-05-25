
const express = require('express')
const jwt = require('jsonwebtoken')

const binance = require('../exchanges/binance')
const coinbase = require('../exchanges/coinbase')
const asyncWrap = require('../utils/async-wrap')

const router = express.Router()

router.get('/balances', asyncWrap(async (req, res) => {
  const auth = req.get('Authorization')
  const jwtSecret = process.env.JWT_SECRET
  const jwtIssuer = process.env.JWT_ISSUER

  try {
    if (!auth.match(/^(Bearer ([\w-]*\.[\w-]*\.[\w-]*))$/i)) throw new Error('Invalid token')

    const token = auth.split(' ')[1]
    jwt.verify(token, jwtSecret, {
      issuer: jwtIssuer,
      subject: 'Login Token'
    })
  } catch (error) {
    res.json({
      success: false,
      message: 'Invalid token'
    })
    return
  }

  const coinbaseUsd = await coinbase.getBalance('USD')
  const coinbaseBtc = await coinbase.getBalance('BTC')
  const coinbaseEth = await coinbase.getBalance('ETH')
  const binanceUsdt = await binance.getBalance('USDT')
  const binanceBtc = await binance.getBalance('BTC')
  const binanceEth = await binance.getBalance('ETH')

  res.json({
    success: true,
    message: '',
    balances: [
      {
        usd: coinbaseUsd.toNumber(),
        btc: coinbaseBtc.toNumber(),
        eth: coinbaseEth.toNumber()
      },
      {
        usdt: binanceUsdt.toNumber(),
        btc: binanceBtc.toNumber(),
        eth: binanceEth.toNumber()
      }
    ]
  })
}))

module.exports = router
