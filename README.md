# Crypto Arbitrage

[![GitHub](https://img.shields.io/github/license/eidoriantan/arbitrage)](https://github.com/eidoriantan/arbitrage/blob/master/LICENSE.txt)

Automate trading opportunities between crypto exchanges. Currently supports
[Binance](https://www.binance.com/en) and [Coinbase](https://www.coinbase.com/home).

### Prerequisites
 * [Node.js](https://nodejs.org)
 * MySQL Server
 * [Binance](https://www.binance.com/en) API key, secret, and passphrase
 * [Coinbase](https://www.coinbase.com/home) API key and secret

### Setting up the app
This system uses MySQL server to store the transactions history. You can just simply
run the SQL file at `setup/database.sql` in your server to set it up.

After setting up the MySQL server, you'll need to add your `.env` file. You can rename
the `.env` file to `.env.development` for development environments or `.env.local` for
production environments then update the file to your configuration.

### Running the app
In order to run this app, you'll need [Nodejs](https://nodejs.org) and `npm` installed
already in your system.

Install the dependencies then build the app by running:

```shell
npm install
npm run build
```

After installing the dependencies and building the app, you can now run it by:
```shell
npm run server
```

### Support
If you had found a bug or any unexpected behavior, you can submit an issue
through GitHub
[issues](https://github.com/eidoriantan/arbitrage/issues). If you wanted to
contribute to this repository and become a contributor, you are very welcome to
do so.
