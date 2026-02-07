"use client"

import {useEffect, useMemo, useRef, useState} from "react"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {Button} from "@/components/ui/button"
import {Tabs, TabsList, TabsTrigger} from "@/components/ui/tabs"
import {cn} from "@/lib/utils"
import {Sparkles, ExternalLink, RefreshCw, ChevronDown, TrendingUp, TrendingDown, Minus, Info} from "lucide-react"
import {useAiNewsOverview} from "@/domain/stock/queries/useAiNewsOverview"
import {fetchAiNewsFeed} from "@/domain/stock/api/fetch-ai-news-feed"

type SentimentFilter = "all" | "positive" | "negative" | "neutral"
type RangePreset = "7d" | "30d" | "3m"

interface NewsAnalysisProps {
  stockCode: string
  stockName?: string
  className?: string
  comingSoon?: boolean

  /** 옵션: 기본 프리셋 */
  defaultPreset?: RangePreset
  /** 옵션: 무한스크롤 자동 로드 */
  enableInfinite?: boolean
  /** 옵션: 페이지 사이즈 */
  pageSize?: number
}

const UP_BADGE = "bg-red-500/10 text-red-600 border-red-500/30 dark:bg-red-500/15 dark:text-red-400"
const DOWN_BADGE = "bg-blue-500/10 text-blue-600 border-blue-500/30 dark:bg-blue-500/15 dark:text-blue-400"
const NEU_BADGE = "bg-muted text-muted-foreground border-border"

function normalizeSentiment(v: unknown): "positive" | "negative" | "neutral" | "unknown" {
  const s = String(v ?? "").toLowerCase()
  if (s === "positive" || s === "pos" || s === "bullish") return "positive"
  if (s === "negative" || s === "neg" || s === "bearish") return "negative"
  if (s === "neutral" || s === "neu") return "neutral"
  return "unknown"
}

function formatRelativeTime(iso: string) {
  const t = Date.parse(iso)
  if (!Number.isFinite(t)) return iso
  const diff = Date.now() - t
  const sec = Math.floor(diff / 1000)
  if (sec < 60) return "방금 전"
  const min = Math.floor(sec / 60)
  if (min < 60) return `${min}분 전`
  const hr = Math.floor(min / 60)
  if (hr < 24) return `${hr}시간 전`
  const day = Math.floor(hr / 24)
  if (day < 7) return `${day}일 전`
  return new Date(t).toLocaleDateString("ko-KR")
}

function badgeBySentiment(sentiment: ReturnType<typeof normalizeSentiment>) {
  if (sentiment === "positive") return {text: "호재", cls: UP_BADGE, dot: "bg-red-500"}
  if (sentiment === "negative") return {text: "악재", cls: DOWN_BADGE, dot: "bg-blue-500"}
  if (sentiment === "neutral") return {text: "중립", cls: NEU_BADGE, dot: "bg-muted-foreground/50"}
  return {text: "기타", cls: NEU_BADGE, dot: "bg-muted-foreground/50"}
}

function presetToRange(preset: RangePreset) {
  const to = new Date()
  const from = new Date(to)
  if (preset === "7d") from.setDate(from.getDate() - 7)
  if (preset === "30d") from.setDate(from.getDate() - 30)
  if (preset === "3m") from.setMonth(from.getMonth() - 3)
  return {fromIso: from.toISOString(), toIso: to.toISOString()}
}

function countFromInsights(insights: any, key: string) {
  const found = insights?.sentiments?.find?.((x: any) => String(x?.key).toLowerCase() === key)
  return typeof found?.count === "number" ? found.count : 0
}

function dedupeById<T extends { id: string }>(arr: T[]) {
  const map = new Map<string, T>()
  for (const x of arr) map.set(x.id, x)
  return Array.from(map.values())
}

function Chip({
                active,
                label,
                count,
                onClick,
              }: {
  active: boolean
  label: string
  count?: number
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition",
        active
          ? "bg-foreground text-background border-foreground"
          : "bg-background/40 text-muted-foreground border-border hover:bg-muted/40"
      )}
      aria-pressed={active}
    >
      <span className="truncate max-w-[140px]">{label}</span>
      {typeof count === "number" ? (
        <span className={cn("tabular-nums", active ? "opacity-90" : "opacity-70")}>{count}</span>
      ) : null}
    </button>
  )
}

export function NewsAnalysis({
                               stockCode,
                               stockName,
                               className,
                               comingSoon = false,
                               defaultPreset = "7d",
                               enableInfinite = true,
                               pageSize = 20,
                             }: NewsAnalysisProps) {
  // ✅ 기간 프리셋
  const [preset, setPreset] = useState<RangePreset>(defaultPreset)
  const range = useMemo(() => presetToRange(preset), [preset])

  // ✅ 필터(서버 파라미터로 반영)
  const [sentiment, setSentiment] = useState<SentimentFilter>("all")
  const [activeCategory, setActiveCategory] = useState<string | null>(null)
  const [activeDomain, setActiveDomain] = useState<string | null>(null)

  // ✅ feed pagination state
  const [feedItems, setFeedItems] = useState<any[]>([])
  const [cursor, setCursor] = useState<string | null>(null)
  const [isLoadingMore, setIsLoadingMore] = useState(false)

  const sentimentParam = sentiment === "all" ? null : sentiment

  const {data, isLoading, isError, refetch, isFetching} = useAiNewsOverview(stockCode, {
    fromIso: range.fromIso,
    toIso: range.toIso,
    sentiment: sentimentParam,
    category: activeCategory,
    domain: activeDomain,
    size: pageSize,
  })

  // ✅ overview 데이터 들어오면 feed 초기화
  useEffect(() => {
    if (!data?.feed) return
    setFeedItems(data.feed.items ?? [])
    setCursor(data.feed.nextCursor ?? null)
  }, [data?.feed?.items, data?.feed?.nextCursor])

  // ✅ 필터/기간이 바뀌면 로딩More 종료
  useEffect(() => {
    setIsLoadingMore(false)
  }, [preset, sentiment, activeCategory, activeDomain])

  const insights = data?.insights

  // ✅ 카운트(인사이트 우선, 없으면 feed fallback)
  const counts = useMemo(() => {
    const pos = countFromInsights(insights, "positive")
    const neg = countFromInsights(insights, "negative")
    const neu = countFromInsights(insights, "neutral")

    if (pos + neg + neu === 0 && feedItems.length > 0) {
      const acc = {positive: 0, negative: 0, neutral: 0, unknown: 0}
      for (const it of feedItems) acc[normalizeSentiment(it.sentiment)]++
      return {total: feedItems.length, positive: acc.positive, negative: acc.negative, neutral: acc.neutral}
    }

    return {
      total: typeof insights?.total === "number" ? insights.total : feedItems.length,
      positive: pos,
      negative: neg,
      neutral: neu,
    }
  }, [insights, feedItems])

  // ✅ (선택) domain 필터가 백엔드에서 안 먹을 경우 안전망
  const visibleItems = useMemo(() => {
    let arr = feedItems
    if (activeDomain) arr = arr.filter((x) => String(x.domain ?? "") === activeDomain)
    return arr
  }, [feedItems, activeDomain])

  // ✅ 더보기
  const loadMore = async () => {
    if (!cursor || isLoadingMore) return
    setIsLoadingMore(true)
    try {
      const next = await fetchAiNewsFeed(stockCode, {
        fromIso: range.fromIso,
        toIso: range.toIso,
        sentiment: sentimentParam,
        category: activeCategory,
        size: pageSize,
        cursor,
      })

      const merged = dedupeById([...(feedItems as any[]), ...((next?.items as any[]) ?? [])])
      setFeedItems(merged)
      setCursor(next?.nextCursor ?? null)
    } finally {
      setIsLoadingMore(false)
    }
  }

  // ✅ 무한스크롤 sentinel
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  useEffect(() => {
    if (!enableInfinite) return
    if (!sentinelRef.current) return

    const el = sentinelRef.current
    const obs = new IntersectionObserver(
      (entries) => {
        const e = entries[0]
        if (e?.isIntersecting) {
          if (cursor) loadMore()
        }
      },
      {root: null, rootMargin: "400px 0px", threshold: 0}
    )

    obs.observe(el)
    return () => obs.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enableInfinite, cursor, isLoadingMore, preset, sentiment, activeCategory, activeDomain])

  const periodText = useMemo(() => {
    const from = new Date(range.fromIso)
    const to = new Date(range.toIso)
    const f = from.toLocaleDateString("ko-KR", {month: "2-digit", day: "2-digit"})
    const t = to.toLocaleDateString("ko-KR", {month: "2-digit", day: "2-digit"})
    return `${f} ~ ${t}`
  }, [range.fromIso, range.toIso])

  // chips
  const topCategories = insights?.topCategories ?? []
  const topDomains = insights?.topDomains ?? []

  return (
    <Card
      className={cn("relative overflow-hidden border-border", "bg-gradient-to-b from-background to-card", className)}
      aria-disabled={comingSoon}
    >
      {comingSoon && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/85 backdrop-blur-sm">
          <div className="text-center px-6">
            <Badge className="gap-1.5 rounded-full bg-primary/10 text-primary border border-primary/30">
              <Sparkles className="h-3.5 w-3.5"/>
              곧 출시
            </Badge>
            <p className="mt-2 text-sm text-muted-foreground">AI 뉴스 분석 기능은 현재 준비 중입니다.</p>
          </div>
        </div>
      )}

      <CardHeader className="pb-4">
        {/* Title row */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <div
                className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-chart-4/10 border border-chart-4/20">
                <Sparkles className="h-5 w-5 text-chart-4"/>
              </div>
              <div className="min-w-0">
                <CardTitle className="text-[15px] font-semibold truncate">
                  AI 뉴스 분석{stockName ? ` · ${stockName}` : ""}
                </CardTitle>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="truncate">safeBrief 기반 요약</span>
                  <span className="text-muted-foreground/50">•</span>
                  <span className="shrink-0">{periodText}</span>
                </div>
              </div>
            </div>
          </div>

          {/* actions */}
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className={cn("h-8 px-2.5 gap-1.5", (isFetching || isLoadingMore) && "opacity-70")}
            >
              <RefreshCw className={cn("h-4 w-4", (isFetching || isLoadingMore) && "animate-spin")}/>
              <span className="text-xs">새로고침</span>
            </Button>
          </div>
        </div>

        {/* ✅ 기간 프리셋 */}
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-1 rounded-xl bg-muted/40 p-1">
            <button
              className={cn(
                "h-8 px-3 rounded-lg text-xs transition",
                preset === "7d" ? "bg-background shadow-sm" : "text-muted-foreground hover:bg-muted/60"
              )}
              onClick={() => setPreset("7d")}
              type="button"
            >
              7일
            </button>
            <button
              className={cn(
                "h-8 px-3 rounded-lg text-xs transition",
                preset === "30d" ? "bg-background shadow-sm" : "text-muted-foreground hover:bg-muted/60"
              )}
              onClick={() => setPreset("30d")}
              type="button"
            >
              30일
            </button>
            <button
              className={cn(
                "h-8 px-3 rounded-lg text-xs transition",
                preset === "3m" ? "bg-background shadow-sm" : "text-muted-foreground hover:bg-muted/60"
              )}
              onClick={() => setPreset("3m")}
              type="button"
            >
              3개월
            </button>
          </div>

          {/* 핵심 카운트 */}
          <div className="flex items-center gap-1.5">
            <Badge variant="outline" className={cn("text-xs", UP_BADGE)}>
              호재 {counts.positive}
            </Badge>
            <Badge variant="outline" className={cn("text-xs", DOWN_BADGE)}>
              악재 {counts.negative}
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className={cn("space-y-4", comingSoon && "opacity-40")}>
        {/* ✅ Sentiment Tabs */}
        <Tabs value={sentiment} onValueChange={(v) => setSentiment(v as SentimentFilter)}>
          <TabsList className="w-full bg-muted/40 p-1 rounded-xl">
            <div className="grid w-full grid-cols-4 gap-1">
              <TabsTrigger
                value="all"
                className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                전체
              </TabsTrigger>
              <TabsTrigger
                value="positive"
                className="rounded-lg text-xs data-[state=active]:bg-red-500/12 data-[state=active]:text-red-500"
              >
                호재
              </TabsTrigger>
              <TabsTrigger
                value="negative"
                className="rounded-lg text-xs data-[state=active]:bg-blue-500/12 data-[state=active]:text-blue-500"
              >
                악재
              </TabsTrigger>
              <TabsTrigger
                value="neutral"
                className="rounded-lg text-xs data-[state=active]:bg-background data-[state=active]:shadow-sm"
              >
                중립
              </TabsTrigger>
            </div>
          </TabsList>
        </Tabs>

        {/* ✅ Chips (insights 기반) */}
        {!isLoading && !isError ? (
          <div className="space-y-2">
            {/* category chips */}
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-foreground">카테고리</div>
              {activeCategory ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => setActiveCategory(null)}
                >
                  초기화
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip active={activeCategory === null} label="전체" onClick={() => setActiveCategory(null)}/>
              {topCategories.slice(0, 12).map((c: any) => (
                <Chip
                  key={c.key}
                  active={activeCategory === c.key}
                  label={c.key}
                  count={c.count}
                  onClick={() => setActiveCategory(activeCategory === c.key ? null : c.key)}
                />
              ))}
            </div>

            {/* domain chips */}
            <div className="mt-2 flex items-center justify-between">
              <div className="text-xs font-semibold text-foreground">도메인</div>
              {activeDomain ? (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground"
                  onClick={() => setActiveDomain(null)}
                >
                  초기화
                </Button>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <Chip active={activeDomain === null} label="전체" onClick={() => setActiveDomain(null)}/>
              {topDomains.slice(0, 12).map((d: any) => (
                <Chip
                  key={d.key}
                  active={activeDomain === d.key}
                  label={d.key}
                  count={d.count}
                  onClick={() => setActiveDomain(activeDomain === d.key ? null : d.key)}
                />
              ))}
            </div>
          </div>
        ) : null}

        {/* ✅ States */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({length: 6}).map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-background/50 p-4">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full bg-muted"/>
                  <div className="h-3 w-2/3 bg-muted rounded"/>
                </div>
                <div className="mt-3 h-3 w-full bg-muted rounded"/>
                <div className="mt-2 h-3 w-5/6 bg-muted rounded"/>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-border bg-background/40 p-6 text-center">
            <p className="text-sm text-destructive">뉴스를 불러오지 못했어요.</p>
            <p className="mt-1 text-xs text-muted-foreground">잠시 후 다시 시도하거나 새로고침을 눌러주세요.</p>
            <Button variant="outline" size="sm" className="mt-3 gap-1" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4"/>
              다시 시도
            </Button>
          </div>
        ) : visibleItems.length === 0 ? (
          <div className="rounded-xl border border-border bg-background/40 p-6 text-center">
            <p className="text-sm text-muted-foreground">해당 조건의 뉴스가 없어요.</p>
          </div>
        ) : (
          // ✅ 여기부터: 사용자가 준 “최종 map 블록” 그대로 반영
          <div className="space-y-2">
            {visibleItems.map((it: any) => {
              const s = normalizeSentiment(it.sentiment)
              const meta = badgeBySentiment(s)

              const sourceText = it.source || it.domain || "source"
              const timeText = it.publishedAt ? formatRelativeTime(it.publishedAt) : ""

              return (
                <div
                  key={it.id}
                  className={cn(
                    "group rounded-xl border border-border bg-background/50 p-4",
                    "hover:bg-muted/30 hover:border-border/80 transition-colors"
                  )}
                >
                  <div className="flex items-start gap-3">
                    {/* sentiment dot */}
                    <span className={cn("mt-2 h-2 w-2 rounded-full shrink-0", meta.dot)}/>

                    <div className="min-w-0 flex-1">
                      {/* title row */}
                      <p className="text-sm font-semibold text-foreground leading-snug line-clamp-2">
                        {it.title}
                      </p>

                      {/* meta row: left(배지) / right(카테고리·소스·시간) */}
                      <div className="mt-2 flex items-center justify-between gap-2">
                        {/* left */}
                        <div className="flex items-center gap-2 min-w-0">
                          <Badge variant="outline" className={cn("text-[11px] py-0.5", meta.cls)}>
                            {meta.text}
                          </Badge>
                        </div>

                        {/* right */}
                        <div className="flex items-center gap-2 text-[11px] text-muted-foreground shrink-0">
                          {it.category ? (
                            <span className="max-w-[140px] truncate">{it.category}</span>
                          ) : null}

                          <span className="text-muted-foreground/60">•</span>

                          <span className="max-w-[140px] truncate">{sourceText}</span>

                          {timeText ? (
                            <>
                              <span className="text-muted-foreground/60">•</span>
                              <span className="tabular-nums">{timeText}</span>
                            </>
                          ) : null}
                        </div>
                      </div>

                      {/* AI summary + 원문 CTA */}
                      <div className="mt-3 rounded-xl border border-border/60 bg-background/40 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-chart-4"/>
                            <span className="text-xs font-semibold text-foreground">AI 요약</span>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-7 px-2 rounded-lg text-[11px] gap-1",
                              "text-primary hover:bg-primary/10",
                              "opacity-80 group-hover:opacity-100 transition"
                            )}
                            asChild
                          >
                            <a href={it.url} target="_blank" rel="noopener noreferrer">
                              원문 보기
                              <ExternalLink className="h-3 w-3"/>
                            </a>
                          </Button>
                        </div>

                        <p className="mt-2 text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {it.safeBrief || it.summary || "요약이 없습니다."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {/* ✅ Infinite sentinel */}
            {enableInfinite ? <div ref={sentinelRef} className="h-1"/> : null}

            {/* ✅ 더보기 버튼 */}
            <div className="pt-2">
              {cursor ? (
                <Button
                  variant="outline"
                  className="w-full h-10 rounded-xl gap-2"
                  onClick={loadMore}
                  disabled={isLoadingMore}
                >
                  {isLoadingMore ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin"/>
                      불러오는 중…
                    </>
                  ) : (
                    <>
                      더보기
                      <ChevronDown className="h-4 w-4"/>
                    </>
                  )}
                </Button>
              ) : (
                <div className="text-center text-xs text-muted-foreground py-4">마지막 페이지입니다.</div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
