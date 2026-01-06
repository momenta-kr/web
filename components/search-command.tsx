"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Search, TrendingUp, TrendingDown } from "lucide-react"
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { stocksData } from "@/lib/mock-data"
import { cn } from "@/lib/utils"

export function SearchCommand() {
  const [open, setOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault()
        setOpen((prev) => !prev)
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [])

  const handleSelect = useCallback(
    (ticker: string) => {
      setOpen(false)
      router.push(`/stock/${ticker}`)
    },
    [router],
  )

  // 상승/하락 종목 분류
  const gainers = stocksData.filter((s) => s.changePercent > 0).sort((a, b) => b.changePercent - a.changePercent)
  const losers = stocksData.filter((s) => s.changePercent < 0).sort((a, b) => a.changePercent - b.changePercent)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="hidden lg:flex items-center gap-2 h-9 w-[260px] rounded-md border border-input bg-secondary px-3 text-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <Search className="h-4 w-4" />
        <span className="flex-1 text-left">종목 검색...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {/* 모바일용 아이콘 버튼 */}
      <button
        onClick={() => setOpen(true)}
        className="lg:hidden flex items-center justify-center h-9 w-9 rounded-md hover:bg-accent transition-colors"
      >
        <Search className="h-5 w-5" />
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput placeholder="종목명 또는 종목코드로 검색..." />
        <CommandList>
          <CommandEmpty>검색 결과가 없습니다.</CommandEmpty>

          {/* 전체 종목 */}
          <CommandGroup heading="전체 종목">
            {stocksData.map((stock) => (
              <CommandItem
                key={stock.ticker}
                value={`${stock.name} ${stock.ticker}`}
                onSelect={() => handleSelect(stock.ticker)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "flex h-8 w-8 items-center justify-center rounded-md",
                      stock.changePercent >= 0 ? "bg-chart-1/20" : "bg-chart-2/20",
                    )}
                  >
                    {stock.changePercent >= 0 ? (
                      <TrendingUp className="h-4 w-4 text-chart-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-chart-2" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{stock.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {stock.ticker} · {stock.sector} · {stock.market}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium">{stock.price.toLocaleString()}원</p>
                  <p className={cn("text-xs font-medium", stock.changePercent >= 0 ? "text-chart-1" : "text-chart-2")}>
                    {stock.changePercent >= 0 ? "+" : ""}
                    {stock.changePercent.toFixed(2)}%
                  </p>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>

          {/* 상승 TOP */}
          <CommandGroup heading="상승 TOP 5">
            {gainers.slice(0, 5).map((stock) => (
              <CommandItem
                key={`gainer-${stock.ticker}`}
                value={`상승 ${stock.name} ${stock.ticker}`}
                onSelect={() => handleSelect(stock.ticker)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-chart-1/20">
                    <TrendingUp className="h-4 w-4 text-chart-1" />
                  </div>
                  <div>
                    <p className="font-medium">{stock.name}</p>
                    <p className="text-xs text-muted-foreground">{stock.ticker}</p>
                  </div>
                </div>
                <span className="text-chart-1 font-medium">+{stock.changePercent.toFixed(2)}%</span>
              </CommandItem>
            ))}
          </CommandGroup>

          {/* 하락 TOP */}
          <CommandGroup heading="하락 TOP 5">
            {losers.slice(0, 5).map((stock) => (
              <CommandItem
                key={`loser-${stock.ticker}`}
                value={`하락 ${stock.name} ${stock.ticker}`}
                onSelect={() => handleSelect(stock.ticker)}
                className="flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-chart-2/20">
                    <TrendingDown className="h-4 w-4 text-chart-2" />
                  </div>
                  <div>
                    <p className="font-medium">{stock.name}</p>
                    <p className="text-xs text-muted-foreground">{stock.ticker}</p>
                  </div>
                </div>
                <span className="text-chart-2 font-medium">{stock.changePercent.toFixed(2)}%</span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  )
}
