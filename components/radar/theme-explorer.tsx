// ThemeExplorer.tsx
"use client"

import { useEffect, useMemo, useState, useDeferredValue, type ReactNode } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Sparkles,
  Minus,
  Snowflake,
  Search,
  ExternalLink,
  X,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/domain/stock/queries/useTheme"
import type { Theme } from "@/domain/stock/types/theme.model"

const momentumConfig = {
  hot: { label: "급등", icon: Flame, color: "text-red-500 bg-red-500/10" },
  rising: { label: "상승", icon: TrendingUp, color: "text-orange-500 bg-red-500/10" },
  stable: { label: "보합", icon: Minus, color: "text-muted-foreground bg-muted" },
  cooling: { label: "하락", icon: TrendingDown, color: "text-blue-500 bg-blue-500/10" },
  cold: { label: "급락", icon: Snowflake, color: "text-cyan-500 bg-cyan-500/10" },
} as const

type MomentumKey = keyof typeof momentumConfig
type ThemeStock = Theme["stocks"][number]
type StockSortKey = "changeRate" | "tradeAmount" | "volume"
type SortDir = "desc" | "asc"

function getMomentumKey(rate: number): MomentumKey {
  if (rate >= 5) return "hot"
  if (rate >= 2) return "rising"
  if (rate <= -5) return "cold"
  if (rate <= -2) return "cooling"
  return "stable"
}

type ThemeView = {
  id: string
  name: string
  stockCount: number
  avgChangePercent: number
  momentum: MomentumKey

  stocks: ThemeStock[]
  topMovers: ThemeStock[]

  upCount: number
  downCount: number
  flatCount: number
  totalVolume: number
  totalTradeAmount: number

  maxGainer?: ThemeStock
  maxLoser?: ThemeStock
  volumeLeader?: ThemeStock
  tradeLeader?: ThemeStock
}

const fmt = (n: number) => n.toLocaleString("ko-KR")

const fmtCompact = (() => {
  try {
    const f = new Intl.NumberFormat("ko-KR", { notation: "compact", maximumFractionDigits: 1 })
    return (n: number) => f.format(n)
  } catch {
    return (n: number) => fmt(n)
  }
})()

function sign(v: number) {
  return v > 0 ? "+" : ""
}

const maxBy = <T,>(arr: T[], score: (v: T) => number): T | undefined => {
  let best: T | undefined
  let bestScore = -Infinity
  for (const v of arr) {
    const s = score(v)
    if (!Number.isFinite(s)) continue
    if (best === undefined || s > bestScore) {
      best = v
      bestScore = s
    }
  }
  return best
}

const minBy = <T,>(arr: T[], score: (v: T) => number): T | undefined => {
  let best: T | undefined
  let bestScore = Infinity
  for (const v of arr) {
    const s = score(v)
    if (!Number.isFinite(s)) continue
    if (best === undefined || s < bestScore) {
      best = v
      bestScore = s
    }
  }
  return best
}

// =========================
// UI helpers (match RealtimeNews)
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

function Skeleton({ className }: { className?: string }) {
  return <div className={cn("animate-pulse bg-muted/50", className)} />
}

function Spinner({ className }: { className?: string }) {
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

function ThemeListSkeleton({ rows = 10 }: { rows?: number }) {
  return (
      <ul className="divide-y divide-border/60">
        {Array.from({ length: rows }).map((_, i) => (
            <li key={i} className="px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-16 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                  <Skeleton className="h-5 w-[78%]" />
                  <Skeleton className="h-4 w-[62%]" />
                  <Skeleton className="h-4 w-[54%]" />
                </div>
                <div className="shrink-0 text-right space-y-2">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-4 w-14" />
                </div>
              </div>
            </li>
        ))}
      </ul>
  )
}

function DetailSkeleton() {
  return (
      <div className="p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-6 w-14 rounded-full" />
          <Skeleton className="h-6 w-20 rounded-full" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-xl border bg-muted/20 p-3">
                <Skeleton className="h-6 w-16" />
                <Skeleton className="mt-2 h-4 w-20" />
              </div>
          ))}
        </div>
        <div className="rounded-xl border overflow-hidden">
          <div className="px-4 py-3 bg-muted/20 border-b">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-2 h-10 w-full rounded-xl" />
            <div className="mt-2 flex gap-2">
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-7 w-16 rounded-md" />
              <Skeleton className="h-7 w-16 rounded-md" />
            </div>
          </div>
          <div className="divide-y">
            {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="px-4 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0 flex-1 space-y-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-[70%]" />
                  </div>
                  <div className="shrink-0 space-y-2">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
            ))}
          </div>
        </div>
      </div>
  )
}

// =========================
// Component
// =========================
export function ThemeExplorer() {
  const { data: apiThemes, isLoading, isError, error, refetch } = useTheme() as any

  // ✅ API(Model Theme[]) -> UI ViewModel
  const themes: ThemeView[] = useMemo(() => {
    const src = (apiThemes ?? []) as Theme[]

    return src.map((t) => {
      const rate = Number((t as any).averageChangeRate ?? 0)
      const stocks = ((t as any).stocks ?? []) as ThemeStock[]
      const stockCount = Number((t as any).stockCount ?? stocks.length ?? 0)

      const topMovers = [...stocks].sort((a, b) => (b.changeRate ?? 0) - (a.changeRate ?? 0)).slice(0, 3)

      const upCount = stocks.reduce((acc, s) => acc + ((s.changeRate ?? 0) > 0 ? 1 : 0), 0)
      const downCount = stocks.reduce((acc, s) => acc + ((s.changeRate ?? 0) < 0 ? 1 : 0), 0)
      const flatCount = Math.max(0, stockCount - upCount - downCount)

      const totalVolume = stocks.reduce((acc, s) => acc + (s.volume ?? 0), 0)
      const totalTradeAmount = stocks.reduce((acc, s) => acc + (s.tradeAmount ?? 0), 0)

      const maxGainer = maxBy(stocks, (s) => s.changeRate ?? 0)
      const maxLoser = minBy(stocks, (s) => s.changeRate ?? 0)
      const volumeLeader = maxBy(stocks, (s) => s.volume ?? 0)
      const tradeLeader = maxBy(stocks, (s) => s.tradeAmount ?? 0)

      return {
        id: String((t as any).themeCode),
        name: (t as any).themeName ?? "",
        stockCount,
        avgChangePercent: rate,
        momentum: getMomentumKey(rate),
        stocks,
        topMovers,
        upCount,
        downCount,
        flatCount,
        totalVolume,
        totalTradeAmount,
        maxGainer,
        maxLoser,
        volumeLeader,
        tradeLeader,
      }
    })
  }, [apiThemes])

  const totalThemes = themes.length
  const totalStocks = useMemo(() => themes.reduce((acc, t) => acc + (t.stockCount || 0), 0), [themes])

  // Filters / search (sidebar + mobile controls)
  const [searchQuery, setSearchQuery] = useState("")
  const deferredSearchQuery = useDeferredValue(searchQuery)
  const [selectedMomentum, setSelectedMomentum] = useState<MomentumKey | null>(null)

  // Detail panel (like RealtimeNews Top panel)
  const [detailOpen, setDetailOpen] = useState(false)
  const [selectedTheme, setSelectedTheme] = useState<ThemeView | null>(null)

  // mobile controls collapsed by default
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false)

  // Stocks in detail: 검색/정렬
  const [stockQuery, setStockQuery] = useState("")
  const [sortKey, setSortKey] = useState<StockSortKey>("changeRate")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  useEffect(() => {
    setStockQuery("")
    setSortKey("changeRate")
    setSortDir("desc")
  }, [selectedTheme?.id])

  const hotThemes = useMemo(() => {
    const sorted = [...themes].sort((a, b) => b.avgChangePercent - a.avgChangePercent)
    return sorted.slice(0, 10)
  }, [themes])

  const filteredThemes = useMemo(() => {
    const q = deferredSearchQuery.trim().toLowerCase()
    return themes.filter((theme) => {
      const matchesSearch = !q || theme.name.toLowerCase().includes(q) || theme.id.toLowerCase().includes(q)
      const matchesMomentum = !selectedMomentum || theme.momentum === selectedMomentum
      return matchesSearch && matchesMomentum
    })
  }, [themes, deferredSearchQuery, selectedMomentum])

  const headerCountText = useMemo(() => {
    const shown = filteredThemes.length
    return `${shown.toLocaleString("ko-KR")}개`
  }, [filteredThemes.length])

  const detailStocks = useMemo(() => {
    const base = selectedTheme?.stocks ?? []
    const q = stockQuery.trim().toLowerCase()

    const filtered = !q
        ? base
        : base.filter((s) => {
          const hay = `${s.stockCode} ${s.stockName ?? ""} ${s.marketName ?? ""} ${s.industryName ?? ""}`.toLowerCase()
          return hay.includes(q)
        })

    const sorted = [...filtered].sort((a, b) => {
      const av = (a[sortKey] ?? 0) as number
      const bv = (b[sortKey] ?? 0) as number
      return sortDir === "desc" ? bv - av : av - bv
    })

    return sorted
  }, [selectedTheme?.stocks, stockQuery, sortKey, sortDir])

  const clearAll = () => {
    setSearchQuery("")
    setSelectedMomentum(null)
  }

  const openDetail = (theme: ThemeView) => {
    setSelectedTheme(theme)
    setDetailOpen(true)
  }

  const closeDetail = () => {
    setDetailOpen(false)
    // UX: 닫을 때 선택 유지해도 되지만, “뉴스 Top 패널”처럼 닫으면 유지되게 두는 편이 편함.
    // 원하면 아래 줄 주석 해제:
    // setSelectedTheme(null)
  }

  const toggleSort = (key: StockSortKey) => {
    if (sortKey !== key) {
      setSortKey(key)
      setSortDir("desc")
      return
    }
    setSortDir((d) => (d === "desc" ? "asc" : "desc"))
  }

  const SortBtn = ({ k, label }: { k: StockSortKey; label: string }) => {
    const active = sortKey === k
    return (
        <button
            type="button"
            onClick={() => toggleSort(k)}
            className={cn(
                "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors",
                active ? "bg-primary text-primary-foreground border-primary" : "bg-background hover:bg-muted/30",
            )}
        >
          {label}
          {active && <span className="text-[10px] opacity-80">{sortDir === "desc" ? "▼" : "▲"}</span>}
        </button>
    )
  }

  const StockList = ({ stocks }: { stocks: ThemeStock[] }) => {
    if (!selectedTheme) {
      return (
          <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">테마를 선택해 주세요.</div>
      )
    }

    if (!stocks.length) {
      return (
          <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">조건에 맞는 종목이 없어요.</div>
      )
    }

    return (
        <div className="rounded-xl border overflow-hidden">
          <div className="px-4 py-3 bg-muted/20 border-b">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold">종목 리스트</div>
              <div className="text-xs text-muted-foreground">{stocks.length.toLocaleString("ko-KR")}개</div>
            </div>

            <div className="mt-2 flex flex-col gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                    placeholder="종목코드/종목명/시장/업종 검색..."
                    value={stockQuery}
                    onChange={(e) => setStockQuery(e.target.value)}
                    className="h-10 pl-9 pr-10 rounded-xl"
                />
                {stockQuery.trim().length > 0 && (
                    <button
                        type="button"
                        onClick={() => setStockQuery("")}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        aria-label="clear stock search"
                    >
                      <X className="h-4 w-4" />
                    </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <SortBtn k="changeRate" label="변동률" />
                <SortBtn k="tradeAmount" label="거래대금" />
                <SortBtn k="volume" label="거래량" />
              </div>
            </div>
          </div>

          <div className="divide-y">
            {stocks.map((s) => (
                <Link
                    key={s.stockCode}
                    href={`/stocks/${s.stockCode}`}
                    className="px-4 py-3 flex items-center justify-between gap-3 transition hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold tabular-nums">{s.stockCode}</span>
                      <span className="text-sm font-medium truncate max-w-[220px]">{s.stockName ?? "-"}</span>

                      {s.marketName && (
                          <Badge variant="outline" className="text-[11px] text-muted-foreground">
                            {s.marketName}
                          </Badge>
                      )}
                      {s.industryName && (
                          <Badge variant="outline" className="text-[11px] text-muted-foreground">
                            {s.industryName}
                          </Badge>
                      )}
                    </div>

                    <div className="mt-1 text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="tabular-nums">현재가 {fmt(s.currentPrice)}</span>
                      <span className="tabular-nums">거래량 {fmtCompact(s.volume)}</span>
                      <span className="tabular-nums">거래대금 {fmtCompact(s.tradeAmount)}</span>
                    </div>
                  </div>

                  <div className="shrink-0 text-right">
                    <div className={cn("font-semibold tabular-nums", s.changeRate >= 0 ? "text-red-500" : "text-blue-500")}>
                      {sign(s.changeRate)}
                      {(s.changeRate ?? 0).toFixed(2)}%
                    </div>
                    <div className="text-xs text-muted-foreground tabular-nums">
                      {sign(s.change)}
                      {fmt(s.change)}
                    </div>
                  </div>
                </Link>
            ))}
          </div>
        </div>
    )
  }

  const hasActiveFilters = searchQuery.trim().length > 0 || !!selectedMomentum

  return (
      <section className="w-full h-[calc(100svh-var(--app-header-h,64px))] flex flex-col min-h-0">
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[360px_1fr]">
          {/* Left: Desktop side (match RealtimeNews) */}
          <aside className="hidden lg:flex min-h-0 border-r border-border/70 flex-col bg-background">
            <div className="h-full min-h-0 overflow-y-auto px-3 py-3 space-y-3">
              {/* Search / Filter card */}
              <Card className="rounded-2xl border-border/60 shadow-sm">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[13px] font-semibold">검색 / 필터</CardTitle>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={clearAll}
                            className="text-[11px] text-muted-foreground hover:text-foreground"
                        >
                          초기화
                        </button>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="px-4 pb-4 pt-0 space-y-3">
                  {/* Search */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="테마명/코드 검색"
                        className={cn(
                            "w-full h-9 rounded-xl border border-input bg-background/40 pl-9 pr-9 text-[12.5px]",
                            "placeholder:text-muted-foreground",
                            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0",
                        )}
                    />
                    {searchQuery.trim().length > 0 && (
                        <button
                            type="button"
                            onClick={() => setSearchQuery("")}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            aria-label="clear search"
                        >
                          <X className="h-4 w-4" />
                        </button>
                    )}
                  </div>

                  {/* Status line */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px]">
                    <Badge variant="outline" className="text-muted-foreground">
                      테마 {totalThemes.toLocaleString("ko-KR")}개
                    </Badge>
                    <Badge
                        variant="outline"
                        className={cn(
                            "text-[11px]",
                            isError ? "text-red-500 border-red-500/30" : "text-muted-foreground",
                        )}
                    >
                      {isLoading ? "API 로딩중..." : isError ? "API 에러" : `총 ${totalStocks.toLocaleString("ko-KR")}종목`}
                    </Badge>

                    <div className="ml-auto flex items-center gap-2">
                      <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 px-3 text-[11px]"
                          onClick={() => refetch?.()}
                      >
                        새로고침
                      </Button>
                    </div>
                  </div>

                  {isError && (
                      <div className="text-[11px] text-red-500/90 line-clamp-2">
                        {(error as any)?.message ?? "테마 API 호출 실패"}
                      </div>
                  )}

                  {/* Momentum filter */}
                  <div className="space-y-1">
                    <div className="text-[11px] text-muted-foreground">모멘텀</div>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <Pill active={!selectedMomentum} onClick={() => setSelectedMomentum(null)}>
                        전체
                      </Pill>
                      {(Object.keys(momentumConfig) as MomentumKey[]).map((key) => {
                        const m = momentumConfig[key]
                        const Icon = m.icon
                        return (
                            <button
                                key={key}
                                type="button"
                                onClick={() => setSelectedMomentum((cur) => (cur === key ? null : key))}
                                className={cn(
                                    "h-8 px-3 rounded-full text-xs transition border whitespace-nowrap inline-flex items-center gap-1.5",
                                    selectedMomentum === key
                                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                                        : "bg-transparent hover:bg-muted/40 text-foreground border-border",
                                )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {m.label}
                            </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/60 flex items-center justify-between gap-2">
                    <div className="text-[11px] text-muted-foreground truncate">
                      표시 {filteredThemes.length.toLocaleString("ko-KR")} / 전체 {themes.length.toLocaleString("ko-KR")}
                    </div>
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-[11px]" onClick={clearAll}>
                      초기화
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* HOT preview card (like TOP 종목 card) */}
              <Card className="rounded-2xl border-border/60 shadow-sm overflow-hidden">
                <CardHeader className="py-3 px-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-[13px] font-semibold">
                      HOT 테마{" "}
                      <span className="text-[11px] text-muted-foreground">
                      ({isLoading ? "—" : Math.min(10, hotThemes.length).toLocaleString("ko-KR")})
                    </span>
                    </CardTitle>

                    <div className="flex items-center gap-2 text-[11px]">
                      <button
                          type="button"
                          onClick={() => setSelectedMomentum("hot")}
                          className="text-muted-foreground hover:text-foreground"
                          disabled={isLoading}
                      >
                        급등만
                      </button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-0">
                  {isLoading ? (
                      <div className="p-4">
                        <div className="space-y-2">
                          {Array.from({ length: 6 }).map((_, i) => (
                              <div key={i} className="border border-border/60 p-3">
                                <div className="flex items-center gap-2">
                                  <Skeleton className="h-4 w-40" />
                                  <Skeleton className="h-4 w-16 rounded-full" />
                                </div>
                                <div className="mt-2">
                                  <Skeleton className="h-4 w-[70%]" />
                                </div>
                              </div>
                          ))}
                        </div>
                      </div>
                  ) : hotThemes.length > 0 ? (
                      <div className="border-t border-border/60">
                        {hotThemes.map((t, idx) => {
                          const m = momentumConfig[t.momentum]
                          const Icon = m.icon
                          const isActive = selectedTheme?.id === t.id

                          return (
                              <button
                                  key={t.id}
                                  type="button"
                                  onClick={() => openDetail(t)}
                                  className={cn(
                                      "w-full text-left px-4 py-3 transition hover:bg-muted/30",
                                      idx !== 0 && "border-t border-border/60",
                                      isActive && "bg-muted/25",
                                  )}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-[12.5px] font-semibold truncate">{t.name}</span>
                                      <Badge className={cn(m.color, "text-[10.5px]")}>
                                        <Icon className="mr-1 h-3 w-3" />
                                        {m.label}
                                      </Badge>
                                    </div>
                                    <div className="mt-1 text-[11px] text-muted-foreground">
                                      코드 {t.id} · {t.stockCount}종목
                                    </div>
                                  </div>

                                  <div className={cn("shrink-0 text-right tabular-nums font-semibold", t.avgChangePercent >= 0 ? "text-red-500" : "text-blue-500")}>
                                    {sign(t.avgChangePercent)}
                                    {t.avgChangePercent.toFixed(2)}%
                                  </div>
                                </div>
                              </button>
                          )
                        })}
                      </div>
                  ) : (
                      <div className="px-4 py-10 text-center text-[11px] text-muted-foreground">표시할 HOT 테마가 없어요.</div>
                  )}
                </CardContent>
              </Card>
            </div>
          </aside>

          {/* Right: Themes list (mobile + desktop, edge-to-edge like RealtimeNews) */}
          <div className="min-h-0">
            {/* Mobile */}
            <div
                className={cn(
                    "lg:hidden h-full min-h-0 overflow-y-auto overscroll-contain",
                    "pb-[calc(var(--app-bottom-nav-h,72px)+env(safe-area-inset-bottom))]",
                )}
            >
              {/* Mobile sticky header + controls toggle */}
              <div className="sticky top-0 z-30 bg-background/80 backdrop-blur border-b border-border/70">
                <div className="px-4 py-3 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">테마 탐색기</div>
                    <div className="text-[11px] text-muted-foreground">{headerCountText}</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button variant="secondary" size="sm" className="h-9 px-3" onClick={() => refetch?.()}>
                      {isLoading ? <Spinner /> : "새로고침"}
                    </Button>

                    <Button
                        variant="secondary"
                        size="sm"
                        className="h-9 px-3 gap-1"
                        onClick={() => setMobileControlsOpen((v) => !v)}
                    >
                      <SlidersHorizontal className="h-4 w-4" />
                      {mobileControlsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>

                {mobileControlsOpen && (
                    <div className="px-4 pb-4 space-y-3">
                      {/* Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="검색: 테마명/코드"
                            className={cn(
                                "w-full h-10 border border-input bg-transparent pl-10 pr-10 text-sm",
                                "placeholder:text-muted-foreground",
                                "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                            )}
                        />
                        {searchQuery.trim().length > 0 && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery("")}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                aria-label="clear search"
                            >
                              <X className="h-4 w-4" />
                            </button>
                        )}
                      </div>

                      {/* HOT quick row */}
                      {!isLoading && hotThemes.length > 0 && (
                          <div>
                            <div className="text-[11px] text-muted-foreground mb-2">HOT</div>
                            <div className="flex items-center gap-2 overflow-x-auto pb-1">
                              {hotThemes.slice(0, 8).map((t) => (
                                  <button
                                      key={t.id}
                                      type="button"
                                      onClick={() => openDetail(t)}
                                      className="shrink-0 inline-flex items-center gap-2 rounded-full bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-500/20"
                                  >
                                    <Flame className="h-3.5 w-3.5" />
                                    <span className="max-w-[160px] truncate">{t.name}</span>
                                    <span className="tabular-nums">
                              {sign(t.avgChangePercent)}
                                      {t.avgChangePercent.toFixed(1)}%
                            </span>
                                  </button>
                              ))}
                            </div>
                          </div>
                      )}

                      {/* Momentum filter */}
                      <div>
                        <div className="text-[11px] text-muted-foreground mb-2">모멘텀</div>
                        <div className="flex items-center gap-2 overflow-x-auto pb-1">
                          <Pill active={!selectedMomentum} onClick={() => setSelectedMomentum(null)}>
                            전체
                          </Pill>
                          {(Object.keys(momentumConfig) as MomentumKey[]).map((key) => {
                            const m = momentumConfig[key]
                            const Icon = m.icon
                            const active = selectedMomentum === key
                            return (
                                <button
                                    key={key}
                                    type="button"
                                    onClick={() => setSelectedMomentum(active ? null : key)}
                                    className={cn(
                                        "shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium transition-colors border",
                                        active
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background border-border hover:bg-muted/30",
                                    )}
                                >
                                  <Icon className="h-3.5 w-3.5" />
                                  {m.label}
                                </button>
                            )
                          })}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <Button variant="secondary" className="h-10 flex-1" onClick={() => refetch?.()}>
                          적용(새로고침)
                        </Button>
                        <Button variant="secondary" className="h-10" onClick={clearAll}>
                          초기화
                        </Button>
                      </div>

                      {isError && (
                          <div className="text-[11px] text-red-500/90 line-clamp-2">
                            {(error as any)?.message ?? "테마 API 호출 실패"}
                          </div>
                      )}
                    </div>
                )}
              </div>

              {isLoading ? (
                  <ThemeListSkeleton rows={10} />
              ) : (
                  <>
                    <ul className="divide-y divide-border/60">
                      {filteredThemes.map((t) => {
                        const m = momentumConfig[t.momentum]
                        const Icon = m.icon
                        return (
                            <li key={t.id}>
                              <button
                                  type="button"
                                  onClick={() => openDetail(t)}
                                  className={cn("w-full text-left px-4 py-4 transition hover:bg-muted/30 active:bg-muted/40")}
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <Badge className={cn(m.color, "text-[11px] px-2 py-0.5")}>
                                        <Icon className="mr-1 h-3 w-3" />
                                        {m.label}
                                      </Badge>
                                      <Badge variant="outline" className="text-[11px] text-muted-foreground px-2 py-0.5">
                                        코드 {t.id}
                                      </Badge>
                                      <Badge variant="outline" className="text-[11px] text-muted-foreground px-2 py-0.5">
                                        {t.stockCount}종목
                                      </Badge>
                                    </div>

                                    <div className="mt-2 text-[15px] font-semibold leading-snug line-clamp-2">
                                      {t.name}
                                    </div>

                                    <div className="mt-2 text-[12px] text-muted-foreground line-clamp-2">
                                      상위 변동:{" "}
                                      <span className="font-mono">
                                  {t.topMovers.length
                                      ? t.topMovers
                                          .map((s) => `${s.stockCode}(${sign(s.changeRate)}${(s.changeRate ?? 0).toFixed(1)}%)`)
                                          .join(", ")
                                      : "-"}
                                </span>
                                    </div>
                                  </div>

                                  <div className="shrink-0 text-right">
                                    <div
                                        className={cn(
                                            "text-[15px] font-semibold tabular-nums",
                                            t.avgChangePercent >= 0 ? "text-red-500" : "text-blue-500",
                                        )}
                                    >
                                      {sign(t.avgChangePercent)}
                                      {t.avgChangePercent.toFixed(2)}%
                                    </div>
                                    <div className="text-[11px] text-muted-foreground tabular-nums">
                                      거래대금 {fmtCompact(t.totalTradeAmount)}
                                    </div>
                                  </div>
                                </div>
                              </button>
                            </li>
                        )
                      })}
                    </ul>

                    {filteredThemes.length === 0 && !isLoading && (
                        <div className="px-4 py-12 text-center text-sm text-muted-foreground">조건에 맞는 테마가 없어요.</div>
                    )}
                  </>
              )}
            </div>

            {/* Desktop list table */}
            <div className="hidden lg:block h-full min-h-0 overflow-auto">
              {isLoading ? (
                  <ThemeListSkeleton rows={14} />
              ) : (
                  <Table className="w-full text-xs">
                    <TableHeader>
                      <TableRow className="bg-background/70">
                        <TableHead className="sticky top-0 z-10 bg-background/80 w-[220px] px-3 py-3">테마</TableHead>
                        <TableHead className="sticky top-0 z-10 bg-background/80 w-[120px] px-3 py-3">모멘텀</TableHead>
                        <TableHead className="sticky top-0 z-10 bg-background/80 w-[120px] px-3 py-3 text-right">
                          평균 등락률
                        </TableHead>
                        <TableHead className="sticky top-0 z-10 bg-background/80 w-[110px] px-3 py-3 text-right">
                          종목 수
                        </TableHead>
                        <TableHead className="sticky top-0 z-10 bg-background/80 px-3 py-3">상위 변동</TableHead>
                        <TableHead className="sticky top-0 z-10 bg-background/80 w-[96px] px-3 py-3 text-right">
                          상세
                        </TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody className="[&>tr:nth-child(2n)]:bg-muted/10">
                      {filteredThemes.map((t) => {
                        const m = momentumConfig[t.momentum]
                        const Icon = m.icon
                        return (
                            <TableRow
                                key={t.id}
                                className={cn(
                                    "hover:bg-muted/30 transition cursor-pointer",
                                    selectedTheme?.id === t.id && "bg-muted/20",
                                )}
                                onClick={() => openDetail(t)}
                            >
                              <TableCell className="px-3 py-3 align-top">
                                <div className="min-w-0">
                                  <div className="text-sm font-semibold leading-snug line-clamp-1">{t.name}</div>
                                  <div className="mt-1 text-[11px] text-muted-foreground">코드 {t.id}</div>
                                </div>
                              </TableCell>

                              <TableCell className="px-3 py-3 align-top">
                                <Badge className={cn(m.color, "text-[11px]")}>
                                  <Icon className="mr-1 h-3 w-3" />
                                  {m.label}
                                </Badge>
                              </TableCell>

                              <TableCell
                                  className={cn(
                                      "px-3 py-3 align-top text-right tabular-nums font-semibold",
                                      t.avgChangePercent >= 0 ? "text-red-500" : "text-blue-500",
                                  )}
                              >
                                {sign(t.avgChangePercent)}
                                {t.avgChangePercent.toFixed(2)}%
                              </TableCell>

                              <TableCell className="px-3 py-3 align-top text-right tabular-nums">
                                {t.stockCount.toLocaleString("ko-KR")}
                              </TableCell>

                              <TableCell className="px-3 py-3 align-top text-muted-foreground">
                          <span className="font-mono">
                            {t.topMovers.length
                                ? t.topMovers
                                    .map((s) => `${s.stockCode}(${sign(s.changeRate)}${(s.changeRate ?? 0).toFixed(1)}%)`)
                                    .join(", ")
                                : "-"}
                          </span>
                              </TableCell>

                              <TableCell className="px-3 py-3 align-top text-right">
                                <Button variant="secondary" size="sm" className="h-8 px-3 text-xs" onClick={() => openDetail(t)}>
                                  열기
                                </Button>
                              </TableCell>
                            </TableRow>
                        )
                      })}

                      {filteredThemes.length === 0 && !isLoading && (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                              조건에 맞는 테마가 없어요.
                            </TableCell>
                          </TableRow>
                      )}
                    </TableBody>
                  </Table>
              )}
            </div>
          </div>
        </div>

        {/* ======= Detail Panel (like RealtimeNews Top panel) ======= */}
        {detailOpen && (
            <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" onClick={closeDetail}>
              <div className="absolute inset-0 bg-black/45" />

              <div
                  className={cn(
                      "absolute inset-x-0 bottom-0 h-[85svh] border-t border-border shadow-2xl bg-background flex flex-col rounded-t-2xl",
                      "sm:inset-y-0 sm:right-0 sm:left-auto sm:bottom-auto sm:h-full sm:w-[560px] sm:border-t-0 sm:border-l sm:rounded-t-none",
                  )}
                  onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-4 border-b border-border">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <div className="text-sm font-semibold">{selectedTheme ? selectedTheme.name : "테마 상세"}</div>
                        {selectedTheme && (
                            <>
                              <Badge className={momentumConfig[selectedTheme.momentum].color}>
                                {momentumConfig[selectedTheme.momentum].label}
                              </Badge>
                              <Badge variant="outline" className="text-[11px] text-muted-foreground">
                                코드 {selectedTheme.id}
                              </Badge>
                              <Badge variant="outline" className="text-[11px] text-muted-foreground">
                                {selectedTheme.stockCount}종목
                              </Badge>
                            </>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-1">
                        종목 검색/정렬 리스트까지 한 번에 확인해요.
                      </div>
                    </div>

                    <button
                        type="button"
                        className="h-9 w-9 inline-flex items-center justify-center hover:bg-muted/40"
                        onClick={closeDetail}
                        aria-label="close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto overscroll-contain pb-[env(safe-area-inset-bottom)]">
                  {isLoading ? (
                      <DetailSkeleton />
                  ) : !selectedTheme ? (
                      <div className="p-4">
                        <div className="h-full rounded-xl border border-dashed bg-muted/20 flex items-center justify-center p-10 text-center">
                          <div className="space-y-2">
                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Sparkles className="h-5 w-5" />
                            </div>
                            <div className="text-sm font-medium">테마를 선택하면 여기에 상세가 표시돼요</div>
                            <div className="text-xs text-muted-foreground">종목 리스트/정렬/검색까지 표시합니다.</div>
                          </div>
                        </div>
                      </div>
                  ) : (
                      <div className="p-4 space-y-4">
                        {/* Leaders */}
                        <div className="flex flex-wrap gap-2">
                          {selectedTheme.maxGainer && (
                              <Badge variant="outline" className="text-xs">
                                상승 1위 {selectedTheme.maxGainer.stockCode} (
                                {sign(selectedTheme.maxGainer.changeRate)}
                                {(selectedTheme.maxGainer.changeRate ?? 0).toFixed(1)}%)
                              </Badge>
                          )}
                          {selectedTheme.maxLoser && (
                              <Badge variant="outline" className="text-xs">
                                하락 1위 {selectedTheme.maxLoser.stockCode} ({(selectedTheme.maxLoser.changeRate ?? 0).toFixed(1)}%)
                              </Badge>
                          )}
                          {selectedTheme.tradeLeader && (
                              <Badge variant="outline" className="text-xs">
                                거래대금 1위 {selectedTheme.tradeLeader.stockCode}
                              </Badge>
                          )}
                          {selectedTheme.volumeLeader && (
                              <Badge variant="outline" className="text-xs">
                                거래량 1위 {selectedTheme.volumeLeader.stockCode}
                              </Badge>
                          )}
                        </div>

                        {/* Summary */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                          <div className="rounded-xl border bg-muted/20 p-3 text-center">
                            <p className="text-lg font-bold">{selectedTheme.stockCount}</p>
                            <p className="text-xs text-muted-foreground">종목 수</p>
                          </div>

                          <div className="rounded-xl border bg-muted/20 p-3 text-center">
                            <p
                                className={cn(
                                    "text-lg font-bold tabular-nums",
                                    selectedTheme.avgChangePercent >= 0 ? "text-red-500" : "text-blue-500",
                                )}
                            >
                              {sign(selectedTheme.avgChangePercent)}
                              {selectedTheme.avgChangePercent.toFixed(2)}%
                            </p>
                            <p className="text-xs text-muted-foreground">평균 등락률</p>
                          </div>

                          <div className="rounded-xl border bg-muted/20 p-3 text-center">
                            <p className="text-lg font-bold tabular-nums">
                              <span className="text-red-500">{selectedTheme.upCount}</span>
                              <span className="text-muted-foreground mx-1">/</span>
                              <span className="text-blue-500">{selectedTheme.downCount}</span>
                            </p>
                            <p className="text-xs text-muted-foreground">상승/하락</p>
                          </div>

                          <div className="rounded-xl border bg-muted/20 p-3 text-center">
                            <p className="text-lg font-bold tabular-nums">{fmtCompact(selectedTheme.totalTradeAmount)}</p>
                            <p className="text-xs text-muted-foreground">거래대금 합계</p>
                          </div>
                        </div>

                        <div className="rounded-xl border bg-muted/20 p-3 text-center">
                          <p className="text-base font-semibold tabular-nums">{fmtCompact(selectedTheme.totalVolume)}</p>
                          <p className="text-xs text-muted-foreground">거래량 합계</p>
                        </div>

                        {/* Stocks */}
                        <StockList stocks={detailStocks} />
                      </div>
                  )}
                </div>
              </div>
            </div>
        )}
      </section>
  )
}
