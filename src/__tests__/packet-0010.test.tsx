import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import type { AiNoticeState } from '@/lib/types';

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
  TextField: React.forwardRef(({ label, help, hasError, onChange, value, inputMode }: any, ref: any) =>
    React.createElement('div', null,
      React.createElement('label', null, label),
      React.createElement('input', { ref, value, onChange, 'data-testid': label, inputMode }),
      hasError && help && React.createElement('span', { role: 'alert' }, help),
    )
  ),
  Paragraph: { Text: ({ children }: any) => React.createElement('span', null, children) },
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
  Toast: ({ open, text }: any) =>
    open ? React.createElement('div', { role: 'status' }, text) : null,
}));

// ── recognizePrice mock ───────────────────────────────────────
vi.mock('@/lib/domain/scanApi', () => ({
  recognizePrice: vi.fn(),
}));

// ── generateHapticFeedback mock ───────────────────────────────
vi.mock('@apps-in-toss/web-framework', () => ({
  generateHapticFeedback: vi.fn(),
}));

// ── AppStore mock ─────────────────────────────────────────────
const mockAckScanAiNotice = vi.fn();
const mockAddScanAiCalc = vi.fn();

const mockStore = {
  isBootLoading: false,
  profile: {
    payType: 'monthly' as const,
    payAmount: 3000000,
    workHoursPerDay: 8,
    workDaysPerWeek: 5,
    includeLunchBreak: false,
  },
  aiNoticeState: { version: 1 as const, scanAiNoticeAcknowledged: true } as AiNoticeState,
  calcs: [],
  calcsParseError: false,
  isSavingProfile: false,
  fixedExpenses: [],
  saveProfile: vi.fn(),
  resetCalcs: vi.fn(),
  addManualCalc: vi.fn(),
  ackScanAiNotice: mockAckScanAiNotice,
  addScanAiCalc: mockAddScanAiCalc,
  addFixedExpense: vi.fn(),
};

vi.mock('@/lib/store/AppStore', () => ({
  useAppStore: () => mockStore,
  AppStoreProvider: ({ children }: any) => children,
}));

// ─────────────────────────────────────────────────────────────

import Scan from '@/pages/Scan';
import { recognizePrice } from '@/lib/domain/scanApi';

function renderScan() {
  return render(
    React.createElement(MemoryRouter, null, React.createElement(Scan)),
  );
}

function makeImageFile(name = 'photo.jpg', type = 'image/jpeg') {
  return new File(['img-data'], name, { type });
}

function triggerFileSelect(file: File) {
  const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
  Object.defineProperty(fileInput, 'files', { value: [file], configurable: true });
  fireEvent.change(fileInput);
}

beforeEach(() => {
  vi.clearAllMocks();
  mockStore.aiNoticeState = { version: 1, scanAiNoticeAcknowledged: true };
  vi.mocked(recognizePrice).mockResolvedValue({ status: 200, normalizedAmountKRW: 60000 });
});

describe('packet-0010: 스캔 페이지', () => {
  it('AC-1: AI 고지 미확인 상태에서 스캔 트리거 탭 시 AlertDialog가 표시된다', () => {
    mockStore.aiNoticeState = { version: 1, scanAiNoticeAcknowledged: false };
    renderScan();
    fireEvent.click(screen.getByText('사진으로 인식하기'));
    expect(screen.getByText('이 서비스는 생성형 AI를 활용합니다')).toBeInTheDocument();
  });

  it('AC-1: AlertDialog "확인" 탭 후 ackScanAiNotice가 호출된다', () => {
    mockStore.aiNoticeState = { version: 1, scanAiNoticeAcknowledged: false };
    renderScan();
    fireEvent.click(screen.getByText('사진으로 인식하기'));
    fireEvent.click(screen.getByText('확인'));
    expect(mockAckScanAiNotice).toHaveBeenCalledTimes(1);
  });

  it('AC-2: 파일 선택 후 인식 중이면 "인식 중..."이 표시되고 버튼이 disabled이다', async () => {
    // recognizePrice를 느리게 만들어 로딩 상태 확인
    let resolveRecognize!: (v: any) => void;
    vi.mocked(recognizePrice).mockReturnValue(
      new Promise((resolve) => { resolveRecognize = resolve; }),
    );

    renderScan();
    triggerFileSelect(makeImageFile());

    // 버튼이 "인식 중..." 텍스트로 바뀌고 disabled 상태가 됨
    await waitFor(() => expect(screen.getAllByText('인식 중...').length).toBeGreaterThan(0));
    expect(screen.getAllByText('인식 중...')[0].closest('button')).toBeDisabled();

    // 정리
    resolveRecognize({ status: 200, normalizedAmountKRW: 0 });
  });

  it('AC-2: 인식 중 추가 탭이 발생해도 recognizePrice는 1회만 호출된다', async () => {
    let resolveRecognize!: (v: any) => void;
    vi.mocked(recognizePrice).mockReturnValue(
      new Promise((resolve) => { resolveRecognize = resolve; }),
    );

    renderScan();
    triggerFileSelect(makeImageFile());
    await waitFor(() => expect(screen.getAllByText('인식 중...').length).toBeGreaterThan(0));

    // 다시 트리거해도 call count는 1
    triggerFileSelect(makeImageFile());
    expect(vi.mocked(recognizePrice)).toHaveBeenCalledTimes(1);

    resolveRecognize({ status: 200, normalizedAmountKRW: 0 });
  });

  it('AC-3: 인식 성공 시 "AI가 생성한 결과입니다" 라벨이 표시된다', async () => {
    renderScan();
    triggerFileSelect(makeImageFile());
    await waitFor(() => expect(screen.getByText('AI가 생성한 결과입니다')).toBeInTheDocument());
  });

  it('AC-4: API 실패(status 500) 시 Toast "가격 인식에 실패했어요"가 표시된다', async () => {
    vi.mocked(recognizePrice).mockResolvedValue({ status: 500, normalizedAmountKRW: 0 });
    renderScan();
    triggerFileSelect(makeImageFile());
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('가격 인식에 실패했어요. 직접 입력해 주세요'),
    );
  });

  it('이미지가 아닌 파일 선택 시 Toast "이미지 파일만 선택할 수 있어요"가 표시된다', async () => {
    renderScan();
    triggerFileSelect(new File([''], 'doc.pdf', { type: 'application/pdf' }));
    await waitFor(() =>
      expect(screen.getByRole('status')).toHaveTextContent('이미지 파일만 선택할 수 있어요'),
    );
    expect(vi.mocked(recognizePrice)).not.toHaveBeenCalled();
  });
});
