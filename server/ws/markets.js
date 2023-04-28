
const WebSocket = require('ws')
const { WebSocketServer } = require('ws')

const arbitrage = require('../arbitrage')
const wait = require('../utils/wait')

const wss = new WebSocketServer({ noServer: true })

wss.on('connection', async (ws) => {
  ws.on('error', console.error)

  while (wss.clients.size > 0) {
    const pair = arbitrage.getPair()
    const data = JSON.stringify(pair.map((ex) => ({
      name: ex.name,
      ask: ex.ask.toNumber(),
      bid: ex.bid.toNumber()
    })))

    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data)
      }
    })

    await wait(1000)
  }
})

module.exports = {
  name: 'markets',
  wss
}
