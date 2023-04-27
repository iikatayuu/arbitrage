
const express = require('express')
const login = require('./api/login')

const router = express.Router()

router.use(express.json())
router.use(login)

module.exports = router
