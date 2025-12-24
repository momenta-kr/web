import {useQuery} from "@tanstack/react-query";
import {fetchTopGainers} from "@/domain/stock/api/fetch-top-gainers";

export function useTopGainers() {
  return useQuery({
    queryKey: ["top-gainers"],
    queryFn: () => fetchTopGainers(),
    retry: 1,
  });
}
