
const express = require('express')
const jwt = require('jsonwebtoken')

const database = require('../database')
const asyncWrap = require('../utils/async-wrap')

const router = express.Router()

router.get('/trades', asyncWrap(async (req, res) => {
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

  const results = await database.query('SELECT * FROM trades ORDER BY id DESC')
  const trades = results.map(result => ({
    buyEx: result.buy_ex,
    sellEx: result.sell_ex,
    buySymbol: result.buy_symbol,
    sellSymbol: result.sell_symbol,
    buyBid: result.buy_bid,
    sellAsk: result.sell_ask,
    buyQuote: result.buy_quote,
    sellBase: result.sell_base,
    profit: result.profit,
    date: result.added
  }))

  res.json({
    success: true,
    message: '',
    trades
  })
}))

module.exports = router
