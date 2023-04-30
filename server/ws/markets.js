
const WebSocket = require('ws')
const { WebSocketServer } = require('ws')

const arbitrage = require('../arbitrage')

const wss = new WebSocketServer({ noServer: true })

wss.on('connection', (ws) => {
  ws.on('error', console.error)
})

async function broadcastMarket () {
  const pair = arbitrage.getPair()
  const timestamp = Date.now()
  const data = JSON.stringify(pair.map((ex) => ({
    name: ex.name,
    ask: ex.ask.toNumber(),
    bid: ex.bid.toNumber(),
    timestamp
  })))

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(data)
    }
  })
}

setInterval(broadcastMarket, 1000)

module.exports = {
  name: 'markets',
  wss
}
