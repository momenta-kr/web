"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { generateInvestorTrends } from "@/lib/mock-data"
import { Users, Building2, Globe } from "lucide-react"

interface InvestorTrendsProps {
  className?: string
}

export function InvestorTrends({ className }: InvestorTrendsProps) {
  const trends = useMemo(() => generateInvestorTrends(), [])

  const icons = {
    foreign: Globe,
    institution: Building2,
    individual: Users,
  }

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">투자자별 매매동향</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {trends.map((trend) => {
          const Icon = icons[trend.type]
          const isPositive = trend.netVolume >= 0
          const total = trend.buyVolume + trend.sellVolume
          const buyRatio = (trend.buyVolume / total) * 100

          return (
            <div key={trend.type} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium text-foreground">{trend.name}</span>
                </div>
                <span className={cn("font-bold", isPositive ? "text-chart-1" : "text-chart-2")}>{trend.netAmount}</span>
              </div>

              {/* 매수/매도 비율 바 */}
              <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
                <div className="bg-chart-1 transition-all" style={{ width: `${buyRatio}%` }} />
                <div className="bg-chart-2 transition-all" style={{ width: `${100 - buyRatio}%` }} />
              </div>

              <div className="flex justify-between text-xs text-muted-foreground">
                <span>매수 {(trend.buyVolume / 1000).toFixed(0)}K</span>
                <span>매도 {(trend.sellVolume / 1000).toFixed(0)}K</span>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
