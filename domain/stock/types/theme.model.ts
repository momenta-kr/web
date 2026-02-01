// theme.model.ts

export type ThemeStock = {
  stockCode: string
  stockName: string
  currentPrice: number
  change: number
  changeRate: number
  volume: number
  tradeAmount: number

  marketName?: string
  industryName?: string
}

export type Theme = {
  themeCode: string
  themeName: string

  stockCount: number
  averageChangeRate: number

  // 테마 상세/미리보기 종목들
  stocks: ThemeStock[]
}
