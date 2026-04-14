import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import type { AiNoticeState, CalcRecord, FixedExpense, WorkProfile } from '@/lib/types';
import { getWorkProfile, setWorkProfile } from '@/lib/storage/profile';
import { addCalcRecord, getCalcStore, resetCalcStore } from '@/lib/storage/calcs';
import { addFixedExpense as addFixedExpenseStorage, getFixedExpenseStore } from '@/lib/storage/fixedExpenses';
import { ackScanAiNotice as ackScanAiNoticeStorage, getAiNoticeState } from '@/lib/storage/aiNotice';

// ============================================================
// 타입
// ============================================================

interface SaveProfileResult {
  ok: boolean;
  error?: string;
}

interface AppStoreValue {
  // 상태
  isBootLoading: boolean;
  profile: WorkProfile | null;
  calcs: CalcRecord[];
  calcsParseError: boolean;
  isSavingProfile: boolean;
  fixedExpenses: FixedExpense[];
  aiNoticeState: AiNoticeState;
  // 액션
  resetCalcs: () => void;
  addManualCalc: (args: { title: string; amountKRW: number }) => string | null;
  saveProfile: (next: WorkProfile) => Promise<SaveProfileResult>;
  ackScanAiNotice: () => void;
  addScanAiCalc: (args: { title: string; amountKRW: number; aiMeta?: CalcRecord['aiMeta'] }) => void;
  addFixedExpense: (args: { name: string; monthlyAmountKRW: number }) => void;
}

// ============================================================
// Context
// ============================================================

const AppStoreContext = createContext<AppStoreValue | null>(null);

const DEFAULT_AI_NOTICE: AiNoticeState = { version: 1, scanAiNoticeAcknowledged: false };

// ============================================================
// Provider
// ============================================================

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [profile, setProfile] = useState<WorkProfile | null>(null);
  const [calcs, setCalcs] = useState<CalcRecord[]>([]);
  const [calcsParseError, setCalcsParseError] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [fixedExpenses, setFixedExpenses] = useState<FixedExpense[]>([]);
  const [aiNoticeState, setAiNoticeState] = useState<AiNoticeState>(DEFAULT_AI_NOTICE);

  // useRef로 동기 가드 — React 상태 업데이트 비동기성을 우회
  const isSavingProfileRef = useRef(false);

  // 마운트 시 1회 부트 로드
  useEffect(() => {
    const loadedProfile = getWorkProfile();
    setProfile(loadedProfile);

    const calcResult = getCalcStore();
    if ('ok' in calcResult) {
      setCalcsParseError(true);
    } else {
      setCalcs(calcResult.items);
    }

    const feResult = getFixedExpenseStore();
    if (!('ok' in feResult)) {
      setFixedExpenses(feResult.items);
    }

    setAiNoticeState(getAiNoticeState());
    setIsBootLoading(false);
  }, []);

  // ============================================================
  // 액션
  // ============================================================

  const resetCalcs = () => {
    resetCalcStore();
    setCalcs([]);
    setCalcsParseError(false);
  };

  const addManualCalc = ({ title, amountKRW }: { title: string; amountKRW: number }): string | null => {
    if (!profile) return null;
    const record: CalcRecord = {
      id: `calc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      amountKRW,
      source: 'MANUAL',
      profileSnapshot: profile,
      createdAt: Date.now(),
    };
    addCalcRecord(record);
    setCalcs(prev => [record, ...prev].sort((a, b) => b.createdAt - a.createdAt).slice(0, 100));
    return record.id;
  };

  const saveProfile = async (next: WorkProfile): Promise<SaveProfileResult> => {
    if (isSavingProfileRef.current) return { ok: false, error: 'SAVING_IN_PROGRESS' };

    isSavingProfileRef.current = true;
    setIsSavingProfile(true);

    // 마이크로태스크 큐 양보 — 연속 호출 시 두 번째 호출이 ref 가드를 볼 수 있게 함
    await Promise.resolve();

    try {
      const result = setWorkProfile(next);
      if (result.ok) {
        setProfile(next);
        return { ok: true };
      }
      return { ok: false, error: result.error.type };
    } finally {
      isSavingProfileRef.current = false;
      setIsSavingProfile(false);
    }
  };

  const ackScanAiNotice = () => {
    ackScanAiNoticeStorage();
    setAiNoticeState(getAiNoticeState());
  };

  const addScanAiCalc = ({
    title,
    amountKRW,
    aiMeta,
  }: {
    title: string;
    amountKRW: number;
    aiMeta?: CalcRecord['aiMeta'];
  }) => {
    if (!profile) return;
    const record: CalcRecord = {
      id: `calc-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      title,
      amountKRW,
      source: 'SCAN_AI',
      aiMeta,
      profileSnapshot: profile,
      createdAt: Date.now(),
    };
    addCalcRecord(record);
    setCalcs(prev => [record, ...prev].sort((a, b) => b.createdAt - a.createdAt).slice(0, 100));
  };

  const addFixedExpense = ({ name, monthlyAmountKRW }: { name: string; monthlyAmountKRW: number }) => {
    const result = addFixedExpenseStorage({ name, monthlyAmountKRW });
    if (result.ok) {
      const feResult = getFixedExpenseStore();
      if (!('ok' in feResult)) setFixedExpenses(feResult.items);
    }
  };

  return (
    <AppStoreContext.Provider
      value={{
        isBootLoading,
        profile,
        calcs,
        calcsParseError,
        isSavingProfile,
        fixedExpenses,
        aiNoticeState,
        resetCalcs,
        addManualCalc,
        saveProfile,
        ackScanAiNotice,
        addScanAiCalc,
        addFixedExpense,
      }}
    >
      {children}
    </AppStoreContext.Provider>
  );
}

// ============================================================
// Hook
// ============================================================

export function useAppStore(): AppStoreValue {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error('useAppStore must be used within AppStoreProvider');
  return ctx;
}
