"use client"

import { useMemo, useState } from "react"
import { useParams } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Bell, Star, TrendingUp, TrendingDown, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { stocksData, generatePriceHistory, sectorDataList, generateFinancialData } from "@/lib/mock-data"
import { useAnomalies, useMarketState } from "@/lib/store"
import { XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, BarChart, Bar } from "recharts"
import { NewsAnalysis } from "@/components/stock/news-analysis"
import { InvestorTrends } from "@/components/stock/investor-trends"

export default function StockDetailPage() {
  const params = useParams()
  const ticker = params.ticker as string
  const stock = stocksData.find((s) => s.ticker === ticker)
  const { market } = useMarketState()
  const { anomalies } = useAnomalies(market)
  const [isFavorite, setIsFavorite] = useState(false)
  const [chartPeriod, setChartPeriod] = useState<"1d" | "1w" | "1m" | "3m">("1d")

  const priceHistory = useMemo(() => {
    if (!stock) return []
    const points = chartPeriod === "1d" ? 60 : chartPeriod === "1w" ? 120 : chartPeriod === "1m" ? 180 : 240
    return generatePriceHistory(stock.price, points)
  }, [stock, chartPeriod])

  const financialData = useMemo(() => generateFinancialData(), [])

  const stockAnomalies = anomalies.filter((a) => a.ticker === ticker).slice(0, 5)

  if (!stock) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground mb-2">종목을 찾을 수 없습니다</h1>
          <p className="text-muted-foreground mb-4">요청하신 종목 코드가 존재하지 않습니다.</p>
          <Link href="/">
            <Button>
              <ArrowLeft className="h-4 w-4 mr-2" />
              홈으로 돌아가기
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  const isPositive = stock.changePercent >= 0
  const relatedStocks = sectorDataList
    .find((s) => s.name === stock.sector)
    ?.stocks.filter((s) => s.ticker !== ticker)
    .slice(0, 4)

  const financialMetrics = [
    { label: "PER", value: `${financialData.per}배` },
    { label: "PBR", value: `${financialData.pbr}배` },
    { label: "EPS", value: `${financialData.eps.toLocaleString()}원` },
    { label: "BPS", value: `${financialData.bps.toLocaleString()}원` },
    { label: "배당수익률", value: `${financialData.dividendYield}%` },
    { label: "ROE", value: `${financialData.roe}%` },
    { label: "부채비율", value: `${financialData.debtRatio}%` },
    { label: "영업이익률", value: `${financialData.operatingMargin}%` },
  ]

  const maxVolume = Math.max(...priceHistory.map((d) => d.volume))

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-foreground">{stock.name}</h1>
                  <Badge variant="secondary">{stock.ticker}</Badge>
                  <Badge variant="outline">{stock.market}</Badge>
                </div>
                <p className="text-sm text-muted-foreground">{stock.sector}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setIsFavorite(!isFavorite)}>
                <Star className={cn("h-5 w-5", isFavorite && "fill-chart-4 text-chart-4")} />
              </Button>
              <Button variant="ghost" size="icon">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price Card with Chart */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-end justify-between mb-6">
                  <div>
                    <span className="text-4xl font-bold text-foreground">{stock.price.toLocaleString()}원</span>
                    <div
                      className={cn(
                        "flex items-center gap-2 mt-2 text-lg font-medium",
                        isPositive ? "text-chart-1" : "text-chart-2",
                      )}
                    >
                      {isPositive ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
                      {isPositive ? "+" : ""}
                      {stock.change.toLocaleString()} ({isPositive ? "+" : ""}
                      {stock.changePercent.toFixed(2)}%)
                    </div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <p>시가총액 {stock.marketCap}</p>
                    <p>거래량 {(stock.volume / 1000000).toFixed(2)}M</p>
                  </div>
                </div>

                <div className="flex gap-1 mb-4">
                  {(["1d", "1w", "1m", "3m"] as const).map((period) => (
                    <Button
                      key={period}
                      variant={chartPeriod === period ? "default" : "ghost"}
                      size="sm"
                      onClick={() => setChartPeriod(period)}
                    >
                      {period === "1d" ? "1일" : period === "1w" ? "1주" : period === "1m" ? "1개월" : "3개월"}
                    </Button>
                  ))}
                </div>

                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="75%">
                    <AreaChart data={priceHistory} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="priceGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0.3} />
                          <stop offset="95%" stopColor={isPositive ? "#22c55e" : "#ef4444"} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        domain={["dataMin", "dataMax"]}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        formatter={(value: number) => [`${value.toLocaleString()}원`, "가격"]}
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

                  <ResponsiveContainer width="100%" height="25%">
                    <BarChart data={priceHistory} margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <XAxis
                        dataKey="time"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        hide
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={10}
                        tickLine={false}
                        axisLine={false}
                        tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`}
                        width={40}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        labelStyle={{ color: "hsl(var(--foreground))" }}
                        formatter={(value: number) => [`${value.toLocaleString()}`, "거래량"]}
                      />
                      <Bar dataKey="volume" fill="hsl(var(--muted-foreground))" opacity={0.5} radius={[2, 2, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">시가</p>
                  <p className="text-xl font-bold text-foreground">{stock.open.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">고가</p>
                  <p className="text-xl font-bold text-chart-1">{stock.high.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">저가</p>
                  <p className="text-xl font-bold text-chart-2">{stock.low.toLocaleString()}</p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-4">
                  <p className="text-sm text-muted-foreground">전일 종가</p>
                  <p className="text-xl font-bold text-foreground">{stock.prevClose.toLocaleString()}</p>
                </CardContent>
              </Card>
            </div>

            {/* 투자자별 매매동향 */}
            <InvestorTrends />

            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">재무정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {financialMetrics.map((metric) => (
                    <div key={metric.label} className="p-3 rounded-lg bg-secondary/50">
                      <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
                      <p className="text-lg font-bold text-foreground">{metric.value}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 같은 섹터 종목 */}
            {relatedStocks && relatedStocks.length > 0 && (
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">같은 섹터 종목</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {relatedStocks.map((related) => (
                      <Link
                        key={related.ticker}
                        href={`/stock/${related.ticker}`}
                        className="flex flex-col items-center p-4 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <span className="font-medium text-foreground">{related.name}</span>
                        <span
                          className={cn(
                            "text-lg font-bold mt-1",
                            related.change >= 0 ? "text-chart-1" : "text-chart-2",
                          )}
                        >
                          {related.change >= 0 ? "+" : ""}
                          {related.change}%
                        </span>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto pb-6">
              <NewsAnalysis stockName={stock.name} />

              {/* Recent Anomalies */}
              <Card className="bg-card border-border">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-semibold">최근 이상징후</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {stockAnomalies.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">최근 감지된 이상징후가 없습니다</p>
                  ) : (
                    stockAnomalies.map((anomaly) => (
                      <div key={anomaly.id} className="p-3 rounded-lg bg-secondary/50 border border-border">
                        <div className="flex items-center justify-between mb-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-xs",
                              anomaly.severity === "high"
                                ? "border-chart-2/30 text-chart-2"
                                : anomaly.severity === "medium"
                                  ? "border-chart-4/30 text-chart-4"
                                  : "border-chart-1/30 text-chart-1",
                            )}
                          >
                            {anomaly.type === "surge"
                              ? "급등"
                              : anomaly.type === "plunge"
                                ? "급락"
                                : anomaly.type === "volume"
                                  ? "거래량"
                                  : "변동성"}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{anomaly.time}</span>
                        </div>
                        <p className="text-sm text-foreground">{anomaly.description}</p>
                        <p
                          className={cn(
                            "text-sm font-bold mt-1",
                            anomaly.type === "surge" || anomaly.type === "volume" ? "text-chart-1" : "text-chart-2",
                          )}
                        >
                          {anomaly.value}
                        </p>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
