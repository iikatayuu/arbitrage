
import React from 'react';
import { useNavigate, NavigateFunction, Navigate } from 'react-router-dom';
import {
  Chart,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import axios from 'axios';

import { MarketData, Trade, Symbol } from '../../types';
import { getTime } from '../../utils/date';
import './style.scss';

Chart.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

interface DashboardWrapProps {}

interface DashboardProps extends DashboardWrapProps {
  navigate: NavigateFunction;
}

interface DashboardState {
  markets: MarketData[][];
  trades: Trade[];
  symbol: Symbol | null;
  symbolIdx: string;
  coinbaseUsd: number;
  coinbaseBtc: number;
  coinbaseEth: number;
  binanceUsdt: number;
  binanceBtc: number;
  binanceEth: number;
}

class Dashboard extends React.Component<DashboardProps, DashboardState> {
  constructor (props: DashboardProps) {
    super(props);

    this.state = {
      markets: [],
      trades: [],
      symbol: null,
      symbolIdx: '0',
      coinbaseUsd: 0,
      coinbaseBtc: 0,
      coinbaseEth: 0,
      binanceUsdt: 0,
      binanceBtc: 0,
      binanceEth: 0
    };

    this.logout = this.logout.bind(this);
    this.changeSymbol = this.changeSymbol.bind(this);
    this.loadSymbol = this.loadSymbol.bind(this);
    this.loadBalances = this.loadBalances.bind(this);
    this.loadTrades = this.loadTrades.bind(this);
  }

  logout (event: React.MouseEvent) {
    sessionStorage.removeItem('token');
    this.props.navigate('/');
  }

  async changeSymbol (event: React.ChangeEvent) {
    const backend = process.env.REACT_APP_BACKEND_API;
    const token = sessionStorage.getItem('token');
    if (typeof backend === 'undefined' || token === null) return;

    const target = event.target as HTMLSelectElement;
    const value = target.value;

    try {
      const data = { index: value };
      const symbolRes = await axios.post(`${backend}/api/symbol`, data, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (symbolRes.data.success) await this.loadSymbol();
    } catch (error) {
      window.alert('Unable to fetch symbol');
    }
  }

  async loadSymbol () {
    const backend = process.env.REACT_APP_BACKEND_API;
    const token = sessionStorage.getItem('token');
    if (typeof backend === 'undefined' || token === null) return;

    try {
      const symbolRes = await axios.get(`${backend}/api/symbol`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      
      if (symbolRes.data.success) {
        const symbol = symbolRes.data.symbol as Symbol;
        let symbolIdx: string = '';
        if (symbol.base === 'BTC') symbolIdx = '0';
        else if (symbol.base === 'ETH') symbolIdx = '1';

        this.setState({ symbol, symbolIdx });
      }
    } catch (error) {
      window.alert('Unable to fetch symbol');
    }
  }

  async loadBalances () {
    const backend = process.env.REACT_APP_BACKEND_API;
    const token = sessionStorage.getItem('token');
    if (typeof backend === 'undefined' || token === null) return;

    try {
      const balancesRes = await axios.get(`${backend}/api/balances`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (balancesRes.data.success) {
        const balances = balancesRes.data.balances;
        this.setState({
          coinbaseUsd: balances[0].usd,
          coinbaseBtc: balances[0].btc,
          coinbaseEth: balances[0].eth,
          binanceUsdt: balances[1].usdt,
          binanceBtc: balances[1].btc,
          binanceEth: balances[1].eth
        });
      }
    } catch (error) {
      window.alert('Unable to fetch balances');
    }
  }

  async loadTrades () {
    const backend = process.env.REACT_APP_BACKEND_API;
    const token = sessionStorage.getItem('token');
    if (typeof backend === 'undefined' || token === null) return;

    try {
      const tradesRes = await axios.get(`${backend}/api/trades`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (tradesRes.data.success) {
        const trades = tradesRes.data.trades;
        this.setState({ trades });
      }
    } catch (error) {
      window.alert('Unable to fetch trades');
    }
  }

  async componentDidMount () {
    const backend = process.env.REACT_APP_BACKEND_API;
    const token = sessionStorage.getItem('token');
    if (typeof backend === 'undefined' || token === null) return;

    const url = new URL(backend);
    const ws = new WebSocket(`ws://${url.host}/ws/markets?token=${token}`)
    ws.addEventListener('message', (message) => {
      const data = JSON.parse(message.data);
      const markets = this.state.markets;
      if (markets.length === 30) markets.shift();

      markets.push(data);
      this.setState({ markets });
    })

    await this.loadSymbol();
    await this.loadBalances();
    await this.loadTrades();
  }

  render () {
    const token = sessionStorage.getItem('token');
    if (token === null) return <Navigate to="/" />;

    const markets = this.state.markets;
    const symbol = this.state.symbol;
    const coinbaseOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const
        },
        title: {
          display: true,
          text: `Coinbase ${symbol?.base}/${symbol?.quote}`
        }
      }
    };

    const coinbaseData = {
      labels: markets.length > 0 ? markets.map(market => getTime(market[0].timestamp)) : [],
      datasets: [
        {
          label: 'ASK price',
          data: markets.length > 0 ? markets.map(market => market[0].ask) : [],
          borderColor: '#89CFF0',
          backgroundColor: '#00FFFF'
        },
        {
          label: 'BID price',
          data: markets.length > 0 ? markets.map(market => market[0].bid) : [],
          borderColor: '#00008B',
          backgroundColor: '#6495ED'
        }
      ]
    };

    const binanceOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const
        },
        title: {
          display: true,
          text: `Binance ${symbol?.base}/${symbol?.quote}`
        }
      }
    };

    const binanceData = {
      labels: markets.length > 0 ? markets.map(market => getTime(market[1].timestamp)) : [],
      datasets: [
        {
          label: 'ASK price',
          data: markets.length > 0 ? markets.map(market => market[1].ask) : [],
          borderColor: '#89CFF0',
          backgroundColor: '#00FFFF'
        },
        {
          label: 'BID price',
          data: markets.length > 0 ? markets.map(market => market[1].bid) : [],
          borderColor: '#00008B',
          backgroundColor: '#6495ED'
        }
      ]
    };

    return (
      <React.Fragment>
        <header className="dashboard-header py-3 px-4">
          <h1>Arbitrage</h1>
          
          <div className="dashboard-actions">
            <select name="symbol" className="form-control" value={this.state.symbolIdx} defaultValue={this.state.symbolIdx} onChange={this.changeSymbol}>
              <option value="0">BTC/USD</option>
              <option value="1">ETH/USD</option>
            </select>

            <button type="button" className="btn btn-primary" onClick={this.logout}>Log Out</button>
          </div>
        </header>

        <main>
          <div className="dashboard-prices mb-5">
            <div className="dashboard-price p-4">
              <Line options={coinbaseOptions} data={coinbaseData} className="mb-3" />

              <h3>Coinbase</h3>
              <div>USD Balance: { this.state.coinbaseUsd } $</div>
              <div>BTC Balance: { this.state.coinbaseBtc } BTC</div>
              <div>ETH Balance: { this.state.coinbaseEth } ETH</div>
            </div>

            <div className="dashboard-price p-4">
              <Line options={binanceOptions} data={binanceData} className="mb-3" />

              <h3>Binance</h3>
              <div>USDT Balance: { this.state.binanceUsdt } $</div>
              <div>BTC Balance: { this.state.binanceBtc } BTC</div>
              <div>ETH Balance: { this.state.binanceEth } ETH</div>
            </div>
          </div>

          <div className="px-5">
            <h3 className="mb-3">TRADES</h3>
            <table className="dashboard-trades">
              <thead>
                <tr>
                  <th>BUY (USD)</th>
                  <th>SELL (BTC)</th>
                  <th>Potential Profit (USD)</th>
                  <th>EXCHANGE (BUY)</th>
                  <th>EXCHANGE (SELL)</th>
                  <th>DATE</th>
                </tr>
              </thead>
              <tbody>
                { this.state.trades.map((trade, i) => {
                  return (
                    <tr key={i}>
                      <td>{ trade.buyQuote }</td>
                      <td>{ trade.sellBase }</td>
                      <td>{ trade.profit }</td>
                      <td>{ trade.buyEx }</td>
                      <td>{ trade.sellEx }</td>
                      <td>{ trade.date }</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </main>
      </React.Fragment>
    );
  }
}

export default function DashboardWrap (props: DashboardWrapProps) {
  const navigate = useNavigate();
  return <Dashboard navigate={navigate} />;
}
