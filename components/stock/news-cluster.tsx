"use client"

import { useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { generateNewsCluster } from "@/lib/mock-data"
import { Network, TrendingUp, TrendingDown, Minus, ExternalLink, Sparkles } from "lucide-react"

interface NewsClusterProps {
  stockName: string
  className?: string
  /** 곧 출시 표시/비활성화 */
  comingSoon?: boolean
}

export function NewsCluster({ stockName, className, comingSoon = true }: NewsClusterProps) {
  const clusters = useMemo(() => generateNewsCluster(stockName), [stockName])

  const getSentimentConfig = (sentiment: "positive" | "negative" | "neutral") => {
    switch (sentiment) {
      case "positive":
        return {
          icon: TrendingUp,
          color: "text-emerald-500",
          bgColor: "bg-emerald-500/10",
          borderColor: "border-emerald-500/30",
        }
      case "negative":
        return {
          icon: TrendingDown,
          color: "text-red-500",
          bgColor: "bg-red-500/10",
          borderColor: "border-red-500/30",
        }
      default:
        return {
          icon: Minus,
          color: "text-muted-foreground",
          bgColor: "bg-muted/50",
          borderColor: "border-border",
        }
    }
  }

  return (
    <Card className={cn("relative overflow-hidden bg-card border-border", className)} aria-disabled={comingSoon}>
      {/* ✅ 곧 출시 오버레이 (불투명 배경 + 블러) */}
      {comingSoon && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/85 backdrop-blur-sm">
          <div className="text-center px-6">
            <Badge className="gap-1.5 rounded-full bg-primary/10 text-primary border border-primary/30">
              <Sparkles className="h-3.5 w-3.5" />
              곧 출시
            </Badge>
            <p className="mt-2 text-sm text-muted-foreground">
              관련 뉴스 테마/클러스터 기능은 현재 준비 중입니다.
            </p>
          </div>
        </div>
      )}

      <CardHeader className={cn("pb-3", comingSoon && "opacity-40")}>
        <div className="flex items-center gap-2">
          <Network className="h-5 w-5 text-primary" />
          <CardTitle className="text-base font-semibold">관련 뉴스 테마</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground mt-1">현재 시장에서 주목받는 테마와 연관 종목을 분석합니다</p>
      </CardHeader>

      {/* ✅ 오버레이 뒤 콘텐츠는 살짝 흐리게 */}
      <CardContent className={cn("space-y-3", comingSoon && "opacity-40")}>
        {clusters.map((cluster, idx) => {
          const config = getSentimentConfig(cluster.sentiment)
          const Icon = config.icon
          const impactAbs = Math.abs(cluster.impactScore)

          return (
            <div key={idx} className={cn("p-3 rounded-lg border", config.bgColor, config.borderColor)}>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Icon className={cn("h-4 w-4", config.color)} />
                  <span className="text-sm font-semibold text-foreground">{cluster.theme}</span>
                </div>
                <Badge variant="outline" className="text-xs">
                  뉴스 {cluster.newsCount}건
                </Badge>
              </div>

              {/* Impact Score */}
              <div className="mb-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">영향도</span>
                  <span className={config.color}>
                    {cluster.impactScore > 0 ? "+" : ""}
                    {cluster.impactScore}
                  </span>
                </div>
                <Progress value={impactAbs} max={100} className="h-1.5" />
              </div>

              {/* Related Stocks */}
              <div className="space-y-1.5">
                <span className="text-xs text-muted-foreground">연관 종목</span>
                <div className="flex flex-wrap gap-1.5">
                  {cluster.stocks.map((stock) => (
                    <Link key={stock.ticker} href={`/stocks/${stock.ticker}`}>
                      <Badge
                        variant="secondary"
                        className="text-xs cursor-pointer hover:bg-secondary/80 transition-colors"
                      >
                        {stock.name}
                        <span className="ml-1 text-muted-foreground">({(stock.correlation * 100).toFixed(0)}%)</span>
                        <ExternalLink className="h-2.5 w-2.5 ml-1" />
                      </Badge>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
