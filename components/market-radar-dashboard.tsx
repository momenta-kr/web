"use client"

import { Header } from "@/components/radar/header"
import { MarketOverview } from "@/components/radar/market-overview"
import { AnomalyFeed } from "@/components/radar/anomaly-feed"
import { VolumeHeatmap } from "@/components/radar/volume-heatmap"
import { PriceMovers } from "@/components/radar/price-movers"
import { AlertSettings } from "@/components/radar/alert-settings"
import { NotificationToast } from "@/components/radar/notification-toast"
import { SectorIndices } from "@/components/radar/sector-indices"
import { MarketNewsFeed } from "@/components/radar/market-news"
import { useMarketState } from "@/lib/store"

export function MarketRadarDashboard() {
  const { market, timeRange, setMarket } = useMarketState()

  return (
    <div className="min-h-screen bg-background">
      <Header selectedMarket={market} onMarketChange={setMarket} />

      <main className="container mx-auto px-4 py-6">
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column - Market Overview & Heatmap */}
          <div className="lg:col-span-8 space-y-6">
            <MarketOverview market={market} />
            <SectorIndices />
            <VolumeHeatmap market={market} />
            <PriceMovers market={market} />
            <MarketNewsFeed />
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <AnomalyFeed market={market} timeRange={timeRange} />
              <AlertSettings />
            </div>
          </div>
        </div>
      </main>

      <NotificationToast />
    </div>
  )
}
