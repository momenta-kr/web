"use client"

import { useEffect } from "react"
import { X, AlertTriangle, CheckCircle, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNotifications, useAnomalies, useMarketState } from "@/lib/store"
import { cn } from "@/lib/utils"

export function NotificationToast() {
  const { notifications, addNotification, removeNotification } = useNotifications()
  const { market } = useMarketState()
  const { anomalies } = useAnomalies(market)

  // 긴급 이상징후 발생 시 토스트 알림
  useEffect(() => {
    if (anomalies.length > 0) {
      const latest = anomalies[0]
      if (latest.severity === "high") {
        addNotification(`${latest.name}: ${latest.description}`, "warning")
      }
    }
  }, [anomalies]) // Updated to use the entire anomalies array

  if (notifications.length === 0) return null

  return (
    <div className="fixed top-12 right-4 z-50 space-y-2">
      {notifications.map((notification) => {
        const Icon =
          notification.type === "warning" ? AlertTriangle : notification.type === "success" ? CheckCircle : Info

        return (
          <div
            key={notification.id}
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-lg border shadow-lg max-w-sm animate-in slide-in-from-right",
              notification.type === "warning"
                ? "bg-chart-4/10 border-chart-4/30 text-chart-4"
                : notification.type === "success"
                  ? "bg-chart-1/10 border-chart-1/30 text-chart-1"
                  : "bg-secondary border-border text-foreground",
            )}
          >
            <Icon className="h-5 w-5 shrink-0" />
            <p className="text-sm flex-1">{notification.message}</p>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0"
              onClick={() => removeNotification(notification.id)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )
      })}
    </div>
  )
}
