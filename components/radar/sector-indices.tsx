"use client"

import {useMemo, useState} from "react"
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card"
import {TrendingUp, TrendingDown, Minus, ArrowDownUp, Coins, BarChart3} from "lucide-react"
import {cn} from "@/lib/utils"
import {useIndustryIndexItem} from "@/domain/stock/queries/useIndustryIndexItem"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

export type IndustryIndexItem = {
  industryCode: string
  industryName: string

  currentIndexPrice: number
  changeFromPreviousDay: number
  changeRate: number

  accumulatedVolume: number
  accumulatedTradeAmount: number
  volumeRatio: number
  tradeAmountRatio: number
}

type SortKey = "changeRate" | "tradeAmountRatio" | "accumulatedTradeAmount"

function formatNumber(n: number) {
  return n.toLocaleString("ko-KR")
}

function formatSigned(n: number, digits = 2) {
  const sign = n > 0 ? "+" : ""
  return `${sign}${n.toFixed(digits)}`
}

function formatCompact(n: number) {
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return formatNumber(n)
}

// 거래대금은 큰 숫자라 한국식 단위가 더 직관적인 경우가 많음
function formatKoreanMoney(n: number) {
  const abs = Math.abs(n)
  const JO = 1_0000_0000_0000
  const EOK = 100_000_000
  if (abs >= JO) return `${(n / JO).toFixed(1)}조`
  if (abs >= EOK) return `${(n / EOK).toFixed(1)}억`
  return formatNumber(n)
}

export function SectorIndices() {
  const {data, isLoading, isError} = useIndustryIndexItem()
  const [sortKey, setSortKey] = useState<SortKey>("changeRate")

  const sorted = useMemo(() => {
    const arr = [...(data ?? [])]
    if (sortKey === "changeRate") return arr.sort((a, b) => b.changeRate - a.changeRate)
    if (sortKey === "tradeAmountRatio") return arr.sort((a, b) => b.tradeAmountRatio - a.tradeAmountRatio)
    return arr.sort((a, b) => b.accumulatedTradeAmount - a.accumulatedTradeAmount)
  }, [data, sortKey])

  // 자금쏠림 미니바(상대값)용 max
  const maxTradeAmountRatio = useMemo(() => {
    return Math.max(1, ...sorted.map((x) => x.tradeAmountRatio))
  }, [sorted])

  return (
    <TooltipProvider delayDuration={150}>
      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary"/>
              업종별 지수
            </CardTitle>

            {/* ✅ 정렬 토글 */}
            <div className="flex items-center gap-1 rounded-lg bg-secondary p-1">
              <button
                onClick={() => setSortKey("changeRate")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors",
                  sortKey === "changeRate"
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={sortKey === "changeRate"}
              >
                <ArrowDownUp className="h-3.5 w-3.5"/>
                등락률
              </button>

              <button
                onClick={() => setSortKey("tradeAmountRatio")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors",
                  sortKey === "tradeAmountRatio"
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={sortKey === "tradeAmountRatio"}
              >
                <Coins className="h-3.5 w-3.5"/>
                자금쏠림
              </button>

              <button
                onClick={() => setSortKey("accumulatedTradeAmount")}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors",
                  sortKey === "accumulatedTradeAmount"
                    ? "bg-background text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
                aria-pressed={sortKey === "accumulatedTradeAmount"}
              >
                <BarChart3 className="h-3.5 w-3.5"/>
                거래대금
              </button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {isLoading && <div className="text-sm text-muted-foreground">불러오는 중…</div>}

          {isError && <div className="text-sm text-destructive">업종 지수를 불러오지 못했어요.</div>}

          {!isLoading && !isError && sorted.length === 0 && (
            <div className="text-sm text-muted-foreground">표시할 데이터가 없어요.</div>
          )}

          {!isLoading && !isError && sorted.length > 0 && (

            <div
              className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 max-h-[528px] overflow-y-auto scrollbar-hidden">
              {sorted.map((item) => {
                const isPositive = item.changeRate > 0
                const isNeutral = item.changeRate === 0

                const shareWidth = Math.max(
                  0,
                  Math.min(100, (item.tradeAmountRatio / maxTradeAmountRatio) * 100),
                )

                return (
                  <div
                    key={item.industryCode}
                    className={cn(
                      "p-3 rounded-lg border transition-colors cursor-pointer hover:bg-muted/50",
                      isPositive && "border-red-500/30 bg-red-500/5",
                      !isPositive && !isNeutral && "border-blue-500/30 bg-blue-500/5",
                      isNeutral && "border-border bg-muted/30",
                    )}
                    title={`${item.industryName} (${item.industryCode})`}
                  >
                    {/* 업종명 */}
                    <div className="text-sm font-medium text-foreground truncate">
                      {item.industryName}
                    </div>

                    {/* 지수 */}
                    <div className="mt-1 text-lg font-bold text-foreground">
                      {Math.round(item.currentIndexPrice).toLocaleString()}
                    </div>

                    {/* 등락률 + 전일대비(포인트) */}
                    <div
                      className={cn(
                        "mt-1 flex items-center gap-1 text-sm font-medium",
                        isPositive && "text-red-500",
                        !isPositive && !isNeutral && "text-blue-500",
                        isNeutral && "text-muted-foreground",
                      )}
                    >
                      {isPositive ? (
                        <TrendingUp className="h-3 w-3"/>
                      ) : isNeutral ? (
                        <Minus className="h-3 w-3"/>
                      ) : (
                        <TrendingDown className="h-3 w-3"/>
                      )}

                      <span>
                        {isPositive ? "+" : ""}
                        {item.changeRate.toFixed(2)}%
                      </span>

                      <span className="text-xs opacity-80">
                        ({item.changeFromPreviousDay >= 0 ? "▲" : "▼"}
                        {Math.abs(item.changeFromPreviousDay).toFixed(2)})
                      </span>
                    </div>

                    {/* ✅ 자금쏠림(거래대금 비중) + 미니바 */}
                    <div className="mt-2">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className="flex items-center justify-between text-xs text-muted-foreground cursor-help">
                            <span className="underline decoration-dotted underline-offset-4">자금쏠림</span>
                            <span>{item.tradeAmountRatio.toFixed(1)}%</span>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[240px]">
                          <div className="space-y-1">
                            <p className="font-medium">자금쏠림(거래대금 비중)</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              오늘 전체 거래대금 중 이 업종이 차지하는 비율이에요.
                              <br/>
                              높을수록 돈이 몰린(관심 높은) 업종입니다.
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>

                      <div className="mt-1 h-1.5 w-full rounded bg-secondary overflow-hidden">
                        <div
                          className={cn(
                            "h-full",
                            isPositive ? "bg-red-500" : !isNeutral ? "bg-blue-500" : "bg-muted-foreground",
                          )}
                          style={{width: `${shareWidth}%`}}
                        />
                      </div>
                    </div>

                    {/* ✅ 거래대금/거래량 (실제 의사결정에 도움) */}
                    <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded bg-secondary/40 px-2 py-1 cursor-help">
                            <div className="opacity-80 underline decoration-dotted underline-offset-4">거래대금</div>
                            <div className="text-foreground font-medium">
                              {formatKoreanMoney(item.accumulatedTradeAmount)}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[240px]">
                          <div className="space-y-1">
                            <p className="font-medium">거래대금</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              오늘 이 업종에 거래된 총 금액이에요.
                              <br/>
                              클수록 자금이 많이 들어온 상태입니다.
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>

                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="rounded bg-secondary/40 px-2 py-1 cursor-help">
                            <div className="opacity-80 underline decoration-dotted underline-offset-4">거래량</div>
                            <div className="text-foreground font-medium">
                              {formatCompact(item.accumulatedVolume)}
                            </div>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent className="max-w-[240px]">
                          <div className="space-y-1">
                            <p className="font-medium">거래량</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              오늘 누적 거래된 수량이에요.
                              <br/>
                              클수록 거래가 활발(관심 ↑)하다는 뜻입니다.
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>

                    {/* 옵션: 관심도(거래량 비중) */}
                    <div className="mt-2 text-[11px] text-muted-foreground">
                      관심도 {item.volumeRatio.toFixed(1)}%
                    </div>
                  </div>
                )
              })}
            </div>

          )}
        </CardContent>
      </Card>
    </TooltipProvider>
  )
}
