"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { generateFinancialData } from "@/lib/mock-data"

interface FinancialInfoProps {
  className?: string
}

export function FinancialInfo({ className }: FinancialInfoProps) {
  const data = useMemo(() => generateFinancialData(), [])

  const metrics = [
    { label: "PER", value: `${data.per}배`, description: "주가수익비율" },
    { label: "PBR", value: `${data.pbr}배`, description: "주가순자산비율" },
    { label: "EPS", value: `${data.eps.toLocaleString()}원`, description: "주당순이익" },
    { label: "BPS", value: `${data.bps.toLocaleString()}원`, description: "주당순자산" },
    { label: "배당수익률", value: `${data.dividendYield}%`, description: "연간 배당수익률" },
    { label: "ROE", value: `${data.roe}%`, description: "자기자본이익률" },
    { label: "부채비율", value: `${data.debtRatio}%`, description: "총부채/자기자본" },
    { label: "영업이익률", value: `${data.operatingMargin}%`, description: "영업이익/매출액" },
  ]

  return (
    <Card className={cn("bg-card border-border", className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">재무정보</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {metrics.map((metric) => (
            <div key={metric.label} className="p-3 rounded-lg bg-secondary/50">
              <p className="text-xs text-muted-foreground mb-1">{metric.label}</p>
              <p className="text-lg font-bold text-foreground">{metric.value}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
