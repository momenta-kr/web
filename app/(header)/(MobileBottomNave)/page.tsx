import { Metadata } from "next"
import { MarketRadarDashboard } from "@/components/market-radar-dashboard"

export const metadata: Metadata = {
  title: "대시보드 | Market Radar",
  description: "실시간 급등락, 거래량 급증 등 시장 이상징후를 감지하는 대시보드",
}

export default function Page() {
  return <MarketRadarDashboard />
}
