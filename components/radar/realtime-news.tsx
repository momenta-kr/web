"use client"

import { useDeferredValue, useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Zap,
  TrendingUp,
  TrendingDown,
  Minus,
  ExternalLink,
  Sparkles,
  Clock,
  X,
  Search as SearchIcon,
  SlidersHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useRealtimeNews } from "@/domain/stock/queries/useRealtimeNews"

// =========================
// Server DTO
// =========================
export type RealtimeNewsDto = {
  newsId: string
  title: string
  description: string
  source: string
  url: string
  crawledAt: Date | string
}

type Sentiment = "positive" | "negative" | "neutral"
type Category = "경제" | "산업" | "정책" | "글로벌" | "기업"

type RealtimeNewsUi = {
  id: string
  title: string
  source: string
  timestamp: number
  sentiment: Sentiment
  relatedStocks: { ticker: string; name: string }[]
  aiSummary: string
  category: Category
  isBreaking: boolean
  url: string
}

type TimeRange = "day" | "week" | "month" | "year"
type SentimentFilter = "all" | Sentiment
type CategoryFilter = "all" | Category

type StockAgg = {
  ticker: string
  name: string
  total: number
  positive: number
  negative: number
  neutral: number
}

// =========================
// Utils
// =========================
const toEpochMs = (d: Date | string): number => {
  if (d instanceof Date) return d.getTime()
  const t = Date.parse(d)
  return Number.isFinite(t) ? t : Date.now()
}

const truncate = (s: string, max = 70) => {
  const text = (s ?? "").trim()
  if (!text) return ""
  return text.length > max ? `${text.slice(0, max)}…` : text
}

const guessSentiment = (title: string, desc?: string): Sentiment => {
  const text = `${title} ${desc ?? ""}`
  const pos = ["급등", "호재", "상승", "개선", "확대", "수혜", "돌파", "성장", "양산", "투자", "흑자", "매출증가"]
  const neg = ["급락", "악재", "하락", "리콜", "불확실", "규제", "적자", "감소", "중단", "사고", "위험", "소송", "감사", "경고"]

  const hasPos = pos.some((k) => text.includes(k))
  const hasNeg = neg.some((k) => text.includes(k))
  if (hasPos && !hasNeg) return "positive"
  if (hasNeg && !hasPos) return "negative"
  return "neutral"
}

const guessCategory = (title: string, desc?: string): Category => {
  const text = `${title} ${desc ?? ""}`

  if (["금리", "환율", "물가", "CPI", "PPI", "고용", "GDP", "연준", "Fed", "파월"].some((k) => text.includes(k)))
    return "경제"

  if (["규제", "정책", "법안", "IRA", "보조금", "관세", "행정명령", "국회", "정부"].some((k) => text.includes(k)))
    return "정책"

  if (["미국", "中", "중국", "일본", "유럽", "EU", "글로벌", "해외", "수출", "수입", "관세"].some((k) => text.includes(k)))
    return "글로벌"

  if (
    ["반도체", "2차전지", "전기차", "AI", "바이오", "헬스케어", "원전", "방산", "조선", "철강", "화학", "게임", "플랫폼", "클라우드"].some((k) =>
      text.includes(k),
    )
  )
    return "산업"

  return "기업"
}

const isBreakingByText = (title: string) => {
  return title.includes("속보") || title.includes("긴급") || title.includes("리콜") || title.includes("사고")
}

const getTimeDiff = (nowMs: number, timestamp: number) => {
  const diff = nowMs - timestamp
  const minutes = Math.floor(diff / 1000 / 60)
  if (minutes < 1) return "방금 전"
  if (minutes < 60) return `${minutes}분 전`
  return `${Math.floor(minutes / 60)}시간 전`
}

const getSentimentIcon = (sentiment: Sentiment) => {
  switch (sentiment) {
    case "positive":
      return <TrendingUp className="h-4 w-4 text-red-500" />
    case "negative":
      return <TrendingDown className="h-4 w-4 text-blue-500" />
    default:
      return <Minus className="h-4 w-4 text-muted-foreground" />
  }
}

const getSentimentBadge = (sentiment: Sentiment) => {
  switch (sentiment) {
    case "positive":
      return (
        <Badge variant="outline" className="border-red-500/40 text-red-500 text-[11px] px-1.5 py-0">
          호재
        </Badge>
      )
    case "negative":
      return (
        <Badge variant="outline" className="border-blue-500/40 text-blue-500 text-[11px] px-1.5 py-0">
          악재
        </Badge>
      )
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground text-[11px] px-1.5 py-0">
          중립
        </Badge>
      )
  }
}

const rangeMs: Record<TimeRange, number> = {
  day: 24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
  month: 30 * 24 * 60 * 60 * 1000,
  year: 365 * 24 * 60 * 60 * 1000,
}
const RANGE_LABEL: Record<TimeRange, string> = { day: "일", week: "주", month: "월", year: "년" }

// =========================
// Mock relatedStocks
// =========================
const MOCK_STOCKS = [
  { ticker: "005930", name: "삼성전자" },
  { ticker: "000660", name: "SK하이닉스" },
  { ticker: "035420", name: "NAVER" },
  { ticker: "035720", name: "카카오" },
  { ticker: "005380", name: "현대차" },
  { ticker: "000270", name: "기아" },
  { ticker: "051910", name: "LG화학" },
  { ticker: "006400", name: "삼성SDI" },
  { ticker: "373220", name: "LG에너지솔루션" },
  { ticker: "068270", name: "셀트리온" },
  { ticker: "207940", name: "삼성바이오로직스" },
  { ticker: "259960", name: "크래프톤" },
  { ticker: "096770", name: "SK이노베이션" },
  { ticker: "028260", name: "삼성물산" },
  { ticker: "055550", name: "신한지주" },
]

const KEYWORD_TO_STOCKS: Array<{ keys: string[]; picks: string[] }> = [
  { keys: ["반도체", "HBM", "메모리", "DRAM", "NAND", "파운드리"], picks: ["005930", "000660"] },
  { keys: ["AI", "클라우드", "플랫폼", "검색", "메신저"], picks: ["035420", "035720"] },
  { keys: ["2차전지", "배터리", "전기차", "IRA"], picks: ["373220", "006400", "051910", "096770"] },
  { keys: ["바이오", "의약", "임상", "신약"], picks: ["068270", "207940"] },
  { keys: ["게임", "콘솔", "신작"], picks: ["259960"] },
  { keys: ["자동차", "전기차", "모빌리티", "판매"], picks: ["005380", "000270"] },
  { keys: ["은행", "금리", "대출", "예대마진"], picks: ["055550"] },
]

const SOURCE_KO_MAP: Record<string, string> = {
  // ✅ 스샷에 나온 크롤러 slug
  asiae: "아시아경제",
  bizchosun: "조선비즈",
  bizheraldcorp: "헤럴드경제",
  bizwatch: "비즈워치",
  edaily: "이데일리",
  fnnews: "파이낸셜뉴스",
  hankyung: "한국경제",
  joseilbo: "조세일보",
  mk: "매일경제",
  mt: "머니투데이",
  sedaily: "서울경제"
}

function hashToInt(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return Math.abs(h >>> 0)
}

function pickN<T>(arr: T[], n: number, seed: number) {
  if (arr.length <= n) return arr
  const out: T[] = []
  let s = seed
  const used = new Set<number>()
  while (out.length < n && used.size < arr.length) {
    s = (s * 1664525 + 1013904223) >>> 0
    const idx = s % arr.length
    if (used.has(idx)) continue
    used.add(idx)
    out.push(arr[idx])
  }
  return out
}

function mockRelatedStocks(dto: RealtimeNewsDto): { ticker: string; name: string }[] {
  const text = `${dto.title} ${dto.description ?? ""} ${dto.source ?? ""}`
  const matchedTickers = new Set<string>()

  for (const rule of KEYWORD_TO_STOCKS) {
    if (rule.keys.some((k) => text.includes(k))) rule.picks.forEach((t) => matchedTickers.add(t))
  }

  const seed = hashToInt(dto.newsId + dto.title)

  if (matchedTickers.size > 0) {
    const candidates = Array.from(matchedTickers)
      .map((t) => MOCK_STOCKS.find((s) => s.ticker === t))
      .filter(Boolean) as { ticker: string; name: string }[]
    return pickN(candidates, Math.min(3, candidates.length), seed)
  }

  const count = seed % 3 // 0~2
  if (count === 0) return []
  return pickN(MOCK_STOCKS, count, seed)
}

// =========================
// UI helpers
// =========================
function Separator() {
  return <span className="mx-1.5 text-muted-foreground/40 select-none">•</span>
}

function Pill({
                active,
                onClick,
                children,
              }: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-7 px-2.5 rounded-full text-xs transition border",
        active ? "bg-accent text-background border-accent" : "bg-background hover:bg-muted/40 text-foreground border-border",
      )}
    >
      {children}
    </button>
  )
}

function SentimentStackBar({
                             positive,
                             negative,
                             neutral,
                             total,
                             onClickPositive,
                             onClickNegative,
                             onClickNeutral,
                             showNumbers,
                           }: {
  positive: number
  negative: number
  neutral: number
  total: number
  onClickPositive?: () => void
  onClickNegative?: () => void
  onClickNeutral?: () => void
  showNumbers?: boolean
}) {
  const safeTotal = total > 0 ? total : 1
  const pPct = (positive / safeTotal) * 100
  const nPct = (negative / safeTotal) * 100
  const uPct = (neutral / safeTotal) * 100

  return (
    <div className="w-full">
      <div className="h-2 w-full rounded-full bg-secondary overflow-hidden flex">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClickPositive?.()
          }}
          className="h-full bg-red-500/70 hover:bg-red-500/90 transition"
          style={{ width: `${pPct}%` }}
          aria-label="positive"
          title={`호재 ${positive}건`}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClickNegative?.()
          }}
          className="h-full bg-blue-500/70 hover:bg-blue-500/90 transition"
          style={{ width: `${nPct}%` }}
          aria-label="negative"
          title={`악재 ${negative}건`}
        />
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            onClickNeutral?.()
          }}
          className="h-full bg-muted-foreground/35 hover:bg-muted-foreground/50 transition"
          style={{ width: `${uPct}%` }}
          aria-label="neutral"
          title={`중립 ${neutral}건`}
        />
      </div>

      {showNumbers && (
        <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-red-500/70" />
            {positive}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-blue-500/70" />
            {negative}
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-muted-foreground/40" />
            {neutral}
          </span>
          <span className="ml-auto text-muted-foreground/80">합 {total}</span>
        </div>
      )}
    </div>
  )
}

// =========================
// Mapper
// =========================
const mapDtoToUi = (dto: RealtimeNewsDto): RealtimeNewsUi => {
  const sentiment = guessSentiment(dto.title, dto.description)
  const category = guessCategory(dto.title, dto.description)
  return {
    id: dto.newsId,
    title: dto.title,
    source: dto.source,
    timestamp: toEpochMs(dto.crawledAt),
    sentiment,
    relatedStocks: mockRelatedStocks(dto),
    aiSummary: dto.description || "요약 준비 중",
    category,
    isBreaking: isBreakingByText(dto.title),
    url: dto.url,
  }
}

type TopSort = "total" | "positive" | "negative" | "neutral" | "posRatio" | "negRatio"

function sortTopStocks(arr: StockAgg[], sort: TopSort) {
  const ratio = (a: number, total: number) => (total <= 0 ? 0 : a / total)
  const copy = [...arr]

  copy.sort((a, b) => {
    switch (sort) {
      case "positive":
        return b.positive - a.positive || b.total - a.total
      case "negative":
        return b.negative - a.negative || b.total - a.total
      case "neutral":
        return b.neutral - a.neutral || b.total - a.total
      case "posRatio":
        return ratio(b.positive, b.total) - ratio(a.positive, a.total) || b.total - a.total
      case "negRatio":
        return ratio(b.negative, b.total) - ratio(a.negative, a.total) || b.total - a.total
      default:
        return b.total - a.total
    }
  })

  return copy
}

export function RealtimeNews() {
  const { data } = useRealtimeNews()
  const safeData: RealtimeNewsDto[] = Array.isArray(data) ? (data as any) : []

  const [nowMs, setNowMs] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNowMs(Date.now()), 30_000)
    return () => clearInterval(t)
  }, [])

  // filters
  const [timeRange, setTimeRange] = useState<TimeRange>("day")
  const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all")
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")
  const [q, setQ] = useState("")
  const [stockFocus, setStockFocus] = useState<string | null>(null)
  const [showTopNumbers, setShowTopNumbers] = useState(false)

  // Top panel (대량 대응)
  const [topOpen, setTopOpen] = useState(false)
  const [topQuery, setTopQuery] = useState("")
  const deferredTopQuery = useDeferredValue(topQuery)
  const [topSort, setTopSort] = useState<TopSort>("total")
  const [topLimit, setTopLimit] = useState(80) // ✅ 대량일 때도 초기 렌더 부담 줄이기

  useEffect(() => {
    if (!topOpen) {
      setTopQuery("")
      setTopSort("total")
      setTopLimit(80)
    }
  }, [topOpen])

  const serverNews: RealtimeNewsUi[] = useMemo(() => {
    return safeData.map(mapDtoToUi).sort((a, b) => b.timestamp - a.timestamp)
  }, [safeData])

  // ✅ 실제 리스트 필터(사용자 설정 그대로 반영)
  const filteredNews = useMemo(() => {
    const start = nowMs - rangeMs[timeRange]
    const query = q.trim().toLowerCase()

    return serverNews.filter((n) => {
      if (n.timestamp < start) return false
      if (sentimentFilter !== "all" && n.sentiment !== sentimentFilter) return false
      if (categoryFilter !== "all" && n.category !== categoryFilter) return false

      if (stockFocus) {
        const hit =
          n.relatedStocks?.some((s) => s.ticker === stockFocus || s.name.includes(stockFocus)) ||
          n.title.includes(stockFocus) ||
          n.aiSummary.includes(stockFocus)
        if (!hit) return false
      }

      if (!query) return true

      const hay = [
        n.title,
        n.aiSummary,
        n.source,
        n.category,
        n.sentiment,
        ...(n.relatedStocks ?? []).flatMap((s) => [s.ticker, s.name]),
      ]
        .join(" ")
        .toLowerCase()

      return hay.includes(query)
    })
  }, [serverNews, nowMs, timeRange, sentimentFilter, categoryFilter, q, stockFocus])

  // ✅ TOP 집계는 “기간/카테고리/검색”까지만 반영(=시장 분위기용)
  const newsForTopStocks = useMemo(() => {
    const start = nowMs - rangeMs[timeRange]
    const query = q.trim().toLowerCase()

    return serverNews.filter((n) => {
      if (n.timestamp < start) return false
      if (categoryFilter !== "all" && n.category !== categoryFilter) return false

      if (!query) return true

      const hay = [
        n.title,
        n.aiSummary,
        n.source,
        n.category,
        n.sentiment,
        ...(n.relatedStocks ?? []).flatMap((s) => [s.ticker, s.name]),
      ]
        .join(" ")
        .toLowerCase()

      return hay.includes(query)
    })
  }, [serverNews, nowMs, timeRange, categoryFilter, q])

  // ✅ allTopStocks: slice 없이 “전체”를 만들고, UI에서 단계적으로 보여줌
  const allTopStocks = useMemo((): StockAgg[] => {
    const map = new Map<string, StockAgg>()

    for (const n of newsForTopStocks) {
      for (const s of n.relatedStocks ?? []) {
        const key = s.ticker || s.name
        if (!key) continue

        const cur = map.get(key) ?? {
          ticker: s.ticker,
          name: s.name,
          total: 0,
          positive: 0,
          negative: 0,
          neutral: 0,
        }

        cur.total += 1
        if (n.sentiment === "positive") cur.positive += 1
        else if (n.sentiment === "negative") cur.negative += 1
        else cur.neutral += 1

        map.set(key, cur)
      }
    }

    return Array.from(map.values()).sort((a, b) => b.total - a.total)
  }, [newsForTopStocks])

  const topStocksPreview = useMemo(() => allTopStocks.slice(0, 10), [allTopStocks])

  const topStocksForPanel = useMemo(() => {
    const qv = deferredTopQuery.trim().toLowerCase()

    const filtered = !qv
      ? allTopStocks
      : allTopStocks.filter((s) => {
        const name = (s.name ?? "").toLowerCase()
        const ticker = (s.ticker ?? "").toLowerCase()
        return name.includes(qv) || ticker.includes(qv)
      })

    const sorted = sortTopStocks(filtered, topSort)
    return sorted
  }, [allTopStocks, deferredTopQuery, topSort])

  const topStocksVisible = useMemo(() => {
    return topStocksForPanel.slice(0, topLimit)
  }, [topStocksForPanel, topLimit])

  const headerCountText = useMemo(() => {
    const total = serverNews.length
    const shown = filteredNews.length
    if (total === shown) return `${shown.toLocaleString("ko-KR")}건`
    return `${shown.toLocaleString("ko-KR")} / ${total.toLocaleString("ko-KR")}건`
  }, [serverNews.length, filteredNews.length])

  const clearAll = () => {
    setTimeRange("day")
    setSentimentFilter("all")
    setCategoryFilter("all")
    setQ("")
    setStockFocus(null)
  }

  return (
    <Card className="bg-card border-border overflow-hidden py-0">
      <CardContent className="p-0">
        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-border from-muted/20 to-transparent">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-chart-4/15 flex items-center justify-center">
                  <Zap className="h-4 w-4 text-chart-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-semibold text-foreground">실시간 뉴스</h3>
                    <Badge variant="secondary" className="bg-red-500/15 text-red-500 text-[11px]">
                      LIVE
                    </Badge>
                    <Badge variant="outline" className="text-[11px] text-muted-foreground">
                      {headerCountText}
                    </Badge>
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">필터로 필요한 뉴스만 빠르게 보세요</div>
                </div>
              </div>

              {stockFocus && (
                <div className="mt-2">
                  <Badge variant="outline" className="text-[11px] px-2 py-0 inline-flex items-center gap-1">
                    종목: {stockFocus}
                    <button
                      type="button"
                      className="ml-1 inline-flex items-center text-muted-foreground hover:text-foreground"
                      onClick={() => setStockFocus(null)}
                      aria-label="clear stock focus"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                </div>
              )}
            </div>

            <Button variant="secondary" size="sm" className="h-8" onClick={clearAll}>
              초기화
            </Button>
          </div>

          {/* Toolbar */}
          <div className="mt-3 rounded-xl border border-border bg-background/60 p-3">
            <div className="flex flex-col gap-2">
              {/* Search */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                    value={q}
                    onChange={(e) => setQ(e.target.value)}
                    placeholder="검색: 제목/요약/출처/카테고리/종목"
                    className={cn(
                      "w-full h-9 rounded-lg border border-input bg-background pl-9 pr-9 text-sm",
                      "placeholder:text-muted-foreground",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    )}
                  />
                  {q.trim().length > 0 && (
                    <button
                      type="button"
                      onClick={() => setQ("")}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      aria-label="clear search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="hidden sm:flex items-center gap-1 text-[11px] text-muted-foreground">
                  <SlidersHorizontal className="h-4 w-4" />
                  필터
                </div>
              </div>

              {/* Filters - no labels, only separators */}
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
                <div className="flex flex-wrap items-center gap-1.5">
                  {(Object.keys(RANGE_LABEL) as TimeRange[]).map((r) => (
                    <Pill key={r} active={timeRange === r} onClick={() => setTimeRange(r)}>
                      {RANGE_LABEL[r]}
                    </Pill>
                  ))}
                </div>

                <Separator />

                <div className="flex flex-wrap items-center gap-1.5">
                  <Pill active={sentimentFilter === "all"} onClick={() => setSentimentFilter("all")}>
                    전체
                  </Pill>
                  <Pill active={sentimentFilter === "positive"} onClick={() => setSentimentFilter("positive")}>
                    호재
                  </Pill>
                  <Pill active={sentimentFilter === "negative"} onClick={() => setSentimentFilter("negative")}>
                    악재
                  </Pill>
                  <Pill active={sentimentFilter === "neutral"} onClick={() => setSentimentFilter("neutral")}>
                    중립
                  </Pill>
                </div>

                <Separator />

                <div className="flex flex-wrap items-center gap-1.5">
                  <Pill active={categoryFilter === "all"} onClick={() => setCategoryFilter("all")}>
                    전체
                  </Pill>
                  {(["경제", "산업", "정책", "글로벌", "기업"] as Category[]).map((c) => (
                    <Pill key={c} active={categoryFilter === c} onClick={() => setCategoryFilter(c)}>
                      {c}
                    </Pill>
                  ))}
                </div>
              </div>

              {/* Top Stocks (large-scale friendly UI) */}
              <div className="mt-1 rounded-lg border border-border/60 bg-muted/10 p-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="text-xs font-medium text-foreground">TOP 종목</div>
                    <Badge variant="outline" className="text-[11px] text-muted-foreground">
                      {allTopStocks.length.toLocaleString("ko-KR")}종목
                    </Badge>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="hidden sm:flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-sm bg-red-500/70" /> 호재
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-sm bg-blue-500/70" /> 악재
                      </span>
                      <span className="inline-flex items-center gap-1">
                        <span className="h-2 w-2 rounded-sm bg-muted-foreground/40" /> 중립
                      </span>
                    </div>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => setShowTopNumbers((v) => !v)}
                    >
                      {showTopNumbers ? "숫자 숨김" : "숫자 보기"}
                    </Button>

                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => setTopOpen(true)}
                    >
                      전체 보기
                    </Button>

                    <div className="hidden sm:block text-[11px] text-muted-foreground">
                      {RANGE_LABEL[timeRange]}
                      <span className="mx-1 text-muted-foreground/40">•</span>
                      {categoryFilter === "all" ? "전체" : categoryFilter}
                    </div>
                  </div>
                </div>

                <div className="mt-2 grid grid-cols-1 sm:grid-cols-5 gap-2">
                  {topStocksPreview.length > 0 ? (
                    topStocksPreview.map((s) => {
                      const label = s.name || s.ticker
                      const isActive = stockFocus === s.ticker || stockFocus === s.name

                      return (
                        <button
                          key={s.ticker || s.name}
                          type="button"
                          onClick={() => setStockFocus(s.ticker || s.name)}
                          className={cn(
                            "rounded-xl border p-2 text-left transition",
                            "bg-background hover:bg-muted/30",
                            isActive && "border-foreground/30 ring-1 ring-foreground/20",
                          )}
                          title="클릭하면 해당 종목으로 필터링"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-xs font-medium truncate">{label}</span>
                                <Badge variant="outline" className="text-[11px] tabular-nums">
                                  {s.total}건
                                </Badge>
                              </div>
                            </div>
                          </div>

                          <div className="mt-1">
                            <SentimentStackBar
                              positive={s.positive}
                              negative={s.negative}
                              neutral={s.neutral}
                              total={s.total}
                              showNumbers={showTopNumbers}
                              onClickPositive={() => {
                                setStockFocus(s.ticker || s.name)
                                setSentimentFilter("positive")
                              }}
                              onClickNegative={() => {
                                setStockFocus(s.ticker || s.name)
                                setSentimentFilter("negative")
                              }}
                              onClickNeutral={() => {
                                setStockFocus(s.ticker || s.name)
                                setSentimentFilter("neutral")
                              }}
                            />
                          </div>
                        </button>
                      )
                    })
                  ) : (
                    <div className="text-[11px] text-muted-foreground">아직 집계할 데이터가 없어요.</div>
                  )}

                  {/* ✅ 미리보기만 보여주고 끝내지 말고, 큰 데이터일 때도 항상 접근 가능하게 */}
                  {allTopStocks.length > 10 && (
                    <button
                      type="button"
                      onClick={() => setTopOpen(true)}
                      className={cn(
                        "rounded-xl border p-2 text-left transition",
                        "bg-background hover:bg-muted/30",
                        "flex items-center justify-between",
                      )}
                      title="전체 종목 보기"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-medium">전체 종목</div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          {allTopStocks.length.toLocaleString("ko-KR")}개 종목 · 검색/정렬/더보기
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[11px]">
                        열기
                      </Badge>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Top Stocks Panel (대량 대응: 검색 + 정렬 + 점진 로딩) */}
        {topOpen && (
          <div
            className="fixed inset-0 z-[60]"
            role="dialog"
            aria-modal="true"
            onClick={() => setTopOpen(false)}
          >
            <div className="absolute inset-0 bg-black/40" />
            <div
              className={cn(
                "absolute right-0 top-0 h-full w-full sm:w-[520px]",
                "bg-background border-l border-border shadow-2xl",
                "flex flex-col",
              )}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Panel header (sticky feel) */}
              <div className="p-4 border-b border-border">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold">TOP 종목 전체</div>
                      <Badge variant="outline" className="text-[11px] text-muted-foreground">
                        {topStocksForPanel.length.toLocaleString("ko-KR")}개
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">
                      클릭하면 해당 종목으로 뉴스가 필터링돼요
                    </div>
                  </div>

                  <button
                    type="button"
                    className="h-8 w-8 inline-flex items-center justify-center rounded-md hover:bg-muted/40"
                    onClick={() => setTopOpen(false)}
                    aria-label="close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {/* Search */}
                <div className="mt-3 flex items-center gap-2">
                  <div className="relative flex-1 min-w-0">
                    <SearchIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                      value={topQuery}
                      onChange={(e) => {
                        setTopQuery(e.target.value)
                        setTopLimit(80) // ✅ 검색 시 처음부터 과도 렌더 방지
                      }}
                      placeholder="종목명/티커 검색"
                      className={cn(
                        "w-full h-9 rounded-lg border border-input bg-background pl-9 pr-9 text-sm",
                        "placeholder:text-muted-foreground",
                        "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      )}
                    />
                    {topQuery.trim().length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setTopQuery("")
                          setTopLimit(80)
                        }}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="clear top search"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Sort */}
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] text-muted-foreground mr-1">정렬</span>
                  <Pill active={topSort === "total"} onClick={() => setTopSort("total")}>
                    전체
                  </Pill>
                  <Pill active={topSort === "positive"} onClick={() => setTopSort("positive")}>
                    호재수
                  </Pill>
                  <Pill active={topSort === "negative"} onClick={() => setTopSort("negative")}>
                    악재수
                  </Pill>
                  <Pill active={topSort === "posRatio"} onClick={() => setTopSort("posRatio")}>
                    호재비중
                  </Pill>
                  <Pill active={topSort === "negRatio"} onClick={() => setTopSort("negRatio")}>
                    악재비중
                  </Pill>
                </div>

                <div className="mt-2 text-[11px] text-muted-foreground">
                  기준: {RANGE_LABEL[timeRange]}
                  <span className="mx-1 text-muted-foreground/40">•</span>
                  {categoryFilter === "all" ? "전체" : categoryFilter}
                </div>
              </div>

              {/* List */}
              <div className="flex-1 overflow-y-auto">
                <div className="p-4 space-y-2">
                  {topStocksVisible.map((s) => {
                    const label = s.name || s.ticker
                    const isActive = stockFocus === s.ticker || stockFocus === s.name

                    return (
                      <button
                        key={s.ticker || s.name}
                        type="button"
                        onClick={() => {
                          setStockFocus(s.ticker || s.name)
                          setTopOpen(false)
                        }}
                        className={cn(
                          "w-full rounded-xl border p-3 text-left transition",
                          "bg-background hover:bg-muted/30",
                          isActive && "border-foreground/30 ring-1 ring-foreground/20",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium truncate">{label}</span>
                              <Badge variant="outline" className="text-[11px] tabular-nums">
                                {s.total}건
                              </Badge>
                              {s.ticker && (
                                <span className="text-[11px] text-muted-foreground tabular-nums">{s.ticker}</span>
                              )}
                            </div>
                            <div className="mt-1 text-[11px] text-muted-foreground">
                              호재 {s.positive} · 악재 {s.negative} · 중립 {s.neutral}
                            </div>
                          </div>
                        </div>

                        <div className="mt-2">
                          <SentimentStackBar
                            positive={s.positive}
                            negative={s.negative}
                            neutral={s.neutral}
                            total={s.total}
                            showNumbers={showTopNumbers}
                            onClickPositive={() => {
                              setStockFocus(s.ticker || s.name)
                              setSentimentFilter("positive")
                              setTopOpen(false)
                            }}
                            onClickNegative={() => {
                              setStockFocus(s.ticker || s.name)
                              setSentimentFilter("negative")
                              setTopOpen(false)
                            }}
                            onClickNeutral={() => {
                              setStockFocus(s.ticker || s.name)
                              setSentimentFilter("neutral")
                              setTopOpen(false)
                            }}
                          />
                        </div>
                      </button>
                    )
                  })}

                  {topStocksForPanel.length === 0 && (
                    <div className="rounded-xl border bg-background p-10 text-center text-sm text-muted-foreground">
                      조건에 맞는 종목이 없어요.
                    </div>
                  )}

                  {/* ✅ 점진 로딩: 종목이 수백/수천이어도 UI 버벅임 최소화 */}
                  {topStocksForPanel.length > topLimit && (
                    <div className="pt-2 flex items-center justify-center">
                      <Button
                        type="button"
                        variant="secondary"
                        className="h-9"
                        onClick={() => setTopLimit((v) => v + 120)}
                      >
                        더 보기 ({Math.min(topLimit, topStocksForPanel.length).toLocaleString("ko-KR")} /{" "}
                        {topStocksForPanel.length.toLocaleString("ko-KR")})
                      </Button>
                    </div>
                  )}

                  {topStocksForPanel.length > 400 && (
                    <div className="pt-2 text-center text-[11px] text-muted-foreground">
                      팁: 검색을 쓰면 더 빠르게 찾을 수 있어요.
                    </div>
                  )}
                </div>
              </div>

              {/* Panel footer */}
              <div className="p-4 border-t border-border flex items-center justify-between gap-2">
                <Button
                  type="button"
                  variant="secondary"
                  className="h-9"
                  onClick={() => {
                    setStockFocus(null)
                    setSentimentFilter("all")
                  }}
                >
                  종목/감성 해제
                </Button>
                <Button type="button" className="h-9" onClick={() => setTopOpen(false)}>
                  닫기
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Body */}
        <div className="p-4">
          {/* Mobile */}
          <div className="md:hidden">
            <div
              className={cn("space-y-2", "max-h-[60vh] overflow-y-auto overscroll-contain", "pr-1")}
              style={{ WebkitOverflowScrolling: "touch" }}
            >
              {filteredNews.map((news) => (
                <a
                  key={news.id}
                  href={news.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "block rounded-xl border bg-background p-3 transition",
                    "hover:bg-muted/40 active:bg-muted/50",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                    news.isBreaking && "border-chart-4/40 bg-chart-4/5",
                  )}
                >
                  <div className="flex items-start gap-2">
                    <div className="pt-0.5 shrink-0">{getSentimentIcon(news.sentiment)}</div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {news.isBreaking && (
                            <Badge className="bg-chart-4 text-white text-[11px] px-1.5 py-0 animate-pulse">속보</Badge>
                          )}
                          <Badge variant="secondary" className="text-[11px] px-1.5 py-0">
                            {news.category}
                          </Badge>
                          {getSentimentBadge(news.sentiment)}
                        </div>

                        <div className="shrink-0 text-[11px] text-muted-foreground inline-flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {getTimeDiff(nowMs, news.timestamp)}
                        </div>
                      </div>

                      <div className="mt-1 text-sm font-medium leading-snug line-clamp-2" title={news.title}>
                        {truncate(news.title, 90)}
                      </div>

                      <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                        <Sparkles className="h-3 w-3 text-chart-4 shrink-0" />
                        <span className="text-[12px] line-clamp-2" title={news.aiSummary}>
                          {truncate(news.aiSummary, 90)}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-muted-foreground truncate max-w-[50%]">{SOURCE_KO_MAP[news.source]}</span>

                        <div className="flex items-center gap-1.5">
                          {news.relatedStocks?.length > 0 ? (
                            <div className="flex flex-wrap gap-1 justify-end">
                              {news.relatedStocks.slice(0, 2).map((stock) => (
                                <Link
                                  key={stock.ticker}
                                  href={`/stock/${stock.ticker}`}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <Badge variant="outline" className="text-[11px] px-1.5 py-0 hover:bg-primary/10">
                                    {stock.name}
                                  </Badge>
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">-</span>
                          )}

                          <ExternalLink className="h-3.5 w-3.5 text-primary" />
                        </div>
                      </div>
                    </div>
                  </div>
                </a>
              ))}

              {filteredNews.length === 0 && (
                <div className="rounded-xl border bg-background p-10 text-center text-sm text-muted-foreground">
                  조건에 맞는 뉴스가 없어요.
                </div>
              )}
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden md:block">
            <div className="max-h-[560px] overflow-auto rounded-xl border border-border">
              <Table className="text-xs">
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky top-0 z-10 bg-background w-[44px] px-2 py-2" />
                    <TableHead className="sticky top-0 z-10 bg-background w-[92px] px-2 py-2">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        시간
                      </span>
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 bg-background w-[260px] px-2 py-2">분류</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-background px-2 py-2">제목 / 요약</TableHead>
                    <TableHead className="sticky top-0 z-10 bg-background w-[240px] px-2 py-2">
                      관련 종목
                    </TableHead>
                    <TableHead className="sticky top-0 z-10 bg-background w-[72px] px-2 py-2 text-right">
                      원문
                    </TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {filteredNews.map((news) => (
                    <TableRow key={news.id} className={cn("hover:bg-muted/40", news.isBreaking && "bg-chart-4/5")}>
                      <TableCell className="px-2 py-2 align-top">{getSentimentIcon(news.sentiment)}</TableCell>

                      <TableCell className="px-2 py-2 align-top text-muted-foreground whitespace-nowrap">
                        {getTimeDiff(nowMs, news.timestamp)}
                      </TableCell>

                      <TableCell className="px-2 py-2 align-top">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {news.isBreaking && (
                            <Badge className="bg-chart-4 text-white text-[11px] px-1.5 py-0 animate-pulse">속보</Badge>
                          )}
                          <Badge variant="secondary" className="text-[11px] px-1.5 py-0">
                            {news.category}
                          </Badge>
                          {getSentimentBadge(news.sentiment)}
                          <span className="text-[11px] text-muted-foreground ml-1 truncate max-w-[140px]">
                            {SOURCE_KO_MAP[news.source]}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell className="px-2 py-2 align-top">
                        <div className="min-w-0">
                          <div className="text-sm font-medium leading-snug line-clamp-1" title={news.title}>
                            {truncate(news.title, 50)}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                            <Sparkles className="h-3 w-3 text-chart-4 shrink-0" />
                            <span className="line-clamp-1" title={news.aiSummary}>
                              {truncate(news.aiSummary, 60)}
                            </span>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="px-2 py-2 align-top">
                        <div className="flex flex-wrap gap-1">
                          {news.relatedStocks.length > 0 ? (
                            news.relatedStocks.slice(0, 4).map((stock) => (
                              <Link key={stock.ticker} href={`/stock/${stock.ticker}`}>
                                <Badge
                                  variant="outline"
                                  className="text-[11px] px-1.5 py-0 hover:bg-primary/10 cursor-pointer"
                                >
                                  {stock.name}
                                </Badge>
                              </Link>
                            ))
                          ) : (
                            <span className="text-[11px] text-muted-foreground">-</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="px-2 py-2 align-top text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 px-2 text-xs gap-1 text-primary hover:text-primary"
                          asChild
                        >
                          <a href={news.url} target="_blank" rel="noopener noreferrer">
                            <span className="hidden sm:inline">원문</span>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredNews.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        조건에 맞는 뉴스가 없어요.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
