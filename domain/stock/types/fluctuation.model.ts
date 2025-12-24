// fluctuation.model.ts
export type Fluctuation = {
  shortStockCode: string;
  rank: number;
  stockName: string;

  currentPrice: number;
  changeFromPrevDay: number;
  changeSign: "1" | "2" | "3" | "4" | "5" | string; // KIS 부호코드가 애매하면 string로 두는 게 안전
  changeRateFromPrevDay: number;

  accumulatedVolume: number;

  highPrice: number;
  highPriceTime: string;            // "HHmmss"
  accumulatedHighPriceDate: string; // "yyyyMMdd"

  lowPrice: number;
  lowPriceTime: string;             // "HHmmss"
  accumulatedLowPriceDate: string;  // "yyyyMMdd"

  rateFromLowPrice: number;
  rateFromDesignatedClosePrice: number;

  consecutiveRiseDays: number;
  rateFromHighPrice: number;
  consecutiveFallDays: number;

  openPriceChangeSign: string;
  changeFromOpenPrice: number;
  rateFromOpenPrice: number;

  periodChangeValue: number;
  periodChangeRate: number;
};
