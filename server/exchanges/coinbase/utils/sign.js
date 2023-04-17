
const crypto = require('crypto')

const COINBASE_API_KEY = process.env.COINBASE_API_KEY
const COINBASE_API_SECRET = process.env.COINBASE_API_SECRET
const COINBASE_API_PASSPHRASE = process.env.COINBASE_API_PASSPHRASE

function createSignature (method, path, body = '') {
  const timestamp = Math.floor(Date.now() / 1000).toString()
  const bodyStr = typeof body === 'string' ? body : JSON.stringify(body)
  const message = timestamp + method + path + bodyStr
  const key = Buffer.from(COINBASE_API_SECRET, 'base64')
  const signature = crypto.createHmac('sha256', key).update(message).digest('base64')

  return {
    'CB-ACCESS-KEY': COINBASE_API_KEY,
    'CB-ACCESS-SIGN': signature,
    'CB-ACCESS-TIMESTAMP': timestamp,
    'CB-ACCESS-PASSPHRASE': COINBASE_API_PASSPHRASE
  }
}

module.exports = { createSignature }