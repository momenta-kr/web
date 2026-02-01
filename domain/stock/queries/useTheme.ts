import {useQuery} from "@tanstack/react-query";
import {fetchTheme} from "@/domain/stock/api/fetch-theme";

export function useTheme() {
  return useQuery({
    queryKey: ["theme"],
    queryFn: () => fetchTheme(),
    retry: 1,
  })
}