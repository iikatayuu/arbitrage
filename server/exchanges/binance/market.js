
const EventEmitter = require('events').EventEmitter
const axios = require('axios').default
const cron = require('node-cron')
const BigNumber = require('bignumber.js')
const Deferred = require('../../classes/Deferred')

const TICKER_INTERVAL = parseFloat(process.env.TICKER_INTERVAL)
const isProd = process.env.NODE_ENV === 'production'
const BINANCE_BASE = isProd ? 'https://data.binance.com' : 'https://testnet.binance.vision'

class BinanceMarket extends EventEmitter {
  constructor (symbol, verbose = false) {
    super()

    this.symbol = symbol
    this.verbose = verbose
    this.task = null
    this.started = false
    this.starting = new Deferred()
  }

  start () {
    if (this.task !== null) return

    const verbose = this.verbose
    const symbol = this.symbol
    if (verbose) console.log('Binance market has started')

    this.task = cron.schedule(`*/${TICKER_INTERVAL} * * * * *`, async () => {
      const params = new URLSearchParams()
      params.set('symbol', symbol)
      const url = `${BINANCE_BASE}/api/v3/ticker/bookTicker?${params.toString()}`

      try {
        const res = await axios.get(url, {
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            Pragma: 'no-cache',
            Expires: '0'
          }
        })
        const data = res.data
        const ask = new BigNumber(data.askPrice)
        const bid = new BigNumber(data.bidPrice)

        if (!this.started) {
          this.started = true
          this.starting.resolve()
        }

        this.emit('update', ask, bid)
      } catch (error) {
        if (verbose) console.error('An error occured (Binance market): %s', error.request)
        this.emit('error', error)
        this.stop()
      }
    })
  }

  stop () {
    const verbose = this.verbose
    if (verbose) console.log('Binance market is stopping')

    this.task.stop()
    this.task = null
    this.emit('stop')
  }
}

module.exports = BinanceMarket
