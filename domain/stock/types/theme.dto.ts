// theme.dto.ts

export interface DomesticStockCurrentPriceOutputDto {
  // ✅ 혹시 서버가 camelCase로 내려주는 경우도 같이 허용
  stockCode: string
  stockShortCode: string
  currentPrice: string
  changeFromPreviousDay: string
  changeRateFromPreviousDay: string
  accumulatedVolume: string
  accumulatedTradeAmount: string
  representativeMarketKoreanName: string
  industryKoreanName: string
}

export interface ThemeDto {
  themeCode: string
  themeName: string
  averageChangeRateFromPreviousDay: number
  stockInfoList?: DomesticStockCurrentPriceOutputDto[]
}
