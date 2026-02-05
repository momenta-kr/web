import type React from "react"
import type {Metadata, Viewport} from "next"
import {Geist, Geist_Mono} from "next/font/google"
import {Analytics} from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import {ThemeProvider} from "@/components/theme-provider"
import {Footer} from "@/components/footer"
import "./globals.css"
import QueryProvider from "@/providers/query-provider";
import Script from "next/script";

const _geist = Geist({subsets: ["latin"]})
const _geistMono = Geist_Mono({subsets: ["latin"]})

export const metadata: Metadata = {
  title: "시장 이상징후 레이더 | Market Radar",
  description: "실시간 급등락, 거래량 급증 등 시장 이상징후를 감지하는 대시보드",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-logo.png",
  },
}

export const viewport: Viewport = {
  themeColor: [
    {media: "(prefers-color-scheme: light)", color: "#f8f8fc"},
    {media: "(prefers-color-scheme: dark)", color: "#1a1a2e"},
  ],
}

export default function RootLayout({
                                     children,
                                   }: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="ko">
      <body className="font-sans antialiased bg-white dark:bg-background min-h-screen flex flex-col">
      <QueryProvider>
        <ThemeProvider>
          <main className="flex-1">
            {children}
          </main>
          <Footer />
          <Script
              src="//t1.daumcdn.net/kas/static/ba.min.js"
              strategy="afterInteractive"
              async
          />
        </ThemeProvider>
      </QueryProvider>
      <Analytics/>
      <SpeedInsights/>
      </body>
    </html>
  )
}
