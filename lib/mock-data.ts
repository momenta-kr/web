import type { Stock, Anomaly, MarketIndex, SectorData, AlertRule, Market, AnomalyType, Severity } from "./types"

// 종목 데이터
export const stocksData: Stock[] = [
  {
    ticker: "005930",
    name: "삼성전자",
    price: 78400,
    change: 5800,
    changePercent: 7.99,
    volume: 32400000,
    prevClose: 72600,
    open: 73000,
    high: 79200,
    low: 72800,
    marketCap: "468.2조",
    sector: "반도체",
    market: "KOSPI",
  },
  {
    ticker: "000660",
    name: "SK하이닉스",
    price: 142500,
    change: 9500,
    changePercent: 7.14,
    volume: 8200000,
    prevClose: 133000,
    open: 134500,
    high: 144000,
    low: 133500,
    marketCap: "103.8조",
    sector: "반도체",
    market: "KOSPI",
  },
  {
    ticker: "035420",
    name: "NAVER",
    price: 182500,
    change: -12500,
    changePercent: -6.41,
    volume: 4800000,
    prevClose: 195000,
    open: 193000,
    high: 194500,
    low: 181000,
    marketCap: "29.9조",
    sector: "인터넷",
    market: "KOSPI",
  },
  {
    ticker: "035720",
    name: "카카오",
    price: 48250,
    change: 2150,
    changePercent: 4.67,
    volume: 5600000,
    prevClose: 46100,
    open: 46500,
    high: 48800,
    low: 46200,
    marketCap: "21.4조",
    sector: "인터넷",
    market: "KOSPI",
  },
  {
    ticker: "373220",
    name: "LG에너지솔루션",
    price: 368000,
    change: -22000,
    changePercent: -5.64,
    volume: 600000,
    prevClose: 390000,
    open: 388000,
    high: 389500,
    low: 365000,
    marketCap: "86.1조",
    sector: "2차전지",
    market: "KOSPI",
  },
  {
    ticker: "006400",
    name: "삼성SDI",
    price: 412000,
    change: 22000,
    changePercent: 5.64,
    volume: 1200000,
    prevClose: 390000,
    open: 392000,
    high: 415000,
    low: 391000,
    marketCap: "28.3조",
    sector: "2차전지",
    market: "KOSPI",
  },
  {
    ticker: "051910",
    name: "LG화학",
    price: 385500,
    change: 18500,
    changePercent: 5.04,
    volume: 800000,
    prevClose: 367000,
    open: 368500,
    high: 388000,
    low: 367500,
    marketCap: "27.2조",
    sector: "2차전지",
    market: "KOSPI",
  },
  {
    ticker: "005380",
    name: "현대차",
    price: 242000,
    change: 5000,
    changePercent: 2.11,
    volume: 1500000,
    prevClose: 237000,
    open: 238000,
    high: 244000,
    low: 237500,
    marketCap: "51.6조",
    sector: "자동차",
    market: "KOSPI",
  },
  {
    ticker: "000270",
    name: "기아",
    price: 98500,
    change: 2400,
    changePercent: 2.5,
    volume: 2100000,
    prevClose: 96100,
    open: 96500,
    high: 99200,
    low: 96200,
    marketCap: "39.9조",
    sector: "자동차",
    market: "KOSPI",
  },
  {
    ticker: "207940",
    name: "삼성바이오로직스",
    price: 782000,
    change: -38000,
    changePercent: -4.63,
    volume: 300000,
    prevClose: 820000,
    open: 815000,
    high: 818000,
    low: 778000,
    marketCap: "55.6조",
    sector: "바이오",
    market: "KOSPI",
  },
  {
    ticker: "068270",
    name: "셀트리온",
    price: 168500,
    change: -7500,
    changePercent: -4.26,
    volume: 2100000,
    prevClose: 176000,
    open: 174500,
    high: 175200,
    low: 167000,
    marketCap: "22.8조",
    sector: "바이오",
    market: "KOSPI",
  },
  {
    ticker: "105560",
    name: "KB금융",
    price: 58200,
    change: 700,
    changePercent: 1.22,
    volume: 3200000,
    prevClose: 57500,
    open: 57800,
    high: 58500,
    low: 57600,
    marketCap: "24.2조",
    sector: "금융",
    market: "KOSPI",
  },
  // KOSDAQ 종목
  {
    ticker: "247540",
    name: "에코프로비엠",
    price: 245000,
    change: 8500,
    changePercent: 3.59,
    volume: 1800000,
    prevClose: 236500,
    open: 238000,
    high: 248000,
    low: 237000,
    marketCap: "23.8조",
    sector: "2차전지",
    market: "KOSDAQ",
  },
  {
    ticker: "086520",
    name: "에코프로",
    price: 98200,
    change: -1800,
    changePercent: -1.8,
    volume: 2400000,
    prevClose: 100000,
    open: 99500,
    high: 100200,
    low: 97500,
    marketCap: "11.2조",
    sector: "2차전지",
    market: "KOSDAQ",
  },
  {
    ticker: "041510",
    name: "에스엠",
    price: 85600,
    change: 3200,
    changePercent: 3.88,
    volume: 890000,
    prevClose: 82400,
    open: 83000,
    high: 86200,
    low: 82800,
    marketCap: "2.0조",
    sector: "엔터",
    market: "KOSDAQ",
  },
  {
    ticker: "293490",
    name: "카카오게임즈",
    price: 18250,
    change: -450,
    changePercent: -2.41,
    volume: 1200000,
    prevClose: 18700,
    open: 18600,
    high: 18750,
    low: 18100,
    marketCap: "1.6조",
    sector: "게임",
    market: "KOSDAQ",
  },
]

// 시장 지수 데이터
export const marketIndexData: Record<Market, MarketIndex> = {
  KOSPI: {
    name: "KOSPI",
    value: 2687.45,
    change: 32.18,
    changePercent: 1.21,
    volume: "8.2억주",
    tradingValue: "12.4조원",
    advancing: 542,
    declining: 298,
    unchanged: 85,
  },
  KOSDAQ: {
    name: "KOSDAQ",
    value: 842.31,
    change: -5.72,
    changePercent: -0.67,
    volume: "12.1억주",
    tradingValue: "8.7조원",
    advancing: 623,
    declining: 812,
    unchanged: 102,
  },
}

// 섹터 데이터
export const sectorDataList: SectorData[] = [
  {
    name: "반도체",
    change: 2.4,
    volume: 85,
    stocks: [
      { name: "삼성전자", ticker: "005930", change: 3.2, size: 40 },
      { name: "SK하이닉스", ticker: "000660", change: 4.1, size: 30 },
      { name: "삼성전기", ticker: "009150", change: 1.2, size: 15 },
      { name: "DB하이텍", ticker: "000990", change: -0.8, size: 15 },
    ],
  },
  {
    name: "2차전지",
    change: -1.2,
    volume: 72,
    stocks: [
      { name: "LG에너지솔루션", ticker: "373220", change: -2.1, size: 35 },
      { name: "삼성SDI", ticker: "006400", change: 0.5, size: 30 },
      { name: "LG화학", ticker: "051910", change: -1.8, size: 20 },
      { name: "에코프로", ticker: "086520", change: -0.3, size: 15 },
    ],
  },
  {
    name: "인터넷",
    change: -0.5,
    volume: 45,
    stocks: [
      { name: "NAVER", ticker: "035420", change: -1.2, size: 45 },
      { name: "카카오", ticker: "035720", change: 0.3, size: 35 },
      { name: "카카오뱅크", ticker: "323410", change: -0.8, size: 20 },
    ],
  },
  {
    name: "자동차",
    change: 1.8,
    volume: 58,
    stocks: [
      { name: "현대차", ticker: "005380", change: 2.1, size: 40 },
      { name: "기아", ticker: "000270", change: 2.5, size: 35 },
      { name: "현대모비스", ticker: "012330", change: 0.8, size: 25 },
    ],
  },
  {
    name: "바이오",
    change: 0.3,
    volume: 62,
    stocks: [
      { name: "삼성바이오", ticker: "207940", change: 0.9, size: 35 },
      { name: "셀트리온", ticker: "068270", change: -0.4, size: 30 },
      { name: "SK바이오", ticker: "302440", change: 0.2, size: 20 },
      { name: "유한양행", ticker: "000100", change: 0.5, size: 15 },
    ],
  },
  {
    name: "금융",
    change: 0.8,
    volume: 35,
    stocks: [
      { name: "KB금융", ticker: "105560", change: 1.2, size: 30 },
      { name: "신한지주", ticker: "055550", change: 0.5, size: 25 },
      { name: "하나금융", ticker: "086790", change: 0.8, size: 25 },
      { name: "삼성화재", ticker: "000810", change: 0.3, size: 20 },
    ],
  },
]

// 기본 알림 규칙
export const defaultAlertRules: AlertRule[] = [
  { id: "1", type: "surge", condition: "5분간 +5% 이상 급등", threshold: 5, enabled: true },
  { id: "2", type: "plunge", condition: "5분간 -5% 이상 급락", threshold: -5, enabled: true },
  { id: "3", type: "volume", condition: "거래량 평균 대비 300% 초과", threshold: 300, enabled: true },
  { id: "4", type: "volatility", condition: "호가 스프레드 2% 초과", threshold: 2, enabled: false },
]

// 실시간 이상징후 생성기
let anomalyIdCounter = 0
export function generateRandomAnomaly(market: Market): Anomaly {
  const types: AnomalyType[] = ["surge", "plunge", "volume", "volatility"]
  const severities: Severity[] = ["high", "medium", "low"]
  const marketStocks = stocksData.filter((s) => s.market === market)
  const stock = marketStocks[Math.floor(Math.random() * marketStocks.length)]
  const type = types[Math.floor(Math.random() * types.length)]
  const severity = severities[Math.floor(Math.random() * severities.length)]

  const descriptions: Record<AnomalyType, string[]> = {
    surge: ["외국인 대량 매수", "기관 순매수 급증", "전고점 돌파", "호재 뉴스 반영"],
    plunge: ["기관 순매도", "외국인 매도세", "악재 뉴스 반영", "지지선 이탈"],
    volume: ["프로그램 매매 급증", "기관 대량 거래", "외국인 대량 거래", "블록딜 추정"],
    volatility: ["호가 스프레드 확대", "변동성 급증", "거래 불균형", "시장 불확실성"],
  }

  const values: Record<AnomalyType, () => string> = {
    surge: () => `+${(Math.random() * 10 + 3).toFixed(1)}%`,
    plunge: () => `-${(Math.random() * 8 + 3).toFixed(1)}%`,
    volume: () => `${Math.floor(Math.random() * 400 + 150)}%`,
    volatility: () => `±${(Math.random() * 3 + 1).toFixed(1)}%`,
  }

  const now = new Date()
  const timeStr = now.toTimeString().slice(0, 8)

  return {
    id: `anomaly-${++anomalyIdCounter}`,
    type,
    ticker: stock.ticker,
    name: stock.name,
    value: values[type](),
    description: `${type === "surge" ? "급등" : type === "plunge" ? "급락" : type === "volume" ? "거래량 급증" : "변동성"} - ${descriptions[type][Math.floor(Math.random() * descriptions[type].length)]}`,
    time: timeStr,
    timestamp: now.getTime(),
    severity,
    market,
  }
}

// 가격 히스토리 생성
export function generatePriceHistory(
  basePrice: number,
  points = 60,
): { time: string; price: number; volume: number }[] {
  const history = []
  let price = basePrice * 0.98
  const now = new Date()

  for (let i = points; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000)
    const change = (Math.random() - 0.48) * basePrice * 0.002
    price = Math.max(price + change, basePrice * 0.9)
    price = Math.min(price, basePrice * 1.1)

    history.push({
      time: time.toTimeString().slice(0, 5),
      price: Math.round(price),
      volume: Math.floor(Math.random() * 500000 + 100000),
    })
  }

  return history
}

// 실시간 가격 변동 시뮬레이션
export function simulatePriceChange(stock: Stock): Stock {
  const changeAmount = (Math.random() - 0.5) * stock.price * 0.002
  const newPrice = Math.round(stock.price + changeAmount)
  const newChange = newPrice - stock.prevClose
  const newChangePercent = (newChange / stock.prevClose) * 100

  return {
    ...stock,
    price: newPrice,
    change: newChange,
    changePercent: Number(newChangePercent.toFixed(2)),
    high: Math.max(stock.high, newPrice),
    low: Math.min(stock.low, newPrice),
  }
}

// 호가창 데이터 생성
export function generateOrderBook(basePrice: number): {
  asks: { price: number; volume: number; ratio: number }[]
  bids: { price: number; volume: number; ratio: number }[]
  totalAskVolume: number
  totalBidVolume: number
} {
  const tickSize = basePrice > 100000 ? 500 : basePrice > 50000 ? 100 : 50
  const asks = []
  const bids = []

  let totalAsk = 0
  let totalBid = 0

  for (let i = 0; i < 10; i++) {
    const askVolume = Math.floor(Math.random() * 50000 + 5000)
    const bidVolume = Math.floor(Math.random() * 50000 + 5000)
    totalAsk += askVolume
    totalBid += bidVolume

    asks.push({
      price: basePrice + tickSize * (i + 1),
      volume: askVolume,
      ratio: 0,
    })
    bids.push({
      price: basePrice - tickSize * i,
      volume: bidVolume,
      ratio: 0,
    })
  }

  const maxVolume = Math.max(...asks.map((a) => a.volume), ...bids.map((b) => b.volume))
  asks.forEach((a) => (a.ratio = (a.volume / maxVolume) * 100))
  bids.forEach((b) => (b.ratio = (b.volume / maxVolume) * 100))

  return {
    asks: asks.reverse(),
    bids,
    totalAskVolume: totalAsk,
    totalBidVolume: totalBid,
  }
}

// 투자자별 매매동향 생성
export function generateInvestorTrends(): {
  type: "foreign" | "institution" | "individual"
  name: string
  buyVolume: number
  sellVolume: number
  netVolume: number
  netAmount: string
}[] {
  const foreignBuy = Math.floor(Math.random() * 500000 + 100000)
  const foreignSell = Math.floor(Math.random() * 500000 + 100000)
  const instBuy = Math.floor(Math.random() * 300000 + 50000)
  const instSell = Math.floor(Math.random() * 300000 + 50000)
  const indBuy = Math.floor(Math.random() * 800000 + 200000)
  const indSell = Math.floor(Math.random() * 800000 + 200000)

  const formatAmount = (volume: number, price = 80000) => {
    const amount = (volume * price) / 100000000
    return amount >= 0 ? `+${amount.toFixed(0)}억` : `${amount.toFixed(0)}억`
  }

  return [
    {
      type: "foreign",
      name: "외국인",
      buyVolume: foreignBuy,
      sellVolume: foreignSell,
      netVolume: foreignBuy - foreignSell,
      netAmount: formatAmount(foreignBuy - foreignSell),
    },
    {
      type: "institution",
      name: "기관",
      buyVolume: instBuy,
      sellVolume: instSell,
      netVolume: instBuy - instSell,
      netAmount: formatAmount(instBuy - instSell),
    },
    {
      type: "individual",
      name: "개인",
      buyVolume: indBuy,
      sellVolume: indSell,
      netVolume: indBuy - indSell,
      netAmount: formatAmount(indBuy - indSell),
    },
  ]
}

// 뉴스/공시 데이터 생성
export function generateNewsItems(stockName: string): {
  id: string
  title: string
  source: string
  time: string
  type: "news" | "disclosure"
  sentiment?: "positive" | "negative" | "neutral"
  content?: string
  aiSummary?: string
  impactScore?: number
  keywords?: string[]
  url?: string
}[] {
  const newsTemplates = [
    {
      title: `${stockName}, 글로벌 시장 점유율 1위 달성...신사업 확장 가속화`,
      sentiment: "positive" as const,
      content: `${stockName}이 글로벌 시장에서 점유율 1위를 차지했다. 회사 측은 지속적인 R&D 투자와 품질 개선이 주효했다고 밝혔다. 향후 신규 시장 진출과 사업 다각화를 통해 성장세를 이어갈 계획이다.`,
      aiSummary: "글로벌 1위 달성으로 시장 지배력 강화. 신사업 확장 모멘텀 긍정적. 중장기 성장 전망 유지.",
      impactScore: 78,
      keywords: ["시장점유율", "글로벌1위", "신사업"],
      url: "https://news.naver.com",
    },
    {
      title: `${stockName}, 대규모 자사주 매입 결정...주주환원 강화`,
      sentiment: "positive" as const,
      content: `${stockName}이 1,000억원 규모의 자사주 매입을 결정했다. 이는 주주가치 제고와 주가 안정을 위한 조치로 풀이된다.`,
      aiSummary: "자사주 매입은 단기 주가 지지 요인. 주주환원 정책 강화 신호. 수급 개선 기대.",
      impactScore: 65,
      keywords: ["자사주매입", "주주환원", "수급개선"],
      url: "https://www.hankyung.com",
    },
    {
      title: `${stockName} 3분기 실적 어닝서프라이즈...영업이익 전년비 45% 증가`,
      sentiment: "positive" as const,
      content: `${stockName}이 3분기 영업이익 2조원을 기록하며 시장 기대치를 크게 상회했다. 원가 절감과 판매 호조가 실적 개선을 이끌었다.`,
      aiSummary: "컨센서스 상회하는 호실적. 수익성 개선 추세 지속. 4분기 전망도 긍정적.",
      impactScore: 85,
      keywords: ["어닝서프라이즈", "실적호조", "영업이익"],
      url: "https://www.mk.co.kr",
    },
    {
      title: `${stockName}, 주요 고객사 이탈 우려...경쟁사로 물량 이동`,
      sentiment: "negative" as const,
      content: `${stockName}의 주요 고객사가 경쟁사로 물량을 이동시키고 있는 것으로 알려졌다. 이에 따른 매출 감소가 우려된다.`,
      aiSummary: "핵심 고객사 이탈은 중대 리스크. 매출 감소 불가피. 신규 고객 확보 시급.",
      impactScore: -72,
      keywords: ["고객이탈", "경쟁심화", "매출감소"],
      url: "https://www.edaily.co.kr",
    },
    {
      title: `${stockName} 공장 화재 발생...일부 생산라인 가동 중단`,
      sentiment: "negative" as const,
      content: `${stockName} 주력 공장에서 화재가 발생해 일부 생산라인이 가동 중단됐다. 정확한 피해 규모는 조사 중이다.`,
      aiSummary: "생산 차질로 단기 실적 영향 불가피. 보험 적용 여부 확인 필요. 복구 일정 주시.",
      impactScore: -58,
      keywords: ["화재", "생산중단", "실적영향"],
      url: "https://www.yna.co.kr",
    },
    {
      title: `${stockName}, 신약 임상 3상 실패...주가 급락 우려`,
      sentiment: "negative" as const,
      content: `${stockName}의 주력 파이프라인 신약이 임상 3상에서 유의미한 효과를 입증하지 못했다. 수년간의 R&D 투자가 무산될 위기다.`,
      aiSummary: "핵심 파이프라인 실패는 치명적. 기업가치 재평가 불가피. 대안 파이프라인 부재 시 심각.",
      impactScore: -88,
      keywords: ["임상실패", "신약개발", "R&D"],
      url: "https://www.mt.co.kr",
    },
    {
      title: `${stockName} 주가 변동성 확대...외국인 순매도 지속`,
      sentiment: "neutral" as const,
      content: `${stockName} 주가가 등락을 반복하며 변동성이 커지고 있다. 외국인이 최근 5거래일 연속 순매도 중이다.`,
      aiSummary: "수급 불안정 지속. 방향성 결정까지 관망 권고. 지지선 이탈 시 추가 하락 가능.",
      impactScore: -15,
      keywords: ["변동성", "외국인매도", "수급"],
      url: "https://www.news1.kr",
    },
    {
      title: `${stockName} CEO 인터뷰..."2025년 매출 30% 성장 목표"`,
      sentiment: "neutral" as const,
      content: `${stockName} CEO가 언론 인터뷰에서 내년 매출 30% 성장 목표를 제시했다. 신사업 확대와 해외 진출이 주요 성장 동력이 될 것이라고 밝혔다.`,
      aiSummary: "경영진 자신감 표출. 목표 달성 가능성은 실행력에 달림. 구체적 전략 확인 필요.",
      impactScore: 25,
      keywords: ["성장목표", "CEO인터뷰", "신사업"],
      url: "https://www.sedaily.com",
    },
  ]

  const disclosures = [
    {
      title: `${stockName} 주요사항보고서(자기주식처분결정)`,
      sentiment: "positive" as const,
      aiSummary: "자사주 처분으로 유동성 확보. 처분 목적 확인 필요. M&A 또는 투자 재원 가능성.",
      impactScore: 20,
      keywords: ["자기주식", "공시", "유동성"],
      url: "https://dart.fss.or.kr",
    },
    {
      title: `${stockName} 분기보고서 제출`,
      sentiment: "neutral" as const,
      aiSummary: "정기 공시. 세부 재무제표 및 주석 확인 권고.",
      impactScore: 0,
      keywords: ["분기보고서", "정기공시"],
      url: "https://dart.fss.or.kr",
    },
    {
      title: `${stockName} 대표이사 변경`,
      sentiment: "neutral" as const,
      aiSummary: "경영진 교체. 신임 CEO 경영 방향 주시 필요. 단기 불확실성 존재.",
      impactScore: -10,
      keywords: ["대표이사", "경영진교체"],
      url: "https://dart.fss.or.kr",
    },
    {
      title: `${stockName} 타법인 주식 취득 결정`,
      sentiment: "positive" as const,
      aiSummary: "M&A 또는 전략적 투자. 시너지 효과 기대. 인수 가격 적정성 검토 필요.",
      impactScore: 35,
      keywords: ["주식취득", "M&A", "투자"],
      url: "https://dart.fss.or.kr",
    },
  ]

  const items = []
  const now = new Date()

  // 뉴스 생성
  const shuffledNews = [...newsTemplates].sort(() => Math.random() - 0.5).slice(0, 5)
  for (let i = 0; i < shuffledNews.length; i++) {
    const template = shuffledNews[i]
    items.push({
      id: `news-${i}`,
      title: template.title,
      source: ["연합뉴스", "한경", "매경", "뉴스1", "이데일리", "머니투데이"][Math.floor(Math.random() * 5)],
      time: new Date(now.getTime() - i * 3600000 * (Math.random() * 3 + 1)).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "news" as const,
      sentiment: template.sentiment,
      content: template.content,
      aiSummary: template.aiSummary,
      impactScore: template.impactScore,
      keywords: template.keywords,
      url: template.url,
    })
  }

  // 공시 생성
  const shuffledDisclosures = [...disclosures].sort(() => Math.random() - 0.5).slice(0, 2)
  for (let i = 0; i < shuffledDisclosures.length; i++) {
    const disclosure = shuffledDisclosures[i]
    items.push({
      id: `disclosure-${i}`,
      title: disclosure.title,
      source: "DART",
      time: new Date(now.getTime() - (i + 5) * 3600000 * (Math.random() * 5 + 2)).toLocaleTimeString("ko-KR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      type: "disclosure" as const,
      sentiment: disclosure.sentiment,
      aiSummary: disclosure.aiSummary,
      impactScore: disclosure.impactScore,
      keywords: disclosure.keywords,
      url: disclosure.url,
    })
  }

  return items.sort((a, b) => b.time.localeCompare(a.time))
}

// 재무정보 생성
export function generateFinancialData(): {
  per: number
  pbr: number
  eps: number
  bps: number
  dividendYield: number
  roe: number
  debtRatio: number
  operatingMargin: number
} {
  return {
    per: Number((Math.random() * 30 + 5).toFixed(1)),
    pbr: Number((Math.random() * 3 + 0.5).toFixed(2)),
    eps: Math.floor(Math.random() * 10000 + 1000),
    bps: Math.floor(Math.random() * 100000 + 20000),
    dividendYield: Number((Math.random() * 4 + 0.5).toFixed(2)),
    roe: Number((Math.random() * 20 + 5).toFixed(1)),
    debtRatio: Number((Math.random() * 100 + 20).toFixed(1)),
    operatingMargin: Number((Math.random() * 25 + 5).toFixed(1)),
  }
}

export const sectorIndexData: {
  name: string
  value: number
  change: number
  changePercent: number
}[] = [
  { name: "반도체", value: 3245.82, change: 78.45, changePercent: 2.48 },
  { name: "2차전지", value: 1892.34, change: -42.18, changePercent: -2.18 },
  { name: "자동차", value: 2156.78, change: 35.62, changePercent: 1.68 },
  { name: "바이오", value: 1534.21, change: 12.34, changePercent: 0.81 },
  { name: "인터넷", value: 1678.45, change: -28.92, changePercent: -1.69 },
  { name: "금융", value: 1245.67, change: 8.23, changePercent: 0.66 },
  { name: "철강", value: 987.34, change: -5.67, changePercent: -0.57 },
  { name: "화학", value: 1123.45, change: 15.89, changePercent: 1.43 },
  { name: "건설", value: 876.23, change: -12.34, changePercent: -1.39 },
  { name: "유통", value: 1432.56, change: 22.45, changePercent: 1.59 },
  { name: "통신", value: 1098.76, change: 3.45, changePercent: 0.32 },
  { name: "엔터", value: 2345.67, change: 56.78, changePercent: 2.48 },
]

export function generateMarketNews(): {
  id: string
  title: string
  source: string
  time: string
  sentiment: "positive" | "negative" | "neutral"
  relatedStocks: { ticker: string; name: string }[]
  aiSummary: string
  category: "경제" | "산업" | "정책" | "글로벌" | "기업"
  url: string
}[] {
  const newsData = [
    {
      title: '미 연준, 기준금리 동결 결정..."인플레이션 안정 확인 후 인하 검토"',
      sentiment: "neutral" as const,
      relatedStocks: [
        { ticker: "105560", name: "KB금융" },
        { ticker: "055550", name: "신한지주" },
      ],
      aiSummary:
        "연준 금리 동결로 당분간 고금리 환경 지속. 금융주 수혜 예상되나 성장주에는 부담. 환율 안정에는 긍정적.",
      category: "글로벌" as const,
      url: "https://www.yna.co.kr",
    },
    {
      title: "삼성전자, HBM3E 양산 본격화...SK하이닉스와 점유율 경쟁 심화",
      sentiment: "positive" as const,
      relatedStocks: [
        { ticker: "005930", name: "삼성전자" },
        { ticker: "000660", name: "SK하이닉스" },
      ],
      aiSummary:
        "HBM 시장 경쟁 본격화로 반도체 업종 전반 수혜. 삼성전자 양산 성공 시 점유율 회복 기대. AI 수요 지속 확대 전망.",
      category: "산업" as const,
      url: "https://www.hankyung.com",
    },
    {
      title: "정부, 전기차 보조금 내년 축소 검토...업계 반발 거세",
      sentiment: "negative" as const,
      relatedStocks: [
        { ticker: "373220", name: "LG에너지솔루션" },
        { ticker: "006400", name: "삼성SDI" },
        { ticker: "005380", name: "현대차" },
      ],
      aiSummary:
        "전기차 보조금 축소는 2차전지·완성차 업종에 단기 악재. 내수 판매 감소 우려. 수출 비중 높은 기업 상대적 선방 예상.",
      category: "정책" as const,
      url: "https://www.mk.co.kr",
    },
    {
      title: "카카오, AI 챗봇 서비스 출시 예고...네이버와 경쟁 본격화",
      sentiment: "positive" as const,
      relatedStocks: [
        { ticker: "035720", name: "카카오" },
        { ticker: "035420", name: "NAVER" },
      ],
      aiSummary:
        "AI 서비스 경쟁으로 인터넷 대형주 재평가 기대. 카카오 신사업 모멘텀 긍정적. 네이버도 하이퍼클로바X 고도화 중.",
      category: "기업" as const,
      url: "https://www.edaily.co.kr",
    },
    {
      title: "한국은행, 올해 경제성장률 전망 2.1%로 하향 조정",
      sentiment: "negative" as const,
      relatedStocks: [],
      aiSummary: "경기 둔화 우려 확대. 내수 관련 업종 부진 예상. 수출주 중심 선별적 접근 권고.",
      category: "경제" as const,
      url: "https://www.bok.or.kr",
    },
    {
      title: "셀트리온, 유럽서 바이오시밀러 허가 획득...글로벌 매출 확대 기대",
      sentiment: "positive" as const,
      relatedStocks: [
        { ticker: "068270", name: "셀트리온" },
        { ticker: "207940", name: "삼성바이오로직스" },
      ],
      aiSummary: "셀트리온 유럽 허가로 매출 성장 가시화. 바이오시밀러 시장 확대 수혜. 동종업계 긍정적 영향 파급.",
      category: "기업" as const,
      url: "https://www.mt.co.kr",
    },
    {
      title: "현대차그룹, 미국 전기차 공장 가동 시작...연 30만대 생산 목표",
      sentiment: "positive" as const,
      relatedStocks: [
        { ticker: "005380", name: "현대차" },
        { ticker: "000270", name: "기아" },
      ],
      aiSummary: "미국 현지 생산으로 IRA 보조금 수혜 본격화. 북미 시장 점유율 확대 기대. 환율 변동 리스크도 감소.",
      category: "기업" as const,
      url: "https://www.sedaily.com",
    },
    {
      title: "중국 경기 부양책 발표...철강·화학 업종 반등 기대",
      sentiment: "positive" as const,
      relatedStocks: [
        { ticker: "005490", name: "POSCO홀딩스" },
        { ticker: "051910", name: "LG화학" },
      ],
      aiSummary:
        "중국 경기 부양으로 소재 업종 수요 회복 기대. 철강·화학 단기 반등 가능. 지속성 여부는 추가 정책에 달림.",
      category: "글로벌" as const,
      url: "https://www.news1.kr",
    },
    {
      title: "금융위, 공매도 재개 시점 내년 상반기로 연기 검토",
      sentiment: "neutral" as const,
      relatedStocks: [],
      aiSummary: "공매도 금지 연장 시 개인투자자 심리 개선. 다만 외국인 자금 유입에는 부정적. 시장 변동성 확대 가능성.",
      category: "정책" as const,
      url: "https://www.fsc.go.kr",
    },
    {
      title: "에코프로, 북미 양극재 공장 투자 결정...3조원 규모",
      sentiment: "positive" as const,
      relatedStocks: [
        { ticker: "086520", name: "에코프로" },
        { ticker: "247540", name: "에코프로비엠" },
      ],
      aiSummary:
        "대규모 투자로 글로벌 생산능력 확대. IRA 수혜 극대화 전략. 단기 자금 부담 있으나 중장기 성장 동력 확보.",
      category: "기업" as const,
      url: "https://www.hankyung.com",
    },
  ]

  const sources = ["연합뉴스", "한경", "매경", "뉴스1", "이데일리", "머니투데이"]
  const now = new Date()

  return newsData.map((news, i) => ({
    id: `market-news-${i}`,
    ...news,
    source: sources[Math.floor(Math.random() * sources.length)],
    time: new Date(now.getTime() - i * 1800000 * (Math.random() + 0.5)).toLocaleTimeString("ko-KR", {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }))
}
