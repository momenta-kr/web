import { useQuery } from "@tanstack/react-query";
import { fetchVolumeRanking } from "@/domain/stock/api/fetch-volume-ranking";

export function useVolumeRanking() {
  return useQuery({
    queryKey: ["volume-ranking"],
    queryFn: () => fetchVolumeRanking(),
    retry: 1,
  });
}
