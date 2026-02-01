// ThemeExplorer.tsx
"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Sparkles,
  Minus,
  Snowflake,
  Search,
  ChevronRight,
  BarChart3,
  ExternalLink,
  X,
  SlidersHorizontal,
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

export function ThemeExplorer() {
  const { data: apiThemes, isLoading, isError, error } = useTheme()

  const [isLg, setIsLg] = useState(false)
  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)")
    const onChange = () => setIsLg(m.matches)
    onChange()

    if (m.addEventListener) m.addEventListener("change", onChange)
    else m.addListener(onChange)

    return () => {
      if (m.removeEventListener) m.removeEventListener("change", onChange)
      else m.removeListener(onChange)
    }
  }, [])

  // ✅ API(Model Theme[]) -> UI ViewModel
  const themes: ThemeView[] = useMemo(() => {
    const src = (apiThemes ?? []) as Theme[]

    return src.map((t) => {
      const rate = Number(t.averageChangeRate ?? 0)
      const stocks = (t.stocks ?? []) as ThemeStock[]
      const stockCount = Number(t.stockCount ?? stocks.length ?? 0)

      const topMovers = [...stocks].sort((a, b) => b.changeRate - a.changeRate).slice(0, 3)

      const upCount = stocks.reduce((acc, s) => acc + (s.changeRate > 0 ? 1 : 0), 0)
      const downCount = stocks.reduce((acc, s) => acc + (s.changeRate < 0 ? 1 : 0), 0)
      const flatCount = Math.max(0, stockCount - upCount - downCount)

      const totalVolume = stocks.reduce((acc, s) => acc + (s.volume ?? 0), 0)
      const totalTradeAmount = stocks.reduce((acc, s) => acc + (s.tradeAmount ?? 0), 0)

      const maxGainer = maxBy(stocks, (s) => s.changeRate ?? 0)
      const maxLoser = minBy(stocks, (s) => s.changeRate ?? 0)
      const volumeLeader = maxBy(stocks, (s) => s.volume ?? 0)
      const tradeLeader = maxBy(stocks, (s) => s.tradeAmount ?? 0)

      return {
        id: String(t.themeCode),
        name: t.themeName ?? "",
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

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMomentum, setSelectedMomentum] = useState<MomentumKey | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<ThemeView | null>(null)

  // 상세 종목 리스트: 검색/정렬
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
    return sorted.slice(0, 8)
  }, [themes])

  const filteredThemes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return themes.filter((theme) => {
      const matchesSearch = !q || theme.name.toLowerCase().includes(q)
      const matchesMomentum = !selectedMomentum || theme.momentum === selectedMomentum
      return matchesSearch && matchesMomentum
    })
  }, [themes, searchQuery, selectedMomentum])

  const detailStocks = useMemo(() => {
    const base = selectedTheme?.stocks ?? []
    const q = stockQuery.trim().toLowerCase()

    const filtered = !q
      ? base
      : base.filter((s) => {
        // ✅ stockName도 검색 대상에 포함
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

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedMomentum(null)
  }

  const closeDetail = () => setSelectedTheme(null)
  const handleThemeClick = (theme: ThemeView) => setSelectedTheme(theme)

  const StockList = ({ stocks }: { stocks: ThemeStock[] }) => {
    if (!selectedTheme) {
      return (
        <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
          테마를 선택해 주세요.
        </div>
      )
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

    if (!stocks.length) {
      return (
        <div className="rounded-xl border bg-muted/20 p-4 text-sm text-muted-foreground">
          조건에 맞는 종목이 없어요.
        </div>
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
            <div key={s.stockCode} className="px-4 py-3 flex items-center justify-between gap-3">
              <div className="min-w-0">
                {/* ✅ stockCode 옆에 stockName 렌더링 */}
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
                  {s.changeRate.toFixed(2)}%
                </div>
                <div className="text-xs text-muted-foreground tabular-nums">
                  {sign(s.change)}
                  {fmt(s.change)}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  // ✅ 공통 wrapper: 화면 꽉 차게
  return (
    <section className="w-full" style={{ height: "calc(100svh - var(--app-header-h, 64px))" }}>
      <div className="h-full min-h-0">
        <div className="h-full min-h-0 grid grid-cols-1 lg:grid-cols-[420px_1fr]">
          {/* LEFT PANE */}
          <div className="min-h-0 flex flex-col border-r border-border bg-background">
            {/* LEFT HEADER (sticky) */}
            <div className="shrink-0 border-b border-border bg-background/70 backdrop-blur px-3 py-3 sm:px-4 sm:py-4">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-base sm:text-lg font-semibold truncate">테마 탐색기</div>

                      <Badge variant="outline" className="text-[11px] text-muted-foreground">
                        {totalThemes.toLocaleString("ko-KR")}개
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
                    </div>

                    <div className="text-[11px] text-muted-foreground">
                      {filteredThemes.length.toLocaleString("ko-KR")}개 표시
                    </div>

                    {isError && (
                      <div className="mt-1 text-[11px] text-red-500/90 line-clamp-2">
                        {(error as any)?.message ?? "테마 API 호출 실패"}
                      </div>
                    )}
                  </div>
                </div>

                <Button variant="secondary" size="sm" className="h-9" onClick={clearFilters}>
                  초기화
                </Button>
              </div>

              {/* HOT */}
              <div className="mt-3">
                <div className="flex items-center gap-2 mb-2">
                  <Flame className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">HOT</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">클릭해서 상세 보기</span>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                  {hotThemes.map((theme) => (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeClick(theme)}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-2 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20"
                    >
                      <Flame className="h-3.5 w-3.5" />
                      <span className="max-w-[180px] truncate">{theme.name}</span>
                      <span className="text-xs tabular-nums">
                        {theme.avgChangePercent > 0 ? "+" : ""}
                        {theme.avgChangePercent.toFixed(2)}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 검색 */}
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="테마명 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-9 pr-10 rounded-xl"
                />
                {searchQuery.trim().length > 0 && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    aria-label="clear search"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* 필터: 모멘텀만 */}
              <div className="mt-3 lg:hidden">
                <details className="rounded-2xl border border-border bg-background p-3">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <SlidersHorizontal className="h-4 w-4" />
                      필터
                      <span className="ml-auto text-[11px]">{selectedMomentum ?? "전체"}</span>
                    </div>
                  </summary>

                  <div className="mt-3 space-y-3">
                    <div>
                      <div className="text-[11px] text-muted-foreground mb-2">모멘텀</div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {(Object.keys(momentumConfig) as MomentumKey[]).map((key) => {
                          const config = momentumConfig[key]
                          const Icon = config.icon
                          const active = selectedMomentum === key
                          return (
                            <button
                              key={key}
                              onClick={() => setSelectedMomentum(active ? null : key)}
                              className={cn(
                                "shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-2 text-xs font-medium transition-colors border",
                                active
                                  ? "bg-primary text-primary-foreground border-primary"
                                  : "bg-background border-border hover:bg-muted/30",
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" />
                              {config.label}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="text-[11px] text-muted-foreground">
                        {filteredThemes.length.toLocaleString("ko-KR")}개 표시
                      </div>
                      <Button variant="secondary" size="sm" className="h-8" onClick={clearFilters}>
                        초기화
                      </Button>
                    </div>
                  </div>
                </details>
              </div>

              <div className="mt-3 hidden lg:block space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    {filteredThemes.length.toLocaleString("ko-KR")}개 표시
                    <span className="mx-1 text-muted-foreground/40">•</span>
                    전체 {themes.length.toLocaleString("ko-KR")}개
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearFilters}>
                    필터 초기화
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(Object.keys(momentumConfig) as MomentumKey[]).map((key) => {
                    const config = momentumConfig[key]
                    const Icon = config.icon
                    const active = selectedMomentum === key
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedMomentum(active ? null : key)}
                        className={cn(
                          "inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors",
                          active ? "bg-primary text-primary-foreground" : config.color,
                        )}
                      >
                        <Icon className="h-3 w-3" />
                        {config.label}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* LEFT LIST (scroll) */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4 pb-[env(safe-area-inset-bottom)]">
              <div className="space-y-3">
                {filteredThemes.map((theme) => {
                  const momentum = momentumConfig[theme.momentum]
                  const MomentumIcon = momentum.icon
                  const isActive = selectedTheme?.id === theme.id

                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleThemeClick(theme)}
                      className={cn(
                        "w-full rounded-2xl lg:rounded-lg border bg-background p-4 text-left transition-colors",
                        "hover:bg-accent",
                        isActive && "ring-1 ring-primary/40 border-primary/30",
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-base lg:text-sm font-semibold leading-tight line-clamp-1">
                              {theme.name}
                            </span>

                            <Badge className={cn(momentum.color, "text-xs")}>
                              <MomentumIcon className="mr-1 h-3 w-3" />
                              {momentum.label}
                            </Badge>

                            <Badge variant="outline" className="text-xs text-muted-foreground">
                              코드 {theme.id}
                            </Badge>
                          </div>

                          <p className="mt-2 text-sm lg:text-xs text-muted-foreground">
                            상위 변동:{" "}
                            <span className="font-mono">
                              {theme.topMovers.length
                                ? theme.topMovers
                                  .map((s) => `${s.stockCode}(${sign(s.changeRate)}${s.changeRate.toFixed(1)}%)`)
                                  .join(", ")
                                : "-"}
                            </span>
                          </p>
                        </div>

                        <div className="shrink-0 flex items-center gap-2">
                          <div className="text-right">
                            <p
                              className={cn(
                                "text-base lg:text-sm font-semibold tabular-nums",
                                theme.avgChangePercent >= 0 ? "text-red-500" : "text-blue-500",
                              )}
                            >
                              {theme.avgChangePercent >= 0 ? "+" : ""}
                              {theme.avgChangePercent.toFixed(2)}%
                            </p>
                            <p className="text-xs text-muted-foreground">{theme.stockCount}종목</p>
                          </div>
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        </div>
                      </div>
                    </button>
                  )
                })}

                {!isLoading && filteredThemes.length === 0 && (
                  <div className="rounded-2xl border bg-background p-10 text-center text-sm text-muted-foreground">
                    조건에 맞는 테마가 없어요.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* RIGHT PANE (Desktop) */}
          <div className="min-h-0 hidden lg:flex flex-col bg-background">
            {/* RIGHT HEADER (sticky) */}
            <div className="shrink-0 border-b border-border bg-background/70 backdrop-blur px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="text-lg font-semibold">{selectedTheme ? "테마 상세" : "선택 대기"}</div>
                    {selectedTheme && (
                      <Badge className={momentumConfig[selectedTheme.momentum].color}>
                        {momentumConfig[selectedTheme.momentum].label}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedTheme ? "테마 요약 + 종목 검색/정렬 리스트를 보여줍니다." : "왼쪽에서 테마를 선택해 주세요."}
                  </p>
                </div>

                {selectedTheme && (
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={closeDetail}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* RIGHT BODY (scroll) */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 pb-[env(safe-area-inset-bottom)]">
              {!selectedTheme ? (
                <div className="h-full rounded-xl border border-dashed bg-muted/20 flex items-center justify-center p-10 text-center">
                  <div className="space-y-2">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-medium">테마를 선택하면 여기에 상세가 표시돼요</div>
                    <div className="text-xs text-muted-foreground">종목 리스트/정렬/검색까지 표시합니다.</div>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col min-h-0 space-y-4">
                  {/* TITLE */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-lg font-semibold">{selectedTheme.name}</div>
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        코드 {selectedTheme.id}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        {selectedTheme.stockCount}종목
                      </Badge>
                    </div>

                    {/* Leaders */}
                    <div className="flex flex-wrap gap-2">
                      {selectedTheme.maxGainer && (
                        <Badge variant="outline" className="text-xs">
                          상승 1위 {selectedTheme.maxGainer.stockCode} (
                          {sign(selectedTheme.maxGainer.changeRate)}
                          {selectedTheme.maxGainer.changeRate.toFixed(1)}%)
                        </Badge>
                      )}
                      {selectedTheme.maxLoser && (
                        <Badge variant="outline" className="text-xs">
                          하락 1위 {selectedTheme.maxLoser.stockCode} ({selectedTheme.maxLoser.changeRate.toFixed(1)}%)
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
                  </div>

                  {/* Summary */}
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
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

                  {/* Link */}
                  <div className="flex items-center gap-2 pt-1">
                    <Link
                      href={`/themes/${selectedTheme.id}`}
                      className="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted"
                    >
                      상세 페이지로 <ExternalLink className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE: 상세는 Dialog */}
      <Dialog open={!isLg && !!selectedTheme} onOpenChange={(open) => (!open ? closeDetail() : null)}>
        <DialogContent
          className={cn(
            "p-0 w-full max-w-none overflow-hidden",
            "fixed left-0 right-0 bottom-0 top-auto translate-x-0 translate-y-0",
            "h-[85svh] rounded-t-2xl border-t",
            "sm:left-1/2 sm:top-1/2 sm:right-auto sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2",
            "sm:h-auto sm:max-h-[85vh] sm:rounded-lg sm:max-w-2xl sm:border",
          )}
        >
          {selectedTheme && (
            <div className="flex h-full flex-col">
              <div className="shrink-0 border-b border-border bg-background/70 backdrop-blur px-4 py-4">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className="truncate">{selectedTheme.name}</span>
                    <Badge className={momentumConfig[selectedTheme.momentum].color}>
                      {momentumConfig[selectedTheme.momentum].label}
                    </Badge>
                    <button
                      type="button"
                      className="ml-auto inline-flex h-9 w-9 items-center justify-center rounded-xl hover:bg-muted/40"
                      onClick={closeDetail}
                      aria-label="close"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </DialogTitle>
                </DialogHeader>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 pb-[env(safe-area-inset-bottom)] space-y-4">
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
                    <p className="text-xs text-muted-foreground">거래대금</p>
                  </div>
                </div>

                <div className="rounded-xl border bg-muted/20 p-3 text-center">
                  <p className="text-base font-semibold tabular-nums">{fmtCompact(selectedTheme.totalVolume)}</p>
                  <p className="text-xs text-muted-foreground">거래량 합계</p>
                </div>

                <StockList stocks={detailStocks} />

                <Link
                  href={`/themes/${selectedTheme.id}`}
                  className="flex items-center justify-between rounded-2xl border bg-background p-4 transition-colors hover:bg-muted"
                  onClick={closeDetail}
                >
                  <div className="min-w-0">
                    <p className="font-semibold truncate">테마 상세 페이지</p>
                    <p className="text-xs text-muted-foreground">/themes/{selectedTheme.id}</p>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
