"use client"

import React, { useMemo } from "react"
import {
  ArrowDownRight,
  ArrowUpRight,
  Minus,
  Globe,
  ShieldAlert,
  Zap,
  HandCoins,
  Landmark,
  TrendingUp,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

// ✅ 프로젝트 경로에 맞게 조정
import type { StockCurrentPrice } from "@/domain/stock/types/stock-current-proce.model"

type Props = {
  data?: StockCurrentPrice
  isLoading?: boolean
  className?: string
}

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

function formatSigned(n: number | null | undefined, digits = 2, suffix = "") {
  if (n == null || !Number.isFinite(n)) return "-"
  const sign = n > 0 ? "+" : ""
  return `${sign}${formatNumber(n, digits)}${suffix}`
}

function calcPos(cur?: number, low?: number, high?: number) {
  if (cur == null || low == null || high == null) return null
  if (!Number.isFinite(cur) || !Number.isFinite(low) || !Number.isFinite(high)) return null
  if (high <= low) return null
  const p = ((cur - low) / (high - low)) * 100
  return Math.max(0, Math.min(100, p))
}

function SkeletonLine({ className }: { className?: string }) {
  return <div className={cn("h-4 w-full rounded bg-secondary/50", className)} />
}

function Metric({
                  label,
                  value,
                  hint,
                  right,
                }: {
  label: string
  value: React.ReactNode
  hint?: string
  right?: React.ReactNode
}) {
  return (
    <div className="rounded-lg border border-border bg-background/50 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] text-muted-foreground">{label}</p>
          <p className="mt-1 text-sm font-semibold text-foreground truncate">{value}</p>
          {hint ? <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p> : null}
        </div>
        {right ? <div className="shrink-0">{right}</div> : null}
      </div>
    </div>
  )
}

function FlagBadge({ on, label }: { on: boolean; label: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px]",
        on ? "border-chart-2/30 bg-chart-2/10 text-chart-2" : "border-border bg-secondary/40 text-muted-foreground",
      )}
    >
      {label}
    </Badge>
  )
}

export default function StockFinancialPanel({ data, isLoading, className }: Props) {
  const d = data

  const isUp = (d?.changeFromPreviousDay ?? 0) > 0
  const isDown = (d?.changeFromPreviousDay ?? 0) < 0

  const weekPos = useMemo(() => calcPos(d?.currentPrice, d?.week52LowPrice, d?.week52HighPrice), [d?.currentPrice, d?.week52LowPrice, d?.week52HighPrice])
  const dayPos = useMemo(() => calcPos(d?.currentPrice, d?.lowPrice, d?.highPrice), [d?.currentPrice, d?.lowPrice, d?.highPrice])

  if (isLoading && !d) {
    return (
      <Card className={cn("bg-card border-border", className)}>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">재무/밸류에이션</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SkeletonLine className="h-6" />
          <div className="grid grid-cols-2 gap-2">
            <SkeletonLine />
            <SkeletonLine />
            <SkeletonLine />
            <SkeletonLine />
          </div>
          <SkeletonLine className="h-20" />
        </CardContent>
      </Card>
    )
  }

  if (!d) return null

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle className="text-base font-semibold">재무/밸류에이션</CardTitle>
            <p className="mt-1 text-xs text-muted-foreground">
              기준: 현재가 {formatNumber(d.currentPrice, 0)}원 · 전일대비{" "}
              <span className={cn(isUp ? "text-chart-1" : isDown ? "text-chart-2" : "text-muted-foreground")}>
                {formatSigned(d.changeFromPreviousDay, 0, "원")} ({formatSigned(d.changeRateFromPreviousDay, 2, "%")})
              </span>
            </p>
          </div>

          <Badge variant="secondary" className="text-[11px] shrink-0">
            {d.representativeMarketKoreanName || "KRX"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 핵심 밸류에이션 */}
        <div className="grid grid-cols-2 gap-2">
          <Metric label="시가총액" value={formatKoreanMoney(d.htsMarketCap)} hint={d.capitalCurrencyName ? `${d.capitalCurrencyName}` : undefined} right={<Landmark className="h-4 w-4 text-muted-foreground" />} />
          <Metric label="상장주식수" value={formatCompact(d.listedShares)} hint="Listed Shares" right={<TrendingUp className="h-4 w-4 text-muted-foreground" />} />

          <Metric label="PER" value={d.per ? `${formatNumber(d.per, 2)}배` : "-"} />
          <Metric label="PBR" value={d.pbr ? `${formatNumber(d.pbr, 2)}배` : "-"} />

          <Metric label="EPS" value={d.eps ? `${formatNumber(d.eps, 0)}원` : "-"} />
          <Metric label="BPS" value={d.bps ? `${formatNumber(d.bps, 0)}원` : "-"} />

          <Metric label="자본금" value={formatKoreanMoney(d.capitalAmount)} />
          <Metric label="액면가" value={d.faceValue ? `${formatNumber(d.faceValue, 0)}원` : "-"} hint={d.faceValueCurrencyName ? `${d.faceValueCurrencyName}` : undefined} />
        </div>

        {/* 수급 */}
        <div className="rounded-lg border border-border bg-background/50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">수급/프로그램</p>
            <Badge variant="outline" className="text-[11px]">
              <Globe className="mr-1 h-3.5 w-3.5" />
              외인 소진율 {formatNumber(d.htsForeignExhaustionRate, 2)}%
            </Badge>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <Metric
              label="외인 순매수"
              value={`${formatCompact(d.foreignNetBuyQuantity)}주`}
              right={<HandCoins className="h-4 w-4 text-muted-foreground" />}
            />
            <Metric
              label="프로그램 순매수"
              value={`${formatCompact(d.programNetBuyQuantity)}주`}
              right={<Zap className="h-4 w-4 text-muted-foreground" />}
            />
          </div>

          <div className="mt-2 text-[11px] text-muted-foreground">
            외인 보유수량 {formatCompact(d.foreignHoldingQuantity)}주
          </div>
        </div>

        {/* 52주/당일 밴드 */}
        <div className="rounded-lg border border-border bg-background/50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">가격 밴드</p>
            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span>당일 {dayPos == null ? "-" : `${Math.round(dayPos)}%`}</span>
              <span className="text-muted-foreground">·</span>
              <span>52주 {weekPos == null ? "-" : `${Math.round(weekPos)}%`}</span>
            </div>
          </div>

          {/* bars */}
          <div className="mt-2 space-y-2">
            <div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>당일 (저가~고가)</span>
                <span>
                  {formatNumber(d.lowPrice, 0)} ~ {formatNumber(d.highPrice, 0)}원
                </span>
              </div>
              <div className="mt-1 h-2 w-full rounded bg-secondary/60 overflow-hidden">
                <div className="h-2 bg-chart-4" style={{ width: `${dayPos ?? 0}%` }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>52주 (저가~고가)</span>
                <span>
                  {formatNumber(d.week52LowPrice, 0)} ~ {formatNumber(d.week52HighPrice, 0)}원
                </span>
              </div>
              <div className="mt-1 h-2 w-full rounded bg-secondary/60 overflow-hidden">
                <div className="h-2 bg-chart-1" style={{ width: `${weekPos ?? 0}%` }} />
              </div>
            </div>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <Metric
              label="52주 고가 대비"
              value={formatSigned(d.week52HighPriceVsCurrentRate, 2, "%")}
              hint={d.week52HighPriceDate ? `고가일 ${d.week52HighPriceDate}` : undefined}
              right={isUp ? <ArrowUpRight className="h-4 w-4 text-chart-1" /> : isDown ? <ArrowDownRight className="h-4 w-4 text-chart-2" /> : <Minus className="h-4 w-4 text-muted-foreground" />}
            />
            <Metric
              label="52주 저가 대비"
              value={formatSigned(d.week52LowPriceVsCurrentRate, 2, "%")}
              hint={d.week52LowPriceDate ? `저가일 ${d.week52LowPriceDate}` : undefined}
            />
          </div>
        </div>

        {/* 리스크/규제 */}
        <div className="rounded-lg border border-border bg-background/50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">리스크/규제</p>
            <Badge variant="outline" className="text-[11px]">
              <ShieldAlert className="mr-1 h-3.5 w-3.5" />
              경고코드 {d.marketWarningCode || "-"}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap gap-2">
            <FlagBadge on={d.investmentCautionYn === "Y"} label="투자주의" />
            <FlagBadge on={d.shortTermOverheatedYn === "Y"} label="단기과열" />
            <FlagBadge on={d.temporaryStopYn === "Y"} label="거래정지" />
            <FlagBadge on={d.managedStockYn === "Y"} label="관리종목" />
            <FlagBadge on={d.liquidationTradeYn === "Y"} label="정리매매" />

            <Badge
              variant="outline"
              className={cn(
                "text-[11px]",
                d.shortSellingAvailableYn === "Y"
                  ? "border-chart-1/30 bg-chart-1/10 text-chart-1"
                  : "border-border bg-secondary/40 text-muted-foreground",
              )}
            >
              공매도 {d.shortSellingAvailableYn === "Y" ? "가능" : "불가"}
            </Badge>

            <Badge
              variant="outline"
              className={cn(
                "text-[11px]",
                d.creditAvailableYn === "Y"
                  ? "border-chart-4/30 bg-chart-4/10 text-chart-4"
                  : "border-border bg-secondary/40 text-muted-foreground",
              )}
            >
              신용 {d.creditAvailableYn === "Y" ? "가능" : "불가"}
            </Badge>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <Metric label="융자잔고비율" value={`${formatNumber(d.totalLoanBalanceRate, 2)}%`} />
            <Metric label="회전율" value={`${formatNumber(d.volumeTurnoverRate, 2)}%`} />
          </div>
        </div>

        {/* 지지/저항 (피봇) */}
        <div className="rounded-lg border border-border bg-background/50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">지지/저항 (Pivot)</p>
            <p className="text-[11px] text-muted-foreground">단위: 원</p>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-2">
            <Metric label="R2 / R1" value={`${formatNumber(d.pivotSecondResistancePrice, 0)} / ${formatNumber(d.pivotFirstResistancePrice, 0)}`} />
            <Metric label="S1 / S2" value={`${formatNumber(d.pivotFirstSupportPrice, 0)} / ${formatNumber(d.pivotSecondSupportPrice, 0)}`} />
            <Metric label="Pivot" value={formatNumber(d.pivotPointValue, 0)} />
            <Metric label="저항/지지" value={`${formatNumber(d.resistanceValue, 0)} / ${formatNumber(d.supportValue, 0)}`} />
          </div>
        </div>

        {/* 기준가/상하한가 등 */}
        <div className="grid grid-cols-2 gap-2">
          <Metric label="기준가" value={`${formatNumber(d.basePrice, 0)}원`} />
          <Metric label="상/하한가" value={`${formatNumber(d.upperLimitPrice, 0)} / ${formatNumber(d.lowerLimitPrice, 0)}원`} />
        </div>

        <p className="text-[11px] text-muted-foreground">
          값은 KIS “현재가/지표” 응답 기반이며, 일부 종목/시장에 따라 제공되지 않는 필드가 있을 수 있어요.
        </p>
      </CardContent>
    </Card>
  )
}
