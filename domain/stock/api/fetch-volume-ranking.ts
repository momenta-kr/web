import { apiFetchClient } from "@/lib/http/client";
import { VolumeRankingDto } from "@/domain/stock/types/volume-ranking.dto";
import { toVolumeRankings } from "@/domain/stock/mappers/volume-ranking.mapper";
import { VolumeRanking } from "@/domain/stock/types/volume-ranking.model";

export async function fetchVolumeRanking(): Promise<VolumeRanking[]> {
  const data = await apiFetchClient<VolumeRankingDto[]>(
    `/stocks/v1/volume-ranking`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  );
  return toVolumeRankings(data);
}
