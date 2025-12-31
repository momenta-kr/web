import {
  DomesticStockDailyPriceDto,
  DomesticStockPriceResponseDto,
  DomesticStockSnapshotDto
} from "@/domain/stock/types/domestic-stock-price.dto";
import {
  DomesticStockDailyPrice,
  DomesticStockPriceResponse,
  DomesticStockSnapshot
} from "@/domain/stock/types/domestic-stock-price.model";

/** "00123" / "-12.34" / "" / null/undefined -> number|null */
function toNumber(v: unknown): number | null {
  if (v == null) return null
  const s = String(v).trim()
  if (!s) return null

  // 콤마 제거 대응 (혹시라도)
  const normalized = s.replaceAll(",", "")
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

/** YYYYMMDD -> YYYY-MM-DD */
function yyyymmddToIso(v: unknown): string | null {
  if (v == null) return null
  const s = String(v).trim()
  if (!/^\d{8}$/.test(s)) return null
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

/** Y/N -> boolean|null */
function toBooleanYN(v: unknown): boolean | null {
  if (v == null) return null
  const s = String(v).trim().toUpperCase()
  if (s === "Y") return true
  if (s === "N") return false
  return null
}

function mapSnapshot(dto: DomesticStockSnapshotDto): DomesticStockSnapshot {
  return {
    stockName: dto.hts_kor_isnm ?? "",
    shortStockCode: dto.stck_shrn_iscd ?? "",

    currentPrice: toNumber(dto.stck_prpr),

    changeFromPrevDay: toNumber(dto.prdy_vrss),
    changeSign: dto.prdy_vrss_sign ?? null,
    changeRate: toNumber(dto.prdy_ctrt),

    prevClosePrice: toNumber(dto.stck_prdy_clpr),
    prevDayOpenPrice: toNumber(dto.stck_prdy_oprc),
    prevDayHighPrice: toNumber(dto.stck_prdy_hgpr),
    prevDayLowPrice: toNumber(dto.stck_prdy_lwpr),

    openPrice: toNumber(dto.stck_oprc),
    highPrice: toNumber(dto.stck_hgpr),
    lowPrice: toNumber(dto.stck_lwpr),

    askPrice: toNumber(dto.askp),
    bidPrice: toNumber(dto.bidp),

    accumulatedVolume: toNumber(dto.acml_vol),
    prevDayVolume: toNumber(dto.prdy_vol),
    changeVolumeFromPrevDay: toNumber(dto.prdy_vrss_vol),
    accumulatedTradeAmount: toNumber(dto.acml_tr_pbmn),

    turnoverRate: toNumber(dto.vol_tnrt),

    faceValue: toNumber(dto.stck_fcam),
    listedShares: toNumber(dto.lstn_stcn),
    capitalAmount: toNumber(dto.cpfn),
    marketCap: toNumber(dto.hts_avls),

    per: toNumber(dto.per),
    eps: toNumber(dto.eps),
    pbr: toNumber(dto.pbr),

    marginLoanRate: toNumber(dto.itewhol_loan_rmnd_ratem),
  }
}

function toDailyPrice(dto: DomesticStockDailyPriceDto): DomesticStockDailyPrice {
  return {
    businessDate: dto.stck_bsop_date ?? "",
    businessDateIso: yyyymmddToIso(dto.stck_bsop_date),

    closePrice: toNumber(dto.stck_clpr),
    openPrice: toNumber(dto.stck_oprc),
    highPrice: toNumber(dto.stck_hgpr),
    lowPrice: toNumber(dto.stck_lwpr),

    accumulatedVolume: toNumber(dto.acml_vol),
    accumulatedTradeAmount: toNumber(dto.acml_tr_pbmn),

    fallingClassCode: dto.flng_cls_code ?? null,
    splitRate: toNumber(dto.prtt_rate),
    modified: toBooleanYN(dto.mod_yn),

    changeSign: dto.prdy_vrss_sign ?? null,
    changeFromPrevDay: toNumber(dto.prdy_vrss),

    revaluationReasonCode: dto.revl_issu_reas ?? null,
  }
}

/** 메인 매퍼: DTO -> Model */
export function toDomesticStockPriceResponse(
  dto: DomesticStockPriceResponseDto,
): DomesticStockPriceResponse {
  return {
    resultCode: dto.rt_cd,
    messageCode: dto.msg_cd,
    message: dto.msg1,
    snapshot: mapSnapshot(dto.output1),
    prices: Array.isArray(dto.output2) ? dto.output2.map(toDailyPrice) : [],
  }
}
