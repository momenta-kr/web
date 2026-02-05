// volume-ranking.dto.ts
export type VolumeRankingDto = {
  stockCode: string;
  stockName: string;
  dataRank: string;
  currentPrice: string;
  prevDayDiff: string;
  prevDayChangeRate: string;
};
