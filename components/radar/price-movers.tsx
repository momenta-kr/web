"use client"

import {useMemo, useState} from "react"
import Link from "next/link"
import {ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown} from "lucide-react"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {cn} from "@/lib/utils"
import type {Market} from "@/lib/types"
import {useTopGainers} from "@/domain/stock/queries/useTopGainers"
import {useTopLosers} from "@/domain/stock/queries/useTopLosers"
import type {Fluctuation} from "@/domain/stock/types/fluctuation.model"

import {Tooltip, TooltipContent, TooltipProvider, TooltipTrigger} from "@/components/ui/tooltip"

interface PriceMoversProps {
  market: Market
}

function formatNumber(n: number) {
  return n.toLocaleString("ko-KR")
}

function formatCompact(n: number) {
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return formatNumber(n)
}

function calcTodayPosition(current: number, low: number, high: number) {
  if (!Number.isFinite(current) || !Number.isFinite(low) || !Number.isFinite(high)) return null
  if (high <= low) return null
  const p = ((current - low) / (high - low)) * 100
  return Math.max(0, Math.min(100, p))
}

function streakLabel(s: Fluctuation) {
  const up = s.consecutiveRiseDays ?? 0
  const down = s.consecutiveFallDays ?? 0
  if (up > 0) return `연속 ${up}일↑`
  if (down > 0) return `연속 ${down}일↓`
  return null
}

function isUpByRate(rate: number) {
  return rate >= 0
}

const TOOLTIP_TODAY_POSITION = (
  <div className="space-y-1">
    <p className="font-medium">오늘 위치</p>
    <p className="text-xs text-muted-foreground leading-relaxed">
      오늘 <b>저가~고가</b> 범위에서 <b>현재가</b>가 어디쯤인지예요.
      <br />
      0%는 저가 근처, 100%는 고가 근처예요.
    </p>
  </div>
)

const TOOLTIP_TRADE_VOLUME = (
  <div className="space-y-1">
    <p className="font-medium">거래량</p>
    <p className="text-xs text-muted-foreground leading-relaxed">
      오늘 누적 <b>거래된 수량</b>이에요.
      <br />
      값이 클수록 관심이 높을 수 있어요.
    </p>
  </div>
)

/** 모바일에서는 Tooltip이 커서: 라벨 + 값만, sm 이상에서만 Tooltip */
function InfoChip({
                    label,
                    value,
                    tooltip,
                  }: {
  label: string
  value: string
  tooltip?: React.ReactNode
}) {
  return (
    <>
      {/* mobile: compact */}
      <span className="inline-flex items-center gap-1 rounded-md bg-secondary/60 px-2 py-0.5 text-[11px] text-muted-foreground sm:hidden">
        <span className="opacity-80">{label}</span>
        <span className="text-foreground">{value}</span>
      </span>

      {/* >= sm: tooltip */}
      <span className="hidden sm:inline-flex">
        {tooltip ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="cursor-help underline decoration-dotted underline-offset-4 text-xs text-muted-foreground">
                {label} <span className="text-foreground">{value}</span>
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-[240px]">{tooltip}</TooltipContent>
          </Tooltip>
        ) : (
          <span className="text-xs text-muted-foreground">
            {label} <span className="text-foreground">{value}</span>
          </span>
        )}
      </span>
    </>
  )
}

export function PriceMovers({market}: PriceMoversProps) {
  const [activeTab, setActiveTab] = useState<"gainers" | "losers">("gainers")

  const {data: topGainers, isLoading: isLoadingG, isError: isErrorG} = useTopGainers()
  const {data: topLosers, isLoading: isLoadingL, isError: isErrorL} = useTopLosers()

  const {items, isLoading, isError} = useMemo(() => {
    const list = (activeTab === "gainers" ? topGainers : topLosers) ?? []
    return {
      items: (list as Fluctuation[]).slice(0, 5),
      isLoading: activeTab === "gainers" ? isLoadingG : isLoadingL,
      isError: activeTab === "gainers" ? isErrorG : isErrorL,
    }
  }, [activeTab, topGainers, topLosers, isLoadingG, isLoadingL, isErrorG, isErrorL])

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-base font-semibold">등락률 TOP 5</CardTitle>

            <div className="flex rounded-lg bg-secondary p-1 shrink-0">
              <button
                onClick={() => setActiveTab("gainers")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  activeTab === "gainers"
                    ? "bg-chart-1 text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <TrendingUp className="h-4 w-4" />
                상승
              </button>

              <button
                onClick={() => setActiveTab("losers")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  activeTab === "losers"
                    ? "bg-chart-2 text-destructive-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <TrendingDown className="h-4 w-4" />
                하락
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading && <div className="text-sm text-muted-foreground py-6 text-center">불러오는 중…</div>}

          {!isLoading && isError && (
            <div className="text-sm text-destructive py-6 text-center">데이터를 불러오지 못했어요.</div>
          )}

          {!isLoading && !isError && items.length === 0 && (
            <div className="text-sm text-muted-foreground py-6 text-center">표시할 데이터가 없어요.</div>
          )}

          {!isLoading && !isError && items.length > 0 && (
            <div className="space-y-2">
              {items.map((s, index) => {
                const rate = s.changeRateFromPrevDay
                const up = isUpByRate(rate)

                const todayPos = calcTodayPosition(s.currentPrice, s.lowPrice, s.highPrice)
                const href = `/stock/${s.shortStockCode}`

                const streak = streakLabel(s)
                const openDelta = `${s.rateFromOpenPrice >= 0 ? "+" : ""}${s.rateFromOpenPrice.toFixed(2)}%`

                return (
                  <Link
                    key={`${activeTab}:${s.shortStockCode}`}
                    href={href}
                    className="block rounded-lg border border-border bg-secondary/30 p-3 hover:bg-secondary/60 transition-colors"
                  >
                    {/* Row 1: Rank + Name | Price + Rate (mobile: stacked nicely) */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {/* Rank */}
                        <div
                          className={cn(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg font-bold text-sm",
                            activeTab === "gainers" ? "bg-chart-1/20 text-chart-1" : "bg-chart-2/20 text-chart-2",
                          )}
                        >
                          {index + 1}
                        </div>

                        {/* Name */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-semibold text-foreground truncate">{s.stockName}</span>
                            <span className="text-xs text-muted-foreground shrink-0">{s.shortStockCode}</span>
                          </div>

                          {/* mobile: chips (compact), desktop: richer */}
                          <div className="mt-1 flex flex-wrap items-center gap-1.5 sm:gap-x-3 sm:gap-y-1">
                            <InfoChip
                              label="오늘위치"
                              value={todayPos == null ? "-" : `${Math.round(todayPos)}%`}
                              tooltip={TOOLTIP_TODAY_POSITION}
                            />
                            <InfoChip
                              label="거래량"
                              value={formatCompact(s.accumulatedVolume)}
                              tooltip={TOOLTIP_TRADE_VOLUME}
                            />
                            {/* mobile: streak/open only if exists, compact */}
                            {streak && (
                              <span className="inline-flex items-center rounded-md bg-secondary/60 px-2 py-0.5 text-[11px] text-muted-foreground sm:hidden">
                                <span className="text-foreground">{streak}</span>
                              </span>
                            )}
                            <span className="hidden sm:inline-flex text-xs text-muted-foreground">
                              {streak ? <span className="text-foreground">{streak}</span> : null}
                              {streak ? <span className="mx-2 opacity-40">·</span> : null}
                              <span>
                                시가 대비 <span className="text-foreground">{openDelta}</span>
                              </span>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Price/Rate */}
                      <div className="text-right shrink-0">
                        <div className="font-semibold text-foreground">{formatNumber(s.currentPrice)}원</div>
                        <div
                          className={cn(
                            "mt-0.5 inline-flex items-center justify-end gap-1 text-sm font-medium",
                            up ? "text-chart-1" : "text-chart-2",
                          )}
                        >
                          {up ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
                          <span>
                            {up ? "+" : ""}
                            {rate.toFixed(2)}%
                          </span>
                        </div>

                        {/* mobile: hide noisy numbers, desktop show diff */}
                        <div className="hidden sm:block mt-0.5 text-xs text-muted-foreground">
                          ({s.changeFromPrevDay >= 0 ? "▲" : "▼"}
                          {formatNumber(Math.abs(s.changeFromPrevDay))})
                        </div>
                      </div>
                    </div>

                    {/* Row 2: mini bar + (desktop) period */}
                    <div className="mt-2">
                      <div className="h-1.5 w-full rounded bg-secondary overflow-hidden">
                        <div
                          className={cn("h-full", up ? "bg-chart-1" : "bg-chart-2")}
                          style={{width: `${todayPos ?? 0}%`}}
                        />
                      </div>

                      <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                        {/* mobile: show open + period in one line */}
                        <span className="sm:hidden">
                          시가 {openDelta} · 기간{" "}
                          <span className="text-foreground">
                            {s.periodChangeRate >= 0 ? "+" : ""}
                            {s.periodChangeRate.toFixed(2)}%
                          </span>
                        </span>

                        {/* desktop: period on right like before */}
                        <span className="hidden sm:inline-flex">
                          기간{" "}
                          <span className="text-foreground">
                            {s.periodChangeRate >= 0 ? "+" : ""}
                            {s.periodChangeRate.toFixed(2)}%
                          </span>
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
