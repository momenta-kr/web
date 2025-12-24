export type IndustryIndexItem = {
  industryCode: string;
  industryName: string;

  currentIndexPrice: number;         // 지수 현재가
  changeFromPreviousDay: number;     // 전일대비(부호 적용)
  changeRate: number;                // 등락률(%)

  accumulatedVolume: number;         // 누적 거래량
  accumulatedTradeAmount: number;    // 누적 거래대금
  volumeRatio: number;               // 거래량 비중(%)
  tradeAmountRatio: number;          // 거래대금 비중(%)

};