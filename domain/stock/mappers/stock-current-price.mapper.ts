// stockCurrentPrice.model.ts

import {StockCurrentPrice} from "@/domain/stock/types/stock-current-proce.model";
import {StockCurrentPriceOutputDto} from "@/domain/stock/types/stock-current-price.dto";

const toNumber = (v?: string | null): number => {
  if (v == null) return 0
  const n = Number(String(v).replaceAll(",", ""))
  return Number.isFinite(n) ? n : 0
}

const toStr = (v?: string | null): string => (v ?? "")


/**
 * OutputDto -> Model
 */
export const toStockCurrentPriceModel = (dto?: StockCurrentPriceOutputDto | null): StockCurrentPrice => {
  const d = dto ?? {}

  return {
    stockStatusClassificationCode: toStr(d.stockStatusClassificationCode),
    marginRate: toNumber(d.marginRate),
    representativeMarketKoreanName: toStr(d.representativeMarketKoreanName),
    newHighLowClassificationCode: toStr(d.newHighLowClassificationCode),
    industryKoreanName: toStr(d.industryKoreanName),
    temporaryStopYn: toStr(d.temporaryStopYn),
    openPriceRangeExtensionYn: toStr(d.openPriceRangeExtensionYn),
    closePriceRangeExtensionYn: toStr(d.closePriceRangeExtensionYn),
    creditAvailableYn: toStr(d.creditAvailableYn),
    guaranteeDepositRateClassificationCode: toStr(d.guaranteeDepositRateClassificationCode),
    elwIssuedYn: toStr(d.elwIssuedYn),

    currentPrice: toNumber(d.currentPrice),
    changeFromPreviousDay: toNumber(d.changeFromPreviousDay),
    changeSignFromPreviousDay: toStr(d.changeSignFromPreviousDay),
    changeRateFromPreviousDay: toNumber(d.changeRateFromPreviousDay),

    accumulatedTradeAmount: toNumber(d.accumulatedTradeAmount),
    accumulatedVolume: toNumber(d.accumulatedVolume),
    volumeChangeRateFromPreviousDay: toNumber(d.volumeChangeRateFromPreviousDay),

    openPrice: toNumber(d.openPrice),
    highPrice: toNumber(d.highPrice),
    lowPrice: toNumber(d.lowPrice),
    upperLimitPrice: toNumber(d.upperLimitPrice),
    lowerLimitPrice: toNumber(d.lowerLimitPrice),
    basePrice: toNumber(d.basePrice),
    weightedAveragePrice: toNumber(d.weightedAveragePrice),

    htsForeignExhaustionRate: toNumber(d.htsForeignExhaustionRate),
    foreignNetBuyQuantity: toNumber(d.foreignNetBuyQuantity),
    programNetBuyQuantity: toNumber(d.programNetBuyQuantity),

    pivotSecondResistancePrice: toNumber(d.pivotSecondResistancePrice),
    pivotFirstResistancePrice: toNumber(d.pivotFirstResistancePrice),
    pivotPointValue: toNumber(d.pivotPointValue),
    pivotFirstSupportPrice: toNumber(d.pivotFirstSupportPrice),
    pivotSecondSupportPrice: toNumber(d.pivotSecondSupportPrice),

    resistanceValue: toNumber(d.resistanceValue),
    supportValue: toNumber(d.supportValue),

    capitalAmount: toNumber(d.capitalAmount),
    priceLimitWidth: toNumber(d.priceLimitWidth),
    faceValue: toNumber(d.faceValue),
    substitutePrice: toNumber(d.substitutePrice),
    quoteUnit: toNumber(d.quoteUnit),
    htsTradeQuantityUnitValue: toNumber(d.htsTradeQuantityUnitValue),

    listedShares: toNumber(d.listedShares),
    htsMarketCap: toNumber(d.htsMarketCap),
    per: toNumber(d.per),
    pbr: toNumber(d.pbr),
    settlementMonth: toStr(d.settlementMonth),
    volumeTurnoverRate: toNumber(d.volumeTurnoverRate),
    eps: toNumber(d.eps),
    bps: toNumber(d.bps),

    day250HighPrice: toNumber(d.day250HighPrice),
    day250HighPriceDate: toStr(d.day250HighPriceDate),
    day250HighPriceVsCurrentRate: toNumber(d.day250HighPriceVsCurrentRate),
    day250LowPrice: toNumber(d.day250LowPrice),
    day250LowPriceDate: toStr(d.day250LowPriceDate),
    day250LowPriceVsCurrentRate: toNumber(d.day250LowPriceVsCurrentRate),

    yearlyHighPrice: toNumber(d.yearlyHighPrice),
    yearlyHighPriceVsCurrentRate: toNumber(d.yearlyHighPriceVsCurrentRate),
    yearlyHighPriceDate: toStr(d.yearlyHighPriceDate),
    yearlyLowPrice: toNumber(d.yearlyLowPrice),
    yearlyLowPriceVsCurrentRate: toNumber(d.yearlyLowPriceVsCurrentRate),
    yearlyLowPriceDate: toStr(d.yearlyLowPriceDate),

    week52HighPrice: toNumber(d.week52HighPrice),
    week52HighPriceVsCurrentRate: toNumber(d.week52HighPriceVsCurrentRate),
    week52HighPriceDate: toStr(d.week52HighPriceDate),
    week52LowPrice: toNumber(d.week52LowPrice),
    week52LowPriceVsCurrentRate: toNumber(d.week52LowPriceVsCurrentRate),
    week52LowPriceDate: toStr(d.week52LowPriceDate),

    totalLoanBalanceRate: toNumber(d.totalLoanBalanceRate),
    shortSellingAvailableYn: toStr(d.shortSellingAvailableYn),
    stockShortCode: toStr(d.stockShortCode),

    faceValueCurrencyName: toStr(d.faceValueCurrencyName),
    capitalCurrencyName: toStr(d.capitalCurrencyName),
    approachRate: toNumber(d.approachRate),

    foreignHoldingQuantity: toNumber(d.foreignHoldingQuantity),
    viAppliedClassificationCode: toStr(d.viAppliedClassificationCode),
    afterHoursViAppliedClassificationCode: toStr(d.afterHoursViAppliedClassificationCode),
    lastShortSellingContractQuantity: toNumber(d.lastShortSellingContractQuantity),

    investmentCautionYn: toStr(d.investmentCautionYn),
    marketWarningCode: toStr(d.marketWarningCode),
    shortTermOverheatedYn: toStr(d.shortTermOverheatedYn),
    liquidationTradeYn: toStr(d.liquidationTradeYn),
    managedStockYn: toStr(d.managedStockYn),
  }
}
