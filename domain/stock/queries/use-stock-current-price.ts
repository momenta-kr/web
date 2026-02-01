import { useQuery } from "@tanstack/react-query"
import { fetchStockCurrentPrice } from "@/domain/stock/api/fetch-stock-current-price"
import {StockCurrentPrice} from "@/domain/stock/types/stock-current-proce.model";

export function useStockCurrentPrice(stockCode: string) {
  return useQuery<StockCurrentPrice>({
    queryKey: ["stock-current-price", stockCode],
    queryFn: () => fetchStockCurrentPrice(stockCode),
    retry: 1,
    staleTime: 60_000, // 3초 정도 (원하는대로)
    refetchInterval: 60_000, // 실시간 느낌 원하면
  })
}
