// middleware.ts
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const PUBLIC_PATHS = [
    "/manifest.webmanifest",
    "/sw.js",
    "/apple-icon.png",
    "/icon-192x192.png",
    "/icon-512x512.png",
    "/favicon.ico",
]

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl

    // PWA 필수 파일은 인증 우회
    if (PUBLIC_PATHS.some((p) => pathname === p)) {
        return NextResponse.next()
    }

    // ✅ 여기부터 기존 인증 로직
    // return authMiddleware(req)
    return NextResponse.next()
}
