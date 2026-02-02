export type RealtimeNews = {
  newsId: string
  title: string
  description: string
  source: string
  url: string
  crawledAt: Date

  safeBrief: string
  sentiment: string
  category: string
  relatedStock: RelatedStock[]
}

export type RelatedStock = {
  stockCode: string
  name: string
}

/**
 * ✅ Spring Data Slice 응답 공용 타입
 */
export type SliceResponse<T> = {
  content: T[]

  number: number            // 현재 페이지(0-base)
  size: number              // 요청 size
  numberOfElements: number  // content 길이
  first: boolean
  last: boolean
  empty: boolean

  // 백엔드 직렬화에 따라 포함될 수도/안될 수도 있어서 optional
  pageable?: unknown
  sort?: unknown
}

/**
 * ✅ (1) RealtimeNews를 Slice로 받는 타입
 * - 단, 서버에서 crawledAt이 string으로 오면 런타임 타입이 안 맞을 수 있음
 */
export type RealtimeNewsSlice = SliceResponse<RealtimeNews>

/**
 * ✅ (2) 서버 JSON에 “진짜로 맞춘” Slice 타입(추천)
 * - crawledAt을 string으로 받아서 필요할 때 Date로 파싱
 */
export type RealtimeNewsWire = Omit<RealtimeNews, "crawledAt"> & { crawledAt: string }
export type RealtimeNewsSliceWire = SliceResponse<RealtimeNewsWire>
