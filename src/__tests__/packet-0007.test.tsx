import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── react-router-dom mock ─────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// ── TDS mock ──────────────────────────────────────────────────
vi.mock('@toss/tds-mobile', () => ({
  Button: ({ children, onClick, disabled, ...props }: any) =>
    React.createElement('button', { onClick, disabled, ...props }, children),
  TextField: React.forwardRef(({ label, help, hasError, onChange, value, ...props }: any, ref: any) =>
    React.createElement('div', null,
      React.createElement('label', null, label),
      React.createElement('input', { ref, value, onChange, 'data-testid': label, ...props }),
      hasError && help && React.createElement('span', { role: 'alert' }, help),
    )
  ),
  Paragraph: {
    Text: ({ children, ...props }: any) => React.createElement('span', props, children),
  },
  Spacing: () => React.createElement('div'),
  Top: Object.assign(
    ({ children }: any) => React.createElement('nav', null, children),
    { TitleParagraph: ({ children }: any) => React.createElement('h1', null, children) },
  ),
  Chip: ({ label, onClick }: any) => React.createElement('button', { onClick }, label),
  ListRow: Object.assign(
    ({ children, onClick }: any) => React.createElement('div', { onClick, role: 'listitem' }, children),
    {
      Texts: ({ top, bottom }: any) =>
        React.createElement(React.Fragment, null,
          React.createElement('span', null, top),
          React.createElement('span', null, bottom),
        ),
    },
  ),
  AlertDialog: Object.assign(
    ({ open, title, description, alertButton, onClose }: any) =>
      open
        ? React.createElement('div', { role: 'alertdialog' },
            title && React.createElement('strong', null, title),
            description && React.createElement('p', null, description),
            alertButton,
            React.createElement('button', { onClick: onClose }, '닫기'),
          )
        : null,
    { AlertButton: ({ children, onClick }: any) => React.createElement('button', { onClick }, children) },
  ),
  Toast: ({ open, text }: any) => open ? React.createElement('div', { role: 'status' }, text) : null,
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
const mockResetCalcs = vi.fn();
const mockAddManualCalc = vi.fn();

const mockStore = {
  isBootLoading: false,
  profile: {
    payType: 'monthly' as const,
    payAmount: 3000000,
    workHoursPerDay: 8,
    workDaysPerWeek: 5,
    includeLunchBreak: false,
  },
  calcs: [],
  calcsParseError: false,
  isSavingProfile: false,
  fixedExpenses: [],
  aiNoticeState: { version: 1 as const, scanAiNoticeAcknowledged: false },
  resetCalcs: mockResetCalcs,
  addManualCalc: mockAddManualCalc,
  saveProfile: vi.fn(),
  ackScanAiNotice: vi.fn(),
  addScanAiCalc: vi.fn(),
  addFixedExpense: vi.fn(),
};

vi.mock('@/lib/store/AppStore', () => ({
  useAppStore: () => mockStore,
  AppStoreProvider: ({ children }: any) => children,
}));

// ─────────────────────────────────────────────────────────────

import Home from '@/pages/Home';

function renderHome() {
  return render(
    React.createElement(MemoryRouter, null, React.createElement(Home)),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockStore.isBootLoading = false;
  mockStore.profile = {
    payType: 'monthly',
    payAmount: 3000000,
    workHoursPerDay: 8,
    workDaysPerWeek: 5,
    includeLunchBreak: false,
  };
  mockStore.calcs = [];
  mockStore.calcsParseError = false;
});

describe('packet-0007: 홈 페이지', () => {
  it('AC-1: isBootLoading=true이면 "불러오는 중..."이 표시된다', () => {
    mockStore.isBootLoading = true;
    renderHome();
    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
  });

  it('AC-2: 금액 미입력 시 "노동값 계산하기" 탭하면 에러 메시지가 표시되고 navigate가 호출되지 않는다', () => {
    renderHome();
    fireEvent.click(screen.getByText('노동값 계산하기'));
    expect(screen.getByText('금액을 1원 이상 입력해주세요')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalledWith(expect.stringContaining('/result'), expect.anything());
  });

  it('AC-2: 금액 0 입력 시도 에러', () => {
    renderHome();
    fireEvent.change(screen.getByTestId('금액(원)'), { target: { value: '0' } });
    fireEvent.click(screen.getByText('노동값 계산하기'));
    expect(screen.getByText('금액을 1원 이상 입력해주세요')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('AC-3: 프로필 없으면 온보딩 화면과 시작 버튼이 보인다', () => {
    mockStore.profile = null as any;
    renderHome();
    expect(screen.getByText('시작하기 — 급여 설정')).toBeInTheDocument();
  });

  it('AC-3: 프로필 없을 때 "시작하기" 탭 시 navigate("/settings")가 호출된다', () => {
    mockStore.profile = null as any;
    renderHome();
    fireEvent.click(screen.getByText('시작하기 — 급여 설정'));
    expect(mockNavigate).toHaveBeenCalledWith('/settings');
  });

  it('AC-5: calcsParseError=true이면 AlertDialog에 초기화 안내가 표시된다', () => {
    mockStore.calcsParseError = true;
    renderHome();
    expect(screen.getByText('저장된 데이터를 읽을 수 없어요. 초기화할까요?')).toBeInTheDocument();
  });

  it('AC-5: "초기화" 탭 시 resetCalcs가 호출된다', () => {
    mockStore.calcsParseError = true;
    renderHome();
    fireEvent.click(screen.getByText('초기화'));
    expect(mockResetCalcs).toHaveBeenCalledTimes(1);
  });

  it('유효한 금액 입력 후 "노동값 계산하기" 탭 시 addManualCalc 후 /result로 navigate된다', () => {
    mockAddManualCalc.mockReturnValue('test-calc-id');
    renderHome();
    fireEvent.change(screen.getByTestId('금액(원)'), { target: { value: '60000' } });
    fireEvent.click(screen.getByText('노동값 계산하기'));
    expect(mockAddManualCalc).toHaveBeenCalledWith(expect.objectContaining({ amountKRW: 60000 }));
    expect(mockNavigate).toHaveBeenCalledWith('/result', expect.objectContaining({ state: expect.objectContaining({ calcId: expect.any(String) }) }));
  });
});
