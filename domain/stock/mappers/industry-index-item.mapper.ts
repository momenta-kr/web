import { IndustryIndexItemDto } from "@/domain/stock/types/industry-index-item.dto";
import { IndustryIndexItem } from "@/domain/stock/types/industry-index-item.model";

function toNumberSafe(v: unknown, fallback = 0): number {
  if (v === null || v === undefined) return fallback;
  const s = String(v).trim();
  if (!s) return fallback;

  // "1,234.56" 같은 케이스 대비
  const normalized = s.replace(/,/g, "");
  const n = Number(normalized);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * prdy_vrss_sign 코드에 따라 전일대비 부호 적용
 * - 실제 코드는 문서/환경에 따라 다를 수 있어서 보수적으로 처리
 * - 흔히: 1=상승, 2=하락, 3=보합 등
 */
function applySign(valueAbs: number, signCode: string): number {
  const code = String(signCode).trim();

  // 가장 흔한 매핑: 1(상승), 2(하락), 3(보합)
  if (code === "2") return -Math.abs(valueAbs);
  if (code === "1") return Math.abs(valueAbs);

  // 혹시 "+", "-"로 오는 케이스
  if (code === "-") return -Math.abs(valueAbs);
  if (code === "+") return Math.abs(valueAbs);

  // 그 외(보합/기타)는 원본 값이 이미 부호를 포함할 수도 있으니 그대로
  return valueAbs;
}

/**
 * changeRate가 서버에서 이미 부호 포함된 값으로 오는 경우도 있음.
 * - changeSign을 신뢰할지, changeRate 자체를 신뢰할지 정책이 필요.
 * - 보수적으로: changeRate는 그대로 파싱, changeFromPreviousDay만 sign 적용.
 * - 만약 changeRate도 sign 적용이 필요하면 아래 한 줄만 바꾸면 됨.
 */
export function toIndustryIndexItem(dto: IndustryIndexItemDto): IndustryIndexItem {
  const currentIndexPrice = toNumberSafe(dto.bstp_nmix_prpr);

  const changeAbs = toNumberSafe(dto.bstp_nmix_prdy_vrss);
  const changeFromPreviousDay = applySign(changeAbs, dto.prdy_vrss_sign);

  const changeRate = toNumberSafe(dto.bstp_nmix_prdy_ctrt); // 기본: 서버 값을 그대로 사용

  return {
    industryCode: dto.bstp_cls_code,
    industryName: dto.hts_kor_isnm,

    currentIndexPrice,
    changeFromPreviousDay,
    changeRate,

    accumulatedVolume: toNumberSafe(dto.acml_vol),
    accumulatedTradeAmount: toNumberSafe(dto.acml_tr_pbmn),
    volumeRatio: toNumberSafe(dto.acml_vol_rlim),
    tradeAmountRatio: toNumberSafe(dto.acml_tr_pbmn_rlim),
  };
}

export function toIndustryIndexItems(dtos: IndustryIndexItemDto[]): IndustryIndexItem[] {
  return (dtos ?? []).map(toIndustryIndexItem);
}

/** 정렬/필터링 헬퍼 */

export function sortByChangeRateDesc(items: IndustryIndexItem[]): IndustryIndexItem[] {
  return [...items].sort((a, b) => b.changeRate - a.changeRate);
}

export function topNByTradeAmountRatio(items: IndustryIndexItem[], n: number): IndustryIndexItem[] {
  return [...items].sort((a, b) => b.tradeAmountRatio - a.tradeAmountRatio).slice(0, n);
}
