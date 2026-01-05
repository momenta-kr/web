"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { cn } from "@/lib/utils"
import { generateAIInsight, stocksData } from "@/lib/mock-data"
import {
  Brain,
  TrendingUp,
  TrendingDown,
  Minus,
  AlertTriangle,
  CheckCircle2,
  Target,
  Shield,
  Lightbulb,
} from "lucide-react"

interface AIInsightProps {
  symbol: string
  className?: string
}

export function AIInsight({ symbol, className }: AIInsightProps) {
  const stock = stocksData.find((s) => s.ticker === symbol)
  const insight = useMemo(() => (stock ? generateAIInsight(stock) : null), [stock])

  if (!insight || !stock) return null

  const sentimentConfig = {
    bullish: {
      label: "긍정적",
      color: "text-emerald-500",
      bgColor: "bg-emerald-500/10",
      borderColor: "border-emerald-500/30",
      icon: TrendingUp,
    },
    bearish: {
      label: "부정적",
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      borderColor: "border-red-500/30",
      icon: TrendingDown,
    },
    neutral: {
      label: "중립",
      color: "text-muted-foreground",
      bgColor: "bg-muted/50",
      borderColor: "border-border",
      icon: Minus,
    },
  }

  const riskConfig = {
    low: { label: "낮음", color: "text-emerald-500", icon: Shield },
    medium: { label: "보통", color: "text-yellow-500", icon: AlertTriangle },
    high: { label: "높음", color: "text-red-500", icon: AlertTriangle },
  }

  const config = sentimentConfig[insight.sentiment]
  const riskInfo = riskConfig[insight.riskLevel]
  const SentimentIcon = config.icon
  const RiskIcon = riskInfo.icon

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle className="text-base font-semibold">AI 투자 인사이트</CardTitle>
          </div>
          <Badge variant="outline" className={cn(config.bgColor, config.color, config.borderColor)}>
            <SentimentIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Confidence Score */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">분석 신뢰도</span>
            <span className={cn("font-semibold", config.color)}>{insight.confidence}%</span>
          </div>
          <Progress value={insight.confidence} className="h-2" />
        </div>

        {/* Summary */}
        <div className={cn("p-3 rounded-lg border", config.bgColor, config.borderColor)}>
          <p className="text-sm text-foreground leading-relaxed">{insight.summary}</p>
        </div>

        {/* Key Points */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Lightbulb className="h-4 w-4 text-chart-4" />
            핵심 포인트
          </div>
          <ul className="space-y-1.5">
            {insight.keyPoints.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                <CheckCircle2 className={cn("h-4 w-4 mt-0.5 shrink-0", config.color)} />
                {point}
              </li>
            ))}
          </ul>
        </div>

        {/* Target Price */}
        <div className="space-y-2">
          <div className="flex items-center gap-1.5 text-sm font-medium text-foreground">
            <Target className="h-4 w-4 text-primary" />
            목표가 범위
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded-lg bg-red-500/10">
              <p className="text-xs text-muted-foreground mb-1">하단</p>
              <p className="text-sm font-bold text-red-500">{insight.targetPrice.low.toLocaleString()}원</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-primary/10">
              <p className="text-xs text-muted-foreground mb-1">중심</p>
              <p className="text-sm font-bold text-primary">{insight.targetPrice.mid.toLocaleString()}원</p>
            </div>
            <div className="text-center p-2 rounded-lg bg-emerald-500/10">
              <p className="text-xs text-muted-foreground mb-1">상단</p>
              <p className="text-sm font-bold text-emerald-500">{insight.targetPrice.high.toLocaleString()}원</p>
            </div>
          </div>
        </div>

        {/* Risk & Recommendation */}
        <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1.5 mb-1">
              <RiskIcon className={cn("h-4 w-4", riskInfo.color)} />
              <span className="text-xs text-muted-foreground">리스크</span>
            </div>
            <p className={cn("text-sm font-semibold", riskInfo.color)}>{riskInfo.label}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">투자의견</span>
            </div>
            <p className="text-xs font-medium text-foreground">{insight.recommendation}</p>
          </div>
        </div>

        {/* Disclaimer */}
        <p className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
          본 분석은 AI 기반 참고자료이며 투자 권유가 아닙니다
        </p>
      </CardContent>
    </Card>
  )
}
