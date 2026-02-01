import {apiFetchClient} from "@/lib/http/client";
import {ThemeDto} from "@/domain/stock/types/theme.dto";
import {Theme} from "@/domain/stock/types/theme.model";
import {toThemeModel} from "@/domain/stock/mappers/theme.mapper";
import {StockCurrentPriceOutputDto} from "@/domain/stock/types/stock-current-price.dto";
import {StockCurrentPrice} from "@/domain/stock/types/stock-current-proce.model";
import {toStockCurrentPriceModel} from "@/domain/stock/mappers/stock-current-price.mapper";

export async function fetchStockCurrentPrice(stockCode: string): Promise<StockCurrentPrice> {
  const data = await apiFetchClient<StockCurrentPriceOutputDto>(
    `/stocks/v1/${stockCode}`,
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  )
  return toStockCurrentPriceModel(data);
}