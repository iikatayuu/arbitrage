
const express = require('express')
const jwt = require('jsonwebtoken')

const asyncWrap = require('../utils/async-wrap')

const router = express.Router()

router.post('/login', asyncWrap(async (req, res) => {
  const username = req.body.username
  const password = req.body.password
  const adminUser = process.env.ADMIN_USER
  const adminPass = process.env.ADMIN_PASS
  const jwtSecret = process.env.JWT_SECRET
  const jwtIssuer = process.env.JWT_ISSUER

  if (username === adminUser && password === adminPass) {
    const payload = { user: username }
    const token = jwt.sign(payload, jwtSecret, {
      issuer: jwtIssuer,
      subject: 'Login Token'
    })

    res.json({
      success: true,
      message: '',
      token
    })
  } else {
    res.json({
      success: false,
      message: 'Incorrect credentials',
      token: null
    })
  }
}))

module.exports = router
