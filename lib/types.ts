export type Market = "KOSPI" | "KOSDAQ"
export type TimeRange = "1h" | "4h" | "1d"
export type AnomalyType = "surge" | "plunge" | "volume" | "volatility"
export type Severity = "high" | "medium" | "low"

export interface Stock {
  ticker: string
  name: string
  price: number
  change: number
  changePercent: number
  volume: number
  prevClose: number
  open: number
  high: number
  low: number
  marketCap: string
  sector: string
  market: Market
}

export interface Anomaly {
  id: string
  type: AnomalyType
  ticker: string
  name: string
  value: string
  description: string
  time: string
  timestamp: number
  severity: Severity
  market: Market
}

export interface AlertRule {
  id: string
  type: AnomalyType
  condition: string
  threshold: number
  enabled: boolean
}

export interface MarketIndex {
  name: string
  value: number
  change: number
  changePercent: number
  volume: string
  tradingValue: string
  advancing: number
  declining: number
  unchanged: number
}

export interface SectorData {
  name: string
  change: number
  volume: number
  stocks: { name: string; ticker: string; change: number; size: number }[]
}

export interface PriceHistory {
  time: string
  price: number
  volume: number
}

// 호가창 타입
export interface OrderBookLevel {
  price: number
  volume: number
  ratio: number
}

export interface OrderBook {
  asks: OrderBookLevel[] // 매도호가
  bids: OrderBookLevel[] // 매수호가
  totalAskVolume: number
  totalBidVolume: number
}

// 투자자별 매매동향
export interface InvestorTrend {
  type: "foreign" | "institution" | "individual"
  name: string
  buyVolume: number
  sellVolume: number
  netVolume: number
  netAmount: string
}

// 뉴스/공시
export interface NewsItem {
  id: string
  title: string
  source: string
  time: string
  type: "news" | "disclosure"
  sentiment?: "positive" | "negative" | "neutral"
  content?: string
  aiSummary?: string
  impactScore?: number // -100 to 100
  keywords?: string[]
}

// 재무정보
export interface FinancialData {
  per: number
  pbr: number
  eps: number
  bps: number
  dividendYield: number
  roe: number
  debtRatio: number
  operatingMargin: number
}

export interface SectorIndex {
  name: string
  value: number
  change: number
  changePercent: number
}

export interface MarketNews {
  id: string
  title: string
  source: string
  time: string
  sentiment: "positive" | "negative" | "neutral"
  relatedStocks: { ticker: string; name: string }[]
  aiSummary: string
  category: "경제" | "산업" | "정책" | "글로벌" | "기업"
}
