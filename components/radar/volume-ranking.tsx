"use client"

import Link from "next/link"
import { Volume2, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useVolumeRanking } from "@/domain/stock/queries/useVolumeRanking"

const compactNumber = (n: number) => {
  const abs = Math.abs(n)
  if (abs >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(1)}억`
  if (abs >= 1_0000) return `${(n / 1_0000).toFixed(0)}만`
  return n.toLocaleString("ko-KR")
}

export function VolumeRanking() {
  const { data: rankings, isLoading, isError } = useVolumeRanking()
  const displayRankings = rankings?.slice(0, 20) || []

  return (
    <section className="h-full w-full min-h-0">
      {/* compact header */}
      <div className="flex items-center gap-2 px-2 py-1.5">
        <Volume2 className="h-4 w-4 text-chart-3" />
        <h2 className="text-sm font-semibold text-foreground">
          거래량 <span className="text-xs text-muted-foreground">TOP 20</span>
        </h2>
      </div>

      {isLoading ? (
        <div className="px-2 py-3 text-center text-sm text-muted-foreground">로딩 중...</div>
      ) : isError ? (
        <div className="px-2 py-3 text-center text-sm text-muted-foreground">데이터를 불러올 수 없습니다</div>
      ) : displayRankings.length === 0 ? (
        <div className="px-2 py-3 text-center text-sm text-muted-foreground">데이터가 없습니다</div>
      ) : (
        <ScrollArea className="h-[calc(100%-30px)]">
          {/* ✅ MOBILE: PriceMovers(MobileCardList)처럼 */}
          <div className="md:hidden mx-1 rounded-xl border border-border overflow-hidden">
            <div className="divide-y divide-border">
              {displayRankings.map((item: any, idx: number) => {
                const isPositive = item.prevDayChangeRate >= 0
                const rate = item.prevDayChangeRate
                const Icon = isPositive ? ArrowUpRight : ArrowDownRight

                const volume =
                  typeof item.volume === "number"
                    ? item.volume
                    : typeof item.tradeVolume === "number"
                      ? item.tradeVolume
                      : undefined

                const tradeAmount =
                  typeof item.tradeAmount === "number"
                    ? item.tradeAmount
                    : typeof item.tradeValue === "number"
                      ? item.tradeValue
                      : undefined

                return (
                  <Link
                    key={item.stockCode}
                    href={`/stocks/${item.stockCode}`}
                    className="block px-3 py-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 min-w-0">
                          <span
                            className={cn(
                              "inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-bold shrink-0 tabular-nums",
                              isPositive ? "bg-chart-1/20 text-chart-1" : "bg-chart-2/20 text-chart-2"
                            )}
                          >
                            {item.rank ?? idx + 1}
                          </span>

                          <span className="font-semibold text-foreground truncate">
                            {item.stockName}
                          </span>
                          {/* 원하면 종목코드도 여기서 추가 가능 */}
                          {/* <span className="text-xs text-muted-foreground shrink-0">{item.stockCode}</span> */}
                        </div>

                        <div className="mt-1 text-xs text-muted-foreground tabular-nums">
                          {item.currentPrice?.toLocaleString?.() ?? item.currentPrice}원
                          {typeof volume === "number" ? (
                            <span className="ml-2 opacity-80">거래량 {compactNumber(volume)}</span>
                          ) : null}
                          {typeof tradeAmount === "number" ? (
                            <span className="ml-2 opacity-80">거래대금 {compactNumber(tradeAmount)}</span>
                          ) : null}
                        </div>
                      </div>

                      <div
                        className={cn(
                          "shrink-0 inline-flex items-center gap-1 text-sm font-semibold tabular-nums",
                          isPositive ? "text-chart-1" : "text-chart-2"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                        <span>
                          {isPositive ? "+" : ""}
                          {Number(rate).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>

          {/* ✅ DESKTOP: 기존처럼 촘촘한 1줄 리스트 */}
          <div className="hidden md:block px-1 pb-1">
            {displayRankings.map((item: any) => {
              const isPositive = item.prevDayChangeRate >= 0
              const Icon = isPositive ? TrendingUp : TrendingDown

              return (
                <Link
                  key={item.stockCode}
                  href={`/stocks/${item.stockCode}`}
                  className="group flex items-center justify-between gap-2 py-1 hover:bg-secondary/40 transition-colors"
                >
                  {/* left */}
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-3 flex-shrink-0 text-xs font-semibold text-muted-foreground tabular-nums text-right">
                      {item.rank}
                    </span>

                    <span className="min-w-0 max-w-[170px] flex-1 truncate font-semibold text-foreground">
                      {item.stockName}
                    </span>
                  </div>

                  {/* right (price + change aligned right) */}
                  <div className="flex items-center flex-shrink-0">
                    <span className="text-sm font-bold text-foreground tabular-nums text-right w-[72px]">
                      {item.currentPrice.toLocaleString()}
                    </span>

                    <span
                      className={cn(
                        "inline-flex items-center justify-end gap-0.5 text-xs font-semibold tabular-nums text-right w-[72px]",
                        isPositive ? "text-chart-1" : "text-chart-2"
                      )}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span>
                        {isPositive ? "+" : ""}
                        {item.prevDayChangeRate.toFixed(2)}%
                      </span>
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        </ScrollArea>
      )}
    </section>
  )
}
