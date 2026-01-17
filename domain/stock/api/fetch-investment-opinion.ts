import {apiFetchClient} from "@/lib/http/client";
import {IndexPrice} from "@/domain/stock/types/index-price.model";
import {IndexPriceDto} from "@/domain/stock/types/index-price.dto";
import {toIndexPrice} from "@/domain/stock/mappers/index-price.mapper";
import {InvestmentOpinion} from "@/domain/stock/types/investment-opinion.model";
import {InvestmentOpinionDto} from "@/domain/stock/types/investment-opinion.dto";
import {toInvestmentOpinions} from "@/domain/stock/mappers/investment-opinion.mapper";

export async function fetchInvestmentOpinion(symbol: string): Promise<InvestmentOpinion[]> {
  const qs = new URLSearchParams({ symbol }).toString()

  const data = await apiFetchClient<InvestmentOpinionDto[]>(
    `/stocks/v1/investment-opinion?${qs}`,
    {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
      cache: "no-store",
    },
  )

  return toInvestmentOpinions(data)
}