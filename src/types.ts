
export interface Market {
  name: string;
  ask: number;
  bid: number;
}

export interface MarketData extends Market {
  timestamp: number;
}

export interface Trade {
  buyUsd: number;
  sellBtc: number;
  profit: number;
  exchanges: {
    buy: Market,
    sell: Market
  };
  date: string;
}
