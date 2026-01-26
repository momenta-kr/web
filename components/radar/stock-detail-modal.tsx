"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TrendingUp, TrendingDown, ExternalLink, Bell, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { stocksData, generatePriceHistory } from "@/lib/mock-data"
import { XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { useMemo } from "react"
import Link from "next/link"

interface StockDetailModalProps {
  ticker: string | null
  onClose: () => void
}

export function StockDetailModal({ ticker, onClose }: StockDetailModalProps) {
  const stock = stocksData.find((s) => s.ticker === ticker)

  const priceHistory = useMemo(() => {
    if (!stock) return []
    return generatePriceHistory(stock.price, 30)
  }, [stock])

  if (!stock) return null

  const isPositive = stock.changePercent >= 0

  return (
    <Dialog open={!!ticker} onOpenChange={() => onClose()}>
      <DialogContent className="bg-card border-border max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-foreground">{stock.name}</span>
              <Badge variant="secondary" className="text-xs">
                {stock.ticker}
              </Badge>
              <Badge variant="outline" className="text-xs">
                {stock.sector}
              </Badge>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon">
                <Star className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon">
                <Bell className="h-4 w-4" />
              </Button>
              <Link href={`/app/stock/${stock.ticker}`}>
                <Button variant="ghost" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Price Info */}
          <div className="flex items-end gap-4">
            <span className="text-3xl font-bold text-foreground">{stock.price.toLocaleString()}원</span>
            <div
              className={cn(
                "flex items-center gap-1 text-lg font-medium",
                isPositive ? "text-chart-1" : "text-chart-2",
              )}
            >
              {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
              {isPositive ? "+" : ""}
              {stock.change.toLocaleString()} ({isPositive ? "+" : ""}
              {stock.changePercent.toFixed(2)}%)
            </div>
          </div>

          {/* Mini Chart */}
          <div className="h-[150px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={priceHistory}>
                <defs>
                  <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                    <stop offset="95%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="time" hide />
                <YAxis hide domain={["dataMin", "dataMax"]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                  }}
                  labelStyle={{ color: "hsl(var(--foreground))" }}
                />
                <Area
                  type="monotone"
                  dataKey="price"
                  stroke={isPositive ? "#22c55e" : "#ef4444"}
                  fill="url(#priceGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-secondary/50 border-border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">시가</p>
                <p className="font-semibold text-foreground">{stock.open.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/50 border-border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">고가</p>
                <p className="font-semibold text-chart-1">{stock.high.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/50 border-border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">저가</p>
                <p className="font-semibold text-chart-2">{stock.low.toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/50 border-border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">전일 종가</p>
                <p className="font-semibold text-foreground">{stock.prevClose.toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Card className="bg-secondary/50 border-border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">거래량</p>
                <p className="font-semibold text-foreground">{(stock.volume / 1000000).toFixed(2)}M</p>
              </CardContent>
            </Card>
            <Card className="bg-secondary/50 border-border">
              <CardContent className="p-3">
                <p className="text-xs text-muted-foreground">시가총액</p>
                <p className="font-semibold text-foreground">{stock.marketCap}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
