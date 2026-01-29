// app/(whatever)/components/RealtimeNews.tsx
"use client"

import { useDeferredValue, useEffect, useMemo, useState, type ReactNode } from "react"
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
import type { RealtimeNews as RealtimeNewsModel } from "@/domain/stock/types/realtime-news.model"

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

const normalizeSentiment = (v: string | undefined | null): Sentiment => {
  if (v === "positive" || v === "negative" || v === "neutral") return v
  return "neutral"
}

const normalizeCategory = (v: string | undefined | null): Category => {
  if (v === "경제" || v === "산업" || v === "정책" || v === "글로벌" || v === "기업") return v
  return "기업"
}

const isBreakingByText = (title: string) => {
  if (!title) return false
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

const SOURCE_KO_MAP: Record<string, string> = {
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
  sedaily: "서울경제",
}

// =========================
// UI helpers
// =========================
function Separator() {
  return <span className="mx-2 text-muted-foreground/40 select-none">•</span>
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 px-3 rounded-full text-xs transition border whitespace-nowrap",
        active ? "bg-accent text-background border-accent" : "bg-background hover:bg-muted/40 text-foreground border-border",
      )}
    >
      {children}
    </button>
  )
}

function SectionCard({
                       title,
                       right,
                       children,
                       className,
                     }: {
  title: string
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
    <div className={cn("rounded-xl border border-border bg-background", className)}>
      <div className="px-3 py-2 border-b border-border flex items-center justify-between gap-2">
        <div className="text-xs font-medium text-foreground">{title}</div>
        {right}
      </div>
      <div className="p-3">{children}</div>
    </div>
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
      <div className="h-2.5 w-full rounded-full bg-secondary overflow-hidden flex">
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
// Mapper (REAL DATA)
// =========================
const mapModelToUi = (n: RealtimeNewsModel): RealtimeNewsUi => {
  return {
    id: n.newsId,
    title: n.title,
    source: n.source,
    timestamp: toEpochMs(n.crawledAt as any),
    sentiment: normalizeSentiment(n.sentiment),
    relatedStocks: (n.relatedStock ?? []).map((s) => ({ ticker: s.stockCode, name: s.name })),
    aiSummary: (n.safeBrief ?? "").trim() || "요약 준비 중",
    category: normalizeCategory(n.category),
    isBreaking: isBreakingByText(n.title),
    url: n.url,
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

// =========================
// Component
// =========================
export function RealtimeNews() {
  const { data = [] } = useRealtimeNews()

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

  // Top panel
  const [topOpen, setTopOpen] = useState(false)
  const [topQuery, setTopQuery] = useState("")
  const deferredTopQuery = useDeferredValue(topQuery)
  const [topSort, setTopSort] = useState<TopSort>("total")
  const [topLimit, setTopLimit] = useState(80)

  useEffect(() => {
    if (!topOpen) {
      setTopQuery("")
      setTopSort("total")
      setTopLimit(80)
    }
  }, [topOpen])

  const serverNews: RealtimeNewsUi[] = useMemo(() => {
    return (data ?? []).map(mapModelToUi).sort((a, b) => b.timestamp - a.timestamp)
  }, [data])

  const filteredNews = useMemo(() => {
    const start = nowMs - rangeMs[timeRange]
    const query = q.trim().toLowerCase()

    return serverNews.filter((n) => {
      if (n.timestamp < start) return false
      if (sentimentFilter !== "all" && n.sentiment !== sentimentFilter) return false
      if (categoryFilter !== "all" && n.category !== categoryFilter) return false

      if (stockFocus && n.title) {
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

  // Top 집계는 기간/카테고리/검색까지만 반영
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

  // 모바일용: TOP 스트립은 더 짧게
  const topStocksStripMobile = useMemo(() => allTopStocks.slice(0, 10), [allTopStocks])

  const topStocksPreview = useMemo(() => allTopStocks.slice(0, 18), [allTopStocks])

  const topStocksForPanel = useMemo(() => {
    const qv = deferredTopQuery.trim().toLowerCase()

    const filtered = !qv
      ? allTopStocks
      : allTopStocks.filter((s) => {
        const name = (s.name ?? "").toLowerCase()
        const ticker = (s.ticker ?? "").toLowerCase()
        return name.includes(qv) || ticker.includes(qv)
      })

    return sortTopStocks(filtered, topSort)
  }, [allTopStocks, deferredTopQuery, topSort])

  const topStocksVisible = useMemo(() => topStocksForPanel.slice(0, topLimit), [topStocksForPanel, topLimit])

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
    <section
      className="w-full px-3 sm:px-4 py-3 sm:py-4"
      style={{ height: "calc(100svh - var(--app-header-h, 64px))" }}
    >
      <Card className="h-full border-border bg-card overflow-hidden">
        <CardContent className="h-full p-0 flex flex-col min-h-0">
          {/* ======= Header ======= */}
          <div className="px-3 sm:px-4 py-3 border-b border-border bg-background/70 backdrop-blur">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="h-9 w-9 rounded-xl bg-chart-4/15 flex items-center justify-center shrink-0">
                    <Zap className="h-4 w-4 text-chart-4" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base sm:text-sm font-semibold text-foreground">실시간 뉴스</h3>
                      <Badge variant="secondary" className="bg-red-500/15 text-red-500 text-[11px]">
                        LIVE
                      </Badge>
                      <Badge variant="outline" className="text-[11px] text-muted-foreground">
                        {headerCountText}
                      </Badge>
                    </div>

                    {stockFocus && (
                      <div className="mt-1">
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
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="secondary" size="sm" className="h-9" onClick={clearAll}>
                  초기화
                </Button>
              </div>
            </div>

            {/* Search */}
            <div className="mt-3 flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="검색: 제목/요약/출처/카테고리/종목"
                  className={cn(
                    "w-full h-10 rounded-xl border border-input bg-background pl-10 pr-10 text-sm",
                    "placeholder:text-muted-foreground",
                    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                  )}
                />
                {q.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setQ("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              <Button variant="secondary" size="sm" className="h-10 px-3" onClick={() => setTopOpen(true)}>
                TOP
              </Button>
            </div>

            {/* ======= Filters: Mobile collapsible ======= */}
            <div className="mt-3 lg:hidden">
              <details className="rounded-2xl border border-border bg-background p-3">
                <summary className="cursor-pointer list-none">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <SlidersHorizontal className="h-4 w-4" />
                    필터
                    <span className="ml-auto text-[11px]">
                      {RANGE_LABEL[timeRange]} · {categoryFilter === "all" ? "전체" : categoryFilter} ·{" "}
                      {sentimentFilter === "all" ? "전체" : sentimentFilter}
                    </span>
                  </div>
                </summary>

                <div className="mt-3 space-y-3">
                  <div>
                    <div className="text-[11px] text-muted-foreground mb-2">기간</div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
                      {(Object.keys(RANGE_LABEL) as TimeRange[]).map((r) => (
                        <Pill key={r} active={timeRange === r} onClick={() => setTimeRange(r)}>
                          {RANGE_LABEL[r]}
                        </Pill>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-muted-foreground mb-2">감성</div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
                  </div>

                  <div>
                    <div className="text-[11px] text-muted-foreground mb-2">카테고리</div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-1">
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
                </div>
              </details>
            </div>

            {/* ======= Filters: Desktop always open ======= */}
            <div className="mt-3 hidden lg:block rounded-xl border border-border bg-background p-3">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <SlidersHorizontal className="h-4 w-4" />
                필터
                <span className="ml-auto">
                  기준: {RANGE_LABEL[timeRange]}
                  <span className="mx-1 text-muted-foreground/40">•</span>
                  {categoryFilter === "all" ? "전체" : categoryFilter}
                </span>
              </div>

              <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
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
            </div>

            {/* ======= Mobile TOP stocks strip (가로 스크롤) ======= */}
            <div className="mt-3 lg:hidden">
              <div className="flex items-center justify-between">
                <div className="text-xs font-medium text-foreground">
                  TOP 종목 <span className="text-[11px] text-muted-foreground">({allTopStocks.length.toLocaleString("ko-KR")})</span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
                  <button
                    type="button"
                    onClick={() => setShowTopNumbers((v) => !v)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {showTopNumbers ? "숫자 숨김" : "숫자 보기"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setTopOpen(true)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    전체 보기
                  </button>
                </div>
              </div>

              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {topStocksStripMobile.length > 0 ? (
                  topStocksStripMobile.map((s) => {
                    const label = s.name || s.ticker
                    const isActive = stockFocus === s.ticker || stockFocus === s.name

                    return (
                      <button
                        key={s.ticker || s.name}
                        type="button"
                        onClick={() => setStockFocus(s.ticker || s.name)}
                        className={cn(
                          "min-w-[240px] max-w-[240px] rounded-2xl border p-3 text-left transition",
                          "bg-background hover:bg-muted/30",
                          isActive && "border-foreground/30 ring-1 ring-foreground/20",
                        )}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold truncate">{label}</span>
                              <Badge variant="outline" className="text-[11px] tabular-nums">
                                {s.total}건
                              </Badge>
                            </div>
                            {s.ticker && <div className="mt-0.5 text-[11px] text-muted-foreground">{s.ticker}</div>}
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
              </div>
            </div>
          </div>

          {/* ======= Main layout: Desktop only left panel + right ======= */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[360px_1fr]">
            {/* Left: Desktop only */}
            <aside className="hidden lg:block min-h-0 border-r border-border bg-background/40">
              <div className="h-full min-h-0 overflow-y-auto p-4 space-y-3">
                <SectionCard
                  title="TOP 종목"
                  right={
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setShowTopNumbers((v) => !v)}
                        className="text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        {showTopNumbers ? "숫자 숨김" : "숫자 보기"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setTopOpen(true)}
                        className="text-[11px] text-muted-foreground hover:text-foreground"
                      >
                        전체
                      </button>
                    </div>
                  }
                >
                  <div className="text-[11px] text-muted-foreground mb-2">
                    {allTopStocks.length.toLocaleString("ko-KR")}종목
                    <span className="mx-1 text-muted-foreground/40">•</span>
                    클릭하면 종목 필터
                  </div>

                  <div className="space-y-2">
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
                              "w-full rounded-xl border p-2 text-left transition",
                              "bg-background hover:bg-muted/30",
                              isActive && "border-foreground/30 ring-1 ring-foreground/20",
                            )}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium truncate">{label}</span>
                                  <Badge variant="outline" className="text-[11px] tabular-nums">
                                    {s.total}건
                                  </Badge>
                                  {s.ticker && (
                                    <span className="text-[11px] text-muted-foreground tabular-nums">{s.ticker}</span>
                                  )}
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
                              </div>
                            </div>
                          </button>
                        )
                      })
                    ) : (
                      <div className="text-[11px] text-muted-foreground">아직 집계할 데이터가 없어요.</div>
                    )}
                  </div>

                  {stockFocus && (
                    <div className="mt-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 w-full"
                        onClick={() => setStockFocus(null)}
                      >
                        종목 필터 해제
                      </Button>
                    </div>
                  )}
                </SectionCard>

                <div className="rounded-xl border border-border bg-muted/10 p-3 text-[11px] text-muted-foreground">
                  <div className="flex items-center justify-between gap-2">
                    <span>현재 표시</span>
                    <span className="tabular-nums">{filteredNews.length.toLocaleString("ko-KR")}건</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span>전체 수신</span>
                    <span className="tabular-nums">{serverNews.length.toLocaleString("ko-KR")}건</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Right: News */}
            <div className="min-h-0">
              {/* Mobile: 카드 리스트 (한 화면에 시원하게) */}
              <div className="lg:hidden h-full min-h-0 overflow-y-auto overscroll-contain p-3 pb-[env(safe-area-inset-bottom)] space-y-3">
                {filteredNews.map((news) => (
                  <a
                    key={news.id}
                    href={news.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      "block rounded-2xl border bg-background p-4 transition",
                      "hover:bg-muted/40 active:bg-muted/50",
                      "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                      news.isBreaking && "border-chart-4/40 bg-chart-4/5",
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="pt-1 shrink-0">{getSentimentIcon(news.sentiment)}</div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            {news.isBreaking && (
                              <Badge className="bg-chart-4 text-white text-[11px] px-2 py-0.5 animate-pulse">
                                속보
                              </Badge>
                            )}
                            <Badge variant="secondary" className="text-[11px] px-2 py-0.5">
                              {news.category}
                            </Badge>
                            {getSentimentBadge(news.sentiment)}
                          </div>

                          <div className="shrink-0 text-[11px] text-muted-foreground inline-flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5" />
                            {getTimeDiff(nowMs, news.timestamp)}
                          </div>
                        </div>

                        <div className="mt-2 text-base font-semibold leading-snug line-clamp-2" title={news.title}>
                          {truncate(news.title, 120)}
                        </div>

                        <div className="mt-2 flex items-start gap-2 text-muted-foreground">
                          <Sparkles className="h-4 w-4 text-chart-4 shrink-0 mt-0.5" />
                          <span className="text-sm leading-relaxed line-clamp-3" title={news.aiSummary}>
                            {truncate(news.aiSummary, 140)}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-2">
                          <span className="text-[12px] text-muted-foreground truncate max-w-[45%]">
                            {SOURCE_KO_MAP[news.source] ?? news.source}
                          </span>

                          <div className="flex items-center gap-2">
                            {news.relatedStocks?.length > 0 ? (
                              <div className="flex gap-1.5 overflow-x-auto max-w-[55vw]">
                                {news.relatedStocks.slice(0, 8).map((stock) => (
                                  <Link
                                    key={stock.ticker}
                                    href={`/stock/${stock.ticker}`}
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Badge variant="outline" className="text-[11px] px-2 py-0.5 hover:bg-primary/10">
                                      {stock.name}
                                    </Badge>
                                  </Link>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">-</span>
                            )}

                            <ExternalLink className="h-4 w-4 text-primary shrink-0" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </a>
                ))}

                {filteredNews.length === 0 && (
                  <div className="rounded-2xl border bg-background p-10 text-center text-sm text-muted-foreground">
                    조건에 맞는 뉴스가 없어요.
                  </div>
                )}
              </div>

              {/* Desktop: 테이블 */}
              <div className="hidden lg:block h-full min-h-0 overflow-auto">
                <div className="p-4">
                  <div className="rounded-xl border border-border overflow-hidden">
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
                          <TableHead className="sticky top-0 z-10 bg-background w-[240px] px-2 py-2">관련 종목</TableHead>
                          <TableHead className="sticky top-0 z-10 bg-background w-[72px] px-2 py-2 text-right">원문</TableHead>
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
                                  <Badge className="bg-chart-4 text-white text-[11px] px-1.5 py-0 animate-pulse">
                                    속보
                                  </Badge>
                                )}
                                <Badge variant="secondary" className="text-[11px] px-1.5 py-0">
                                  {news.category}
                                </Badge>
                                {getSentimentBadge(news.sentiment)}
                                <span className="text-[11px] text-muted-foreground ml-1 truncate max-w-[140px]">
                                  {SOURCE_KO_MAP[news.source] ?? news.source}
                                </span>
                              </div>
                            </TableCell>

                            <TableCell className="px-2 py-2 align-top">
                              <div className="min-w-0">
                                <div className="text-sm font-medium leading-snug line-clamp-1" title={news.title}>
                                  {truncate(news.title, 70)}
                                </div>
                                <div className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                                  <Sparkles className="h-3 w-3 text-chart-4 shrink-0" />
                                  <span className="line-clamp-1" title={news.aiSummary}>
                                    {truncate(news.aiSummary, 90)}
                                  </span>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="px-2 py-2 align-top">
                              <div className="flex flex-wrap gap-1">
                                {news.relatedStocks.length > 0 ? (
                                  news.relatedStocks.slice(0, 6).map((stock) => (
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
            </div>
          </div>

          {/* ======= Top Stocks Panel (mobile bottom-sheet / desktop right drawer) ======= */}
          {topOpen && (
            <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" onClick={() => setTopOpen(false)}>
              <div className="absolute inset-0 bg-black/40" />

              <div
                className={cn(
                  // Mobile: bottom sheet
                  "absolute inset-x-0 bottom-0 h-[85svh] rounded-t-2xl",
                  "bg-background border-t border-border shadow-2xl",
                  "flex flex-col",
                  // Desktop: right drawer
                  "sm:inset-y-0 sm:right-0 sm:left-auto sm:bottom-auto sm:h-full sm:w-[520px] sm:rounded-none sm:border-t-0 sm:border-l",
                )}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-4 border-b border-border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">TOP 종목 전체</div>
                        <Badge variant="outline" className="text-[11px] text-muted-foreground">
                          {topStocksForPanel.length.toLocaleString("ko-KR")}개
                        </Badge>
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">클릭하면 해당 종목으로 뉴스가 필터링돼요</div>
                    </div>

                    <button
                      type="button"
                      className="h-9 w-9 inline-flex items-center justify-center rounded-xl hover:bg-muted/40"
                      onClick={() => setTopOpen(false)}
                      aria-label="close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <div className="relative flex-1 min-w-0">
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        value={topQuery}
                        onChange={(e) => {
                          setTopQuery(e.target.value)
                          setTopLimit(80)
                        }}
                        placeholder="종목명/티커 검색"
                        className={cn(
                          "w-full h-10 rounded-xl border border-input bg-background pl-10 pr-10 text-sm",
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
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          aria-label="clear top search"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
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
                            "w-full rounded-2xl border p-4 text-left transition",
                            "bg-background hover:bg-muted/30",
                            isActive && "border-foreground/30 ring-1 ring-foreground/20",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-base font-semibold truncate">{label}</span>
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

                          <div className="mt-3">
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
                      <div className="rounded-2xl border bg-background p-10 text-center text-sm text-muted-foreground">
                        조건에 맞는 종목이 없어요.
                      </div>
                    )}

                    {topStocksForPanel.length > topLimit && (
                      <div className="pt-2 flex items-center justify-center">
                        <Button
                          type="button"
                          variant="secondary"
                          className="h-10"
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

                <div className="p-4 border-t border-border flex items-center justify-between gap-2 pb-[env(safe-area-inset-bottom)]">
                  <Button
                    type="button"
                    variant="secondary"
                    className="h-10"
                    onClick={() => {
                      setStockFocus(null)
                      setSentimentFilter("all")
                    }}
                  >
                    종목/감성 해제
                  </Button>
                  <Button type="button" className="h-10" onClick={() => setTopOpen(false)}>
                    닫기
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
