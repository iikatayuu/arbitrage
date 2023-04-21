
const fs = require('fs')
const path = require('path')
const axios = require('axios')
const dotenv = require('dotenv')

const rootPath = path.resolve(__dirname, '../../../')
const defaultConfigPath = path.resolve(rootPath, '.env')
const envPath = path.resolve(rootPath, '.env.development')

dotenv.config({ path: defaultConfigPath })
if (fs.existsSync(envPath)) dotenv.config({ path: envPath, override: true })

const isProd = process.env.NODE_ENV === 'production'
const COINBASE_BASE = isProd ? 'https://api.pro.coinbase.com' : 'https://api-public.sandbox.pro.coinbase.com'

const { createSignature } = require('./utils/sign')

async function getOrders () {
  const requestPath = '/orders?status=open&status=pending'
  const headers = createSignature('GET', requestPath)
  const res = await axios.get(`${COINBASE_BASE}${requestPath}`, {
    headers
  })

  return res.data
}

async function start () {
  const orders = await getOrders()
  for (let i = 0; i < orders.length; i++) {
    const order = orders[i]
    const requestPath = `/orders/${order.id}`
    const headers = createSignature('DELETE', requestPath)
    const res = await axios.delete(`${COINBASE_BASE}${requestPath}`, {
      headers
    })

    console.log(res.data)
  }
}

start()
