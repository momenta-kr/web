"use client"

import { useState } from "react"
import { Activity, Bell, Settings, Search, List } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useSearch, useAnomalies } from "@/lib/store"
import type { Market } from "@/lib/types"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"

interface HeaderProps {
  selectedMarket: Market
  onMarketChange: (market: Market) => void
}

export function Header({ selectedMarket, onMarketChange }: HeaderProps) {
  const { query, setQuery, isOpen, setIsOpen, results } = useSearch()
  const { anomalies } = useAnomalies(selectedMarket)
  const [showNotifications, setShowNotifications] = useState(false)

  const highSeverityCount = anomalies.filter((a) => a.severity === "high").length

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo & Title */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-foreground">시장 레이더</h1>
                <p className="text-xs text-muted-foreground">실시간 이상징후 감지</p>
              </div>
            </Link>

            <div className="flex items-center gap-2">
              <Select value={selectedMarket} onValueChange={(v) => onMarketChange(v as Market)}>
                <SelectTrigger className="w-[110px] bg-secondary border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="KOSPI">KOSPI</SelectItem>
                  <SelectItem value="KOSDAQ">KOSDAQ</SelectItem>
                </SelectContent>
              </Select>

              <Link href="/stocks">
                <Button variant="outline" className="hidden md:flex items-center gap-2 bg-transparent">
                  <List className="h-4 w-4" />
                  전체 종목
                </Button>
              </Link>
            </div>

            {/* Search & Actions */}
            <div className="flex items-center gap-2">
              <Link href="/stocks" className="md:hidden">
                <Button variant="ghost" size="icon">
                  <List className="h-5 w-5" />
                </Button>
              </Link>

              <Button variant="ghost" size="icon" onClick={() => setIsOpen(true)} className="lg:hidden">
                <Search className="h-5 w-5" />
              </Button>

              <div className="relative hidden lg:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="종목 검색..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onFocus={() => setIsOpen(true)}
                  className="w-[200px] pl-9 bg-secondary border-border"
                />
                {isOpen && results.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-50">
                    {results.slice(0, 5).map((stock) => (
                      <Link
                        key={stock.ticker}
                        href={`/stock/${stock.ticker}`}
                        onClick={() => {
                          setIsOpen(false)
                          setQuery("")
                        }}
                        className="flex items-center justify-between px-3 py-2 hover:bg-secondary transition-colors"
                      >
                        <div>
                          <span className="font-medium text-foreground">{stock.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">{stock.ticker}</span>
                        </div>
                        <span
                          className={cn(
                            "text-sm font-medium",
                            stock.changePercent >= 0 ? "text-chart-1" : "text-chart-2",
                          )}
                        >
                          {stock.changePercent >= 0 ? "+" : ""}
                          {stock.changePercent.toFixed(2)}%
                        </span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>

              <ThemeToggle />

              <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotifications(true)}>
                <Bell className="h-5 w-5" />
                {highSeverityCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-destructive text-destructive-foreground">
                    {highSeverityCount}
                  </Badge>
                )}
              </Button>

              <Link href="/settings">
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Dialog */}
      <Dialog open={isOpen && query.length === 0} onOpenChange={setIsOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle>종목 검색</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="종목명 또는 코드 입력..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 bg-secondary border-border"
              autoFocus
            />
          </div>
          {results.length > 0 && (
            <div className="space-y-1 max-h-[300px] overflow-y-auto">
              {results.map((stock) => (
                <Link
                  key={stock.ticker}
                  href={`/stock/${stock.ticker}`}
                  onClick={() => {
                    setIsOpen(false)
                    setQuery("")
                  }}
                  className="flex items-center justify-between px-3 py-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <div>
                    <span className="font-medium text-foreground">{stock.name}</span>
                    <span className="ml-2 text-xs text-muted-foreground">{stock.ticker}</span>
                  </div>
                  <span
                    className={cn("text-sm font-medium", stock.changePercent >= 0 ? "text-chart-1" : "text-chart-2")}
                  >
                    {stock.changePercent >= 0 ? "+" : ""}
                    {stock.changePercent.toFixed(2)}%
                  </span>
                </Link>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Notifications Dialog */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              최근 알림
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {anomalies.slice(0, 10).map((anomaly) => (
              <div
                key={anomaly.id}
                className={cn(
                  "p-3 rounded-lg border",
                  anomaly.severity === "high"
                    ? "border-chart-2/30 bg-chart-2/10"
                    : anomaly.severity === "medium"
                      ? "border-chart-4/30 bg-chart-4/10"
                      : "border-border bg-secondary/50",
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{anomaly.name}</span>
                  <span className="text-xs text-muted-foreground">{anomaly.time}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{anomaly.description}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
