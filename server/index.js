
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')
const express = require('express')
const cors = require('cors')

const isProd = process.env.NODE_ENV === 'production'
const rootPath = path.resolve(__dirname, '..')
const defaultConfigPath = path.resolve(rootPath, '.env')
const envPath = path.resolve(rootPath, isProd ? '.env.local' : '.env.development')

dotenv.config({ path: defaultConfigPath })
if (fs.existsSync(envPath)) dotenv.config({ path: envPath, override: true })

const arbitrage = require('./arbitrage')
const database = require('./database')

const api = require('./api')
const ws = require('./ws')

const app = express()
const port = process.env.PORT || '3001'
const publicPath = path.resolve(__dirname, 'build')

app.use(cors())

app.use('/', express.static(publicPath))

app.use('/api', api)

app.use((req, res, next) => {
  const indexPath = path.resolve(publicPath, 'index.html')
  res.sendFile(indexPath)
})

app.use((err, req, res, next) => {
  res.status(500).json({
    success: false,
    message: err
  })
})

const server = app.listen(port, () => {
  console.log(`Server is listening on port: ${port}`)
})

server.on('upgrade', ws)

database.query('SELECT * FROM config WHERE name=\'symbol\'').then((results) => {
  const index = results.length > 0 ? parseInt(results[0].value) : 0
  arbitrage.start(index)
})
