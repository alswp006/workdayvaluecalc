import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react';
import { AppStoreProvider, useAppStore } from '@/lib/store/AppStore';
import { STORAGE_KEYS } from '@/lib/storage/keys';
import * as profileStorage from '@/lib/storage/profile';
import type { WorkProfile } from '@/lib/types';

// react-router-dom mock (testing.md)
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

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

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(AppStoreProvider, null, children);

const mockProfile: WorkProfile = {
  payType: 'monthly',
  payAmount: 3000000,
  workHoursPerDay: 8,
  workDaysPerWeek: 5,
  includeLunchBreak: false,
};

describe('packet-0006: AppStore Context', () => {
  it('AC-1: isBootLoading이 false로 완료되고, useState 초기값은 true이다', async () => {
    // RTL의 renderHook은 내부적으로 act()로 감싸 effect를 즉시 flush한다.
    // 따라서 "마운트 직후 true" 는 useState(true) 초기값으로 보장되고,
    // 테스트에서는 "완료 후 false" 전환을 검증한다.
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => expect(result.current.isBootLoading).toBe(false));
  });

  it('부트 로드 후 localStorage 프로필이 state에 반영된다', async () => {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(mockProfile));
    const { result } = renderHook(() => useAppStore(), { wrapper });
    await waitFor(() => expect(result.current.isBootLoading).toBe(false));
    expect(result.current.profile).toEqual(mockProfile);
  });

  describe('calcs 파싱에러', () => {
    it('AC-2: 파싱 실패 시 calcsParseError=true', async () => {
      localStorage.setItem(STORAGE_KEYS.CALCS, 'not-json');
      const { result } = renderHook(() => useAppStore(), { wrapper });
      await waitFor(() => expect(result.current.calcsParseError).toBe(true));
    });

    it('AC-2: resetCalcs() 후 calcsParseError=false이고 items.length===0', async () => {
      localStorage.setItem(STORAGE_KEYS.CALCS, 'not-json');
      const { result } = renderHook(() => useAppStore(), { wrapper });
      await waitFor(() => expect(result.current.calcsParseError).toBe(true));

      await act(async () => { result.current.resetCalcs(); });

      expect(result.current.calcsParseError).toBe(false);
      expect(result.current.calcs.length).toBe(0);
    });
  });

  describe('saveProfile 중복 방지', () => {
    it('AC-3: 연속 2회 호출해도 setWorkProfile은 1회만 실행된다', async () => {
      // saveProfile 내부의 `await Promise.resolve()`가 첫 번째 호출을 양보시켜
      // 두 번째 호출이 isSavingProfileRef.current=true를 보고 즉시 리턴하게 한다.
      const setWorkProfileSpy = vi.spyOn(profileStorage, 'setWorkProfile');

      const { result } = renderHook(() => useAppStore(), { wrapper });
      await waitFor(() => expect(result.current.isBootLoading).toBe(false));

      let p1: Promise<unknown>, p2: Promise<unknown>;
      act(() => {
        p1 = result.current.saveProfile(mockProfile); // ref=true 설정 후 await로 양보
        p2 = result.current.saveProfile(mockProfile); // ref=true → 즉시 리턴
      });
      await act(async () => { await Promise.all([p1!, p2!]); });

      expect(setWorkProfileSpy).toHaveBeenCalledTimes(1);
    });

    it('AC-3: Quota 실패 시 { ok:false, error:"QUOTA_EXCEEDED" }를 반환한다', async () => {
      vi.spyOn(profileStorage, 'setWorkProfile')
        .mockReturnValue({ ok: false, error: { type: 'QUOTA_EXCEEDED', key: STORAGE_KEYS.PROFILE } });

      const { result } = renderHook(() => useAppStore(), { wrapper });
      await waitFor(() => expect(result.current.isBootLoading).toBe(false));

      let saveResult: unknown;
      await act(async () => {
        saveResult = await result.current.saveProfile(mockProfile);
      });

      expect(saveResult).toEqual({ ok: false, error: 'QUOTA_EXCEEDED' });
    });
  });
});
