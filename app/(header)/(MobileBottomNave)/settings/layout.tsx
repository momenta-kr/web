import { Metadata } from "next"

export const metadata: Metadata = {
  title: "설정 | Market Radar",
  description: "알림, 화면, 데이터 설정을 관리합니다",
}

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
