
const express = require('express')
const login = require('./api/login')
const balances = require('./api/balances')
const trades = require('./api/trades')

const router = express.Router()

router.use(express.json())
router.use(login)
router.use(balances)
router.use(trades)

module.exports = router
