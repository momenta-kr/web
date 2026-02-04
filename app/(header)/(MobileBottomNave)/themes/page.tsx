import { Metadata } from "next"
import { ThemeExplorer } from "@/components/radar/theme-explorer"

export const metadata: Metadata = {
  title: "테마 탐색 | Market Radar",
  description: "주식 시장 테마별 종목 탐색 및 분석",
}

export default function ThemePage() {
  return <ThemeExplorer />
}