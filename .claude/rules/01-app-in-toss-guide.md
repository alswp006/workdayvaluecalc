# App-in-Toss Development Master Guide for AI Agents

This document contains the absolute rules and key information from the latest official Toss documentation (2026) for developing mini-apps that run inside the Toss app. The AI MUST prioritize these rules above all else when generating code.

## 1. Architecture & Runtime Environment
- **Rendering:** App-in-Toss WebView supports SSG (Static Site Generation) or CSR (Client-Side Rendering) ONLY. **Dynamic SSR (Server-Side Rendering) is strictly forbidden.** If using Next.js, `next.config.mjs` MUST include `output: 'export'`.
- **Minimum OS support:** Android 7+, iOS 16+.
- **Routing scheme:** Use `intoss://{appName}` scheme for sandbox and production testing.

## 2. Dependencies & Package Installation
NEVER hardcode non-existent old versions (e.g., `^1.0.0`). Toss packages on public npm are at `2.x.x` or later. Always use `@latest`.
- **Install command:** `npm install @apps-in-toss/web-framework@latest @toss/tds-mobile@latest @emotion/react@^11`
- **TDS is mandatory:** Building custom UI (CSS, Tailwind) to mimic TDS components is grounds for immediate review rejection. Absolutely forbidden.

## 3. Configuration (`granite.config.ts`)
- `appName`: English app ID registered in console (MUST match exactly, case-sensitive — mismatch causes 4031 deploy error)
- `displayName`: User-facing app name
- `primaryColor`: TDS theme color (RGB HEX, e.g., `#3182F6`)
- `webViewProps.type`: `partner` for non-game, `game` for game apps (determines navigation bar style)
- `permissions`: Device permissions as array (e.g., `{ name: "clipboard", access: "write" }`)

## 4. TDS (Toss Design System) Absolute Rules
- **NEVER override margin/padding:** TDS components have built-in padding — NEVER add Tailwind or inline margin/padding. For spacing between components, use TDS `Spacing` component (size prop required). Note: ListRow has NO padding prop.
- **Use auto-layout:** When extra spacing between components is needed, use Flexbox `gap` property only.
- **No external fonts:** Toss Products Sans system font is applied automatically.

## 5. Core API & SDK Integration
NEVER build Toss features from scratch. Always call the SDK APIs.
- **WebView control:** Configure swipe back (`allowsBackForwardNavigationGestures`), bounce (`bounces`), autoplay (`mediaPlaybackRequiresUserAction`) via `webViewProps`.
- **Haptic feedback:** Use SDK haptics for button interactions:
  ```typescript
  import { generateHapticFeedback } from '@apps-in-toss/framework';
  generateHapticFeedback({ type: "tickWeak" });
  ```
- **Storage:** Use Toss native storage hooks (SDK `setItem`, `getItem`) for user data persistence.
- **Promotion:** `grantPromotionReward` SDK (v2.0.8+, `@apps-in-toss/web-framework`) — 유저에게 포인트 지급.
  - 1인당 최대 5,000원 제한 (amount > 5000 호출 금지)
  - `promotionCode`는 앱인토스 콘솔에서 발급받은 코드 사용 필수
  - 활용: 첫 사용 보상, 친구 초대 리워드, 이벤트 참여 보상

## 6. 인앱광고 수수료 정책 (2026.04.01~)
- 인앱광고(IAA) 수수료 15% 적용 — 수익 관련 UI에 순수익/총수익 구분 표시 권장
- 수익 예측 시 순수익 = 총수익 × 0.85로 계산
- 외부 로깅/분석 솔루션 (Google Analytics, Amplitude 등) 사용 금지 — 정책 위반 시 노출 제한

## 7. Deployment
- Deploy to Toss CDN (NOT Vercel, AWS, or external clouds).
- Pipeline deploy command: `npx ait deploy --api-key $APPS_IN_TOSS_API_KEY`

## 8. Review Checklist (Must Pass All)
- Users must be 19+ years old — no content targeting minors
- No external domain navigation (outlinks) — all flows must complete within the app
- Zero console.error in production build
- Zero CORS errors on external API calls
- Android 7+ / iOS 16+ compatible Web APIs only
- 외부 로깅/분석 솔루션 (Google Analytics, Amplitude 등) 사용 금지
- HEX 색상 하드코딩 금지 — TDS 컴포넌트 또는 `var(--tds-color-*)` CSS 변수만 사용 (다크모드 필수 지원)
- 앱 설치 유도 금지 — 외부 앱 설치 유도 문구/배너/링크 금지
- 프로모션 지급 한도 — `grantPromotionReward` 사용 시 amount ≤ 5,000 검증 필수
