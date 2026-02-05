"use client"

import { useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { generateNewsItems } from "@/lib/mock-data"
import {
  Newspaper,
  FileText,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react"

interface NewsAnalysisProps {
  stockName: string
  className?: string
  /** 곧 출시 표시/비활성화 */
  comingSoon?: boolean
}

export function NewsAnalysis({ stockName, className, comingSoon = true }: NewsAnalysisProps) {
  const news = useMemo(() => generateNewsItems(stockName), [stockName])
  const [filter, setFilter] = useState<"all" | "positive" | "negative">("all")

  const positiveNews = news.filter((n) => n.sentiment === "positive")
  const negativeNews = news.filter((n) => n.sentiment === "negative")
  const neutralNews = news.filter((n) => n.sentiment === "neutral")

  const filteredNews = filter === "all" ? news : news.filter((n) => n.sentiment === filter)

  const getImpactColor = (score: number) => {
    if (score >= 50) return "text-emerald-500"
    if (score >= 20) return "text-green-400"
    if (score > -20) return "text-muted-foreground"
    if (score > -50) return "text-orange-400"
    return "text-red-500"
  }

  const getImpactIcon = (score: number) => {
    if (score >= 20) return CheckCircle2
    if (score > -20) return Info
    return AlertTriangle
  }

  return (
    <Card className={cn("relative overflow-hidden bg-card border-border", className)} aria-disabled={comingSoon}>
      {/* ✅ 곧 출시 오버레이 (불투명 배경 + 블러) */}
      {comingSoon && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/85 backdrop-blur-sm">
          <div className="text-center px-6">
            <Badge className="gap-1.5 rounded-full bg-primary/10 text-primary border border-primary/30">
              <Sparkles className="h-3.5 w-3.5" />
              곧 출시
            </Badge>
            <p className="mt-2 text-sm text-muted-foreground">
              AI 뉴스 분석 기능은 현재 준비 중입니다.
            </p>
          </div>
        </div>
      )}

      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-chart-4" />
            <CardTitle className="text-base font-semibold">AI 뉴스 분석</CardTitle>
          </div>
          <div className="flex gap-1">
            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">
              호재 {positiveNews.length}
            </Badge>
            <Badge variant="outline" className="bg-red-500/10 text-red-500 border-red-500/30">
              악재 {negativeNews.length}
            </Badge>
          </div>
        </div>
      </CardHeader>

      {/* ✅ 오버레이 뒤 콘텐츠는 살짝 흐리게(선택) */}
      <CardContent className={cn("space-y-4", comingSoon && "opacity-40")}>
        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
          <TabsList className="grid w-full grid-cols-3 bg-secondary">
            <TabsTrigger value="all" className="text-sm">
              전체
            </TabsTrigger>
            <TabsTrigger
              value="positive"
              className="text-sm data-[state=active]:bg-emerald-500/20 data-[state=active]:text-emerald-500"
            >
              호재
            </TabsTrigger>
            <TabsTrigger
              value="negative"
              className="text-sm data-[state=active]:bg-red-500/20 data-[state=active]:text-red-500"
            >
              악재
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* News List */}
        <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {filteredNews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">해당 카테고리의 뉴스가 없습니다</div>
          ) : (
            filteredNews.map((item) => {
              const ImpactIcon = getImpactIcon(item.impactScore || 0)

              return (
                <div
                  key={item.id}
                  className={cn(
                    "rounded-lg border p-4 transition-all",
                    item.sentiment === "positive" && "border-emerald-500/30 bg-emerald-500/5",
                    item.sentiment === "negative" && "border-red-500/30 bg-red-500/5",
                    item.sentiment === "neutral" && "border-border bg-muted/30",
                  )}
                >
                  {/* Header */}
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">
                      {item.type === "news" ? (
                        <Newspaper className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <FileText className="h-4 w-4 text-chart-4" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      {/* Title + Sentiment Icon */}
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-foreground leading-tight line-clamp-2">{item.title}</p>
                        <div className="flex items-center gap-1 shrink-0">
                          {item.sentiment === "positive" && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                          {item.sentiment === "negative" && <TrendingDown className="h-4 w-4 text-red-500" />}
                          {item.sentiment === "neutral" && <Minus className="h-4 w-4 text-muted-foreground" />}
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <Badge variant="outline" className="text-xs py-0">
                          {item.source}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{item.time}</span>
                        {item.impactScore !== undefined && (
                          <div className="flex items-center gap-1">
                            <ImpactIcon className={cn("h-3 w-3", getImpactColor(item.impactScore))} />
                            <span className={cn("text-xs font-semibold", getImpactColor(item.impactScore))}>
                              영향도 {item.impactScore > 0 ? "+" : ""}
                              {item.impactScore}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* AI 한줄 요약 */}
                      <div className="mt-3 p-2 rounded-md bg-background/50 border border-border/50">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Sparkles className="h-3 w-3 text-chart-4" />
                          <span className="text-xs font-medium text-chart-4">AI 판단</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                          {item.aiSummary || "AI 분석을 준비 중입니다..."}
                        </p>
                      </div>

                      {/* Keywords + 원문 보기 */}
                      <div className="flex items-center justify-between mt-3 gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                          {item.keywords?.slice(0, 3).map((keyword, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs py-0">
                              #{keyword}
                            </Badge>
                          ))}
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs gap-1 shrink-0 border-primary/50 text-primary hover:bg-primary/10 bg-transparent"
                          asChild
                        >
                          <a href={item.url || "#"} target="_blank" rel="noopener noreferrer">
                            원문 보기
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border">
          <div className="text-center p-3 rounded-lg bg-emerald-500/10">
            <div className="text-2xl font-bold text-emerald-500">{positiveNews.length}</div>
            <div className="text-xs text-muted-foreground">호재</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-muted/50">
            <div className="text-2xl font-bold text-muted-foreground">{neutralNews.length}</div>
            <div className="text-xs text-muted-foreground">중립</div>
          </div>
          <div className="text-center p-3 rounded-lg bg-red-500/10">
            <div className="text-2xl font-bold text-red-500">{negativeNews.length}</div>
            <div className="text-xs text-muted-foreground">악재</div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
