"use client"

import { useEffect, useMemo, useRef } from "react"
import {
  createChart,
  CrosshairMode,
  ColorType,
  CandlestickSeries,
  HistogramSeries,
  LineSeries,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
  type Time,
  type CandlestickData,
  type HistogramData,
  type LineData,
  type MouseEventParams,
} from "lightweight-charts"

type Period = "D" | "W" | "M" | "Y"

export type CandlePoint = {
  date: string // "YYYYMMDD"
  open: number
  high: number
  low: number
  close: number
  volume: number
  ma5?: number | null
  ma20?: number | null
  ma60?: number | null
  ma120?: number | null
}

type Props = {
  data: CandlePoint[]
  period: Period
  height?: number
  refLines?: {
    prevClose?: number | null
    dayHigh?: number | null
    dayLow?: number | null
  }
  onRequestMore?: (fromIso: string, toIso: string) => void
  isFetchingMore?: boolean
}

// ====== HEX ONLY UI COLORS ======
const UI_FG = "#111827"
const UI_MUTED = "#6B7280"
const UI_BORDER = "#E5E7EB"
const UI_PANEL_BG = "#FFFFFFF2"
const UI_PANEL_SHADOW = "0 8px 24px rgba(0,0,0,0.12)"

// ====== SERIES COLORS ======
const UP_COLOR = "#E11D48"
const DOWN_COLOR = "#2563EB"

const MA5_COLOR = "#F59E0B"
const MA20_COLOR = "#22C55E"
const MA60_COLOR = "#A855F7"
const MA120_COLOR = "#06B6D4"

function yyyymmddToUTCSeconds(date: string): UTCTimestamp {
  const y = Number(date.slice(0, 4))
  const m = Number(date.slice(4, 6))
  const d = Number(date.slice(6, 8))
  return (Date.UTC(y, m - 1, d) / 1000) as UTCTimestamp
}

function timeToUTCDate(time: Time): Date {
  if (typeof time === "number") return new Date(time * 1000)
  if (typeof time === "string") return new Date(time)
  return new Date(Date.UTC(time.year, time.month - 1, time.day))
}

function fmtYYYYMMDD(time: Time) {
  const d = timeToUTCDate(time)
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(d.getUTCDate()).padStart(2, "0")
  return `${yyyy}.${mm}.${dd}`
}

function toIsoDateUTC(d: Date) {
  const yyyy = d.getUTCFullYear()
  const mm = String(d.getUTCMonth() + 1).padStart(2, "0")
  const dd = String(d.getUTCDate()).padStart(2, "0")
  return `${yyyy}-${mm}-${dd}` // LocalDate.parse용
}

function addDaysUTC(date: Date, days: number) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000)
}

function periodToVisibleBars(p: Period) {
  if (p === "D") return 30
  if (p === "W") return 60
  if (p === "M") return 140
  return 260
}

function periodToChunkDays(p: Period) {
  // ✅ "최대 100개 제한"이어도 날짜 범위는 넉넉히 주고,
  // 백엔드/KIS가 100개로 잘라주게 두는 게 안전함
  if (p === "D") return 140
  if (p === "W") return 380
  if (p === "M") return 800
  return 1200
}

function n0(x: unknown) {
  const v = typeof x === "number" ? x : Number(x)
  return Number.isFinite(v) ? v : 0
}

function fmtNum(v: unknown, digits = 0) {
  const x = n0(v)
  return Math.round(x).toLocaleString("ko-KR", {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  })
}

function fmtVol(v: unknown) {
  const x = n0(v)
  return Math.round(x).toLocaleString("ko-KR")
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v))
}

export default function LightweightStockChart({
                                                data,
                                                period,
                                                height = 350,
                                                refLines,
                                                onRequestMore,
                                                isFetchingMore,
                                              }: Props) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const tooltipRef = useRef<HTMLDivElement | null>(null)
  const tooltipSideRef = useRef<"left" | "right">("right")

  const yearOverlayRef = useRef<HTMLDivElement | null>(null)
  const hoverOverlayRef = useRef<HTMLDivElement | null>(null)
  const hoverLineElRef = useRef<HTMLDivElement | null>(null)

  const chartRef = useRef<IChartApi | null>(null)

  const candleRef = useRef<ISeriesApi<"Candlestick"> | null>(null)
  const volRef = useRef<ISeriesApi<"Histogram"> | null>(null)
  const ma5Ref = useRef<ISeriesApi<"Line"> | null>(null)
  const ma20Ref = useRef<ISeriesApi<"Line"> | null>(null)
  const ma60Ref = useRef<ISeriesApi<"Line"> | null>(null)
  const ma120Ref = useRef<ISeriesApi<"Line"> | null>(null)

  // ✅ 중복 호출 방지
  const lastRequestKeyRef = useRef<string>("")
  const lastRequestAtRef = useRef<number>(0)

  // ✅ 프리펜드(과거 추가) 시 스크롤 유지용
  const prevLenRef = useRef<number>(0)
  const prevFirstDateRef = useRef<string>("")

  // ✅ effect([]) 안에서 최신 props 쓰기
  const latestRef = useRef<{
    data: CandlePoint[]
    period: Period
    isFetchingMore?: boolean
    onRequestMore?: (fromIso: string, toIso: string) => void
  }>({ data: [], period, isFetchingMore: false, onRequestMore: undefined })

  useEffect(() => {
    latestRef.current = { data, period, isFetchingMore, onRequestMore }
  }, [data, period, isFetchingMore, onRequestMore])

  // ✅ period 바뀌면 중복키 초기화 (안 그러면 다음 로드가 막힐 수 있음)
  useEffect(() => {
    lastRequestKeyRef.current = ""
    lastRequestAtRef.current = 0
  }, [period])

  const candleData = useMemo<CandlestickData<UTCTimestamp>[]>(() => {
    return data.map((d) => ({
      time: yyyymmddToUTCSeconds(d.date),
      open: d.open,
      high: d.high,
      low: d.low,
      close: d.close,
    }))
  }, [data])

  const volumeData = useMemo<HistogramData<UTCTimestamp>[]>(() => {
    return data.map((d) => ({
      time: yyyymmddToUTCSeconds(d.date),
      value: d.volume,
      color: d.close >= d.open ? UP_COLOR : DOWN_COLOR,
    }))
  }, [data])

  const maData = useMemo(() => {
    const mk = (key: keyof CandlePoint): LineData<UTCTimestamp>[] =>
      data
        .map((d) => {
          const v = d[key]
          if (v == null) return null
          return { time: yyyymmddToUTCSeconds(d.date), value: v } as LineData<UTCTimestamp>
        })
        .filter((x): x is LineData<UTCTimestamp> => x !== null)

    return {
      ma5: mk("ma5"),
      ma20: mk("ma20"),
      ma60: mk("ma60"),
      ma120: mk("ma120"),
    }
  }, [data])

  const tickFmt = useMemo(() => {
    return (time: Time) => {
      const d = timeToUTCDate(time)
      const yyyy = d.getUTCFullYear()
      const mm = d.getUTCMonth() + 1
      const dd = d.getUTCDate()

      if (period === "Y") return `${yyyy}`
      if (period === "M") return `${yyyy}`
      if (period === "W") return `${mm}월`
      if (dd === 1) return `${mm}월`
      return `${dd}`
    }
  }, [period])

  // 1) ✅ 차트/시리즈는 한 번만 생성
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    if (chartRef.current) return

    let disposed = false
    let raf = 0

    // hover line element (single)
    const hoverOverlay = hoverOverlayRef.current
    if (hoverOverlay && !hoverLineElRef.current) {
      const line = document.createElement("div")
      line.style.position = "absolute"
      line.style.top = "0px"
      line.style.bottom = "0px"
      line.style.width = "1px"
      line.style.background = UI_BORDER
      line.style.opacity = "0.95"
      line.style.transform = "translateX(-0.5px)"
      line.style.display = "none"
      hoverOverlay.appendChild(line)
      hoverLineElRef.current = line
    }

    const chart = createChart(el, {
      height,
      width: el.clientWidth,
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: UI_MUTED,
      },
      grid: { vertLines: { visible: false }, horzLines: { visible: false } },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { labelVisible: true, color: UI_BORDER, width: 1, style: 0 },
        horzLine: { labelVisible: true, color: UI_BORDER, width: 1, style: 0 },
      },
      rightPriceScale: { borderVisible: false, scaleMargins: { top: 0.08, bottom: 0.22 } },
      timeScale: {
        borderVisible: false,
        rightOffset: 0,
        barSpacing: 8,
        minBarSpacing: 2,
        fixLeftEdge: false,
        fixRightEdge: true,
        rightBarStaysOnScroll: true,
        lockVisibleTimeRangeOnResize: true,
        tickMarkFormatter: tickFmt,
      },
      localization: {
        priceFormatter: (p: number) => Math.round(p).toLocaleString("ko-KR"),
        timeFormatter: (t: any) => {
          const time: Time =
            typeof t === "number" ? (t as Time) : typeof t === "string" ? (t as Time) : (t as Time)
          return fmtYYYYMMDD(time)
        },
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true, vertTouchDrag: false },
      handleScale: { axisPressedMouseMove: false, mouseWheel: true, pinch: true },
    })

    try {
      ;(chart as any).applyOptions?.({ layout: { attributionLogo: false } })
    } catch {}

    chartRef.current = chart

    const candle = chart.addSeries(CandlestickSeries, {
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderUpColor: UP_COLOR,
      borderDownColor: DOWN_COLOR,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
      lastValueVisible: true,
      priceLineVisible: true,
    })

    const volume = chart.addSeries(HistogramSeries, {
      priceScaleId: "",
      priceFormat: { type: "volume" },
      lastValueVisible: false,
      priceLineVisible: false,
    })
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } })

    const ma5 = chart.addSeries(LineSeries, { lineWidth: 2, color: MA5_COLOR, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false })
    const ma20 = chart.addSeries(LineSeries, { lineWidth: 2, color: MA20_COLOR, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false })
    const ma60 = chart.addSeries(LineSeries, { lineWidth: 2, color: MA60_COLOR, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false })
    const ma120 = chart.addSeries(LineSeries, { lineWidth: 2, color: MA120_COLOR, lastValueVisible: false, priceLineVisible: false, crosshairMarkerVisible: false })

    candleRef.current = candle
    volRef.current = volume
    ma5Ref.current = ma5
    ma20Ref.current = ma20
    ma60Ref.current = ma60
    ma120Ref.current = ma120

    // ----- Tooltip -----
    const tooltip = tooltipRef.current

    const setTooltipHtml = (html: string) => {
      if (!tooltip) return
      tooltip.innerHTML = html
      tooltip.style.opacity = "1"
    }
    const hideTooltip = () => {
      if (!tooltip) return
      tooltip.style.opacity = "0"
    }

    const setHoverX = (x: number | null) => {
      const line = hoverLineElRef.current
      if (!line) return
      if (x == null || Number.isNaN(x)) {
        line.style.display = "none"
        return
      }
      line.style.display = "block"
      line.style.left = `${x}px`
    }




    const moveTooltipToPoint = (point: { x: number; y: number }) => {
      if (!tooltip) return

      // 실제 렌더된 사이즈
      const tw = tooltip.offsetWidth || 180
      const th = tooltip.offsetHeight || 100

      const w = el.clientWidth
      const h = height

      const pad = 12

      // ✅ 공간 기반으로 side 결정
      const canPlaceRight = point.x + pad + tw <= w
      const canPlaceLeft = point.x - pad - tw >= 0

      let side: "left" | "right" = "right"
      if (!canPlaceRight && canPlaceLeft) side = "left"
      else if (canPlaceRight) side = "right"
      else if (canPlaceLeft) side = "left" // 둘 다 애매하면 가능한 쪽
      else side = point.x > w / 2 ? "left" : "right" // 둘 다 안되면 대충 반반

      // ✅ side에 따라 마우스 기준 좌/우로 배치
      let left = side === "right" ? point.x + pad : point.x - pad - tw
      let top = point.y + pad

      // ✅ 화면 밖으로 튀지 않게 최종 클램프
      left = clamp(left, 0, Math.max(0, w - tw))
      top = clamp(top, 0, Math.max(0, h - th))

      // 위치 적용 (transition으로 부드럽게 이동)
      tooltip.style.left = `${left}px`
      tooltip.style.top = `${top}px`

      // ✅ side가 바뀌는 순간, 살짝 “방향성 있는” 슬라이드 애니메이션
      const prevSide = tooltipSideRef.current
      if (prevSide !== side) {
        tooltipSideRef.current = side

        // 바뀐 방향 반대로 살짝 이동 → 다음 프레임에 0으로 복귀
        tooltip.style.transform = `translateX(${side === "right" ? -8 : 8}px)`
        requestAnimationFrame(() => {
          if (!tooltip) return
          tooltip.style.transform = "translateX(0px)"
        })
      } else {
        tooltip.style.transform = "translateX(0px)"
      }
    }


    const onCrosshairMove = (param: MouseEventParams<Time>) => {
      if (disposed) return

      if (!param?.time || !param.point) {
        hideTooltip()
        setHoverX(null)
        return
      }

      const x = chart.timeScale().timeToCoordinate(param.time)
      setHoverX(x)

      const c = (param.seriesData.get(candle) as any) ?? null
      if (!c) {
        hideTooltip()
        return
      }

      const v = (param.seriesData.get(volume) as any) ?? null
      const m5 = (param.seriesData.get(ma5) as any) ?? null
      const m20 = (param.seriesData.get(ma20) as any) ?? null
      const m60 = (param.seriesData.get(ma60) as any) ?? null
      const m120 = (param.seriesData.get(ma120) as any) ?? null

      const open = n0(c.open)
      const high = n0(c.high)
      const low = n0(c.low)
      const close = n0(c.close)

      const isUpCandle = close >= open
      const candleColor = isUpCandle ? UP_COLOR : DOWN_COLOR
      const vol = v?.value ?? 0

      const row = (label: string, value: string, strong = false, valueColor?: string) => `
        <div style="display:flex; justify-content:space-between; gap:10px; margin-top:2px;">
          <span style="color:${UI_MUTED};">${label}</span>
          <span style="font-weight:${strong ? 800 : 600}; color:${valueColor ?? UI_FG};">${value}</span>
        </div>
      `
      const maRow = (label: string, val: any, color: string) =>
        row(label, val?.value == null ? "-" : fmtNum(val.value, 0), false, color)

      const html = `
        <div style="min-width:180px; font-size:12px; line-height:1.2;">
          <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
            <div style="font-weight:800; color:${UI_FG};">${fmtYYYYMMDD(param.time)}</div>
            <div style="font-weight:900; color:${candleColor};">${fmtNum(close, 0)}</div>
          </div>
          <div style="margin-top:6px; padding-top:6px; border-top:1px solid ${UI_BORDER};">
            ${row("시", fmtNum(open, 0))}
            ${row("고", fmtNum(high, 0))}
            ${row("저", fmtNum(low, 0))}
            ${row("거래량", fmtVol(vol))}
          </div>
          <div style="margin-top:6px; padding-top:6px; border-top:1px solid ${UI_BORDER};">
            ${maRow("MA5", m5, MA5_COLOR)}
            ${maRow("MA20", m20, MA20_COLOR)}
            ${maRow("MA60", m60, MA60_COLOR)}
            ${maRow("MA120", m120, MA120_COLOR)}
          </div>
        </div>
      `
      setTooltipHtml(html)
      requestAnimationFrame(() => moveTooltipToPoint(param.point!))
    }

    chart.subscribeCrosshairMove(onCrosshairMove)

    // ✅ 실제 요청 로직
    const maybeRequestMore = () => {
      const latest = latestRef.current
      if (!latest.onRequestMore) return
      if (latest.isFetchingMore) return
      if (disposed) return
      if (!latest.data?.length) return

      const now = Date.now()
      if (now - lastRequestAtRef.current < 700) return

      const earliestYmd = latest.data[0]?.date // "YYYYMMDD"
      if (!earliestYmd || earliestYmd.length !== 8) return

      const earliestDate = new Date(yyyymmddToUTCSeconds(earliestYmd) * 1000)

      const toDate = addDaysUTC(earliestDate, -1)
      const chunk = periodToChunkDays(latest.period)
      const fromDate = addDaysUTC(toDate, -chunk)

      const toIso = String(toIsoDateUTC(toDate))     // ✅ 항상 string
      const fromIso = String(toIsoDateUTC(fromDate)) // ✅ 항상 string

      // ✅ 중복 방지는 toIso 기준
      if (toIso === lastRequestKeyRef.current) return
      lastRequestKeyRef.current = toIso
      lastRequestAtRef.current = now

      console.log("[load-more]", { fromIso, toIso, earliestYmd, period: latest.period })
      latest.onRequestMore(fromIso, toIso)
    }


    // ✅ “구독 API가 없어서” 안 걸리는 케이스 방지: available subscriber로 fallback
    const ts: any = chart.timeScale()

    const onAnyVisibleChange = () => {
      if (disposed) return

      const latest = latestRef.current
      const first = latest.data?.[0]
      if (!first?.date || first.date.length !== 8) return  // ✅ 핵심 가드

      // ✅ 현재 로딩된 데이터 중 "가장 오래된 봉"
      const earliestTime = yyyymmddToUTCSeconds(first.date)

      // ✅ 그 봉이 화면상 어디쯤 있는지 좌표로 판단
      const x = chart.timeScale().timeToCoordinate(earliestTime)

      if (x == null) return

      const LEFT_THRESHOLD_PX = 120
      if (x <= LEFT_THRESHOLD_PX) {
        maybeRequestMore()
      }
    }



    let unsubscribeVisible: (() => void) | null = null

    if (typeof ts?.subscribeVisibleLogicalRangeChange === "function") {
      ts.subscribeVisibleLogicalRangeChange(onAnyVisibleChange)
      unsubscribeVisible = () => ts.unsubscribeVisibleLogicalRangeChange(onAnyVisibleChange)
    } else if (typeof ts?.subscribeVisibleTimeRangeChange === "function") {
      // logical 구독이 없는 빌드/버전용 fallback
      ts.subscribeVisibleTimeRangeChange(onAnyVisibleChange)
      unsubscribeVisible = () => ts.unsubscribeVisibleTimeRangeChange(onAnyVisibleChange)
      // console.warn("[chart] subscribeVisibleLogicalRangeChange not found -> fallback to subscribeVisibleTimeRangeChange")
    } else {
      // 이것까지 없으면 라이브러리 버전이 너무 다르거나 잘못된 번들
      console.warn("[chart] no visible range subscription API found. Upgrade lightweight-charts or check import.")
    }

    // ----- Year guides overlay -----
    const drawYearGuides = () => {
      if (disposed) return
      const overlay = yearOverlayRef.current
      if (!overlay) return

      overlay.innerHTML = ""

      const latest = latestRef.current
      if (latest.period === "Y") return
      if (!latest.data?.length) return

      const marks: { t: UTCTimestamp; year: string }[] = []
      for (let i = 0; i < latest.data.length; i++) {
        const curY = latest.data[i].date.slice(0, 4)
        const prevY = i > 0 ? latest.data[i - 1].date.slice(0, 4) : null
        if (i === 0 || (prevY && prevY !== curY)) {
          marks.push({ t: yyyymmddToUTCSeconds(latest.data[i].date), year: curY })
        }
      }

      const w = el.clientWidth
      const h = height

      const frag = document.createDocumentFragment()
      for (const m of marks) {
        const xx = chart.timeScale().timeToCoordinate(m.t)
        if (xx == null) continue

        const line = document.createElement("div")
        line.style.position = "absolute"
        line.style.left = `${xx}px`
        line.style.top = `0px`
        line.style.width = "2px"
        line.style.height = `${h}px`
        line.style.background = UI_BORDER
        line.style.opacity = "0.65"
        frag.appendChild(line)

        const label = document.createElement("div")
        label.style.position = "absolute"
        label.style.left = `${xx + 6}px`
        label.style.top = `10px`
        label.style.fontSize = "18px"
        label.style.fontWeight = "800"
        label.style.color = UI_FG
        label.style.opacity = "0.14"
        label.textContent = m.year
        frag.appendChild(label)
      }

      overlay.appendChild(frag)
      overlay.style.width = `${w}px`
      overlay.style.height = `${h}px`
    }

    const scheduleGuides = () => {
      if (disposed) return
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(drawYearGuides)
    }

    chart.timeScale().subscribeVisibleTimeRangeChange(scheduleGuides)

    const ro = new ResizeObserver(() => {
      if (disposed) return
      chart.applyOptions({ width: el.clientWidth })
      scheduleGuides()
    })
    ro.observe(el)

    return () => {
      disposed = true
      cancelAnimationFrame(raf)
      ro.disconnect()

      chart.timeScale().unsubscribeVisibleTimeRangeChange(scheduleGuides)
      chart.unsubscribeCrosshairMove(onCrosshairMove)
      unsubscribeVisible?.()

      chart.remove()
      chartRef.current = null
      candleRef.current = null
      volRef.current = null
      ma5Ref.current = null
      ma20Ref.current = null
      ma60Ref.current = null
      ma120Ref.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // 2) ✅ period/height 같은 옵션 변경은 applyOptions로만
  useEffect(() => {
    const chart = chartRef.current
    const el = containerRef.current
    if (!chart || !el) return
    chart.applyOptions({
      height,
      width: el.clientWidth,
      timeScale: { tickMarkFormatter: tickFmt },
    })
  }, [height, tickFmt])

  // 3) ✅ 데이터 변경 시 setData만 + 프리펜드면 스크롤 유지
  useEffect(() => {
    const chart = chartRef.current
    const candle = candleRef.current
    const volume = volRef.current
    const ma5 = ma5Ref.current
    const ma20 = ma20Ref.current
    const ma60 = ma60Ref.current
    const ma120 = ma120Ref.current
    if (!chart || !candle || !volume || !ma5 || !ma20 || !ma60 || !ma120) return

    const ts: any = chart.timeScale()
    const prevLen = prevLenRef.current
    const prevFirst = prevFirstDateRef.current
    const newLen = candleData.length
    const newFirst = data[0]?.date ?? ""

    const vr = ts?.getVisibleLogicalRange?.() ?? null

    candle.setData(candleData)
    volume.setData(volumeData)
    ma5.setData(maData.ma5)
    ma20.setData(maData.ma20)
    ma60.setData(maData.ma60)
    ma120.setData(maData.ma120)

    // ✅ 초기 표시
    if (prevLen === 0 && newLen > 0) {
      const visible = periodToVisibleBars(period)
      const from = Math.max(0, newLen - visible)
      chart.timeScale().setVisibleLogicalRange({ from, to: newLen - 1 })
    }

    // ✅ 과거 데이터 프리펜드 시 현재 보던 구간 유지
    if (vr && prevLen > 0 && newLen > prevLen && newFirst && prevFirst && newFirst !== prevFirst) {
      const delta = newLen - prevLen
      chart.timeScale().setVisibleLogicalRange({
        from: vr.from + delta,
        to: vr.to + delta,
      })
    }

    prevLenRef.current = newLen
    prevFirstDateRef.current = newFirst
  }, [candleData, volumeData, maData, data, period])

  return (
    <div className="relative w-full" style={{ height }}>
      <div ref={containerRef} className="h-full w-full" style={{ position: "relative", zIndex: 0 }} />
      <div ref={yearOverlayRef} className="pointer-events-none absolute inset-0" style={{ zIndex: 10 }} />
      <div ref={hoverOverlayRef} className="pointer-events-none absolute inset-0" style={{ zIndex: 20 }} />
      <div
        ref={tooltipRef}
        className="pointer-events-none absolute"
        style={{
          left: 0,
          top: 0,
          opacity: 0,
          zIndex: 30,
          transition: "opacity 120ms ease, left 140ms ease, top 140ms ease, transform 140ms ease",
          transform: "translateX(0px)",
          border: `1px solid ${UI_BORDER}`,
          background: UI_PANEL_BG,
          borderRadius: 10,
          padding: "10px 12px",
          boxShadow: UI_PANEL_SHADOW,
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          willChange: "left, top, opacity",
        }}
      />
    </div>
  )
}
