import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { CalcRecord } from '@/lib/types';

// ── react-router-dom mock ─────────────────────────────────────
const mockNavigate = vi.fn();
const mockLocation = { state: null as any };

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  };
});

// ── TDS mock ──────────────────────────────────────────────────
vi.mock('@toss/tds-mobile', () => ({
  Button: ({ children, onClick }: any) =>
    React.createElement('button', { onClick }, children),
  Paragraph: {
    Text: ({ children }: any) => React.createElement('span', null, children),
  },
  Spacing: () => React.createElement('div'),
  Top: Object.assign(
    ({ children }: any) => React.createElement('nav', null, children),
    { TitleParagraph: ({ children }: any) => React.createElement('h1', null, children) },
  ),
  Toast: ({ open, text }: any) =>
    open ? React.createElement('div', { role: 'status' }, text) : null,
  Chip: ({ label, onClick }: any) =>
    React.createElement('button', { onClick }, label),
}));

// ── TossRewardAd mock ─────────────────────────────────────────
// 기본: children 숨김(잠금 상태). onAdFailed 호출 가능한 버튼 노출.
vi.mock('@/components/TossRewardAd', () => ({
  TossRewardAd: ({ children, onAdFailed }: any) =>
    React.createElement('div', { 'data-testid': 'reward-ad-gate' },
      React.createElement('button', {
        'data-testid': 'simulate-ad-fail',
        onClick: () => onAdFailed?.(),
      }, '광고 실패 시뮬'),
    ),
}));

// ── AdSlot mock ───────────────────────────────────────────────
vi.mock('@/components/AdSlot', () => ({
  AdSlot: () => React.createElement('div', { 'data-testid': 'ad-slot' }),
}));

// ── generateHapticFeedback mock ───────────────────────────────
vi.mock('@apps-in-toss/web-framework', () => ({
  generateHapticFeedback: vi.fn(),
}));

// ── AppStore mock ─────────────────────────────────────────────
const mockCalc: CalcRecord = {
  id: 'test-id',
  title: '에어팟',
  amountKRW: 60000,
  source: 'MANUAL',
  profileSnapshot: {
    payType: 'monthly',
    payAmount: 3000000,
    workHoursPerDay: 8,
    workDaysPerWeek: 5,
    includeLunchBreak: false,
  },
  createdAt: Date.now(),
};

const mockStore = {
  isBootLoading: false,
  calcs: [mockCalc] as CalcRecord[],
  profile: mockCalc.profileSnapshot,
  calcsParseError: false,
  isSavingProfile: false,
  fixedExpenses: [],
  aiNoticeState: { version: 1 as const, scanAiNoticeAcknowledged: false },
  saveProfile: vi.fn(),
  resetCalcs: vi.fn(),
  addManualCalc: vi.fn(),
  ackScanAiNotice: vi.fn(),
  addScanAiCalc: vi.fn(),
  addFixedExpense: vi.fn(),
};

vi.mock('@/lib/store/AppStore', () => ({
  useAppStore: () => mockStore,
  AppStoreProvider: ({ children }: any) => children,
}));

// ─────────────────────────────────────────────────────────────

import Result from '@/pages/Result';

function renderResult() {
  return render(
    React.createElement(MemoryRouter, null, React.createElement(Result)),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockStore.isBootLoading = false;
  mockStore.calcs = [mockCalc];
  mockLocation.state = { calcId: 'test-id' };
});

describe('packet-0009: 결과 페이지', () => {
  it('AC-1: isBootLoading=true이면 "불러오는 중..."이 표시된다', () => {
    mockStore.isBootLoading = true;
    renderResult();
    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
  });

  it('AC-2: location.state가 없으면 "결과를 찾을 수 없어요"가 표시된다', () => {
    mockLocation.state = null;
    renderResult();
    expect(screen.getByText('결과를 찾을 수 없어요')).toBeInTheDocument();
  });

  it('AC-2: calcId에 해당하는 기록이 없으면 "결과를 찾을 수 없어요"가 표시된다', () => {
    mockLocation.state = { calcId: 'nonexistent-id' };
    renderResult();
    expect(screen.getByText('결과를 찾을 수 없어요')).toBeInTheDocument();
  });

  it('AC-2: "홈으로" 탭 시 navigate("/")가 호출된다', () => {
    mockLocation.state = null;
    renderResult();
    fireEvent.click(screen.getByText('홈으로'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('AC-3: 유효 calcId로 진입 시 formatKRW 금액과 "노동값" 요약 문구가 표시된다', () => {
    renderResult();
    expect(screen.getByText(/60,000원/)).toBeInTheDocument();
    expect(screen.getByText(/노동값/)).toBeInTheDocument();
  });

  it('AC-5: 광고 시청 완료 전에는 상세 섹션 DOM이 존재하지 않는다', () => {
    renderResult();
    expect(screen.queryByTestId('detail-section')).not.toBeInTheDocument();
  });

  it('AC-4: 광고 실패 시 Toast "광고를 불러오지 못했어요"가 표시되고 기본 결과가 유지된다', () => {
    renderResult();
    // 기본 결과 확인
    expect(screen.getByText(/60,000원/)).toBeInTheDocument();

    // 광고 실패 트리거
    act(() => { fireEvent.click(screen.getByTestId('simulate-ad-fail')); });

    expect(screen.getByRole('status')).toHaveTextContent('광고를 불러오지 못했어요');
    // 기본 결과 여전히 유지
    expect(screen.getByText(/60,000원/)).toBeInTheDocument();
  });
});
