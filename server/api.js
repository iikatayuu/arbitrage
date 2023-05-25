
const express = require('express')
const login = require('./api/login')
const balances = require('./api/balances')
const trades = require('./api/trades')
const symbols = require('./api/symbols')

const router = express.Router()

router.use(express.json())
router.use(login)
router.use(balances)
router.use(trades)
router.use(symbols)

module.exports = router
