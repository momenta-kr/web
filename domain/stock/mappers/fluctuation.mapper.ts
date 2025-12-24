// fluctuation.mapper.ts

import {FluctuationOutputDto} from "@/domain/stock/types/fluctuation.dto";
import {Fluctuation} from "@/domain/stock/types/fluctuation.model";

function toNumber(v: unknown, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  if (s === "" || s === "-") return fallback;

  // 콤마, 공백 제거
  const normalized = s.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
}

export function toFluctuation(dto: FluctuationOutputDto): Fluctuation {
  return {
    shortStockCode: dto.stck_shrn_iscd,
    rank: toNumber(dto.data_rank),
    stockName: dto.hts_kor_isnm,

    currentPrice: toNumber(dto.stck_prpr),
    changeFromPrevDay: toNumber(dto.prdy_vrss),
    changeSign: dto.prdy_vrss_sign,
    changeRateFromPrevDay: toNumber(dto.prdy_ctrt),

    accumulatedVolume: toNumber(dto.acml_vol),

    highPrice: toNumber(dto.stck_hgpr),
    highPriceTime: dto.hgpr_hour,
    accumulatedHighPriceDate: dto.acml_hgpr_date,

    lowPrice: toNumber(dto.stck_lwpr),
    lowPriceTime: dto.lwpr_hour,
    accumulatedLowPriceDate: dto.acml_lwpr_date,

    rateFromLowPrice: toNumber(dto.lwpr_vrss_prpr_rate),
    rateFromDesignatedClosePrice: toNumber(dto.dsgt_date_clpr_vrss_prpr_rate),

    consecutiveRiseDays: toNumber(dto.cnnt_ascn_dynu),
    rateFromHighPrice: toNumber(dto.hgpr_vrss_prpr_rate),
    consecutiveFallDays: toNumber(dto.cnnt_down_dynu),

    openPriceChangeSign: dto.oprc_vrss_prpr_sign,
    changeFromOpenPrice: toNumber(dto.oprc_vrss_prpr),
    rateFromOpenPrice: toNumber(dto.oprc_vrss_prpr_rate),

    periodChangeValue: toNumber(dto.prd_rsfl),
    periodChangeRate: toNumber(dto.prd_rsfl_rate),
  };
}

export function toFluctuations(dtos: FluctuationOutputDto[]): Fluctuation[] {
  return dtos.map(toFluctuation);
}
