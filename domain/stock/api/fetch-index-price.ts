import {apiFetchClient} from "@/lib/http/client";
import {IndustryIndexItem} from "@/domain/stock/types/industry-index-item.model";
import {IndustryIndexItemDto} from "@/domain/stock/types/industry-index-item.dto";
import {toIndustryIndexItems} from "@/domain/stock/mappers/industry-index-item.mapper";
import {FluctuationOutputDto} from "@/domain/stock/types/fluctuation.dto";
import {toFluctuations} from "@/domain/stock/mappers/fluctuation.mapper";
import {Fluctuation} from "@/domain/stock/types/fluctuation.model";
import {IndexPrice} from "@/domain/stock/types/index-price.model";
import {IndexPriceDto} from "@/domain/stock/types/index-price.dto";
import {toIndexPrice} from "@/domain/stock/mappers/index-price.mapper";

export async function fetchIndexPrice(): Promise<IndexPrice> {
  const data = await apiFetchClient<IndexPriceDto>(
    `/stocks/v1/index-price`,
    {
      method: "GET",
      credentials: "include",
      headers: {Accept: "application/json"},
      cache: "no-store",
    }
  );
  return toIndexPrice(data);
}