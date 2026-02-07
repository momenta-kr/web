// domain/stock/queries/useAiNewsOverview.ts
import { useQuery } from "@tanstack/react-query"
import { fetchAiNewsOverview } from "@/domain/stock/api/fetch-ai-news-overview"

export type AiNewsOverviewParams = {
  fromIso: string
  toIso: string
  sentiment?: string | null
  category?: string | null
  domain?: string | null
  size?: number
}

export function useAiNewsOverview(stockCode: string, params: AiNewsOverviewParams) {
  return useQuery({
    queryKey: [
      "ai-news-overview",
      stockCode,
      params.fromIso,
      params.toIso,
      params.sentiment ?? "",
      params.category ?? "",
      params.domain ?? "",
      params.size ?? 20,
    ],
    queryFn: () => fetchAiNewsOverview(stockCode, params),
    retry: 1,
  })
}
