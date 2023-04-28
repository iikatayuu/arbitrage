
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

import { MarketData } from '../../types';
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
  coinbaseUsd: number;
  coinbaseBtc: number;
  binanceUsdt: number;
  binanceBtc: number;
}

class Dashboard extends React.Component<DashboardProps, DashboardState> {
  constructor (props: DashboardProps) {
    super(props);

    this.state = {
      markets: [],
      coinbaseUsd: 0,
      coinbaseBtc: 0,
      binanceUsdt: 0,
      binanceBtc: 0
    };

    this.logout = this.logout.bind(this);
  }

  logout (event: React.MouseEvent) {
    sessionStorage.removeItem('token');
    this.props.navigate('/');
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

    try {
      const balancesRes = await axios.get(`${backend}/api/balances`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (balancesRes.data.success) {
        const balances = balancesRes.data.balances;
        this.setState({
          coinbaseUsd: balances[0].usd,
          coinbaseBtc: balances[0].btc,
          binanceUsdt: balances[1].usdt,
          binanceBtc: balances[1].btc
        });
      }
    } catch (error) {
      window.alert('Unable to fetch balances');
    }
  }

  render () {
    const token = sessionStorage.getItem('token');
    if (token === null) return <Navigate to="/" />;

    const markets = this.state.markets;
    const coinbaseOptions = {
      responsive: true,
      plugins: {
        legend: {
          position: 'top' as const
        },
        title: {
          display: true,
          text: 'Coinbase BTC-USD'
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
          text: 'Binance BTC-USDT'
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
          <button type="button" className="btn btn-primary" onClick={this.logout}>Log Out</button>
        </header>

        <main>
          <div className="dashboard-prices">
            <div className="dashboard-price p-4">
              <Line options={coinbaseOptions} data={coinbaseData} className="mb-3" />

              <h3>Coinbase</h3>
              <div>USD Balance: { this.state.coinbaseUsd } $</div>
              <div>BTC Balance: { this.state.coinbaseBtc } BTC</div>
            </div>

            <div className="dashboard-price p-4">
              <Line options={binanceOptions} data={binanceData} className="mb-3" />

              <h3>Binance</h3>
              <div>USDT Balance: { this.state.binanceUsdt } $</div>
              <div>BTC Balance: { this.state.binanceBtc } BTC</div>
            </div>
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
