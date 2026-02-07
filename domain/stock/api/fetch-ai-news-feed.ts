// domain/stock/api/fetch-ai-news-feed.ts
import type { AiNewsFeedResponse } from "@/domain/stock/types/ai-news-overview.dto"
import {apiFetchClient} from "@/lib/http/client";

export type AiNewsFeedParams = {
  fromIso: string
  toIso: string
  sentiment?: string | null
  category?: string | null
  domain?: string | null
  size?: number
  cursor?: string | null
}

export async function fetchAiNewsFeed(stockCode: string, params: AiNewsFeedParams) {
  const qs = new URLSearchParams()

  qs.set("stockCode", stockCode)
  qs.set("fromIso", params.fromIso)
  qs.set("toIso", params.toIso)

  if (params.sentiment) qs.set("sentiment", params.sentiment)
  if (params.category) qs.set("category", params.category)
  if (params.domain) qs.set("domain", params.domain) // ✅ 백엔드가 지원하면 server-side filter
  if (params.size) qs.set("size", String(params.size))
  if (params.cursor) qs.set("cursor", params.cursor)

  // ✅ 너 프로젝트 엔드포인트에 맞게 수정
  const res = await apiFetchClient(`/stocks/v1/ai-news/feed?${qs.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store",
  })
  return res as AiNewsFeedResponse
}
