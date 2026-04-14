# App-in-Toss Mini App — Absolute Rules

## TDS Components Mandatory (Highest Priority)
- ALL UI MUST use TDS (@toss/tds-mobile) components exclusively
- shadcn/ui, MUI, Ant Design, Chakra UI → instant review rejection
- NEVER override TDS component margin/padding with Tailwind or inline styles
- Spacing: use TDS Spacing component (size prop required) only — NEVER add margin/padding via Tailwind or inline styles
- If .ai-factory/tds-reference.txt exists, read it FIRST — it is the official TDS LLM doc
- "모르면 지어내지 마라": tds-essential.txt/tds-reference.txt에 없는 prop은 존재하지 않음 → 추측 사용 금지
- TDS로 구현 불확실 → 기본 HTML + var(--tds-color-*) CSS 변수로 대체 (Tailwind 금지)

## TDS Core 11 Components (assemble these like building blocks)
1. ListRow — list item (ListRow.Texts with type/top/bottom — NO padding prop)
2. Button — button (variant: 'fill' | 'weak' ONLY)
3. TextField — text input (variant: 'box' | 'line' | 'big' | 'hero' REQUIRED)
4. Paragraph.Text — text display (typography: t1~t7, st1~st13)
5. Chip — tag/filter
6. Toggle — switch
7. AlertDialog — modal dialog (NOT "Dialog")
8. BottomSheet — bottom sheet
9. Toast — toast notification (open + position REQUIRED)
10. Top — top navigation bar (NOT "AppBar", title prop REQUIRED)
11. TabBar — bottom tab bar

## Server-Side Code Forbidden
- No Next.js (Vite + React only, or granite framework)
- No API Routes, getServerSideProps, server components
- No Node.js-only modules (fs, path, crypto, better-sqlite3)
- Data storage: localStorage or Toss native storage SDK only (or external API via fetch)

## App-in-Toss SDK Required
- If .ai-factory/apps-in-toss-essential.txt exists, read it FIRST — it is the verified SDK API surface
- **SDK 훅은 존재하지 않는다**: `useTossLogin`, `useTossPayment`, `useTossAd` 같은 React 훅은 SDK에 없음 → 절대 생성 금지
- **window.Toss.xxx 패턴 금지**: 구식/환각 패턴. SDK는 named export 함수만 제공함
- Auth: Toss 앱 세션 자동 신뢰. 로그인 상태 확인만 필요하면 `getIsTossLoginIntegratedService()` 사용
- Payment: `IAP.createOneTimePurchaseOrder({ options: { sku }, processProductGrant, onEvent, onError })` — Stripe/외부 결제 금지
- Ads (배너): `TossAds.initialize({})` → `TossAds.attachBanner(adGroupId, domElement)` — 직접 DOM에 부착
- Ads (리워드): `loadFullScreenAd({ options: { adGroupId }, onEvent, onError })` → `showFullScreenAd(...)` — `userEarnedReward` 이벤트로 보상 감지
- Reward Ad Pattern: `TossRewardAd`는 `src/components/`에 직접 구현하는 로컬 래퍼 컴포넌트 (SDK 컴포넌트 아님)
  - adGroupId prop 필수: `<TossRewardAd adGroupId="console-issued-id"><ResultContent /></TossRewardAd>`
  - Only gate the final payoff moment — never intermediate steps or navigation
- Promotion: `grantPromotionReward({ params: { promotionCode, amount } })` — `@apps-in-toss/web-framework`에서 직접 import
  - 1인당 최대 5,000원 제한 (amount > 5000 호출 금지)
  - promotionCode는 앱인토스 콘솔에서 발급받은 코드 사용 필수
- Navigation: NEVER use window.location.href for external URLs → `openURL(supertoss://...)` 사용

## 인앱광고 수수료 정책 (2026.04.01~)
- 인앱광고(IAA) 수수료 15% 적용 — 수익 관련 UI에 순수익/총수익 구분 표시 권장
- 수익 예측 시 순수익 = 총수익 × 0.85로 계산
- 외부 로깅/분석 솔루션 (Google Analytics, Amplitude 등) 사용 금지 — 정책 위반 시 노출 제한

## Native Vibe (토스 네이티브 품질 필수)
- **Haptic feedback**: 주요 CTA 버튼에 `generateHapticFeedback({ type: 'success' })`, Toggle/Chip에 `tickWeak` 적용
  - import: `import { generateHapticFeedback } from '@apps-in-toss/web-framework';`
- **Dark mode**: HEX 색상(#FFFFFF, #333 등) 하드코딩 절대 금지 — TDS 컴포넌트 또는 `var(--tds-color-*)` CSS 변수만 사용
- **Safe area**: `position: fixed` 하단 요소에 `paddingBottom: calc(Npx + env(safe-area-inset-bottom))` 필수. `height: 100vh` 단독 사용 금지 → `100dvh` 사용

## 생성형 AI 고지 의무 (해당 시 필수 — 위반 시 과태료 3,000만원)
앱이 AI 기반 결과물(추천/분석/요약/생성)을 사용자에게 노출하는 경우:
- 첫 이용 시 "이 서비스는 생성형 AI를 활용합니다" AlertDialog로 1회 고지
- AI 결과물에 "AI가 생성한 결과입니다" Paragraph.Text(typography="st13") 라벨 표시

## Bundle Limits
- Build output MUST be under 100MB
- Avoid heavy libraries: D3, Three.js, heavy charting libs
- Images/videos: use external CDN
