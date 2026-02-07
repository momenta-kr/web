// ai-news.model.ts

/** 서버에서 내려주는 sentiment 값이 문자열이라 일단 string 허용 + 앱에서 쓰는 표준 타입도 제공 */
export type AiNewsSentiment = "positive" | "negative" | "neutral" | (string & {})

/** 집계용 (카테고리/도메인/감성 등) */
export type AiNewsKeyCount = {
  key: string
  count: number
}

/** 상세 페이지에서 보여줄 뉴스 카드 1개 */
export type AiNewsItem = {
  id: string
  title: string
  summary: string // dto.safeBrief -> model.summary (UI용 의미 강화)
  sentiment: AiNewsSentiment
  category: string
  publishedAt: string // ISO string (필요하면 Date로 파생)
  source: string
  domain: string
  url: string

  // ✅ UI에서 자주 쓰는 파생값들(선택)
  publishedTime?: number // Date.parse(publishedAt)
  // relativeTimeText?: string // "3시간 전" 같은 건 프론트에서 계산
}

/** 피드(무한스크롤/더보기) */
export type AiNewsFeed = {
  items: AiNewsItem[]
  nextCursor: string | null
}

/** 인사이트(집계) */
export type AiNewsInsights = {
  total: number
  sentiments: AiNewsKeyCount[]
  topCategories: AiNewsKeyCount[]
  topDomains: AiNewsKeyCount[]
}

/** Overview: 상세페이지 섹션 첫 진입에 필요한 모든 것 */
export type AiNewsOverview = {
  insights: AiNewsInsights
  feed: AiNewsFeed
}
