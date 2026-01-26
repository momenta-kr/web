"use client"

import { useMemo, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Activity, Bell, Settings, Newspaper, Layers } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAnomalies } from "@/lib/store"
import type { Market } from "@/lib/types"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { SearchCommand } from "@/components/search-command"
import MobileSearchDialog from "@/components/mobile-search-dialog"

export function Header() {
  const pathname = usePathname()
  const { anomalies } = useAnomalies("KOSPI")
  const [showNotifications, setShowNotifications] = useState(false)

  const highSeverityCount = anomalies.filter((a) => a.severity === "high").length
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  // ✅ 모바일 바텀 네비: 알림 제거
  const mobileNav = useMemo(
    () => [
      { href: "/news", label: "뉴스", icon: Newspaper },
      { href: "/themes", label: "테마", icon: Layers },
      { href: "/settings", label: "설정", icon: Settings },
    ],
    []
  )

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="px-4">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo & Title */}
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Activity className="h-5 w-5 text-primary-foreground" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-foreground">모멘타</h1>
                <p className="text-xs text-muted-foreground">실시간 이상징후 감지</p>
              </div>
            </Link>

            {/* Desktop Tabs (hidden on mobile) */}
            <nav className="hidden md:flex items-center gap-1 rounded-xl border border-border bg-background/60 p-1">
              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn("h-8 gap-2 rounded-lg px-3", isActive("/news") && "bg-secondary text-foreground")}
              >
                <Link href="/news">
                  <Newspaper className="h-4 w-4" />
                  실시간 뉴스
                </Link>
              </Button>

              <Button
                asChild
                variant="ghost"
                size="sm"
                className={cn("h-8 gap-2 rounded-lg px-3", isActive("/themes") && "bg-secondary text-foreground")}
              >
                <Link href="/themes">
                  <Layers className="h-4 w-4" />
                  테마
                </Link>
              </Button>
            </nav>

            {/* Search & Actions */}
            <div className="flex items-center gap-2">
              <SearchCommand />
              <ThemeToggle />

              {/* ✅ 알림은 상단(헤더)에서만: 모바일에서도 보이게 */}
              <Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotifications(true)}>
                <Bell className="h-5 w-5" />
                {highSeverityCount > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-destructive text-destructive-foreground">
                    {highSeverityCount}
                  </Badge>
                )}
              </Button>

              <Link href="/settings" className="hidden md:block">
                <Button variant="ghost" size="icon">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Search Dialog */}
      <MobileSearchDialog />

      {/* Mobile Bottom Navigation (no alerts) */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto max-w-md">
          <div className="grid grid-cols-3">
            {mobileNav.map((item) => {
              const Icon = item.icon
              const active = isActive(item.href)

              return (
                <Link key={item.href} href={item.href} className="w-full" aria-label={item.label}>
                  <div
                    className={cn(
                      "relative flex flex-col items-center justify-center gap-1 py-2 text-xs",
                      active ? "text-foreground" : "text-muted-foreground"
                    )}
                  >
                    <Icon className={cn("h-5 w-5", active && "text-foreground")} />
                    <span className={cn(active && "font-medium")}>{item.label}</span>
                    {active && <span className="mt-1 h-1 w-6 rounded-full bg-primary" />}
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </nav>

      {/* Notifications Dialog */}
      <Dialog open={showNotifications} onOpenChange={setShowNotifications}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              최근 알림
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {anomalies.slice(0, 10).map((anomaly) => (
              <div
                key={anomaly.id}
                className={cn(
                  "p-3 rounded-lg border",
                  anomaly.severity === "high"
                    ? "border-chart-2/30 bg-chart-2/10"
                    : anomaly.severity === "medium"
                      ? "border-chart-4/30 bg-chart-4/10"
                      : "border-border bg-secondary/50"
                )}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium text-foreground">{anomaly.name}</span>
                  <span className="text-xs text-muted-foreground">{anomaly.time}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-1">{anomaly.description}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
