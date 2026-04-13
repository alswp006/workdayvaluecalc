```md
# SPEC

## Common Principles

### Product Scope (MVP)
- 목적: 사용자가 입력한 급여/근무조건을 기준으로 **특정 소비 금액이 ‘몇 시간/분 노동값’인지** 직관적으로 계산/기록/공유한다.
- 포함: 급여 설정, 수동 금액 계산, (이미지 기반) 가격 인식, 고정지출 환산, 목표저축 환산, 결과 공유/비교, 광고(배너/리워드), 로컬 저장.
- 제외: 푸시 알림, 서버 없는 실시간 동기화, 외부 분석 SDK(GA/Amplitude 등), 네이티브 모듈 연동(바코드 네이티브 스캔 등).

### UI / UX (TDS 준수)
- UI는 **@toss/tds-mobile 컴포넌트**(ListRow, Button, TextField, Paragraph.Text, Chip, Toggle, AlertDialog, BottomSheet, Toast, Top, TabBar, Spacing)를 조합해 구성한다.
- 여백은 **Spacing(size 필수)**만 사용한다. TDS 컴포넌트에 내장된 padding/margin을 덮어쓰기 위한 Tailwind/인라인 여백 스타일을 사용하지 않는다.
- 커스텀 CSS는 레이아웃 목적(flex/grid/width 제약)만 허용하며, 색상은 **HEX 하드코딩 금지**(TDS/var(--tds-color-*)만 사용).
- 모든 터치 가능한 요소(버튼/리스트행/칩/토글)는 **터치 타겟 44px 이상**으로 구현한다(TDS 기본 규격 준수 + 커스텀 영역은 min-height 44px 보장).

### Routing / Navigation (React Router)
- 클라이언트 라우팅은 `react-router-dom`만 사용한다.
- 화면 간 데이터 전달은 `navigate(path, { state })`를 사용하며, **각 Screen Definition에 outgoing/incoming state 타입을 명시**한다.

### Persistence (localStorage)
- 모든 사용자 데이터는 localStorage에 저장한다.
- localStorage 쓰기 실패(QuotaExceededError 등) 시 앱은 크래시 없이 **에러 다이얼로그**를 노출하고, 해당 작업을 롤백한다.

### Ads / Reward Ads
- 배너 광고는 `AdSlot`을 **콘텐츠 섹션 사이**에 배치하며, 콘텐츠를 가리거나 겹치지 않는다.
- “결과/분석/추천” 성격의 상세 결과는 `TossRewardAd`로 게이팅한다(예: 상세 환산/애니메이션/공유 카드 생성 전).

### AI 사용 고지 (이미지 가격 인식 기능에 해당)
- 이미지 가격 인식은 AI(OCR/추출 로직) 결과를 사용자에게 노출하므로 다음을 준수한다:
  - 첫 이용 시 1회: “이 서비스는 생성형 AI를 활용합니다” 고지(확인 후 localStorage 저장).
  - AI 결과 표기: 인식된 금액/추출 결과 UI에 “AI가 생성한 결과입니다” 라벨 표시.

---

### Screen & Navigation Map (Screen Definitions)

#### S1. 홈(빠른 계산) — `/`
- TDS 컴포넌트: **Top**, **TextField**, **Button**, **Paragraph.Text**, **Chip**, **ListRow**, **Spacing**, **Toast**, **AdSlot**
- 주요 UI:
  - 금액 입력(TextField, inputMode="numeric")
  - 항목명 입력(TextField)
  - “계산하기” 버튼
  - 최근 계산 5개 ListRow
  - 섹션 사이 배너 광고(AdSlot)
- Loading/Empty/Error:
  - Loading: localStorage에서 프로필/최근기록 로드 중이면 Paragraph.Text로 “불러오는 중...” 표시
  - Empty: 프로필 미설정이면 “급여 설정이 필요해요” + 설정 이동 버튼
  - Error: localStorage 파싱 실패 시 AlertDialog로 “저장된 데이터를 읽을 수 없어요. 초기화할까요?”
- Touch interactions:
  - 버튼/ListRow 탭 영역은 TDS 기본 + 커스텀 wrapper 사용 시 min-height 44px
  - 키보드: 숫자 입력 필드에 focus 시 화면이 가려지지 않도록 `scrollIntoView({ block: 'center' })` 수행
- Navigation state contract:
  - Outgoing:
    - 설정 → `navigate('/settings')`
    - 이미지 인식 → `navigate('/scan')`
    - 고정지출 → `navigate('/fixed-expenses')`
    - 목표저축 → `navigate('/savings-goal')`
    - 기록 더보기 → `navigate('/history')`
    - 계산하기(성공) → `navigate('/result', { state: { calcId: string } })`
  - Incoming:
    - `location.state = null` (사용 안 함)

**S1 Acceptance Criteria (EARS)**
- AC-1 [S]: Scenario: 로딩 상태 표시  
  WHEN 사용자가 `/`에 진입했을 때 localStorage 로드가 완료되지 않았다면  
  THEN Paragraph.Text로 `"불러오는 중..."`이 표시되어야 한다.
- AC-2 [W]: Scenario: 금액 미입력 시 계산 차단  
  WHEN 사용자가 금액 TextField를 비워둔 상태(또는 `0`)에서 `"계산하기"`를 탭하면  
  THEN 금액 TextField 하단에 `"금액을 1원 이상 입력해주세요"`가 표시되어야 한다  
  AND `/result`로 navigation이 발생하지 않아야 한다.
- AC-3 [W]: Scenario: 프로필 미설정 시 계산 차단  
  GIVEN localStorage에 `wdv_profile_v1`이 없을 때  
  WHEN 사용자가 `"계산하기"`를 탭하면  
  THEN AlertDialog로 제목 `"급여 설정 필요"`와 본문 `"먼저 급여/근무조건을 설정해주세요"`가 표시되어야 한다  
  AND `/result`로 이동하지 않아야 한다.
- AC-4 [E]: Scenario: 프로필 미설정 Empty 상태에서 설정 이동  
  GIVEN localStorage에 `wdv_profile_v1`이 없을 때  
  WHEN 홈 화면이 렌더링되면  
  THEN `"급여 설정이 필요해요"` 문구가 표시되어야 한다  
  AND 사용자가 `"설정"` 버튼을 탭하면 `navigate('/settings')`가 호출되어야 한다.
- AC-5 [W]: Scenario: 최근 기록 로드 파싱 실패 복구  
  GIVEN localStorage `wdv_calcs_v1` 값이 `"not-json"` 문자열일 때  
  WHEN 홈 화면이 최근 기록을 로드하면  
  THEN AlertDialog 본문으로 `"저장된 데이터를 읽을 수 없어요. 초기화할까요?"`가 표시되어야 한다  
  AND 사용자가 `"초기화"`를 탭하면 `wdv_calcs_v1`이 `{ version: 1, items: [] }`로 재설정되어야 한다.

---

#### S2. 급여/근무 설정 — `/settings`
- TDS 컴포넌트: **Top**, **TextField**, **Button**, **ListRow**, **Paragraph.Text**, **Toggle**, **Spacing**, **Toast**, **AlertDialog**
- Loading/Empty/Error:
  - Loading: 기존 프로필 로드 중 “불러오는 중...”
  - Empty: 최초 진입 시 기본값 가이드 문구 표시
  - Error: 저장 실패 시 AlertDialog “저장 공간이 부족해 저장할 수 없어요”
- Touch interactions:
  - 숫자 필드: inputMode="numeric"
  - 키보드: 저장 버튼이 키보드에 가려질 경우 페이지 하단 여백(Spacing) + 스크롤 허용
- Navigation state contract:
  - Outgoing: 저장 성공 시 `navigate(-1)`
  - Incoming: `location.state = null`

**S2 Acceptance Criteria (EARS)**
- AC-1 [S]: Scenario: 로딩 상태 표시  
  WHEN 사용자가 `/settings`로 진입했을 때 localStorage 로드가 완료되기 전이면  
  THEN Paragraph.Text로 `"불러오는 중..."`이 표시되어야 한다.
- AC-2 [E]: Scenario: 저장 성공 시 뒤로 이동  
  WHEN 사용자가 유효한 입력값으로 `"저장"`을 탭하면  
  THEN localStorage `wdv_profile_v1` 값이 갱신되어야 한다  
  AND Toast `"저장했어요"`가 표시되어야 한다  
  AND `navigate(-1)`가 호출되어야 한다.
- AC-3 [W]: Scenario: 급여 금액 0원 저장 거부  
  WHEN 사용자가 `payAmount=0`으로 `"저장"`을 탭하면  
  THEN TextField 하단 에러 텍스트로 `"급여를 1원 이상 입력해주세요"`가 표시되어야 한다  
  AND localStorage `wdv_profile_v1` 값은 변경되지 않아야 한다.
- AC-4 [W]: Scenario: 하루 근무시간 0시간 저장 거부  
  WHEN 사용자가 `workHoursPerDay=0`으로 `"저장"`을 탭하면  
  THEN 에러 텍스트로 `"하루 근무시간은 1시간 이상이어야 해요"`가 표시되어야 한다  
  AND `navigate(-1)`가 호출되지 않아야 한다.
- AC-5 [W]: Scenario: 저장 실패(QuotaExceededError) 시 크래시 방지/롤백  
  GIVEN 브라우저가 localStorage `setItem`에서 QuotaExceededError를 발생시키는 환경일 때  
  WHEN 사용자가 `"저장"`을 탭하면  
  THEN AlertDialog로 제목 `"저장 실패"`와 본문 `"저장 공간이 부족해 저장할 수 없어요"`가 표시되어야 한다  
  AND localStorage `wdv_profile_v1` 값은 변경되지 않아야 한다.

---

#### S3. 결과 — `/result`
- TDS 컴포넌트: **Top**, **Paragraph.Text**, **Chip**, **Button**, **Spacing**, **Toast**, **AdSlot**, **AlertDialog**, **TossRewardAd**
- Loading/Empty/Error:
  - Loading: calcId로 기록 로드 중 “불러오는 중...”
  - Empty: calcId가 없거나 기록이 없으면 “결과를 찾을 수 없어요” + 홈으로 버튼
  - Error: 리워드 광고 실패 시 “광고를 불러오지 못했어요” 토스트 + 기본 결과만 표시
- Touch interactions:
  - 공유/비교 버튼 min-height 44px
- Navigation state contract:
  - Incoming: `location.state = { calcId: string }`
  - Outgoing:
    - 공유 → `navigate('/share', { state: { calcId: string } })`
    - 비교(친구 결과 입력) → `navigate('/compare', { state: { baseCalcId: string } })`
    - 홈 → `navigate('/')`

**S3 Acceptance Criteria (EARS)**
- AC-1 [S]: Scenario: 로딩 상태 표시  
  WHEN `/result`가 렌더링되고 calcId로 localStorage 조회가 완료되지 않았으면  
  THEN Paragraph.Text로 `"불러오는 중..."`이 표시되어야 한다.
- AC-2 [W]: Scenario: calcId 누락/기록 없음 Empty 처리  
  WHEN `/result`에 `location.state`가 없거나 `calcId`에 해당하는 기록이 없으면  
  THEN `"결과를 찾을 수 없어요"` 문구가 표시되어야 한다  
  AND `"홈으로"` 버튼 탭 시 `navigate('/')`가 호출되어야 한다.
- AC-3 [E]: Scenario: 기본 결과 표시  
  GIVEN `wdv_calcs_v1.items`에 `id="c1"` 기록이 존재할 때  
  WHEN 사용자가 `/result`에 `calcId="c1"`로 진입하면  
  THEN 금액(예: `"60,000원"`) 텍스트가 화면에 표시되어야 한다  
  AND 요약(예: `"몇 시간 노동값"`) 문구가 표시되어야 한다.
- AC-4 [W]: Scenario: 리워드 광고 실패 시 기본 결과 유지  
  GIVEN 사용자가 `"상세 환산 보기"`를 탭했을 때 `TossRewardAd` 로드 실패 이벤트가 발생하면  
  THEN Toast `"광고를 불러오지 못했어요"`가 표시되어야 한다  
  AND 기본 결과(금액/요약) 섹션은 계속 표시되어야 한다.
- AC-5 [S]: Scenario: 광고 시청 전 상세 섹션 미노출  
  WHILE 사용자가 리워드 광고를 시청 완료하지 않은 상태일 때  
  THEN `"초 단위"`(또는 이에 준하는 상세 섹션) DOM이 존재하지 않아야 한다.

---

#### S4. 이미지로 가격 인식 — `/scan`
- TDS 컴포넌트: **Top**, **Button**, **TextField**, **Paragraph.Text**, **Spacing**, **Toast**, **AlertDialog**, **BottomSheet**, **Chip**
- Loading/Empty/Error:
  - Loading: 이미지 업로드/인식 요청 중 “인식 중...” + 버튼 disabled
  - Empty: 이미지 미선택 시 안내 문구
  - Error: API 실패 시 토스트 “가격 인식에 실패했어요. 직접 입력해 주세요”
- Touch interactions:
  - 이미지 선택 버튼은 `<input type="file" accept="image/*" capture="environment">`를 Button으로 트리거(터치 44px)
  - 키보드: 인식 후 금액 수정 TextField focus 시 scrollIntoView
- Navigation state contract:
  - Incoming: `location.state = null`
  - Outgoing:
    - 인식된/수정 금액으로 계산 → `navigate('/result', { state: { calcId: string } })`

**S4 Acceptance Criteria (EARS)**  *(AC 누락 보완: 최소 4개 + 실패 AC 2개 이상 포함)*
- AC-1 [E]: Scenario: 첫 이용 AI 고지 1회 노출  
  GIVEN localStorage `wdv_ai_notice_v1`이 없을 때  
  WHEN 사용자가 `/scan`에서 `"사진으로 인식하기"` 버튼을 탭하면  
  THEN AlertDialog로 `"이 서비스는 생성형 AI를 활용합니다"` 문구가 표시되어야 한다  
  AND 사용자가 `"확인"`을 탭하면 `wdv_ai_notice_v1.scanAiNoticeAcknowledged=true`가 저장되어야 한다.
- AC-2 [S]: Scenario: 인식 요청 중 로딩/중복요청 방지  
  WHEN 사용자가 이미지 1장을 선택하여 인식 요청이 진행 중이면  
  THEN Paragraph.Text로 `"인식 중..."`이 표시되어야 한다  
  AND `"사진으로 인식하기"`(또는 파일 선택 트리거) 버튼은 `disabled`여야 한다  
  AND 동일 세션에서 추가 탭이 발생해도 네트워크 요청은 1개만 진행되어야 한다(테스트 기준: fetch/axios 호출 횟수 1회).
- AC-3 [W]: Scenario: 파일 선택 취소(이미지 미선택) 시 제출/호출 금지  
  GIVEN 사용자가 파일 선택 다이얼로그를 열었지만 선택을 취소하여 `input.files.length=0`인 상태일 때  
  WHEN `/scan` 화면으로 다시 돌아오면  
  THEN Toast로 `"사진을 선택해주세요"`가 표시되어야 한다  
  AND 인식 API 호출이 발생하지 않아야 한다(테스트 기준: fetch/axios 호출 횟수 0회)  
  AND 금액 TextField 값은 빈 값이어야 한다.
- AC-4 [W]: Scenario: 지원하지 않는 파일 타입 선택 시 거부(클라이언트)  
  GIVEN 사용자가 파일 선택으로 `file.type`이 `"image/"`로 시작하지 않는 파일을 선택했을 때(테스트 더블/시뮬레이션 허용)  
  WHEN 파일 선택 이벤트가 처리되면  
  THEN Toast로 `"이미지 파일만 선택할 수 있어요"`가 표시되어야 한다  
  AND 인식 API 호출이 발생하지 않아야 한다(테스트 기준: fetch/axios 호출 횟수 0회)  
  AND 금액 TextField 값은 빈 값이어야 한다.
- AC-5 [W]: Scenario: 인식 API가 422(가격 미검출) 반환 시 수동 입력 유도  
  GIVEN 인식 API가 `422 Unprocessable Entity`로 응답했을 때  
  WHEN 사용자가 이미지를 선택하면  
  THEN Toast로 `"인식된 금액이 없어요. 직접 입력해 주세요"`가 표시되어야 한다  
  AND 금액 TextField 값은 빈 값이어야 한다  
  AND `"이 금액으로 계산"` 버튼은 `disabled`여야 한다.
- AC-6 [W]: Scenario: 인식 API가 400(잘못된/지원 불가 파일) 반환 시 처리  
  GIVEN 인식 API가 `400 Bad Request`로 응답했을 때  
  WHEN 사용자가 이미지를 선택하면  
  THEN Toast로 `"지원하지 않는 이미지예요. 다른 사진을 선택해 주세요"`가 표시되어야 한다  
  AND 금액 TextField 값은 빈 값이어야 한다  
  AND `"이 금액으로 계산"` 버튼은 `disabled`여야 한다.
- AC-7 [W]: Scenario: 인식 API 네트워크/500 오류 시 처리  
  GIVEN 인식 API 호출이 네트워크 오류 또는 `500 Internal Server Error`로 실패했을 때  
  WHEN 사용자가 이미지를 선택하면  
  THEN Toast `"가격 인식에 실패했어요. 직접 입력해 주세요"`가 표시되어야 한다  
  AND 금액 TextField는 빈 값 상태로 남아 있어야 한다.
- AC-8 [W]: Scenario: 인식 API가 401(인증 필요) 반환 시 처리  
  GIVEN 인식 API가 `401 Unauthorized`로 응답했을 때  
  WHEN 사용자가 이미지를 선택하면  
  THEN Toast로 `"로그인이 필요해요. 다시 시도해 주세요"`가 표시되어야 한다  
  AND 금액 TextField는 빈 값 상태로 남아 있어야 한다.
- AC-9 [E]: Scenario: 인식 성공 시 금액 자동 입력 및 AI 라벨 표시  
  GIVEN 인식 API가 `{ amountKRW: 60000, extractedText: "60,000원", confidence: 0.82 }`로 응답할 때  
  WHEN 사용자가 이미지를 선택하면  
  THEN 금액 TextField 값이 `60000`으로 설정되어야 한다  
  AND `"AI가 생성한 결과입니다"` 라벨(Paragraph.Text 또는 Chip)이 표시되어야 한다.

---

#### S5. 고정지출 — `/fixed-expenses`
- TDS 컴포넌트: **Top**, **ListRow**, **Button**, **TextField**, **BottomSheet**, **AlertDialog**, **Paragraph.Text**, **Spacing**, **Chip**, **Toast**, **AdSlot**
- Loading/Empty/Error:
  - Loading: 로드 중 “불러오는 중...”
  - Empty: 항목 0개면 “고정지출을 추가해보세요”
  - Error: 저장 실패 시 AlertDialog
- List/Scroll:
  - 기본 스크롤: 200개 이하 일반 렌더
  - 201개 이상: `react-window`(또는 동등 가상 스크롤)로 가상화 렌더(목록 성능 보장)
- Navigation state contract:
  - Incoming: `location.state = null`
  - Outgoing: 없음(동일 화면 내 BottomSheet로 추가/수정)

**S5 Acceptance Criteria (EARS)**
- AC-1 [S]: Scenario: 로딩 상태 표시  
  WHEN 사용자가 `/fixed-expenses`로 진입했고 localStorage 로드가 완료되지 않았으면  
  THEN Paragraph.Text로 `"불러오는 중..."`이 표시되어야 한다.
- AC-2 [E]: Scenario: Empty 상태 표시  
  GIVEN `wdv_fixed_expenses_v1.items=[]`일 때  
  WHEN 화면이 렌더링되면  
  THEN Paragraph.Text로 `"고정지출을 추가해보세요"`가 표시되어야 한다.
- AC-3 [W]: Scenario: 항목명 공백 입력 거부  
  WHEN 사용자가 추가 BottomSheet에서 `name=""`로 `"추가"`를 탭하면  
  THEN 에러 텍스트로 `"항목명을 입력해주세요"`가 표시되어야 한다  
  AND localStorage `wdv_fixed_expenses_v1.items` 길이는 증가하지 않아야 한다.
- AC-4 [W]: Scenario: 월 금액 0원 입력 거부  
  WHEN 사용자가 추가 BottomSheet에서 `monthlyAmountKRW=0`으로 `"추가"`를 탭하면  
  THEN 에러 텍스트로 `"금액을 1원 이상 입력해주세요"`가 표시되어야 한다  
  AND 항목이 추가되지 않아야 한다.
- AC-5 [E]: Scenario: 항목 추가 성공  
  WHEN 사용자가 `{ name: "월세", monthlyAmountKRW: 700000 }`로 `"추가"`를 탭하면  
  THEN localStorage `wdv_fixed_expenses_v1.items`에 `name="월세"` 항목이 1건 추가되어야 한다  
  AND Toast `"추가했어요"`가 표시되어야 한다.
- AC-6 [W]: Scenario: 저장 실패 시 롤백  
  GIVEN localStorage `setItem`이 QuotaExceededError를 발생시키는 환경일 때  
  WHEN 사용자가 항목 추가를 시도하면  
  THEN AlertDialog 본문 `"저장 공간이 부족해 저장할 수 없어요"`가 표시되어야 한다  
  AND 목록 UI에 해당 항목이 나타나지 않아야 한다.
- AC-7 [S]: Scenario: 201개 이상 가상 스크롤 적용  
  GIVEN `wdv_fixed_expenses_v1.items` 길이가 `201`일 때  
  WHEN 목록을 렌더링하면  
  THEN DOM에 렌더링된 ListRow 개수는 `<= 40`이어야 한다(가상 스크롤 적용의 테스트 기준).

---

#### S6. 목표 저축 — `/savings-goal`
- TDS 컴포넌트: **Top**, **TextField**, **Button**, **Paragraph.Text**, **Spacing**, **Chip**, **Toast**, **AlertDialog**, **TossRewardAd**, **AdSlot**
- Loading/Empty/Error:
  - Loading: 계산 중 “계산 중...”
  - Empty: 입력 전 가이드
  - Error: 입력값 오류 시 인라인 에러 텍스트
- Navigation state contract:
  - Incoming: `location.state = null`
  - Outgoing: 없음(결과는 동일 화면에서 표시)

**S6 Acceptance Criteria (EARS)**
- AC-1 [E]: Scenario: 입력 전 가이드(Empty)  
  WHEN 사용자가 `/savings-goal`에 진입하고 아직 `"계산하기"`를 수행하지 않았으면  
  THEN 입력 가이드 문구(Paragraph.Text)가 표시되어야 한다.
- AC-2 [W]: Scenario: 월 저축액 0원 입력 거부  
  WHEN 사용자가 `monthlySavingsKRW=0`으로 `"계산하기"`를 탭하면  
  THEN 에러 텍스트로 `"매달 저축액을 1원 이상 입력해주세요"`가 표시되어야 한다  
  AND 결과 요약 섹션이 표시되지 않아야 한다.
- AC-3 [W]: Scenario: 프로필 미설정 시 계산 차단  
  GIVEN localStorage에 `wdv_profile_v1`이 없을 때  
  WHEN 사용자가 `"계산하기"`를 탭하면  
  THEN AlertDialog 본문으로 `"먼저 급여/근무조건을 설정해주세요"`가 표시되어야 한다  
  AND 결과 요약 섹션이 표시되지 않아야 한다.
- AC-4 [S]: Scenario: 계산 중 로딩 상태  
  WHEN 사용자가 `"계산하기"`를 탭한 직후 계산 상태가 진행 중이면  
  THEN `"계산 중..."` 문구가 표시되어야 한다  
  AND `"계산하기"` 버튼은 disabled여야 한다.
- AC-5 [E]: Scenario: 상세 보기 리워드 광고 게이트  
  GIVEN 요약 결과가 표시된 상태일 때  
  WHEN 사용자가 `"상세 보기"`를 탭하면  
  THEN `TossRewardAd`가 표시되어야 한다  
  AND 광고 시청 완료 이후에만 `"일 단위"` 또는 `"시간 단위"` 상세 섹션이 렌더링되어야 한다.

---

#### S7. 기록 — `/history`
- TDS 컴포넌트: **Top**, **ListRow**, **Paragraph.Text**, **Spacing**, **Button**, **Toast**
- Loading/Empty/Error:
  - Loading: 로드 중 “불러오는 중...”
  - Empty: “아직 계산 기록이 없어요” + 홈 이동 버튼
  - Error: 파싱 실패 시 AlertDialog(공통 컴포넌트 사용)
- List/Scroll:
  - 200개 이하 일반 스크롤, 201개 이상 가상 스크롤
- Navigation state contract:
  - Incoming: `location.state = null`
  - Outgoing: 항목 탭 → `navigate('/result', { state: { calcId: string } })`

**S7 Acceptance Criteria (EARS)**
- AC-1 [S]: Scenario: 로딩 상태 표시  
  WHEN 사용자가 `/history`에 진입했고 localStorage 로드가 완료되지 않았으면  
  THEN Paragraph.Text로 `"불러오는 중..."`이 표시되어야 한다.
- AC-2 [E]: Scenario: Empty 상태에서 홈 이동  
  GIVEN `wdv_calcs_v1.items=[]`일 때  
  WHEN `/history`가 렌더링되면  
  THEN `"아직 계산 기록이 없어요"` 문구가 표시되어야 한다  
  AND `"홈 이동"` 버튼 탭 시 `navigate('/')`가 호출되어야 한다.
- AC-3 [W]: Scenario: 기록 파싱 실패 처리  
  GIVEN localStorage `wdv_calcs_v1` 값이 `"not-json"` 문자열일 때  
  WHEN `/history`가 기록을 로드하면  
  THEN AlertDialog가 표시되어야 한다  
  AND 앱이 크래시하지 않아야 한다(테스트 기준: 렌더링이 유지됨).
- AC-4 [E]: Scenario: 항목 탭 시 결과 화면 이동  
  GIVEN 기록 목록에 `id="c1"` 항목이 표시되어 있을 때  
  WHEN 사용자가 해당 ListRow를 탭하면  
  THEN `navigate('/result', { state: { calcId: "c1" } })`가 호출되어야 한다.
- AC-5 [S]: Scenario: 201개 이상 가상 스크롤 적용  
  GIVEN `wdv_calcs_v1.items` 길이가 `201`일 때  
  WHEN 목록을 렌더링하면  
  THEN DOM에 렌더링된 ListRow 개수는 `<= 40`이어야 한다(가상 스크롤 적용의 테스트 기준).

---

#### S8. 공유 — `/share`
- TDS 컴포넌트: **Top**, **Paragraph.Text**, **Button**, **Spacing**, **Toast**, **Chip**, **AlertDialog**
- Loading/Empty/Error:
  - Loading: 공유 카드 렌더/이미지 생성 중 “이미지 생성 중...”
  - Empty: calcId 없음/기록 없음 → “공유할 결과가 없어요”
  - Error: Web Share 미지원 시 “링크 복사로 공유할 수 있어요” 안내
- Navigation state contract:
  - Incoming: `location.state = { calcId: string }`
  - Outgoing:
    - 링크 복사 → 상태 변화만(네비게이션 없음)
    - 비교로 이동 → `navigate('/compare', { state: { baseCalcId: string, sharedPayload: string } })`

**S8 Acceptance Criteria (EARS)**
- AC-1 [W]: Scenario: calcId 누락/기록 없음 Empty 처리  
  WHEN `/share`에 `location.state`가 없거나 `calcId`에 해당하는 기록이 없으면  
  THEN `"공유할 결과가 없어요"` 문구가 표시되어야 한다  
  AND 공유 관련 버튼(링크 복사/이미지 공유)은 disabled여야 한다.
- AC-2 [E]: Scenario: 링크 복사 성공  
  GIVEN `/share`가 유효한 `calcId`로 진입했고 `"링크 복사"` 버튼이 enabled일 때  
  WHEN 사용자가 `"링크 복사"`를 탭하면  
  THEN 클립보드 복사 함수에 전달된 문자열은 `"wdv://share/"`를 포함해야 한다  
  AND Toast `"복사했어요"`가 표시되어야 한다.
- AC-3 [S]: Scenario: 이미지 생성 로딩 상태  
  WHEN 사용자가 `"이미지로 공유"`를 탭하여 이미지 생성이 시작되면  
  THEN `"이미지 생성 중..."` 문구가 표시되어야 한다  
  AND 생성 완료 전까지 공유 버튼들은 disabled여야 한다.
- AC-4 [W]: Scenario: Web Share 미지원 시 대체 안내  
  GIVEN `navigator.share`가 `undefined`인 환경일 때  
  WHEN 사용자가 `"이미지로 공유"`를 탭하면  
  THEN AlertDialog로 제목 `"공유 방식 안내"`와 본문 `"이 기기에서는 이미지 공유를 지원하지 않아요. 링크 복사를 사용해주세요"`가 표시되어야 한다  
  AND 앱이 크래시하지 않아야 한다.

---

#### S9. 비교 — `/compare`
- TDS 컴포넌트: **Top**, **TextField**, **Button**, **Paragraph.Text**, **Spacing**, **Chip**, **Toast**, **AlertDialog**
- Loading/Empty/Error:
  - Loading: payload 파싱 중 “불러오는 중...”
  - Empty: 공유 코드 미입력 시 가이드
  - Error: payload 파싱 실패 시 “공유 코드가 올바르지 않아요”
- Navigation state contract:
  - Incoming: `location.state = { baseCalcId: string } | { baseCalcId: string, sharedPayload: string }`
  - Outgoing: 결과 탭 → `navigate('/result', { state: { calcId: string } })` (기본 결과로만 이동)

**S9 Acceptance Criteria (EARS)**
- AC-1 [E]: Scenario: 공유 코드 미입력 Empty 가이드  
  WHEN 사용자가 공유 코드 입력란을 비운 상태로 `/compare` 화면을 보고 있으면  
  THEN 가이드 문구(Paragraph.Text)가 표시되어야 한다.
- AC-2 [W]: Scenario: 공유 코드 파싱 실패 처리  
  WHEN 사용자가 공유 코드 입력란에 `"NOT_A_VALID_PAYLOAD"`를 입력하고 `"비교하기"`를 탭하면  
  THEN Paragraph.Text로 `"공유 코드가 올바르지 않아요"`가 표시되어야 한다  
  AND 비교 결과 섹션(내 결과/친구 결과) 또는 결과 Chip이 표시되지 않아야 한다.
- AC-3 [S]: Scenario: payload 자동 주입 시 로딩 표기  
  GIVEN `location.state.sharedPayload`가 존재할 때  
  WHEN 화면이 초기 파싱을 수행하는 동안  
  THEN `"불러오는 중..."` 문구가 표시되어야 한다.
- AC-4 [E]: Scenario: 비교 성공 시 두 결과 동시 표기  
  GIVEN baseCalcId에 해당하는 내 기록이 존재하고, 공유 코드가 유효한 payload일 때  
  WHEN 사용자가 `"비교하기"`를 탭하면  
  THEN 화면에 `"내 결과"`와 `"친구 결과"` 섹션 타이틀이 모두 표시되어야 한다  
  AND 두 섹션 모두 `"원"` 단위를 포함한 금액 텍스트가 표시되어야 한다.
- AC-5 [W]: Scenario: 내 baseCalcId 기록 없음 처리  
  GIVEN `location.state.baseCalcId`에 해당하는 기록이 localStorage에 없을 때  
  WHEN 사용자가 `/compare`에 진입하면  
  THEN AlertDialog 또는 Paragraph.Text로 `"결과를 찾을 수 없어요"`가 표시되어야 한다  
  AND `"비교하기"` 버튼은 disabled여야 한다.

---

## Data Models

### (추가) localStorage Schemas (Keys)
> 아래는 **localStorage 키별 저장 스키마(타입/필드)**를 명시한다.  
> 모든 “엔티티(레코드/항목)”는 `id`, `createdAt`, `updatedAt`을 가진다(요구사항 반영).  
> 단, 싱글톤 상태(State) 형태로 저장되는 경우에도 스키마 차원에서 `id/createdAt/updatedAt`을 포함해 타입을 명시한다.

#### Key: `wdv_profile_v1`
- Type: `WorkProfile`
```ts
export interface WorkProfile {
  id: string; // uuid
  createdAt: string; // ISO
  updatedAt: string; // ISO

  profileVersion: 1;
  currency: "KRW";
  payType: "MONTHLY" | "ANNUAL"; // string
  payAmount: number; // 1 ~ 100000000 (원)
  workDaysPerWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  workHoursPerDay: number; // 1 ~ 24 (시간), 소수 0.5 허용
  includeLunchBreak: boolean; // true면 workHoursPerDay에서 1시간 차감(최소 1시간 보장)
}
```

#### Key: `wdv_calcs_v1`
- Type: `CalcRecordStore`
- 저장 정책(페이지네이션 미사용 명시 + 저장 개수 제한/퇴출 규칙):
  - pagination은 **사용하지 않는다**
  - `items` 최대 저장 개수는 **100개**로 제한한다(상수).
  - 새 기록 추가 후 `items.length > 100`이면 `createdAt`이 가장 오래된 기록부터 제거하여 `items.length === 100`이 되도록 한다.
  - 정렬 기준(조회/표시): 기본은 `createdAt` 내림차순(최신이 먼저).
- **프로필 관계/스냅샷 정책(외래키 및 cascade 동작 정의)**:
  - `CalcRecord`는 계산 시점의 프로필 값을 `profileSnapshot`으로 **레코드에 포함 저장**한다.
  - 사용자가 프로필을 초기화/삭제(예: `wdv_profile_v1` 제거)하더라도 **기존 `CalcRecord`는 삭제하지 않고 보존(orphan 보존)**한다.
  - `/result`, `/history` 등 과거 기록 표시는 `CalcRecord.derived`와 `CalcRecord.profileSnapshot`만으로 렌더링 가능해야 한다(현재 프로필이 없어도 결과 화면이 크래시하지 않음).
```ts
export type CalcSource = "MANUAL" | "SCAN_AI" | "FIXED_EXPENSE" | "SAVINGS_GOAL";

export interface WorkProfileSnapshot {
  // CalcRecord가 과거 재현을 위해 필요한 최소 프로필 정보만 저장
  payType: "MONTHLY" | "ANNUAL";
  payAmount: number; // 1 ~ 100000000
  workDaysPerWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  workHoursPerDay: number; // 1 ~ 24
  includeLunchBreak: boolean;
}

export interface CalcRecord {
  id: string; // uuid
  createdAt: string; // ISO
  updatedAt: string; // ISO

  // 사용자 입력/표시
  title: string; // (요구 예시 itemName에 해당) 0~40자, 예: "신발"

  // 금액
  amountKRW: number; // (요구 예시 amount에 해당) 1 ~ 100000000

  source: CalcSource;

  // 계산 시점 프로필 스냅샷(프로필 삭제/변경과 무관하게 기록 보존)
  profileSnapshot: WorkProfileSnapshot;

  // 환산 결과(요구 예시 laborHours 등은 minutes/seconds로부터 파생 가능)
  derived: {
    hourlyWageKRW: number; // >= 1
    minutesNeeded: number; // >= 0
    secondsNeeded: number; // >= 0
  };

  ai?: {
    isAiResult: boolean; // SCAN_AI인 경우 true
    extractedText?: string; // 0~200자
    confidence?: number; // 0~1
  };
}

export interface CalcRecordStore {
  version: 1;
  items: CalcRecord[];
}
```

#### Key: `wdv_fixed_expenses_v1`
- Type: `FixedExpenseStore`
```ts
export interface FixedExpense {
  id: string; // uuid
  createdAt: string; // ISO
  updatedAt: string; // ISO

  name: string; // 1~30자
  monthlyAmountKRW: number; // 1 ~ 100000000
}

export interface FixedExpenseStore {
  version: 1;
  items: FixedExpense[];
}
```

#### Key: `wdv_savings_goal_v1`
- Type: `SavingsGoalState`
```ts
export interface SavingsGoalState {
  id: string; // uuid
  createdAt: string; // ISO
  updatedAt: string; // ISO

  version: 1;
  goalAmountKRW: number; // 1 ~ 1000000000
  monthlySavingsKRW: number; // 1 ~ 100000000
}
```

#### Key: `wdv_ai_notice_v1`
- Type: `AiNoticeState` (**id/createdAt/updatedAt 추가**)
```ts
export interface AiNoticeState {
  id: string; // uuid
  createdAt: string; // ISO
  updatedAt: string; // ISO

  version: 1;
  scanAiNoticeAcknowledged: boolean;
  acknowledgedAt?: string; // ISO
}
```

#### Key: `wdv_policy_v1`
- Type: `AppPolicyState`
```ts
export interface AppPolicyState {
  id: string; // uuid
  createdAt: string; // ISO
  updatedAt: string; // ISO

  version: 1;
  blockExternalNavigation: boolean; // true 고정
}
```

---

### WorkProfile — fields, types, constraints
```ts
export interface WorkProfile {
  id: string; // uuid
  createdAt: string; // ISO
  updatedAt: string; // ISO

  profileVersion: 1;
  currency: "KRW";
  payType: "MONTHLY" | "ANNUAL";
  payAmount: number; // 1 ~ 100000000 (원)
  workDaysPerWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  workHoursPerDay: number; // 1 ~ 24 (시간), 소수 0.5 허용
  includeLunchBreak: boolean; // true면 workHoursPerDay에서 1시간 차감(최소 1시간 보장)
}
```
- localStorage key: `wdv_profile_v1`
- data shape: `WorkProfile`
- size estimation: ~0.5KB

### CalcRecord — fields, types, constraints
```ts
export type CalcSource = "MANUAL" | "SCAN_AI" | "FIXED_EXPENSE" | "SAVINGS_GOAL";

export interface WorkProfileSnapshot {
  payType: "MONTHLY" | "ANNUAL";
  payAmount: number; // 1 ~ 100000000
  workDaysPerWeek: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  workHoursPerDay: number; // 1 ~ 24
  includeLunchBreak: boolean;
}

export interface CalcRecord {
  id: string; // uuid
  createdAt: string; // ISO
  updatedAt: string; // ISO
  title: string; // 0~40자, 예: "신발"
  amountKRW: number; // 1 ~ 100000000
  source: CalcSource;

  // 외래키 대신 스냅샷을 저장(프로필 삭제/변경 시에도 기록은 보존)
  profileSnapshot: WorkProfileSnapshot;

  derived: {
    hourlyWageKRW: number; // >= 1
    minutesNeeded: number; // >= 0
    secondsNeeded: number; // >= 0
  };
  ai?: {
    isAiResult: boolean; // SCAN_AI인 경우 true
    extractedText?: string; // 0~200자
    confidence?: number; // 0~1
  };
}
```
- localStorage key: `wdv_calcs_v1`
- data shape: `{ version: 1; items: CalcRecord[] }`
- size estimation: 1 record ~ 0.6~1.2KB  
  - 1,000건 저장 시 최대 ~1.2MB (5MB 이내 목표)

### FixedExpense — fields, types, constraints
```ts
export interface FixedExpense {
  id: string; // uuid
  name: string; // 1~30자
  monthlyAmountKRW: number; // 1 ~ 100000000
  createdAt: string; // ISO
  updatedAt: string; // ISO
}
export interface FixedExpenseStore {
  version: 1;
  items: FixedExpense[];
}
```
- localStorage key: `wdv_fixed_expenses_v1`
- data shape: `{ version: 1; items: FixedExpense[] }`
- size estimation: 1,000건 ~ 0.3~0.6MB
- relationship to `CalcRecord`:
  - 생성 관계(논리): 사용자가 고정지출을 “환산/계산”으로 이어갈 경우 `CalcRecord.source="FIXED_EXPENSE"`로 기록이 생성될 수 있다.
  - 저장 관계(스키마): `FixedExpense`와 `CalcRecord` 사이에 강제 FK는 저장하지 않는다(즉, `CalcRecord`는 특정 `FixedExpense.id`를 필수로 참조하지 않는다).
  - cascade/삭제 정책: `FixedExpense`를 삭제해도 기존 `CalcRecord`는 삭제/수정되지 않는다(과거 기록 보존).

### SavingsGoal — fields, types, constraints
```ts
export interface SavingsGoalState {
  id: string; // uuid
  createdAt: string; // ISO
  updatedAt: string; // ISO

  version: 1;
  goalAmountKRW: number; // 1 ~ 1000000000
  monthlySavingsKRW: number; // 1 ~ 100000000
}
```
- localStorage key: `wdv_savings_goal_v1`
- data shape: `SavingsGoalState`
- size estimation: ~0.3KB

### AiNoticeState — fields, types, constraints
```ts
export interface AiNoticeState {
  id: string; // uuid
  createdAt: string; // ISO
  updatedAt: string; // ISO

  version: 1;
  scanAiNoticeAcknowledged: boolean;
  acknowledgedAt?: string; // ISO
}
```
- localStorage key: `wdv_ai_notice_v1`
- data shape: `AiNoticeState`
- size estimation: ~0.2KB

### AppPolicyState — fields, types, constraints
```ts
export interface AppPolicyState {
  id: string; // uuid
  createdAt: string; // ISO
  updatedAt: string; // ISO

  version: 1;
  blockExternalNavigation: boolean; // true 고정
}
```
- localStorage key: `wdv_policy_v1`
- data shape: `AppPolicyState`
- size estimation: ~0.2KB

---

## Feature List

### F1. 급여/근무조건 설정 및 시급 환산
- Description: 사용자가 월급/연봉과 주당 근무일, 하루 근무시간을 저장하면 시급/분급/초급을 계산한다. 앱의 모든 환산(소비/고정지출/저축)은 이 프로필을 기준으로 동작한다. 프로필은 localStorage에 저장되어 재방문 시 자동 로드된다.
- Data: `WorkProfile` (`wdv_profile_v1`)
- API: (none)
- Requirements:
- AC-1 [E]: Scenario: 월급 기반 프로필 저장 성공  
  Given 토스 로그인된 유저가 있을 때  
  When 설정 화면에서 `{ payType: "MONTHLY", payAmount: 3000000, workDaysPerWeek: 5, workHoursPerDay: 8, includeLunchBreak: true }`로 저장 버튼을 탭한다  
  Then localStorage `wdv_profile_v1`에 `payAmount=3000000`이 저장되어야 한다  
  And 성공 토스트로 `"저장했어요"`가 표시되어야 한다

- AC-2 [E]: Scenario: 연봉 기반 프로필 저장 성공  
  Given 토스 로그인된 유저가 있을 때  
  When 설정 화면에서 `{ payType: "ANNUAL", payAmount: 36000000, workDaysPerWeek: 5, workHoursPerDay: 8, includeLunchBreak: false }`로 저장 버튼을 탭한다  
  Then localStorage `wdv_profile_v1.payType`은 `"ANNUAL"`이어야 한다  
  And 홈 화면에 표시되는 “예상 시급” 값은 `> 0`인 정수(원)여야 한다

- AC-3 [W]: Scenario: 급여 금액이 0원인 경우 저장 거부  
  Given 토스 로그인된 유저가 있을 때  
  When 설정 화면에서 `{ payType: "MONTHLY", payAmount: 0 }`로 저장 버튼을 탭한다  
  Then TextField 하단 에러 텍스트로 `"급여를 1원 이상 입력해주세요"`가 표시되어야 한다  
  And localStorage `wdv_profile_v1` 값은 변경되지 않아야 한다

- AC-4 [W]: Scenario: 근무시간이 0시간인 경우 저장 거부  
  Given 토스 로그인된 유저가 있을 때  
  When 설정 화면에서 `{ workHoursPerDay: 0 }`로 저장 버튼을 탭한다  
  Then 에러 텍스트로 `"하루 근무시간은 1시간 이상이어야 해요"`가 표시되어야 한다  
  And 저장 버튼 동작 이후에도 설정 화면에 머물러야 한다

- AC-5 [S]: Scenario: 저장 중에는 중복 저장 방지  
  Given 토스 로그인된 유저가 있을 때  
  And 설정 저장 요청이 진행 중일 때  
  When 사용자가 저장 버튼을 연속으로 2회 탭한다  
  Then 두 번째 탭 시 저장 로직이 실행되지 않아야 한다  
  And 저장 버튼은 disabled 상태여야 한다

- AC-6 [W]: Scenario: localStorage 저장 실패(QuotaExceededError) 처리  
  Given 토스 로그인된 유저가 있을 때  
  And 브라우저가 localStorage setItem에서 QuotaExceededError를 발생시키는 환경일 때  
  When 설정 화면에서 `{ payType: "MONTHLY", payAmount: 3000000 }` 저장을 시도한다  
  Then AlertDialog로 제목 `"저장 실패"`와 본문 `"저장 공간이 부족해 저장할 수 없어요"`가 표시되어야 한다  
  And localStorage `wdv_profile_v1` 값은 변경되지 않아야 한다

- AC-7 [E]: Scenario: 설정 로딩 상태 표시  
  Given 토스 로그인된 유저가 있을 때  
  When 사용자가 `/settings`로 진입한다  
  Then localStorage 로드가 완료되기 전까지 Paragraph.Text로 `"불러오는 중..."`이 표시되어야 한다

---

### F2. 수동 소비 금액 입력 → 노동시간 환산 결과 + 상세(리워드 광고 게이트)
- Description: 사용자가 항목명과 금액을 입력하면, 저장된 프로필의 시급을 기준으로 해당 소비가 몇 시간/몇 분 노동인지 계산해 결과 화면에서 보여준다. 결과는 기록으로 저장되며, “상세 환산(초 단위/애니메이션)”은 보상형 광고를 시청한 뒤 노출된다.
- Data: `WorkProfile`, `CalcRecord` (`wdv_profile_v1`, `wdv_calcs_v1`)
- API: (none)
- Requirements:
- AC-1 [E]: Scenario: 수동 계산 기록 생성 성공  
  Given 토스 로그인된 유저가 있고 localStorage `wdv_profile_v1.payAmount=3000000`이 저장되어 있을 때  
  When 홈 화면에서 `{ title: "신발", amountKRW: 60000 }`을 입력하고 `"계산하기"` 버튼을 탭한다  
  Then localStorage `wdv_calcs_v1.items`에 `source="MANUAL"`인 기록이 1건 추가되어야 한다  
  And `/result`로 `navigate('/result', { state: { calcId: string } })`가 호출되어야 한다

- AC-2 [W]: Scenario: 프로필 미설정 상태에서 계산 시도 차단  
  Given 토스 로그인된 유저가 있을 때  
  And localStorage에 `wdv_profile_v1`이 없을 때  
  When 홈 화면에서 `{ title: "신발", amountKRW: 60000 }`을 입력하고 `"계산하기"`를 탭한다  
  Then AlertDialog로 제목 `"급여 설정 필요"`와 본문 `"먼저 급여/근무조건을 설정해주세요"`가 표시되어야 한다  
  And `/result`로 이동하지 않아야 한다

- AC-3 [W]: Scenario: 금액 미입력(0원) 거부  
  Given 토스 로그인된 유저가 있고 프로필이 저장되어 있을 때  
  When 홈 화면에서 `{ title: "커피", amountKRW: 0 }`으로 `"계산하기"`를 탭한다  
  Then 금액 TextField 하단에 `"금액을 1원 이상 입력해주세요"`가 표시되어야 한다  
  And localStorage `wdv_calcs_v1.items` 길이는 증가하지 않아야 한다

- AC-4 [W]: Scenario: 제목이 40자를 초과하면 저장 거부  
  Given 토스 로그인된 유저가 있고 프로필이 저장되어 있을 때  
  When 홈 화면에서 `title="12345678901234567890123456789012345678901"(41자)`와 `amountKRW=1000`으로 계산을 시도한다  
  Then 제목 TextField 하단에 `"항목명은 40자 이하로 입력해주세요"`가 표시되어야 한다  
  And 기록이 생성되지 않아야 한다

- AC-5 [E]: Scenario: 결과 화면 기본 결과 표시(광고 없이)  
  Given 토스 로그인된 유저가 있고 `wdv_calcs_v1.items`에 `{ id: "c1", amountKRW: 60000, source: "MANUAL" }` 기록이 있을 때  
  When 사용자가 `navigate('/result', { state: { calcId: "c1" } })`로 결과 화면에 진입한다  
  Then Paragraph.Text로 `"60,000원"`이 표시되어야 한다  
  And Chip 또는 Paragraph.Text로 `"몇 시간 노동값"` 요약 문구가 표시되어야 한다

- AC-6 [E]: Scenario: 상세 환산 보기 전 보상형 광고 게이팅  
  Given 토스 로그인된 유저가 있고 결과 화면에 진입했을 때  
  When 사용자가 `"상세 환산 보기"` 버튼을 탭한다  
  Then `TossRewardAd`가 표시되어야 한다  
  And 광고 시청 완료 이벤트 이후에만 초 단위 환산(예: `"초까지 환산"`) 섹션이 렌더링되어야 한다

- AC-7 [S]: Scenario: 결과 로딩 상태 표시  
  Given 토스 로그인된 유저가 있을 때  
  When `/result`가 `calcId="does-not-exist"`로 진입한다  
  Then localStorage 조회가 완료되기 전까지 `"불러오는 중..."`이 표시되어야 한다  
  And 조회 완료 후 `"결과를 찾을 수 없어요"`가 표시되어야 한다

- AC-8 [W]: Scenario: localStorage 파싱 실패 시 복구 다이얼로그  
  Given 토스 로그인된 유저가 있을 때  
  And localStorage `wdv_calcs_v1` 값이 `"not-json"` 문자열일 때  
  When 홈 화면이 기록을 로드한다  
  Then AlertDialog 본문으로 `"저장된 데이터를 읽을 수 없어요. 초기화할까요?"`가 표시되어야 한다  
  And 사용자가 `"초기화"`를 탭하면 `wdv_calcs_v1`이 `{ version: 1, items: [] }`로 재설정되어야 한다

---

### F3. 이미지 기반 가격 인식(외부 API) + AI 고지/라벨
- Description: 사용자는 사진을 업로드하면 외부 API를 통해 이미지에서 가격(원)을 추출하고, 추출된 금액으로 계산을 이어갈 수 있다. 이 기능은 AI 기반 결과를 포함하므로 첫 이용 고지와 결과 라벨을 표시한다. 실패 시 사용자가 직접 금액을 입력해 계속 진행할 수 있다.
- Data: `AiNoticeState`, `CalcRecord` (`wdv_ai_notice_v1`, `wdv_calcs_v1`)
- API: (external) — 아래 **API Contract** 참조
- **API Contract (external)**  *(오류코드/요청·응답 정의 보완 — `/scan` 인식 엔드포인트 명시)*
  - **Primary (MVP 기준)**
    - HTTP Method: `POST`
    - Path: `/api/v1/scan/recognize`
    - Content-Type: `multipart/form-data`
    - Request (multipart/form-data):
      - form-data:
        - `image: File` (필수, `image/*`)
    - Response `200 OK` (JSON):
      ```ts
      {
        prices: number[];        // KRW 정수 후보 배열(길이 >= 1 가능)
        confidence: number[];    // prices와 같은 길이, 각 0~1
      }
      ```
    - Errors (JSON, 최소 message 포함 권장):
      - `400 Bad Request`: invalid image(이미지 파싱 불가/요청 형식 오류)
      - `413 Payload Too Large`: file too large
      - `500 Internal Server Error`: OCR failure
      ```ts
      // 예시(권장)
      { message: string; code?: string }
      ```
    - Client normalization (클라이언트 정규화):
      - `normalizedAmountKRW = prices[0] ?? 0`
      - `normalizedConfidence = confidence[0] ?? 0`
  - **Compatibility (기존 스펙/서버 호환용: 유지)**
    - HTTP Method: `POST`
    - Path: `/api/scan/extract-price`
    - Content-Type: `multipart/form-data`
    - Auth:
      - 기본: **요구하지 않음(퍼블릭)**  
      - 단, 서버가 인증을 요구하도록 구성된 경우 `401 Unauthorized`가 반환될 수 있으며, 클라이언트는 이를 실패로 처리한다(아래 Errors 참조).
    - Request (multipart/form-data):
      - form-data:
        - `image: File` (필수, `image/*`)
    - Response `200 OK` (JSON):
      ```ts
      {
        // 호환성: 서버가 아래 두 필드 중 하나로 반환할 수 있으며,
        // 클라이언트는 detectedAmount 우선, 없으면 amountKRW로 정규화한다.
        detectedAmount?: number; // KRW 정수 (요구된 응답 타입)
        amountKRW?: number; // KRW 정수 (기존 스펙 호환)
        extractedText: string; // 0~200자
        confidence: number; // 0~1
      }
      ```
      - 정규화 규칙(클라이언트):  
        `normalizedAmountKRW = detectedAmount ?? amountKRW ?? 0`
    - Errors (모두 JSON, body는 서버 구현에 따르되 최소 message 문자열을 포함):
      - `400 Bad Request`: 파일 누락, 지원하지 않는 타입(이미지 아님) 등
      - `401 Unauthorized`: 인증 필요(서버 설정에 따라 발생 가능)
      - `413 Payload Too Large`: 파일 용량 제한 초과
      - `422 Unprocessable Entity`: 텍스트는 추출되었으나 가격(원) 검출 불가
      - `500 Internal Server Error`: AI/서버 내부 오류
      ```ts
      // 예시(권장)
      { message: string; code?: string }
      ```
- Requirements:
- AC-1 [E]: Scenario: AI 서비스 첫 이용 고지 1회 표시  
  Given 토스 로그인된 유저가 있고 localStorage `wdv_ai_notice_v1`이 없을 때  
  When 사용자가 `/scan` 화면에서 `"사진으로 인식하기"` 버튼을 탭한다  
  Then AlertDialog로 `"이 서비스는 생성형 AI를 활용합니다"` 문구가 표시되어야 한다  
  And 사용자가 `"확인"`을 탭하면 localStorage `wdv_ai_notice_v1.scanAiNoticeAcknowledged=true`가 저장되어야 한다

- AC-2 [E]: Scenario: 이미지 인식 성공 후 금액 자동 입력  
  Given 토스 로그인된 유저가 있고 프로필이 저장되어 있을 때  
  And `/api/scan/extract-price`가 `{ amountKRW: 60000, extractedText: "60,000원", confidence: 0.82 }`로 응답할 때  
  When 사용자가 `/scan`에서 이미지 1장을 선택한다  
  Then 금액 TextField 값이 `60000`으로 설정되어야 한다  
  And `"AI가 생성한 결과입니다"` 라벨(Paragraph.Text 또는 Chip)이 화면에 표시되어야 한다

- AC-3 [E]: Scenario: 인식 금액으로 계산하여 기록 생성(SCAN_AI)  
  Given 토스 로그인된 유저가 있고 `/scan`에서 금액 TextField가 `60000`일 때  
  When 사용자가 `"이 금액으로 계산"` 버튼을 탭한다  
  Then localStorage `wdv_calcs_v1.items`에 `source="SCAN_AI"`이고 `amountKRW=60000`인 기록이 추가되어야 한다  
  And `/result`로 `navigate('/result', { state: { calcId: string } })`가 호출되어야 한다

- AC-4 [W]: Scenario: OCR API 네트워크 오류 시 수동 입력 유도  
  Given 토스 로그인된 유저가 있을 때  
  And `/api/scan/extract-price` 호출이 네트워크 에러로 실패할 때  
  When 사용자가 `/scan`에서 이미지를 선택한다  
  Then Toast로 `"가격 인식에 실패했어요. 직접 입력해 주세요"`가 표시되어야 한다  
  And 금액 TextField는 빈 값 상태로 남아 있어야 한다

- AC-5 [W]: Scenario: OCR 결과가 0원인 경우 거부  
  Given 토스 로그인된 유저가 있을 때  
  And `/api/scan/extract-price`가 `{ amountKRW: 0, extractedText: "", confidence: 0.1 }`로 응답할 때  
  When 사용자가 이미지를 선택한다  
  Then Toast로 `"인식된 금액이 없어요. 직접 입력해 주세요"`가 표시되어야 한다  
  And `"이 금액으로 계산"` 버튼은 disabled여야 한다

- AC-6 [S]: Scenario: 인식 요청 중 로딩 상태 및 중복 요청 방지  
  Given 토스 로그인된 유저가 있을 때  
  When 사용자가 이미지 선택 직후 OCR 요청이 진행 중일 때  
  Then Paragraph.Text로 `"인식 중..."`이 표시되어야 한다  
  And 추가 이미지 선택 버튼 탭이 발생해도 OCR 요청은 1개만 진행되어야 한다

- AC-7 [U]: Scenario: CORS 에러 0개(스캔 API)  
  Given 프로덕션 환경에서 `/api/scan/extract-price`를 호출할 때  
  When 브라우저 네트워크 패널에 요청이 기록된다  
  Then CORS 에러가 발생하지 않아야 한다

---

### F4. 고정지출(월세/구독료) → 매달 노동일/시간 환산 목록
- Description: 사용자는 고정지출 항목(이름/월 금액)을 추가하고, 각 항목이 매달 몇 시간/며칠 노동인지 확인할 수 있다. 항목은 로컬에 저장되며, 수정/삭제는 화면 내 BottomSheet로 처리한다.
- Data: `FixedExpense`, `WorkProfile`, `CalcRecord(선택: 결과 기록)` (`wdv_fixed_expenses_v1`, `wdv_profile_v1`)
- API: (none)
- Requirements:
- AC-1 [E]: Scenario: 고정지출 항목 추가 성공  
  Given 토스 로그인된 유저가 있고 프로필이 저장되어 있을 때  
  When `/fixed-expenses`에서 추가 BottomSheet에 `{ name: "월세", monthlyAmountKRW: 700000 }`를 입력하고 `"추가"`를 탭한다  
  Then localStorage `wdv_fixed_expenses_v1.items`에 `name="월세"` 항목이 1건 추가되어야 한다  
  And Toast `"추가했어요"`가 표시되어야 한다

- AC-2 [E]: Scenario: 고정지출 목록에서 노동 환산 값 표시  
  Given 토스 로그인된 유저가 있고 `wdv_fixed_expenses_v1.items`에 `{ name: "넷플릭스", monthlyAmountKRW: 17000 }`가 있을 때  
