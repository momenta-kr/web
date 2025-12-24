"use client"

// 전역 상태 관리 (SWR 기반)

import useSWR from "swr"
import type { Market, TimeRange, Anomaly, AlertRule, Stock } from "./types"
import { stocksData, defaultAlertRules, generateRandomAnomaly, simulatePriceChange, marketIndexData } from "./mock-data"
import { useEffect, useCallback, useState } from "react"

// 시장 선택 상태
export function useMarketState() {
  const { data, mutate } = useSWR<{ market: Market; timeRange: TimeRange }>("market-state", null, {
    fallbackData: { market: "KOSPI", timeRange: "1h" },
  })

  return {
    market: data!.market,
    timeRange: data!.timeRange,
    setMarket: (market: Market) => mutate({ ...data!, market }, false),
    setTimeRange: (timeRange: TimeRange) => mutate({ ...data!, timeRange }, false),
  }
}

// 종목 데이터 (실시간 업데이트)
export function useStocks(market: Market) {
  const { data, mutate } = useSWR<Stock[]>(`stocks-${market}`, null, {
    fallbackData: stocksData.filter((s) => s.market === market),
  })

  // 실시간 가격 업데이트 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      mutate((current) => current?.map((stock) => simulatePriceChange(stock)), false)
    }, 2000)

    return () => clearInterval(interval)
  }, [mutate])

  return { stocks: data!, mutate }
}

// 이상징후 피드
export function useAnomalies(market: Market) {
  const { data, mutate } = useSWR<Anomaly[]>(`anomalies-${market}`, null, {
    fallbackData: [],
  })

  const addAnomaly = useCallback(
    (anomaly: Anomaly) => {
      mutate((current) => [anomaly, ...(current || [])].slice(0, 50), false)
    },
    [mutate],
  )

  // 실시간 이상징후 생성 시뮬레이션
  useEffect(() => {
    // 초기 데이터 로드
    const initialAnomalies: Anomaly[] = []
    for (let i = 0; i < 6; i++) {
      initialAnomalies.push(generateRandomAnomaly(market))
    }
    mutate(initialAnomalies, false)

    const interval = setInterval(() => {
      if (Math.random() > 0.6) {
        addAnomaly(generateRandomAnomaly(market))
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [market, mutate, addAnomaly])

  return { anomalies: data!, addAnomaly }
}

// 알림 규칙
export function useAlertRules() {
  const { data, mutate } = useSWR<AlertRule[]>("alert-rules", null, {
    fallbackData: defaultAlertRules,
  })

  const toggleRule = (id: string) => {
    mutate((current) => current?.map((rule) => (rule.id === id ? { ...rule, enabled: !rule.enabled } : rule)), false)
  }

  const deleteRule = (id: string) => {
    mutate((current) => current?.filter((rule) => rule.id !== id), false)
  }

  const addRule = (rule: Omit<AlertRule, "id">) => {
    mutate((current) => [...(current || []), { ...rule, id: `rule-${Date.now()}` }], false)
  }

  return { rules: data!, toggleRule, deleteRule, addRule }
}

// 시장 지수
export function useMarketIndex(market: Market) {
  const { data, mutate } = useSWR(`market-index-${market}`, null, {
    fallbackData: marketIndexData[market],
  })

  // 실시간 업데이트 시뮬레이션
  useEffect(() => {
    const interval = setInterval(() => {
      mutate((current) => {
        if (!current) return current
        const changeAmount = (Math.random() - 0.5) * 2
        const newValue = Number((current.value + changeAmount).toFixed(2))
        const newChange = Number((newValue - (current.value - current.change)).toFixed(2))
        const newChangePercent = Number(((newChange / (current.value - current.change)) * 100).toFixed(2))

        return {
          ...current,
          value: newValue,
          change: newChange,
          changePercent: newChangePercent,
        }
      }, false)
    }, 3000)

    return () => clearInterval(interval)
  }, [mutate])

  return { index: data! }
}

// 알림 토스트
export function useNotifications() {
  const [notifications, setNotifications] = useState<
    { id: string; message: string; type: "info" | "warning" | "success" }[]
  >([])

  const addNotification = useCallback((message: string, type: "info" | "warning" | "success" = "info") => {
    const id = `notif-${Date.now()}`
    setNotifications((prev) => [...prev, { id, message, type }])

    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id))
    }, 5000)
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  return { notifications, addNotification, removeNotification }
}

// 검색
export function useSearch() {
  const [query, setQuery] = useState("")
  const [isOpen, setIsOpen] = useState(false)

  const results =
    query.length > 0
      ? stocksData.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()) || s.ticker.includes(query))
      : []

  return { query, setQuery, isOpen, setIsOpen, results }
}
