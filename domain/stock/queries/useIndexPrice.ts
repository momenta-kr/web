import {useQuery} from "@tanstack/react-query";
import {fetchTopGainers} from "@/domain/stock/api/fetch-top-gainers";
import {fetchTopLosers} from "@/domain/stock/api/fetch-top-losers";
import {fetchIndexPrice} from "@/domain/stock/api/fetch-index-price";

export function useIndexPrice() {
  return useQuery({
    queryKey: ["index-price"],
    queryFn: () => fetchIndexPrice(),
    retry: 1,
  });
}
