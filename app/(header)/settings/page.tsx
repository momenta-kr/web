"use client"

import Link from "next/link"
import { ArrowLeft, Bell, Moon, Globe, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { useState } from "react"

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    pushNotifications: true,
    soundAlerts: false,
    emailAlerts: true,
    darkMode: true,
    language: "ko",
    refreshInterval: "3",
  })

  const updateSetting = (key: string, value: boolean | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center gap-4">
            <Link href="/public">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold text-foreground">설정</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6 max-w-2xl">
        <div className="space-y-6">
          {/* Notification Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                알림 설정
              </CardTitle>
              <CardDescription>이상징후 감지 시 알림을 받는 방법을 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="push" className="text-foreground">
                    푸시 알림
                  </Label>
                  <p className="text-sm text-muted-foreground">브라우저 푸시 알림 받기</p>
                </div>
                <Switch
                  id="push"
                  checked={settings.pushNotifications}
                  onCheckedChange={(v) => updateSetting("pushNotifications", v)}
                />
              </div>

              <Separator className="bg-border" />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="sound" className="text-foreground">
                    소리 알림
                  </Label>
                  <p className="text-sm text-muted-foreground">알림 시 소리 재생</p>
                </div>
                <Switch
                  id="sound"
                  checked={settings.soundAlerts}
                  onCheckedChange={(v) => updateSetting("soundAlerts", v)}
                />
              </div>

              <Separator className="bg-border" />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email" className="text-foreground">
                    이메일 알림
                  </Label>
                  <p className="text-sm text-muted-foreground">중요 알림을 이메일로 받기</p>
                </div>
                <Switch
                  id="email"
                  checked={settings.emailAlerts}
                  onCheckedChange={(v) => updateSetting("emailAlerts", v)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Display Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Moon className="h-5 w-5" />
                화면 설정
              </CardTitle>
              <CardDescription>앱의 외관과 표시 방식을 설정합니다</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="dark" className="text-foreground">
                    다크 모드
                  </Label>
                  <p className="text-sm text-muted-foreground">어두운 테마 사용</p>
                </div>
                <Switch id="dark" checked={settings.darkMode} onCheckedChange={(v) => updateSetting("darkMode", v)} />
              </div>

              <Separator className="bg-border" />

              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground">언어</Label>
                  <p className="text-sm text-muted-foreground">앱 표시 언어 선택</p>
                </div>
                <Select value={settings.language} onValueChange={(v) => updateSetting("language", v)}>
                  <SelectTrigger className="w-[140px] bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ko">한국어</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Data Settings */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                데이터 설정
              </CardTitle>
              <CardDescription>실시간 데이터 업데이트 설정</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-foreground">새로고침 간격</Label>
                  <p className="text-sm text-muted-foreground">데이터 자동 업데이트 주기</p>
                </div>
                <Select value={settings.refreshInterval} onValueChange={(v) => updateSetting("refreshInterval", v)}>
                  <SelectTrigger className="w-[140px] bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1초</SelectItem>
                    <SelectItem value="3">3초</SelectItem>
                    <SelectItem value="5">5초</SelectItem>
                    <SelectItem value="10">10초</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* About */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5" />앱 정보
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>시장 레이더 v1.0.0</p>
              <p>실시간 시장 이상징후 감지 대시보드</p>
              <Separator className="bg-border my-4" />
              <p className="text-xs">
                본 서비스는 투자 권유가 아니며, 개별 종목에 대한 투자 조언을 제공하지 않습니다. 투자의 최종 결정은
                이용자 본인의 판단에 따라 이루어져야 합니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
