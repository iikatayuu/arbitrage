
const jwt = require('jsonwebtoken')
const markets = require('./ws/markets')

function handleWS (request, socket, head) {
  const [pathname, search] = request.url.split('?')
  const searchParams = new URLSearchParams(search)

  if (pathname === `/ws/${markets.name}`) {
    const token = searchParams.get('token')
    const jwtSecret = process.env.JWT_SECRET
    const jwtIssuer = process.env.JWT_ISSUER

    try {
      if (token === null || !token.match(/^([\w-]*\.[\w-]*\.[\w-]*)$/i)) {
        socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
        socket.destroy()
        return
      }

      jwt.verify(token, jwtSecret, {
        issuer: jwtIssuer,
        subject: 'Login Token'
      })
    } catch (error) {
      socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n')
      socket.destroy()
      return
    }

    markets.wss.handleUpgrade(request, socket, head, (ws) => {
      markets.wss.emit('connection', ws, request)
    })
  }
}

module.exports = handleWS
