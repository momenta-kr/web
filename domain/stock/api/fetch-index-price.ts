import {apiFetchClient} from "@/lib/http/client";
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