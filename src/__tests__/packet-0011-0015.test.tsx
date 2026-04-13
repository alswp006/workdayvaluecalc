import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

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

// ── AppStore mock ─────────────────────────────────────────────
vi.mock('@/lib/store/AppStore', () => ({
  useAppStore: () => ({
    isBootLoading: false, profile: null, calcs: [], calcsParseError: false,
    isSavingProfile: false, fixedExpenses: [], aiNoticeState: { version: 1, scanAiNoticeAcknowledged: false },
    resetCalcs: vi.fn(), addManualCalc: vi.fn(() => 'test-id'), saveProfile: vi.fn(),
    ackScanAiNotice: vi.fn(), addScanAiCalc: vi.fn(), addFixedExpense: vi.fn(),
  }),
  AppStoreProvider: ({ children }: any) => children,
}));

// ── localStorage mock (SavingsGoal uses getSavingsGoalState) ──
class LocalStorageMock implements Storage {
  private store: Record<string, string> = {};
  get length() { return Object.keys(this.store).length; }
  key(i: number) { return Object.keys(this.store)[i] ?? null; }
  getItem(k: string) { return this.store[k] ?? null; }
  setItem(k: string, v: string) { this.store[k] = v; }
  removeItem(k: string) { delete this.store[k]; }
  clear() { this.store = {}; }
}
beforeEach(() => { vi.stubGlobal('localStorage', new LocalStorageMock()); });
afterEach(() => { vi.unstubAllGlobals(); });

vi.mock('@apps-in-toss/web-framework', () => ({ generateHapticFeedback: vi.fn() }));

// ── TDS mock ──────────────────────────────────────────────────
vi.mock('@toss/tds-mobile', () => ({
  Button: ({ children, onClick, disabled }: any) =>
    React.createElement('button', { onClick, disabled }, children),
  Paragraph: { Text: ({ children }: any) => React.createElement('span', null, children) },
  Spacing: () => React.createElement('div'),
  Top: Object.assign(
    ({ children }: any) => React.createElement('nav', null, children),
    { TitleParagraph: ({ children }: any) => React.createElement('h1', null, children) },
  ),
  ListRow: Object.assign(
    ({ children, onClick }: any) => React.createElement('div', { onClick, role: 'listitem' }, children),
    { Texts: ({ top, bottom }: any) => React.createElement(React.Fragment, null, React.createElement('span', null, top), React.createElement('span', null, bottom)) },
  ),
  TextField: React.forwardRef(({ label, onChange, value }: any, ref: any) =>
    React.createElement('input', { ref, 'data-testid': label, onChange, value }),
  ),
  Toast: ({ open, text }: any) => open ? React.createElement('div', { role: 'status' }, text) : null,
  AlertDialog: Object.assign(
    ({ open, title, description, alertButton }: any) =>
      open ? React.createElement('div', { role: 'alertdialog' }, title, description, alertButton) : null,
    { AlertButton: ({ children, onClick }: any) => React.createElement('button', { onClick }, children) },
  ),
  BottomSheet: Object.assign(
    ({ children, open }: any) => open ? React.createElement('div', { role: 'dialog' }, children) : null,
    { Header: ({ children }: any) => React.createElement('div', null, children) },
  ),
}));

// ─────────────────────────────────────────────────────────────

import FixedExpenses from '@/pages/FixedExpenses';
import SavingsGoal from '@/pages/SavingsGoal';
import History from '@/pages/History';
import Share from '@/pages/Share';
import Compare from '@/pages/Compare';

function renderPage(Page: React.ComponentType) {
  return render(React.createElement(MemoryRouter, null, React.createElement(Page)));
}

beforeEach(() => {
  vi.clearAllMocks();
  mockLocation.state = null;
});

// ── 0011: 고정지출 ────────────────────────────────────────────
describe('packet-0011: 고정지출 페이지 (/fixed-expenses)', () => {
  it('Top 타이틀이 렌더링된다', () => {
    renderPage(FixedExpenses);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('빈 상태에서 안내 문구와 추가 버튼이 표시된다', () => {
    renderPage(FixedExpenses);
    expect(screen.getByText('고정지출을 추가해보세요')).toBeInTheDocument();
    expect(screen.getByText('+ 고정지출 추가')).toBeInTheDocument();
  });

  it('추가 버튼 탭 시 BottomSheet가 열린다', () => {
    renderPage(FixedExpenses);
    fireEvent.click(screen.getByText('+ 고정지출 추가'));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });
});

// ── 0012: 목표저축 ────────────────────────────────────────────
describe('packet-0012: 목표저축 페이지 (/savings-goal)', () => {
  it('Top 타이틀이 렌더링된다', () => {
    renderPage(SavingsGoal);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('목표 금액과 저축 금액 입력 필드가 표시된다', () => {
    renderPage(SavingsGoal);
    expect(screen.getByText('목표 금액')).toBeInTheDocument();
    expect(screen.getByText('매달 저축 금액')).toBeInTheDocument();
  });

  it('계산하기 버튼이 표시된다', () => {
    renderPage(SavingsGoal);
    expect(screen.getByText('계산하기')).toBeInTheDocument();
  });
});

// ── 0013: 기록 ────────────────────────────────────────────────
describe('packet-0013: 기록 페이지 (/history)', () => {
  it('Top 타이틀이 렌더링된다', () => {
    renderPage(History);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('빈 상태에서 안내 문구와 홈으로 버튼이 표시된다', () => {
    renderPage(History);
    expect(screen.getByText('아직 계산 기록이 없어요')).toBeInTheDocument();
    expect(screen.getByText('홈으로')).toBeInTheDocument();
  });

  it('"홈으로" 탭 시 navigate("/")가 호출된다', () => {
    renderPage(History);
    fireEvent.click(screen.getByText('홈으로'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });
});

// ── 0014: 공유 ────────────────────────────────────────────────
describe('packet-0014: 공유 스텁 (/share)', () => {
  it('Top 타이틀이 렌더링된다', () => {
    renderPage(Share);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('state 없을 때 "공유할 결과가 없어요"가 표시된다', () => {
    mockLocation.state = null;
    renderPage(Share);
    expect(screen.getByText('공유할 결과가 없어요')).toBeInTheDocument();
  });

  it('state 없을 때 "홈으로" 탭 시 navigate("/")가 호출된다', () => {
    mockLocation.state = null;
    renderPage(Share);
    fireEvent.click(screen.getByText('홈으로'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('state.calcId 있을 때 "준비 중이에요"가 표시된다', () => {
    mockLocation.state = { calcId: 'abc' };
    renderPage(Share);
    expect(screen.getByText('준비 중이에요')).toBeInTheDocument();
  });
});

// ── 0015: 비교 ────────────────────────────────────────────────
describe('packet-0015: 비교 스텁 (/compare)', () => {
  it('Top 타이틀이 렌더링된다', () => {
    renderPage(Compare);
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });

  it('state 없을 때 "비교할 기준 결과가 없어요"가 표시된다', () => {
    mockLocation.state = null;
    renderPage(Compare);
    expect(screen.getByText('비교할 기준 결과가 없어요')).toBeInTheDocument();
  });

  it('state 없을 때 "홈으로" 탭 시 navigate("/")가 호출된다', () => {
    mockLocation.state = null;
    renderPage(Compare);
    fireEvent.click(screen.getByText('홈으로'));
    expect(mockNavigate).toHaveBeenCalledWith('/');
  });

  it('state.baseCalcId 있을 때 "준비 중이에요"가 표시된다', () => {
    mockLocation.state = { baseCalcId: 'xyz' };
    renderPage(Compare);
    expect(screen.getByText('준비 중이에요')).toBeInTheDocument();
  });
});
