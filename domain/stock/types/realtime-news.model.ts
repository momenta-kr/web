export type RealtimeNews = {
  newsId: string;
  title: string;
  description: string;
  source: string;
  url: string;
  crawledAt: Date,

  safeBrief: string,
  sentiment: string,
  category: string,
  relatedStock: RelatedStock[]
}

export type RelatedStock = {
  stockCode: string;
  name: string;
}