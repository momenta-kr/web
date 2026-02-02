import {useInfiniteQuery, useQuery} from "@tanstack/react-query";
import {fetchRealtimeNews, RealtimeNewsQuery} from "@/domain/stock/api/fetch-realtime-news";

export function useRealtimeNews(params: RealtimeNewsQuery) {
  return useInfiniteQuery({
    queryKey: ["realtimeNews", params],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => fetchRealtimeNews(params, Number(pageParam ?? 0)),
    getNextPageParam: (lastPage) => (lastPage?.last ? undefined : (lastPage?.number ?? 0) + 1),
  })
}