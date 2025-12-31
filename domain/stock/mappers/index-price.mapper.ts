// stock-cash-order.mapper.ts



import {IndexPriceDto} from "@/domain/stock/types/index-price.dto";
import {IndexPrice} from "@/domain/stock/types/index-price.model";

function toNumber(v: unknown): number | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s || s === "-") return null;

  // 쉼표가 섞여 올 수 있으면 제거
  const normalized = s.replaceAll(",", "");

  const n = Number(normalized);
  return Number.isFinite(n) ? n : null;
}

function toDateYmd(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s || s === "-") return null;
  // 보수적으로 yyyymmdd만 허용
  return /^\d{8}$/.test(s) ? s : s;
}

export function toIndexPrice(
  o: IndexPriceDto
): IndexPrice {
  return {
    industryIndexCurrentPrice: toNumber(o.bstp_nmix_prpr),

    industryIndexChangeFromPrevDay: toNumber(o.bstp_nmix_prdy_vrss),
    changeSignFromPrevDay: o.prdy_vrss_sign,
    industryIndexChangeRateFromPrevDay: toNumber(o.bstp_nmix_prdy_ctrt),

    accumulatedVolume: toNumber(o.acml_vol),
    previousDayVolume: toNumber(o.prdy_vol),

    accumulatedTradeAmount: toNumber(o.acml_tr_pbmn),
    previousDayTradeAmount: toNumber(o.prdy_tr_pbmn),

    industryIndexOpenPrice: toNumber(o.bstp_nmix_oprc),
    openPriceChangeFromPrevIndex: toNumber(o.prdy_nmix_vrss_nmix_oprc),
    currentVsOpenSign: o.oprc_vrss_prpr_sign,
    openPriceChangeRateFromPrevDay: toNumber(o.bstp_nmix_oprc_prdy_ctrt),

    industryIndexHighPrice: toNumber(o.bstp_nmix_hgpr),
    highPriceChangeFromPrevIndex: toNumber(o.prdy_nmix_vrss_nmix_hgpr),
    currentVsHighSign: o.hgpr_vrss_prpr_sign,
    highPriceChangeRateFromPrevDay: toNumber(o.bstp_nmix_hgpr_prdy_ctrt),

    industryIndexLowPrice: toNumber(o.bstp_nmix_lwpr),
    lowPriceChangeFromPrevClose: toNumber(o.prdy_clpr_vrss_lwpr),
    currentVsLowSign: o.lwpr_vrss_prpr_sign,
    lowPriceRateFromPrevClose: toNumber(o.prdy_clpr_vrss_lwpr_rate),

    상승종목수: toNumber(o.ascn_issu_cnt),
    upperLimitCount: toNumber(o.uplm_issu_cnt),
    unchangedCount: toNumber(o.stnr_issu_cnt),
    declineCount: toNumber(o.down_issu_cnt),
    lowerLimitCount: toNumber(o.lslm_issu_cnt),

    yearHighIndustryIndex: toNumber(o.dryy_bstp_nmix_hgpr),
    currentVsYearHighRate: toNumber(o.dryy_hgpr_vrss_prpr_rate),
    yearHighDate: toDateYmd(o.dryy_bstp_nmix_hgpr_date),

    yearLowIndustryIndex: toNumber(o.dryy_bstp_nmix_lwpr),
    currentVsYearLowRate: toNumber(o.dryy_lwpr_vrss_prpr_rate),
    yearLowDate: toDateYmd(o.dryy_bstp_nmix_lwpr_date),

    totalAskQuantity: toNumber(o.total_askp_rsqn),
    totalBidQuantity: toNumber(o.total_bidp_rsqn),

    sellQuantityRate: toNumber(o.seln_rsqn_rate),
    buyQuantityRate: toNumber(o.shnu_rsqn_rate),

    netBuyQuantity: toNumber(o.ntby_rsqn),
  };
}
