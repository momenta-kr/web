"use client"

import Link from "next/link"
import { Volume2, ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
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
                    {/* ✅ MOBILE: 그대로 */}
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

                                                    <span className="font-semibold text-foreground truncate">{item.stockName}</span>
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

                    {/* ✅ DESKTOP: 좁은 영역(2.5/10) 최적화 카드 */}
                    <div className="hidden md:block pb-1">
                        <Card className="rounded-xl py-2">
                            <CardContent className="p-0">
                                <div className="divide-y divide-border">
                                    {displayRankings.map((item: any, idx: number) => {
                                        const rank = item.rank ?? idx + 1
                                        const isTop3 = rank <= 3

                                        const isPositive = Number(item.prevDayChangeRate) >= 0
                                        const rate = Number(item.prevDayChangeRate ?? 0)
                                        const Icon = isPositive ? TrendingUp : TrendingDown

                                        // 상위 3개만 은은한 강조(좌측 바 + 배지)
                                        const accent =
                                            rank === 1 ? "bg-chart-1" : rank === 2 ? "bg-chart-3" : rank === 3 ? "bg-chart-2" : ""

                                        return (
                                            <Link
                                                key={item.stockCode}
                                                href={`/stocks/${item.stockCode}`}
                                                className={cn(
                                                    "relative block px-3 py-2 transition-colors",
                                                    "hover:bg-secondary/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                                                    isTop3 && "bg-muted/10"
                                                )}
                                            >
                                                {isTop3 ? <span className={cn("absolute left-0 top-0 h-full w-[3px]", accent)} /> : null}

                                                {/* ✅ 좁은 카드 최적화: (왼쪽) 랭크+이름 2줄 / (오른쪽) 가격+등락 2줄 */}
                                                <div className="grid grid-cols-[26px_1fr_auto] items-center gap-2">
                                                    {/* rank */}
                                                    <div className="pt-0.5 text-right tabular-nums">
                                                        {isTop3 ? (
                                                            <span
                                                                className={cn(
                                                                    "inline-flex h-6 min-w-[26px] items-center justify-center rounded-md text-[11px] font-bold tabular-nums",
                                                                    rank === 1
                                                                        ? "bg-chart-1/20 text-chart-1"
                                                                        : rank === 2
                                                                            ? "bg-chart-3/20 text-chart-3"
                                                                            : "bg-chart-2/20 text-chart-2"
                                                                )}
                                                            >
                                                            {rank}
                                                          </span>
                                                        ) : (
                                                            <span className="text-[11px] font-semibold text-muted-foreground">{rank}</span>
                                                        )}
                                                    </div>

                                                    {/* name (최대 2줄) */}
                                                    <div className="min-w-0">
                                                        <div className="text-sm font-semibold text-foreground leading-snug line-clamp-2 break-words">
                                                            {item.stockName}
                                                        </div>
                                                        {/* 필요하면 아주 작은 부가정보(공간 부족하면 삭제) */}
                                                        {/* <div className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">{item.stockCode}</div> */}
                                                    </div>

                                                    {/* right: price + change stacked (compact) */}
                                                    <div className="text-right tabular-nums min-w-[72px] flex flex-col items-center">
                                                        <div className="text-sm font-bold text-foreground leading-none">
                                                            {item.currentPrice?.toLocaleString?.() ?? item.currentPrice}
                                                        </div>
                                                        <div
                                                            className={cn(
                                                                "mt-1 inline-flex items-center justify-end gap-1 text-[11px] font-semibold leading-none",
                                                                isPositive ? "text-chart-1" : "text-chart-2"
                                                            )}
                                                        >
                                                            <Icon className="h-3.5 w-3.5" />
                                                            <span>
                                {isPositive ? "+" : ""}
                                                                {rate.toFixed(2)}%
                              </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </Link>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </ScrollArea>
            )}
        </section>
    )
}
