"use client"

// NOTE
// - 목표가 추세 차트: Recharts 사용 (npm i recharts)
// - “이전 방문 이후 신규 리포트”는 localStorage 기반
// - 아래 import 경로들은 프로젝트 구조에 맞게 조정해줘

import Link from "next/link"
import { useParams } from "next/navigation"
import React, { useEffect, useMemo, useState } from "react"
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts"
import {
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Bell,
  Share2,
  Sparkles,
  Star,
  TrendingDown,
  TrendingUp,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {useAnomalies, useMarketState} from "@/lib/store";
import {useDomesticStockPeriodPrices} from "@/domain/stock/queries/useDomesticStockPeriodPrices";
import {fetchDomesticStockPeriodPrices} from "@/domain/stock/api/fetch-domestic-stock-period-prices";
import {useInvestmentOpinion} from "@/domain/stock/queries/useInvestmentOpinion";
import LightweightStockChart from "@/components/stock/light-weight-stock-chart";
import {AIInsight} from "@/components/stock/ai-insight";
import {NewsCluster} from "@/components/stock/news-cluster";
import {NewsAnalysis} from "@/components/stock/news-analysis";
import {useStockCurrentPrice} from "@/domain/stock/queries/use-stock-current-price";
import StockFinancialPanel from "@/components/stock/stock-financial-panel";

// =========================
// Types
// =========================
type Period = "D" | "W" | "M" | "Y"

type CandlePoint = {
  date: string
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

type InvestmentRecommendation = "BUY" | "HOLD" | "SELL" | "UNKNOWN"

type InvestmentOpinion = {
  stockBusinessDate: Date
  memberCompanyName: string
  investmentOpinion: InvestmentRecommendation
  investmentOpinionRaw: string
  htsTargetPrice: number | null
}

type OpinionRange = "1W" | "2W" | "3W" | "1M" | "2M" | "3M" | "6M"
type BrokerSort = "COUNT" | "UPSIDE" | "BULLISH" | "RECENT"

type BrokerStat = {
  broker: string
  count: number
  latestDate: Date | null
  latestOpinion: InvestmentRecommendation
  latestOpinionRaw: string
  latestTarget: number | null

  buy: number
  hold: number
  sell: number
  unknown: number

  avgTarget: number | null
  medianTarget: number | null
  minTarget: number | null
  maxTarget: number | null
  stdTarget: number | null

  avgUpsidePct: number | null
  medianUpsidePct: number | null

  bullish: number // -1..1
  upgrades: number
  downgrades: number
  targetUp: number
  targetDown: number
}

type TargetTrendPoint = {
  ymd: string // YYYYMMDD
  label: string // MM/DD
  count: number
  avgTarget: number | null
  medianTarget: number | null
  upgrades: number
  downgrades: number
}

// =========================
// Consts
// =========================
const MA5_COLOR = "#F59E0B"
const MA20_COLOR = "#22C55E"
const MA60_COLOR = "#A855F7"
const MA120_COLOR = "#06B6D4"

// ✅ "최근 N일 신규 리포트 알림"에서 사용하는 N
const NEW_REPORT_DAYS = 30

// =========================
// Format / Utils
// =========================
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
  return Array.from(map.values()).sort((a, b) => pickYmd(b).localeCompare(pickYmd(a)))
}

function subDays(date: Date, days: number) {
  const d = new Date(date)
  d.setDate(d.getDate() - days)
  return d
}
function subMonths(date: Date, months: number) {
  const d = new Date(date)
  d.setMonth(d.getMonth() - months)
  return d
}
function calcRangeStart(end: Date, range: OpinionRange) {
  if (range === "1W") return subDays(end, 7)
  if (range === "2W") return subDays(end, 14)
  if (range === "3W") return subDays(end, 21)
  if (range === "1M") return subMonths(end, 1)
  if (range === "2M") return subMonths(end, 2)
  if (range === "3M") return subMonths(end, 3)
  return subMonths(end, 6)
}

function toYmdKey(d: Date) {
  if (!(d instanceof Date) || Number.isNaN(d.getTime())) return ""
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}${m}${day}`
}
function formatYmd(d: Date) {
  const k = toYmdKey(d)
  if (!k) return "-"
  return `${k.slice(0, 4)}-${k.slice(4, 6)}-${k.slice(6, 8)}`
}
function ymdToLabel(ymd: string) {
  if (!ymd || ymd.length !== 8) return "-"
  return `${ymd.slice(4, 6)}/${ymd.slice(6, 8)}`
}
function daysAgo(d: Date) {
  const now = new Date()
  const ms = now.getTime() - d.getTime()
  return Math.floor(ms / 86_400_000)
}

function recommendationLabel(v: InvestmentRecommendation) {
  if (v === "BUY") return "매수"
  if (v === "SELL") return "매도"
  if (v === "HOLD") return "중립"
  return "알수없음"
}
function recommendationBadgeClass(v: InvestmentRecommendation) {
  if (v === "BUY") return "border-chart-1/30 bg-chart-1/15 text-chart-1"
  if (v === "SELL") return "border-chart-2/30 bg-chart-2/15 text-chart-2"
  if (v === "HOLD") return "border-border bg-secondary text-foreground"
  return "border-border bg-secondary/40 text-muted-foreground"
}

function modeRecommendation(items: InvestmentOpinion[]): { rec: InvestmentRecommendation; strengthPct: number } {
  const counts = new Map<InvestmentRecommendation, number>()
  for (const it of items) counts.set(it.investmentOpinion, (counts.get(it.investmentOpinion) ?? 0) + 1)

  let best: InvestmentRecommendation = "UNKNOWN"
  let bestN = -1
  let total = 0
  for (const n of counts.values()) total += n
  for (const [k, n] of counts.entries()) {
    if (n > bestN) {
      best = k
      bestN = n
    }
  }
  const strengthPct = total > 0 ? (bestN / total) * 100 : 0
  return { rec: best, strengthPct }
}

function quantile(sorted: number[], q: number): number | null {
  if (!sorted.length) return null
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base
  if (sorted[base] == null) return null
  if (sorted[base + 1] == null) return sorted[base]
  return sorted[base] + rest * (sorted[base + 1] - sorted[base])
}

function stddev(nums: number[]): number | null {
  if (nums.length < 2) return null
  const mean = nums.reduce((a, b) => a + b, 0) / nums.length
  const v = nums.reduce((acc, x) => acc + (x - mean) * (x - mean), 0) / nums.length
  return Math.sqrt(v)
}

function entropyIndex(counts: Record<string, number>): number {
  // 0~100 (높을수록 분산 큼)
  const total = Object.values(counts).reduce((a, b) => a + b, 0)
  if (!total) return 0
  const ps = Object.values(counts)
    .filter((n) => n > 0)
    .map((n) => n / total)
  if (ps.length <= 1) return 0

  // Shannon entropy (base2) / maxEntropy
  const H = -ps.reduce((acc, p) => acc + p * Math.log2(p), 0)
  const Hmax = Math.log2(ps.length)
  return Hmax > 0 ? (H / Hmax) * 100 : 0
}

function bullishScore(items: InvestmentOpinion[]): number {
  // -1~+1
  if (!items.length) return 0
  let sum = 0
  let n = 0
  for (const it of items) {
    if (it.investmentOpinion === "BUY") sum += 1
    else if (it.investmentOpinion === "SELL") sum -= 1
    else sum += 0
    n++
  }
  return n ? sum / n : 0
}

function dedupeBrokerDay(items: InvestmentOpinion[]) {
  // 최신 우선 정렬 후 같은 (날짜, 증권사) 중복 제거
  const sorted = [...items].sort((a, b) => toYmdKey(b.stockBusinessDate).localeCompare(toYmdKey(a.stockBusinessDate)))
  const seen = new Set<string>()
  const out: InvestmentOpinion[] = []
  for (const it of sorted) {
    const k = `${toYmdKey(it.stockBusinessDate)}|${it.memberCompanyName}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push(it)
  }
  return out
}

function opinionRank(v: InvestmentRecommendation) {
  // 업/다운 계산용 (SELL < HOLD < BUY)
  if (v === "SELL") return 0
  if (v === "HOLD") return 1
  if (v === "BUY") return 2
  return 1
}

// -------------------------
// localStorage safe helpers
// -------------------------
function lsGet(key: string) {
  try {
    if (typeof window === "undefined") return null
    return window.localStorage.getItem(key)
  } catch {
    return null
  }
}
function lsSet(key: string, value: string) {
  try {
    if (typeof window === "undefined") return
    window.localStorage.setItem(key, value)
  } catch {
    // noop
  }
}

// -------------------------
// Opinion normalization
// -------------------------
function asDate(v: any): Date {
  if (v instanceof Date) return v
  if (typeof v === "number") return new Date(v)
  if (typeof v === "string") {
    // "YYYY-MM-DD" / ISO / "YYYYMMDD" 등 케이스 대응
    const s = v.trim()
    if (/^\d{8}$/.test(s)) {
      const y = Number(s.slice(0, 4))
      const m = Number(s.slice(4, 6))
      const d = Number(s.slice(6, 8))
      return new Date(y, m - 1, d)
    }
    const dt = new Date(s)
    return dt
  }
  return new Date(NaN)
}

function normalizeOpinions(input: any[]): InvestmentOpinion[] {
  const out: InvestmentOpinion[] = []
  for (const x of input ?? []) {
    const dt = asDate(x?.stockBusinessDate ?? x?.businessDate ?? x?.date)
    const broker = String(x?.memberCompanyName ?? x?.broker ?? x?.securitiesFirm ?? "기타").trim() || "기타"
    const rec0 = String(x?.investmentOpinion ?? x?.recommendation ?? "UNKNOWN").toUpperCase()
    const rec: InvestmentRecommendation =
      rec0 === "BUY" || rec0 === "HOLD" || rec0 === "SELL" ? (rec0 as InvestmentRecommendation) : "UNKNOWN"
    const raw = String(x?.investmentOpinionRaw ?? x?.recommendationRaw ?? x?.opinionRaw ?? "")
    const target = typeof x?.htsTargetPrice === "number" && Number.isFinite(x.htsTargetPrice) ? x.htsTargetPrice : null

    if (!dt || Number.isNaN(dt.getTime())) continue
    out.push({
      stockBusinessDate: dt,
      memberCompanyName: broker,
      investmentOpinion: rec,
      investmentOpinionRaw: raw,
      htsTargetPrice: target,
    })
  }
  return out
}

// =========================
// Sector peers (same as before)
// =========================
type PeerStock = { symbol: string; name: string; changeRate?: number; changePercent?: number; market?: string }
function useSectorPeers(symbol: string, sector?: string) {
  const [peers, setPeers] = useState<PeerStock[]>([])
  useEffect(() => {
    let cancelled = false
    const run = async () => {
      try {
        const res = await fetch(`/api/stocks/v1/sector/peers?symbol=${encodeURIComponent(symbol)}`, { cache: "no-store" })
        if (!res.ok) return
        const json = await res.json()
        const items: any[] = Array.isArray(json?.items) ? json.items : Array.isArray(json) ? json : []
        const mapped = items
          .map((x) => ({
            symbol: String(x.symbol ?? x.ticker ?? ""),
            name: String(x.name ?? x.stockName ?? ""),
            changeRate:
              typeof x.changeRate === "number" ? x.changeRate : typeof x.changePercent === "number" ? x.changePercent : undefined,
            market: x.market ? String(x.market) : undefined,
          }))
          .filter((x) => x.symbol && x.name && x.symbol !== symbol)
          .slice(0, 4)

        if (!cancelled) setPeers(mapped)
      } catch {
        // noop
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [symbol, sector])
  return peers
}

// =========================
// 목표가 추세 차트 컴포넌트 (Recharts)
// =========================
function TargetTrendTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  const p: TargetTrendPoint | undefined = payload?.[0]?.payload
  if (!p) return null

  return (
    <div className="rounded-lg border border-border bg-background px-3 py-2 text-xs shadow-sm">
      <div className="font-medium text-foreground">{`${label ?? ""}`}</div>
      <div className="mt-1 space-y-1 text-muted-foreground">
        <div className="flex items-center justify-between gap-4">
          <span>리포트</span>
          <span className="text-foreground font-medium">{p.count}건</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>평균 목표가</span>
          <span className="text-foreground font-medium">{p.avgTarget == null ? "-" : `${formatNumber(p.avgTarget, 0)}원`}</span>
        </div>
        <div className="flex items-center justify-between gap-4">
          <span>중앙값 목표가</span>
          <span className="text-foreground font-medium">{p.medianTarget == null ? "-" : `${formatNumber(p.medianTarget, 0)}원`}</span>
        </div>
        {(p.upgrades > 0 || p.downgrades > 0) && (
          <div className="flex items-center justify-between gap-4 pt-1">
            <span>의견 변화</span>
            <span className="text-foreground font-medium">
              상향 {p.upgrades} · 하향 {p.downgrades}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

function TargetPriceTrendChart({ data }: { data: TargetTrendPoint[] }) {
  if (!data.length) {
    return (
      <div className="h-[180px] rounded-lg border border-border bg-secondary/30 flex items-center justify-center text-sm text-muted-foreground">
        목표가 추세 데이터가 없어요.
      </div>
    )
  }

  return (
    <div className="h-[180px] rounded-lg border border-border bg-background/50 p-2">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" opacity={0.35} />
          <XAxis
            dataKey="label"
            tick={{ fontSize: 11 }}
            interval="preserveStartEnd"
            minTickGap={18}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickFormatter={(v: any) => formatCompact(Number(v))}
            width={40}
          />
          <Tooltip content={<TargetTrendTooltip />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line
            type="monotone"
            dataKey="avgTarget"
            name="평균 목표가"
            stroke="#22C55E"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="medianTarget"
            name="중앙값 목표가"
            stroke="#A855F7"
            strokeWidth={2}
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

// =========================
// Page
// =========================
export default function StockDetailPage() {
  const params = useParams()
  const symbol = params.symbol as string

  const { data: stockCurrentPrice, isLoading: isStockCurrentPriceLoading } = useStockCurrentPrice(symbol)

  const { market } = useMarketState()
  const { anomalies } = useAnomalies(market)

  const [isFavorite, setIsFavorite] = useState(false)
  const [chartPeriod, setChartPeriod] = useState<Period>("D")
  const [isFetchingMore, setIsFetchingMore] = useState(false)
  const [mergedPrices, setMergedPrices] = useState<any[]>([])
  const [mergedSnapshot, setMergedSnapshot] = useState<any>(null)

  // ✅ 투자의견 UI state
  const [opinionRange, setOpinionRange] = useState<OpinionRange>("1M")
  const [selectedBroker, setSelectedBroker] = useState<string>("ALL")
  const [dedupeSameBrokerDay, setDedupeSameBrokerDay] = useState(true)
  const [brokerSort, setBrokerSort] = useState<BrokerSort>("COUNT")

  // ✅ NEW: "최근 N일 신규 리포트 알림" state
  const [newReportCount, setNewReportCount] = useState<number>(0)
  const [showNewReportAlert, setShowNewReportAlert] = useState(false)
  const [lastSeenKey, setLastSeenKey] = useState<string>("")

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
  }, [symbol, chartPeriod, dataUpdatedAt]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleRequestMore = async (fromIso: string, toIso: string) => {
    if (isFetchingMore) return
    if (!fromIso || fromIso.length !== 10 || !toIso || toIso.length !== 10) return

    try {
      setIsFetchingMore(true)
      const more = await fetchDomesticStockPeriodPrices({ symbol, periodType: chartPeriod, from: fromIso, to: toIso } as any)
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

    for (let i = 1; i < mapped.length; i++) {
      const prev = mapped[i - 1].volume
      const cur = mapped[i].volume
      const diff = cur - prev
      mapped[i].volume = diff >= 0 ? diff : cur
    }

    const m = new Map<string, CandlePoint>()
    for (const row of mapped) m.set(row.date, row)
    const unique = Array.from(m.values()).sort((a, b) => a.date.localeCompare(b.date))

    const closes = unique.map((d) => d.close)
    const ma5 = rollingMA(closes, 5)
    const ma20 = rollingMA(closes, 20)
    const ma60 = rollingMA(closes, 60)
    const ma120 = rollingMA(closes, 120)

    return unique.map((d, i) => ({ ...d, ma5: ma5[i], ma20: ma20[i], ma60: ma60[i], ma120: ma120[i] }))
  }, [mergedPrices])

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

  const {
    data: investmentOpinionsRaw,
    isLoading: isInvestmentOpinionLoading,
    isError: isInvestmentOpinionError,
  } = useInvestmentOpinion(symbol)

  // ✅ NEW: 신규 리포트 알림(방문 기록) - symbol 기준 localStorage 로딩
  useEffect(() => {
    const key = `stock:${symbol}:lastSeenOpinionYmd`
    const v = lsGet(key) || ""
    setLastSeenKey(v)
    setShowNewReportAlert(false)
    setNewReportCount(0)
  }, [symbol])

  // ✅ 알림 계산은 "항상 dedupeBrokerDay 기준"으로 고정 (UI 옵션과 무관하게 안정적)
  const opinionsForAlert = useMemo(() => {
    const raw = Array.isArray(investmentOpinionsRaw) ? investmentOpinionsRaw : []
    const norm = normalizeOpinions(raw)
    return dedupeBrokerDay(norm)
  }, [investmentOpinionsRaw])

  // ✅ NEW: 이전 방문 이후 + 최근 N일 내 신규 리포트 개수 계산 & 방문 기록 업데이트
  useEffect(() => {
    if (!opinionsForAlert.length) return

    const latestYmd = opinionsForAlert.reduce((best, it) => {
      const k = toYmdKey(it.stockBusinessDate)
      return k > best ? k : best
    }, "")

    const cutoff = toYmdKey(subDays(new Date(), NEW_REPORT_DAYS))

    // lastSeenKey가 없으면 "첫 방문"으로 보고 알림은 띄우지 않되, 기록은 남김
    if (!lastSeenKey) {
      lsSet(`stock:${symbol}:lastSeenOpinionYmd`, latestYmd)
      return
    }

    const count = opinionsForAlert.filter((it) => {
      const k = toYmdKey(it.stockBusinessDate)
      return k > lastSeenKey && k >= cutoff
    }).length

    setNewReportCount(count)
    setShowNewReportAlert(count > 0)

    // ✅ 이번 방문을 기준으로 최신일자를 기록 (다음 방문에서 비교)
    lsSet(`stock:${symbol}:lastSeenOpinionYmd`, latestYmd)
  }, [symbol, opinionsForAlert, lastSeenKey])

  const investmentOpinionStats = useMemo(() => {
    const cur = (mergedSnapshot ?? snapshot)?.currentPrice ?? null

    const raw0 = Array.isArray(investmentOpinionsRaw) ? investmentOpinionsRaw : []
    const raw = normalizeOpinions(raw0)

    const items0 = dedupeSameBrokerDay ? dedupeBrokerDay(raw) : raw

    if (!items0.length) {
      return {
        end: null as Date | null,
        start: null as Date | null,
        periodItems: [] as InvestmentOpinion[],
        brokers: [] as BrokerStat[],
        brokerNames: [] as string[],
        latestLabel: "-",
        consensus: { rec: "UNKNOWN" as InvestmentRecommendation, strengthPct: 0 },
        distribution: { BUY: 0, HOLD: 0, SELL: 0, UNKNOWN: 0 },
        entropy: 0,
        target: {
          avg: null as number | null,
          median: null as number | null,
          min: null as number | null,
          max: null as number | null,
          std: null as number | null,
          q1: null as number | null,
          q3: null as number | null,
        },
        upside: {
          avg: null as number | null,
          median: null as number | null,
          min: null as number | null,
          max: null as number | null,
        },
        recencyDays: {
          avg: null as number | null,
          median: null as number | null,
          min: null as number | null,
        },
        outliers: [] as { broker: string; target: number; date: Date }[],
        timeline: [] as { ymd: string; count: number; consensus: InvestmentRecommendation; avgTarget: number | null }[],

        // ✅ NEW
        targetTrend: [] as TargetTrendPoint[],
        changeEvents: [] as { ymd: string; upgrades: number; downgrades: number }[],
      }
    }

    // end = 최신일
    let end = items0[0].stockBusinessDate
    for (const it of items0) if (it.stockBusinessDate > end) end = it.stockBusinessDate
    const start = calcRangeStart(end, opinionRange)

    const periodItems = items0.filter((it) => it.stockBusinessDate >= start && it.stockBusinessDate <= end)

    // distribution
    const dist = { BUY: 0, HOLD: 0, SELL: 0, UNKNOWN: 0 }
    for (const it of periodItems) dist[it.investmentOpinion] = (dist[it.investmentOpinion] as number) + 1

    const entropy = entropyIndex(dist)

    // consensus: 최신일자 우선
    let latestKey = ""
    for (const it of periodItems) {
      const k = toYmdKey(it.stockBusinessDate)
      if (k && k > latestKey) latestKey = k
    }
    const latestItems = latestKey ? periodItems.filter((it) => toYmdKey(it.stockBusinessDate) === latestKey) : periodItems
    const consensus = latestItems.length ? modeRecommendation(latestItems) : modeRecommendation(periodItems)

    // target stats
    const targets = periodItems
      .map((it) => it.htsTargetPrice)
      .filter((n): n is number => typeof n === "number" && Number.isFinite(n))
      .sort((a, b) => a - b)

    const avgTarget = targets.length ? targets.reduce((a, b) => a + b, 0) / targets.length : null
    const medTarget = targets.length ? quantile(targets, 0.5) : null
    const q1 = targets.length ? quantile(targets, 0.25) : null
    const q3 = targets.length ? quantile(targets, 0.75) : null
    const minTarget = targets.length ? targets[0] : null
    const maxTarget = targets.length ? targets[targets.length - 1] : null
    const sdTarget = targets.length ? stddev(targets) : null

    // upside stats
    const upsides = periodItems
      .map((it) => {
        if (!cur || !it.htsTargetPrice || cur <= 0) return null
        return (it.htsTargetPrice / cur - 1) * 100
      })
      .filter((n): n is number => typeof n === "number" && Number.isFinite(n))
      .sort((a, b) => a - b)

    const avgUpside = upsides.length ? upsides.reduce((a, b) => a + b, 0) / upsides.length : null
    const medUpside = upsides.length ? quantile(upsides, 0.5) : null
    const minUpside = upsides.length ? upsides[0] : null
    const maxUpside = upsides.length ? upsides[upsides.length - 1] : null

    // recency stats
    const ages = periodItems
      .map((it) => daysAgo(it.stockBusinessDate))
      .filter((n) => Number.isFinite(n))
      .sort((a, b) => a - b)
    const avgAge = ages.length ? ages.reduce((a, b) => a + b, 0) / ages.length : null
    const medAge = ages.length ? quantile(ages, 0.5) : null
    const minAge = ages.length ? ages[0] : null

    // outliers (IQR)
    const outliers: { broker: string; target: number; date: Date }[] = []
    if (q1 != null && q3 != null) {
      const iqr = q3 - q1
      const low = q1 - 1.5 * iqr
      const high = q3 + 1.5 * iqr
      const seen = new Set<string>()
      const sortedByDateDesc = [...periodItems].sort((a, b) =>
        toYmdKey(b.stockBusinessDate).localeCompare(toYmdKey(a.stockBusinessDate)),
      )
      for (const it of sortedByDateDesc) {
        const t = it.htsTargetPrice
        if (t == null) continue
        if (t < low || t > high) {
          const key = it.memberCompanyName
          if (seen.has(key)) continue
          seen.add(key)
          outliers.push({ broker: it.memberCompanyName, target: t, date: it.stockBusinessDate })
        }
      }
    }

    // timeline (기존): 날짜별 요약 최근 10개
    const byDay = new Map<string, InvestmentOpinion[]>()
    for (const it of periodItems) {
      const k = toYmdKey(it.stockBusinessDate)
      if (!k) continue
      const arr = byDay.get(k) ?? []
      arr.push(it)
      byDay.set(k, arr)
    }
    const timeline = Array.from(byDay.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 10)
      .map(([ymd, arr]) => {
        const c = modeRecommendation(arr).rec
        const t = arr
          .map((x) => x.htsTargetPrice)
          .filter((n): n is number => typeof n === "number" && Number.isFinite(n))
        const avg = t.length ? t.reduce((a, b) => a + b, 0) / t.length : null
        return { ymd, count: arr.length, consensus: c, avgTarget: avg }
      })

    // broker stats
    const byBroker = new Map<string, InvestmentOpinion[]>()
    for (const it of periodItems) {
      const broker = it.memberCompanyName?.trim() || "기타"
      const arr = byBroker.get(broker) ?? []
      arr.push(it)
      byBroker.set(broker, arr)
    }

    // ✅ NEW: "의견 변화 이벤트" (업/다운) 날짜별 집계 (전체 증권사 기준)
    const changeMap = new Map<string, { upgrades: number; downgrades: number }>()
    for (const [broker, arr] of byBroker.entries()) {
      const asc = [...arr].sort((a, b) => toYmdKey(a.stockBusinessDate).localeCompare(toYmdKey(b.stockBusinessDate)))
      for (let i = 1; i < asc.length; i++) {
        const prev = asc[i - 1]
        const next = asc[i]
        const pr = opinionRank(prev.investmentOpinion)
        const nr = opinionRank(next.investmentOpinion)
        const day = toYmdKey(next.stockBusinessDate)
        if (!day) continue
        if (nr === pr) continue
        const curv = changeMap.get(day) ?? { upgrades: 0, downgrades: 0 }
        if (nr > pr) curv.upgrades += 1
        else curv.downgrades += 1
        changeMap.set(day, curv)
      }
    }
    const changeEvents = Array.from(changeMap.entries())
      .map(([ymd, v]) => ({ ymd, upgrades: v.upgrades, downgrades: v.downgrades }))
      .sort((a, b) => b.ymd.localeCompare(a.ymd))

    // ✅ NEW: 목표가 추세 (기간 내 날짜별 평균/중앙값 목표가)
    const targetTrend: TargetTrendPoint[] = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0])) // asc for chart
      .map(([ymd, arr]) => {
        const ts = arr
          .map((x) => x.htsTargetPrice)
          .filter((n): n is number => typeof n === "number" && Number.isFinite(n))
          .sort((a, b) => a - b)
        const avg = ts.length ? ts.reduce((a, b) => a + b, 0) / ts.length : null
        const med = ts.length ? quantile(ts, 0.5) : null
        const ev = changeMap.get(ymd) ?? { upgrades: 0, downgrades: 0 }
        return {
          ymd,
          label: ymdToLabel(ymd),
          count: arr.length,
          avgTarget: avg,
          medianTarget: med,
          upgrades: ev.upgrades,
          downgrades: ev.downgrades,
        }
      })

    const brokers: BrokerStat[] = Array.from(byBroker.entries()).map(([broker, arr]) => {
      const desc = [...arr].sort((a, b) => toYmdKey(b.stockBusinessDate).localeCompare(toYmdKey(a.stockBusinessDate)))
      const asc = [...arr].sort((a, b) => toYmdKey(a.stockBusinessDate).localeCompare(toYmdKey(b.stockBusinessDate)))
      const latest = desc[0]

      let buy = 0, hold = 0, sell = 0, unknown = 0
      for (const x of arr) {
        if (x.investmentOpinion === "BUY") buy++
        else if (x.investmentOpinion === "HOLD") hold++
        else if (x.investmentOpinion === "SELL") sell++
        else unknown++
      }

      const ts = arr
        .map((x) => x.htsTargetPrice)
        .filter((n): n is number => typeof n === "number" && Number.isFinite(n))
        .sort((a, b) => a - b)

      const avgT = ts.length ? ts.reduce((a, b) => a + b, 0) / ts.length : null
      const medT = ts.length ? quantile(ts, 0.5) : null
      const minT = ts.length ? ts[0] : null
      const maxT = ts.length ? ts[ts.length - 1] : null
      const sdT = ts.length ? stddev(ts) : null

      const ups = arr
        .map((x) => {
          if (!cur || !x.htsTargetPrice || cur <= 0) return null
          return (x.htsTargetPrice / cur - 1) * 100
        })
        .filter((n): n is number => typeof n === "number" && Number.isFinite(n))
        .sort((a, b) => a - b)

      const avgU = ups.length ? ups.reduce((a, b) => a + b, 0) / ups.length : null
      const medU = ups.length ? quantile(ups, 0.5) : null

      // upgrades/downgrades + target up/down (연속 비교)
      let upgrades = 0, downgrades = 0, targetUp = 0, targetDown = 0
      for (let i = 1; i < asc.length; i++) {
        const prev = asc[i - 1]
        const next = asc[i]
        const pr = opinionRank(prev.investmentOpinion)
        const nr = opinionRank(next.investmentOpinion)
        if (nr > pr) upgrades++
        else if (nr < pr) downgrades++

        const pt = prev.htsTargetPrice
        const nt = next.htsTargetPrice
        if (pt != null && nt != null && Number.isFinite(pt) && Number.isFinite(nt)) {
          if (nt > pt) targetUp++
          else if (nt < pt) targetDown++
        }
      }

      return {
        broker,
        count: arr.length,
        latestDate: latest?.stockBusinessDate ?? null,
        latestOpinion: latest?.investmentOpinion ?? "UNKNOWN",
        latestOpinionRaw: latest?.investmentOpinionRaw ?? "",
        latestTarget: latest?.htsTargetPrice ?? null,

        buy,
        hold,
        sell,
        unknown,

        avgTarget: avgT,
        medianTarget: medT,
        minTarget: minT,
        maxTarget: maxT,
        stdTarget: sdT,

        avgUpsidePct: avgU,
        medianUpsidePct: medU,

        bullish: bullishScore(arr),
        upgrades,
        downgrades,
        targetUp,
        targetDown,
      }
    })

    // sort
    const sorted = [...brokers]
    if (brokerSort === "COUNT") sorted.sort((a, b) => b.count - a.count)
    else if (brokerSort === "UPSIDE") sorted.sort((a, b) => (b.avgUpsidePct ?? -999) - (a.avgUpsidePct ?? -999))
    else if (brokerSort === "BULLISH") sorted.sort((a, b) => b.bullish - a.bullish)
    else sorted.sort((a, b) => toYmdKey(b.latestDate ?? new Date(0)).localeCompare(toYmdKey(a.latestDate ?? new Date(0))))

    return {
      end,
      start,
      periodItems,
      brokers: sorted,
      brokerNames: sorted.map((b) => b.broker),
      latestLabel: `${toYmdKey(end).slice(0, 4)}-${toYmdKey(end).slice(4, 6)}-${toYmdKey(end).slice(6, 8)}`,
      consensus,
      distribution: dist,
      entropy,
      target: { avg: avgTarget, median: medTarget, min: minTarget, max: maxTarget, std: sdTarget, q1, q3 },
      upside: { avg: avgUpside, median: medUpside, min: minUpside, max: maxUpside },
      recencyDays: { avg: avgAge, median: medAge, min: minAge },
      outliers: outliers.slice(0, 5),
      timeline,

      // ✅ NEW
      targetTrend,
      changeEvents,
    }
  }, [investmentOpinionsRaw, mergedSnapshot, snapshot, opinionRange, dedupeSameBrokerDay, brokerSort])

  useEffect(() => {
    if (selectedBroker !== "ALL" && !investmentOpinionStats.brokerNames.includes(selectedBroker)) {
      setSelectedBroker("ALL")
    }
  }, [selectedBroker, investmentOpinionStats.brokerNames])

  const handleShare = async () => {
    const url = typeof window !== "undefined" ? window.location.href : ""
    try {
      if ((navigator as any).share) {
        await (navigator as any).share({ title: `${stock.name} (${stock.ticker})`, url })
        return
      }
    } catch {}
    try {
      await navigator.clipboard.writeText(url)
      alert("링크를 클립보드에 복사했어요.")
    } catch {
      prompt("링크 복사:", url)
    }
  }

  const handleGoAlerts = () => {
    const el = document.getElementById("realtime-alerts")
    el?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const peers = useSectorPeers(symbol, stock.sector)

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
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
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
                        <span className="text-foreground font-medium">{todayPos == null ? "-" : `${Math.round(todayPos)}%`}</span>
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
                    <Button key={p} variant={chartPeriod === p ? "default" : "ghost"} size="sm" onClick={() => setChartPeriod(p)}>
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

            {/* Investment Opinion */}
            <Card className="bg-card border-border" id="investment-opinion">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base font-semibold">증권사 투자의견</CardTitle>
                  <Badge
                      variant="outline"
                      className={cn("text-[11px]", recommendationBadgeClass(investmentOpinionStats.consensus.rec))}
                  >
                    컨센서스 {recommendationLabel(investmentOpinionStats.consensus.rec)} ·{" "}
                    {formatNumber(investmentOpinionStats.consensus.strengthPct, 0)}%
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                {/* ✅ NEW: 최근 N일 신규 리포트 알림 (이전 방문 대비) */}
                {showNewReportAlert && newReportCount > 0 && (
                    <div className="rounded-lg border border-border bg-secondary/30 px-3 py-2 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-4 w-4 text-chart-4" />
                          <p className="text-sm font-medium text-foreground truncate">
                            최근 {NEW_REPORT_DAYS}일 새 리포트 {newReportCount}건
                          </p>
                        </div>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          이전 방문 이후 새로 추가된 리포트만 집계했어요.
                        </p>
                      </div>
                      <Button
                          size="sm"
                          variant="ghost"
                          className="h-8 px-2 text-xs shrink-0"
                          onClick={() => setShowNewReportAlert(false)}
                      >
                        확인
                      </Button>
                    </div>
                )}

                {/* Controls */}
                <div className="flex flex-wrap items-center gap-1">
                  {(
                      [
                        ["1W", "1주"],
                        ["2W", "2주"],
                        ["3W", "3주"],
                        ["1M", "1달"],
                        ["2M", "2달"],
                        ["3M", "3달"],
                        ["6M", "6달"],
                      ] as const
                  ).map(([key, label]) => (
                      <Button
                          key={key}
                          size="sm"
                          variant={opinionRange === key ? "default" : "ghost"}
                          onClick={() => setOpinionRange(key)}
                          className="h-8 px-2 text-xs"
                      >
                        {label}
                      </Button>
                  ))}

                  <label className="ml-auto flex items-center gap-2 text-xs text-muted-foreground">
                    <input
                        type="checkbox"
                        checked={dedupeSameBrokerDay}
                        onChange={(e) => setDedupeSameBrokerDay(e.target.checked)}
                        className="h-4 w-4"
                    />
                    같은날 중복 제거
                  </label>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs text-muted-foreground">
                    {investmentOpinionStats.start && investmentOpinionStats.end
                        ? `${formatYmd(investmentOpinionStats.start)} ~ ${formatYmd(investmentOpinionStats.end)}`
                        : "기간 데이터 없음"}
                  </p>

                  <select
                      value={brokerSort}
                      onChange={(e) => setBrokerSort(e.target.value as BrokerSort)}
                      className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                  >
                    <option value="COUNT">정렬: 리포트수</option>
                    <option value="UPSIDE">정렬: 상승여력</option>
                    <option value="BULLISH">정렬: 강세점수</option>
                    <option value="RECENT">정렬: 최신</option>
                  </select>
                </div>

                {/* State */}
                {isInvestmentOpinionLoading ? (
                    <div className="space-y-2">
                      <div className="h-10 rounded-lg bg-secondary/50" />
                      <div className="h-24 rounded-lg bg-secondary/50" />
                    </div>
                ) : isInvestmentOpinionError ? (
                    <p className="text-sm text-muted-foreground">투자의견 데이터를 불러오지 못했어요.</p>
                ) : investmentOpinionStats.periodItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">선택한 기간에 해당하는 투자의견이 없어요.</p>
                ) : (
                    <>
                      {/* ✅ NEW: 목표가 추세 차트 (기간 내 날짜별 평균/중앙값 목표가) */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-muted-foreground">목표가 추세</p>
                          <p className="text-[11px] text-muted-foreground">
                            평균 / 중앙값 (일자별)
                          </p>
                        </div>
                        <TargetPriceTrendChart data={investmentOpinionStats.targetTrend} />
                      </div>

                      {/* ✅ NEW: 의견 변화 이벤트 뱃지 (업그레이드/다운그레이드 발생 날짜) */}
                      {investmentOpinionStats.changeEvents.length > 0 && (
                          <div className="rounded-lg border border-border bg-background/50 p-3">
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground">의견 변화 이벤트</p>
                              <p className="text-[11px] text-muted-foreground">상향/하향 발생일</p>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {investmentOpinionStats.changeEvents.slice(0, 12).map((e) => {
                                const date = `${e.ymd.slice(0, 4)}-${e.ymd.slice(4, 6)}-${e.ymd.slice(6, 8)}`
                                const up = e.upgrades
                                const down = e.downgrades
                                return (
                                    <Badge
                                        key={e.ymd}
                                        variant="outline"
                                        className={cn(
                                            "text-[11px] flex items-center gap-1",
                                            up > down ? "border-chart-1/30 bg-chart-1/10 text-chart-1" : "",
                                            down > up ? "border-chart-2/30 bg-chart-2/10 text-chart-2" : "",
                                            up === down ? "border-border bg-secondary/40 text-muted-foreground" : "",
                                        )}
                                        title={`${date} · 상향 ${up} / 하향 ${down}`}
                                    >
                                      {up > 0 && <ArrowUpRight className="h-3.5 w-3.5" />}
                                      {down > 0 && <ArrowDownRight className="h-3.5 w-3.5" />}
                                      {date} · {up}/{down}
                                    </Badge>
                                )
                              })}
                            </div>
                          </div>
                      )}

                      {/* Summary Tiles */}
                      <div className="grid grid-cols-2 gap-2">
                        <div className="rounded-lg bg-secondary/50 p-3">
                          <p className="text-[11px] text-muted-foreground">리포트</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{investmentOpinionStats.periodItems.length}건</p>
                        </div>
                        <div className="rounded-lg bg-secondary/50 p-3">
                          <p className="text-[11px] text-muted-foreground">증권사</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{investmentOpinionStats.brokers.length}곳</p>
                        </div>

                        <div className="rounded-lg bg-secondary/50 p-3">
                          <p className="text-[11px] text-muted-foreground">목표가(평균/중앙)</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {investmentOpinionStats.target.avg == null ? "-" : `${formatNumber(investmentOpinionStats.target.avg, 0)}원`}
                            <span className="text-muted-foreground font-normal"> / </span>
                            {investmentOpinionStats.target.median == null ? "-" : `${formatNumber(investmentOpinionStats.target.median, 0)}원`}
                          </p>
                        </div>

                        <div className="rounded-lg bg-secondary/50 p-3">
                          <p className="text-[11px] text-muted-foreground">상승여력(평균/중앙)</p>
                          <p
                              className={cn(
                                  "mt-1 text-sm font-semibold",
                                  (investmentOpinionStats.upside.avg ?? 0) >= 0 ? "text-chart-1" : "text-chart-2",
                              )}
                          >
                            {investmentOpinionStats.upside.avg == null
                                ? "-"
                                : `${investmentOpinionStats.upside.avg >= 0 ? "+" : ""}${formatNumber(investmentOpinionStats.upside.avg, 2)}%`}
                            <span className="text-muted-foreground font-normal"> / </span>
                            {investmentOpinionStats.upside.median == null
                                ? "-"
                                : `${investmentOpinionStats.upside.median >= 0 ? "+" : ""}${formatNumber(investmentOpinionStats.upside.median, 2)}%`}
                          </p>
                        </div>

                        <div className="rounded-lg bg-secondary/50 p-3">
                          <p className="text-[11px] text-muted-foreground">목표가 범위</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {investmentOpinionStats.target.min == null ? "-" : `${formatNumber(investmentOpinionStats.target.min, 0)}원`}
                            <span className="text-muted-foreground font-normal"> ~ </span>
                            {investmentOpinionStats.target.max == null ? "-" : `${formatNumber(investmentOpinionStats.target.max, 0)}원`}
                          </p>
                        </div>

                        <div className="rounded-lg bg-secondary/50 p-3">
                          <p className="text-[11px] text-muted-foreground">분산지수(의견)</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">{formatNumber(investmentOpinionStats.entropy, 0)}%</p>
                        </div>

                        <div className="rounded-lg bg-secondary/50 p-3">
                          <p className="text-[11px] text-muted-foreground">목표가 표준편차</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {investmentOpinionStats.target.std == null ? "-" : `${formatNumber(investmentOpinionStats.target.std, 0)}원`}
                          </p>
                        </div>

                        <div className="rounded-lg bg-secondary/50 p-3">
                          <p className="text-[11px] text-muted-foreground">평균 경과일</p>
                          <p className="mt-1 text-sm font-semibold text-foreground">
                            {investmentOpinionStats.recencyDays.avg == null ? "-" : `${formatNumber(investmentOpinionStats.recencyDays.avg, 0)}일`}
                          </p>
                        </div>
                      </div>

                      {/* Outliers */}
                      {investmentOpinionStats.outliers.length > 0 && (
                          <div className="rounded-lg border border-border bg-background/60 p-3">
                            <p className="text-xs text-muted-foreground">목표가 이상치(아웃라이어)</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {investmentOpinionStats.outliers.map((o) => (
                                  <button
                                      key={o.broker}
                                      onClick={() => setSelectedBroker(o.broker)}
                                      className="rounded-md border border-border bg-secondary/40 px-2 py-1 text-[11px] text-foreground hover:bg-secondary transition-colors"
                                  >
                                    {o.broker} · {formatNumber(o.target, 0)}원 · {formatYmd(o.date)}
                                  </button>
                              ))}
                            </div>
                          </div>
                      )}

                      {/* Distribution */}
                      {(() => {
                        const d = investmentOpinionStats.distribution
                        const total = d.BUY + d.HOLD + d.SELL + d.UNKNOWN
                        const buyPct = total ? (d.BUY / total) * 100 : 0
                        const holdPct = total ? (d.HOLD / total) * 100 : 0
                        const sellPct = total ? (d.SELL / total) * 100 : 0
                        const unkPct = total ? (d.UNKNOWN / total) * 100 : 0

                        return (
                            <div className="rounded-lg border border-border overflow-hidden">
                              <div className="px-3 py-2 bg-secondary/30 flex items-center justify-between">
                                <p className="text-xs text-muted-foreground">의견 분포</p>
                                <p className="text-xs text-muted-foreground">
                                  BUY {d.BUY} · HOLD {d.HOLD} · SELL {d.SELL} · ? {d.UNKNOWN}
                                </p>
                              </div>

                              <div className="px-3 py-3 space-y-2">
                                <div className="h-2 w-full rounded bg-secondary/50 overflow-hidden flex">
                                  <div className="h-2 bg-chart-1" style={{ width: `${buyPct}%` }} />
                                  <div className="h-2 bg-secondary" style={{ width: `${holdPct}%` }} />
                                  <div className="h-2 bg-chart-2" style={{ width: `${sellPct}%` }} />
                                  <div className="h-2 bg-muted" style={{ width: `${unkPct}%` }} />
                                </div>

                                <div className="grid grid-cols-4 gap-2 text-[11px] text-muted-foreground">
                                  <div>BUY {formatNumber(buyPct, 0)}%</div>
                                  <div>HOLD {formatNumber(holdPct, 0)}%</div>
                                  <div>SELL {formatNumber(sellPct, 0)}%</div>
                                  <div>? {formatNumber(unkPct, 0)}%</div>
                                </div>
                              </div>
                            </div>
                        )
                      })()}

                      {/* Timeline */}
                      {investmentOpinionStats.timeline.length > 0 && (
                          <div className="rounded-lg border border-border overflow-hidden">
                            <div className="px-3 py-2 bg-secondary/30">
                              <p className="text-xs text-muted-foreground">날짜별 요약 (최근 10개)</p>
                            </div>
                            <div className="divide-y divide-border">
                              {investmentOpinionStats.timeline.map((t) => (
                                  <div key={t.ymd} className="px-3 py-2 flex items-center justify-between">
                                    <div className="min-w-0">
                                      <p className="text-sm font-medium text-foreground">{`${t.ymd.slice(0, 4)}-${t.ymd.slice(4, 6)}-${t.ymd.slice(6, 8)}`}</p>
                                      <p className="text-[11px] text-muted-foreground">{t.count}건</p>
                                    </div>
                                    <div className="flex items-end flex-col gap-1">
                                      <Badge variant="outline" className={cn("text-[11px]", recommendationBadgeClass(t.consensus))}>
                                        {recommendationLabel(t.consensus)}
                                      </Badge>
                                      <p className="text-[11px] text-muted-foreground">
                                        {t.avgTarget == null ? "-" : `${formatNumber(t.avgTarget, 0)}원`}
                                      </p>
                                    </div>
                                  </div>
                              ))}
                            </div>
                          </div>
                      )}

                      {/* Broker Selector */}
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs text-muted-foreground">증권사별 통계</p>
                        <div className="flex items-center gap-1">
                          <Button
                              size="sm"
                              variant={selectedBroker === "ALL" ? "default" : "ghost"}
                              className="h-8 px-2 text-xs"
                              onClick={() => setSelectedBroker("ALL")}
                          >
                            전체
                          </Button>
                          <select
                              value={selectedBroker === "ALL" ? "" : selectedBroker}
                              onChange={(e) => setSelectedBroker(e.target.value || "ALL")}
                              className="h-8 rounded-md border border-border bg-background px-2 text-xs"
                          >
                            <option value="">증권사 선택</option>
                            {investmentOpinionStats.brokerNames.map((b) => (
                                <option key={b} value={b}>
                                  {b}
                                </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* Broker Table / Detail */}
                      {selectedBroker === "ALL" ? (
                          <div className="rounded-lg border border-border overflow-hidden">
                            <div className="px-3 py-2 bg-secondary/30">
                              <p className="text-xs text-muted-foreground">증권사별 요약 (상위 12개)</p>
                            </div>

                            <div className="divide-y divide-border">
                              {investmentOpinionStats.brokers.slice(0, 12).map((b) => (
                                  <button
                                      key={b.broker}
                                      onClick={() => setSelectedBroker(b.broker)}
                                      className="w-full text-left px-3 py-2 hover:bg-secondary/40 transition-colors"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium text-foreground truncate">{b.broker}</p>
                                        <p className="text-[11px] text-muted-foreground">
                                          {b.latestDate ? `${formatYmd(b.latestDate)} · ${b.count}건` : `${b.count}건`}
                                          {b.upgrades || b.downgrades ? ` · 상향 ${b.upgrades} / 하향 ${b.downgrades}` : ""}
                                          {b.targetUp || b.targetDown ? ` · 목표↑ ${b.targetUp} / ↓ ${b.targetDown}` : ""}
                                        </p>
                                      </div>

                                      <div className="flex flex-col items-end gap-1">
                                        <Badge variant="outline" className={cn("text-[11px]", recommendationBadgeClass(b.latestOpinion))}>
                                          {recommendationLabel(b.latestOpinion)}
                                        </Badge>
                                        <p className="text-[11px] text-muted-foreground">
                                          {b.avgTarget == null ? "-" : `${formatNumber(b.avgTarget, 0)}원`}
                                          {b.avgUpsidePct == null
                                              ? ""
                                              : ` · ${b.avgUpsidePct >= 0 ? "+" : ""}${formatNumber(b.avgUpsidePct, 2)}%`}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
                                  <span>
                                    목표가: {b.minTarget == null ? "-" : formatNumber(b.minTarget, 0)} ~{" "}
                                    {b.maxTarget == null ? "-" : formatNumber(b.maxTarget, 0)}
                                  </span>
                                      <span>강세점수 {formatNumber(b.bullish, 2)}</span>
                                    </div>
                                  </button>
                              ))}
                            </div>
                          </div>
                      ) : (
                          (() => {
                            const broker = selectedBroker
                            const stat = investmentOpinionStats.brokers.find((x) => x.broker === broker) ?? null
                            const rows = investmentOpinionStats.periodItems
                                .filter((x) => x.memberCompanyName === broker)
                                .sort((a, b) => toYmdKey(b.stockBusinessDate).localeCompare(toYmdKey(a.stockBusinessDate)))
                                .slice(0, 12)

                            const deltas = rows.map((it, idx) => {
                              const prev = rows[idx + 1]
                              const curT = it.htsTargetPrice
                              const prevT = prev?.htsTargetPrice ?? null
                              const diff = curT != null && prevT != null ? curT - prevT : null
                              const diffPct = curT != null && prevT != null && prevT !== 0 ? (diff! / prevT) * 100 : null
                              return { it, diff, diffPct }
                            })

                            return (
                                <div className="space-y-2">
                                  <div className="rounded-lg bg-secondary/50 p-3">
                                    <div className="flex items-center justify-between gap-2">
                                      <p className="text-sm font-semibold text-foreground truncate">{broker}</p>
                                      <Button
                                          size="sm"
                                          variant="ghost"
                                          className="h-8 px-2 text-xs"
                                          onClick={() => setSelectedBroker("ALL")}
                                      >
                                        전체로
                                      </Button>
                                    </div>

                                    <div className="mt-2 grid grid-cols-2 gap-2">
                                      <div className="rounded-md bg-background/60 p-2">
                                        <p className="text-[11px] text-muted-foreground">리포트</p>
                                        <p className="text-sm font-semibold text-foreground">{stat?.count ?? rows.length}건</p>
                                      </div>

                                      <div className="rounded-md bg-background/60 p-2">
                                        <p className="text-[11px] text-muted-foreground">최근 의견</p>
                                        <div className="mt-1">
                                          <Badge
                                              variant="outline"
                                              className={cn("text-[11px]", recommendationBadgeClass(stat?.latestOpinion ?? "UNKNOWN"))}
                                          >
                                            {recommendationLabel(stat?.latestOpinion ?? "UNKNOWN")}
                                          </Badge>
                                        </div>
                                      </div>

                                      <div className="rounded-md bg-background/60 p-2">
                                        <p className="text-[11px] text-muted-foreground">목표가(평균/중앙)</p>
                                        <p className="text-sm font-semibold text-foreground">
                                          {stat?.avgTarget == null ? "-" : `${formatNumber(stat.avgTarget, 0)}원`} /{" "}
                                          {stat?.medianTarget == null ? "-" : `${formatNumber(stat.medianTarget, 0)}원`}
                                        </p>
                                      </div>

                                      <div className="rounded-md bg-background/60 p-2">
                                        <p className="text-[11px] text-muted-foreground">상승여력(평균/중앙)</p>
                                        <p
                                            className={cn(
                                                "text-sm font-semibold",
                                                (stat?.avgUpsidePct ?? 0) >= 0 ? "text-chart-1" : "text-chart-2",
                                            )}
                                        >
                                          {stat?.avgUpsidePct == null
                                              ? "-"
                                              : `${stat.avgUpsidePct >= 0 ? "+" : ""}${formatNumber(stat.avgUpsidePct, 2)}%`}{" "}
                                          /{" "}
                                          {stat?.medianUpsidePct == null
                                              ? "-"
                                              : `${formatNumber(stat.medianUpsidePct, 2)}%`}
                                        </p>
                                      </div>
                                    </div>

                                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                      <span>BUY {stat?.buy ?? 0}</span>
                                      <span>HOLD {stat?.hold ?? 0}</span>
                                      <span>SELL {stat?.sell ?? 0}</span>
                                      <span>업그레이드 {stat?.upgrades ?? 0}</span>
                                      <span>다운그레이드 {stat?.downgrades ?? 0}</span>
                                      <span>목표↑ {stat?.targetUp ?? 0}</span>
                                      <span>목표↓ {stat?.targetDown ?? 0}</span>
                                      <span>강세점수 {stat ? formatNumber(stat.bullish, 2) : "-"}</span>
                                    </div>
                                  </div>

                                  <div className="rounded-lg border border-border overflow-hidden">
                                    <div className="px-3 py-2 bg-secondary/30">
                                      <p className="text-xs text-muted-foreground">최근 리포트 (최대 12개)</p>
                                    </div>

                                    <div className="divide-y divide-border">
                                      {deltas.map(({ it, diff, diffPct }, idx) => (
                                          <div key={`${toYmdKey(it.stockBusinessDate)}-${idx}`} className="px-3 py-2">
                                            <div className="flex items-center justify-between gap-2">
                                              <div className="min-w-0">
                                                <p className="text-sm font-medium text-foreground">{formatYmd(it.stockBusinessDate)}</p>
                                                <p className="text-[11px] text-muted-foreground truncate">
                                                  {it.investmentOpinionRaw || recommendationLabel(it.investmentOpinion)}
                                                </p>
                                              </div>

                                              <div className="flex flex-col items-end gap-1">
                                                <Badge
                                                    variant="outline"
                                                    className={cn("text-[11px]", recommendationBadgeClass(it.investmentOpinion))}
                                                >
                                                  {recommendationLabel(it.investmentOpinion)}
                                                </Badge>

                                                <div className="text-right">
                                                  <p className="text-[11px] text-muted-foreground">
                                                    목표가 {it.htsTargetPrice == null ? "-" : `${formatNumber(it.htsTargetPrice, 0)}원`}
                                                  </p>
                                                  <p className={cn("text-[11px]", (diff ?? 0) >= 0 ? "text-chart-1" : "text-chart-2")}>
                                                    {diff == null
                                                        ? "변화 -"
                                                        : `${diff >= 0 ? "+" : ""}${formatNumber(diff, 0)}원${
                                                            diffPct == null ? "" : ` (${diffPct >= 0 ? "+" : ""}${formatNumber(diffPct, 2)}%)`
                                                        }`}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>
                                          </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                            )
                          })()
                      )}

                      <p className="text-[11px] text-muted-foreground">
                        목표가/의견은 증권사 리포트 기반이며, 실제 수익을 보장하지 않아요. (기간/중복제거/정렬 옵션에 따라 통계가 달라질 수 있어요)
                      </p>
                    </>
                )}
              </CardContent>
            </Card>

            {/* News Analysis */}
            <div className="grid sm:grid-cols-2 gap-4 mt-4">
              <NewsAnalysis stockName={stock.name} />
              <NewsCluster stockName={stock.name} />
            </div>


            {/* Peers */}
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

          {/* Right */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto pb-6">
              <StockFinancialPanel data={stockCurrentPrice} isLoading={isStockCurrentPriceLoading} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
