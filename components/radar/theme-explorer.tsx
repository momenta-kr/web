"use client"

import { useEffect, useMemo, useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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

export function ThemeExplorer() {
  const [isLg, setIsLg] = useState(false)

  useEffect(() => {
    const m = window.matchMedia("(min-width: 1024px)")
    const onChange = () => setIsLg(m.matches)
    onChange()

    // safari 대응
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

  const hotThemes = useMemo(() => themesData.filter((t) => t.momentum === "hot").slice(0, 8), [])

  const filteredThemes = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    return themesData.filter((theme) => {
      const matchesSearch =
        !q || theme.name.toLowerCase().includes(q) || theme.description.toLowerCase().includes(q)
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

  return (
    <section
      className="w-full"
      style={{ height: "calc(100svh - var(--app-header-h, 64px))" }}
    >
      <div className="h-full px-3 py-3 sm:p-4">
        <div className="h-full grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-3 min-h-0">
          {/* LEFT: 탐색/필터/리스트 */}
          <Card className="min-h-0 flex flex-col overflow-hidden">
            {/* 모바일에서 시원하게: 헤더는 고정 영역(스크롤 X), 리스트만 스크롤 */}
            <div className="shrink-0 border-b border-border bg-background/70 backdrop-blur px-3 py-3 sm:px-4 sm:py-4">
              {/* 타이틀 */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-base sm:text-lg font-semibold truncate">테마 탐색기</div>
                      <Badge variant="outline" className="text-[11px] text-muted-foreground">
                        {themeStats.totalThemes}개
                      </Badge>
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {themeStats.totalStocks}종목
                      <span className="mx-1 text-muted-foreground/40">•</span>
                      {filteredThemes.length.toLocaleString("ko-KR")}개 표시
                    </div>
                  </div>
                </div>

                <Button variant="secondary" size="sm" className="h-9" onClick={clearFilters}>
                  초기화
                </Button>
              </div>

              {/* HOT: 모바일은 가로 스크롤 스트립 */}
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
                        {theme.avgChangePercent.toFixed(1)}%
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 검색 */}
              <div className="mt-3 relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="테마명 또는 키워드 검색..."
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

              {/* 필터: 모바일은 접기/펼치기, 데스크탑은 항상 노출 */}
              <div className="mt-3 lg:hidden">
                <details className="rounded-2xl border border-border bg-background p-3">
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
                    {/* 카테고리 */}
                    <div>
                      <div className="text-[11px] text-muted-foreground mb-2">카테고리</div>
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        <Button
                          variant={selectedCategory === null ? "default" : "outline"}
                          size="sm"
                          onClick={() => setSelectedCategory(null)}
                          className="h-8 text-xs shrink-0 rounded-full"
                        >
                          전체
                        </Button>
                        {themeCategories.map((cat) => {
                          const c = cat as CategoryKey
                          const Icon = categoryConfig[c].icon
                          const active = selectedCategory === c
                          return (
                            <Button
                              key={c}
                              variant={active ? "default" : "outline"}
                              size="sm"
                              onClick={() => setSelectedCategory(active ? null : c)}
                              className="h-8 text-xs shrink-0 rounded-full"
                            >
                              <Icon className="mr-1 h-3 w-3" />
                              {c}
                            </Button>
                          )
                        })}
                      </div>
                    </div>

                    {/* 모멘텀 */}
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

              {/* 데스크탑 필터 */}
              <div className="mt-3 hidden lg:block space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-muted-foreground">
                    {filteredThemes.length.toLocaleString("ko-KR")}개 표시
                    <span className="mx-1 text-muted-foreground/40">•</span>
                    전체 {themesData.length.toLocaleString("ko-KR")}개
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 px-2 text-xs" onClick={clearFilters}>
                    필터 초기화
                  </Button>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  <Button
                    variant={selectedCategory === null ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="h-7 text-xs"
                  >
                    전체
                  </Button>
                  {themeCategories.map((cat) => {
                    const c = cat as CategoryKey
                    const Icon = categoryConfig[c].icon
                    const active = selectedCategory === c
                    return (
                      <Button
                        key={c}
                        variant={active ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(active ? null : c)}
                        className="h-7 text-xs"
                      >
                        <Icon className="mr-1 h-3 w-3" />
                        {c}
                      </Button>
                    )
                  })}
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

            {/* 리스트: 모바일에서 깨지는 ScrollArea 제거 → native overflow */}
            <CardContent className="flex-1 min-h-0 p-0">
              <div className="h-full overflow-y-auto overscroll-contain px-3 py-3 sm:px-4 sm:py-4 pb-[env(safe-area-inset-bottom)]">
                <div className="space-y-3">
                  {filteredThemes.map((theme) => {
                    const momentum = momentumConfig[theme.momentum as MomentumKey]
                    const MomentumIcon = momentum.icon
                    const category = categoryConfig[theme.category as CategoryKey]
                    const CategoryIcon = category.icon
                    const isActive = selectedTheme?.id === theme.id

                    return (
                      <button
                        key={theme.id}
                        onClick={() => handleThemeClick(theme)}
                        className={cn(
                          "w-full rounded-2xl lg:rounded-lg border bg-card p-4 text-left transition-colors",
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
                              <Badge variant="outline" className={cn(category.color, "text-xs")}>
                                <CategoryIcon className="mr-1 h-3 w-3" />
                                {theme.category}
                              </Badge>
                              <Badge className={cn(momentum.color, "text-xs")}>
                                <MomentumIcon className="mr-1 h-3 w-3" />
                                {momentum.label}
                              </Badge>
                            </div>
                            <p className="mt-2 text-sm lg:text-xs text-muted-foreground line-clamp-2 lg:line-clamp-1">
                              {theme.description}
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

                  {filteredThemes.length === 0 && (
                    <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">
                      조건에 맞는 테마가 없어요.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* RIGHT: 상세 패널 (데스크탑) */}
          <Card className="min-h-0 hidden lg:flex flex-col overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{selectedTheme ? "테마 상세" : "선택 대기"}</CardTitle>
                    {selectedTheme && (
                      <Badge className={momentumConfig[selectedTheme.momentum as MomentumKey].color}>
                        {momentumConfig[selectedTheme.momentum as MomentumKey].label}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedTheme ? "우측에서 종목까지 한 번에 확인하세요." : "왼쪽에서 테마를 선택해 주세요."}
                  </p>
                </div>

                {selectedTheme && (
                  <Button variant="ghost" size="sm" className="h-8 px-2" onClick={closeDetail}>
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>

            <CardContent className="flex-1 min-h-0 pt-0">
              {!selectedTheme ? (
                <div className="h-full rounded-xl border border-dashed bg-muted/20 flex items-center justify-center p-10 text-center">
                  <div className="space-y-2">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-medium">테마를 선택하면 여기에 상세가 표시돼요</div>
                    <div className="text-xs text-muted-foreground">종목 리스트는 스크롤로 끝까지 볼 수 있어요.</div>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col min-h-0 space-y-4">
                  {/* 상단 정보 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-lg font-semibold">{selectedTheme.name}</div>
                      <Badge variant="outline" className={categoryConfig[selectedTheme.category as CategoryKey].color}>
                        {selectedTheme.category}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        {selectedTheme.stockCount}종목
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{selectedTheme.description}</p>
                  </div>

                  {/* 통계 (더 안전하게: 2~4열) */}
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-lg font-bold">{selectedTheme.stockCount}</p>
                      <p className="text-xs text-muted-foreground">종목 수</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
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
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-lg font-bold">{selectedTheme.totalMarketCap}</p>
                      <p className="text-xs text-muted-foreground">시가총액</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <Badge variant="outline" className={categoryConfig[selectedTheme.category as CategoryKey].color}>
                        {selectedTheme.category}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">카테고리</p>
                    </div>
                  </div>

                  {/* 연관 테마 */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">연관 테마</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTheme.relatedThemes.map((rt) => (
                        <Badge key={rt} variant="outline">
                          {rt}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* 종목 목록: native scroll */}
                  <div className="flex-1 min-h-0 space-y-2">
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
                            href={`/app/stock/${stock.ticker}`}
                            className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 text-center text-xs text-muted-foreground">{idx + 1}</span>
                              <div>
                                <p className="font-medium">{stock.name}</p>
                                <p className="text-xs text-muted-foreground">{stock.ticker}</p>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-medium tabular-nums">{stock.price.toLocaleString()}원</p>
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

                              <div className="w-20 text-right">
                                <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-primary"
                                    style={{ width: `${Math.min(stock.themeWeight, 100)}%` }}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground tabular-nums">
                                  비중 {stock.themeWeight.toFixed(1)}%
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
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* MOBILE: 상세는 Dialog(바텀시트)로 */}
      <Dialog open={!isLg && !!selectedTheme} onOpenChange={(open) => (!open ? closeDetail() : null)}>
        <DialogContent
          className={cn(
            // base
            "p-0 w-full max-w-none overflow-hidden",
            // mobile bottom sheet
            "fixed left-0 right-0 bottom-0 top-auto translate-x-0 translate-y-0",
            "h-[85svh] rounded-t-2xl border-t",
            // >= sm : centered modal
            "sm:left-1/2 sm:top-1/2 sm:right-auto sm:bottom-auto sm:-translate-x-1/2 sm:-translate-y-1/2",
            "sm:h-auto sm:max-h-[85vh] sm:rounded-lg sm:max-w-2xl sm:border",
          )}
        >
          {selectedTheme && (
            <div className="flex h-full flex-col">
              {/* header */}
              <div className="shrink-0 border-b border-border bg-background/70 backdrop-blur px-4 py-4">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <span className="truncate">{selectedTheme.name}</span>
                    <Badge className={momentumConfig[selectedTheme.momentum as MomentumKey].color}>
                      {momentumConfig[selectedTheme.momentum as MomentumKey].label}
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
                <p className="mt-2 text-sm text-muted-foreground">{selectedTheme.description}</p>
              </div>

              {/* body scroll */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 pb-[env(safe-area-inset-bottom)] space-y-4">
                {/* stats: mobile 2 cols */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-lg font-bold">{selectedTheme.stockCount}</p>
                    <p className="text-xs text-muted-foreground">종목 수</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
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
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <p className="text-lg font-bold">{selectedTheme.totalMarketCap}</p>
                    <p className="text-xs text-muted-foreground">시가총액</p>
                  </div>
                  <div className="rounded-lg bg-muted/50 p-3 text-center">
                    <Badge variant="outline" className={categoryConfig[selectedTheme.category as CategoryKey].color}>
                      {selectedTheme.category}
                    </Badge>
                    <p className="mt-1 text-xs text-muted-foreground">카테고리</p>
                  </div>
                </div>

                {/* related */}
                <div className="space-y-2">
                  <p className="text-sm font-medium">연관 테마</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedTheme.relatedThemes.map((rt) => (
                      <Badge key={rt} variant="outline">
                        {rt}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* stocks */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">테마 종목</p>
                    <Badge variant="outline" className="text-xs text-muted-foreground">
                      {themeStocks.length}개
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {themeStocks.map((stock, idx) => (
                      <Link
                        key={stock.ticker}
                        href={`/app/stock/${stock.ticker}`}
                        className="flex items-center justify-between rounded-2xl border bg-card p-4 transition-colors hover:bg-muted"
                        onClick={closeDetail}
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
          )}
        </DialogContent>
      </Dialog>
    </section>
  )
}
