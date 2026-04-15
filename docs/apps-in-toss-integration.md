# 앱인토스 등록 산출물

이 프로젝트의 앱인토스 미니앱 등록용 산출물을 생성하는 로컬 스크립트입니다.

## 사용법

```bash
# 미리보기 (기본값)
npx tsx scripts/generate-apps-in-toss.ts

# 실제 생성
npx tsx scripts/generate-apps-in-toss.ts --write

# 기존 파일 덮어쓰기
npx tsx scripts/generate-apps-in-toss.ts --write --force

# 로고 생성 스킵
npx tsx scripts/generate-apps-in-toss.ts --write --skip-logo

# 배너 생성 스킵
npx tsx scripts/generate-apps-in-toss.ts --write --skip-banner

# 이미지 생성 모델 사용 (DALL-E 3, API 키 필요)
node --env-file=.env --import tsx/esm scripts/generate-apps-in-toss.ts --write --force

# 커스텀 설정 파일 경로
npx tsx scripts/generate-apps-in-toss.ts --config scripts/my-custom.config.ts
```

npm 스크립트 단축:

```bash
npm run generate:ait          # dry-run (tsx 사용)
npm run generate:ait:ai       # --write --force + DALL-E 3 활성화 (.env 필요)
```

## 설정 파일

`scripts/apps-in-toss.config.ts`에서 앱 정보를 관리합니다.

```ts
const config = {
  // ── 1스텝: 기본 정보 ──────────────────────────────────
  koreanName: '노동값 계산기',     // 1~20자
  englishName: 'WorkdayValueCalc', // 1~30자
  appName: 'workdayvaluecalc',     // kebab-case (영문소문자·숫자·하이픈)
  ageRating: '전체',               // '전체'|'만 12세 이상'|'만 15세 이상'|'만 19세 이상'
  supportEmail: 'support@example.com',

  // ── 2스텝: 카테고리 및 노출 ──────────────────────────
  category: {
    primary: '금융/재테크',        // 필수
    secondary: '계산기',           // 선택
    // tertiary: '...',            // 선택
  },
  subtitle: '시급과 노동 가치를 계산해요', // 1~20자, 느낌표/물음표/과장 표현 금지
  description: '...',             // 50~1000자
  searchKeywords: ['시급 계산기', '노동 가치', '연봉 계산'], // 3~10개, 각 1~20자

  // ── 로고/배너 설정 ────────────────────────────────────
  logo: {
    conceptDescription: '...',     // 로고 개념 설명 (이미지 생성 모델용)
    backgroundColor: '#3182F6',    // 배경색 HEX (미지정 시 appName 해시로 결정)
  },
};
```

> 금융·투자 관련 앱이면 `ageRating: '만 19세 이상'`으로 설정하세요.

## 산출물

`artifacts/` 폴더에 생성됩니다 (커밋되지 않음):

| 파일 | 설명 |
|------|------|
| `apps-in-toss-manifest.json` | 매니페스트 JSON (1·2스텝 전체) |
| `apps-in-toss-manifest.txt` | 등록 폼 복붙용 텍스트 |
| `logo.png` | 앱 로고 (600×600 PNG, 원형) |
| `logo-dark.png` | 다크모드 로고 (brightness 60%) |
| `banner.png` | 가로형 배너 (1932×828 PNG) |
| `assets-meta.json` | 에셋 생성 메타데이터 |

## 등록 절차

1. `scripts/apps-in-toss.config.ts` 설정값 확인/수정 (1·2스텝 전체)
2. 위 명령으로 산출물 생성 (`--write`)
3. `artifacts/apps-in-toss-manifest.txt` 열어서 값 확인
4. https://apps-in-toss.toss.im/workspace/30501/mini-app/create 접속
5. **1스텝**: 기본 정보 텍스트 복붙, `artifacts/logo.png` / `artifacts/logo-dark.png` 업로드
6. **2스텝**: 카테고리/부제/상세 설명/키워드 텍스트 복붙, `artifacts/banner.png` 업로드

## 로고 생성 방식

기본적으로 **템플릿 합성** 방식을 사용합니다:
- `appName` 해시로 배경색 결정 (항상 동일한 결과), 또는 `logo.backgroundColor` 지정
- `englishName` 대문자 이니셜 최대 2글자
- 600×600 원형 PNG, 알파 채널 포함

`APPS_IN_TOSS_USE_GENERATOR=true` 환경변수와 `OPENAI_API_KEY`가 있으면 DALL-E 3으로 로고를 생성하고, 실패 시 템플릿으로 자동 fallback합니다.

## 배너 생성 방식

로고 이미지를 기반으로 1932×828 가로형 배너를 자동 합성합니다:
- 좌측: 앱 로고 (400×400)
- 우측: 한국어 앱 이름 (96px bold) + 부제 (52px)
- 배경색: `logo.backgroundColor` 또는 기본 토스 블루

## 테스트

```bash
npm run test:scripts
# or
npx vitest run --config vitest.scripts.config.ts
```
