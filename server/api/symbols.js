
const express = require('express')
const jwt = require('jsonwebtoken')

const arbitrage = require('../arbitrage')
const database = require('../database')
const asyncWrap = require('../utils/async-wrap')

const router = express.Router()

router.get('/symbol', asyncWrap(async (req, res) => {
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

  const results = await database.query('SELECT * FROM config WHERE name=\'symbol\'')
  const index = results.length > 0 ? parseInt(results[0].value) : 0
  const symbol = {
    base: '',
    quote: ''
  }

  if (index === 0) {
    symbol.base = 'BTC'
    symbol.quote = 'USD'
  } else if (index === 1) {
    symbol.base = 'ETH'
    symbol.quote = 'USD'
  }

  res.json({
    success: true,
    message: '',
    symbol
  })
}))

router.post('/symbol', asyncWrap(async (req, res) => {
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

  const index = req.body.index
  await database.query('UPDATE config SET value=? WHERE name=\'symbol\'', [index])

  arbitrage.stop()
  arbitrage.start(index)
  res.json({
    success: true,
    message: ''
  })
}))

module.exports = router
