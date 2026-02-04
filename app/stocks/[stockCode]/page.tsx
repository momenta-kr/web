import { Metadata } from "next"
import { apiFetchServer } from "@/lib/http/server"
import StockDetailPage from "@/components/stock/stock-detail-page"
import { StockCurrentPriceOutputDto } from "@/domain/stock/types/stock-current-price.dto"

type Props = {
  params: Promise<{ stockCode: string }>
}

type StockApiResponse = {
  output?: StockCurrentPriceOutputDto & {
    hts_kor_isnm?: string
    stck_shrn_iscd?: string
  }
}

function formatPrice(value?: string | null): string {
  if (!value) return ""
  const num = Number(value.replace(/,/g, ""))
  if (!Number.isFinite(num)) return ""
  return num.toLocaleString("ko-KR")
}

function formatChangeRate(value?: string | null): string {
  if (!value) return ""
  const num = Number(value)
  if (!Number.isFinite(num)) return ""
  return `${num >= 0 ? "+" : ""}${num.toFixed(2)}%`
}

async function getStockInfo(stockCode: string) {
  try {
    const data = await apiFetchServer<StockApiResponse>(`/stocks/v1/${stockCode}`, {
      method: "GET",
      headers: { Accept: "application/json" },
    })

    const output = data?.output
    return {
      name: output?.hts_kor_isnm || stockCode,
      code: output?.stck_shrn_iscd || stockCode,
      currentPrice: output?.currentPrice,
      changeRate: output?.changeRateFromPreviousDay,
      changeFromPrevDay: output?.changeFromPreviousDay,
      highPrice: output?.highPrice,
      lowPrice: output?.lowPrice,
      marketCap: output?.htsMarketCap,
      per: output?.per,
      pbr: output?.pbr,
      eps: output?.eps,
      industryName: output?.industryKoreanName,
      week52High: output?.week52HighPrice,
      week52Low: output?.week52LowPrice,
    }
  } catch {
    return {
      name: stockCode,
      code: stockCode,
      currentPrice: null,
      changeRate: null,
      changeFromPrevDay: null,
      highPrice: null,
      lowPrice: null,
      marketCap: null,
      per: null,
      pbr: null,
      eps: null,
      industryName: null,
      week52High: null,
      week52Low: null,
    }
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { stockCode } = await params
  const stock = await getStockInfo(stockCode)

  const title = `${stock.name} (${stock.code}) | Market Radar`

  // 동적 description 생성
  const descParts: string[] = [`${stock.name} (${stock.code})`]

  if (stock.currentPrice) {
    const priceStr = formatPrice(stock.currentPrice)
    const changeStr = formatChangeRate(stock.changeRate)
    descParts.push(`현재가 ${priceStr}원${changeStr ? ` (${changeStr})` : ""}`)
  }

  if (stock.industryName) {
    descParts.push(`업종: ${stock.industryName}`)
  }

  descParts.push("실시간 차트, 투자의견, 뉴스 분석")

  const description = descParts.join(" | ")

  // 키워드 생성
  const keywords = [
    stock.name,
    stock.code,
    "주가",
    "시세",
    "차트",
    "투자의견",
    stock.industryName,
    "Market Radar",
  ].filter(Boolean) as string[]

  return {
    title,
    description,
    keywords,
    openGraph: {
      title,
      description,
      type: "website",
      siteName: "Market Radar",
      locale: "ko_KR",
    },
    twitter: {
      card: "summary",
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: `/stocks/${stockCode}`,
    },
  }
}

export default async function Page({ params }: Props) {
  const { stockCode } = await params

  return <StockDetailPage stockCode={stockCode} />
}
