
const mysql = require('mysql')

const connection = mysql.createConnection({
  host: process.env.MYSQL_HOST,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASS,
  database: process.env.MYSQL_DATABASE
})

const connectAsync = new Promise((resolve, reject) => {
  connection.connect((err) => {
    if (err) {
      console.error(err)
      reject(err)
      return
    }

    resolve()
  })
})

async function query (sql, data) {
  await connectAsync
  return new Promise((resolve, reject) => {
    connection.query(sql, data, (err, results, fields) => {
      if (err) {
        console.error(err)
        reject(err)
        return
      }

      resolve(results)
    })
  })
}

module.exports = { query }
