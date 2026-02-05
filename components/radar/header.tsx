"use client"

import { useEffect, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Activity, Bell, Settings, Newspaper, Layers } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useAnomalies } from "@/lib/store"
import { cn } from "@/lib/utils"
import { ThemeToggle } from "@/components/theme-toggle"
import { SearchCommand } from "@/components/search-command"
import MobileSearchDialog from "@/components/mobile-search-dialog"
import Image from "next/image";

export function Header() {
  const pathname = usePathname()
  const { anomalies } = useAnomalies("KOSPI")
  const [showNotifications, setShowNotifications] = useState(false)

  const highSeverityCount = anomalies.filter((a) => a.severity === "high").length
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  // ✅ 추가: 스크롤에 따라 헤더 숨김/표시
  const [hidden, setHidden] = useState(false)
  const lastYRef = useRef(0)

  useEffect(() => {
    lastYRef.current = window.scrollY

    const THRESHOLD = 10      // 민감도(픽셀)
    const HIDE_AFTER = 64     // 헤더 높이쯤 내려간 뒤부터 숨기기

    const onScroll = () => {
      const y = window.scrollY
      const diff = y - lastYRef.current

      // 최상단이면 무조건 보이기
      if (y <= 0) {
        setHidden(false)
        lastYRef.current = y
        return
      }

      // 아래로 스크롤하면 숨김 (조금 이상 내려갔을 때만)
      if (diff > THRESHOLD && y > HIDE_AFTER) {
        setHidden(true)
      }
      // 위로 스크롤하면 보이기
      else if (diff < -THRESHOLD) {
        setHidden(false)
      }

      lastYRef.current = y
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
      <>
        {/* ✅ sticky -> fixed + translate로 숨김/표시 */}
        <header
            className={cn(
                "fixed top-0 left-0 right-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
                "transition-transform duration-200 will-change-transform",
                hidden ? "-translate-y-full" : "translate-y-0"
            )}
        >
          <div className="px-4">
            <div className="flex h-16 items-center justify-between gap-4">
              {/* Logo & Title */}
              <Link href="/" className="flex items-center gap-1 hover:opacity-80 transition-opacity">
                <div className="items-center justify-center">
                  <Image src="/logo.png" alt="logo" width={32} height={32} className="object-contain" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-semibold text-foreground">모멘타</h1>
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

                {/*<Button variant="ghost" size="icon" className="relative" onClick={() => setShowNotifications(true)}>*/}
                {/*  <Bell className="h-5 w-5" />*/}
                {/*  {highSeverityCount > 0 && (*/}
                {/*      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-destructive text-destructive-foreground">*/}
                {/*        {highSeverityCount}*/}
                {/*      </Badge>*/}
                {/*  )}*/}
                {/*</Button>*/}

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

        {/* Notifications Dialog */}
        {/*<Dialog open={showNotifications} onOpenChange={setShowNotifications}>*/}
        {/*  <DialogContent className="bg-card border-border max-w-md">*/}
        {/*    <DialogHeader>*/}
        {/*      <DialogTitle className="flex items-center gap-2">*/}
        {/*        <Bell className="h-5 w-5" />*/}
        {/*        최근 알림*/}
        {/*      </DialogTitle>*/}
        {/*    </DialogHeader>*/}

        {/*    <div className="space-y-2 max-h-[400px] overflow-y-auto">*/}
        {/*      {anomalies.slice(0, 10).map((anomaly) => (*/}
        {/*          <div*/}
        {/*              key={anomaly.id}*/}
        {/*              className={cn(*/}
        {/*                  "p-3 rounded-lg border",*/}
        {/*                  anomaly.severity === "high"*/}
        {/*                      ? "border-chart-2/30 bg-chart-2/10"*/}
        {/*                      : anomaly.severity === "medium"*/}
        {/*                          ? "border-chart-4/30 bg-chart-4/10"*/}
        {/*                          : "border-border bg-secondary/50"*/}
        {/*              )}*/}
        {/*          >*/}
        {/*            <div className="flex items-center justify-between">*/}
        {/*              <span className="font-medium text-foreground">{anomaly.name}</span>*/}
        {/*              <span className="text-xs text-muted-foreground">{anomaly.time}</span>*/}
        {/*            </div>*/}
        {/*            <p className="text-sm text-muted-foreground mt-1">{anomaly.description}</p>*/}
        {/*          </div>*/}
        {/*      ))}*/}
        {/*    </div>*/}
        {/*  </DialogContent>*/}
        {/*</Dialog>*/}
      </>
  )
}
