// ai-news.mapper.ts

import type {
  AiNewsOverviewResponse,
  AiNewsInsightsResponse,
  AiNewsFeedResponse,
  AiNewsItemDto,
  KeyCountDto,
} from "@/domain/stock/types/ai-news-overview.dto"
import type {
  AiNewsOverview,
  AiNewsInsights,
  AiNewsFeed,
  AiNewsItem,
  AiNewsKeyCount,
  AiNewsSentiment,
} from "@/domain/stock/types/ai-news-overview.model"

/** ---------- utils ---------- */

function toNumber(v: unknown, fallback = 0): number {
  if (v === null || v === undefined) return fallback
  const s = String(v).trim()
  if (s === "" || s === "-") return fallback
  const normalized = s.replace(/,/g, "")
  const n = Number(normalized)
  return Number.isFinite(n) ? n : fallback
}

function toString(v: unknown, fallback = ""): string {
  if (v === null || v === undefined) return fallback
  const s = String(v)
  return s.trim() === "" ? fallback : s
}

function toNullableString(v: unknown): string | null {
  const s = toString(v, "")
  return s ? s : null
}

/** sentiment normalize: 서버 값이 다양한 경우 대비 */
function toSentiment(v: unknown): AiNewsSentiment {
  const raw = toString(v, "").toLowerCase()
  if (raw === "positive" || raw === "pos" || raw === "bullish") return "positive"
  if (raw === "negative" || raw === "neg" || raw === "bearish") return "negative"
  if (raw === "neutral" || raw === "neu") return "neutral"
  return (toString(v, "") as AiNewsSentiment) // 그대로 유지
}

function toPublishedTime(iso: string): number | undefined {
  const t = Date.parse(iso)
  return Number.isFinite(t) ? t : undefined
}

/** ---------- dto -> model mappers ---------- */

export function toAiNewsKeyCount(dto: KeyCountDto): AiNewsKeyCount {
  return {
    key: toString(dto?.key, ""),
    count: toNumber(dto?.count, 0),
  }
}

export function toAiNewsKeyCounts(dtos: KeyCountDto[] | undefined | null): AiNewsKeyCount[] {
  if (!Array.isArray(dtos)) return []
  return dtos.map(toAiNewsKeyCount)
}

export function toAiNewsItem(dto: AiNewsItemDto): AiNewsItem {
  const publishedAt = toString(dto?.publishedAt, "")

  // safeBrief가 비어있으면 title로 fallback (UI 깨짐 방지)
  const title = toString(dto?.title, "")
  const summary = toString(dto?.safeBrief, "") || title

  return {
    id: toString(dto?.id, ""),
    title,
    summary,
    sentiment: toSentiment(dto?.sentiment),
    category: toString(dto?.category, ""),
    publishedAt,
    source: toString(dto?.source, ""),
    domain: toString(dto?.domain, ""),
    url: toString(dto?.url, ""),
    publishedTime: publishedAt ? toPublishedTime(publishedAt) : undefined,
  }
}

export function toAiNewsItems(dtos: AiNewsItemDto[] | undefined | null): AiNewsItem[] {
  if (!Array.isArray(dtos)) return []
  return dtos.map(toAiNewsItem)
}

export function toAiNewsFeed(dto: AiNewsFeedResponse): AiNewsFeed {
  return {
    items: toAiNewsItems(dto?.items),
    nextCursor: toNullableString(dto?.nextCursor),
  }
}

export function toAiNewsInsights(dto: AiNewsInsightsResponse): AiNewsInsights {
  return {
    total: toNumber(dto?.total, 0),
    sentiments: toAiNewsKeyCounts(dto?.sentiments),
    topCategories: toAiNewsKeyCounts(dto?.topCategories),
    topDomains: toAiNewsKeyCounts(dto?.topDomains),
  }
}

export function toAiNewsOverview(dto: AiNewsOverviewResponse): AiNewsOverview {
  return {
    insights: toAiNewsInsights(dto?.insights),
    feed: toAiNewsFeed(dto?.feed),
  }
}
