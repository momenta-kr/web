"use client"

import { useEffect, useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Star, TrendingUp, TrendingDown, Bell, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { useAnomalies, useMarketState } from "@/lib/store"

import { NewsAnalysis } from "@/components/stock/news-analysis"
import { InvestorTrends } from "@/components/stock/investor-trends"
import LightweightStockChart from "@/components/stock/light-weight-stock-chart"

// ✅ 추가 (없으면 아래 2~4번 파일도 같이 추가)
import { AIInsight } from "@/components/stock/ai-insight"
import { NewsCluster } from "@/components/stock/news-cluster"
import { RealTimeAlerts } from "@/components/stock/realtime-alerts"

import { useDomesticStockPeriodPrices } from "@/domain/stock/queries/useDomesticStockPeriodPrices"
import { fetchDomesticStockPeriodPrices } from "@/domain/stock/api/fetch-domestic-stock-period-prices"

type Period = "D" | "W" | "M" | "Y"

type CandlePoint = {
  date: string // "20251226"
  open: number
  high: number
  low: number
  close: number
  volume: number
  ma5?: number | null
  ma20?: number | null
  ma60?: number | null
  ma120?: number | null
}

const MA5_COLOR = "#F59E0B"
const MA20_COLOR = "#22C55E"
const MA60_COLOR = "#A855F7"
const MA120_COLOR = "#06B6D4"

function formatNumber(n: number | null | undefined, digits = 0) {
  if (n == null || !Number.isFinite(n)) return "-"
  return n.toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

function formatCompact(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "-"
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return n.toLocaleString("ko-KR")
}

function formatKoreanMoney(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "-"
  const abs = Math.abs(n)
  const JO = 1_000_000_000_000
  const EOK = 100_000_000
  const MAN = 10_000
  if (abs >= JO) return `${(n / JO).toFixed(2)}조`
  if (abs >= EOK) return `${(n / EOK).toFixed(1)}억`
  if (abs >= MAN) return `${(n / MAN).toFixed(1)}만`
  return n.toLocaleString("ko-KR")
}

function calcTodayPosition(current: number | null, low: number | null, high: number | null) {
  if (current == null || low == null || high == null) return null
  if (!Number.isFinite(current) || !Number.isFinite(low) || !Number.isFinite(high)) return null
  if (high <= low) return null
  const p = ((current - low) / (high - low)) * 100
  return Math.max(0, Math.min(100, p))
}

const toNum = (v: unknown) => {
  if (v == null) return 0
  if (typeof v === "number") return Number.isFinite(v) ? v : 0
  const n = Number(String(v).replaceAll(",", "").trim())
  return Number.isFinite(n) ? n : 0
}

function rollingMA(values: number[], window: number) {
  const out: (number | null)[] = Array(values.length).fill(null)
  if (window <= 1) return values.map((v) => v)
  let sum = 0
  for (let i = 0; i < values.length; i++) {
    sum += values[i]
    if (i >= window) sum -= values[i - window]
    if (i >= window - 1) out[i] = sum / window
  }
  return out
}

function MovingAverageLegend() {
  const items = [
    { key: "ma5", label: "MA5", color: MA5_COLOR },
    { key: "ma20", label: "MA20", color: MA20_COLOR },
    { key: "ma60", label: "MA60", color: MA60_COLOR },
    { key: "ma120", label: "MA120", color: MA120_COLOR },
  ]
  return (
    <div className="flex items-center gap-2 rounded-lg border border-border bg-background/80 px-2 py-1 text-[11px] text-muted-foreground backdrop-blur">
      {items.map((it) => (
        <div key={it.key} className="flex items-center gap-1">
          <span className="inline-block h-2 w-2 rounded-sm" style={{ background: it.color }} />
          <span className="font-medium">{it.label}</span>
        </div>
      ))}
    </div>
  )
}

/** API 응답의 날짜 필드가 businessDate / stck_bsop_date 등으로 오므로 안전하게 뽑기 */
function pickYmd(p: any): string {
  return String(p?.businessDate ?? p?.stck_bsop_date ?? p?.date ?? "")
}

function mergePricesDesc(prev: any[], next: any[]) {
  const map = new Map<string, any>()
  for (const it of prev ?? []) {
    const d = pickYmd(it)
    if (d && d.length === 8) map.set(d, it)
  }
  for (const it of next ?? []) {
    const d = pickYmd(it)
    if (d && d.length === 8) map.set(d, it)
  }
  // 최신 -> 과거(내림차순)
  return Array.from(map.values()).sort((a, b) => pickYmd(b).localeCompare(pickYmd(a)))
}

/** ✅ 옵션: 같은 섹터 종목(피어) - API 있으면 붙고, 없으면 그냥 안 보임 */
type PeerStock = { symbol: string; name: string; changeRate?: number; changePercent?: number; market?: string }
function useSectorPeers(symbol: string, sector?: string) {
  const [peers, setPeers] = useState<PeerStock[]>([])
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        // 👇 네 백엔드에 맞게 엔드포인트만 바꾸면 됨
        // 기대 포맷 예: { items: [{symbol,name,changeRate}] }
        const res = await fetch(`/api/stocks/v1/sector/peers?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" })
        if (!res.ok) return
        const json = await res.json()
        const items: any[] = Array.isArray(json?.items) ? json.items : Array.isArray(json) ? json : []
        const mapped = items
          .map((x) => ({
            symbol: String(x.symbol ?? x.ticker ?? ""),
            name: String(x.name ?? x.stockName ?? ""),
            changeRate: typeof x.changeRate === "number" ? x.changeRate : typeof x.changePercent === "number" ? x.changePercent : undefined,
            market: x.market ? String(x.market) : undefined,
          }))
          .filter((x) => x.symbol && x.name && x.symbol !== symbol)
          .slice(0, 4)

        if (!cancelled) setPeers(mapped)
      } catch {
        // endpoint 없으면 조용히 스킵
      }
    }
    // sector가 없다면 굳이 호출 안 해도 되지만, symbol 기준 피어는 가능하니 호출 유지
    run()
    return () => {
      cancelled = true
    }
  }, [symbol, sector])
  return peers
}

export default function StockDetailPage() {
  const params = useParams()
  const symbol = params.symbol as string

  const { market } = useMarketState()
  const { anomalies } = useAnomalies(market)

  const [isFavorite, setIsFavorite] = useState(false)
  const [chartPeriod, setChartPeriod] = useState<Period>("D")
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [mergedPrices, setMergedPrices] = useState<any[]>([])
  const [mergedSnapshot, setMergedSnapshot] = useState<any>(null)

  const { data, isLoading, isError, error, dataUpdatedAt, refetch } = useDomesticStockPeriodPrices({
    symbol,
    periodType: chartPeriod,
  })

  const snapshot = (data as any)?.snapshot ?? null
  const prices = (data as any)?.prices ?? []

  useEffect(() => {
    if (!data) return
    setMergedSnapshot(snapshot)
    setMergedPrices(prices)
  }, [symbol, chartPeriod, dataUpdatedAt]) // 새 응답 반영

  /** ✅ from은 "시작일(YYYY-MM-dd)"로 백엔드에 보냄 (LocalDate.parse 맞춤) */
  const handleRequestMore = async (fromIso: string, toIso: string) => {
    if (isFetchingMore) return
    if (!fromIso || fromIso.length !== 10 || !toIso || toIso.length !== 10) {
      console.warn("[handleRequestMore] invalid range", { fromIso, toIso })
      return
    }

    try {
      setIsFetchingMore(true)

      const more = await fetchDomesticStockPeriodPrices({
        symbol,
        periodType: chartPeriod,
        from: fromIso,
        to: toIso,
      } as any)

      const moreSnapshot = (more as any)?.snapshot ?? null
      const morePrices = (more as any)?.prices ?? []

      setMergedSnapshot((prev) => prev ?? moreSnapshot)
      setMergedPrices((prev) => mergePricesDesc(prev, morePrices))
    } finally {
      setIsFetchingMore(false)
    }
  }

  const stock = useMemo(() => {
    const s = mergedSnapshot ?? snapshot
    return {
      name: s?.stockName ?? "종목",
      ticker: s?.shortStockCode ?? symbol,
      market: s?.marketName ?? "KRX",
      sector: s?.sectorName ?? "-",
      price: s?.currentPrice ?? 0,
      change: s?.changeFromPrevDay ?? 0,
      changePercent: s?.changeRate ?? 0,
      open: s?.openPrice ?? 0,
      high: s?.highPrice ?? 0,
      low: s?.lowPrice ?? 0,
      prevClose: s?.prevClosePrice ?? 0,
      marketCap: s?.marketCap != null ? formatKoreanMoney(s.marketCap) : "-",
      volume: s?.accumulatedVolume ?? 0,
    }
  }, [mergedSnapshot, snapshot, symbol])

  const priceHistory = useMemo<CandlePoint[]>(() => {
    const src = mergedPrices ?? []
    if (!src.length) return []

    const asc = [...src].reverse()

    const mapped: CandlePoint[] = asc
      .map((p: any) => {
        const d = pickYmd(p)
        if (!d || d.length !== 8) return null
        return {
          date: d,
          open: toNum(p.openPrice ?? p.stck_oprc),
          high: toNum(p.highPrice ?? p.stck_hgpr),
          low: toNum(p.lowPrice ?? p.stck_lwpr),
          close: toNum(p.closePrice ?? p.stck_clpr),
          volume: toNum(p.accumulatedVolume ?? p.acml_vol),
        } as CandlePoint
      })
      .filter(Boolean) as CandlePoint[]

    // 누적 거래량 -> 봉별 거래량
    for (let i = 1; i < mapped.length; i++) {
      const prev = mapped[i - 1].volume
      const cur = mapped[i].volume
      const diff = cur - prev
      mapped[i].volume = diff >= 0 ? diff : cur
    }

    // date 중복 제거 + asc 정렬
    const m = new Map<string, CandlePoint>()
    for (const row of mapped) m.set(row.date, row)
    const unique = Array.from(m.values()).sort((a, b) => a.date.localeCompare(b.date))

    // MA 계산
    const closes = unique.map((d) => d.close)
    const ma5 = rollingMA(closes, 5)
    const ma20 = rollingMA(closes, 20)
    const ma60 = rollingMA(closes, 60)
    const ma120 = rollingMA(closes, 120)

    return unique.map((d, i) => ({ ...d, ma5: ma5[i], ma20: ma20[i], ma60: ma60[i], ma120: ma120[i] }))
  }, [mergedPrices])

  const stockAnomalies = useMemo(
    () => (anomalies ?? []).filter((a) => a.ticker === symbol).slice(0, 5),
    [anomalies, symbol],
  )

  const isPositive = ((mergedSnapshot ?? snapshot)?.changeRate ?? 0) >= 0
  const todayPos = calcTodayPosition(
    (mergedSnapshot ?? snapshot)?.currentPrice ?? null,
    (mergedSnapshot ?? snapshot)?.lowPrice ?? null,
    (mergedSnapshot ?? snapshot)?.highPrice ?? null,
  )

  const s0 = mergedSnapshot ?? snapshot
  const spread = s0?.askPrice != null && s0?.bidPrice != null ? s0.askPrice - s0.bidPrice : null
  const spreadPct = spread != null && s0?.currentPrice > 0 ? (spread / s0.currentPrice) * 100 : null

  const financialMetrics = useMemo(() => {
    const s = mergedSnapshot ?? snapshot
    return [
      { label: "PER", value: s?.per != null ? `${Number(s.per).toFixed(2)}배` : "-" },
      { label: "PBR", value: s?.pbr != null ? `${Number(s.pbr).toFixed(2)}배` : "-" },
      { label: "EPS", value: s?.eps != null ? `${Number(s.eps).toLocaleString()}원` : "-" },
      { label: "상장주식수", value: s?.listedShares != null ? formatCompact(s.listedShares) : "-" },
      { label: "액면가", value: s?.faceValue != null ? `${formatNumber(s.faceValue, 0)}원` : "-" },
      { label: "자본금", value: s?.capitalAmount != null ? formatKoreanMoney(s.capitalAmount) : "-" },
      { label: "융자잔고비율", value: s?.marginLoanRate != null ? `${formatNumber(s.marginLoanRate, 2)}%` : "-" },
      { label: "회전율", value: s?.turnoverRate != null ? `${formatNumber(s.turnoverRate, 2)}%` : "-" },
    ]
  }, [mergedSnapshot, snapshot])

  const peers = useSectorPeers(symbol, stock.sector)

  // ✅ 공유 버튼 동작
  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    try {
      // Web Share API (모바일 등)
      if ((navigator as any).share) {
        await (navigator as any).share({ title: `${stock.name} (${stock.ticker})`, url })
        return
      }
    } catch {}
    try {
      await navigator.clipboard.writeText(url)
      alert("링크를 클립보드에 복사했어요.")
    } catch {
      // 최후 fallback
      prompt("링크 복사:", url)
    }
  }

  // ✅ 알림 버튼: 오른쪽 RealTimeAlerts로 스크롤
  const handleGoAlerts = () => {
    const el = document.getElementById("realtime-alerts")
    el?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 overflow-x-hidden">
        <Card className="w-full max-w-lg bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold text-destructive">시세 데이터를 불러오지 못했어요.</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground break-words">{String((error as any)?.message ?? "")}</p>
            <div className="flex gap-2">
              <Button onClick={() => refetch()}>다시 시도</Button>
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  홈으로
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!data || !(mergedSnapshot ?? snapshot)) return null

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="w-full px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>

              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <h1 className="truncate text-lg sm:text-xl font-bold text-foreground">{stock.name}</h1>
                  <Badge variant="secondary" className="shrink-0">
                    {stock.ticker}
                  </Badge>
                </div>

                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="h-5 px-2 text-[11px]">
                    {stock.market}
                  </Badge>

                  {isLoading ? (
                    <span className="truncate">불러오는 중</span>
                  ) : (
                    <span className="truncate">
                      업데이트 {dataUpdatedAt ? new Date(dataUpdatedAt).toTimeString().slice(0, 8) : "-"}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ✅ v0에 있던 헤더 액션들 추가 */}
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => setIsFavorite(!isFavorite)} aria-label="favorite">
                <Star className={cn("h-5 w-5", isFavorite && "fill-chart-4 text-chart-4")} />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleGoAlerts} aria-label="alerts">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={handleShare} aria-label="share">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left (main) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price + Chart */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <span className="text-4xl font-bold text-foreground">{formatNumber(stock.price, 0)}원</span>
                    <div
                      className={cn(
                        "flex items-center gap-2 mt-2 text-lg font-medium",
                        isPositive ? "text-chart-1" : "text-chart-2",
                      )}
                    >
                      {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                      {isPositive ? "+" : ""}
                      {formatNumber(stock.change, 0)} ({isPositive ? "+" : ""}
                      {formatNumber(stock.changePercent, 2)}%)
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-muted-foreground">
                      <span className="rounded-md bg-secondary/60 px-2 py-1">
                        오늘 위치{" "}
                        <span className="text-foreground font-medium">
                          {todayPos == null ? "-" : `${Math.round(todayPos)}%`}
                        </span>
                      </span>
                      <span className="rounded-md bg-secondary/60 px-2 py-1">
                        매수/매도 {formatNumber(s0.bidPrice, 0)} / {formatNumber(s0.askPrice, 0)}
                      </span>
                      <span className="rounded-md bg-secondary/60 px-2 py-1">
                        스프레드{" "}
                        <span className="text-foreground font-medium">
                          {spread == null ? "-" : `${formatNumber(spread, 0)}원`}
                          {spreadPct == null ? "" : ` (${formatNumber(spreadPct, 2)}%)`}
                        </span>
                      </span>
                    </div>
                  </div>

                  <div className="text-right text-sm text-muted-foreground">
                    <p>시가총액 {stock.marketCap}</p>
                    <p>거래량 {formatCompact(stock.volume)}</p>
                    <p className="mt-1">
                      전일대비 거래량{" "}
                      <span className="text-foreground font-medium">{formatCompact(s0.changeVolumeFromPrevDay)}</span>
                    </p>
                  </div>
                </div>

                <div className="flex gap-1 mb-4">
                  {(["D", "W", "M", "Y"] as const).map((p) => (
                    <Button
                      key={p}
                      variant={chartPeriod === p ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setChartPeriod(p)}
                    >
                      {p === "D" ? "1일" : p === "W" ? "1주" : p === "M" ? "1개월" : "1년"}
                    </Button>
                  ))}
                </div>

                <div className="h-[350px] overflow-hidden relative">
                  <LightweightStockChart
                    data={priceHistory}
                    period={chartPeriod}
                    height={350}
                    refLines={{
                      prevClose: s0?.prevClosePrice ?? null,
                      dayHigh: s0?.highPrice ?? null,
                      dayLow: s0?.lowPrice ?? null,
                    }}
                    onRequestMore={handleRequestMore}
                    isFetchingMore={isFetchingMore}
                  />

                  {isFetchingMore && (
                    <div className="absolute left-3 top-3 rounded-md border border-border bg-background/80 px-2 py-1 text-xs text-muted-foreground backdrop-blur">
                      과거 데이터 불러오는 중…
                    </div>
                  )}
                </div>

                <div className="mt-2 flex justify-end">
                  <MovingAverageLegend />
                </div>
              </CardContent>
            </Card>

            {/* ✅ v0에 있던 AIInsight 추가 */}
            <AIInsight symbol={symbol} />


            {/* ✅ v0에 있던 NewsCluster 추가 */}
            <NewsCluster stockName={stock.name} />

            {/*/!* Investor Trends *!/*/}
            <InvestorTrends />


            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">시가</p>
                  <p className="text-xl font-bold text-foreground">{formatNumber(stock.open, 0)}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">고가</p>
                  <p className="text-xl font-bold text-foreground">{formatNumber(stock.high, 0)}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">저가</p>
                  <p className="text-xl font-bold text-foreground">{formatNumber(stock.low, 0)}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">전일 종가</p>
                  <p className="text-xl font-bold text-foreground">{formatNumber(stock.prevClose, 0)}</p>
                </CardContent>
              </Card>
            </div>

            {/* Financial */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">재무정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {financialMetrics.map((metric) => (
                    <div key={metric.label} className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                      <p className="text-lg font-bold text-foreground">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* ✅ v0에 있던 "같은 섹터 종목" (있으면만 보이게) */}
            {peers.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">같은 섹터 종목</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {peers.map((p) => {
                      const pct = p.changeRate ?? p.changePercent
                      const up = (pct ?? 0) >= 0
                      return (
                        <Link
                          key={p.symbol}
                          href={`/stocks/${p.symbol}`}
                          className="flex flex-col items-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                        >
                          <span className="font-medium text-foreground">{p.name}</span>
                          <span className={cn("text-lg font-bold mt-1", up ? "text-chart-1" : "text-chart-2")}>
                            {pct == null ? "-" : `${up ? "+" : ""}${pct.toFixed(2)}%`}
                          </span>
                        </Link>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right (sticky) */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto pb-6">
              {/* 뉴스 분석 (주 서비스) */}
              <NewsAnalysis stockName={stock.name} />

            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
