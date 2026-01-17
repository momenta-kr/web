export type InvestmentRecommendation = "BUY" | "SELL" | "HOLD" | "UNKNOWN";

export type InvestmentOpinion = {
  stockBusinessDate: Date; // Date로 변환
  memberCompanyName: string;

  investmentOpinion: InvestmentRecommendation;
  investmentOpinionRaw: string;
  investmentOpinionClassCode: string;

  previousInvestmentOpinion: InvestmentRecommendation;
  previousInvestmentOpinionRaw: string;
  previousInvestmentOpinionClassCode: string;

  htsTargetPrice: number | null;
  previousDayClosePrice: number | null;

  nDayDisparity: number | null;
  nDayDisparityRate: number | null;

  stockFuturesDisparity: number | null;
  stockFuturesDisparityRate: number | null;
};