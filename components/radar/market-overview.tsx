"use client"

import { TrendingUp, TrendingDown } from "lucide-react"
import type { Market } from "@/lib/types"
import { useIndexPrice } from "@/domain/stock/queries/useIndexPrice"
import type { IndexPrice } from "@/domain/stock/types/index-price.model"

interface MarketOverviewProps {
  market: Market
}

function formatNumber(n: number | null, digits = 0) {
  if (n == null) return "-"
  return n.toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

/** 큰 수를 한국 단위(천/만/억/조)로 */
function formatCompact(n: number | null) {
  if (n == null) return "-"
  const abs = Math.abs(n)

  const THOUSAND = 1_000
  const MAN = 10_000
  const EOK = 100_000_000
  const JO = 1_000_000_000_000

  const withSign = (v: number) => (n < 0 ? -v : v)

  if (abs >= JO) return `${withSign(abs / JO).toFixed(2)}조`
  if (abs >= EOK) return `${withSign(abs / EOK).toFixed(1)}억`
  if (abs >= MAN) return `${withSign(abs / MAN).toFixed(1)}만`
  if (abs >= THOUSAND) return `${withSign(abs / THOUSAND).toFixed(1)}천`

  return n.toLocaleString("ko-KR")
}

/** 거래대금(원 단위라고 가정) → 조/억/만 */
function formatKoreanMoney(n: number | null) {
  if (n == null) return "-"
  const abs = Math.abs(n)
  const JO = 1_000_000_000_000
  const EOK = 100_000_000
  const MAN = 10_000
  if (abs >= JO) return `${(n / JO).toFixed(2)}조`
  if (abs >= EOK) return `${(n / EOK).toFixed(1)}억`
  if (abs >= MAN) return `${(n / MAN).toFixed(1)}만`
  return n.toLocaleString("ko-KR")
}

function safePercent(n: number, d: number) {
  if (!Number.isFinite(n) || !Number.isFinite(d) || d <= 0) return 0
  return (n / d) * 100
}

function clamp01to100(x: number) {
  if (!Number.isFinite(x)) return 0
  return Math.min(100, Math.max(0, x))
}

function formatHHMMSS(ts?: number) {
  const d = new Date(ts ?? Date.now())
  return d.toTimeString().slice(0, 8)
}

function Stat({
                label,
                value,
                sub,
                tone,
              }: {
  label: string
  value: React.ReactNode
  sub?: React.ReactNode
  tone?: "up" | "down" | "neutral"
}) {
  const valueTone =
    tone === "up" ? "text-chart-1" : tone === "down" ? "text-chart-2" : "text-foreground"

  return (
    <div className="min-w-0 rounded-md border border-border/50 bg-background/40 px-3 py-2">
      <div className="text-[11px] text-muted-foreground truncate">{label}</div>
      <div className={`text-sm font-semibold tabular-nums truncate ${valueTone}`}>{value}</div>
      {sub != null && <div className="text-[11px] text-muted-foreground tabular-nums truncate">{sub}</div>}
    </div>
  )
}

export function MarketOverview({ market }: MarketOverviewProps) {
  const { data, isLoading, isError, error, dataUpdatedAt } = useIndexPrice()
  const index: IndexPrice | undefined = data

  if (isLoading) {
    return (
      <div className="rounded-lg border border-border bg-background/60 p-3">
        <div className="animate-pulse space-y-2">
          <div className="h-4 w-24 bg-secondary rounded" />
          <div className="h-6 w-44 bg-secondary rounded" />
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-14 rounded-md bg-secondary" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-lg border border-border bg-background/60 p-3">
        <p className="text-sm text-destructive">지수 정보를 불러오지 못했어요.</p>
        <p className="text-xs text-muted-foreground mt-1">{String((error as any)?.message ?? "")}</p>
      </div>
    )
  }

  if (!index) {
    return (
      <div className="rounded-lg border border-border bg-background/60 p-3">
        <p className="text-sm text-muted-foreground">표시할 지수 데이터가 없어요.</p>
      </div>
    )
  }

  const change = index.industryIndexChangeFromPrevDay ?? 0
  const changeRate = index.industryIndexChangeRateFromPrevDay ?? 0
  const isPositive = change >= 0

  // Breadth
  const advancing = (index as any)?.상승종목수 ?? 0
  const declining = index.declineCount ?? 0
  const unchanged = index.unchangedCount ?? 0
  const totalIssues = advancing + declining + unchanged
  const advPct = safePercent(advancing, totalIssues)
  const decPct = safePercent(declining, totalIssues)

  // 거래 규모: 전일 대비 참고용
  const volumeDelta =
    index.accumulatedVolume != null && index.previousDayVolume != null
      ? index.accumulatedVolume - index.previousDayVolume
      : null

  const tradeAmountDelta =
    index.accumulatedTradeAmount != null && index.previousDayTradeAmount != null
      ? index.accumulatedTradeAmount - index.previousDayTradeAmount
      : null

  // 수급
  const netBuy = index.netBuyQuantity ?? 0

  const pressureText = (() => {
    if (index.buyQuantityRate == null || index.sellQuantityRate == null) return "-"
    if (index.buyQuantityRate > index.sellQuantityRate) return "매수 우위"
    if (index.buyQuantityRate < index.sellQuantityRate) return "매도 우위"
    return "균형"
  })()

  // 연중 위치
  const yearHigh = index.yearHighIndustryIndex ?? null
  const yearLow = index.yearLowIndustryIndex ?? null
  const cur = index.industryIndexCurrentPrice ?? null
  const yearRange = yearHigh != null && yearLow != null ? yearHigh - yearLow : null

  const positionPct =
    cur != null && yearHigh != null && yearLow != null && yearRange != null && yearRange !== 0
      ? clamp01to100(((cur - yearLow) / yearRange) * 100)
      : null

  const positionLabel =
    positionPct == null
      ? "-"
      : positionPct >= 80
        ? "상단(리스크↑)"
        : positionPct >= 60
          ? "상단권"
          : positionPct >= 40
            ? "중간"
            : positionPct >= 20
              ? "하단권"
              : "하단(기회/변동↑)"

  const tone: "up" | "down" = isPositive ? "up" : "down"

  return (
    <div className="rounded-lg border border-border bg-background/60 p-3">
      {/* 상단: 핵심 요약 */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[11px] text-muted-foreground">{market} 지수</div>
          <div className="mt-0.5 flex items-baseline gap-2 tabular-nums">
            <span className="text-lg font-bold text-foreground">
              {formatNumber(index.industryIndexCurrentPrice, 2)}
            </span>
            <span className={`text-sm font-semibold ${isPositive ? "text-chart-1" : "text-chart-2"}`}>
              {isPositive ? "+" : ""}
              {formatNumber(change, 2)} ({isPositive ? "+" : ""}
              {formatNumber(changeRate, 2)}%)
            </span>
          </div>

          <div className="mt-1 text-[11px] text-muted-foreground tabular-nums">
            범위 {formatNumber(index.industryIndexLowPrice, 2)} ~ {formatNumber(index.industryIndexHighPrice, 2)}
            {" · "}
            시가 {formatNumber(index.industryIndexOpenPrice, 2)}
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-1">
          {isPositive ? (
            <TrendingUp className="h-4 w-4 text-chart-1" />
          ) : (
            <TrendingDown className="h-4 w-4 text-chart-2" />
          )}
          <div className="text-[11px] text-muted-foreground">
            {dataUpdatedAt ? formatHHMMSS(dataUpdatedAt) : formatHHMMSS()}
          </div>
        </div>
      </div>

      {/* 연중 위치(얇게) */}
      <div className="mt-2">
        <div className="flex items-center justify-between text-[11px] text-muted-foreground gap-3">
          <span className="truncate">
            연중 {formatNumber(yearLow, 2)} ~ {formatNumber(yearHigh, 2)}
          </span>
          <span className="shrink-0 text-foreground">
            {positionPct == null ? "-" : `${formatNumber(positionPct, 0)}%`} · {positionLabel}
          </span>
        </div>

        <div className="mt-1.5 h-1.5 rounded-full bg-secondary overflow-hidden">
          <div
            className="h-full bg-muted-foreground/60 transition-all"
            style={{ width: `${positionPct ?? 0}%` }}
          />
        </div>
      </div>

      {/* 하단: 컴팩트 스탯 그리드 */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
        <Stat
          label="거래량(누적)"
          value={formatCompact(index.accumulatedVolume ?? null)}
          sub={
            volumeDelta == null ? "전일 대비 -" : `전일 대비 ${(volumeDelta >= 0 ? "+" : "")}${formatCompact(volumeDelta)}`
          }
          tone="neutral"
        />

        <Stat
          label="거래대금(누적)"
          value={formatKoreanMoney(index.accumulatedTradeAmount ?? null)}
          sub={
            tradeAmountDelta == null
              ? "전일 대비 -"
              : `전일 대비 ${(tradeAmountDelta >= 0 ? "+" : "")}${formatKoreanMoney(tradeAmountDelta)}`
          }
          tone="neutral"
        />

        <Stat
          label="상승/하락/보합"
          value={`${formatNumber(advancing)} / ${formatNumber(declining)} / ${formatNumber(unchanged)}`}
          sub={`비율 ${formatNumber(advPct, 0)}% / ${formatNumber(decPct, 0)}%`}
          tone="neutral"
        />

        <Stat
          label="상한/하한"
          value={`${formatNumber(index.upperLimitCount ?? null)} / ${formatNumber(index.lowerLimitCount ?? null)}`}
          sub="(상한 / 하한)"
          tone="neutral"
        />

        <Stat
          label="호가 잔량(매수/매도)"
          value={`${formatCompact(index.totalBidQuantity ?? null)} / ${formatCompact(index.totalAskQuantity ?? null)}`}
          sub={pressureText}
          tone="neutral"
        />

        <Stat
          label="순매수 잔량"
          value={`${netBuy >= 0 ? "+" : ""}${formatCompact(netBuy)}`}
          sub={
            index.buyQuantityRate == null || index.sellQuantityRate == null
              ? "비율 -"
              : `비율 ${formatNumber(index.buyQuantityRate, 1)}% / ${formatNumber(index.sellQuantityRate, 1)}%`
          }
          tone={netBuy >= 0 ? "up" : "down"}
        />
      </div>
    </div>
  )
}
