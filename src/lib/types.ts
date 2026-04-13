// ============================================================
// 도메인 엔티티
// ============================================================

/** 계산 기록의 출처 */
export type CalcSource = 'MANUAL' | 'SCAN_AI';

/** 사용자 급여/근무 설정 */
export interface WorkProfile {
  /** 급여 유형 */
  payType: 'monthly' | 'annual' | 'hourly';
  /** 급여 금액 (원) */
  payAmount: number;
  /** 하루 근무시간 */
  workHoursPerDay: number;
  /** 주 근무일수 */
  workDaysPerWeek: number;
  /** 점심시간(1시간) 제외 여부 */
  includeLunchBreak: boolean;
}

/** 계산 시점에 고정된 급여 스냅샷 (이후 프로필 변경에 영향받지 않음) */
export type WorkProfileSnapshot = WorkProfile;

/** 단건 계산 기록 */
export interface CalcRecord {
  id: string;
  title: string;
  amountKRW: number;
  source: CalcSource;
  profileSnapshot: WorkProfileSnapshot;
  /** AI 스캔 메타데이터 (source='SCAN_AI'일 때) */
  aiMeta?: { extractedText?: string; confidence?: number };
  /** 생성 시각 (Unix timestamp ms) */
  createdAt: number;
}

/** localStorage wdv_calcs_v1 저장 구조 */
export interface CalcRecordStore {
  version: 1;
  items: CalcRecord[];
}

// ============================================================
// 고정지출
// ============================================================

export interface FixedExpense {
  id: string;
  name: string;
  monthlyAmountKRW: number;
  createdAt: number;
}

export interface FixedExpenseStore {
  version: 1;
  items: FixedExpense[];
}

// ============================================================
// 목표저축
// ============================================================

export interface SavingsGoalState {
  version: 1;
  goalAmountKRW: number;
  monthlySavingsKRW: number;
}

// ============================================================
// AI 고지 / 앱 정책
// ============================================================

export interface AiNoticeState {
  version: 1;
  scanAiNoticeAcknowledged: boolean;
  acknowledgedAt?: number;
}

export interface AppPolicyState {
  version: 1;
  blockExternalNavigation: boolean;
}

// ============================================================
// 라우팅 location.state 계약
// ============================================================

export interface RouteState {
  '/': undefined;
  '/settings': undefined;
  '/result': { calcId: string };
  '/scan': undefined;
  '/fixed-expenses': undefined;
  '/savings-goal': undefined;
  '/history': undefined;
  '/share': { calcId: string };
  '/compare': { baseCalcId: string };
}
