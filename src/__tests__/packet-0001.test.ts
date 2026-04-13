import type {
  WorkProfile,
  WorkProfileSnapshot,
  CalcRecord,
  CalcRecordStore,
  FixedExpense,
  FixedExpenseStore,
  SavingsGoalState,
  AiNoticeState,
  AppPolicyState,
  CalcSource,
  RouteState,
} from '@/lib/types';

// AC-1: 런타임 코드 없이 컴파일 — 이 파일이 tsc를 통과하면 증명됨
// AC-2: 위 import가 모두 성공해야 한다
// AC-3: RouteState가 필수 경로 키를 모두 포함해야 한다 (컴파일타임 검증)

type RequiredPaths =
  | '/'
  | '/settings'
  | '/result'
  | '/scan'
  | '/fixed-expenses'
  | '/savings-goal'
  | '/history'
  | '/share'
  | '/compare';

// RequiredPaths가 RouteState의 키 subset이 아니면 never가 되어 tsc 에러 발생
type _RouteStateCheck = RequiredPaths extends keyof RouteState ? true : never;

describe('packet-0001: 타입 정의', () => {
  it('AC-2: 모든 필수 타입이 export된다', () => {
    // import가 성공했다면 모든 타입이 export된 것
    const _types: [
      WorkProfile, WorkProfileSnapshot, CalcRecord, CalcRecordStore,
      FixedExpense, FixedExpenseStore, SavingsGoalState, AiNoticeState,
      AppPolicyState, CalcSource, RouteState,
    ] | null = null;
    expect(_types).toBeNull();
  });

  it('AC-3: RouteState가 필수 경로 키를 모두 포함한다', () => {
    const check: _RouteStateCheck = true;
    expect(check).toBe(true);
  });
});
