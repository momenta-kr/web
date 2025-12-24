"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { generateOrderBook } from "@/lib/mock-data"

interface OrderBookProps {
  basePrice: number
  className?: string
}

export function OrderBook({ basePrice, className }: OrderBookProps) {
  const orderBook = useMemo(() => generateOrderBook(basePrice), [basePrice])

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold flex items-center justify-between">
          <span>호가창</span>
          <span className="text-xs text-muted-foreground font-normal">
            매도잔량 {(orderBook.totalAskVolume / 1000).toFixed(0)}K / 매수잔량{" "}
            {(orderBook.totalBidVolume / 1000).toFixed(0)}K
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="text-xs">
          {/* Header */}
          <div className="grid grid-cols-3 px-4 py-2 border-b border-border text-muted-foreground">
            <span className="text-left">잔량</span>
            <span className="text-center">호가</span>
            <span className="text-right">잔량</span>
          </div>

          {/* 매도호가 (상단) */}
          {orderBook.asks.map((ask, idx) => (
            <div key={`ask-${idx}`} className="grid grid-cols-3 px-4 py-1.5 relative">
              <div className="text-left text-chart-2 z-10 relative">{(ask.volume / 1000).toFixed(0)}K</div>
              <div className="text-center font-medium text-chart-2 z-10 relative">{ask.price.toLocaleString()}</div>
              <div className="text-right text-muted-foreground z-10 relative">-</div>
              <div className="absolute left-0 top-0 h-full bg-chart-2/10" style={{ width: `${ask.ratio}%` }} />
            </div>
          ))}

          {/* 현재가 구분선 */}
          <div className="px-4 py-2 bg-secondary border-y border-border">
            <div className="text-center font-bold text-foreground">{basePrice.toLocaleString()}원</div>
          </div>

          {/* 매수호가 (하단) */}
          {orderBook.bids.map((bid, idx) => (
            <div key={`bid-${idx}`} className="grid grid-cols-3 px-4 py-1.5 relative">
              <div className="text-left text-muted-foreground z-10 relative">-</div>
              <div className="text-center font-medium text-chart-1 z-10 relative">{bid.price.toLocaleString()}</div>
              <div className="text-right text-chart-1 z-10 relative">{(bid.volume / 1000).toFixed(0)}K</div>
              <div className="absolute right-0 top-0 h-full bg-chart-1/10" style={{ width: `${bid.ratio}%` }} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
