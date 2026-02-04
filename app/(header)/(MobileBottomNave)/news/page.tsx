import { Metadata } from "next"
import { RealtimeNews } from "@/components/radar/realtime-news"

export const metadata: Metadata = {
  title: "실시간 뉴스 | Market Radar",
  description: "주식 시장 관련 실시간 뉴스 피드",
}

export default function NewsPage() {
  return <RealtimeNews />
}