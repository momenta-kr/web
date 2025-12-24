"use client"

import { useState } from "react"
import { Bell, Plus, Trash2, TrendingUp, TrendingDown, Volume2, Zap } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { useAlertRules } from "@/lib/store"
import type { AnomalyType } from "@/lib/types"

const typeConfig = {
  surge: { icon: TrendingUp, label: "급등", color: "text-chart-1", bg: "bg-chart-1/20" },
  plunge: { icon: TrendingDown, label: "급락", color: "text-chart-2", bg: "bg-chart-2/20" },
  volume: { icon: Volume2, label: "거래량", color: "text-chart-3", bg: "bg-chart-3/20" },
  volatility: { icon: Zap, label: "변동성", color: "text-chart-4", bg: "bg-chart-4/20" },
}

export function AlertSettings() {
  const { rules, toggleRule, deleteRule, addRule } = useAlertRules()
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newRuleType, setNewRuleType] = useState<AnomalyType>("surge")
  const [newRuleThreshold, setNewRuleThreshold] = useState("5")

  const enabledCount = rules.filter((r) => r.enabled).length

  const handleAddRule = () => {
    const threshold = Number.parseFloat(newRuleThreshold)
    let condition = ""

    switch (newRuleType) {
      case "surge":
        condition = `5분간 +${threshold}% 이상 급등`
        break
      case "plunge":
        condition = `5분간 -${threshold}% 이상 급락`
        break
      case "volume":
        condition = `거래량 평균 대비 ${threshold}% 초과`
        break
      case "volatility":
        condition = `호가 스프레드 ${threshold}% 초과`
        break
    }

    addRule({
      type: newRuleType,
      condition,
      threshold,
      enabled: true,
    })

    setIsAddDialogOpen(false)
    setNewRuleType("surge")
    setNewRuleThreshold("5")
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Bell className="h-4 w-4" />
            알림 설정
          </CardTitle>
          <Badge variant="secondary" className="text-xs">
            {enabledCount}개 활성
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {rules.map((rule) => {
          const config = typeConfig[rule.type]
          const Icon = config.icon

          return (
            <div
              key={rule.id}
              className={cn(
                "flex items-center gap-3 rounded-lg border border-border p-3 transition-colors",
                rule.enabled ? "bg-secondary/50" : "bg-secondary/20 opacity-60",
              )}
            >
              <div className={cn("p-1.5 rounded-md", config.bg)}>
                <Icon className={cn("h-4 w-4", config.color)} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground">{config.label}</span>
                </div>
                <p className="text-sm text-foreground truncate">{rule.condition}</p>
              </div>

              <div className="flex items-center gap-2">
                <Switch checked={rule.enabled} onCheckedChange={() => toggleRule(rule.id)} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-chart-2"
                  onClick={() => deleteRule(rule.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )
        })}

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="w-full border-dashed border-border hover:border-primary hover:bg-secondary bg-transparent"
            >
              <Plus className="h-4 w-4 mr-2" />새 알림 규칙 추가
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle>새 알림 규칙 추가</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>알림 유형</Label>
                <Select value={newRuleType} onValueChange={(v) => setNewRuleType(v as AnomalyType)}>
                  <SelectTrigger className="bg-secondary border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="surge">급등</SelectItem>
                    <SelectItem value="plunge">급락</SelectItem>
                    <SelectItem value="volume">거래량</SelectItem>
                    <SelectItem value="volatility">변동성</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>임계값 (%)</Label>
                <Input
                  type="number"
                  value={newRuleThreshold}
                  onChange={(e) => setNewRuleThreshold(e.target.value)}
                  className="bg-secondary border-border"
                  placeholder="5"
                />
              </div>

              <Button onClick={handleAddRule} className="w-full">
                규칙 추가
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}
