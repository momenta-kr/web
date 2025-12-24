
/** KIS 국내 업종 구분별 전체시세 응답 DTO */
export interface IndustryIndexItemDto {
  /** 업종 구분 코드 */
  bstp_cls_code: string;

  /** 업종명 (HTS 기준 한글명) */
  hts_kor_isnm: string;

  /** 업종 지수 현재가 */
  bstp_nmix_prpr: string;

  /** 전일 대비 값 */
  bstp_nmix_prdy_vrss: string;

  /** 전일 대비 부호 코드 */
  prdy_vrss_sign: string;

  /** 전일 대비율(%) */
  bstp_nmix_prdy_ctrt: string;

  /** 누적 거래량 */
  acml_vol: string;

  /** 누적 거래대금 */
  acml_tr_pbmn: string;

  /** 거래량 비중(%) */
  acml_vol_rlim: string;

  /** 거래대금 비중(%) */
  acml_tr_pbmn_rlim: string;
}
