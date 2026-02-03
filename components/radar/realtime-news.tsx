// app/(whatever)/components/RealtimeNews.tsx
"use client"

import {
    useDeferredValue,
    useEffect,
    useMemo,
    useRef,
    useState,
    useCallback,
    type ReactNode,
} from "react"
import Link from "next/link"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table"
import {
    TrendingUp,
    TrendingDown,
    Minus,
    ExternalLink,
    Sparkles,
    Clock,
    X,
    Search as SearchIcon,
    SlidersHorizontal,
    ChevronDown,
    ChevronUp,
} from "lucide-react"
import {cn} from "@/lib/utils"
import {useRealtimeNews} from "@/domain/stock/queries/useRealtimeNews"
import type {RealtimeNews as RealtimeNewsModel} from "@/domain/stock/types/realtime-news.model"

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
            return <TrendingUp className="h-4 w-4 text-red-500"/>
        case "negative":
            return <TrendingDown className="h-4 w-4 text-blue-500"/>
        default:
            return <Minus className="h-4 w-4 text-muted-foreground"/>
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

const RANGE_LABEL: Record<TimeRange, string> = {day: "일", week: "주", month: "월", year: "년"}
const RANGE_TO_BACKEND: Record<TimeRange, string> = {
    day: "24H",
    week: "7D",
    month: "30D",
    year: "365D",
}

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

const PREFETCH_ROOT_MARGIN = "900px 0px"

// =========================
// UI helpers
// =========================
function Pill({
                  active,
                  onClick,
                  children,
              }: {
    active: boolean
    onClick: () => void
    children: ReactNode
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                "h-8 px-3 rounded-full text-xs transition border whitespace-nowrap",
                active
                    ? "bg-primary text-primary-foreground border-primary shadow-sm"
                    : "bg-transparent hover:bg-muted/40 text-foreground border-border",
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
            <div className="h-2.5 w-full bg-secondary/70 overflow-hidden flex">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation()
                        onClickPositive?.()
                    }}
                    className="h-full bg-red-500/70 hover:bg-red-500/90 transition"
                    style={{width: `${pPct}%`}}
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
                    style={{width: `${nPct}%`}}
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
                    style={{width: `${uPct}%`}}
                    aria-label="neutral"
                    title={`중립 ${neutral}건`}
                />
            </div>

            {showNumbers && (
                <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground tabular-nums">
          <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-red-500/70"/>
              {positive}
          </span>
                    <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-blue-500/70"/>
                        {negative}
          </span>
                    <span className="inline-flex items-center gap-1">
            <span className="h-2 w-2 rounded-sm bg-muted-foreground/40"/>
                        {neutral}
          </span>
                    <span className="ml-auto text-muted-foreground/80">합 {total}</span>
                </div>
            )}
        </div>
    )
}

function Skeleton({className}: { className?: string }) {
    return <div className={cn("animate-pulse bg-muted/50", className)}/>
}

function Spinner({className}: { className?: string }) {
    return (
        <span
            className={cn(
                "inline-block h-4 w-4 rounded-full border-2 border-muted-foreground/30 border-t-muted-foreground animate-spin",
                className,
            )}
            aria-hidden="true"
        />
    )
}

function MobileNewsSkeleton() {
    return (
        <ul className="divide-y divide-border/60">
            {Array.from({length: 8}).map((_, i) => (
                <li key={i} className="px-4 py-4">
                    <div className="flex items-start gap-3">
                        <Skeleton className="h-4 w-4"/>
                        <div className="min-w-0 flex-1 space-y-2">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-5 w-14 rounded-full"/>
                                    <Skeleton className="h-5 w-12 rounded-full"/>
                                    <Skeleton className="h-5 w-16 rounded-full"/>
                                </div>
                                <Skeleton className="h-4 w-16"/>
                            </div>

                            <Skeleton className="h-5 w-[92%]"/>
                            <Skeleton className="h-5 w-[74%]"/>

                            <div className="flex items-start gap-2 pt-1">
                                <Skeleton className="h-4 w-4"/>
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-4 w-[88%]"/>
                                    <Skeleton className="h-4 w-[64%]"/>
                                </div>
                            </div>

                            <div className="mt-2 flex gap-2">
                                <Skeleton className="h-6 w-20 rounded-full"/>
                                <Skeleton className="h-6 w-24 rounded-full"/>
                                <Skeleton className="h-6 w-16 rounded-full"/>
                            </div>
                        </div>
                    </div>
                </li>
            ))}
        </ul>
    )
}

// ✅ 오른쪽(데스크탑) 스켈레톤: 바깥 padding 없이 꽉 차게
function DesktopTableSkeleton() {
    return (
        <div className="h-full w-full">
            <div className="border-b border-border/60 bg-background/70 px-3 py-3 flex items-center gap-3">
                <Skeleton className="h-4 w-8"/>
                <Skeleton className="h-4 w-16"/>
                <Skeleton className="h-4 w-24"/>
                <Skeleton className="h-4 w-40"/>
                <Skeleton className="h-4 w-28"/>
                <div className="ml-auto">
                    <Skeleton className="h-4 w-10"/>
                </div>
            </div>

            <div className="divide-y divide-border/50">
                {Array.from({length: 14}).map((_, i) => (
                    <div key={i} className={cn("px-3 py-3 flex items-start gap-3", i % 2 === 1 && "bg-muted/10")}>
                        <Skeleton className="h-4 w-4"/>
                        <Skeleton className="h-4 w-16"/>
                        <div className="w-[240px] space-y-2">
                            <Skeleton className="h-5 w-40 rounded-full"/>
                            <Skeleton className="h-4 w-28 rounded-full"/>
                        </div>
                        <div className="flex-1 space-y-2">
                            <Skeleton className="h-5 w-[68%]"/>
                            <Skeleton className="h-4 w-[54%]"/>
                        </div>
                        <div className="w-[220px] flex flex-wrap gap-2">
                            <Skeleton className="h-6 w-16 rounded-full"/>
                            <Skeleton className="h-6 w-20 rounded-full"/>
                            <Skeleton className="h-6 w-14 rounded-full"/>
                        </div>
                        <div className="w-[72px] flex justify-end">
                            <Skeleton className="h-8 w-10"/>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ✅ 왼쪽 TOP 종목 스켈레톤(카드 내부용)
function TopStocksListSkeleton({rows = 10}: { rows?: number }) {
    return (
        <div className="space-y-2">
            {Array.from({length: rows}).map((_, i) => (
                <div key={i} className="border border-border/60 p-3">
                    <div className="flex items-center gap-2">
                        <Skeleton className="h-4 w-28"/>
                        <Skeleton className="h-4 w-12 rounded-full"/>
                        <Skeleton className="h-4 w-16 rounded-full"/>
                    </div>
                    <div className="mt-3">
                        <Skeleton className="h-2.5 w-full"/>
                    </div>
                </div>
            ))}
        </div>
    )
}

// =========================
// Mapper (REAL DATA)
// =========================
const mapModelToUi = (n: RealtimeNewsModel): RealtimeNewsUi => {
    const published = (n as any).publishedAt ?? (n as any).published_at
    const tsSource = published ?? (n as any).crawledAt ?? Date.now()

    return {
        id: (n as any).newsId ?? (n as any).id,
        title: (n as any).title ?? "",
        source: (n as any).source ?? "",
        timestamp: toEpochMs(tsSource as any),
        sentiment: normalizeSentiment((n as any).sentiment),
        relatedStocks: ((n as any).relatedStock ?? (n as any).relatedStocks ?? []).map((s: any) => ({
            ticker: s.stockCode ?? s.ticker ?? "",
            name: s.name ?? "",
        })),
        aiSummary: ((n as any).safeBrief ?? "").trim() || "요약 준비 중",
        category: normalizeCategory((n as any).category),
        isBreaking: isBreakingByText((n as any).title ?? ""),
        url: (n as any).url ?? "",
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
    const [timeRange, setTimeRange] = useState<TimeRange>("day")
    const [sentimentFilter, setSentimentFilter] = useState<SentimentFilter>("all")
    const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all")

    const backendTimeRange = RANGE_TO_BACKEND[timeRange]
    const backendSentiment = sentimentFilter === "all" ? "ALL" : sentimentFilter
    const backendCategory = categoryFilter === "all" ? "ALL" : categoryFilter

    const {data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage, refetch} = useRealtimeNews({
        timeRange: backendTimeRange,
        sentiment: backendSentiment,
        category: backendCategory,
        size: 30,
    })

    const [nowMs, setNowMs] = useState(() => Date.now())
    useEffect(() => {
        const t = setInterval(() => setNowMs(Date.now()), 30_000)
        return () => clearInterval(t)
    }, [])

    // Infinite prefetch
    const mobileScrollRef = useRef<HTMLDivElement | null>(null)
    const desktopScrollRef = useRef<HTMLDivElement | null>(null)
    const mobileSentinelRef = useRef<HTMLDivElement | null>(null)
    const desktopSentinelRef = useRef<HTMLDivElement | null>(null)

    const fetchLockRef = useRef(false)
    useEffect(() => {
        fetchLockRef.current = isFetchingNextPage
    }, [isFetchingNextPage])

    const tryFetchNext = useCallback(async () => {
        if (!hasNextPage) return
        if (fetchLockRef.current) return

        fetchLockRef.current = true
        try {
            await fetchNextPage()
        } finally {
            fetchLockRef.current = false
        }
    }, [hasNextPage, fetchNextPage])

    useEffect(() => {
        if (!hasNextPage) return
        const root = mobileScrollRef.current
        const target = mobileSentinelRef.current
        if (!target) return

        const obs = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) void tryFetchNext()
            },
            {root, rootMargin: PREFETCH_ROOT_MARGIN, threshold: 0},
        )

        obs.observe(target)
        return () => obs.disconnect()
    }, [hasNextPage, tryFetchNext])

    useEffect(() => {
        if (!hasNextPage) return
        const root = desktopScrollRef.current
        const target = desktopSentinelRef.current
        if (!target) return

        const obs = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) void tryFetchNext()
            },
            {root, rootMargin: PREFETCH_ROOT_MARGIN, threshold: 0},
        )

        obs.observe(target)
        return () => obs.disconnect()
    }, [hasNextPage, tryFetchNext])

    // client-side filters
    const [q, setQ] = useState("")
    const [stockFocus, setStockFocus] = useState<string | null>(null)
    const [showTopNumbers, setShowTopNumbers] = useState(false)

    // mobile: controls collapsed by default
    const [mobileControlsOpen, setMobileControlsOpen] = useState(false)

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
        const items = data?.pages?.flatMap((p: any) => p?.content ?? []) ?? []
        return items.map(mapModelToUi).sort((a, b) => b.timestamp - a.timestamp)
    }, [data])

    const filteredNews = useMemo(() => {
        const query = q.trim().toLowerCase()

        return serverNews.filter((n) => {
            if (stockFocus) {
                const hit =
                    n.relatedStocks?.some((s) => s.ticker === stockFocus || (s.name ?? "").includes(stockFocus)) ||
                    (n.title ?? "").includes(stockFocus) ||
                    (n.aiSummary ?? "").includes(stockFocus)
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
    }, [serverNews, q, stockFocus])

    const newsForTopStocks = useMemo(() => {
        const query = q.trim().toLowerCase()
        if (!query) return serverNews

        return serverNews.filter((n) => {
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
    }, [serverNews, q])

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
        const shown = filteredNews.length
        return hasNextPage ? `${shown.toLocaleString("ko-KR")}건+` : `${shown.toLocaleString("ko-KR")}건`
    }, [filteredNews.length, hasNextPage])

    const clearAll = () => {
        setTimeRange("day")
        setSentimentFilter("all")
        setCategoryFilter("all")
        setQ("")
        setStockFocus(null)
        refetch()
    }

    return (
        <section className="w-full h-[calc(100svh-var(--app-header-h,64px))] flex flex-col min-h-0">
            {/* ======= Main layout ======= */}
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[360px_1fr]">
                {/* Left: Desktop side (compact) */}
                <aside className="hidden lg:flex min-h-0 border-r border-border/70 flex-col bg-background">
                    <div className="h-full min-h-0 overflow-y-auto px-3 py-3 space-y-3">
                        {/* Search + Filter (one card) */}
                        <Card className="rounded-2xl border-border/60 shadow-sm">
                            <CardHeader className="py-3 px-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-[13px] font-semibold">검색 / 필터</CardTitle>

                                    {(q.trim().length > 0 || stockFocus || timeRange !== "day" || sentimentFilter !== "all" || categoryFilter !== "all") && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                clearAll()
                                            }}
                                            className="text-[11px] text-muted-foreground hover:text-foreground"
                                        >
                                            초기화
                                        </button>
                                    )}
                                </div>
                            </CardHeader>

                            <CardContent className="px-4 pb-4 pt-0 space-y-3">
                                {/* Search input */}
                                <div className="relative">
                                    <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <input
                                        value={q}
                                        onChange={(e) => setQ(e.target.value)}
                                        placeholder="제목/요약/출처/종목"
                                        className={cn(
                                            "w-full h-9 rounded-xl border border-input bg-background/40 pl-9 pr-9 text-[12.5px]",
                                            "placeholder:text-muted-foreground",
                                            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
                                        )}
                                    />
                                    {q.trim().length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => setQ("")}
                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                            aria-label="clear search"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    )}
                                </div>

                                {stockFocus && (
                                    <div className="flex items-center justify-between gap-2">
                                        <Badge variant="outline" className="text-[11px] px-2.5 py-0.5 rounded-full">
                                            종목: {stockFocus}
                                        </Badge>
                                        <button
                                            type="button"
                                            className="text-[11px] text-muted-foreground hover:text-foreground"
                                            onClick={() => setStockFocus(null)}
                                        >
                                            해제
                                        </button>
                                    </div>
                                )}

                                {/* Filters */}
                                <div className="space-y-2.5">
                                    <div className="flex items-center justify-between">
                                        <div className="text-[11px] text-muted-foreground">기간</div>
                                        <Button variant="secondary" size="sm" className="h-8 px-3 text-[11px]" onClick={() => refetch()}>
                                            적용
                                        </Button>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-1.5">
                                        {(Object.keys(RANGE_LABEL) as TimeRange[]).map((r) => (
                                            <Pill key={r} active={timeRange === r} onClick={() => setTimeRange(r)}>
                                                {RANGE_LABEL[r]}
                                            </Pill>
                                        ))}
                                    </div>

                                    <div className="space-y-1">
                                        <div className="text-[11px] text-muted-foreground">감성</div>
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
                                    </div>

                                    <div className="space-y-1">
                                        <div className="text-[11px] text-muted-foreground">카테고리</div>
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

                                    <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                                        <div className="text-[11px] text-muted-foreground truncate">
                                            {RANGE_LABEL[timeRange]} · {categoryFilter === "all" ? "전체" : categoryFilter} ·{" "}
                                            {sentimentFilter === "all" ? "전체" : sentimentFilter}
                                        </div>
                                        <Button variant="ghost" size="sm" className="h-8 px-2 text-[11px]" onClick={clearAll}>
                                            초기화
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Top Stocks (rounded card, inside elements edge-to-edge) */}
                        <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
                            <CardHeader className="py-3 px-4">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-[13px] font-semibold">
                                        TOP 종목{" "}
                                        <span className="text-[11px] text-muted-foreground">
              ({isLoading ? "—" : allTopStocks.length.toLocaleString("ko-KR")})
            </span>
                                    </CardTitle>

                                    <div className="flex items-center gap-2 text-[11px]">
                                        <button
                                            type="button"
                                            onClick={() => setShowTopNumbers((v) => !v)}
                                            className="text-muted-foreground hover:text-foreground"
                                            disabled={isLoading}
                                        >
                                            {showTopNumbers ? "숫자 숨김" : "숫자"}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setTopOpen(true)}
                                            className="text-muted-foreground hover:text-foreground"
                                            disabled={isLoading}
                                        >
                                            전체
                                        </button>
                                    </div>
                                </div>
                            </CardHeader>

                            {/* ✅ CardContent padding 제거: edge-to-edge */}
                            <CardContent className="p-0">
                                {isLoading ? (
                                    <div className="p-4">
                                        <TopStocksListSkeleton rows={7} />
                                    </div>
                                ) : topStocksPreview.length > 0 ? (
                                    <div className="border-t border-border/60">
                                        {topStocksPreview.map((s, idx) => {
                                            const label = s.name || s.ticker
                                            const isActive = stockFocus === s.ticker || stockFocus === s.name

                                            return (
                                                <button
                                                    key={s.ticker || s.name}
                                                    type="button"
                                                    onClick={() => setStockFocus(s.ticker || s.name)}
                                                    className={cn(
                                                        "w-full text-left px-4 py-3 transition",
                                                        "hover:bg-muted/30",
                                                        idx !== 0 && "border-t border-border/60",
                                                        isActive && "bg-muted/25",
                                                    )}
                                                >
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="min-w-0 flex items-center gap-2">
                                                            <span className="text-[12.5px] font-semibold truncate">{label}</span>
                                                            <Badge variant="outline" className="text-[10.5px] tabular-nums px-2 py-0 rounded-full">
                                                                {s.total}
                                                            </Badge>
                                                            {s.ticker && (
                                                                <span className="text-[10.5px] text-muted-foreground tabular-nums shrink-0">{s.ticker}</span>
                                                            )}
                                                        </div>

                                                        <div className="flex items-center gap-1 text-[10.5px] text-muted-foreground tabular-nums">
                                                            <span>+{s.positive}</span>
                                                            <span className="text-muted-foreground/40">/</span>
                                                            <span>-{s.negative}</span>
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
                                        })}

                                        <div className="px-4 py-3 border-t border-border/60 text-[11px] text-muted-foreground">
                                            {isFetchingNextPage ? (
                                                <span className="inline-flex items-center gap-2">
                  <Spinner />
                  불러오는 중…
                </span>
                                            ) : hasNextPage ? (
                                                <span>뉴스를 스크롤하면 더 불러와요.</span>
                                            ) : (
                                                <span>마지막까지 불러왔어요.</span>
                                            )}
                                        </div>

                                        {stockFocus && (
                                            <div className="px-4 pb-4">
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    className="h-9 w-full text-[12px] rounded-xl"
                                                    onClick={() => setStockFocus(null)}
                                                >
                                                    종목 필터 해제
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="px-4 py-10 text-center text-[11px] text-muted-foreground">
                                        아직 집계할 데이터가 없어요.
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </aside>


                {/* Right: News (✅ padding 없이 꽉 차게) */}
                <div className="min-h-0">
                    {/* Mobile */}
                    <div
                        ref={mobileScrollRef}
                        className={cn(
                            "lg:hidden h-full min-h-0 overflow-y-auto overscroll-contain",
                            "pb-[calc(var(--app-bottom-nav-h,72px)+env(safe-area-inset-bottom))]",
                        )}
                    >
                        {/* Mobile sticky controls (collapsed toggle) */}
                        <div className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border/70">
                            <div className="px-4 py-3 flex items-center justify-between gap-2">
                                <div className="min-w-0">
                                    <div className="text-sm font-semibold">실시간 뉴스</div>
                                    <div className="text-[11px] text-muted-foreground">{headerCountText}</div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Button variant="secondary" size="sm" className="h-9 px-3"
                                            onClick={() => setTopOpen(true)}>
                                        TOP
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="h-9 px-3 gap-1"
                                        onClick={() => setMobileControlsOpen((v) => !v)}
                                    >
                                        <SlidersHorizontal className="h-4 w-4"/>
                                        {mobileControlsOpen ? <ChevronUp className="h-4 w-4"/> :
                                            <ChevronDown className="h-4 w-4"/>}
                                    </Button>
                                </div>
                            </div>

                            {mobileControlsOpen && (
                                <div className="px-4 pb-4 space-y-3">
                                    {/* search */}
                                    <div className="relative">
                                        <SearchIcon
                                            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                        <input
                                            value={q}
                                            onChange={(e) => setQ(e.target.value)}
                                            placeholder="검색: 제목/요약/출처/카테고리/종목"
                                            className={cn(
                                                "w-full h-10 border border-input bg-transparent pl-10 pr-10 text-sm",
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
                                                <X className="h-4 w-4"/>
                                            </button>
                                        )}
                                    </div>

                                    {/* filters */}
                                    <div className="space-y-2">
                                        <div>
                                            <div className="text-[11px] text-muted-foreground mb-2">기간</div>
                                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                                {(Object.keys(RANGE_LABEL) as TimeRange[]).map((r) => (
                                                    <Pill key={r} active={timeRange === r}
                                                          onClick={() => setTimeRange(r)}>
                                                        {RANGE_LABEL[r]}
                                                    </Pill>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-[11px] text-muted-foreground mb-2">감성</div>
                                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                                <Pill active={sentimentFilter === "all"}
                                                      onClick={() => setSentimentFilter("all")}>
                                                    전체
                                                </Pill>
                                                <Pill active={sentimentFilter === "positive"}
                                                      onClick={() => setSentimentFilter("positive")}>
                                                    호재
                                                </Pill>
                                                <Pill active={sentimentFilter === "negative"}
                                                      onClick={() => setSentimentFilter("negative")}>
                                                    악재
                                                </Pill>
                                                <Pill active={sentimentFilter === "neutral"}
                                                      onClick={() => setSentimentFilter("neutral")}>
                                                    중립
                                                </Pill>
                                            </div>
                                        </div>

                                        <div>
                                            <div className="text-[11px] text-muted-foreground mb-2">카테고리</div>
                                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                                                <Pill active={categoryFilter === "all"}
                                                      onClick={() => setCategoryFilter("all")}>
                                                    전체
                                                </Pill>
                                                {(["경제", "산업", "정책", "글로벌", "기업"] as Category[]).map((c) => (
                                                    <Pill key={c} active={categoryFilter === c}
                                                          onClick={() => setCategoryFilter(c)}>
                                                        {c}
                                                    </Pill>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2 pt-1">
                                            <Button variant="secondary" className="h-10 flex-1"
                                                    onClick={() => refetch()}>
                                                적용
                                            </Button>
                                            <Button variant="secondary" className="h-10" onClick={clearAll}>
                                                초기화
                                            </Button>
                                        </div>

                                        {stockFocus && (
                                            <div className="pt-1">
                                                <Badge variant="outline"
                                                       className="text-[11px] px-2 py-0 inline-flex items-center gap-1">
                                                    종목: {stockFocus}
                                                    <button
                                                        type="button"
                                                        className="ml-1 inline-flex items-center text-muted-foreground hover:text-foreground"
                                                        onClick={() => setStockFocus(null)}
                                                        aria-label="clear stock focus"
                                                    >
                                                        <X className="h-3 w-3"/>
                                                    </button>
                                                </Badge>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {isLoading ? (
                            <MobileNewsSkeleton/>
                        ) : (
                            <>
                                <ul className="divide-y divide-border/60">
                                    {filteredNews.map((news) => (
                                        <li key={news.id}>
                                            <a
                                                href={news.url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className={cn(
                                                    "block px-4 py-4 transition",
                                                    "hover:bg-muted/30 active:bg-muted/40",
                                                    news.isBreaking && "bg-chart-4/5",
                                                )}
                                            >
                                                <div className="flex items-start gap-3">
                                                    <div
                                                        className="pt-1 shrink-0">{getSentimentIcon(news.sentiment)}</div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="flex items-center justify-between gap-2">
                                                            <div className="flex items-center gap-1.5 flex-wrap">
                                                                {news.isBreaking && (
                                                                    <Badge
                                                                        className="bg-chart-4 text-white text-[11px] px-2 py-0.5 animate-pulse">
                                                                        속보
                                                                    </Badge>
                                                                )}
                                                                <Badge variant="secondary"
                                                                       className="text-[11px] px-2 py-0.5">
                                                                    {news.category}
                                                                </Badge>
                                                                {getSentimentBadge(news.sentiment)}
                                                                <span
                                                                    className="text-[11px] text-muted-foreground truncate max-w-[40vw]">
                                  {SOURCE_KO_MAP[news.source] ?? news.source}
                                </span>
                                                            </div>

                                                            <div
                                                                className="shrink-0 text-[11px] text-muted-foreground inline-flex items-center gap-1">
                                                                <Clock className="h-3.5 w-3.5"/>
                                                                {getTimeDiff(nowMs, news.timestamp)}
                                                            </div>
                                                        </div>

                                                        <div
                                                            className="mt-2 text-[15px] font-semibold leading-snug line-clamp-2"
                                                            title={news.title}>
                                                            {truncate(news.title, 140)}
                                                        </div>

                                                        <div
                                                            className="mt-2 flex items-start gap-2 text-muted-foreground">
                                                            <Sparkles className="h-4 w-4 text-chart-4 shrink-0 mt-0.5"/>
                                                            <span className="text-sm leading-relaxed line-clamp-3"
                                                                  title={news.aiSummary}>
                                {truncate(news.aiSummary, 150)}
                              </span>
                                                        </div>

                                                        <div className="mt-3 flex items-center justify-between gap-2">
                                                            {news.relatedStocks?.length > 0 ? (
                                                                <div
                                                                    className="flex gap-1.5 overflow-x-auto max-w-[78vw] pb-1">
                                                                    {news.relatedStocks.slice(0, 8).map((stock) => (
                                                                        <Link
                                                                            key={stock.ticker}
                                                                            href={`/stock/${stock.ticker}`}
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        >
                                                                            <Badge variant="outline"
                                                                                   className="text-[11px] px-2 py-0.5 hover:bg-primary/10">
                                                                                {stock.name}
                                                                            </Badge>
                                                                        </Link>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <span className="text-[11px] text-muted-foreground">관련 종목 -</span>
                                                            )}

                                                            <ExternalLink className="h-4 w-4 text-primary shrink-0"/>
                                                        </div>
                                                    </div>
                                                </div>
                                            </a>
                                        </li>
                                    ))}
                                </ul>

                                {filteredNews.length === 0 && !isLoading && (
                                    <div className="px-4 py-12 text-center text-sm text-muted-foreground">조건에 맞는 뉴스가
                                        없어요.</div>
                                )}

                                <div className="px-4 py-6">
                                    <div ref={mobileSentinelRef} className="h-1 w-full"/>

                                    {isFetchingNextPage ? (
                                        <div
                                            className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground">
                                            <Spinner/>
                                            불러오는 중…
                                        </div>
                                    ) : hasNextPage ? (
                                        <div className="text-center text-[11px] text-muted-foreground">스크롤하면 자동으로 더
                                            불러와요.</div>
                                    ) : (
                                        <div className="text-center text-[11px] text-muted-foreground">마지막 뉴스까지
                                            불러왔어요.</div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* Desktop table (✅ 바깥 padding 제거, 영역 꽉차게) */}
                    <div ref={desktopScrollRef} className="hidden lg:block h-full min-h-0 overflow-auto">
                        {isLoading ? (
                            <DesktopTableSkeleton/>
                        ) : (
                            <Table className="w-full text-xs">
                                <TableHeader>
                                    <TableRow className="bg-background/70">
                                        <TableHead className="sticky top-0 z-10 bg-background/80 w-[44px] px-3 py-3"/>
                                        <TableHead className="sticky top-0 z-10 bg-background/80 w-[92px] px-3 py-3">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3"/>
                        시간
                      </span>
                                        </TableHead>
                                        <TableHead
                                            className="sticky top-0 z-10 bg-background/80 w-[260px] px-3 py-3">분류</TableHead>
                                        <TableHead className="sticky top-0 z-10 bg-background/80 px-3 py-3">제목 /
                                            요약</TableHead>
                                        <TableHead className="sticky top-0 z-10 bg-background/80 w-[240px] px-3 py-3">관련
                                            종목</TableHead>
                                        <TableHead
                                            className="sticky top-0 z-10 bg-background/80 w-[72px] px-3 py-3 text-right">
                                            원문
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>

                                <TableBody className="[&>tr:nth-child(2n)]:bg-muted/10">
                                    {filteredNews.map((news) => (
                                        <TableRow
                                            key={news.id}
                                            className={cn("hover:bg-muted/30 transition", news.isBreaking && "bg-chart-4/5")}
                                        >
                                            <TableCell
                                                className="px-3 py-3 align-top">{getSentimentIcon(news.sentiment)}</TableCell>

                                            <TableCell
                                                className="px-3 py-3 align-top text-muted-foreground whitespace-nowrap">
                                                {getTimeDiff(nowMs, news.timestamp)}
                                            </TableCell>

                                            <TableCell className="px-3 py-3 align-top">
                                                <div className="flex items-center gap-1.5 flex-wrap">
                                                    {news.isBreaking && (
                                                        <Badge
                                                            className="bg-chart-4 text-white text-[11px] px-1.5 py-0 animate-pulse">속보</Badge>
                                                    )}
                                                    <Badge variant="secondary" className="text-[11px] px-1.5 py-0">
                                                        {news.category}
                                                    </Badge>
                                                    {getSentimentBadge(news.sentiment)}
                                                    <span
                                                        className="text-[11px] text-muted-foreground ml-1 truncate max-w-[140px]">
                            {SOURCE_KO_MAP[news.source] ?? news.source}
                          </span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="px-3 py-3 align-top">
                                                <div className="min-w-0">
                                                    <div className="text-sm font-semibold leading-snug line-clamp-1"
                                                         title={news.title}>
                                                        {truncate(news.title, 80)}
                                                    </div>
                                                    <div
                                                        className="mt-1 flex items-center gap-1.5 text-muted-foreground">
                                                        <Sparkles className="h-3 w-3 text-chart-4 shrink-0"/>
                                                        <span className="line-clamp-1" title={news.aiSummary}>
                              {truncate(news.aiSummary, 110)}
                            </span>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            <TableCell className="px-3 py-3 align-top">
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

                                            <TableCell className="px-3 py-3 align-top text-right">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 px-2 text-xs gap-1 text-primary hover:text-primary"
                                                    asChild
                                                >
                                                    <a href={news.url} target="_blank" rel="noopener noreferrer">
                                                        <span className="hidden sm:inline">원문</span>
                                                        <ExternalLink className="h-3 w-3"/>
                                                    </a>
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {filteredNews.length === 0 && !isLoading && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                조건에 맞는 뉴스가 없어요.
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    <TableRow>
                                        <TableCell colSpan={6} className="px-3 py-4">
                                            <div className="flex flex-col items-center justify-center gap-2">
                                                <div ref={desktopSentinelRef} className="h-1 w-full"/>
                                                {isFetchingNextPage ? (
                                                    <span
                                                        className="inline-flex items-center gap-2 text-[11px] text-muted-foreground">
                            <Spinner/>
                            불러오는 중…
                          </span>
                                                ) : hasNextPage ? (
                                                    <div className="text-[11px] text-muted-foreground">아래로 스크롤하면 자동으로 더
                                                        불러와요.</div>
                                                ) : (
                                                    <div className="text-[11px] text-muted-foreground">마지막 뉴스까지
                                                        불러왔어요.</div>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        )}
                    </div>
                </div>
            </div>

            {/* ======= Top Stocks Panel ======= */}
            {topOpen && (
                <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" onClick={() => setTopOpen(false)}>
                    <div className="absolute inset-0 bg-black/45"/>

                    <div
                        className={cn(
                            "absolute inset-x-0 bottom-0 h-[85svh] border-t border-border shadow-2xl bg-background flex flex-col rounded-t-2xl",
                            "sm:inset-y-0 sm:right-0 sm:left-auto sm:bottom-auto sm:h-full sm:w-[520px] sm:border-t-0 sm:border-l sm:rounded-t-none",
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
                                    <div className="text-[11px] text-muted-foreground mt-0.5">클릭하면 해당 종목으로 뉴스가 필터링돼요
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    className="h-9 w-9 inline-flex items-center justify-center hover:bg-muted/40"
                                    onClick={() => setTopOpen(false)}
                                    aria-label="close"
                                >
                                    <X className="h-4 w-4"/>
                                </button>
                            </div>

                            <div className="mt-3 flex items-center gap-2">
                                <div className="relative flex-1 min-w-0">
                                    <SearchIcon
                                        className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"/>
                                    <input
                                        value={topQuery}
                                        onChange={(e) => {
                                            setTopQuery(e.target.value)
                                            setTopLimit(80)
                                        }}
                                        placeholder="종목명/티커 검색"
                                        className={cn(
                                            "w-full h-10 border border-input bg-transparent pl-10 pr-10 text-sm",
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
                                            <X className="h-4 w-4"/>
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
                                기준: {RANGE_LABEL[timeRange]} <span className="mx-1 text-muted-foreground/40">•</span>
                                {categoryFilter === "all" ? "전체" : categoryFilter}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            {topStocksVisible.length > 0 ? (
                                <table className="w-full text-xs">
                                    <thead className="sticky top-0 bg-background/95 backdrop-blur border-b border-border/60">
                                        <tr>
                                            <th className="text-left px-4 py-2.5 font-medium text-muted-foreground">종목</th>
                                            <th className="text-right px-3 py-2.5 font-medium text-muted-foreground w-[60px]">건수</th>
                                            <th className="text-right px-3 py-2.5 font-medium text-muted-foreground w-[50px]">호재</th>
                                            <th className="text-right px-3 py-2.5 font-medium text-muted-foreground w-[50px]">악재</th>
                                            <th className="text-right px-4 py-2.5 font-medium text-muted-foreground w-[50px]">중립</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border/50">
                                        {topStocksVisible.map((s) => {
                                            const label = s.name || s.ticker
                                            const isActive = stockFocus === s.ticker || stockFocus === s.name

                                            return (
                                                <tr
                                                    key={s.ticker || s.name}
                                                    onClick={() => {
                                                        setStockFocus(s.ticker || s.name)
                                                        setTopOpen(false)
                                                    }}
                                                    className={cn(
                                                        "cursor-pointer transition hover:bg-muted/30",
                                                        isActive && "bg-muted/25",
                                                    )}
                                                >
                                                    <td className="px-4 py-3">
                                                        <div className="font-medium truncate max-w-[200px]">{label}</div>
                                                        {s.ticker && s.name && (
                                                            <div className="text-[10px] text-muted-foreground tabular-nums">{s.ticker}</div>
                                                        )}
                                                    </td>
                                                    <td className="px-3 py-3 text-right tabular-nums font-medium">{s.total}</td>
                                                    <td className="px-3 py-3 text-right tabular-nums text-red-500">{s.positive}</td>
                                                    <td className="px-3 py-3 text-right tabular-nums text-blue-500">{s.negative}</td>
                                                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{s.neutral}</td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            ) : (
                                <div className="p-10 text-center text-sm text-muted-foreground">
                                    조건에 맞는 종목이 없어요.
                                </div>
                            )}

                            {topStocksForPanel.length > topLimit && (
                                <div className="p-4 flex items-center justify-center border-t border-border/60">
                                    <Button type="button" variant="secondary" className="h-10"
                                            onClick={() => setTopLimit((v) => v + 120)}>
                                        더 보기
                                        ({Math.min(topLimit, topStocksForPanel.length).toLocaleString("ko-KR")} /{" "}
                                        {topStocksForPanel.length.toLocaleString("ko-KR")})
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </section>
    )
}
