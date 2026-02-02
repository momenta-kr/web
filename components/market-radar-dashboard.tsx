"use client"

import {MarketOverview} from "@/components/radar/market-overview"
import {AnomalyFeed} from "@/components/radar/anomaly-feed"
import {PriceMovers} from "@/components/radar/price-movers"
import {NotificationToast} from "@/components/radar/notification-toast"
import {SectorIndices} from "@/components/radar/sector-indices"
import {useMarketState} from "@/lib/store"

export function MarketRadarDashboard() {
  const { market, timeRange, setMarket } = useMarketState()

  return (
    <div className="min-h-screen">

      {/* ✅ 모바일 여백 축소 */}
      <main className="px-3 sm:px-4 py-4 sm:py-6">
        {/* ✅ 모바일 gap 축소 */}
        <div className="grid gap-4 sm:gap-6 lg:grid-cols-12">
          {/* Left Column */}
          <div className="lg:col-span-9 space-y-10 min-w-0">
            <MarketOverview market={market} />
            <SectorIndices />
            <PriceMovers market={market} />
          </div>
          {/* Right Column */}
          <div className="lg:col-span-3 min-w-0">
            {/* ✅ 모바일에서는 sticky/스크롤 박스 OFF, lg부터 ON */}
            <div className="space-y-6 lg:sticky lg:top-20">
              {/*<MarketNewsFeed />*/}
              <AnomalyFeed market={market} timeRange={timeRange} />
              {/*<AlertSettings />*/}
            </div>
          </div>
        </div>
      </main>

      <NotificationToast />
    </div>
  )
}
