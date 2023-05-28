
export interface Market {
  name: string;
  ask: number;
  bid: number;
}

export interface MarketData extends Market {
  timestamp: number;
}

export interface Trade {
  buyEx: string;
  sellEx: string;
  buySymbol: string;
  sellSymbol: string;
  buyBid: number;
  sellAsk: number;
  buyQuote: number;
  sellBase: number;
  profit: number;
  date: string;
}

export interface Symbol {
  base: string;
  quote: string;
}
