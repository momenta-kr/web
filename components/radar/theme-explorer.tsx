"use client"

import { useState, useMemo } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  TrendingUp,
  TrendingDown,
  Flame,
  Sparkles,
  Minus,
  Snowflake,
  Search,
  ChevronRight,
  BarChart3,
  Building2,
  Cpu,
  FileText,
  MapPin,
  MoreHorizontal,
  ExternalLink,
} from "lucide-react"
import { themesData, themeStats, generateThemeStocks, themeCategories } from "@/lib/mock-data"

const momentumConfig = {
  hot: { label: "급등", icon: Flame, color: "text-red-500 bg-red-500/10" },
  rising: { label: "상승", icon: TrendingUp, color: "text-orange-500 bg-orange-500/10" },
  stable: { label: "보합", icon: Minus, color: "text-muted-foreground bg-muted" },
  cooling: { label: "하락", icon: TrendingDown, color: "text-blue-500 bg-blue-500/10" },
  cold: { label: "급락", icon: Snowflake, color: "text-cyan-500 bg-cyan-500/10" },
}

const categoryConfig = {
  산업: { icon: Building2, color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
  정책: { icon: FileText, color: "bg-purple-500/10 text-purple-500 border-purple-500/20" },
  기술: { icon: Cpu, color: "bg-blue-500/10 text-blue-500 border-blue-500/20" },
  이슈: { icon: Sparkles, color: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
  지역: { icon: MapPin, color: "bg-rose-500/10 text-rose-500 border-rose-500/20" },
  기타: { icon: MoreHorizontal, color: "bg-gray-500/10 text-gray-500 border-gray-500/20" },
}

export function ThemeExplorer() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedMomentum, setSelectedMomentum] = useState<string | null>(null)
  const [selectedTheme, setSelectedTheme] = useState<typeof themesData[0] | null>(null)
  const [themeStocks, setThemeStocks] = useState<ReturnType<typeof generateThemeStocks>>([])

  const filteredThemes = useMemo(() => {
    return themesData.filter((theme) => {
      const matchesSearch =
        searchQuery === "" ||
        theme.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        theme.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesCategory = !selectedCategory || theme.category === selectedCategory
      const matchesMomentum = !selectedMomentum || theme.momentum === selectedMomentum
      return matchesSearch && matchesCategory && matchesMomentum
    })
  }, [searchQuery, selectedCategory, selectedMomentum])

  const hotThemes = useMemo(() => {
    return themesData.filter((t) => t.momentum === "hot").slice(0, 5)
  }, [])

  const handleThemeClick = (theme: typeof themesData[0]) => {
    setSelectedTheme(theme)
    setThemeStocks(generateThemeStocks(theme.id))
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">테마 탐색기</CardTitle>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="outline">{themeStats.totalThemes}개 테마</Badge>
            <Badge variant="outline">{themeStats.totalStocks}개 종목</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 인기 테마 */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Flame className="h-4 w-4 text-red-500" />
            <span className="text-sm font-medium">HOT 테마</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {hotThemes.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeClick(theme)}
                className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-500 transition-colors hover:bg-red-500/20"
              >
                <Flame className="h-3 w-3" />
                {theme.name}
                <span className="text-xs">
                  {theme.avgChangePercent > 0 ? "+" : ""}
                  {theme.avgChangePercent.toFixed(1)}%
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* 검색 및 필터 */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="테마명 또는 키워드 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* 카테고리 필터 */}
          <div className="flex flex-wrap gap-1.5">
            <Button
              variant={selectedCategory === null ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory(null)}
              className="h-7 text-xs"
            >
              전체
            </Button>
            {themeCategories.map((cat) => {
              const config = categoryConfig[cat]
              const Icon = config.icon
              return (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className="h-7 text-xs"
                >
                  <Icon className="mr-1 h-3 w-3" />
                  {cat}
                </Button>
              )
            })}
          </div>

          {/* 모멘텀 필터 */}
          <div className="flex flex-wrap gap-1.5">
            {(Object.keys(momentumConfig) as Array<keyof typeof momentumConfig>).map((key) => {
              const config = momentumConfig[key]
              const Icon = config.icon
              return (
                <button
                  key={key}
                  onClick={() => setSelectedMomentum(selectedMomentum === key ? null : key)}
                  className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                    selectedMomentum === key
                      ? "bg-primary text-primary-foreground"
                      : config.color
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  {config.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* 테마 목록 */}
        <ScrollArea className="h-[320px]">
          <div className="space-y-2 pr-4">
            {filteredThemes.map((theme) => {
              const momentum = momentumConfig[theme.momentum]
              const MomentumIcon = momentum.icon
              const category = categoryConfig[theme.category]
              const CategoryIcon = category.icon

              return (
                <button
                  key={theme.id}
                  onClick={() => handleThemeClick(theme)}
                  className="w-full rounded-lg border bg-card p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{theme.name}</span>
                        <Badge variant="outline" className={`${category.color} text-xs`}>
                          <CategoryIcon className="mr-1 h-3 w-3" />
                          {theme.category}
                        </Badge>
                        <Badge className={`${momentum.color} text-xs`}>
                          <MomentumIcon className="mr-1 h-3 w-3" />
                          {momentum.label}
                        </Badge>
                      </div>
                      <p className="line-clamp-1 text-xs text-muted-foreground">
                        {theme.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-right">
                      <div>
                        <p
                          className={`text-sm font-semibold ${
                            theme.avgChangePercent >= 0 ? "text-red-500" : "text-blue-500"
                          }`}
                        >
                          {theme.avgChangePercent >= 0 ? "+" : ""}
                          {theme.avgChangePercent.toFixed(2)}%
                        </p>
                        <p className="text-xs text-muted-foreground">{theme.stockCount}종목</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </ScrollArea>

        {/* 테마 상세 다이얼로그 */}
        <Dialog open={!!selectedTheme} onOpenChange={() => setSelectedTheme(null)}>
          <DialogContent className="max-w-2xl">
            {selectedTheme && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {selectedTheme.name}
                    <Badge className={momentumConfig[selectedTheme.momentum].color}>
                      {momentumConfig[selectedTheme.momentum].label}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">{selectedTheme.description}</p>

                  {/* 테마 통계 */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-lg font-bold">{selectedTheme.stockCount}</p>
                      <p className="text-xs text-muted-foreground">종목 수</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p
                        className={`text-lg font-bold ${
                          selectedTheme.avgChangePercent >= 0 ? "text-red-500" : "text-blue-500"
                        }`}
                      >
                        {selectedTheme.avgChangePercent >= 0 ? "+" : ""}
                        {selectedTheme.avgChangePercent.toFixed(2)}%
                      </p>
                      <p className="text-xs text-muted-foreground">평균 등락률</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <p className="text-lg font-bold">{selectedTheme.totalMarketCap}</p>
                      <p className="text-xs text-muted-foreground">시가총액</p>
                    </div>
                    <div className="rounded-lg bg-muted/50 p-3 text-center">
                      <Badge variant="outline" className={categoryConfig[selectedTheme.category].color}>
                        {selectedTheme.category}
                      </Badge>
                      <p className="mt-1 text-xs text-muted-foreground">카테고리</p>
                    </div>
                  </div>

                  {/* 연관 테마 */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">연관 테마</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedTheme.relatedThemes.map((rt) => (
                        <Badge key={rt} variant="outline">
                          {rt}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* 종목 목록 */}
                  <div className="space-y-2">
                    <p className="text-sm font-medium">테마 종목</p>
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-1">
                        {themeStocks.map((stock, idx) => (
                          <Link
                            key={stock.ticker}
                            href={`/stock/${stock.ticker}`}
                            className="flex items-center justify-between rounded-md p-2 transition-colors hover:bg-muted"
                            onClick={() => setSelectedTheme(null)}
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-6 text-center text-xs text-muted-foreground">
                                {idx + 1}
                              </span>
                              <div>
                                <p className="font-medium">{stock.name}</p>
                                <p className="text-xs text-muted-foreground">{stock.ticker}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <p className="font-medium">
                                  {stock.price.toLocaleString()}원
                                </p>
                                <p
                                  className={`text-xs ${
                                    stock.changePercent >= 0 ? "text-red-500" : "text-blue-500"
                                  }`}
                                >
                                  {stock.changePercent >= 0 ? "+" : ""}
                                  {stock.changePercent.toFixed(2)}%
                                </p>
                              </div>
                              <div className="w-16 text-right">
                                <div className="mb-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                  <div
                                    className="h-full rounded-full bg-primary"
                                    style={{ width: `${Math.min(stock.themeWeight, 100)}%` }}
                                  />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  비중 {stock.themeWeight.toFixed(1)}%
                                </p>
                              </div>
                              <ExternalLink className="h-4 w-4 text-muted-foreground" />
                            </div>
                          </Link>
                        ))}
                      </div>
                    </ScrollArea>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
