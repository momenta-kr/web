"use client"

import { TrendingUp, TrendingDown, Activity, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { useMarketIndex } from "@/lib/store"
import type { Market } from "@/lib/types"

interface MarketOverviewProps {
  market: Market
}

export function MarketOverview({ market }: MarketOverviewProps) {
  const { index } = useMarketIndex(market)
  const isPositive = index.change >= 0

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Index Card */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{market} 지수</span>
            {isPositive ? (
              <TrendingUp className="h-4 w-4 text-chart-1" />
            ) : (
              <TrendingDown className="h-4 w-4 text-chart-2" />
            )}
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-foreground">{index.value.toLocaleString()}</span>
            <span className={`ml-2 text-sm font-medium ${isPositive ? "text-chart-1" : "text-chart-2"}`}>
              {isPositive ? "+" : ""}
              {index.change.toFixed(2)} ({isPositive ? "+" : ""}
              {index.changePercent.toFixed(2)}%)
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Volume Card */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">거래량</span>
            <BarChart3 className="h-4 w-4 text-chart-3" />
          </div>
          <div className="mt-2">
            <span className="text-2xl font-bold text-foreground">{index.volume}</span>
            <span className="ml-2 text-sm text-muted-foreground">{index.tradingValue}</span>
          </div>
        </CardContent>
      </Card>

      {/* Advancing/Declining */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">상승/하락</span>
            <Activity className="h-4 w-4 text-chart-4" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-chart-1">{index.advancing}</span>
            <span className="text-muted-foreground">/</span>
            <span className="text-2xl font-bold text-chart-2">{index.declining}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden flex">
            <div
              className="bg-chart-1 transition-all"
              style={{
                width: `${(index.advancing / (index.advancing + index.declining + index.unchanged)) * 100}%`,
              }}
            />
            <div
              className="bg-chart-2 transition-all"
              style={{
                width: `${(index.declining / (index.advancing + index.declining + index.unchanged)) * 100}%`,
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Live Status */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">실시간 상태</span>
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-chart-1 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-chart-1"></span>
            </span>
          </div>
          <div className="mt-2">
            <span className="text-lg font-semibold text-foreground">장 진행중</span>
            <p className="text-xs text-muted-foreground mt-1">
              마지막 업데이트: {new Date().toTimeString().slice(0, 8)}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
