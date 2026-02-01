import {apiFetchClient} from "@/lib/http/client";
import {ThemeDto} from "@/domain/stock/types/theme.dto";
import {Theme} from "@/domain/stock/types/theme.model";
import {toThemeList} from "@/domain/stock/mappers/theme.mapper";

export async function fetchTheme(): Promise<Theme[]> {
  const data = await apiFetchClient<ThemeDto[]>(
    "/stocks/v1/themes",
    {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
    }
  )
  return toThemeList(data);
}