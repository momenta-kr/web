"use client"

import {MarketOverview} from "@/components/radar/market-overview"
import {AnomalyFeed} from "@/components/radar/anomaly-feed"
import {PriceMovers} from "@/components/radar/price-movers"
import {NotificationToast} from "@/components/radar/notification-toast"
import {SectorIndices} from "@/components/radar/sector-indices"
import {VolumeRanking} from "@/components/radar/volume-ranking"
import {useMarketState} from "@/lib/store"
import KakaoAdFit from "@/components/kakao-ad-fit";
import {useIsMobile} from "@/hooks/use-mobile";

export function MarketRadarDashboard() {
    const {market, timeRange, setMarket} = useMarketState()
    const isMobile = useIsMobile();

    return (
        <div className="min-h-screen">

            {/* ✅ 모바일 여백 축소 */}
            <main className="px-3 sm:px-4 py-4 sm:py-6">
                {/* ✅ 모바일 gap 축소 */}
                <div className="grid gap-4 sm:gap-6 lg:grid-cols-12">
                    {/* Left Column */}
                    <div className="lg:col-span-9 space-y-10 min-w-0">
                        <MarketOverview market={market}/>
                        {isMobile
                            ? <KakaoAdFit className="block sm:hidden mx-auto" unit="DAN-IGCEa5uiCq0GVFKQ" width={320}
                                          height={100}/>
                            : <KakaoAdFit className="hidden sm:block mx-auto" unit="DAN-AZiA8BGVjtTo0EiG" width={728}
                                          height={90}/>}


                        <SectorIndices/>
                        <PriceMovers market={market}/>
                    </div>
                    {/* Right Column */}
                    <div className="lg:col-span-3 min-w-0">
                        {/* ✅ 모바일에서는 sticky/스크롤 박스 OFF, lg부터 ON */}
                        <div className="space-y-6 lg:sticky lg:top-20">
                            {/*<VolumeRanking />*/}
                            {/*<MarketNewsFeed />*/}
                            <AnomalyFeed market={market} timeRange={timeRange}/>
                            {/*<AlertSettings />*/}
                            <KakaoAdFit unit="DAN-ZHgO7Fa1jHC6VM00" width={300} height={250} className="mx-auto"/>
                        </div>
                    </div>
                </div>
            </main>

            {/*<NotificationToast/>*/}
        </div>
    )
}
