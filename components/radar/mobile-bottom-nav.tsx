"use client"

import { useMemo } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Newspaper, Layers, House, Settings } from "lucide-react"

import { cn } from "@/lib/utils"

export function MobileBottomNav() {
  const pathname = usePathname()
  const isActive = (href: string) => pathname === href || pathname.startsWith(`${href}/`)

  const mobileNav = useMemo(
    () => [
      { href: "/", label: "홈", icon: House },
      { href: "/news", label: "뉴스", icon: Newspaper },
      { href: "/themes", label: "테마", icon: Layers },
      { href: "/settings", label: "설정", icon: Settings },
    ],
    []
  )

  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto max-w-md">
        <div className="grid grid-cols-4">
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
  )
}
