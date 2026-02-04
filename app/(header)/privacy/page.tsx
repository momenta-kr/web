import { Metadata } from "next"

export const metadata: Metadata = {
  title: "개인정보처리방침 | Market Radar",
  description: "Market Radar 개인정보처리방침",
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-2xl font-bold mb-8">개인정보처리방침</h1>

        <div className="prose prose-sm dark:prose-invert max-w-none space-y-8">
          <section>
            <p className="text-muted-foreground leading-relaxed">
              Market Radar(이하 &quot;서비스&quot;)는 이용자의 개인정보를
              중요시하며, 「개인정보 보호법」 등 관련 법령을 준수합니다. 본
              개인정보처리방침을 통해 이용자의 개인정보가 어떻게 수집, 이용,
              관리되는지 안내드립니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              제1조 (수집하는 개인정보 항목)
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              서비스는 별도의 회원가입 없이 이용 가능하며, 다음과 같은 정보가
              자동으로 수집될 수 있습니다.
            </p>
            <ul className="text-muted-foreground space-y-2 list-disc list-inside">
              <li>접속 기록 (IP 주소, 접속 시간)</li>
              <li>기기 정보 (브라우저 종류, 운영체제)</li>
              <li>서비스 이용 기록 (방문 페이지, 검색어)</li>
              <li>쿠키 및 유사 기술을 통한 정보</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              제2조 (개인정보의 수집 및 이용 목적)
            </h2>
            <ul className="text-muted-foreground space-y-2 list-disc list-inside">
              <li>서비스 제공 및 운영</li>
              <li>서비스 개선 및 신규 서비스 개발</li>
              <li>이용 통계 분석 및 서비스 품질 향상</li>
              <li>부정 이용 방지 및 서비스 보안</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              제3조 (개인정보의 보유 및 이용 기간)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              수집된 정보는 수집 목적이 달성된 후 지체 없이 파기합니다. 단, 관련
              법령에 따라 보존이 필요한 경우 해당 기간 동안 보관합니다.
            </p>
            <ul className="text-muted-foreground space-y-2 list-disc list-inside mt-3">
              <li>접속 기록: 3개월 (통신비밀보호법)</li>
              <li>서비스 이용 기록: 서비스 종료 시까지</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              제4조 (개인정보의 제3자 제공)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              서비스는 이용자의 개인정보를 제3자에게 제공하지 않습니다. 단,
              다음의 경우에는 예외로 합니다.
            </p>
            <ul className="text-muted-foreground space-y-2 list-disc list-inside mt-3">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의한 경우</li>
              <li>
                수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가
                있는 경우
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              제5조 (쿠키의 사용)
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              서비스는 이용자 경험 향상을 위해 쿠키를 사용합니다. 쿠키는 웹사이트
              방문 시 브라우저에 저장되는 작은 텍스트 파일입니다.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              이용자는 브라우저 설정을 통해 쿠키 저장을 거부할 수 있으나, 이 경우
              서비스 이용에 일부 제한이 있을 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              제6조 (개인정보의 안전성 확보 조치)
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              서비스는 개인정보의 안전성 확보를 위해 다음과 같은 조치를 취하고
              있습니다.
            </p>
            <ul className="text-muted-foreground space-y-2 list-disc list-inside">
              <li>개인정보 암호화</li>
              <li>해킹 등에 대비한 기술적 대책</li>
              <li>접속 기록의 보관 및 위변조 방지</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              제7조 (이용자의 권리)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              이용자는 언제든지 자신의 개인정보에 대해 열람, 정정, 삭제, 처리
              정지를 요구할 수 있습니다. 관련 문의는 아래 연락처를 통해
              요청하시기 바랍니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              제8조 (분석 서비스)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              서비스는 서비스 개선을 위해 Vercel Analytics 등 분석 서비스를
              사용합니다. 이러한 서비스는 쿠키 및 유사 기술을 사용하여 서비스
              이용 현황을 분석합니다. 수집된 정보는 익명으로 처리되며 개인을
              식별하는 데 사용되지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              제9조 (개인정보 보호책임자)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              개인정보 처리에 관한 업무를 총괄하는 개인정보 보호책임자는 다음과
              같습니다.
            </p>
            <div className="mt-3 p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                개인정보 보호책임자: Market Radar 운영팀
                <br />
                문의: 하단 &quot;문의하기&quot; 페이지를 통해 연락 바랍니다.
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">
              제10조 (개인정보처리방침의 변경)
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              본 개인정보처리방침은 법령, 정책 또는 서비스 변경에 따라 내용이
              변경될 수 있습니다. 변경 시 서비스 내 공지를 통해 안내드립니다.
            </p>
          </section>

          <section className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              본 개인정보처리방침은 2024년 1월 1일부터 시행됩니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
