import {apiFetchClient} from "@/lib/http/client";
import {RealtimeNews, RealtimeNewsSlice} from "@/domain/stock/types/realtime-news.model";
import {RealtimeNewsDto, RealtimeNewsSliceDto} from "@/domain/stock/types/realtime-news.dto";
import {toRealtimeNewsList, toRealtimeNewsSliceModel} from "@/domain/stock/mappers/realtime-news.mapper";

export type RealtimeNewsQuery = {
  timeRange: string // 예: "24H", "7D", "30D", "365D", "ALL"
  sentiment: string // "positive" | "negative" | "neutral" | "ALL"
  category: string // "경제" | "산업" | "정책" | "글로벌" | "기업" | "ALL"
  size?: number
}

export async function fetchRealtimeNews(params: RealtimeNewsQuery, page: number): Promise<RealtimeNewsSlice> {
  const sp = new URLSearchParams()
  sp.set("timeRange", params.timeRange)
  sp.set("sentiment", params.sentiment)
  sp.set("category", params.category)
  sp.set("page", String(page))
  sp.set("size", String(params.size ?? 30))


  const data = await apiFetchClient<RealtimeNewsSliceDto>(
    `/stocks/v1/news?${sp.toString()}`,
    {
      method: "GET",
      credentials: "include",
      headers: {Accept: "application/json"},
      cache: "no-store",
    }
  );
  return toRealtimeNewsSliceModel(data);
}