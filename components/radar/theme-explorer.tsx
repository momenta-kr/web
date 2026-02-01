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
  rising: { label: "상승", icon: TrendingUp, color: "text-orange-500 bg-orange-500/10" },
  stable: { label: "보합", icon: Minus, color: "text-muted-foreground bg-muted" },
  cooling: { label: "하락", icon: TrendingDown, color: "text-blue-500 bg-blue-500/10" },
  cold: { label: "급락", icon: Snowflake, color: "text-cyan-500 bg-cyan-500/10" },
} as const

type MomentumKey = keyof typeof momentumConfig

type ThemeView = {
  id: string
  name: string
  stockCount: number
  avgChangePercent: number
  momentum: MomentumKey
}

function getMomentumKey(rate: number): MomentumKey {
  if (rate >= 5) return "hot"
  if (rate >= 2) return "rising"
  if (rate <= -5) return "cold"
  if (rate <= -2) return "cooling"
  return "stable"
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
        "h-8 px-3 rounded-full text-xs transition border whitespace-nowrap",
        active
          ? "bg-primary text-primary-foreground border-primary shadow-sm"
          : "bg-background/50 hover:bg-muted/50 text-foreground border-border",
      )}
    >
      {children}
    </button>
  )
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

  const themes: ThemeView[] = useMemo(() => {
    const src = (apiThemes ?? []) as Theme[]
    return src.map((t) => {
      const rate = Number(t.averageChangeRate ?? 0)
      return {
        id: String(t.themeCode),
        name: t.themeName ?? "",
        stockCount: Number(t.stockCount ?? 0),
        avgChangePercent: rate,
        momentum: getMomentumKey(rate),
      }
    })
  }, [apiThemes])

  const totalThemes = themes.length
  const totalStocks = useMemo(() => themes.reduce((acc, t) => acc + (t.stockCount || 0), 0), [themes])

  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMomentum, setSelectedMomentum] = useState<MomentumKey | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<ThemeView | null>(null)

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

  // 선택된 테마 동기화
  useEffect(() => {
    if (!selectedTheme) return
    const next = themes.find((t) => t.id === selectedTheme.id)
    if (next && next !== selectedTheme) setSelectedTheme(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [themes])

  const clearFilters = () => {
    setSearchQuery("")
    setSelectedMomentum(null)
  }

  const closeDetail = () => setSelectedTheme(null)
  const handleThemeClick = (theme: ThemeView) => setSelectedTheme(theme)

  const headerCountText = useMemo(() => {
    const shown = filteredThemes.length
    return `${shown.toLocaleString("ko-KR")} / ${totalThemes.toLocaleString("ko-KR")}개`
  }, [filteredThemes.length, totalThemes])

  return (
    <section
      className={cn(
        "w-full",
        "bg-[radial-gradient(60%_40%_at_10%_0%,rgba(59,130,246,0.10),transparent_60%),radial-gradient(60%_40%_at_90%_0%,rgba(239,68,68,0.10),transparent_60%)]",
      )}
      style={{ height: "calc(100svh - var(--app-header-h, 64px))" }}
    >
      <div className="h-full flex flex-col min-h-0">
        {/* ===== Sticky Header (full-width) ===== */}
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

                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[11px]",
                          isError ? "text-red-500 border-red-500/30" : "text-muted-foreground",
                        )}
                      >
                        {isLoading
                          ? "API 로딩중..."
                          : isError
                            ? "API 에러"
                            : `총 ${totalStocks.toLocaleString("ko-KR")}종목`}
                      </Badge>
                    </div>

                    {isError && (
                      <div className="mt-1 text-[11px] text-red-500/90 line-clamp-2">
                        {(error as any)?.message ?? "테마 API 호출 실패"}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button variant="secondary" size="sm" className="h-9" onClick={clearFilters}>
                  초기화
                </Button>
              </div>
            </div>

            {/* HOT strip */}
            <div className="mt-3">
              <div className="flex items-center gap-2 mb-2">
                <Flame className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">HOT</span>
                <span className="text-xs text-muted-foreground hidden sm:inline">클릭해서 상세 보기</span>
              </div>

              <div className="flex gap-2 overflow-x-auto pb-2">
                {hotThemes.length > 0 ? (
                  hotThemes.map((theme) => (
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
                  ))
                ) : (
                  <div className="text-xs text-muted-foreground py-2">
                    {!isLoading ? "HOT 테마가 없습니다." : "불러오는 중…"}
                  </div>
                )}
              </div>
            </div>

            {/* Search + (desktop) momentum pills */}
            <div className="mt-3 flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="테마명 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-10 pl-9 pr-10 rounded-2xl bg-background/50"
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

              {/* Filters: mobile collapsible */}
              <div className="lg:hidden">
                <details className="rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-3">
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
                        <Pill active={selectedMomentum === null} onClick={() => setSelectedMomentum(null)}>
                          전체
                        </Pill>
                        {(Object.keys(momentumConfig) as MomentumKey[]).map((key) => {
                          const config = momentumConfig[key]
                          const Icon = config.icon
                          const active = selectedMomentum === key
                          return (
                            <Pill key={key} active={active} onClick={() => setSelectedMomentum(active ? null : key)}>
                              <Icon className="mr-1 h-3.5 w-3.5" />
                              {config.label}
                            </Pill>
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

              {/* Filters: desktop always visible */}
              <div className="hidden lg:block rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-3">
                <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                  <SlidersHorizontal className="h-4 w-4" />
                  모멘텀 필터
                  <span className="ml-auto">
                    {filteredThemes.length.toLocaleString("ko-KR")}개 표시
                    <span className="mx-1 text-muted-foreground/40">•</span>
                    전체 {themes.length.toLocaleString("ko-KR")}개
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <Pill active={selectedMomentum === null} onClick={() => setSelectedMomentum(null)}>
                    전체
                  </Pill>
                  {(Object.keys(momentumConfig) as MomentumKey[]).map((key) => {
                    const config = momentumConfig[key]
                    const Icon = config.icon
                    const active = selectedMomentum === key
                    return (
                      <Pill key={key} active={active} onClick={() => setSelectedMomentum(active ? null : key)}>
                        <Icon className="mr-1 h-3.5 w-3.5" />
                        {config.label}
                      </Pill>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== Main layout (full height) ===== */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-[420px_1fr]">
          {/* LEFT: list (scroll) */}
          <div className="min-h-0 overflow-y-auto overscroll-contain lg:border-r border-border/70 bg-background/15">
            <div className="p-4 space-y-3">
              {filteredThemes.map((theme) => {
                const momentum = momentumConfig[theme.momentum]
                const MomentumIcon = momentum.icon
                const isActive = selectedTheme?.id === theme.id

                return (
                  <button
                    key={theme.id}
                    onClick={() => handleThemeClick(theme)}
                    className={cn(
                      "w-full rounded-2xl border border-border/70 p-4 text-left transition",
                      "bg-background/50 backdrop-blur hover:bg-muted/40",
                      isActive && "border-foreground/25 ring-1 ring-foreground/15",
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

                        <p className="mt-2 text-sm lg:text-xs text-muted-foreground line-clamp-2 lg:line-clamp-1">
                          실데이터 기반 (추가 상세는 API 확장 후 표시)
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
                <div className="rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-10 text-center text-sm text-muted-foreground">
                  조건에 맞는 테마가 없어요.
                </div>
              )}

              {isLoading && themes.length === 0 && (
                <div className="rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-10 text-center text-sm text-muted-foreground">
                  테마 데이터를 불러오는 중…
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: detail (desktop only, scroll) */}
          <div className="hidden lg:flex min-h-0 flex-col bg-background/10">
            {/* local header */}
            <div className="shrink-0 border-b border-border/70 bg-background/45 backdrop-blur px-4 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-semibold">{selectedTheme ? "테마 상세" : "선택 대기"}</h3>
                    {selectedTheme && (
                      <Badge className={momentumConfig[selectedTheme.momentum].color}>
                        {momentumConfig[selectedTheme.momentum].label}
                      </Badge>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {selectedTheme ? "우측에서 정보/확장 포인트를 확인하세요." : "왼쪽에서 테마를 선택해 주세요."}
                  </p>
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
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4">
              {!selectedTheme ? (
                <div className="h-full rounded-2xl border border-dashed border-border/70 bg-background/40 backdrop-blur flex items-center justify-center p-10 text-center">
                  <div className="space-y-2">
                    <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="text-sm font-medium">테마를 선택하면 여기에 상세가 표시돼요</div>
                    <div className="text-xs text-muted-foreground">추가 상세는 API 확장 후 붙이면 됩니다.</div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 상단 정보 */}
                  <div className="rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="text-lg font-semibold">{selectedTheme.name}</div>
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        코드 {selectedTheme.id}
                      </Badge>
                      <Badge variant="outline" className="text-xs text-muted-foreground">
                        {selectedTheme.stockCount}종목
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      현재 API로는 테마명/평균등락률/종목수만 제공됩니다.
                    </p>
                  </div>

                  {/* 통계 */}
                  <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-4 text-center">
                      <p className="text-lg font-bold">{selectedTheme.stockCount}</p>
                      <p className="text-xs text-muted-foreground">종목 수</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-4 text-center">
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
                    <div className="rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-4 text-center">
                      <p className="text-lg font-bold">-</p>
                      <p className="text-xs text-muted-foreground">시가총액 (API 필요)</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-4 text-center">
                      <p className="text-lg font-bold">-</p>
                      <p className="text-xs text-muted-foreground">연관 테마 (API 필요)</p>
                    </div>
                  </div>

                  {/* 확장 안내 */}
                  <div className="rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-4 text-sm text-muted-foreground">
                    테마 종목 리스트를 표시하려면 예:{" "}
                    <span className="font-mono">/stocks/v1/themes/{selectedTheme.id}/stocks</span> 같은 엔드포인트가 추가로 필요해요.
                  </div>

                  {/* 이동 링크 */}
                  <Link
                    href={`/themes/${selectedTheme.id}`}
                    className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-4 transition-colors hover:bg-muted/40"
                  >
                    <div className="min-w-0">
                      <p className="font-semibold truncate">테마 상세 페이지</p>
                      <p className="text-xs text-muted-foreground">/themes/{selectedTheme.id}</p>
                    </div>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* MOBILE: 상세는 Dialog(바텀시트) */}
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
                {/* header */}
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
                  <p className="mt-2 text-sm text-muted-foreground">
                    현재 API로는 테마명/평균등락률/종목수만 제공됩니다.
                  </p>
                </div>

                {/* body */}
                <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 py-4 pb-[env(safe-area-inset-bottom)] space-y-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-4 text-center">
                      <p className="text-lg font-bold">{selectedTheme.stockCount}</p>
                      <p className="text-xs text-muted-foreground">종목 수</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-4 text-center">
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
                    <div className="rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-4 text-center">
                      <p className="text-lg font-bold">-</p>
                      <p className="text-xs text-muted-foreground">시총 (API 필요)</p>
                    </div>
                    <div className="rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-4 text-center">
                      <p className="text-lg font-bold">-</p>
                      <p className="text-xs text-muted-foreground">연관 (API 필요)</p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-4 text-sm text-muted-foreground">
                    테마 종목 리스트는 API가 추가로 필요합니다.
                    <div className="mt-2">
                      예: <span className="font-mono">/stocks/v1/themes/{selectedTheme.id}/stocks</span>
                    </div>
                  </div>

                  <Link
                    href={`/themes/${selectedTheme.id}`}
                    className="flex items-center justify-between rounded-2xl border border-border/70 bg-background/50 backdrop-blur p-4 transition-colors hover:bg-muted/40"
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
      </div>
    </section>
  )
}
