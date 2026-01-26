"use client"

import { useState } from "react"
import { AlertTriangle, TrendingUp, TrendingDown, Volume2, Zap, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import { useAnomalies } from "@/lib/store"
import type { Market, TimeRange, AnomalyType } from "@/lib/types"
import Link from "next/link"

interface AnomalyFeedProps {
  market: Market
  timeRange: TimeRange
}

const typeConfig = {
  surge: { icon: TrendingUp, label: "급등", color: "text-chart-1" },
  plunge: { icon: TrendingDown, label: "급락", color: "text-chart-2" },
  volume: { icon: Volume2, label: "거래량", color: "text-chart-3" },
  volatility: { icon: Zap, label: "변동성", color: "text-chart-4" },
}

const severityConfig = {
  high: "bg-chart-2/20 text-chart-2 border-chart-2/30",
  medium: "bg-chart-4/20 text-chart-4 border-chart-4/30",
  low: "bg-chart-1/20 text-chart-1 border-chart-1/30",
}

export function AnomalyFeed({ market, timeRange }: AnomalyFeedProps) {
  const [filter, setFilter] = useState<AnomalyType | "all">("all")
  const { anomalies } = useAnomalies(market)

  const filteredAnomalies = filter === "all" ? anomalies : anomalies.filter((a) => a.type === filter)

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-chart-4" />
            실시간 이상징후
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {filteredAnomalies.length}건
          </Badge>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 mt-3 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "px-2.5 py-1 text-xs rounded-md transition-colors",
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-secondary text-muted-foreground hover:text-foreground",
            )}
          >
            전체
          </button>
          {(Object.keys(typeConfig) as AnomalyType[]).map((type) => {
            const config = typeConfig[type]
            return (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={cn(
                  "px-2.5 py-1 text-xs rounded-md transition-colors",
                  filter === type
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground",
                )}
              >
                {config.label}
              </button>
            )
          })}
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <ScrollArea className="h-[400px]">
          <div className="space-y-2 p-4 pt-0">
            {filteredAnomalies.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>감지된 이상징후가 없습니다</p>
              </div>
            ) : (
              filteredAnomalies.map((anomaly) => {
                const config = typeConfig[anomaly.type]
                const Icon = config.icon

                return (
                  <Link
                    key={anomaly.id}
                    href={`/app/stock/${anomaly.ticker}`}
                    className="group block relative rounded-lg border border-border bg-secondary/50 p-3 hover:bg-secondary transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("mt-0.5 p-1.5 rounded-md bg-secondary", config.color)}>
                        <Icon className="h-4 w-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-foreground">{anomaly.name}</span>
                          <span className="text-xs text-muted-foreground">{anomaly.ticker}</span>
                          <Badge
                            variant="outline"
                            className={cn("text-[10px] px-1.5 py-0", severityConfig[anomaly.severity])}
                          >
                            {anomaly.severity === "high" ? "긴급" : anomaly.severity === "medium" ? "주의" : "정보"}
                          </Badge>
                        </div>

                        <p className="text-sm text-muted-foreground mt-0.5">{anomaly.description}</p>

                        <div className="flex items-center gap-3 mt-2">
                          <span className={cn("text-sm font-bold", config.color)}>{anomaly.value}</span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {anomaly.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
