import { Metadata } from "next"

export const metadata: Metadata = {
  title: "이용약관 | Market Radar",
  description: "Market Radar 서비스 이용약관",
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-8">이용약관</h1>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          <section>
            <h2 className="text-lg font-semibold mb-3">제1조 (목적)</h2>
            <p className="text-muted-foreground leading-relaxed">
              본 약관은 Market Radar(이하 &quot;서비스&quot;)가 제공하는 주식
              시장 정보 서비스의 이용과 관련하여 서비스와 이용자 간의 권리, 의무
              및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">제2조 (정의)</h2>
            <ul className="text-muted-foreground space-y-2 list-disc list-inside">
              <li>
                &quot;서비스&quot;란 Market Radar가 제공하는 주식 시세, 시장
                이상징후 감지, 뉴스 분석 등 일체의 정보 서비스를 의미합니다.
              </li>
              <li>
                &quot;이용자&quot;란 본 약관에 따라 서비스가 제공하는 서비스를
                이용하는 자를 말합니다.
              </li>
              <li>
                &quot;콘텐츠&quot;란 서비스에서 제공하는 모든 정보, 데이터, 텍스트,
                그래픽, 차트 등을 의미합니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">제3조 (약관의 효력)</h2>
            <p className="text-muted-foreground leading-relaxed">
              본 약관은 서비스를 이용하고자 하는 모든 이용자에게 적용됩니다.
              서비스를 이용함으로써 본 약관에 동의한 것으로 간주합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">제4조 (서비스의 제공)</h2>
            <ul className="text-muted-foreground space-y-2 list-disc list-inside">
              <li>주식 시세 정보 제공 (한국투자증권 OPEN API 기반)</li>
              <li>시장 이상징후 감지 및 알림</li>
              <li>주식 관련 뉴스 및 분석 정보</li>
              <li>테마별 종목 분류 및 탐색</li>
              <li>기타 서비스가 정하는 정보 제공 서비스</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              제5조 (서비스 이용의 제한)
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              다음 각 호에 해당하는 경우 서비스 이용이 제한될 수 있습니다.
            </p>
            <ul className="text-muted-foreground space-y-2 list-disc list-inside">
              <li>서비스의 정보를 무단으로 복제, 배포, 전송하는 행위</li>
              <li>
                자동화된 수단(크롤링, 스크래핑, 봇 등)을 이용하여 데이터를
                수집하는 행위
              </li>
              <li>서비스의 정보를 상업적 목적으로 무단 이용하는 행위</li>
              <li>서비스의 운영을 방해하거나 시스템에 부하를 주는 행위</li>
              <li>기타 관련 법령에 위반되는 행위</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">제6조 (지적재산권)</h2>
            <p className="text-muted-foreground leading-relaxed">
              서비스가 제공하는 모든 콘텐츠에 대한 저작권 및 지적재산권은
              서비스에 귀속됩니다. 이용자는 서비스의 사전 동의 없이 콘텐츠를
              복제, 전송, 출판, 배포, 방송 등의 방법으로 이용하거나 제3자에게
              이용하게 할 수 없습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">제7조 (면책조항)</h2>
            <ul className="text-muted-foreground space-y-2 list-disc list-inside">
              <li>
                서비스에서 제공하는 정보는 한국투자증권 OPEN API를 통해
                제공받으며, 실시간 데이터가 아닌 지연된 정보일 수 있습니다.
              </li>
              <li>
                서비스에서 제공하는 정보는 투자 권유가 아니며, 참고 자료로만
                활용하시기 바랍니다.
              </li>
              <li>
                이용자가 서비스의 정보를 이용하여 행한 투자 결과에 대해 서비스는
                어떠한 법적 책임도 지지 않습니다.
              </li>
              <li>
                서비스는 천재지변, 시스템 장애 등 불가항력적인 사유로 인한
                서비스 중단에 대해 책임지지 않습니다.
              </li>
              <li>
                데이터 제공처(한국투자증권)의 사정으로 인한 정보의 오류, 지연,
                누락에 대해 서비스는 책임지지 않습니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">제8조 (약관의 변경)</h2>
            <p className="text-muted-foreground leading-relaxed">
              서비스는 필요한 경우 약관을 변경할 수 있으며, 변경된 약관은
              서비스 내 공지를 통해 효력이 발생합니다. 변경된 약관에 동의하지
              않는 이용자는 서비스 이용을 중단할 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">제9조 (준거법 및 관할)</h2>
            <p className="text-muted-foreground leading-relaxed">
              본 약관의 해석 및 적용에 관하여는 대한민국 법률을 따르며, 서비스
              이용과 관련한 분쟁에 대해서는 서울중앙지방법원을 전속관할법원으로
              합니다.
            </p>
          </section>

          <section className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              본 약관은 2024년 1월 1일부터 시행됩니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
