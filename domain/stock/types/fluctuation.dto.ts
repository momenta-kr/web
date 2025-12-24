// fluctuation.dto.ts
export type FluctuationOutputDto = {
  stck_shrn_iscd: string;                 // 주식 단축 종목코드
  data_rank: string;                      // 데이터 순위
  hts_kor_isnm: string;                   // HTS 한글 종목명
  stck_prpr: string;                      // 현재가
  prdy_vrss: string;                      // 전일 대비 값
  prdy_vrss_sign: string;                 // 전일 대비 부호
  prdy_ctrt: string;                      // 전일 대비율
  acml_vol: string;                       // 누적 거래량

  stck_hgpr: string;                      // 최고가
  hgpr_hour: string;                      // 최고가 시간
  acml_hgpr_date: string;                 // 누적 최고가 일자

  stck_lwpr: string;                      // 최저가
  lwpr_hour: string;                      // 최저가 시간
  acml_lwpr_date: string;                 // 누적 최저가 일자

  lwpr_vrss_prpr_rate: string;            // 최저가 대비 현재가 비율
  dsgt_date_clpr_vrss_prpr_rate: string;  // 지정일 종가 대비 현재가 비율

  cnnt_ascn_dynu: string;                 // 연속 상승 일수
  hgpr_vrss_prpr_rate: string;            // 최고가 대비 현재가 비율
  cnnt_down_dynu: string;                 // 연속 하락 일수

  oprc_vrss_prpr_sign: string;            // 시가 대비 현재가 부호
  oprc_vrss_prpr: string;                 // 시가 대비 현재가
  oprc_vrss_prpr_rate: string;            // 시가 대비 현재가 비율

  prd_rsfl: string;                       // 기간 등락 값
  prd_rsfl_rate: string;                  // 기간 등락 비율
};

