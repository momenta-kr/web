// stockCurrentPrice.dto.ts

/**
 * 서버(GetDomesticStockCurrentPriceOutput record) JSON 형태 그대로 (camelCase)
 * - 숫자/금액도 string으로 올 수 있음 (KIS 스타일)
 * - null/undefined 방어를 위해 전부 optional + nullable로 둠
 */
export type StockCurrentPriceOutputDto = {
  stockStatusClassificationCode?: string | null
  marginRate?: string | null
  representativeMarketKoreanName?: string | null
  newHighLowClassificationCode?: string | null
  industryKoreanName?: string | null
  temporaryStopYn?: string | null
  openPriceRangeExtensionYn?: string | null
  closePriceRangeExtensionYn?: string | null
  creditAvailableYn?: string | null
  guaranteeDepositRateClassificationCode?: string | null
  elwIssuedYn?: string | null

  currentPrice?: string | null
  changeFromPreviousDay?: string | null
  changeSignFromPreviousDay?: string | null
  changeRateFromPreviousDay?: string | null

  accumulatedTradeAmount?: string | null
  accumulatedVolume?: string | null
  volumeChangeRateFromPreviousDay?: string | null

  openPrice?: string | null
  highPrice?: string | null
  lowPrice?: string | null
  upperLimitPrice?: string | null
  lowerLimitPrice?: string | null
  basePrice?: string | null
  weightedAveragePrice?: string | null

  htsForeignExhaustionRate?: string | null
  foreignNetBuyQuantity?: string | null
  programNetBuyQuantity?: string | null

  pivotSecondResistancePrice?: string | null
  pivotFirstResistancePrice?: string | null
  pivotPointValue?: string | null
  pivotFirstSupportPrice?: string | null
  pivotSecondSupportPrice?: string | null

  resistanceValue?: string | null
  supportValue?: string | null

  capitalAmount?: string | null
  priceLimitWidth?: string | null
  faceValue?: string | null
  substitutePrice?: string | null
  quoteUnit?: string | null
  htsTradeQuantityUnitValue?: string | null

  listedShares?: string | null
  htsMarketCap?: string | null
  per?: string | null
  pbr?: string | null
  settlementMonth?: string | null
  volumeTurnoverRate?: string | null
  eps?: string | null
  bps?: string | null

  day250HighPrice?: string | null
  day250HighPriceDate?: string | null
  day250HighPriceVsCurrentRate?: string | null
  day250LowPrice?: string | null
  day250LowPriceDate?: string | null
  day250LowPriceVsCurrentRate?: string | null

  yearlyHighPrice?: string | null
  yearlyHighPriceVsCurrentRate?: string | null
  yearlyHighPriceDate?: string | null
  yearlyLowPrice?: string | null
  yearlyLowPriceVsCurrentRate?: string | null
  yearlyLowPriceDate?: string | null

  week52HighPrice?: string | null
  week52HighPriceVsCurrentRate?: string | null
  week52HighPriceDate?: string | null
  week52LowPrice?: string | null
  week52LowPriceVsCurrentRate?: string | null
  week52LowPriceDate?: string | null

  totalLoanBalanceRate?: string | null
  shortSellingAvailableYn?: string | null
  stockShortCode?: string | null

  faceValueCurrencyName?: string | null
  capitalCurrencyName?: string | null
  approachRate?: string | null

  foreignHoldingQuantity?: string | null
  viAppliedClassificationCode?: string | null
  afterHoursViAppliedClassificationCode?: string | null
  lastShortSellingContractQuantity?: string | null

  investmentCautionYn?: string | null
  marketWarningCode?: string | null
  shortTermOverheatedYn?: string | null
  liquidationTradeYn?: string | null
  managedStockYn?: string | null
}
