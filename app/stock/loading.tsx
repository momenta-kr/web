// app/stocks/[symbol]/loading.tsx
import React from "react"
import Link from "next/link"
import { ArrowLeft, Bell, Share2, Star } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-md bg-secondary/50 ${className}`} />
}

export default function Loading() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header skeleton */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="w-full px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <Link href="/public">
                <Button variant="ghost" size="icon" aria-label="back" disabled>
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>

              <div className="min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <Skeleton className="h-6 w-40" />
                  <Badge variant="secondary" className="shrink-0">
                    <Skeleton className="h-4 w-10 bg-transparent" />
                  </Badge>
                </div>

                <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="h-5 px-2 text-[11px]">
                    <Skeleton className="h-3 w-10 bg-transparent" />
                  </Badge>
                  <Skeleton className="h-3 w-28" />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" aria-label="favorite" disabled>
                <Star className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="alerts" disabled>
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" aria-label="share" disabled>
                <Share2 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Left */}
          <div className="lg:col-span-2 space-y-6">
            {/* Price + chart card skeleton */}
            <Card className="bg-card border-border">
              <CardContent className="p-6">
                <div className="flex items-end justify-between mb-6 gap-6">
                  <div className="min-w-0">
                    <Skeleton className="h-10 w-44" />
                    <div className="mt-2 flex items-center gap-2">
                      <Skeleton className="h-6 w-40" />
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <Skeleton className="h-6 w-28" />
                      <Skeleton className="h-6 w-44" />
                      <Skeleton className="h-6 w-44" />
                    </div>
                  </div>

                  <div className="text-right">
                    <Skeleton className="h-4 w-28 ml-auto" />
                    <Skeleton className="h-4 w-24 ml-auto mt-2" />
                    <Skeleton className="h-4 w-40 ml-auto mt-2" />
                  </div>
                </div>

                <div className="flex gap-1 mb-4">
                  <Skeleton className="h-9 w-14" />
                  <Skeleton className="h-9 w-14" />
                  <Skeleton className="h-9 w-16" />
                  <Skeleton className="h-9 w-14" />
                </div>

                <div className="h-[350px] overflow-hidden relative rounded-lg border border-border bg-secondary/30">
                  <div className="absolute left-3 top-3">
                    <Skeleton className="h-6 w-40" />
                  </div>
                </div>

                <div className="mt-2 flex justify-end">
                  <Skeleton className="h-6 w-44" />
                </div>
              </CardContent>
            </Card>

            {/* News/AI blocks skeleton */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">뉴스 분석</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-1/2" />
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">AI 인사이트</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-3/4" />
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">뉴스 클러스터</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </CardContent>
            </Card>

            {/* Stats grid skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="bg-card border-border">
                  <CardContent className="p-4 space-y-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-7 w-20" />
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Financial skeleton */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">재무정보</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="p-3 rounded-lg bg-secondary/50 space-y-2">
                      <Skeleton className="h-3 w-14" />
                      <Skeleton className="h-6 w-24" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Sector peers skeleton */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">같은 섹터 종목</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="p-4 rounded-lg bg-secondary/50 space-y-2">
                      <Skeleton className="h-4 w-20 mx-auto" />
                      <Skeleton className="h-6 w-16 mx-auto" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right */}
          <div className="lg:col-span-1">
            <div className="sticky top-20 space-y-6 max-h-[calc(100vh-6rem)] overflow-y-auto pb-6">
              <Card className="bg-card border-border" id="investment-opinion">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base font-semibold">증권사 투자의견</CardTitle>
                    <Badge variant="outline" className="text-[11px]">
                      <Skeleton className="h-3 w-28 bg-transparent" />
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  {/* Controls skeleton */}
                  <div className="flex flex-wrap items-center gap-1">
                    {Array.from({ length: 7 }).map((_, i) => (
                      <Skeleton key={i} className="h-8 w-12" />
                    ))}
                    <Skeleton className="h-4 w-28 ml-auto" />
                  </div>

                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-8 w-32" />
                  </div>

                  {/* Chart skeleton */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-3 w-28" />
                    </div>
                    <Skeleton className="h-[180px] w-full" />
                  </div>

                  {/* Summary tiles skeleton */}
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="rounded-lg bg-secondary/50 p-3 space-y-2">
                        <Skeleton className="h-3 w-16" />
                        <Skeleton className="h-5 w-24" />
                      </div>
                    ))}
                  </div>

                  {/* Table skeleton */}
                  <div className="rounded-lg border border-border overflow-hidden">
                    <div className="px-3 py-2 bg-secondary/30">
                      <Skeleton className="h-3 w-40" />
                    </div>
                    <div className="divide-y divide-border">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="px-3 py-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                          <Skeleton className="h-3 w-5/6" />
                        </div>
                      ))}
                    </div>
                  </div>

                  <Skeleton className="h-3 w-full" />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
