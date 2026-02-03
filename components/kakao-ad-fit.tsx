"use client"

import { useEffect, useRef } from "react"

type Props = {
    unit: string
    width: number
    height: number
    className?: string
}

export default function KakaoAdFit({ unit, width, height, className }: Props) {
    const containerRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const container = containerRef.current
        if (!container) return

        // 중복 렌더 방지
        container.innerHTML = ""

        const ins = document.createElement("ins")
        ins.className = "kakao_ad_area"
        ins.style.display = "none"
        ins.setAttribute("data-ad-unit", unit)
        ins.setAttribute("data-ad-width", String(width))
        ins.setAttribute("data-ad-height", String(height))

        const script = document.createElement("script")
        script.type = "text/javascript"
        script.async = true
        script.src = "//t1.daumcdn.net/kas/static/ba.min.js"

        container.appendChild(ins)
        container.appendChild(script)

        return () => {
            container.innerHTML = ""
        }
    }, [unit, width, height])

    return <div ref={containerRef} style={{ width, height }} className={className} />
}
