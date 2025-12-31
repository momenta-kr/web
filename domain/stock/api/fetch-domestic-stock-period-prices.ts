import { apiFetchClient } from "@/lib/http/client"
import type { DomesticStockPriceResponse } from "@/domain/stock/types/domestic-stock-price.model"
import type { DomesticStockPriceResponseDto } from "@/domain/stock/types/domestic-stock-price.dto"
import { toDomesticStockPriceResponse } from "@/domain/stock/mappers/domestic-stock-price.mapper"

export async function fetchDomesticStockPeriodPrices(params: {
  symbol: string
  periodType: "D" | "W" | "M" | "Y" // 일/주/월/년 (너희 백엔드 규격에 맞춰 조정)
}): Promise<DomesticStockPriceResponse> {
  const { symbol, periodType } = params

  const qs = new URLSearchParams({
    symbol,
    ...(periodType ? { periodType } : {})
  }).toString()

  const data = await apiFetchClient<DomesticStockPriceResponseDto>(
    `/stocks/v1/period-prices?${qs}`,
    {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  )

  return toDomesticStockPriceResponse(data)
}
