export type KisResultCode = "0" | "1" | string

export interface DomesticStockPriceResponse {
  resultCode: KisResultCode
  messageCode: string
  message: string
  snapshot: DomesticStockSnapshot
  prices: DomesticStockDailyPrice[]
}

export interface DomesticStockSnapshot {
  stockName: string
  shortStockCode: string

  currentPrice: number | null

  changeFromPrevDay: number | null
  changeSign: string | null
  changeRate: number | null

  prevClosePrice: number | null
  prevDayOpenPrice: number | null
  prevDayHighPrice: number | null
  prevDayLowPrice: number | null

  openPrice: number | null
  highPrice: number | null
  lowPrice: number | null

  askPrice: number | null
  bidPrice: number | null

  accumulatedVolume: number | null
  prevDayVolume: number | null
  changeVolumeFromPrevDay: number | null
  accumulatedTradeAmount: number | null

  turnoverRate: number | null

  faceValue: number | null
  listedShares: number | null
  capitalAmount: number | null
  marketCap: number | null

  per: number | null
  eps: number | null
  pbr: number | null

  marginLoanRate: number | null
}

export interface DomesticStockDailyPrice {
  businessDate: string // YYYYMMDD (원본도 보존)
  businessDateIso: string | null // YYYY-MM-DD (선택적으로 변환)

  closePrice: number | null
  openPrice: number | null
  highPrice: number | null
  lowPrice: number | null

  accumulatedVolume: number | null
  accumulatedTradeAmount: number | null

  fallingClassCode: string | null
  splitRate: number | null
  modified: boolean | null

  changeSign: string | null
  changeFromPrevDay: number | null

  revaluationReasonCode: string | null
}
