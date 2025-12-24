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

// ✅ shadcn/ui Tooltip 사용 (프로젝트에 이미 있을 가능성 높음)
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

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

/** 오늘 저가~고가 범위에서 현재가 위치(0~100). high<=low면 null */
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
  return "연속 -"
}

function isUpByRate(rate: number) {
  return rate >= 0
}

const TOOLTIP_TODAY_POSITION = (
  <div className="space-y-1">
    <p className="font-medium">오늘 위치</p>
    <p className="text-xs text-muted-foreground leading-relaxed">
      오늘 <b>저가~고가</b> 범위에서 <b>현재가</b>가 어디쯤인지 보여줘요.
      <br/>
      0%는 저가 근처, 100%는 고가 근처예요.
    </p>
  </div>
)

const TOOLTIP_TRADE_VOLUME = (
  <div className="space-y-1">
    <p className="font-medium">거래량</p>
    <p className="text-xs text-muted-foreground leading-relaxed">
      오늘 누적 <b>거래된 수량</b>이에요.
      <br/>
      값이 클수록 거래가 활발(관심 ↑)하다는 뜻이에요.
    </p>
  </div>
)

export function PriceMovers({market}: PriceMoversProps) {
  const [activeTab, setActiveTab] = useState<"gainers" | "losers">("gainers")

  const {
    data: topGainers,
    isLoading: isLoadingG,
    isError: isErrorG,
  } = useTopGainers()

  const {
    data: topLosers,
    isLoading: isLoadingL,
    isError: isErrorL,
  } = useTopLosers()

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
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-semibold">등락률 TOP 5</CardTitle>

            <div className="flex rounded-lg bg-secondary p-1">
              <button
                onClick={() => setActiveTab("gainers")}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-colors",
                  activeTab === "gainers"
                    ? "bg-chart-1 text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <TrendingUp className="h-4 w-4"/>
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
                <TrendingDown className="h-4 w-4"/>
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

                return (
                  <Link
                    key={`${activeTab}:${s.shortStockCode}`}
                    href={href}
                    className="flex items-center gap-4 rounded-lg border border-border bg-secondary/30 p-3 hover:bg-secondary/60 transition-colors"
                  >
                    {/* Rank */}
                    <div
                      className={cn(
                        "flex h-8 w-8 items-center justify-center rounded-lg font-bold text-sm",
                        activeTab === "gainers" ? "bg-chart-1/20 text-chart-1" : "bg-chart-2/20 text-chart-2",
                      )}
                    >
                      {index + 1}
                    </div>

                    {/* Name + Signals */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground truncate">{s.stockName}</span>
                        <span className="text-xs text-muted-foreground">{s.shortStockCode}</span>
                      </div>

                      {/* ✅ Range/Vol 대신 유저 친화 용어 + 호버 설명 */}
                      <div
                        className="mt-1 flex flex-col items-start gap-y-1 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted underline-offset-4">
                              오늘 위치 {todayPos == null ? "-" : `${Math.round(todayPos)}%`}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[240px]">
                            {TOOLTIP_TODAY_POSITION}
                          </TooltipContent>
                        </Tooltip>

                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="cursor-help underline decoration-dotted underline-offset-4">
                              거래량 {formatCompact(s.accumulatedVolume)}
                            </span>
                          </TooltipTrigger>
                          <TooltipContent className="max-w-[240px]">
                            {TOOLTIP_TRADE_VOLUME}
                          </TooltipContent>
                        </Tooltip>

                        <span className="whitespace-nowrap">{streakLabel(s)}</span>

                        <span className="whitespace-nowrap">
                          시가 대비 {s.rateFromOpenPrice >= 0 ? "+" : ""}
                          {s.rateFromOpenPrice.toFixed(2)}%
                        </span>
                      </div>


                      {/* ✅ 오늘 위치 미니 바 */}
                      <div className="mt-2 h-1.5 w-full rounded bg-secondary overflow-hidden">
                        <div
                          className={cn("h-full", up ? "bg-chart-1" : "bg-chart-2")}
                          style={{width: `${todayPos ?? 0}%`}}
                        />
                      </div>
                    </div>

                    {/* Price & Change */}
                    <div className="text-right">
                      <div className="font-semibold text-foreground">{formatNumber(s.currentPrice)}원</div>

                      <div
                        className={cn(
                          "mt-0.5 flex items-center justify-end gap-1 text-sm font-medium",
                          up ? "text-chart-1" : "text-chart-2",
                        )}
                      >
                        {up ? <ArrowUpRight className="h-4 w-4"/> : <ArrowDownRight className="h-4 w-4"/>}
                        <span>
                          {up ? "+" : ""}
                          {rate.toFixed(2)}%
                        </span>
                        <span className="text-xs opacity-80">
                          ({s.changeFromPrevDay >= 0 ? "▲" : "▼"}
                          {formatNumber(Math.abs(s.changeFromPrevDay))})
                        </span>
                      </div>

                      <div className="mt-1 text-xs text-muted-foreground">
                        기간 {s.periodChangeRate >= 0 ? "+" : ""}
                        {s.periodChangeRate.toFixed(2)}%
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
