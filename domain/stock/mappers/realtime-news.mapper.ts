import type { SliceResponse, RealtimeNewsDto, RealtimeNewsSliceDto } from "@/domain/stock/types/realtime-news.dto"
import type { RealtimeNews, RealtimeNewsSlice } from "@/domain/stock/types/realtime-news.model"

// DTO의 crawledAt이 string(Date ISO)일 수도 있고, Date일 수도 있으니 안전 처리
function toDate(value: unknown): Date {
  if (value instanceof Date) return value
  if (typeof value === "string" || typeof value === "number") return new Date(value)
  return new Date()
}

export function toRealtimeNews(data: RealtimeNewsDto): RealtimeNews {
  return {
    newsId: data.newsId,
    title: data.title,
    description: data.description,
    source: data.source,
    url: data.url,
    crawledAt: toDate(data.crawledAt),
    safeBrief: data.safeBrief,
    sentiment: data.sentiment,
    category: data.category,
    relatedStock: data.relatedStock,
  }
}

export function toRealtimeNewsList(dto: RealtimeNewsDto[]): RealtimeNews[] {
  return dto.map(toRealtimeNews)
}

/**
 * ✅ Slice DTO -> Slice Model
 * - content만 RealtimeNews로 변환
 * - 나머지 Slice 메타데이터는 그대로 복사
 */
export function toRealtimeNewsSlice(dto: SliceResponse<RealtimeNewsDto>): SliceResponse<RealtimeNews> {
  return {
    ...dto,
    content: dto.content.map(toRealtimeNews),
  }
}

/**
 * (선택) model 타입을 RealtimeNewsSlice로 따로 선언해뒀다면 이렇게도 가능
 */
export function toRealtimeNewsSliceModel(dto: RealtimeNewsSliceDto): RealtimeNewsSlice {
  return {
    ...dto,
    content: dto.content.map(toRealtimeNews),
  }
}
