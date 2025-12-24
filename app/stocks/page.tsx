"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowUpDown, Search, TrendingUp, TrendingDown, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { stocksData } from "@/lib/mock-data"
import { cn } from "@/lib/utils"
import type { Market } from "@/lib/types"
import { ThemeToggle } from "@/components/theme-toggle"

type SortKey = "name" | "price" | "changePercent" | "volume" | "marketCap"
type SortOrder = "asc" | "desc"

export default function StocksPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMarket, setSelectedMarket] = useState<Market | "ALL">("ALL")
  const [selectedSector, setSelectedSector] = useState<string>("ALL")
  const [sortKey, setSortKey] = useState<SortKey>("marketCap")
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc")

  const sectors = useMemo(() => {
    const sectorSet = new Set(stocksData.map((s) => s.sector))
    return ["ALL", ...Array.from(sectorSet)]
  }, [])

  const filteredAndSortedStocks = useMemo(() => {
    const filtered = stocksData.filter((stock) => {
      const matchesSearch =
        stock.name.toLowerCase().includes(searchQuery.toLowerCase()) || stock.ticker.includes(searchQuery)
      const matchesMarket = selectedMarket === "ALL" || stock.market === selectedMarket
      const matchesSector = selectedSector === "ALL" || stock.sector === selectedSector
      return matchesSearch && matchesMarket && matchesSector
    })

    filtered.sort((a, b) => {
      let aVal: number | string
      let bVal: number | string

      switch (sortKey) {
        case "name":
          aVal = a.name
          bVal = b.name
          break
        case "price":
          aVal = a.price
          bVal = b.price
          break
        case "changePercent":
          aVal = a.changePercent
          bVal = b.changePercent
          break
        case "volume":
          aVal = a.volume
          bVal = b.volume
          break
        case "marketCap":
          aVal = Number.parseFloat(a.marketCap.replace(/[^0-9.]/g, ""))
          bVal = Number.parseFloat(b.marketCap.replace(/[^0-9.]/g, ""))
          break
        default:
          return 0
      }

      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortOrder === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal)
      }
      return sortOrder === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number)
    })

    return filtered
  }, [searchQuery, selectedMarket, selectedSector, sortKey, sortOrder])

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc")
    } else {
      setSortKey(key)
      setSortOrder("desc")
    }
  }

  const formatVolume = (volume: number) => {
    if (volume >= 1000000) {
      return `${(volume / 1000000).toFixed(1)}M`
    }
    if (volume >= 1000) {
      return `${(volume / 1000).toFixed(0)}K`
    }
    return volume.toString()
  }

  const stats = useMemo(() => {
    const rising = filteredAndSortedStocks.filter((s) => s.changePercent > 0).length
    const falling = filteredAndSortedStocks.filter((s) => s.changePercent < 0).length
    const unchanged = filteredAndSortedStocks.filter((s) => s.changePercent === 0).length
    return { rising, falling, unchanged, total: filteredAndSortedStocks.length }
  }, [filteredAndSortedStocks])

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link href="/">
                <Button variant="ghost" size="icon">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div>
                <h1 className="text-lg font-semibold text-foreground">전체 종목</h1>
                <p className="text-xs text-muted-foreground">총 {stats.total}개 종목</p>
              </div>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-chart-1/10">
                  <TrendingUp className="h-4 w-4 text-chart-1" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">상승</p>
                  <p className="text-xl font-bold text-chart-1">{stats.rising}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-chart-2/10">
                  <TrendingDown className="h-4 w-4 text-chart-2" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">하락</p>
                  <p className="text-xl font-bold text-chart-2">{stats.falling}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-muted">
                  <div className="h-4 w-4 flex items-center justify-center text-muted-foreground font-bold text-xs">
                    -
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">보합</p>
                  <p className="text-xl font-bold text-foreground">{stats.unchanged}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Filter className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">필터링</p>
                  <p className="text-xl font-bold text-foreground">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-card border-border mb-6">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">필터 및 검색</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="종목명 또는 코드 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 bg-secondary border-border"
                />
              </div>
              <Select value={selectedMarket} onValueChange={(v) => setSelectedMarket(v as Market | "ALL")}>
                <SelectTrigger className="w-full md:w-[140px] bg-secondary border-border">
                  <SelectValue placeholder="시장" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">전체 시장</SelectItem>
                  <SelectItem value="KOSPI">KOSPI</SelectItem>
                  <SelectItem value="KOSDAQ">KOSDAQ</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedSector} onValueChange={setSelectedSector}>
                <SelectTrigger className="w-full md:w-[140px] bg-secondary border-border">
                  <SelectValue placeholder="섹터" />
                </SelectTrigger>
                <SelectContent>
                  {sectors.map((sector) => (
                    <SelectItem key={sector} value={sector}>
                      {sector === "ALL" ? "전체 섹터" : sector}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Stocks Table */}
        <Card className="bg-card border-border">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-[200px]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 -ml-2 font-medium"
                        onClick={() => handleSort("name")}
                      >
                        종목명
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 font-medium"
                        onClick={() => handleSort("price")}
                      >
                        현재가
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 font-medium"
                        onClick={() => handleSort("changePercent")}
                      >
                        등락률
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right hidden md:table-cell">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 font-medium"
                        onClick={() => handleSort("volume")}
                      >
                        거래량
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="text-right hidden lg:table-cell">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-2 font-medium"
                        onClick={() => handleSort("marketCap")}
                      >
                        시가총액
                        <ArrowUpDown className="ml-1 h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="hidden sm:table-cell">시장</TableHead>
                    <TableHead className="hidden lg:table-cell">섹터</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedStocks.map((stock) => (
                    <TableRow
                      key={stock.ticker}
                      className="border-border cursor-pointer hover:bg-secondary/50"
                      onClick={() => (window.location.href = `/stock/${stock.ticker}`)}
                    >
                      <TableCell>
                        <div>
                          <p className="font-medium text-foreground">{stock.name}</p>
                          <p className="text-xs text-muted-foreground">{stock.ticker}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium text-foreground">
                        {stock.price.toLocaleString()}원
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className={cn(
                            "inline-flex items-center gap-1 font-medium",
                            stock.changePercent > 0
                              ? "text-chart-1"
                              : stock.changePercent < 0
                                ? "text-chart-2"
                                : "text-muted-foreground",
                          )}
                        >
                          {stock.changePercent > 0 ? (
                            <TrendingUp className="h-3 w-3" />
                          ) : stock.changePercent < 0 ? (
                            <TrendingDown className="h-3 w-3" />
                          ) : null}
                          {stock.changePercent > 0 ? "+" : ""}
                          {stock.changePercent.toFixed(2)}%
                        </div>
                        <p
                          className={cn(
                            "text-xs",
                            stock.change > 0
                              ? "text-chart-1"
                              : stock.change < 0
                                ? "text-chart-2"
                                : "text-muted-foreground",
                          )}
                        >
                          {stock.change > 0 ? "+" : ""}
                          {stock.change.toLocaleString()}
                        </p>
                      </TableCell>
                      <TableCell className="text-right hidden md:table-cell text-muted-foreground">
                        {formatVolume(stock.volume)}
                      </TableCell>
                      <TableCell className="text-right hidden lg:table-cell text-muted-foreground">
                        {stock.marketCap}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <Badge
                          variant="outline"
                          className={cn(
                            "text-xs",
                            stock.market === "KOSPI"
                              ? "border-primary/50 text-primary"
                              : "border-chart-4/50 text-chart-4",
                          )}
                        >
                          {stock.market}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <Badge variant="secondary" className="text-xs bg-secondary text-muted-foreground">
                          {stock.sector}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredAndSortedStocks.length === 0 && (
              <div className="py-12 text-center text-muted-foreground">
                <p>검색 결과가 없습니다.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
