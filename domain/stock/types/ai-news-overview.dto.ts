// ai-news.dto.ts

export interface AiNewsOverviewResponse {
  insights: AiNewsInsightsResponse
  feed: AiNewsFeedResponse
}

export interface AiNewsInsightsResponse {
  total: number
  sentiments: KeyCountDto[]
  topCategories: KeyCountDto[]
  topDomains: KeyCountDto[]
}

export interface KeyCountDto {
  key: string
  count: number
}

/**
 * ✅ (참고) Overview에 포함된 feed 타입까지 같이 쓰게 되는 경우가 대부분이라 같이 정의해두는 걸 추천
 * - Java: AiNewsFeedResponse(items, nextCursor)
 * - Java: AiNewsItemDto(...)
 */
export interface AiNewsFeedResponse {
  items: AiNewsItemDto[]
  nextCursor: string | null
}

export interface AiNewsItemDto {
  id: string
  title: string
  safeBrief: string
  sentiment: string
  category: string
  publishedAt: string
  source: string
  domain: string
  url: string
}
