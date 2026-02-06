// volume-ranking.mapper.ts

import { VolumeRankingDto } from "@/domain/stock/types/volume-ranking.dto";
import { VolumeRanking } from "@/domain/stock/types/volume-ranking.model";

function toNumber(v: unknown, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  if (s === "" || s === "-") return fallback;

  // 콤마, 공백 제거
  const normalized = s.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
}

export function toVolumeRanking(dto: VolumeRankingDto): VolumeRanking {
  return {
    stockCode: dto.stockCode || "",
    stockName: dto.stockName || "",
    rank: toNumber(dto.dataRank),
    currentPrice: toNumber(dto.currentPrice),
    prevDayDiff: toNumber(dto.prevDayDiff),
    prevDayChangeRate: toNumber(dto.prevDayChangeRate),
  };
}

export function toVolumeRankings(dtos: VolumeRankingDto[]): VolumeRanking[] {
  return dtos.map(toVolumeRanking);
}
