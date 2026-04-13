import { getFixedExpenseStore, addFixedExpense } from '@/lib/storage/fixedExpenses';
import { getSavingsGoalState, setSavingsGoalState } from '@/lib/storage/savingsGoal';
import { getAiNoticeState, ackScanAiNotice } from '@/lib/storage/aiNotice';
import { getPolicyState } from '@/lib/storage/policy';
import { STORAGE_KEYS } from '@/lib/storage/keys';

class LocalStorageMock implements Storage {
  private store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  key(index: number) { return Object.keys(this.store)[index] ?? null; }
  getItem(key: string) { return this.store[key] ?? null; }
  setItem(key: string, value: string) { this.store[key] = value; }
  removeItem(key: string) { delete this.store[key]; }
  clear() { this.store = {}; }
}

beforeEach(() => {
  vi.stubGlobal('localStorage', new LocalStorageMock());
});
afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('packet-0004: FixedExpenses/SavingsGoal/AiNotice/Policy CRUD', () => {
  describe('fixedExpenses', () => {
    it('값이 없으면 { version:1, items:[] }를 반환한다', () => {
      expect(getFixedExpenseStore()).toEqual({ version: 1, items: [] });
    });

    it('addFixedExpense 후 저장된다', () => {
      addFixedExpense({ name: '월세', monthlyAmountKRW: 500000 });
      const store = getFixedExpenseStore() as { version: number; items: { name: string }[] };
      expect(store.items).toHaveLength(1);
      expect(store.items[0].name).toBe('월세');
    });

    it('AC-3: setItem이 throw하면 ok:false를 반환하고 throw하지 않는다', () => {
      vi.spyOn(localStorage, 'setItem').mockImplementation(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });
      const result = addFixedExpense({ name: '구독', monthlyAmountKRW: 9900 });
      expect(result).toMatchObject({ ok: false });
    });
  });

  describe('savingsGoal', () => {
    it('값이 없으면 기본값을 반환한다', () => {
      const state = getSavingsGoalState();
      expect(state.version).toBe(1);
      expect(typeof state.goalAmountKRW).toBe('number');
      expect(typeof state.monthlySavingsKRW).toBe('number');
    });

    it('setSavingsGoalState 후 getSavingsGoalState로 동일한 값이 반환된다', () => {
      setSavingsGoalState({ version: 1, goalAmountKRW: 10000000, monthlySavingsKRW: 500000 });
      expect(getSavingsGoalState()).toEqual({ version: 1, goalAmountKRW: 10000000, monthlySavingsKRW: 500000 });
    });
  });

  describe('aiNotice', () => {
    it('값이 없으면 scanAiNoticeAcknowledged=false인 기본값을 반환한다', () => {
      const state = getAiNoticeState();
      expect(state.version).toBe(1);
      expect(state.scanAiNoticeAcknowledged).toBe(false);
    });

    it('AC-1: ackScanAiNotice 후 scanAiNoticeAcknowledged=true, acknowledgedAt이 number로 저장된다', () => {
      ackScanAiNotice();
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.AI_NOTICE)!);
      expect(raw.scanAiNoticeAcknowledged).toBe(true);
      expect(typeof raw.acknowledgedAt).toBe('number');
    });
  });

  describe('policy', () => {
    it('AC-2: 값이 없으면 { version:1, blockExternalNavigation:true }를 반환한다', () => {
      expect(getPolicyState()).toEqual({ version: 1, blockExternalNavigation: true });
    });

    it('저장된 값이 있으면 그 값을 반환한다', () => {
      localStorage.setItem(
        STORAGE_KEYS.POLICY,
        JSON.stringify({ version: 1, blockExternalNavigation: false }),
      );
      expect(getPolicyState()).toEqual({ version: 1, blockExternalNavigation: false });
    });
  });
});
