
const express = require('express')
const login = require('./api/login')
const balances = require('./api/balances')

const router = express.Router()

router.use(express.json())
router.use(login)
router.use(balances)

module.exports = router
