import { getWorkProfile, setWorkProfile } from '@/lib/storage/profile';
import { getCalcStore, resetCalcStore, addCalcRecord } from '@/lib/storage/calcs';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import type { WorkProfile, CalcRecord } from '@/lib/types';

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

const mockProfile: WorkProfile = {
  payType: 'monthly',
  payAmount: 3000000,
  workHoursPerDay: 8,
  workDaysPerWeek: 5,
  includeLunchBreak: false,
};

const makeRecord = (id: string, createdAt: number): CalcRecord => ({
  id,
  title: `item-${id}`,
  amountKRW: 10000,
  source: 'MANUAL',
  profileSnapshot: mockProfile,
  createdAt,
});

describe('packet-0003: Profile/Calcs storage CRUD', () => {
  describe('profile', () => {
    it('값이 없으면 null을 반환한다', () => {
      expect(getWorkProfile()).toBeNull();
    });

    it('setWorkProfile 후 getWorkProfile로 동일한 값이 반환된다', () => {
      setWorkProfile(mockProfile);
      expect(getWorkProfile()).toEqual(mockProfile);
    });
  });

  describe('getCalcStore', () => {
    it('AC-1: 값이 없으면 { version:1, items:[] }를 반환한다', () => {
      const result = getCalcStore();
      expect(result).toEqual({ version: 1, items: [] });
    });

    it('파싱 실패 시 ok:false, PARSE_ERROR를 반환한다', () => {
      localStorage.setItem(STORAGE_KEYS.CALCS, 'not-json');
      const result = getCalcStore();
      expect(result).toMatchObject({ ok: false, error: { type: 'PARSE_ERROR' } });
    });
  });

  describe('resetCalcStore', () => {
    it('AC-2: 실행 후 wdv_calcs_v1이 { version:1, items:[] }로 설정된다', () => {
      localStorage.setItem(STORAGE_KEYS.CALCS, JSON.stringify({ version: 1, items: [makeRecord('x', 1)] }));
      resetCalcStore();
      const raw = JSON.parse(localStorage.getItem(STORAGE_KEYS.CALCS)!);
      expect(raw).toEqual({ version: 1, items: [] });
    });
  });

  describe('addCalcRecord', () => {
    it('기록이 추가되고 createdAt 내림차순으로 정렬된다', () => {
      addCalcRecord(makeRecord('a', 1000));
      addCalcRecord(makeRecord('b', 3000));
      addCalcRecord(makeRecord('c', 2000));

      const store = getCalcStore() as { version: number; items: CalcRecord[] };
      expect(store.items.map(r => r.id)).toEqual(['b', 'c', 'a']);
    });

    it('AC-3: 101개 추가 후 items.length가 100이고 가장 오래된 항목이 제거된다', () => {
      for (let i = 1; i <= 100; i++) {
        addCalcRecord(makeRecord(`item-${i}`, i));
      }
      // 101번째 추가 (가장 최신)
      addCalcRecord(makeRecord('newest', 101));

      const store = getCalcStore() as { version: number; items: CalcRecord[] };
      expect(store.items.length).toBe(100);
      // 가장 오래된 item-1(createdAt=1)이 제거됨
      expect(store.items.find(r => r.id === 'item-1')).toBeUndefined();
      // 가장 최신이 첫 번째
      expect(store.items[0].id).toBe('newest');
    });
  });
});
