
export interface IndexPrice {
  industryIndexCurrentPrice: number | null;

  industryIndexChangeFromPrevDay: number | null;
  changeSignFromPrevDay: string; // 원본 코드/부호 그대로 유지
  industryIndexChangeRateFromPrevDay: number | null;

  accumulatedVolume: number | null;
  previousDayVolume: number | null;

  accumulatedTradeAmount: number | null;
  previousDayTradeAmount: number | null;

  industryIndexOpenPrice: number | null;
  openPriceChangeFromPrevIndex: number | null;
  currentVsOpenSign: string;
  openPriceChangeRateFromPrevDay: number | null;

  industryIndexHighPrice: number | null;
  highPriceChangeFromPrevIndex: number | null;
  currentVsHighSign: string;
  highPriceChangeRateFromPrevDay: number | null;

  industryIndexLowPrice: number | null;
  lowPriceChangeFromPrevClose: number | null;
  currentVsLowSign: string;
  lowPriceRateFromPrevClose: number | null;

  상승종목수: number | null;
  upperLimitCount: number | null;
  unchangedCount: number | null;
  declineCount: number | null;
  lowerLimitCount: number | null;

  yearHighIndustryIndex: number | null;
  currentVsYearHighRate: number | null;
  yearHighDate: string | null; // yyyymmdd

  yearLowIndustryIndex: number | null;
  currentVsYearLowRate: number | null;
  yearLowDate: string | null; // yyyymmdd

  totalAskQuantity: number | null;
  totalBidQuantity: number | null;

  sellQuantityRate: number | null;
  buyQuantityRate: number | null;

  netBuyQuantity: number | null;
}