"use client"

import Link from "next/link"
import { ArrowLeft, Bell, Moon, Globe, Info, RotateCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useMemo, useState, type ReactNode } from "react"

type SettingsState = {
  pushNotifications: boolean
  soundAlerts: boolean
  emailAlerts: boolean
  darkMode: boolean
  language: "ko" | "en"
  refreshInterval: "1" | "3" | "5" | "10"
}

const DEFAULT_SETTINGS: SettingsState = {
  pushNotifications: true,
  soundAlerts: false,
  emailAlerts: true,
  darkMode: true,
  language: "ko",
  refreshInterval: "3",
}

// =========================
// UI helpers (RealtimeNews / ThemeExplorer vibe)
// =========================
function Divider() {
  return <div className="h-px bg-border/60" />
}

function Panel({
                 title,
                 icon,
                 description,
                 right,
                 children,
                 className,
               }: {
  title: string
  icon?: ReactNode
  description?: ReactNode
  right?: ReactNode
  children: ReactNode
  className?: string
}) {
  return (
      <div className={cn("rounded-2xl border border-border/70 bg-background/50 backdrop-blur", className)}>
        <div className="px-4 py-3 border-b border-border/60 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {icon ? <div className="text-muted-foreground">{icon}</div> : null}
              <div className="text-sm font-semibold text-foreground">{title}</div>
            </div>
            {description ? <div className="mt-0.5 text-[11px] text-muted-foreground">{description}</div> : null}
          </div>
          {right}
        </div>
        <div className="p-4">{children}</div>
      </div>
  )
}

function SettingRow({
                      label,
                      desc,
                      right,
                      htmlFor,
                    }: {
  label: string
  desc?: string
  right: ReactNode
  htmlFor?: string
}) {
  return (
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <Label htmlFor={htmlFor} className="text-foreground">
            {label}
          </Label>
          {desc ? <p className="mt-0.5 text-sm text-muted-foreground">{desc}</p> : null}
        </div>
        <div className="shrink-0">{right}</div>
      </div>
  )
}

// =========================
// Component
// =========================
export default function SettingsPage() {
  const [settings, setSettings] = useState<SettingsState>(DEFAULT_SETTINGS)

  const updateSetting = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const notiEnabledCount = useMemo(
      () => [settings.pushNotifications, settings.soundAlerts, settings.emailAlerts].filter(Boolean).length,
      [settings.pushNotifications, settings.soundAlerts, settings.emailAlerts],
  )

  const headerHint = useMemo(() => {
    const lang = settings.language === "ko" ? "한국어" : "EN"
    return `${lang} · ${settings.refreshInterval}초`
  }, [settings.language, settings.refreshInterval])

  const resetAll = () => setSettings(DEFAULT_SETTINGS)

  return (
      <section
          className={cn(
              "w-full",
              "bg-[radial-gradient(60%_40%_at_10%_0%,rgba(59,130,246,0.10),transparent_60%),radial-gradient(60%_40%_at_90%_0%,rgba(239,68,68,0.10),transparent_60%)]",
          )}
          style={{ height: "calc(100svh - var(--app-header-h, 64px))" }}
      >
        <div className="h-full flex flex-col min-h-0">
          {/* ======= Sticky Header ======= */}
          <div className="sticky top-0 z-30 border-b border-border/70 bg-background/65 backdrop-blur">
            <div className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href="/public" className="shrink-0">
                      <Button variant="ghost" size="icon" className="h-9 w-9 rounded-2xl">
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                    </Link>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h1 className="text-base font-semibold text-foreground">설정</h1>
                        <Badge variant="outline" className="text-[11px] text-muted-foreground">
                          {notiEnabledCount}/3 알림 ON
                        </Badge>
                        <span className="text-[11px] text-muted-foreground">{headerHint}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-muted-foreground">
                        알림/화면/데이터 동작을 조정해요
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button variant="secondary" size="sm" className="h-9" onClick={resetAll}>
                    <RotateCcw className="mr-1 h-4 w-4" />
                    초기화
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* ======= Body ======= */}
          <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain">
            <div className="p-4 max-w-3xl mx-auto space-y-3 pb-[env(safe-area-inset-bottom)]">
              {/* Notification */}
              <Panel
                  title="알림 설정"
                  icon={<Bell className="h-4 w-4" />}
                  description="이상징후 감지 시 알림을 받는 방법을 설정합니다"
                  right={
                    <Badge variant="outline" className="text-[11px] text-muted-foreground tabular-nums">
                      {notiEnabledCount}개 활성
                    </Badge>
                  }
              >
                <div className="space-y-4">
                  <SettingRow
                      htmlFor="push"
                      label="푸시 알림"
                      desc="브라우저 푸시 알림 받기"
                      right={
                        <Switch
                            id="push"
                            checked={settings.pushNotifications}
                            onCheckedChange={(v) => updateSetting("pushNotifications", v)}
                        />
                      }
                  />

                  <Divider />

                  <SettingRow
                      htmlFor="sound"
                      label="소리 알림"
                      desc="알림 시 소리 재생"
                      right={
                        <Switch
                            id="sound"
                            checked={settings.soundAlerts}
                            onCheckedChange={(v) => updateSetting("soundAlerts", v)}
                        />
                      }
                  />

                  <Divider />

                  <SettingRow
                      htmlFor="email"
                      label="이메일 알림"
                      desc="중요 알림을 이메일로 받기"
                      right={
                        <Switch
                            id="email"
                            checked={settings.emailAlerts}
                            onCheckedChange={(v) => updateSetting("emailAlerts", v)}
                        />
                      }
                  />
                </div>
              </Panel>

              {/* Display */}
              <Panel
                  title="화면 설정"
                  icon={<Moon className="h-4 w-4" />}
                  description="앱의 외관과 표시 방식을 설정합니다"
              >
                <div className="space-y-4">
                  <SettingRow
                      htmlFor="dark"
                      label="다크 모드"
                      desc="어두운 테마 사용"
                      right={
                        <Switch
                            id="dark"
                            checked={settings.darkMode}
                            onCheckedChange={(v) => updateSetting("darkMode", v)}
                        />
                      }
                  />

                  <Divider />

                  <SettingRow
                      label="언어"
                      desc="앱 표시 언어 선택"
                      right={
                        <Select value={settings.language} onValueChange={(v) => updateSetting("language", v as SettingsState["language"])}>
                          <SelectTrigger className="w-[140px] bg-background/50 border-border/70 rounded-2xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ko">한국어</SelectItem>
                            <SelectItem value="en">English</SelectItem>
                          </SelectContent>
                        </Select>
                      }
                  />
                </div>
              </Panel>

              {/* Data */}
              <Panel
                  title="데이터 설정"
                  icon={<Globe className="h-4 w-4" />}
                  description="실시간 데이터 업데이트 설정"
              >
                <div className="space-y-4">
                  <SettingRow
                      label="새로고침 간격"
                      desc="데이터 자동 업데이트 주기"
                      right={
                        <Select
                            value={settings.refreshInterval}
                            onValueChange={(v) =>
                                updateSetting("refreshInterval", v as SettingsState["refreshInterval"])
                            }
                        >
                          <SelectTrigger className="w-[140px] bg-background/50 border-border/70 rounded-2xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1초</SelectItem>
                            <SelectItem value="3">3초</SelectItem>
                            <SelectItem value="5">5초</SelectItem>
                            <SelectItem value="10">10초</SelectItem>
                          </SelectContent>
                        </Select>
                      }
                  />
                </div>
              </Panel>

              {/* About */}
              <Panel title="앱 정보" icon={<Info className="h-4 w-4" />}>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <div className="flex items-center justify-between gap-2">
                    <span>시장 레이더</span>
                    <Badge variant="outline" className="text-[11px] text-muted-foreground">
                      v1.0.0
                    </Badge>
                  </div>
                  <p>실시간 시장 이상징후 감지 대시보드</p>

                  <div className="py-2">
                    <Divider />
                  </div>

                  <p className="text-xs leading-relaxed">
                    본 서비스는 투자 권유가 아니며, 개별 종목에 대한 투자 조언을 제공하지 않습니다. 투자의 최종 결정은
                    이용자 본인의 판단에 따라 이루어져야 합니다.
                  </p>
                </div>
              </Panel>
            </div>
          </div>
        </div>
      </section>
  )
}
