import {apiFetchClient} from "@/lib/http/client";
import {IndustryIndexItem} from "@/domain/stock/types/industry-index-item.model";
import {IndustryIndexItemDto} from "@/domain/stock/types/industry-index-item.dto";
import {toIndustryIndexItems} from "@/domain/stock/mappers/industry-index-item.mapper";


export async function fetchIndustryIndexItem(): Promise<IndustryIndexItem[]> {
  const data = await apiFetchClient<IndustryIndexItemDto[]>(
    `/stocks/v1/industry-index`,
    {
      method: "GET",
      credentials: "include",
      headers: {Accept: "application/json"},
      cache: "no-store",
    }
  );
  return toIndustryIndexItems(data);
}