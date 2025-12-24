"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { generateNewsItems } from "@/lib/mock-data"
import { Newspaper, FileText, TrendingUp, TrendingDown, Minus } from "lucide-react"

interface NewsFeedProps {
  stockName: string
  className?: string
}

export function NewsFeed({ stockName, className }: NewsFeedProps) {
  const news = useMemo(() => generateNewsItems(stockName), [stockName])

  const sentimentIcons = {
    positive: TrendingUp,
    negative: TrendingDown,
    neutral: Minus,
  }

  const sentimentColors = {
    positive: "text-chart-1",
    negative: "text-chart-2",
    neutral: "text-muted-foreground",
  }

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">뉴스 / 공시</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 max-h-[400px] overflow-y-auto">
        {news.map((item) => {
          const SentimentIcon = item.sentiment ? sentimentIcons[item.sentiment] : Minus

          return (
            <div
              key={item.id}
              className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5">
                  {item.type === "news" ? (
                    <Newspaper className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <FileText className="h-4 w-4 text-chart-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground line-clamp-2">{item.title}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge variant="outline" className="text-xs py-0">
                      {item.source}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{item.time}</span>
                    {item.sentiment && <SentimentIcon className={cn("h-3 w-3", sentimentColors[item.sentiment])} />}
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
