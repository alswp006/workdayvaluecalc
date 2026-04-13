```md
# UPDATED TASK (Complete)

본 업데이트는 Consistency Check Report에서 지적된 **(1) SPEC/TASK truncation으로 인한 공백**, **(2) 애니메이션 요구의 AC/Task 명시 부족**, **(3) 저장 실패(Quota) UI 다이얼로그 누락 위험**, **(4) 로딩/검증/차단 로직의 UI 태스크 부재**를 해소하기 위해 TASK를 **전체(epic 1~5) 완전 제시 + 일부 DoD 보강 + 유틸 1개 추가**로 정리한 버전이다.  
(기존에 포함되어 있던 Epic 3~5, S2~S9 페이지 태스크를 “문서에 완전 포함”시키는 것이 핵심 조치)

---

## Epic 1. TypeScript types + interfaces

### Task 1.1 타입 정의(엔티티 + RouteState 계약) 추가
- Description: SPEC의 모든 데이터 모델 타입과 라우팅 state 계약을 `src/lib/types.ts`에 정의한다. (런타임 코드 없음)
- DoD:
  - `src/lib/types.ts`에 아래가 export 되어야 한다:
    - `WorkProfile`, `WorkProfileSnapshot`, `CalcRecord`, `CalcRecordStore`, `FixedExpense`, `FixedExpenseStore`, `SavingsGoalState`, `AiNoticeState`, `AppPolicyState`, `CalcSource`
    - **`RouteState`**: 각 경로별 `location.state` 타입이 명시되어야 한다. (예: `"/result": { calcId: string }`)
  - `RouteState`는 최소 아래 경로를 포함해야 한다: `/`, `/settings`, `/result`, `/scan`, `/fixed-expenses`, `/savings-goal`, `/history`, `/share`, `/compare`
  - 앱이 TypeScript 컴파일을 통과해야 한다.
- Covers: []
- Files:
  - `src/lib/types.ts`
- Depends on: none

---

## Epic 2. Data layer (localStorage helpers, domain utils)

### Task 2.1 localStorage 안전 JSON IO 유틸(파싱/Quota 롤백) 구현
- Description: localStorage 읽기/쓰기의 공통 래퍼를 구현한다. 파싱 실패 감지, QuotaExceededError 처리, 쓰기 실패 시 롤백을 지원한다.
- DoD:
  - `readJson(key)`가 아래 케이스를 구분해 반환해야 한다:
    - key 없음: `{ ok: true, value: null }`
    - JSON 파싱 성공: `{ ok: true, value: T }`
    - JSON 파싱 실패: `{ ok: false, error: { type: "PARSE_ERROR", key } }`
  - `writeJsonWithRollback(key, nextValue)`가 아래를 만족해야 한다:
    - 성공 시 `{ ok: true }`
    - `QuotaExceededError`(또는 유사 에러) 시 `{ ok: false, error: { type: "QUOTA_EXCEEDED", key } }`
    - 실패 시 localStorage의 해당 key 값이 **이전 값으로 유지**되어야 한다(롤백)
  - 앱이 컴파일되어야 한다.
- DoD(테스트 기준 예시):
  - setItem이 throw하는 환경에서 `writeJsonWithRollback` 호출 후, key 값이 호출 전과 동일하면 Pass
- Covers: [S2-AC5, F1-AC6, S5-AC6]
- Files:
  - `src/lib/storage/io.ts`
- Depends on: Task 1.1

### Task 2.2 Profile/Calcs storage CRUD + Calcs 100개 제한/초기화 구현
- Description: `wdv_profile_v1`, `wdv_calcs_v1`에 대한 저장/로드/초기화/추가 로직을 구현한다. (정렬, 최대 100개 제한 포함)
- DoD:
  - `getWorkProfile()` / `setWorkProfile(profile)` 구현
  - `getCalcStore()`:
    - 값 없음이면 `{ version: 1, items: [] }`를 반환
    - 파싱 실패면 `PARSE_ERROR`를 반환(다이얼로그 표시는 UI/Store에서 처리)
  - `resetCalcStore()`가 `wdv_calcs_v1`을 `{ version: 1, items: [] }`로 설정해야 한다
  - `addCalcRecord(record)`:
    - 추가 후 `items.length > 100`이면 `createdAt`이 가장 오래된 것부터 제거하여 정확히 100개로 맞춰야 한다
    - 기본 정렬은 `createdAt` 내림차순을 유지해야 한다(저장 결과 기준)
  - 앱이 컴파일되어야 한다.
- Covers: [S1-AC5, F2-AC1, F2-AC8, S7-AC3]
- Files:
  - `src/lib/storage/keys.ts`
  - `src/lib/storage/profile.ts`
  - `src/lib/storage/calcs.ts`
- Depends on: Task 2.1

### Task 2.3 FixedExpenses/SavingsGoal/AiNotice/Policy storage CRUD 구현
- Description: 나머지 localStorage 키들의 기본 CRUD/기본값 생성을 구현한다.
- DoD:
  - `wdv_fixed_expenses_v1`: `getFixedExpenseStore()`, `addFixedExpense(item)` 구현(Quota 롤백은 io 유틸 사용)
  - `wdv_savings_goal_v1`: `getSavingsGoalState()`, `setSavingsGoalState(state)` 구현
  - `wdv_ai_notice_v1`: `getAiNoticeState()`, `ackScanAiNotice()` 구현(ack 시 `scanAiNoticeAcknowledged=true`, `acknowledgedAt` 저장)
  - `wdv_policy_v1`: `getPolicyState()` 구현(기본값에서 `blockExternalNavigation: true`)
  - 앱이 컴파일되어야 한다.
- Covers: [S4-AC1, F3-AC1, S5-AC5, F4-AC1]
- Files:
  - `src/lib/storage/fixedExpenses.ts`
  - `src/lib/storage/savingsGoal.ts`
  - `src/lib/storage/aiNotice.ts`
  - `src/lib/storage/policy.ts`
- Depends on: Task 2.1, Task 1.1

### Task 2.4 도메인 유틸: 시급/환산 계산 + 포맷 + 스캔 API 클라이언트 + 공유 payload codec
- Description: 페이지들이 재사용할 계산/포맷/인식 API 호출/공유코드 인코딩을 유틸로 제공한다.
- DoD:
  - `computeHourlyWageKRW(profile: WorkProfileSnapshot): number`가 `>= 1` 정수를 반환해야 한다
    - `includeLunchBreak=true`이면 유효 근무시간을 `workHoursPerDay - 1`로 계산하되 최소 1 보장
  - `computeDerived(amountKRW, profileSnapshot)`가 `{ hourlyWageKRW, minutesNeeded, secondsNeeded }`를 반환해야 한다
  - `formatKRW(60000) -> "60,000원"`처럼 `"원"`을 포함해야 한다
  - 스캔 API:
    - `recognizePrice(file)`가 multipart/form-data로 **`/api/scan/extract-price` 우선 호출**하고,
      - 200이면 정규화(`normalizedAmountKRW = detectedAmount ?? amountKRW ?? 0`) 결과 반환
      - status를 함께 반환(페이지에서 400/401/422/500 처리용)
  - 공유 payload:
    - `encodeSharePayload(calcRecord)` → string
    - `decodeSharePayload(input)` → `{ ok: true, value } | { ok: false }` (유효성 실패 감지)
  - 앱이 컴파일되어야 한다.
- Covers: [F1-AC2, S3-AC3, F2-AC5, S8-AC2, S9-AC2, S9-AC4]
- Files:
  - `src/lib/domain/calc.ts`
  - `src/lib/domain/format.ts`
  - `src/lib/domain/scanApi.ts`
  - `src/lib/domain/sharePayload.ts`
- Depends on: Task 1.1

### Task 2.5 도메인 유틸: 숫자 카운트업 애니메이션 헬퍼(초/분 환산 애니메이션 기반)
- Description: “분급/초급 환산 애니메이션” 요구를 페이지에서 재사용 가능하도록 최소 헬퍼를 제공한다. (외부 애니메이션 라이브러리 도입 없음)
- DoD:
  - `animateCountUp({ from, to, durationMs, onUpdate, onDone })`를 export 해야 한다
    - `durationMs` 동안 `onUpdate`가 **최소 3회 이상 호출**되어야 한다(프레임 업데이트 보장)
    - 종료 시 `onUpdate(to)`가 1회 이상 호출된 뒤 `onDone()`이 호출되어야 한다
    - `durationMs <= 0`이면 `onUpdate(to)` 후 즉시 `onDone()` 호출
  - 앱이 컴파일되어야 한다.
- Covers: [F2-AC6]  <!-- “상세 환산 애니메이션” 근거 -->
- Files:
  - `src/lib/domain/animate.ts`
- Depends on: none

---

## Epic 3. State management (React Context)

### Task 3.1 AppStore(프로필+기록) Provider/Hook 구현 (초기 로딩/파싱에러 상태 포함)
- Description: 프로필/계산기록을 전역 상태로 제공하고, 초기 로딩 플래그 및 파싱 실패 플래그를 노출한다.
- DoD:
  - `AppStoreProvider` 마운트 시 1회:
    - `profile`, `calcs`를 로드하고 `isBootLoading`을 `true → false`로 전환해야 한다
    - 로딩 중 UI가 “불러오는 중...”을 표시할 수 있도록 플래그를 제공해야 한다
  - `calcsParseError`(boolean) 및 `resetCalcs()` action 제공
  - `addManualCalc({ title, amountKRW })` action 제공(내부에서 `addCalcRecord` 호출)
  - 앱이 컴파일되어야 한다.
- Covers: [S1-AC1, S1-AC5, S7-AC1, S7-AC3]
- Files:
  - `src/lib/store/AppStore.tsx`
- Depends on: Task 2.2

### Task 3.2 AppStore 확장(스캔/고정지출/저축/AI 고지) + action별 loading/중복요청 방지 상태
- Description: 나머지 기능에서 필요한 상태와 액션(저장 중 중복 방지 포함)을 Store에 추가한다.
- DoD:
  - `saveProfile(next)` action:
    - 진행 중 `isSavingProfile=true`
    - `isSavingProfile=true`일 때 재호출해도 storage write가 1회만 일어나야 한다(중복 방지)
    - Quota 실패를 `{ ok:false, error:"QUOTA_EXCEEDED" }` 형태로 페이지가 감지 가능해야 한다
  - `ackScanAiNotice()` action 연결
  - `addScanAiCalc({ title, amountKRW, aiMeta })` action 제공
  - `fixedExpenses` 로드 + `addFixedExpense({ name, monthlyAmountKRW })`
  - 앱이 컴파일되어야 한다.
- Covers: [S2-AC5, F1-AC5, F3-AC3, S5-AC6, S4-AC2]
- Files:
  - `src/lib/store/AppStore.tsx`
- Depends on: Task 3.1, Task 2.3

---

## Epic 4. Core UI pages (src/pages/) — ONE page per task

### Task 4.1 홈 `/` 페이지 구현(빠른 계산 + 최근 5개 + 파싱 실패 복구 다이얼로그)
- Description: 금액/항목명 입력, 계산하기, 최근 기록 5개, 설정 미설정 Empty, 배너 광고 슬롯 배치를 구현한다.
- DoD:
  - 로딩: `isBootLoading=true` 동안 `Paragraph.Text`에 `"불러오는 중..."` 표시
  - 프로필 없음:
    - `"급여 설정이 필요해요"` 문구 표시
    - `"설정"` 버튼 탭 시 `navigate('/settings')` 호출
    - `"계산하기"` 탭 시 AlertDialog(제목 `"급여 설정 필요"`, 본문 `"먼저 급여/근무조건을 설정해주세요"`) 표시 + `/result` 이동 금지
  - 금액 검증:
    - 금액이 비었거나 0이면 금액 TextField 하단 `"금액을 1원 이상 입력해주세요"` + navigate 금지
  - 제목 검증:
    - 41자 이상이면 제목 TextField 하단 `"항목명은 40자 이하로 입력해주세요"` + 기록 생성 금지
  - 성공:
    - `source="MANUAL"` CalcRecord가 추가되고 `/result`로 `navigate('/result', { state: { calcId } })` 호출
  - 파싱 실패:
    - `calcsParseError=true`이면 AlertDialog 본문 `"저장된 데이터를 읽을 수 없어요. 초기화할까요?"`
    - `"초기화"` 탭 시 `wdv_calcs_v1`이 `{ version: 1, items: [] }`로 재설정
  - 키보드 가림 방지:
    - 금액 TextField 또는 항목명 TextField `onFocus` 시 `scrollIntoView({ block: 'center' })`가 호출되어야 한다
  - `location.state`는 사용하지 않으며, RouteState 타입을 import해 `undefined`로 취급(캐스팅 포함)
  - 앱이 컴파일되어야 한다.
- Covers: [S1-AC1, S1-AC2, S1-AC3, S1-AC4, S1-AC5, F2-AC1, F2-AC2, F2-AC3, F2-AC4, F2-AC8]
- Files:
  - `src/pages/HomePage.tsx`
- Depends on: Task 3.1, Task 2.4

### Task 4.2 설정 `/settings` 페이지 구현(저장/검증/Quota 다이얼로그/중복 저장 방지)
- Description: WorkProfile 입력/저장, 로딩 표시, 저장 성공 토스트 및 뒤로가기, 저장 실패 다이얼로그를 구현한다.
- DoD:
  - 로딩: 진입 직후 `isBootLoading=true`이면 `"불러오는 중..."` 표시
  - payAmount=0 저장 시:
    - TextField 하단 `"급여를 1원 이상 입력해주세요"`
    - localStorage 값 변경 없음
  - workHoursPerDay=0 저장 시:
    - 에러 `"하루 근무시간은 1시간 이상이어야 해요"`
    - `navigate(-1)` 호출 금지
  - 저장 성공 시:
    - `wdv_profile_v1` 갱신
    - Toast `"저장했어요"`
    - `navigate(-1)` 호출
  - 저장 중 중복 방지:
    - 저장 진행 중 버튼 `disabled=true`
    - 연속 2회 탭해도 storage write는 1회만 발생(구현 상 isSavingProfile로 가드)
  - Quota 실패:
    - AlertDialog 제목 `"저장 실패"`, 본문 `"저장 공간이 부족해 저장할 수 없어요"`
    - localStorage `wdv_profile_v1` 값 변경 없음
  - RouteState import 후 `location.state`는 `undefined` 캐스팅
- Covers: [S2-AC1, S2-AC2, S2-AC3, S2-AC4, S2-AC5, F1-AC1, F1-AC2, F1-AC3, F1-AC4, F1-AC5, F1-AC6, F1-AC7]
- Files:
  - `src/pages/SettingsPage.tsx`
- Depends on: Task 3.2, Task 2.4

### Task 4.3 결과 `/result` 페이지 구현(기본 결과 + 리워드 광고 게이트 상세 + 애니메이션 + Empty/로딩)
- Description: calcId로 기록을 찾아 기본 결과를 표시하고, 상세 환산(초/분 단위 포함)은 `TossRewardAd` 시청 후 렌더링한다. 상세 영역 숫자는 카운트업 애니메이션을 포함한다.
- DoD:
  - `location.state`를 `RouteState["/result"] | undefined`로 캐스팅
  - 로딩: `isBootLoading=true` 또는 calc 조회 중이면 `"불러오는 중..."` 표시
  - Empty:
    - state 없거나 calc 없음이면 `"결과를 찾을 수 없어요"`
    - `"홈으로"` 버튼 탭 시 `navigate('/')`
  - 기본 결과:
    - `"60,000원"` 형태 금액 텍스트 표시(최소 `"원"` 포함)
    - `"몇 시간 노동값"` 요약 문구 표시(Chip 또는 Paragraph.Text)
  - 상세 게이트:
    - `"상세 환산 보기"` 탭 시 `TossRewardAd`로 감싼 상세 영역을 오픈
    - 광고 시청 완료 전에는 `"초"`/`"초 단위"` 상세 섹션 DOM이 존재하지 않아야 한다
  - 상세 숫자 애니메이션(분급/초급 환산 애니메이션 충족):
    - 광고 시청 완료 직후 상세 섹션에서 `secondsNeeded` 표시는 `animateCountUp`(Task 2.5)로 600ms~1200ms 사이 duration을 사용해 0→목표값으로 변화해야 한다
    - **Pass/Fail 조건**:
      - 상세 섹션이 처음 렌더된 시점(+50ms 이내)에 표시된 초 값이 최종 목표값과 동일하면 Fail
      - 상세 섹션이 렌더된 시점(+1500ms 이내)에 표시된 초 값이 최종 목표값과 동일하면 Pass
  - 광고 실패:
    - `TossRewardAd` 실패 이벤트 시 Toast `"광고를 불러오지 못했어요"`
    - 기본 결과 섹션은 계속 표시
- Covers: [S3-AC1, S3-AC2, S3-AC3, S3-AC4, S3-AC5, F2-AC5, F2-AC6, F2-AC7]
- Files:
  - `src/pages/ResultPage.tsx`
- Depends on: Task 3.1, Task 2.4, Task 2.5

### Task 4.4 스캔 `/scan` 페이지 구현(AI 고지 1회 + 파일 검증 + 오류코드 처리 + 성공 라벨)
- Description: 파일 선택→OCR 요청→금액 자동 입력, 실패 시 토스트, AI 고지 1회 다이얼로그/저장, “AI가 생성한 결과” 라벨을 구현한다.
- DoD:
  - 첫 이용 고지:
    - `wdv_ai_notice_v1` 없을 때 `"사진으로 인식하기"` 탭하면 AlertDialog에 `"이 서비스는 생성형 AI를 활용합니다"`
    - `"확인"` 탭 시 `scanAiNoticeAcknowledged=true` 저장
  - 파일 선택 취소:
    - `files.length===0`이면 Toast `"사진을 선택해주세요"`
    - API 호출 0회 유지
    - 금액 TextField 빈 값
  - 파일 타입 거부:
    - `!file.type.startsWith("image/")`이면 Toast `"이미지 파일만 선택할 수 있어요"`
    - API 호출 0회, 금액 빈 값
  - 인식 요청 중:
    - `"인식 중..."` 표시
    - 파일 선택 트리거 버튼 `disabled=true`
    - 같은 세션에서 추가 탭/선택 시도해도 네트워크 요청 1회만 진행(가드 ref)
  - 오류 처리(호환 엔드포인트 기준):
    - 422: Toast `"인식된 금액이 없어요. 직접 입력해 주세요"`, 금액 빈 값, `"이 금액으로 계산"` disabled
    - 400: Toast `"지원하지 않는 이미지예요. 다른 사진을 선택해 주세요"`, 금액 빈 값, 계산 disabled
    - 500/네트워크: Toast `"가격 인식에 실패했어요. 직접 입력해 주세요"`, 금액 빈 값 유지
    - 401: Toast `"로그인이 필요해요. 다시 시도해 주세요"`, 금액 빈 값 유지
  - 성공:
    - 응답이 `{ amountKRW: 60000, extractedText, confidence }`면 금액 TextField가 `"60000"`으로 세팅
    - `"AI가 생성한 결과입니다"` 라벨 표시(Chip 또는 Paragraph.Text)
  - `"이 금액으로 계산"`:
    - amount>=1일 때 enabled
    - 탭 시 `source="SCAN_AI"` 기록 생성 + `/result`로 `{ calcId }` navigate
  - RouteState import/cast 적용
- Covers: [S4-AC1, S4-AC2, S4-AC3, S4-AC4, S4-AC5, S4-AC6, S4-AC7, S4-AC8, S4-AC9, F3-AC1, F3-AC2, F3-AC3, F3-AC4, F3-AC5, F3-AC6]
- Files:
  - `src/pages/ScanPage.tsx`
- Depends on: Task 3.2, Task 2.4

### Task 4.5 고정지출 `/fixed-expenses` 페이지 구현(추가 BottomSheet + 검증 + Empty/로딩 + 가상 스크롤)
- Description: 고정지출 목록/추가, 입력 검증, Quota 롤백 다이얼로그, 201개 이상 가상 스크롤을 구현한다. 또한 각 항목의 “노동 환산 값” 텍스트를 함께 표시한다.
- DoD:
  - (의존성) `react-window`를 설치하고 빌드/컴파일이 통과해야 한다
  - 로딩: `"불러오는 중..."`
  - Empty: items=[]이면 `"고정지출을 추가해보세요"`
  - 추가 BottomSheet:
    - name==""이면 `"항목명을 입력해주세요"` + items 길이 증가 없음
    - monthlyAmountKRW==0이면 `"금액을 1원 이상 입력해주세요"` + 추가 금지
    - 성공 시 localStorage에 항목 1건 추가 + Toast `"추가했어요"`
  - Quota 실패 시:
    - AlertDialog 본문 `"저장 공간이 부족해 저장할 수 없어요"`
    - UI 목록에 해당 항목이 나타나지 않아야 한다
  - 노동 환산 값 표시:
    - 각 ListRow에 `"시간"` 또는 `"일"` 단위를 포함한 환산 텍스트가 함께 렌더링되어야 한다 (프로필 기반 계산값)
  - 201개 이상 가상 스크롤:
    - items 길이 201이면 DOM의 ListRow 렌더 개수 `<= 40`
- Covers: [S5-AC1, S5-AC2, S5-AC3, S5-AC4, S5-AC5, S5-AC6, S5-AC7, F4-AC1, F4-AC2]
- Files:
  - `package.json`
  - `src/pages/FixedExpensesPage.tsx`
- Depends on: Task 3.2, Task 2.4

### Task 4.6 목표 저축 `/savings-goal` 페이지 구현(입력 가이드 + 검증 + 계산 로딩 + 리워드 광고 상세)
- Description: 목표금액/월 저축액 입력 후 요약 결과를 표시하고, 상세는 리워드 광고 완료 후 렌더링한다.
- DoD:
  - 최초 진입(계산 전): 가이드 문구 표시
  - monthlySavingsKRW=0이면 `"매달 저축액을 1원 이상 입력해주세요"` + 결과 요약 섹션 미표시
  - 프로필 미설정이면 AlertDialog 본문 `"먼저 급여/근무조건을 설정해주세요"` + 결과 미표시
  - `"계산하기"` 탭 직후:
    - `"계산 중..."` 표시
    - 버튼 disabled
  - 요약 결과가 있는 상태에서 `"상세 보기"` 탭:
    - `TossRewardAd` 표시
    - 시청 완료 이후에만 `"일 단위"` 또는 `"시간 단위"` 상세 섹션 렌더
- Covers: [S6-AC1, S6-AC2, S6-AC3, S6-AC4, S6-AC5]
- Files:
  - `src/pages/SavingsGoalPage.tsx`
- Depends on: Task 3.1, Task 2.4

### Task 4.7 기록 `/history` 페이지 구현(Empty/로딩/파싱 실패 + 가상 스크롤 + 결과 이동)
- Description: 계산 기록 리스트를 표시하고, 항목 탭 시 결과 화면으로 이동한다. 파싱 실패 복구 다이얼로그를 표시한다.
- DoD:
  - 로딩: `"불러오는 중..."`
  - Empty: items=[]이면 `"아직 계산 기록이 없어요"` + `"홈 이동"` 탭 시 `navigate('/')`
  - 파싱 실패:
    - AlertDialog 표시
    - 렌더링 유지(크래시 금지)
  - 항목 탭: `navigate('/result', { state: { calcId } })`
  - 201개 이상 가상 스크롤: DOM ListRow `<= 40`
  - RouteState cast 적용
- Covers: [S7-AC1, S7-AC2, S7-AC3, S7-AC4, S7-AC5]
- Files:
  - `src/pages/HistoryPage.tsx`
- Depends on: Task 3.1

### Task 4.8 공유 `/share` 페이지 구현(Empty 처리 + 링크 복사 + 이미지 공유 로딩 + Web Share 미지원 안내)
- Description: calcId 결과를 공유 코드로 만들고 링크 복사/이미지 공유를 제공한다.
- DoD:
  - `location.state`를 `RouteState["/share"] | undefined`로 캐스팅
  - Empty:
    - state 없거나 calc 없음이면 `"공유할 결과가 없어요"`
    - 공유 버튼 disabled
  - 링크 복사:
    - `"링크 복사"` 탭 시 clipboard 문자열에 `"wdv://share/"` 포함
    - Toast `"복사했어요"`
  - 이미지 공유:
    - 탭 시 `"이미지 생성 중..."` 표시 + 생성 완료 전까지 공유 버튼 disabled
    - `navigator.share === undefined`면 AlertDialog:
      - 제목 `"공유 방식 안내"`
      - 본문 `"이 기기에서는 이미지 공유를 지원하지 않아요. 링크 복사를 사용해주세요"`
    - 크래시 없어야 함
- Covers: [S8-AC1, S8-AC2, S8-AC3, S8-AC4]
- Files:
  - `src/pages/SharePage.tsx`
- Depends on: Task 2.4, Task 3.1

### Task 4.9 비교 `/compare` 페이지 구현(payload 자동 주입/파싱 + 성공 표기 + baseCalcId 없음 처리)
- Description: 내 결과(baseCalcId)와 친구 공유코드(payload)를 비교 표기한다.
- DoD:
  - Empty 가이드: 공유코드 입력이 비어 있으면 가이드 문구 표시
  - payload 자동 주입:
    - `location.state.sharedPayload`가 있으면 초기 파싱 동안 `"불러오는 중..."` 표시
  - 파싱 실패:
    - `"NOT_A_VALID_PAYLOAD"` 입력 후 `"비교하기"` 탭 시 `"공유 코드가 올바르지 않아요"`
    - 비교 결과 섹션(내/친구) 미표시
  - 비교 성공:
    - `"내 결과"`, `"친구 결과"` 섹션 타이틀 모두 표시
    - 두 섹션 모두 `"원"` 포함 금액 텍스트 표시
  - baseCalcId 기록 없음:
    - `"결과를 찾을 수 없어요"` 표시(AlertDialog 또는 Paragraph.Text)
    - `"비교하기"` 버튼 disabled
  - RouteState cast 적용
- Covers: [S9-AC1, S9-AC2, S9-AC3, S9-AC4, S9-AC5]
- Files:
  - `src/pages/ComparePage.tsx`
- Depends on: Task 2.4, Task 3.1

---

## Epic 5. Integration + polish (routing wiring, proxy)

### Task 5.1 라우팅/Provider 연결 + Vite 프록시로 스캔 CORS 리스크 완화
- Description: React Router 라우팅을 전체 페이지에 연결하고, AppStoreProvider를 루트에 적용한다. 스캔 API는 상대경로(`/api/...`)를 사용하고, 개발환경에서 프록시를 설정한다.
- DoD:
  - `AppStoreProvider`가 라우터 상위에 적용되어 모든 페이지에서 store hook 사용 가능
  - 아래 라우트가 동작(컴파일 기준)해야 한다:
    - `/`, `/settings`, `/result`, `/scan`, `/fixed-expenses`, `/savings-goal`, `/history`, `/share`, `/compare`
  - 스캔 API 호출은 **절대경로 하드코딩 없이** 상대경로(`/api/scan/extract-price`) 사용
  - `vite.config.ts`에 `/api` 프록시(개발환경용) 설정이 존재해야 한다 (목표: 개발 중 CORS 에러 방지)
  - 앱이 컴파일되어야 한다.
- Covers: [F3-AC7]
- Files:
  - `src/App.tsx`
  - `src/main.tsx`
  - `src/routes.tsx` (선택: 라우트 정의 분리 시)
  - `vite.config.ts`
- Depends on: Task 4.1 ~ Task 4.9

---

## AC Coverage (Updated)
- Total ACs in SPEC: **74**
- Covered by tasks: **74**
- 추가 보강:
  - “분급/초급 환산 애니메이션” 요구를 Task 2.5 + Task 4.3 DoD로 **명시적 Pass/Fail**로 고정

---
```