"use client"

import { useEffect, useMemo, useState, type ReactNode } from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
  Building2,
  Cpu,
  FileText,
  MapPin,
  MoreHorizontal,
  ExternalLink,
  X,
  SlidersHorizontal,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { themesData, themeStats, generateThemeStocks, themeCategories } from "@/lib/mock-data"

const momentumConfig = {
  hot: { label: "급등", icon: Flame, color: "text-red-500 bg-red-500/10" },
  rising: { label: "상승", icon: TrendingUp, color: "text-orange-500 bg-orange-500/10" },
  stable: { label: "보합", icon: Minus, color: "text-muted-foreground bg-muted" },
  cooling: { label: "하락", icon: TrendingDown, color: "text-blue-500 bg-blue-500/10" },
  cold: { label: "급락", icon: Snowflake, color: "text-cyan-500 bg-cyan-500/10" },
} as const

const categoryConfig = {
  산업: { icon: Building2, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  정책: { icon: FileText, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  기술: { icon: Cpu, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  이슈: { icon: Sparkles, color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  지역: { icon: MapPin, color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  기타: { icon: MoreHorizontal, color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
} as const

type Theme = (typeof themesData)[number]
type MomentumKey = keyof typeof momentumConfig
type CategoryKey = keyof typeof categoryConfig

// =========================
// UI helpers (RealtimeNews vibe)
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
              "h-8 px-3 rounded-full text-xs transition border whitespace-nowrap inline-flex items-center gap-1",
              active
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "bg-background/50 hover:bg-muted/50 text-foreground border-border",
          )}
      >
        {children}
      </button>
  )
}

function Panel({
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
      <div className={cn("rounded-2xl border border-border/70 bg-background/50 backdrop-blur", className)}>
        <div className="px-4 py-3 border-b border-border/60 flex items-center justify-between gap-2">
          <div className="text-xs font-semibold text-foreground">{title}</div>
          {right}
        </div>
        <div className="p-4">{children}</div>
      </div>
  )
}

// =========================
// Component
// =========================
export function ThemeExplorer() {
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

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<CategoryKey | null>(null)
  const [selectedMomentum, setSelectedMomentum] = useState<MomentumKey | null>(null)

  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null)
  const [themeStocks, setThemeStocks] = useState<ReturnType<typeof generateThemeStocks>>([])

  const hotThemes = useMemo(() => themesData.filter((t) => t.momentum === "hot").slice(0, 10), [])

  const filteredThemes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return themesData.filter((theme) => {
      const matchesSearch = !q || theme.name.toLowerCase().includes(q) || theme.description.toLowerCase().includes(q)
      const matchesCategory = !selectedCategory || theme.category === selectedCategory
      const matchesMomentum = !selectedMomentum || theme.momentum === selectedMomentum
      return matchesSearch && matchesCategory && matchesMomentum
    })
  }, [searchQuery, selectedCategory, selectedMomentum])

  const handleThemeClick = (theme: Theme) => {
    setSelectedTheme(theme)
    setThemeStocks(generateThemeStocks(theme.id))
  }

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedCategory(null)
    setSelectedMomentum(null)
  }

  const closeDetail = () => {
    setSelectedTheme(null)
    setThemeStocks([])
  }

  const headerCountText = useMemo(() => {
    const total = themesData.length
    const shown = filteredThemes.length
    if (total === shown) return `${shown.toLocaleString("ko-KR")}개`
    return `${shown.toLocaleString("ko-KR")} / ${total.toLocaleString("ko-KR")}개`
  }, [filteredThemes.length])

  const DetailBody = useMemo(() => {
    if (!selectedTheme) return null
    const cat = categoryConfig[selectedTheme.category as CategoryKey]
    const CategoryIcon = cat.icon
    const mom = momentumConfig[selectedTheme.momentum as MomentumKey]
    const MomentumIcon = mom.icon

    return (
        <div className="h-full flex flex-col min-h-0">
          {/* 상단 정보 */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="text-lg font-semibold">{selectedTheme.name}</div>

              <Badge variant="outline" className={cn("text-xs", cat.color)}>
                <CategoryIcon className="mr-1 h-3 w-3" />
                {selectedTheme.category}
              </Badge>

              <Badge variant="outline" className={cn("text-xs", mom.color)}>
                <MomentumIcon className="mr-1 h-3 w-3" />
                {mom.label}
              </Badge>

              <Badge variant="outline" className="text-xs text-muted-foreground">
                {selectedTheme.stockCount}종목
              </Badge>
            </div>

            <p className="text-sm text-muted-foreground">{selectedTheme.description}</p>
          </div>

          {/* 통계 */}
          <div className="mt-4 grid grid-cols-2 xl:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-muted/40 p-3 text-center">
              <p className="text-lg font-bold">{selectedTheme.stockCount}</p>
              <p className="text-xs text-muted-foreground">종목 수</p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-3 text-center">
              <p
                  className={cn(
                      "text-lg font-bold tabular-nums",
                      selectedTheme.avgChangePercent >= 0 ? "text-red-500" : "text-blue-500",
                  )}
              >
                {selectedTheme.avgChangePercent >= 0 ? "+" : ""}
                {selectedTheme.avgChangePercent.toFixed(2)}%
              </p>
              <p className="text-xs text-muted-foreground">평균 등락률</p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-3 text-center">
              <p className="text-lg font-bold">{selectedTheme.totalMarketCap}</p>
              <p className="text-xs text-muted-foreground">시가총액</p>
            </div>
            <div className="rounded-2xl bg-muted/40 p-3 text-center">
              <Badge variant="outline" className={cn("text-xs", cat.color)}>
                <CategoryIcon className="mr-1 h-3 w-3" />
                {selectedTheme.category}
              </Badge>
              <p className="mt-1 text-xs text-muted-foreground">카테고리</p>
            </div>
          </div>

          {/* 연관 테마 */}
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">연관 테마</p>
            <div className="flex flex-wrap gap-2">
              {selectedTheme.relatedThemes.map((rt) => (
                  <Badge key={rt} variant="outline">
                    {rt}
                  </Badge>
              ))}
            </div>
          </div>

          {/* 종목 목록 */}
          <div className="mt-4 flex-1 min-h-0 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">테마 종목</p>
              <Badge variant="outline" className="text-xs text-muted-foreground">
                {themeStocks.length}개
              </Badge>
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain pr-2 pb-2">
              <div className="space-y-1">
                {themeStocks.map((stock, idx) => (
                    <Link
                        key={stock.ticker}
                        href={`/stock/${stock.ticker}`}
                        className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-3 transition hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-6 text-center text-xs text-muted-foreground shrink-0">{idx + 1}</span>
                        <div className="min-w-0">
                          <p className="font-semibold truncate">{stock.name}</p>
                          <p className="text-xs text-muted-foreground">{stock.ticker}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="font-semibold tabular-nums">{stock.price.toLocaleString()}원</p>
                          <p
                              className={cn(
                                  "text-xs tabular-nums",
                                  stock.changePercent >= 0 ? "text-red-500" : "text-blue-500",
                              )}
                          >
                            {stock.changePercent >= 0 ? "+" : ""}
                            {stock.changePercent.toFixed(2)}%
                          </p>
                        </div>
                        <ExternalLink className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
    )
  }, [selectedTheme, themeStocks])

  return (
      <section
          className={cn(
              "w-full",
              "bg-[radial-gradient(60%_40%_at_10%_0%,rgba(59,130,246,0.10),transparent_60%),radial-gradient(60%_40%_at_90%_0%,rgba(239,68,68,0.10),transparent_60%)]",
          )}
          style={{ height: "calc(100svh - var(--app-header-h, 64px))" }}
      >
        <div className="h-full flex flex-col min-h-0">
          {/* ======= Sticky Header ======= */}
          <div className="sticky top-0 z-30 border-b border-border/70 bg-background/65 backdrop-blur">
            <div className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-2xl bg-foreground/5 flex items-center justify-center shrink-0">
                      <BarChart3 className="h-4 w-4" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-semibold text-foreground">테마 탐색기</h3>
                        <Badge variant="outline" className="text-[11px] text-muted-foreground">
                          {headerCountText}
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">
                        {themeStats.totalStocks}종목
                        <span className="mx-1 text-muted-foreground/40">•</span>
                        전체 {themeStats.totalThemes}테마
                      </span>
                      </div>

                      {selectedTheme && (
                          <div className="mt-1">
                            <Badge variant="outline" className="text-[11px] px-2 py-0 inline-flex items-center gap-1">
                              선택: {selectedTheme.name}
                              <button
                                  type="button"
                                  className="ml-1 inline-flex items-center text-muted-foreground hover:text-foreground"
                                  onClick={closeDetail}
                                  aria-label="clear selected theme"
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
                  <Button variant="secondary" size="sm" className="h-9" onClick={clearFilters}>
                    필터 초기화
                  </Button>
                </div>
              </div>

              {/* Search */}
              <div className="mt-3 flex items-center gap-2">
                <div className="relative flex-1 min-w-0">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <input
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="검색: 테마명/설명 키워드"
                      className={cn(
                          "w-full h-10 rounded-2xl border border-input bg-background/50 pl-10 pr-10 text-sm",
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

                {/* Mobile: close detail quickly */}
                {!isLg && selectedTheme && (
                    <Button variant="secondary" size="sm" className="h-10 px-3" onClick={closeDetail}>
                      닫기
                    </Button>
                )}
              </div>

              {/* Filters (mobile collapsible) */}
              <div className="mt-3 lg:hidden">
                <details className="rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-3">
                  <summary className="cursor-pointer list-none">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <SlidersHorizontal className="h-4 w-4" />
                      필터
                      <span className="ml-auto text-[11px]">
                      {selectedCategory ?? "전체"} · {selectedMomentum ?? "전체"}
                    </span>
                    </div>
                  </summary>

                  <div className="mt-3 space-y-3">
                    <div>
                      <div className="text-[11px] text-muted-foreground mb-2">카테고리</div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <Pill active={selectedCategory === null} onClick={() => setSelectedCategory(null)}>
                          전체
                        </Pill>
                        {themeCategories.map((cat) => {
                          const c = cat as CategoryKey
                          const Icon = categoryConfig[c].icon
                          const active = selectedCategory === c
                          return (
                              <Pill key={c} active={active} onClick={() => setSelectedCategory(active ? null : c)}>
                                <Icon className="h-3 w-3" />
                                {c}
                              </Pill>
                          )
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="text-[11px] text-muted-foreground mb-2">모멘텀</div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <Pill active={selectedMomentum === null} onClick={() => setSelectedMomentum(null)}>
                          전체
                        </Pill>
                        {(Object.keys(momentumConfig) as MomentumKey[]).map((key) => {
                          const cfg = momentumConfig[key]
                          const Icon = cfg.icon
                          const active = selectedMomentum === key
                          return (
                              <Pill key={key} active={active} onClick={() => setSelectedMomentum(active ? null : key)}>
                                <Icon className="h-3 w-3" />
                                {cfg.label}
                              </Pill>
                          )
                        })}
                      </div>
                    </div>

                    {/* HOT strip (mobile) */}
                    <div>
                      <div className="text-[11px] text-muted-foreground mb-2">HOT</div>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                        {hotThemes.map((theme) => (
                            <button
                                key={theme.id}
                                type="button"
                                onClick={() => handleThemeClick(theme)}
                                className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500 transition-colors hover:bg-red-500/20"
                            >
                              <Flame className="h-3.5 w-3.5" />
                              <span className="max-w-[180px] truncate">{theme.name}</span>
                              <span className="tabular-nums">
                            {theme.avgChangePercent > 0 ? "+" : ""}
                                {theme.avgChangePercent.toFixed(1)}%
                          </span>
                            </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1">
                      <div className="text-[11px] text-muted-foreground">{filteredThemes.length.toLocaleString("ko-KR")}개 표시</div>
                      <Button variant="secondary" size="sm" className="h-8" onClick={clearFilters}>
                        초기화
                      </Button>
                    </div>
                  </div>
                </details>
              </div>

              {/* Filters (desktop always open) */}
              <div className="mt-3 hidden lg:block rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-3">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <SlidersHorizontal className="h-4 w-4" />
                  필터
                  <span className="ml-auto">
                  {selectedCategory ?? "전체"}
                    <span className="mx-1 text-muted-foreground/40">•</span>
                    {selectedMomentum ?? "전체"}
                    <span className="mx-1 text-muted-foreground/40">•</span>
                  표시 {filteredThemes.length.toLocaleString("ko-KR")}개
                </span>
                </div>

                <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Pill active={selectedCategory === null} onClick={() => setSelectedCategory(null)}>
                      전체
                    </Pill>
                    {themeCategories.map((cat) => {
                      const c = cat as CategoryKey
                      const Icon = categoryConfig[c].icon
                      const active = selectedCategory === c
                      return (
                          <Pill key={c} active={active} onClick={() => setSelectedCategory(active ? null : c)}>
                            <Icon className="h-3 w-3" />
                            {c}
                          </Pill>
                      )
                    })}
                  </div>

                  <Separator />

                  <div className="flex flex-wrap items-center gap-1.5">
                    <Pill active={selectedMomentum === null} onClick={() => setSelectedMomentum(null)}>
                      전체
                    </Pill>
                    {(Object.keys(momentumConfig) as MomentumKey[]).map((key) => {
                      const cfg = momentumConfig[key]
                      const Icon = cfg.icon
                      const active = selectedMomentum === key
                      return (
                          <Pill key={key} active={active} onClick={() => setSelectedMomentum(active ? null : key)}>
                            <Icon className="h-3 w-3" />
                            {cfg.label}
                          </Pill>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ======= Main layout ======= */}
          <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[420px_1fr]">
            {/* Left: list (desktop watchlist vibe) */}
            <aside className="hidden lg:block min-h-0 border-r border-border/70 bg-background/20">
              <div className="h-full min-h-0 overflow-y-auto p-4 space-y-3">
                <Panel
                    title="HOT"
                    right={<span className="text-[11px] text-muted-foreground">클릭해서 상세</span>}
                >
                  <div className="flex flex-wrap gap-2">
                    {hotThemes.slice(0, 8).map((theme) => (
                        <button
                            key={theme.id}
                            type="button"
                            onClick={() => handleThemeClick(theme)}
                            className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-2 text-xs font-medium text-red-500 transition hover:bg-red-500/20"
                        >
                          <Flame className="h-3.5 w-3.5" />
                          <span className="max-w-[160px] truncate">{theme.name}</span>
                          <span className="tabular-nums">
                        {theme.avgChangePercent > 0 ? "+" : ""}
                            {theme.avgChangePercent.toFixed(1)}%
                      </span>
                        </button>
                    ))}
                  </div>
                </Panel>

                <div className="rounded-2xl border border-border/70 bg-background/40 backdrop-blur p-4 text-[11px] text-muted-foreground">
                  <div className="flex items-center justify-between gap-2">
                    <span>현재 표시</span>
                    <span className="tabular-nums">{filteredThemes.length.toLocaleString("ko-KR")}개</span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2">
                    <span>전체 테마</span>
                    <span className="tabular-nums">{themesData.length.toLocaleString("ko-KR")}개</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredThemes.map((theme) => {
                    const mom = momentumConfig[theme.momentum as MomentumKey]
                    const MomentumIcon = mom.icon
                    const cat = categoryConfig[theme.category as CategoryKey]
                    const CategoryIcon = cat.icon
                    const isActive = selectedTheme?.id === theme.id

                    return (
                        <button
                            key={theme.id}
                            type="button"
                            onClick={() => handleThemeClick(theme)}
                            className={cn(
                                "w-full rounded-2xl border border-border/70 p-3 text-left transition",
                                "bg-background/50 backdrop-blur hover:bg-muted/40",
                                isActive && "border-foreground/25 ring-1 ring-foreground/15",
                            )}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-semibold leading-tight line-clamp-1">{theme.name}</span>

                                <Badge variant="outline" className={cn("text-[11px]", cat.color)}>
                                  <CategoryIcon className="mr-1 h-3 w-3" />
                                  {theme.category}
                                </Badge>

                                <Badge variant="outline" className={cn("text-[11px]", mom.color)}>
                                  <MomentumIcon className="mr-1 h-3 w-3" />
                                  {mom.label}
                                </Badge>
                              </div>

                              <p className="mt-2 text-[12px] text-muted-foreground line-clamp-2">{theme.description}</p>
                            </div>

                            <div className="shrink-0 text-right">
                              <p
                                  className={cn(
                                      "text-sm font-semibold tabular-nums",
                                      theme.avgChangePercent >= 0 ? "text-red-500" : "text-blue-500",
                                  )}
                              >
                                {theme.avgChangePercent >= 0 ? "+" : ""}
                                {theme.avgChangePercent.toFixed(2)}%
                              </p>
                              <p className="text-[11px] text-muted-foreground">{theme.stockCount}종목</p>
                            </div>
                          </div>
                        </button>
                    )
                  })}

                  {filteredThemes.length === 0 && (
                      <div className="rounded-2xl border border-border/70 bg-background/50 p-10 text-center text-sm text-muted-foreground">
                        조건에 맞는 테마가 없어요.
                      </div>
                  )}
                </div>
              </div>
            </aside>

            {/* Right: mobile list / desktop detail */}
            <div className="min-h-0">
              {/* Mobile: list (no Card) */}
              <div className="lg:hidden h-full min-h-0 overflow-y-auto overscroll-contain">
                <ul className="divide-y divide-border/60">
                  {filteredThemes.map((theme) => {
                    const mom = momentumConfig[theme.momentum as MomentumKey]
                    const MomentumIcon = mom.icon
                    const cat = categoryConfig[theme.category as CategoryKey]
                    const CategoryIcon = cat.icon

                    return (
                        <li key={theme.id}>
                          <button
                              type="button"
                              onClick={() => handleThemeClick(theme)}
                              className="w-full text-left px-4 py-4 hover:bg-muted/30 active:bg-muted/40 transition"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <div className="text-[15px] font-semibold leading-snug line-clamp-1">{theme.name}</div>

                                  <Badge variant="outline" className={cn("text-[11px] px-2 py-0.5", cat.color)}>
                                    <CategoryIcon className="mr-1 h-3 w-3" />
                                    {theme.category}
                                  </Badge>

                                  <Badge variant="outline" className={cn("text-[11px] px-2 py-0.5", mom.color)}>
                                    <MomentumIcon className="mr-1 h-3 w-3" />
                                    {mom.label}
                                  </Badge>
                                </div>

                                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">{theme.description}</p>

                                <div className="mt-3 flex items-center justify-between gap-2">
                                  <div className="text-[11px] text-muted-foreground">{theme.stockCount}종목</div>
                                  <div className="inline-flex items-center gap-2">
                                <span
                                    className={cn(
                                        "text-sm font-semibold tabular-nums",
                                        theme.avgChangePercent >= 0 ? "text-red-500" : "text-blue-500",
                                    )}
                                >
                                  {theme.avgChangePercent >= 0 ? "+" : ""}
                                  {theme.avgChangePercent.toFixed(2)}%
                                </span>
                                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </button>
                        </li>
                    )
                  })}
                </ul>

                {filteredThemes.length === 0 && (
                    <div className="px-4 py-12 text-center text-sm text-muted-foreground">조건에 맞는 테마가 없어요.</div>
                )}
              </div>

              {/* Desktop: detail panel */}
              <div className="hidden lg:block h-full min-h-0 overflow-y-auto p-4">
                <div className="h-full min-h-0 rounded-2xl border border-border/70 bg-background/50 backdrop-blur overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-border/60 flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <div className="text-sm font-semibold">{selectedTheme ? "테마 상세" : "선택 대기"}</div>
                        {selectedTheme && (
                            <Badge variant="outline" className={cn("text-[11px]", momentumConfig[selectedTheme.momentum as MomentumKey].color)}>
                              {momentumConfig[selectedTheme.momentum as MomentumKey].label}
                            </Badge>
                        )}
                      </div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">
                        {selectedTheme ? "우측에서 종목까지 한 번에 확인하세요." : "왼쪽에서 테마를 선택해 주세요."}
                      </div>
                    </div>

                    {selectedTheme && (
                        <button
                            type="button"
                            className="h-9 w-9 inline-flex items-center justify-center rounded-xl hover:bg-muted/40"
                            onClick={closeDetail}
                            aria-label="close detail"
                        >
                          <X className="h-4 w-4" />
                        </button>
                    )}
                  </div>

                  <div className="flex-1 min-h-0 p-4">
                    {!selectedTheme ? (
                        <div className="h-full rounded-2xl border border-dashed bg-muted/10 flex items-center justify-center p-10 text-center">
                          <div className="space-y-2">
                            <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Sparkles className="h-5 w-5" />
                            </div>
                            <div className="text-sm font-medium">테마를 선택하면 여기에 상세가 표시돼요</div>
                            <div className="text-xs text-muted-foreground">종목 리스트는 스크롤로 끝까지 볼 수 있어요.</div>
                          </div>
                        </div>
                    ) : (
                        DetailBody
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ======= Mobile Detail (bottom-sheet like RealtimeNews) ======= */}
          {!isLg && selectedTheme && (
              <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" onClick={closeDetail}>
                <div className="absolute inset-0 bg-black/45" />

                <div
                    className={cn(
                        "absolute inset-x-0 bottom-0 h-[85svh] rounded-t-2xl",
                        "bg-background border-t border-border shadow-2xl",
                        "flex flex-col",
                    )}
                    onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-4 border-b border-border bg-background/70 backdrop-blur">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-semibold truncate">{selectedTheme.name}</div>
                          <Badge variant="outline" className={cn("text-[11px]", momentumConfig[selectedTheme.momentum as MomentumKey].color)}>
                            {momentumConfig[selectedTheme.momentum as MomentumKey].label}
                          </Badge>
                        </div>
                        <div className="text-[11px] text-muted-foreground mt-0.5">{selectedTheme.description}</div>
                      </div>

                      <button
                          type="button"
                          className="h-9 w-9 inline-flex items-center justify-center rounded-xl hover:bg-muted/40"
                          onClick={closeDetail}
                          aria-label="close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 pb-[env(safe-area-inset-bottom)]">
                    {DetailBody}
                  </div>

                  <div className="p-4 border-t border-border flex items-center justify-between gap-2 pb-[env(safe-area-inset-bottom)]">
                    <Button type="button" variant="secondary" className="h-10" onClick={closeDetail}>
                      닫기
                    </Button>
                    <Button
                        type="button"
                        className="h-10"
                        onClick={() => {
                          // “다른 테마” 탐색을 돕기 위해: 닫기만
                          closeDetail()
                        }}
                    >
                      확인
                    </Button>
                  </div>
                </div>
              </div>
          )}
        </div>
      </section>
  )
}
