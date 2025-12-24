import {useQuery} from "@tanstack/react-query";
import {fetchIndustryIndexItem} from "@/domain/stock/api/fetch-industry-index-item";

export function useIndustryIndexItem() {
  return useQuery({
    queryKey: ["industry-index-item"],
    queryFn: () => fetchIndustryIndexItem(),
    retry: 1,
  });
}
