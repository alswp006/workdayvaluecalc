# 앱인토스 등록 산출물

이 프로젝트의 앱인토스 미니앱 등록용 산출물을 생성하는 로컬 스크립트입니다.

## 사용법

```bash
# 미리보기 (기본값)
npx tsx scripts/generate-apps-in-toss.ts

# 미리보기 (명시적)
npx tsx scripts/generate-apps-in-toss.ts --dry-run

# 실제 생성
npx tsx scripts/generate-apps-in-toss.ts --write

# 기존 파일 덮어쓰기
npx tsx scripts/generate-apps-in-toss.ts --write --force

# 로고 생성 스킵 (텍스트 매니페스트만)
npx tsx scripts/generate-apps-in-toss.ts --write --skip-logo

# 이미지 생성 모델 사용 (선택, API 키 필요)
APPS_IN_TOSS_USE_GENERATOR=true npx tsx scripts/generate-apps-in-toss.ts --write

# 커스텀 설정 파일 경로
npx tsx scripts/generate-apps-in-toss.ts --config scripts/my-custom.config.ts
```

## 설정 파일

`scripts/apps-in-toss.config.ts`에서 앱 정보를 관리합니다.

```ts
const config = {
  koreanName: '노동값 계산기',   // 3~20자
  englishName: 'WorkdayValueCalc', // 1~30자
  appName: 'workdayvaluecalc',     // kebab-case (영문소문자·숫자·하이픈)
  ageRating: '전체',               // '전체'|'만 12세 이상'|'만 15세 이상'|'만 19세 이상'
  supportEmail: 'support@aifactory.dev',
  logo: {
    conceptDescription: '...',     // 로고 개념 설명 (이미지 생성 모델용)
  },
};
```

> 금융·투자 관련 앱이면 `ageRating: '만 19세 이상'`으로 설정하세요.

## 산출물

`artifacts/` 폴더에 생성됩니다 (커밋되지 않음):

| 파일 | 설명 |
|------|------|
| `apps-in-toss-manifest.json` | 매니페스트 JSON |
| `apps-in-toss-manifest.txt` | 등록 폼 복붙용 텍스트 |
| `logo.png` | 앱 로고 (600×600 PNG, 원형) |
| `logo-dark.png` | 다크모드 로고 (brightness 60%) |
| `logo-meta.json` | 로고 생성 메타데이터 |

## 등록 절차

1. `scripts/apps-in-toss.config.ts` 설정값 확인/수정
2. 위 명령으로 산출물 생성 (`--write`)
3. `artifacts/apps-in-toss-manifest.txt` 열어서 값 확인
4. https://apps-in-toss.toss.im/workspace/30501/mini-app/create 접속
5. 텍스트 복붙, `artifacts/logo.png` / `artifacts/logo-dark.png` 업로드
6. 카테고리(2스텝)는 수동 입력

## 로고 생성 방식

기본적으로 **템플릿 합성** 방식을 사용합니다:
- `appName` 해시로 배경색 결정 (항상 동일한 결과)
- `englishName` 대문자 이니셜 최대 2글자
- 600×600 원형 PNG, 알파 채널 포함

`APPS_IN_TOSS_USE_GENERATOR=true` 환경변수와 API 키가 있으면 이미지 생성 모델을 시도하고, 실패 시 템플릿으로 자동 fallback합니다.

## 테스트

```bash
npx vitest run --config vitest.scripts.config.ts
```
