import { readJson, writeJsonWithRollback } from '@/lib/storage/io';
import { STORAGE_KEYS } from '@/lib/storage/keys';

// jsdom의 localStorage는 .clear()를 지원하지 않는 경우가 있어
// vi.stubGlobal로 완전한 Storage 구현을 주입한다
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

describe('packet-0002: localStorage 안전 IO 유틸', () => {
  describe('readJson', () => {
    it('AC-1: key가 없으면 { ok:true, value:null }을 반환한다', () => {
      const result = readJson('nonexistent-key');
      expect(result).toEqual({ ok: true, value: null });
    });

    it('유효한 JSON이면 { ok:true, value }를 반환한다', () => {
      localStorage.setItem('test-key', JSON.stringify({ x: 1 }));
      const result = readJson<{ x: number }>('test-key');
      expect(result).toEqual({ ok: true, value: { x: 1 } });
    });

    it('AC-2: JSON 파싱 실패 시 { ok:false, error:{ type:"PARSE_ERROR", key } }를 반환한다', () => {
      localStorage.setItem('bad-key', 'not-json');
      const result = readJson('bad-key');
      expect(result).toEqual({ ok: false, error: { type: 'PARSE_ERROR', key: 'bad-key' } });
    });
  });

  describe('writeJsonWithRollback', () => {
    it('성공 시 { ok:true }를 반환하고 localStorage에 저장된다', () => {
      const result = writeJsonWithRollback('test-key', { hello: 'world' });
      expect(result).toEqual({ ok: true });
      expect(JSON.parse(localStorage.getItem('test-key')!)).toEqual({ hello: 'world' });
    });

    it('AC-3: setItem이 throw하면 { ok:false, error:QUOTA_EXCEEDED }를 반환하고 이전 값이 유지된다', () => {
      localStorage.setItem('existing-key', '"original"');

      vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError');
      });

      const result = writeJsonWithRollback('existing-key', 'new-value');

      expect(result).toEqual({ ok: false, error: { type: 'QUOTA_EXCEEDED', key: 'existing-key' } });
      expect(localStorage.getItem('existing-key')).toBe('"original"');
    });
  });

  describe('STORAGE_KEYS', () => {
    it('필수 키 상수가 모두 정의되어 있다', () => {
      expect(STORAGE_KEYS.PROFILE).toBeDefined();
      expect(STORAGE_KEYS.CALCS).toBeDefined();
      expect(STORAGE_KEYS.FIXED_EXPENSES).toBeDefined();
      expect(STORAGE_KEYS.SAVINGS_GOAL).toBeDefined();
      expect(STORAGE_KEYS.AI_NOTICE).toBeDefined();
      expect(STORAGE_KEYS.POLICY).toBeDefined();
    });
  });
});
