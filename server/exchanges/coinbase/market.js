
const EventEmitter = require('events').EventEmitter
const axios = require('axios').default
const cron = require('node-cron')
const BigNumber = require('bignumber.js')
const Deferred = require('../../classes/Deferred')

const isProd = process.env.NODE_ENV === 'production'
const TICKER_INTERVAL = parseFloat(process.env.TICKER_INTERVAL)
const COINBASE_BASE = isProd ? 'https://api.pro.coinbase.com' : 'https://api-public.sandbox.pro.coinbase.com'

class CoinbaseMarket extends EventEmitter {
  constructor (productId, verbose = false) {
    super()

    this.verbose = verbose
    this.productId = productId
    this.task = null
    this.started = false
    this.starting = new Deferred()
  }

  start () {
    if (this.task !== null) return

    const verbose = this.verbose
    const productId = this.productId
    if (verbose) console.log('Coinbase market has started')

    this.task = cron.schedule(`*/${TICKER_INTERVAL} * * * * *`, async () => {
      const timestamp = Math.floor(Date.now() / 1000).toString()
      const params = new URLSearchParams()
      params.set('t', timestamp)
      const url = `${COINBASE_BASE}/products/${productId}/ticker?${params.toString()}`

      try {
        const res = await axios.get(url, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        })
        const data = res.data
        const ask = new BigNumber(data.ask)
        const bid = new BigNumber(data.bid)

        if (!this.started) {
          this.started = true
          this.starting.resolve()
        }

        this.emit('update', ask, bid)
      } catch (error) {
        if (verbose) console.error('An error occured (Coinbase market): %s', error)
        this.emit('error', error)
        this.stop()
      }
    })
  }

  stop () {
    const verbose = this.verbose
    if (verbose) console.log('Coinbase market is stopping')

    this.task.stop()
    this.task = null
    this.emit('stop')
  }
}

module.exports = CoinbaseMarket
