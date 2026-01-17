export interface InvestmentOpinionDto {
  stockBusinessDate : string;
  investmentOpinion : string;
  investmentOpinionClassCode : string;
  previousInvestmentOpinion : string;
  previousInvestmentOpinionClassCode : string;
  memberCompanyName : string;
  htsTargetPrice : string;
  previousDayClosePrice : string;
  nDayDisparity : string;
  nDayDisparityRate : string;
  stockFuturesDisparity : string;
  stockFuturesDisparityRate : string;
}