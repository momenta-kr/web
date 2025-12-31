export interface DomesticStockPriceResponseDto {
  rt_cd: string
  msg_cd: string
  msg1: string
  output1: DomesticStockSnapshotDto
  output2: DomesticStockDailyPriceDto[]
}

export interface DomesticStockSnapshotDto {
  prdy_vrss: string
  prdy_vrss_sign: string
  prdy_ctrt: string
  stck_prdy_clpr: string
  acml_vol: string
  acml_tr_pbmn: string
  hts_kor_isnm: string
  stck_prpr: string
  stck_shrn_iscd: string
  prdy_vol: string
  stck_mxpr: string
  stck_llam: string
  stck_oprc: string
  stck_hgpr: string
  stck_lwpr: string
  stck_prdy_oprc: string
  stck_prdy_hgpr: string
  stck_prdy_lwpr: string
  askp: string
  bidp: string
  prdy_vrss_vol: string
  vol_tnrt: string
  stck_fcam: string
  lstn_stcn: string
  cpfn: string
  hts_avls: string
  per: string
  eps: string
  pbr: string
  itewhol_loan_rmnd_ratem: string
}

export interface DomesticStockDailyPriceDto {
  stck_bsop_date: string // YYYYMMDD
  stck_clpr: string
  stck_oprc: string
  stck_hgpr: string
  stck_lwpr: string
  acml_vol: string
  acml_tr_pbmn: string
  flng_cls_code: string
  prtt_rate: string
  mod_yn: string
  prdy_vrss_sign: string
  prdy_vrss: string
  revl_issu_reas: string
}
