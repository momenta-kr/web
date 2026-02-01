// theme.mapper.ts

import type { DomesticStockCurrentPriceOutputDto, ThemeDto } from "@/domain/stock/types/theme.dto"
import type { Theme, ThemeStock } from "@/domain/stock/types/theme.model"

const pick = <T,>(obj: any, ...keys: string[]): T | undefined => {
  for (const k of keys) {
    const v = obj?.[k]
    if (v !== undefined && v !== null) return v as T
  }
  return undefined
}

const toNumber = (v?: string | number | null): number => {
  if (v == null) return 0
  const n = Number(String(v).replaceAll(",", ""))
  return Number.isFinite(n) ? n : 0
}

const toThemeStock = (dto: DomesticStockCurrentPriceOutputDto): ThemeStock => {
  const stockName = pick<string>(dto, "stockName") ?? ""
  const stockCode = pick<string>(dto, "stockShortCode") ?? ""

  return {
    stockName,
    stockCode,
    currentPrice: toNumber(pick(dto, "currentPrice", "stck_prpr")),
    change: toNumber(pick(dto, "changeFromPreviousDay", "prdy_vrss")),
    changeRate: toNumber(pick(dto, "changeRateFromPreviousDay", "prdy_ctrt")),
    volume: toNumber(pick(dto, "accumulatedVolume", "acml_vol")),
    tradeAmount: toNumber(pick(dto, "accumulatedTradeAmount", "acml_tr_pbmn")),
    marketName: pick(dto, "representativeMarketKoreanName", "rprs_mrkt_kor_name"),
    industryName: pick(dto, "industryKoreanName", "bstp_kor_isnm"),
  }
}

type ToThemeOptions = {
  stockLimit?: number
  sortByChangeRateDesc?: boolean
}

export const toThemeModel = (dto: ThemeDto, opts: ToThemeOptions = {}): Theme => {
  const { stockLimit, sortByChangeRateDesc = true } = opts

  const themeCode = pick<string>(dto, "themeCode", "theme_code") ?? ""
  const themeName = pick<string>(dto, "themeName", "theme_name") ?? ""
  const avg =
    pick<number>(dto, "averageChangeRateFromPreviousDay", "average_change_rate_from_previous_day") ?? 0

  const stockInfoList =
    pick<DomesticStockCurrentPriceOutputDto[]>(dto, "stockInfoList", "stock_info_list") ?? []

  const mapped = stockInfoList.map(toThemeStock).filter((s) => s.stockCode) // ✅ 코드 없는 건 제거

  const sorted = sortByChangeRateDesc ? [...mapped].sort((a, b) => b.changeRate - a.changeRate) : mapped

  const limited = typeof stockLimit === "number" ? sorted.slice(0, stockLimit) : sorted

  return {
    themeCode,
    themeName,
    stockCount: stockInfoList.length,
    averageChangeRate: avg,
    stocks: limited,
  }
}
