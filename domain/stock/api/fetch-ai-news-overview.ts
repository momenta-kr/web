import { apiFetchClient } from "@/lib/http/client"
import { AiNewsOverview } from "@/domain/stock/types/ai-news-overview.model"
import { AiNewsOverviewResponse } from "@/domain/stock/types/ai-news-overview.dto"
import { toAiNewsOverview } from "@/domain/stock/mappers/ai-news-overview.mapper"
import { AiNewsOverviewParams } from "@/domain/stock/queries/useAiNewsOverview"

export async function fetchAiNewsOverview(
  stockCode: string,
  params: AiNewsOverviewParams
): Promise<AiNewsOverview> {
  const qs = new URLSearchParams()

  qs.set("fromIso", params.fromIso)
  qs.set("toIso", params.toIso)
  qs.set("size", String(params.size ?? 20))

  // ✅ optional: 값이 있을 때만 붙이기 (""로 보내면 백엔드가 필터로 오해할 수 있음)
  if (params.sentiment) qs.set("sentiment", params.sentiment)
  if (params.category) qs.set("category", params.category)
  if (params.domain) qs.set("domain", params.domain)

  const data = await apiFetchClient<AiNewsOverviewResponse>(
    `/stocks/v1/ai-news/${encodeURIComponent(stockCode)}/overview?${qs.toString()}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  )

  return toAiNewsOverview(data)
}
