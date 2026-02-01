"use client"

import React, { useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import type { StockCurrentPrice } from "@/domain/stock/types/stock-current-price.model"

function formatNumber(n: number | null | undefined, digits = 0) {
  if (n == null || !Number.isFinite(n)) return "-"
  return n.toLocaleString("ko-KR", { maximumFractionDigits: digits, minimumFractionDigits: digits })
}

function formatKoreanMoney(n: number | null | undefined) {
  if (n == null || !Number.isFinite(n)) return "-"
  const abs = Math.abs(n)
  const JO = 1_000_000_000_000
  const EOK = 100_000_000
  const MAN = 10_000
  if (abs >= JO) return `${(n / JO).toFixed(2)}조`
  if (abs >= EOK) return `${(n / EOK).toFixed(1)}억`
  if (abs >= MAN) return `${(n / MAN).toFixed(1)}만`
  return n.toLocaleString("ko-KR")
}

function ynBadge(label: string, yn: string) {
  const ok = (yn ?? "").toUpperCase() === "Y"
  return (
    <Badge
      variant="outline"
      className={cn(
        "text-[11px]",
        ok ? "border-chart-1/30 bg-chart-1/10 text-chart-1" : "border-border bg-secondary/40 text-muted-foreground",
      )}
    >
      {label} {ok ? "Y" : "N"}
    </Badge>
  )
}

function infoBadge(label: string, value?: string) {
  const v = (value ?? "").trim()
  if (!v) return null
  return (
    <Badge variant="outline" className="text-[11px] border-border bg-secondary/40 text-muted-foreground">
      {label}: {v}
    </Badge>
  )
}

export function StockKisQuotePanel({
                                     quote,
                                     fallbackName,
                                     fallbackTicker,
                                   }: {
  quote?: StockCurrentPrice
  fallbackName?: string
  fallbackTicker?: string
}) {
  const view = useMemo(() => {
    const q = quote
    if (!q) {
      return {
        name: fallbackName ?? "종목",
        ticker: fallbackTicker ?? "",
        current: 0,
        change: 0,
        changePct: 0,
        prevClose: 0,
      }
    }

    const prevClose = q.currentPrice - q.changeFromPreviousDay
    return {
      name: fallbackName ?? "종목",
      ticker: q.stockShortCode || fallbackTicker || "",
      current: q.currentPrice,
      change: q.changeFromPreviousDay,
      changePct: q.changeRateFromPreviousDay,
      prevClose,
    }
  }, [quote, fallbackName, fallbackTicker])

  if (!quote) {
    return (
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold">현재가 상세</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 rounded-lg bg-secondary/50" />
          <p className="mt-2 text-xs text-muted-foreground">현재가 데이터를 불러오는 중…</p>
        </CardContent>
      </Card>
    )
  }

  const q = quote
  const isUp = q.changeFromPreviousDay >= 0

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold">현재가 상세</CardTitle>
          <Badge
            variant="outline"
            className={cn(
              "text-[11px]",
              isUp ? "border-chart-1/30 bg-chart-1/10 text-chart-1" : "border-chart-2/30 bg-chart-2/10 text-chart-2",
            )}
          >
            {isUp ? "상승" : "하락"} {isUp ? "+" : ""}
            {formatNumber(q.changeRateFromPreviousDay, 2)}%
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* 1) 상태/리스크 뱃지 */}
        <div className="flex flex-wrap gap-2">
          {ynBadge("신용", q.creditAvailableYn)}
          {ynBadge("공매도", q.shortSellingAvailableYn)}
          {ynBadge("투자유의", q.investmentCautionYn)}
          {ynBadge("단기과열", q.shortTermOverheatedYn)}
          {ynBadge("정리매매", q.liquidationTradeYn)}
          {ynBadge("관리", q.managedStockYn)}
          {infoBadge("시장", q.representativeMarketKoreanName)}
          {infoBadge("업종", q.industryKoreanName)}
          {infoBadge("경고코드", q.marketWarningCode)}
          {infoBadge("VI", q.viAppliedClassificationCode)}
        </div>

        {/* 2) 핵심 가격 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-[11px] text-muted-foreground">현재가</p>
            <p className="mt-1 text-lg font-bold text-foreground">{formatNumber(q.currentPrice, 0)}원</p>
            <p className="text-[11px] text-muted-foreground">
              전일종가 {formatNumber(view.prevClose, 0)}원
            </p>
          </div>

          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-[11px] text-muted-foreground">시가/고가/저가</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatNumber(q.openPrice, 0)} / {formatNumber(q.highPrice, 0)} / {formatNumber(q.lowPrice, 0)}
            </p>
            <p className="text-[11px] text-muted-foreground">기준가 {formatNumber(q.basePrice, 0)}원</p>
          </div>

          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-[11px] text-muted-foreground">상/하한</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              {formatNumber(q.upperLimitPrice, 0)} / {formatNumber(q.lowerLimitPrice, 0)}
            </p>
            <p className="text-[11px] text-muted-foreground">가중평균 {formatNumber(q.weightedAveragePrice, 0)}원</p>
          </div>

          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-[11px] text-muted-foreground">거래</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              거래량 {formatNumber(q.accumulatedVolume, 0)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              거래대금 {formatKoreanMoney(q.accumulatedTradeAmount)} · 전일비 거래량비율 {formatNumber(q.volumeChangeRateFromPreviousDay, 2)}%
            </p>
          </div>
        </div>

        {/* 3) 고저/기간 */}
        <div className="rounded-lg border border-border bg-background/50 p-3">
          <p className="text-xs text-muted-foreground">기간 고저</p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-muted-foreground">
            <div>
              52주 최고/일자: <span className="text-foreground font-medium">{formatNumber(q.week52HighPrice, 0)}</span> ·{" "}
              <span className="text-foreground font-medium">{q.week52HighPriceDate || "-"}</span>
            </div>
            <div>
              52주 최저/일자: <span className="text-foreground font-medium">{formatNumber(q.week52LowPrice, 0)}</span> ·{" "}
              <span className="text-foreground font-medium">{q.week52LowPriceDate || "-"}</span>
            </div>
            <div>
              연중 최고/일자: <span className="text-foreground font-medium">{formatNumber(q.yearlyHighPrice, 0)}</span> ·{" "}
              <span className="text-foreground font-medium">{q.yearlyHighPriceDate || "-"}</span>
            </div>
            <div>
              연중 최저/일자: <span className="text-foreground font-medium">{formatNumber(q.yearlyLowPrice, 0)}</span> ·{" "}
              <span className="text-foreground font-medium">{q.yearlyLowPriceDate || "-"}</span>
            </div>
            <div>
              250일 최고/일자: <span className="text-foreground font-medium">{formatNumber(q.day250HighPrice, 0)}</span> ·{" "}
              <span className="text-foreground font-medium">{q.day250HighPriceDate || "-"}</span>
            </div>
            <div>
              250일 최저/일자: <span className="text-foreground font-medium">{formatNumber(q.day250LowPrice, 0)}</span> ·{" "}
              <span className="text-foreground font-medium">{q.day250LowPriceDate || "-"}</span>
            </div>
          </div>
        </div>

        {/* 4) 펀더멘털/외국인 */}
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-[11px] text-muted-foreground">밸류</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              PER {formatNumber(q.per, 2)} · PBR {formatNumber(q.pbr, 2)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              EPS {formatNumber(q.eps, 0)} · BPS {formatNumber(q.bps, 0)}
            </p>
          </div>

          <div className="rounded-lg bg-secondary/50 p-3">
            <p className="text-[11px] text-muted-foreground">외국인/프로그램</p>
            <p className="mt-1 text-sm font-semibold text-foreground">
              외인순매수 {formatNumber(q.foreignNetBuyQuantity, 0)}
            </p>
            <p className="text-[11px] text-muted-foreground">
              프로그램 {formatNumber(q.programNetBuyQuantity, 0)} · 소진율 {formatNumber(q.htsForeignExhaustionRate, 2)}%
            </p>
          </div>
        </div>

        {/* 5) 시총/주식 */}
        <div className="rounded-lg bg-secondary/50 p-3">
          <p className="text-[11px] text-muted-foreground">시총/주식</p>
          <p className="mt-1 text-sm font-semibold text-foreground">
            시총(HTS) {formatKoreanMoney(q.htsMarketCap)} · 상장주식수 {formatNumber(q.listedShares, 0)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            액면가 {formatNumber(q.faceValue, 0)} · 자본금 {formatKoreanMoney(q.capitalAmount)} · 결산월 {q.settlementMonth || "-"}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
