// volume-ranking.model.ts
export type VolumeRanking = {
  stockCode: string;
  stockName: string;
  rank: number;
  currentPrice: number;
  prevDayDiff: number;
  prevDayChangeRate: number;
};
