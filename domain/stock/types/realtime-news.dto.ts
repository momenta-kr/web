export interface RealtimeNewsDto {
  newsId: string
  title: string
  description: string
  source: string
  url: string
  crawledAt: string // ✅ JSON으로 오면 보통 ISO string. (Date로 바로 두면 런타임에서 string이 들어와 타입 불일치)
  safeBrief: string
  sentiment: string
  category: string
  relatedStock: RelatedStock[]
}

export interface RelatedStock {
  stockCode: string
  name: string
}

/**
 * ✅ Spring Data Slice 응답 타입
 */
export interface SliceResponse<T> {
  content: T[]
  pageable?: unknown // 필요 없으면 제거 가능
  sort?: unknown     // 필요 없으면 제거 가능

  number: number             // 현재 page (0-base)
  size: number               // 요청 size
  numberOfElements: number   // content 길이
  first: boolean
  last: boolean
  empty: boolean
}

/**
 * ✅ RealtimeNews를 Slice로 받는 타입
 */
export type RealtimeNewsSliceDto = SliceResponse<RealtimeNewsDto>
