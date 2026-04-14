import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── react-router-dom mock ─────────────────────────────────────
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

// ── TDS mock ──────────────────────────────────────────────────
vi.mock('@toss/tds-mobile', () => ({
  Button: ({ children, onClick, disabled }: any) =>
    React.createElement('button', { onClick, disabled }, children),
  TextField: React.forwardRef(({ label, help, hasError, onChange, value, type, inputMode }: any, ref: any) =>
    React.createElement('div', null,
      React.createElement('label', null, label),
      React.createElement('input', { ref, value, onChange, 'data-testid': label, type, inputMode }),
      hasError && help && React.createElement('span', { role: 'alert' }, help),
    )
  ),
  Switch: ({ checked, onChange }: any) =>
    React.createElement('input', { type: 'checkbox', checked, onChange, 'data-testid': 'switch' }),
  Paragraph: {
    Text: ({ children }: any) => React.createElement('span', null, children),
  },
  Spacing: () => React.createElement('div'),
  Top: Object.assign(
    ({ children }: any) => React.createElement('nav', null, children),
    { TitleParagraph: ({ children }: any) => React.createElement('h1', null, children) },
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

// ── generateHapticFeedback mock ───────────────────────────────
vi.mock('@apps-in-toss/web-framework', () => ({
  generateHapticFeedback: vi.fn(),
}));

// ── AppStore mock ─────────────────────────────────────────────
const mockSaveProfile = vi.fn();

const mockStore = {
  isBootLoading: false,
  profile: null as any,
  isSavingProfile: false,
  calcs: [],
  calcsParseError: false,
  fixedExpenses: [],
  aiNoticeState: { version: 1 as const, scanAiNoticeAcknowledged: false },
  saveProfile: mockSaveProfile,
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

import Settings from '@/pages/Settings';

function renderSettings() {
  return render(
    React.createElement(MemoryRouter, null, React.createElement(Settings)),
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mockStore.isBootLoading = false;
  mockStore.profile = null;
  mockStore.isSavingProfile = false;
  mockSaveProfile.mockResolvedValue({ ok: true });
});

describe('packet-0008: 설정 페이지', () => {
  it('AC-1: isBootLoading=true이면 "불러오는 중..."이 표시된다', () => {
    mockStore.isBootLoading = true;
    renderSettings();
    expect(screen.getByText('불러오는 중...')).toBeInTheDocument();
  });

  it('AC-3: payAmount=0으로 저장 시 에러 메시지가 표시되고 saveProfile이 호출되지 않는다', async () => {
    renderSettings();
    // 급여 입력 필드를 0으로 설정 (기본값 빈 string → 0)
    const payInput = screen.getByTestId('급여 금액(원)');
    fireEvent.change(payInput, { target: { value: '0' } });
    fireEvent.click(screen.getByText('저장'));
    expect(screen.getByText('급여를 1원 이상 입력해주세요')).toBeInTheDocument();
    expect(mockSaveProfile).not.toHaveBeenCalled();
  });

  it('AC-4: workHoursPerDay=0으로 저장 시 에러 메시지가 표시되고 navigate(-1)가 호출되지 않는다', async () => {
    renderSettings();
    // 급여는 유효하게, 근무시간은 0으로
    fireEvent.change(screen.getByTestId('급여 금액(원)'), { target: { value: '3000000' } });
    fireEvent.change(screen.getByTestId('하루 근무시간'), { target: { value: '0' } });
    fireEvent.click(screen.getByText('저장'));
    expect(screen.getByText('하루 근무시간은 1시간 이상이어야 해요')).toBeInTheDocument();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it('AC-2: 유효 입력으로 저장 성공 시 Toast "저장했어요"가 표시되고 navigate(-1)가 호출된다', async () => {
    mockSaveProfile.mockResolvedValue({ ok: true });
    renderSettings();
    fireEvent.change(screen.getByTestId('급여 금액(원)'), { target: { value: '3000000' } });
    fireEvent.change(screen.getByTestId('하루 근무시간'), { target: { value: '8' } });

    await act(async () => { fireEvent.click(screen.getByText('저장')); });

    expect(screen.getByRole('status')).toHaveTextContent('저장했어요');
    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('AC-5: Quota 실패 시 AlertDialog 제목 "저장 실패"가 표시된다', async () => {
    mockSaveProfile.mockResolvedValue({ ok: false, error: 'QUOTA_EXCEEDED' });
    renderSettings();
    fireEvent.change(screen.getByTestId('급여 금액(원)'), { target: { value: '3000000' } });
    fireEvent.change(screen.getByTestId('하루 근무시간'), { target: { value: '8' } });
    fireEvent.click(screen.getByText('저장'));
    await waitFor(() => expect(screen.getByRole('alertdialog')).toBeInTheDocument());
    expect(screen.getByText('저장 실패')).toBeInTheDocument();
    expect(screen.getByText('저장 공간이 부족해 저장할 수 없어요')).toBeInTheDocument();
  });

  it('isSavingProfile=true이면 저장 버튼이 disabled이다', () => {
    mockStore.isSavingProfile = true;
    renderSettings();
    expect(screen.getByText('저장 중...')).toBeDisabled();
  });
});
