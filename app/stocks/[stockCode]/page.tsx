import { Metadata } from "next"
import { apiFetchServer } from "@/lib/http/server"
import StockDetailPage from "@/components/stock/stock-detail-page"

type Props = {
  params: Promise<{ stockCode: string }>
}

async function getStockInfo(stockCode: string) {
  try {
    const data = await apiFetchServer<{
      output?: {
        hts_kor_isnm?: string
        stck_shrn_iscd?: string
      }
    }>(`/stocks/v1/${stockCode}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    })
    return {
      name: data?.output?.hts_kor_isnm || stockCode,
      code: data?.output?.stck_shrn_iscd || stockCode,
    }
  } catch {
    return {
      name: stockCode,
      code: stockCode,
    }
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stockCode } = await params
  const stockInfo = await getStockInfo(stockCode)

  return {
    title: `${stockInfo.name} (${stockInfo.code}) | Market Radar`,
    description: `${stockInfo.name} (${stockInfo.code}) 실시간 주가, 차트, 투자의견, 뉴스 분석`,
  }
}

export default async function Page({ params }: Props) {
  const { stockCode } = await params

  return <StockDetailPage stockCode={stockCode} />
}
