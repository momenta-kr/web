import {useQuery} from "@tanstack/react-query";
import {fetchDomesticStockPeriodPrices} from "@/domain/stock/api/fetch-domestic-stock-period-prices";

export function useDomesticStockPeriodPrices(params: {
  symbol: string
  periodType: "D" | "W" | "M" | "Y" // 일/주/월/년 (너희 백엔드 규격에 맞춰 조정)
}) {
  return useQuery({
    queryKey: ["domestic-stock-period-prices", params.symbol, params.periodType],
    queryFn: () => fetchDomesticStockPeriodPrices(params),
    retry: 1,
    staleTime: 5_000,
    refetchOnWindowFocus: false,
    // ✅ placeholderData 사용
    placeholderData: (previousData) => {
      // 이전 데이터가 있으면 snapshot은 유지하고
      // prices만 비워서 "새 기간 로딩 중" 상태를 명확히 표현
      if (!previousData) return undefined

      return {
        ...previousData,
        prices: [], // 차트는 비워짐 → skeleton / loading fallback 자연스러움
      }
    },
  })

}
