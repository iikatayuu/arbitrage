
const fs = require('fs')
const path = require('path')
const dotenv = require('dotenv')

const isProd = process.env.NODE_ENV === 'production'
const rootPath = path.resolve(__dirname, '..')
const defaultConfigPath = path.resolve(rootPath, '.env')
const envPath = path.resolve(rootPath, isProd ? '.env.local' : '.env.development')

dotenv.config({ path: defaultConfigPath })
if (fs.existsSync(envPath)) dotenv.config({ path: envPath, override: true })

const arbitrage = require('./arbitrage')
arbitrage.start()
