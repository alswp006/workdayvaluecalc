import { formatKRW } from '@/lib/domain/format';
import { computeHourlyWageKRW, computeDerived } from '@/lib/domain/calc';
import { animateCountUp } from '@/lib/domain/animate';
import { recognizePrice } from '@/lib/domain/scanApi';
import { encodeSharePayload, decodeSharePayload } from '@/lib/domain/sharePayload';
import type { WorkProfile, CalcRecord } from '@/lib/types';

const baseProfile: WorkProfile = {
  payType: 'monthly',
  payAmount: 2600000,
  workHoursPerDay: 8,
  workDaysPerWeek: 5,
  includeLunchBreak: false,
};

describe('packet-0005: 도메인 유틸', () => {
  describe('formatKRW', () => {
    it('AC-1: 60000 → "60,000원" 형태 (쉼표 구분자 + "원" 포함)', () => {
      const result = formatKRW(60000);
      expect(result).toContain('원');
      expect(result).toContain('60,000');
    });

    it('0원도 정상 포맷된다', () => {
      expect(formatKRW(0)).toContain('원');
    });
  });

  describe('computeHourlyWageKRW', () => {
    it('월급 260만원, 주5일, 8시간이면 약 15000원/시간', () => {
      const wage = computeHourlyWageKRW(baseProfile);
      expect(wage).toBeGreaterThanOrEqual(14000);
      expect(wage).toBeLessThanOrEqual(16000);
    });

    it('includeLunchBreak=true이면 유효 근무시간이 1시간 줄어 시급이 높아진다', () => {
      const withBreak = computeHourlyWageKRW({ ...baseProfile, includeLunchBreak: true });
      const withoutBreak = computeHourlyWageKRW(baseProfile);
      expect(withBreak).toBeGreaterThan(withoutBreak);
    });

    it('항상 1 이상의 정수를 반환한다', () => {
      const wage = computeHourlyWageKRW({ ...baseProfile, payAmount: 1, workHoursPerDay: 24 });
      expect(wage).toBeGreaterThanOrEqual(1);
      expect(Number.isInteger(wage)).toBe(true);
    });
  });

  describe('computeDerived', () => {
    it('hourlyWageKRW, minutesNeeded, secondsNeeded를 반환한다', () => {
      const result = computeDerived(60000, baseProfile);
      expect(result).toHaveProperty('hourlyWageKRW');
      expect(result).toHaveProperty('minutesNeeded');
      expect(result).toHaveProperty('secondsNeeded');
      expect(result.secondsNeeded).toBeGreaterThan(result.minutesNeeded);
    });
  });

  describe('animateCountUp', () => {
    beforeEach(() => { vi.useFakeTimers(); });
    afterEach(() => { vi.useRealTimers(); });

    it('durationMs <= 0이면 onUpdate(to) 후 즉시 onDone()이 호출된다', () => {
      const onUpdate = vi.fn();
      const onDone = vi.fn();
      animateCountUp({ from: 0, to: 10, durationMs: 0, onUpdate, onDone });
      expect(onUpdate).toHaveBeenCalledWith(10);
      expect(onDone).toHaveBeenCalledTimes(1);
    });

    it('AC-2: onUpdate가 최소 3회 이상 호출되고 onDone이 정확히 1회 호출된다', () => {
      const onUpdate = vi.fn();
      const onDone = vi.fn();
      animateCountUp({ from: 0, to: 10, durationMs: 200, onUpdate, onDone });
      vi.advanceTimersByTime(400);
      expect(onUpdate.mock.calls.length).toBeGreaterThanOrEqual(3);
      expect(onDone).toHaveBeenCalledTimes(1);
    });

    it('AC-2: 종료 시점에 onUpdate(to)가 호출된 후 onDone이 호출된다', () => {
      const calls: string[] = [];
      animateCountUp({
        from: 0,
        to: 10,
        durationMs: 200,
        onUpdate: (v) => calls.push(`update:${v}`),
        onDone: () => calls.push('done'),
      });
      vi.advanceTimersByTime(400);
      const doneIdx = calls.indexOf('done');
      const lastUpdateIdx = calls.lastIndexOf(`update:10`);
      expect(doneIdx).toBeGreaterThan(-1);
      expect(lastUpdateIdx).toBeGreaterThan(-1);
      expect(lastUpdateIdx).toBeLessThan(doneIdx);
    });
  });

  describe('recognizePrice', () => {
    afterEach(() => { vi.unstubAllGlobals(); });

    it('AC-3: POST /api/scan/extract-price 호출, 반환값에 status와 normalizedAmountKRW가 포함된다', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 200,
        json: async () => ({ detectedAmountKRW: 59000 }),
      }));
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = await recognizePrice(file);

      const fetchMock = vi.mocked(fetch);
      expect(fetchMock).toHaveBeenCalledOnce();
      const [url, init] = fetchMock.mock.calls[0];
      expect(url).toBe('/api/scan/extract-price');
      expect((init as RequestInit).method).toBe('POST');
      expect((init as RequestInit).body).toBeInstanceOf(FormData);

      expect(typeof result.status).toBe('number');
      expect(typeof result.normalizedAmountKRW).toBe('number');
      expect(result.status).toBe(200);
      expect(result.normalizedAmountKRW).toBe(59000);
    });

    it('fetch 실패 시 throw하지 않고 status:0을 반환한다', async () => {
      vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const result = await recognizePrice(file);
      expect(result.status).toBe(0);
      expect(result.normalizedAmountKRW).toBe(0);
    });
  });

  describe('sharePayload', () => {
    const record: CalcRecord = {
      id: 'test-id',
      title: '커피',
      amountKRW: 5000,
      source: 'MANUAL',
      profileSnapshot: baseProfile,
      createdAt: 1234567890,
    };

    it('encode → decode 라운드트립이 동일한 값을 반환한다', () => {
      const encoded = encodeSharePayload(record);
      const decoded = decodeSharePayload(encoded);
      expect(decoded.ok).toBe(true);
      if (decoded.ok) expect(decoded.value).toEqual(record);
    });

    it('잘못된 입력에 decode가 ok:false를 반환한다', () => {
      expect(decodeSharePayload('!!!invalid!!!').ok).toBe(false);
      expect(decodeSharePayload('').ok).toBe(false);
    });
  });
});
