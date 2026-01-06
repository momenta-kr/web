"use client"

import {TrendingUp, TrendingDown, Activity, BarChart3, Scale} from "lucide-react"
import {Card, CardContent} from "@/components/ui/card"
import type {Market} from "@/lib/types"
import {useIndexPrice} from "@/domain/stock/queries/useIndexPrice"
import {IndexPrice} from "@/domain/stock/types/index-price.model";

interface MarketOverviewProps {
  market: Market
}

function formatNumber(n: number | null, digits = 0) {
  if (n == null) return "-"
  return n.toLocaleString("ko-KR", {maximumFractionDigits: digits, minimumFractionDigits: digits})
}

/** 큰 수를 한국 단위(천/만/억/조)로 */
function formatCompact(n: number | null) {
  if (n == null) return "-"
  const abs = Math.abs(n)

  const THOUSAND = 1_000
  const MAN = 10_000
  const EOK = 100_000_000
  const JO = 1_000_000_000_000

  // 소수점 자릿수는 보기 좋게 조절
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

export function MarketOverview({market}: MarketOverviewProps) {
  const {data, isLoading, isError, error, dataUpdatedAt} = useIndexPrice()

  const index: IndexPrice | undefined = data
  const change = index?.industryIndexChangeFromPrevDay ?? null
  const changeRate = index?.industryIndexChangeRateFromPrevDay ?? null
  const isPositive = (change ?? 0) >= 0

  // Breadth
  const advancing = index?.상승종목수 ?? 0
  const declining = index?.declineCount ?? 0
  const unchanged = index?.unchangedCount ?? 0
  const totalIssues = advancing + declining + unchanged
  const advPct = safePercent(advancing, totalIssues)
  const decPct = safePercent(declining, totalIssues)

  // 거래 규모: 전일 대비 참고용
  const volumeDelta =
    index?.accumulatedVolume != null && index?.previousDayVolume != null
      ? index.accumulatedVolume - index.previousDayVolume
      : null

  const tradeAmountDelta =
    index?.accumulatedTradeAmount != null && index?.previousDayTradeAmount != null
      ? index.accumulatedTradeAmount - index.previousDayTradeAmount
      : null

  // 수급
  const netBuy = index?.netBuyQuantity ?? null

  // ✅ 리스크 감각(연중 고/저 + 현재 위치 %)
  const yearHigh = index?.yearHighIndustryIndex ?? null
  const yearLow = index?.yearLowIndustryIndex ?? null
  const cur = index?.industryIndexCurrentPrice ?? null

  const yearRange = yearHigh != null && yearLow != null ? yearHigh - yearLow : null
  const positionPctRaw =
    cur != null && yearHigh != null && yearLow != null && yearRange != null && yearRange !== 0
      ? ((cur - yearLow) / yearRange) * 100
      : null
  const positionPct = positionPctRaw == null ? null : clamp01to100(positionPctRaw)

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

  // 수급 텍스트(매수/매도 우위)
  const pressureText = (() => {
    if (index?.buyQuantityRate == null || index?.sellQuantityRate == null) return null
    if (index.buyQuantityRate > index.sellQuantityRate) return "매수 우위"
    if (index.buyQuantityRate < index.sellQuantityRate) return "매도 우위"
    return "균형"
  })()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {Array.from({length: 4}).map((_, i) => (
          <Card key={i} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="h-4 w-24 bg-secondary rounded"/>
              <div className="mt-3 h-7 w-40 bg-secondary rounded"/>
              <div className="mt-2 h-4 w-32 bg-secondary rounded"/>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="text-sm text-destructive">지수 정보를 불러오지 못했어요.</p>
          <p className="text-xs text-muted-foreground mt-1">{String((error as any)?.message ?? "")}</p>
        </CardContent>
      </Card>
    )
  }

  if (!index) {
    return (
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <p className="text-sm text-muted-foreground">표시할 지수 데이터가 없어요.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
    {/* 1) Index + Risk */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{market} 지수</span>
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-chart-1"/>
            ) : (
              <TrendingDown className="h-4 w-4 text-chart-2"/>
            )}
          </div>

          <div className="mt-2">
            <span
              className="text-2xl font-bold text-foreground">{formatNumber(index.industryIndexCurrentPrice, 2)}</span>
            <span className={`ml-2 text-sm font-medium ${isPositive ? "text-chart-1" : "text-chart-2"}`}>
              {isPositive ? "+" : ""}
              {formatNumber(change, 2)} ({isPositive ? "+" : ""}
              {formatNumber(changeRate, 2)}%)
            </span>
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            오늘 범위:{" "}
            <span className="text-foreground">{formatNumber(index.industryIndexLowPrice, 2)}</span>
            {" ~ "}
            <span className="text-foreground">{formatNumber(index.industryIndexHighPrice, 2)}</span>
            {" (시가 "}
            <span className="text-foreground">{formatNumber(index.industryIndexOpenPrice, 2)}</span>
            {")"}
          </div>

          {/* ✅ 연중 고/저 + 현재 위치(%) */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                연중 저/고:{" "}
                <span className="text-foreground">{formatNumber(yearLow, 2)}</span>
                {" / "}
                <span className="text-foreground">{formatNumber(yearHigh, 2)}</span>
              </span>
              <span className="text-foreground">
                위치 {positionPct == null ? "-" : `${formatNumber(positionPct, 0)}%`} · {positionLabel}
              </span>
            </div>

            <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
              <div
                className="h-full bg-muted-foreground/60 transition-all"
                style={{width: `${positionPct ?? 0}%`}}
              />
            </div>

            <div className="mt-1 text-[11px] text-muted-foreground">
              * 연중 범위에서 현재가가 어디쯤인지(상단일수록 고점 부담/변동 리스크가 커질 수 있음)
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2) 거래 규모(누적) */}
      {/*<Card className="bg-card border-border">*/}
      {/*  <CardContent className="p-4">*/}
      {/*    <div className="flex items-center justify-between">*/}
      {/*      <span className="text-sm text-muted-foreground">거래 규모(누적)</span>*/}
      {/*      <BarChart3 className="h-4 w-4 text-chart-3"/>*/}
      {/*    </div>*/}

      {/*    <div className="mt-2">*/}
      {/*      <div className="text-xs text-muted-foreground">누적 거래량</div>*/}
      {/*      <div className="text-2xl font-bold text-foreground">{formatCompact(index.accumulatedVolume)}</div>*/}

      {/*      <div className="mt-2 text-xs text-muted-foreground">누적 거래대금</div>*/}
      {/*      <div*/}
      {/*        className="text-lg font-semibold text-foreground">{formatKoreanMoney(index.accumulatedTradeAmount)}</div>*/}

      {/*      <div className="mt-2 text-xs text-muted-foreground">*/}
      {/*        전일 대비(참고):{" "}*/}
      {/*        <span className="text-foreground">*/}
      {/*          거래량 {volumeDelta == null ? "-" : (volumeDelta >= 0 ? "+" : "") + formatCompact(volumeDelta)}*/}
      {/*          {" · "}*/}
      {/*          거래대금 {tradeAmountDelta == null ? "-" : (tradeAmountDelta >= 0 ? "+" : "") + formatKoreanMoney(tradeAmountDelta)}*/}
      {/*        </span>*/}
      {/*      </div>*/}
      {/*    </div>*/}
      {/*  </CardContent>*/}
      {/*</Card>*/}

      {/* 3) 시장 체력(상승/하락) */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">시장 체력(종목 흐름)</span>
            <Activity className="h-4 w-4 text-chart-4"/>
          </div>

          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-chart-1">{formatNumber(advancing)}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-2xl font-bold text-chart-2">{formatNumber(declining)}</span>
            <span className="ml-1 text-sm text-muted-foreground">보합 {formatNumber(unchanged)}</span>
          </div>

          <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden flex">
            <div className="bg-chart-1 transition-all" style={{width: `${advPct}%`}}/>
            <div className="bg-chart-2 transition-all" style={{width: `${decPct}%`}}/>
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            상승비율 <span className="text-foreground">{formatNumber(advPct, 1)}%</span> · 하락비율{" "}
            <span className="text-foreground">{formatNumber(decPct, 1)}%</span>
          </div>

          <div className="mt-2 text-xs text-muted-foreground">
            상한/하한:{" "}
            <span className="text-foreground">{formatNumber(index.upperLimitCount)}</span>
            {" / "}
            <span className="text-foreground">{formatNumber(index.lowerLimitCount)}</span>
          </div>
        </CardContent>
      </Card>

      {/* 4) 수급(호가 잔량) */}
      {/*<Card className="bg-card border-border">*/}
      {/*  <CardContent className="p-4">*/}
      {/*    <div className="flex items-center justify-between">*/}
      {/*      <span className="text-sm text-muted-foreground">수급(호가 잔량)</span>*/}
      {/*      <div className="flex items-center gap-2">*/}
      {/*        {pressureText && (*/}
      {/*          <span className="text-xs text-muted-foreground">*/}
      {/*            {pressureText}*/}
      {/*          </span>*/}
      {/*        )}*/}
      {/*        <Scale className="h-4 w-4 text-muted-foreground"/>*/}
      {/*      </div>*/}
      {/*    </div>*/}

      {/*    <div className="mt-2 grid grid-cols-2 gap-3">*/}
      {/*      <div>*/}
      {/*        <div className="text-xs text-muted-foreground">총 매수 잔량</div>*/}
      {/*        <div className="text-lg font-semibold text-foreground">{formatCompact(index.totalBidQuantity)}</div>*/}
      {/*      </div>*/}
      {/*      <div>*/}
      {/*        <div className="text-xs text-muted-foreground">총 매도 잔량</div>*/}
      {/*        <div className="text-lg font-semibold text-foreground">{formatCompact(index.totalAskQuantity)}</div>*/}
      {/*      </div>*/}
      {/*    </div>*/}

      {/*    <div className="mt-2 text-xs text-muted-foreground">*/}
      {/*      순매수 잔량:{" "}*/}
      {/*      <span className={`${(netBuy ?? 0) >= 0 ? "text-chart-1" : "text-chart-2"} font-medium`}>*/}
      {/*        {(netBuy ?? 0) >= 0 ? "+" : ""}*/}
      {/*        {formatCompact(netBuy)}*/}
      {/*      </span>*/}
      {/*    </div>*/}

      {/*    <div className="mt-2 text-xs text-muted-foreground">*/}
      {/*      잔량 비율(매수/매도):{" "}*/}
      {/*      <span className="text-foreground">*/}
      {/*        {index.buyQuantityRate == null ? "-" : `${formatNumber(index.buyQuantityRate, 1)}%`} /{" "}*/}
      {/*        {index.sellQuantityRate == null ? "-" : `${formatNumber(index.sellQuantityRate, 1)}%`}*/}
      {/*      </span>*/}
      {/*    </div>*/}

      {/*    <div className="mt-2">*/}
      {/*      <p className="text-xs text-muted-foreground">*/}
      {/*        마지막 업데이트:{" "}*/}
      {/*        <span className="text-foreground">*/}
      {/*          {dataUpdatedAt ? new Date(dataUpdatedAt).toTimeString().slice(0, 8) : new Date().toTimeString().slice(0, 8)}*/}
      {/*        </span>*/}
      {/*      </p>*/}
      {/*    </div>*/}
      {/*  </CardContent>*/}
      {/*</Card>*/}
    </div>
  )
}
