"use client"

import { useEffect, useMemo, useState } from "react"
import { TrendingUp } from "lucide-react"
import { useIndustryIndexItem } from "@/domain/stock/queries/useIndustryIndexItem"
import { TooltipProvider } from "@/components/ui/tooltip"
import { ResponsiveContainer, Treemap, Tooltip as RechartsTooltip } from "recharts"

type SortKey = "changeRate" | "tradeAmountRatio" | "accumulatedTradeAmount"
const DEFAULT_SORT: SortKey = "changeRate"

function formatNumber(n: number) {
  return n.toLocaleString("ko-KR")
}

const num = (v: unknown, fallback = 0) => {
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : fallback
}

function formatCompact(n: number) {
  const abs = Math.abs(n)
  if (abs >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`
  if (abs >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (abs >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return formatNumber(n)
}

function formatKoreanMoney(n: number) {
  const abs = Math.abs(n)
  const JO = 1_0000_0000_0000
  const EOK = 100_000_000
  if (abs >= JO) return `${(n / JO).toFixed(1)}조`
  if (abs >= EOK) return `${(n / EOK).toFixed(1)}억`
  return formatNumber(n)
}

type TreemapNode = {
  name: string
  code: string
  size: number
  changeRate: number
  changeFromPreviousDay: number
  tradeAmountRatio: number
  accumulatedTradeAmount: number
  accumulatedVolume: number
  volumeRatio: number
  currentIndexPrice: number
}

/** HEX 팔레트 (라이트/다크) */
const LIGHT = {
  up: "#EF4444",
  down: "#3B82F6",
  neutral: "#9CA3AF",
  border: "#E5E7EB",
  fg: "#111827",
  bg: "#FFFFFF",
  mutedText: "#6B7280",
}

const DARK = {
  up: "#F87171",
  down: "#60A5FA",
  neutral: "#6B7280",
  border: "#374151",
  fg: "#F9FAFB",
  bg: "#111827",
  mutedText: "#9CA3AF",
}

type Palette = typeof LIGHT

function usePalette(): Palette {
  const [palette, setPalette] = useState<Palette>(LIGHT)

  useEffect(() => {
    const get = () => (document.documentElement.classList.contains("dark") ? DARK : LIGHT)
    setPalette(get())

    const obs = new MutationObserver(() => setPalette(get()))
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] })
    return () => obs.disconnect()
  }, [])

  return palette
}

const getFillByChangeRate = (cr: number, colors: Palette) => {
  if (cr > 0) return colors.up
  if (cr < 0) return colors.down
  return colors.neutral
}

function CustomNode(props: any) {
  const { x, y, width, height, colors, hoveredCode, setHoveredCode } = props as {
    x: number
    y: number
    width: number
    height: number
    colors: Palette
    hoveredCode: string | null
    setHoveredCode: (code: string | null) => void
  }

  const payload = (props?.payload ?? {}) as Partial<TreemapNode>

  const name =
    (typeof props?.name === "string" && props.name) ||
    (typeof payload?.name === "string" && payload.name) ||
    ""

  const code =
    (typeof payload?.code === "string" && payload.code) ||
    (typeof (props as any)?.code === "string" && (props as any).code) ||
    ""

  const changeRate = Number.isFinite(payload.changeRate as any)
    ? (payload.changeRate as number)
    : num((props as any)?.changeRate, 0)

  const fill = getFillByChangeRate(changeRate, colors)

  // 라벨 조건
  const canShowText = width >= 45 && height >= 18
  const canShowSub = width >= 75 && height >= 36

  const isHover = !!code && hoveredCode === code

  // 텍스트 가독성(배경색 위에서)
  const textStyle = {
    paintOrder: "stroke" as const,
    stroke: colors.bg,
    strokeWidth: 3,
  }

  return (
    <g
      onMouseEnter={() => code && setHoveredCode(code)}
      onMouseLeave={() => setHoveredCode(null)}
      style={{ cursor: code ? "pointer" : "default" }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={fill}
        fillOpacity={isHover ? 0.55 : 0.35}
        stroke={isHover ? colors.fg : colors.border}
        strokeOpacity={isHover ? 0.35 : 0.95}
        strokeWidth={isHover ? 2 : 1}
        style={{
          transition: "fill-opacity 120ms ease, stroke-opacity 120ms ease, stroke-width 120ms ease",
        }}
      />

      <rect
        x={x + 0.5}
        y={y + 0.5}
        width={Math.max(0, width - 1)}
        height={Math.max(0, height - 1)}
        fill="transparent"
        stroke={colors.fg}
        strokeOpacity={isHover ? 0.16 : 0.06}
        style={{ transition: "stroke-opacity 120ms ease" }}
      />

      {canShowText && name && (
        <>
          <text
            x={x + 8}
            y={y + 6}
            fontSize={12}
            fill={colors.fg}
            opacity={0.98}
            dominantBaseline="hanging"
            pointerEvents="none"
            style={textStyle}
          >
            {name.length > 10 ? `${name.slice(0, 10)}…` : name}
          </text>

          {canShowSub && (
            <text
              x={x + 8}
              y={y + 24}
              fontSize={12}
              fill={colors.fg}
              opacity={0.9}
              dominantBaseline="hanging"
              pointerEvents="none"
              style={textStyle}
            >
              {(changeRate > 0 ? "+" : "") + changeRate.toFixed(2)}%
            </text>
          )}
        </>
      )}
    </g>
  )
}

function CustomTooltip({
                         active,
                         payload,
                         sortKey,
                         colors,
                       }: {
  active?: boolean
  payload?: any[]
  sortKey: SortKey
  colors: Palette
}) {
  const p = payload?.[0]?.payload as Partial<TreemapNode> | undefined
  if (!active || !p || typeof p.name !== "string") return null

  const metricLabel =
    sortKey === "changeRate" ? "등락률" : sortKey === "tradeAmountRatio" ? "자금쏠림" : "거래대금"

  const metricValue =
    sortKey === "changeRate"
      ? `${(p.changeRate ?? 0) > 0 ? "+" : ""}${(p.changeRate ?? 0).toFixed(2)}%`
      : sortKey === "tradeAmountRatio"
        ? `${(p.tradeAmountRatio ?? 0).toFixed(1)}%`
        : formatKoreanMoney(p.accumulatedTradeAmount ?? 0)

  return (
    <div
      className="rounded-md px-3 py-2 shadow-sm"
      style={{
        background: colors.bg,
        border: `1px solid ${colors.border}`,
      }}
    >
      <div className="text-sm font-semibold" style={{ color: colors.fg }}>
        {p.name}
      </div>
      <div className="mt-1 text-xs" style={{ color: colors.mutedText }}>
        코드 {p.code ?? "-"}
      </div>

      <div className="mt-2 space-y-1 text-xs">
        <div className="flex items-center justify-between gap-4">
          <span style={{ color: colors.mutedText }}>{metricLabel}</span>
          <span className="font-medium tabular-nums" style={{ color: colors.fg }}>
            {metricValue}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span style={{ color: colors.mutedText }}>지수</span>
          <span className="font-medium tabular-nums" style={{ color: colors.fg }}>
            {Math.round(p.currentIndexPrice ?? 0).toLocaleString()}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span style={{ color: colors.mutedText }}>등락</span>
          <span className="font-medium tabular-nums" style={{ color: colors.fg }}>
            {(p.changeFromPreviousDay ?? 0) >= 0 ? "▲" : "▼"}
            {Math.abs(p.changeFromPreviousDay ?? 0).toFixed(2)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span style={{ color: colors.mutedText }}>거래량</span>
          <span className="font-medium tabular-nums" style={{ color: colors.fg }}>
            {formatCompact(p.accumulatedVolume ?? 0)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span style={{ color: colors.mutedText }}>관심도</span>
          <span className="font-medium tabular-nums" style={{ color: colors.fg }}>
            {(p.volumeRatio ?? 0).toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  )
}

export function SectorIndices() {
  const { data, isLoading, isError } = useIndustryIndexItem()
  const colors = usePalette()
  const sortKey: SortKey = DEFAULT_SORT

  const [hoveredCode, setHoveredCode] = useState<string | null>(null)

  const treemapData: TreemapNode[] = useMemo(() => {
    const base = [...(data ?? [])]

    // ✅ 1) 먼저 노드로 변환하면서 size 계산
    const nodes = base
      .map((item) => {
        const changeRate = num((item as any).changeRate)
        const tradeAmountRatio = num((item as any).tradeAmountRatio)
        const accumulatedTradeAmount = num((item as any).accumulatedTradeAmount)
        const accumulatedVolume = num((item as any).accumulatedVolume)
        const volumeRatio = num((item as any).volumeRatio)
        const currentIndexPrice = num((item as any).currentIndexPrice)
        const changeFromPreviousDay = num((item as any).changeFromPreviousDay)

        const size =
          sortKey === "changeRate"
            ? Math.max(0.01, Math.abs(changeRate))
            : sortKey === "tradeAmountRatio"
              ? Math.max(0.01, tradeAmountRatio)
              : Math.max(0.01, Math.log10(accumulatedTradeAmount + 1))

        return {
          name: String((item as any).industryName ?? ""),
          code: String((item as any).industryCode ?? ""),
          size,
          changeRate,
          changeFromPreviousDay,
          tradeAmountRatio,
          accumulatedTradeAmount,
          accumulatedVolume,
          volumeRatio,
          currentIndexPrice,
        } satisfies TreemapNode
      })
      .filter((x) => x.name && x.code && Number.isFinite(x.size))

    // ✅ 2) "제일 큰 사이즈"가 배열의 첫 요소가 되게 정렬
    //    (Recharts treemap은 입력 순서 영향이 있어, 이렇게 하면 큰 타일이 좌상단부터 시작하는 경우가 대부분 안정적으로 나옴)
    nodes.sort((a, b) => {
      const d = b.size - a.size
      if (Math.abs(d) > 1e-12) return d
      // tie-breaker: 변화율 큰 것 우선 → 그래도 같으면 이름으로 고정
      const d2 = Math.abs(b.changeRate) - Math.abs(a.changeRate)
      if (Math.abs(d2) > 1e-12) return d2
      return a.name.localeCompare(b.name, "ko-KR")
    })

    return nodes
  }, [data, sortKey])

  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-w-0 w-full">
        {/* ✅ 헤더: 모바일에서 세로로(공간 확보), sm 이상은 가로 */}
        <div className="flex flex-col items-start gap-1 mb-3 min-w-0 sm:flex-row sm:items-center sm:gap-2">
          <TrendingUp className="h-4 w-4 text-primary shrink-0" />
          <div className="text-sm font-semibold truncate">업종별 지수</div>
        </div>

        {/* 바디 */}
        {isLoading && <div className="text-sm text-muted-foreground">불러오는 중…</div>}
        {isError && <div className="text-sm text-destructive">업종 지수를 불러오지 못했어요.</div>}
        {!isLoading && !isError && treemapData.length === 0 && (
          <div className="text-sm text-muted-foreground">표시할 데이터가 없어요.</div>
        )}

        {!isLoading && !isError && treemapData.length > 0 && (
          // ✅ 모바일에서 "세로로 길게" (vh + min/max로 안정화), sm 이상은 기존 높이
          <div className="w-full min-w-0 h-[80vh] min-h-[600px] max-h-[820px] sm:h-[460px] sm:min-h-0 sm:max-h-none">
            <ResponsiveContainer width="100%" height="100%" minWidth={280} minHeight={240}>
              <Treemap
                data={treemapData}
                dataKey="size"
                nameKey="name"
                stroke={colors.border}
                isAnimationActive={false}
                content={(p: any) => (
                  <CustomNode
                    {...p}
                    colors={colors}
                    hoveredCode={hoveredCode}
                    setHoveredCode={setHoveredCode}
                  />
                )}
              >
                <RechartsTooltip
                  content={(p: any) => <CustomTooltip {...p} sortKey={sortKey} colors={colors} />}
                  cursor={{ stroke: colors.fg, strokeOpacity: 0.12 }}
                />
              </Treemap>
            </ResponsiveContainer>

            <div className="mt-2 text-[11px] text-muted-foreground">
              면적: 등락률(절대값) · 색상: 등락률(상승/하락)
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
}
