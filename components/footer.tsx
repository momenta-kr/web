import Link from "next/link"

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border bg-muted/30 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* 상단: 서비스명 및 링크 */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">Market Radar</span>
            <span className="text-xs text-muted-foreground">
              시장 이상징후 레이더
            </span>
          </div>
          <nav className="flex flex-wrap gap-4 text-xs">
            <Link
              href="/terms"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              이용약관
            </Link>
            <Link
              href="/privacy"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              개인정보처리방침
            </Link>
            <Link
              href="/contact"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              문의하기
            </Link>
          </nav>
        </div>

        {/* 중단: 면책 조항 */}
        <div className="py-4 space-y-2 text-xs text-muted-foreground border-b border-border/50">
          <p className="leading-relaxed">
            본 서비스는{" "}
            <span className="font-medium text-foreground">
              한국투자증권 OPEN API
            </span>
            를 통해 데이터를 제공받고 있습니다. 시세 정보는 실시간이 아닌 지연된
            데이터일 수 있으며, 투자 판단의 참고자료로만 활용하시기 바랍니다.
          </p>
          <p className="leading-relaxed">
            본 서비스에서 제공하는 정보는 투자 권유가 아니며, 이를 근거로 한
            투자손실에 대해 당사는 어떠한 법적 책임도 지지 않습니다.
          </p>
          <p className="leading-relaxed font-medium text-foreground/80">
            본 사이트의 콘텐츠, 데이터, 정보는 저작권법에 의해 보호됩니다. 무단
            복제, 배포, 크롤링, 스크래핑 및 상업적 이용을 금지합니다.
          </p>
        </div>

        {/* 하단: Copyright */}
        <div className="pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-xs text-muted-foreground">
          <p>
            &copy; {currentYear} Market Radar. All rights reserved.
          </p>
          <p className="text-[10px]">
            주식 시세 데이터 제공: 한국투자증권
          </p>
        </div>
      </div>
    </footer>
  )
}
