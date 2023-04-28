
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
    buyUsd: result.buy_usd,
    sellBtc: result.sell_btc,
    profit: result.profit,
    exchanges: JSON.parse(result.exchanges),
    date: result.added
  }))

  res.json({
    success: true,
    message: '',
    trades
  })
}))

module.exports = router
