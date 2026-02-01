
/**
 * 프론트에서 쓰기 좋은 모델
 * - 금액/수량/비율/가격: number로 파싱
 * - 코드/YN/날짜: string 유지
 */
export type StockCurrentPrice = {
  stockStatusClassificationCode: string
  marginRate: number
  representativeMarketKoreanName: string
  newHighLowClassificationCode: string
  industryKoreanName: string
  temporaryStopYn: string
  openPriceRangeExtensionYn: string
  closePriceRangeExtensionYn: string
  creditAvailableYn: string
  guaranteeDepositRateClassificationCode: string
  elwIssuedYn: string

  currentPrice: number
  changeFromPreviousDay: number
  changeSignFromPreviousDay: string
  changeRateFromPreviousDay: number

  accumulatedTradeAmount: number
  accumulatedVolume: number
  volumeChangeRateFromPreviousDay: number

  openPrice: number
  highPrice: number
  lowPrice: number
  upperLimitPrice: number
  lowerLimitPrice: number
  basePrice: number
  weightedAveragePrice: number

  htsForeignExhaustionRate: number
  foreignNetBuyQuantity: number
  programNetBuyQuantity: number

  pivotSecondResistancePrice: number
  pivotFirstResistancePrice: number
  pivotPointValue: number
  pivotFirstSupportPrice: number
  pivotSecondSupportPrice: number

  resistanceValue: number
  supportValue: number

  capitalAmount: number
  priceLimitWidth: number
  faceValue: number
  substitutePrice: number
  quoteUnit: number
  htsTradeQuantityUnitValue: number

  listedShares: number
  htsMarketCap: number
  per: number
  pbr: number
  settlementMonth: string
  volumeTurnoverRate: number
  eps: number
  bps: number

  day250HighPrice: number
  day250HighPriceDate: string
  day250HighPriceVsCurrentRate: number
  day250LowPrice: number
  day250LowPriceDate: string
  day250LowPriceVsCurrentRate: number

  yearlyHighPrice: number
  yearlyHighPriceVsCurrentRate: number
  yearlyHighPriceDate: string
  yearlyLowPrice: number
  yearlyLowPriceVsCurrentRate: number
  yearlyLowPriceDate: string

  week52HighPrice: number
  week52HighPriceVsCurrentRate: number
  week52HighPriceDate: string
  week52LowPrice: number
  week52LowPriceVsCurrentRate: number
  week52LowPriceDate: string

  totalLoanBalanceRate: number
  shortSellingAvailableYn: string
  stockShortCode: string

  faceValueCurrencyName: string
  capitalCurrencyName: string
  approachRate: number

  foreignHoldingQuantity: number
  viAppliedClassificationCode: string
  afterHoursViAppliedClassificationCode: string
  lastShortSellingContractQuantity: number

  investmentCautionYn: string
  marketWarningCode: string
  shortTermOverheatedYn: string
  liquidationTradeYn: string
  managedStockYn: string
}
