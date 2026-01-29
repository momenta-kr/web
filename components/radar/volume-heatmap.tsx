"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { sectorDataList } from "@/lib/mock-data"
import type { Market } from "@/lib/types"
import Link from "next/link"

interface VolumeHeatmapProps {
  market: Market
}

function getHeatmapColor(change: number): string {
  if (change >= 3) return "bg-chart-1"
  if (change >= 1.5) return "bg-chart-1/70"
  if (change >= 0) return "bg-chart-1/40"
  if (change >= -1.5) return "bg-chart-2/40"
  if (change >= -3) return "bg-chart-2/70"
  return "bg-chart-2"
}

function getTextColor(change: number): string {
  if (Math.abs(change) >= 1.5) return "text-foreground"
  return "text-foreground/80"
}

export function VolumeHeatmap({ market }: VolumeHeatmapProps) {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold">섹터별 히트맵</CardTitle>
          <div className="flex items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-chart-2" />
              하락
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-secondary" />
              보합
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-chart-1" />
              상승
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {sectorDataList.map((sector) => (
            <div key={sector.name} className="rounded-lg border border-border overflow-hidden">
              {/* Sector Header */}
              <div className="flex items-center justify-between px-3 py-2 bg-secondary/50">
                <span className="font-medium text-sm text-foreground">{sector.name}</span>
                <Badge
                  variant="secondary"
                  className={cn("text-xs", sector.change >= 0 ? "text-chart-1" : "text-chart-2")}
                >
                  {sector.change >= 0 ? "+" : ""}
                  {sector.change}%
                </Badge>
              </div>

              {/* Stock Grid */}
              <div className="flex flex-wrap p-1 gap-1">
                {sector.stocks.map((stock) => (
                  <Link
                    key={stock.ticker}
                    href={`/stock/${stock.ticker}`}
                    style={{ flexBasis: `${stock.size - 2}%`, flexGrow: 1 }}
                    className={cn(
                      "rounded p-2 min-h-[60px] flex flex-col justify-between transition-transform hover:scale-[1.02] cursor-pointer",
                      getHeatmapColor(stock.change),
                    )}
                  >
                    <span className={cn("text-xs font-medium truncate", getTextColor(stock.change))}>{stock.name}</span>
                    <span className={cn("text-sm font-bold", getTextColor(stock.change))}>
                      {stock.change >= 0 ? "+" : ""}
                      {stock.change}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
