import { ThemeDto } from "@/domain/stock/types/theme.dto"
import type { Theme } from "@/domain/stock/types/theme.model"

export function toTheme(dto: ThemeDto): Theme {
  return {
    themeCode: dto.themeCode,
    themeName: dto.themeName,
    stockCount: dto.stockCount,
    averageChangeRate: dto.averageChangeRate,
  }
}

export function toThemeList(dtos: ThemeDto[]): Theme[] {
  return dtos.map(toTheme)
}
