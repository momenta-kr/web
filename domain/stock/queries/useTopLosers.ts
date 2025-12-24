import {useQuery} from "@tanstack/react-query";
import {fetchTopGainers} from "@/domain/stock/api/fetch-top-gainers";
import {fetchTopLosers} from "@/domain/stock/api/fetch-top-losers";

export function useTopLosers() {
  return useQuery({
    queryKey: ["top-losers"],
    queryFn: () => fetchTopLosers(),
    retry: 1,
  });
}
