"use client"

import { useMemo, type ReactNode } from "react"
import Link from "next/link"
import {
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Volume2,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { Market } from "@/lib/types"
import { useTopGainers } from "@/domain/stock/queries/useTopGainers"
import { useTopLosers } from "@/domain/stock/queries/useTopLosers"
import { useVolumeRanking } from "@/domain/stock/queries/useVolumeRanking"
import type { Fluctuation } from "@/domain/stock/types/fluctuation.model"
import { TooltipProvider } from "@/components/ui/tooltip"
import { Card, CardContent, CardHeader } from "@/components/ui/card"

interface PriceMoversProps {
  market: Market
}

function formatNumber(n: number) {
  return n.toLocaleString("ko-KR")
}

/** ✅ rate 실제 부호 기준으로 + 붙이기 */
function formatSignedPercent(rate: number, digits = 2) {
  if (!Number.isFinite(rate)) return "-"
  const EPS = 1e-9
  const v = Math.abs(rate) < EPS ? 0 : rate
  return `${v > 0 ? "+" : ""}${v.toFixed(digits)}%`
}

/** ✅ 주식앱스럽게: ▲ 1,500 / ▼ 1,500 (0이면 0) */
function formatDeltaArrow(delta: number) {
  if (!Number.isFinite(delta)) return "-"
  if (delta > 0) return `▲ ${formatNumber(Math.abs(delta))}`
  if (delta < 0) return `▼ ${formatNumber(Math.abs(delta))}`
  return "0"
}

/** ✅ 거래량/거래대금 축약 */
const compactNumber = (n: number) => {
  const abs = Math.abs(n)
  if (abs >= 1_0000_0000) return `${(n / 1_0000_0000).toFixed(1)}억`
  if (abs >= 1_0000) return `${(n / 1_0000).toFixed(0)}만`
  return n.toLocaleString("ko-KR")
}

/** ✅ volume ranking에서 전일대비(원) 값이 있을 수도 있어서 유연하게 추출 */
function extractDeltaAmount(item: any): number | undefined {
  const candidates = [
    item?.changeFromPrevDay,
    item?.prevDayChangePrice,
    item?.prevDayChange,
    item?.changePrice,
    item?.priceChange,
    item?.change,
    item?.diff,
  ]

  for (const v of candidates) {
    if (typeof v === "number" && Number.isFinite(v)) return v
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v)
      if (Number.isFinite(n)) return n
    }
  }
  return undefined
}

// ✅ 상승=빨강 / 하락=파랑
const UP_TEXT = "text-red-500 dark:text-red-400"
const DOWN_TEXT = "text-blue-500 dark:text-blue-400"
const UP_BADGE = "bg-red-500/12 text-red-600 dark:bg-red-500/18 dark:text-red-400"
const DOWN_BADGE = "bg-blue-500/12 text-blue-600 dark:bg-blue-500/18 dark:text-blue-400"

// ✅ 전일대비(▲/▼)도 등락률 색과 동일하게 (상승=빨강, 하락=파랑)
const UP_DELTA = UP_TEXT
const DOWN_DELTA = DOWN_TEXT
const FLAT_DELTA = "text-muted-foreground"

function CardShell({
                     title,
                     icon,
                     subtitle,
                     children,
                     className,
                   }: {
  title: string
  icon: ReactNode
  subtitle: string
  children: ReactNode
  className?: string
}) {
  return (
    <Card className={cn("min-w-0 rounded-xl", className)}>
      <CardHeader className="px-3 py-2">
        <div className="flex items-center gap-2 min-w-0">
          {icon}
          <div className="min-w-0 flex items-baseline gap-2">
            <h3 className="text-xs font-semibold text-foreground truncate">{title}</h3>
            <span className="text-[11px] text-muted-foreground shrink-0">{subtitle}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">{children}</CardContent>
    </Card>
  )
}

function StateBlock({
                      isLoading,
                      isError,
                      isEmpty,
                    }: {
  isLoading: boolean
  isError: boolean
  isEmpty: boolean
}) {
  if (isLoading) return <div className="px-3 py-8 text-center text-xs text-muted-foreground">불러오는 중…</div>
  if (isError) return <div className="px-3 py-8 text-center text-xs text-destructive">데이터를 불러오지 못했어요.</div>
  if (isEmpty) return <div className="px-3 py-8 text-center text-xs text-muted-foreground">표시할 데이터가 없어요.</div>
  return null
}

function RankBadge({ rank, up }: { rank: number; up: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-md text-[10px] font-bold tabular-nums shrink-0",
        up ? UP_BADGE : DOWN_BADGE
      )}
    >
      {rank}
    </span>
  )
}

function RowLink({
                   href,
                   rank,
                   name,
                   subline,
                   price,
                   rate,
                   deltaAmount,
                   up,
                 }: {
  href: string
  rank: number
  name: string
  subline?: string
  price: string
  rate: number
  deltaAmount?: number
  up: boolean
}) {
  const RateIcon = up ? ArrowUpRight : ArrowDownRight
  const delta = typeof deltaAmount === "number" ? deltaAmount : undefined

  const deltaClass =
    delta == null
      ? "text-muted-foreground"
      : delta > 0
        ? UP_DELTA
        : delta < 0
          ? DOWN_DELTA
          : FLAT_DELTA

  return (
    <Link
      href={href}
      className={cn(
        "block px-3 py-2 transition-colors",
        "hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      )}
    >
      <div className="grid grid-cols-[20px_1fr_auto] items-center gap-2 min-w-0">
        <RankBadge rank={rank} up={up} />

        <div className="min-w-0">
          <div className="text-xs font-semibold text-foreground truncate">{name}</div>
          {subline ? (
            <div className="mt-0.5 text-[11px] text-muted-foreground truncate">{subline}</div>
          ) : null}
        </div>

        {/* ✅ 오른쪽: 가격 + (↗/↘ % + ▲/▼ 원) */}
        <div className="text-right tabular-nums shrink-0 min-w-[74px]">
          <div className="text-xs font-semibold text-foreground leading-none">{price}</div>

          {/* ✅ 폭 좁아도 가로스크롤 안 생기게 flex-wrap */}
          <div className="mt-1 flex flex-wrap items-center justify-end gap-x-1 gap-y-0.5 leading-none">
            <span
              className={cn(
                "inline-flex items-center gap-1 text-[11px] font-semibold",
                up ? UP_TEXT : DOWN_TEXT
              )}
            >
              <RateIcon className="h-3.5 w-3.5" />
              <span>{formatSignedPercent(rate)}</span>
            </span>

            {delta != null ? (
              <>
                <span className="text-[10px] text-muted-foreground">·</span>
                <span
                  className={cn(
                    "text-[11px] font-semibold tabular-nums whitespace-nowrap",
                    deltaClass
                  )}
                  aria-label="전일대비"
                  title="전일대비"
                >
                  {formatDeltaArrow(delta)}
                </span>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </Link>
  )
}

function MoversCard({
                      title,
                      icon,
                      tone,
                      items,
                      isLoading,
                      isError,
                    }: {
  title: string
  icon: ReactNode
  tone: "up" | "down"
  items: Fluctuation[]
  isLoading: boolean
  isError: boolean
}) {
  const empty = !isLoading && !isError && items.length === 0

  return (
    <CardShell title={title} icon={icon} subtitle="TOP 20">
      <StateBlock isLoading={isLoading} isError={isError} isEmpty={empty} />

      {!isLoading && !isError && items.length > 0 ? (
        <div className="divide-y divide-border">
          {items.map((s, idx) => {
            const href = `/stocks/${s.shortStockCode}`
            const rate = s.changeRateFromPrevDay
            const delta = s.changeFromPrevDay

            const up = Number.isFinite(rate) ? rate >= 0 : tone === "up"

            return (
              <RowLink
                key={`${title}:${s.shortStockCode}`}
                href={href}
                rank={idx + 1}
                name={s.stockName}
                subline={undefined}
                price={`${formatNumber(s.currentPrice)}원`}
                rate={rate}
                deltaAmount={delta}
                up={up}
              />
            )
          })}
        </div>
      ) : null}
    </CardShell>
  )
}

function VolumeCard({
                      items,
                      isLoading,
                      isError,
                    }: {
  items: any[]
  isLoading: boolean
  isError: boolean
}) {
  const empty = !isLoading && !isError && items.length === 0

  return (
    <CardShell
      title="거래량"
      icon={<Volume2 className="h-4 w-4 text-muted-foreground" />}
      subtitle="TOP 20"
    >
      <StateBlock isLoading={isLoading} isError={isError} isEmpty={empty} />

      {!isLoading && !isError && items.length > 0 ? (
        <div className="divide-y divide-border">
          {items.map((item: any, idx: number) => {
            const rank = item.rank ?? idx + 1
            const rate = Number(item.prevDayChangeRate ?? 0)
            const up = Number.isFinite(rate) ? rate >= 0 : true
            const deltaAmount = extractDeltaAmount(item)

            const volume =
              typeof item.volume === "number"
                ? item.volume
                : typeof item.tradeVolume === "number"
                  ? item.tradeVolume
                  : undefined

            const tradeAmount =
              typeof item.tradeAmount === "number"
                ? item.tradeAmount
                : typeof item.tradeValue === "number"
                  ? item.tradeValue
                  : undefined

            const sublineParts: string[] = []
            if (typeof volume === "number") sublineParts.push(`거래량 ${compactNumber(volume)}`)
            if (typeof tradeAmount === "number") sublineParts.push(`거래대금 ${compactNumber(tradeAmount)}`)
            const subline = sublineParts.join(" · ")

            return (
              <RowLink
                key={`vol:${item.stockCode ?? idx}`}
                href={`/stocks/${item.stockCode}`}
                rank={rank}
                name={item.stockName}
                subline={subline || undefined}
                price={`${item.currentPrice?.toLocaleString?.() ?? item.currentPrice}원`}
                rate={rate}
                deltaAmount={deltaAmount}
                up={up}
              />
            )
          })}
        </div>
      ) : null}
    </CardShell>
  )
}

export function PriceMovers({ market }: PriceMoversProps) {
  const { data: topGainers, isLoading: isLoadingG, isError: isErrorG } = useTopGainers()
  const { data: topLosers, isLoading: isLoadingL, isError: isErrorL } = useTopLosers()
  const { data: volumeRankings, isLoading: isLoadingV, isError: isErrorV } = useVolumeRanking()

  const gainers = useMemo(() => ((topGainers ?? []) as Fluctuation[]).slice(0, 20), [topGainers])
  const losers = useMemo(() => ((topLosers ?? []) as Fluctuation[]).slice(0, 20), [topLosers])
  const volumes = useMemo(() => (volumeRankings ?? []).slice(0, 20), [volumeRankings])

  return (
    <TooltipProvider delayDuration={150}>
      <div className="w-full">
        <div className="md:hidden space-y-3">
          <MoversCard
            title="상승"
            icon={<TrendingUp className={cn("h-4 w-4", UP_TEXT)} />}
            tone="up"
            items={gainers}
            isLoading={isLoadingG}
            isError={isErrorG}
          />
          <MoversCard
            title="하락"
            icon={<TrendingDown className={cn("h-4 w-4", DOWN_TEXT)} />}
            tone="down"
            items={losers}
            isLoading={isLoadingL}
            isError={isErrorL}
          />
          <VolumeCard items={volumes} isLoading={isLoadingV} isError={isErrorV} />
        </div>

        <div className="hidden md:grid grid-cols-3 gap-4">
          <MoversCard
            title="상승"
            icon={<TrendingUp className={cn("h-4 w-4", UP_TEXT)} />}
            tone="up"
            items={gainers}
            isLoading={isLoadingG}
            isError={isErrorG}
          />
          <MoversCard
            title="하락"
            icon={<TrendingDown className={cn("h-4 w-4", DOWN_TEXT)} />}
            tone="down"
            items={losers}
            isLoading={isLoadingL}
            isError={isErrorL}
          />
          <VolumeCard items={volumes} isLoading={isLoadingV} isError={isErrorV} />
        </div>
      </div>
    </TooltipProvider>
  )
}
