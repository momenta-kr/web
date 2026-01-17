import {useQuery} from "@tanstack/react-query";
import {fetchInvestmentOpinion} from "@/domain/stock/api/fetch-investment-opinion";

export function useInvestmentOpinion(symbol: string) {
  return useQuery({
    queryKey: ["investment-opinion", symbol],
    queryFn: () => fetchInvestmentOpinion(symbol),
    enabled: Boolean(symbol),
    retry: 1,
  })
}