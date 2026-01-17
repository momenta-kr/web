import {InvestmentOpinion, InvestmentRecommendation} from "@/domain/stock/types/investment-opinion.model";
import {InvestmentOpinionDto} from "@/domain/stock/types/investment-opinion.dto";


/** "00123" / "-12.34" / "" / null/undefined -> number|null */
function toNumber(v: unknown): number | null {
  if (v == null) return null
  const s = String(v).trim()
  if (!s) return null

  const normalized = s.replaceAll(",", "")
  const n = Number(normalized)
  return Number.isFinite(n) ? n : null
}

/** YYYYMMDD -> Date (로컬 타임존) */
function yyyymmddToDate(v: unknown): Date | null {
  if (v == null) return null
  const s = String(v).trim()
  if (!/^\d{8}$/.test(s)) return null

  const y = Number(s.slice(0, 4))
  const m = Number(s.slice(4, 6))
  const d = Number(s.slice(6, 8))
  const dt = new Date(y, m - 1, d)
  return Number.isNaN(dt.getTime()) ? null : dt
}

/** 투자의견 정규화: "BUY"/"매수" 등 -> enum */
function normalizeInvestmentOpinion(v: unknown): InvestmentRecommendation {
  const s = String(v ?? "").trim()
  if (!s) return "UNKNOWN"

  const upper = s.toUpperCase()

  // English
  if (upper === "BUY") return "BUY"
  if (upper === "SELL") return "SELL"
  if (upper === "HOLD" || upper === "NEUTRAL") return "HOLD"

  // Korean
  if (s === "매수") return "BUY"
  if (s === "매도") return "SELL"
  if (s === "보유" || s === "중립") return "HOLD"

  return "UNKNOWN"
}

/** DTO -> Model */
export function toInvestmentOpinion(dto: InvestmentOpinionDto): InvestmentOpinion {
  const date = yyyymmddToDate(dto.stockBusinessDate)

  return {
    // Date로 변환 (실패 시 Invalid Date 방지용으로 fallback)
    stockBusinessDate: date ?? new Date(NaN),

    memberCompanyName: dto.memberCompanyName ?? "",

    investmentOpinion: normalizeInvestmentOpinion(dto.investmentOpinion),
    investmentOpinionRaw: dto.investmentOpinion ?? "",
    investmentOpinionClassCode: dto.investmentOpinionClassCode ?? "",

    previousInvestmentOpinion: normalizeInvestmentOpinion(dto.previousInvestmentOpinion),
    previousInvestmentOpinionRaw: dto.previousInvestmentOpinion ?? "",
    previousInvestmentOpinionClassCode: dto.previousInvestmentOpinionClassCode ?? "",

    htsTargetPrice: toNumber(dto.htsTargetPrice),
    previousDayClosePrice: toNumber(dto.previousDayClosePrice),

    nDayDisparity: toNumber(dto.nDayDisparity),
    nDayDisparityRate: toNumber(dto.nDayDisparityRate),

    stockFuturesDisparity: toNumber(dto.stockFuturesDisparity),
    stockFuturesDisparityRate: toNumber(dto.stockFuturesDisparityRate),
  }
}

/** DTO[] -> Model[] */
export function toInvestmentOpinions(dtos: InvestmentOpinionDto[] | null | undefined): InvestmentOpinion[] {
  return Array.isArray(dtos) ? dtos.map(toInvestmentOpinion) : []
}
