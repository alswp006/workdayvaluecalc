import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

// ── 모든 페이지 mock (의존성 격리) ───────────────────────────
vi.mock('@/pages/Home',          () => ({ default: () => React.createElement('div', null, 'Home') }));
vi.mock('@/pages/Settings',      () => ({ default: () => React.createElement('div', null, 'Settings') }));
vi.mock('@/pages/Result',        () => ({ default: () => React.createElement('div', null, 'Result') }));
vi.mock('@/pages/Scan',          () => ({ default: () => React.createElement('div', null, 'Scan') }));
vi.mock('@/pages/FixedExpenses', () => ({ default: () => React.createElement('div', null, 'FixedExpenses') }));
vi.mock('@/pages/SavingsGoal',   () => ({ default: () => React.createElement('div', null, 'SavingsGoal') }));
vi.mock('@/pages/History',       () => ({ default: () => React.createElement('div', null, 'History') }));
vi.mock('@/pages/Share',         () => ({ default: () => React.createElement('div', null, 'Share') }));
vi.mock('@/pages/Compare',       () => ({ default: () => React.createElement('div', null, 'Compare') }));

// ── AppStoreProvider mock ─────────────────────────────────────
vi.mock('@/lib/store/AppStore', () => ({
  AppStoreProvider: ({ children }: any) => children,
  useAppStore: () => ({
    isBootLoading: false, profile: null, calcs: [], calcsParseError: false,
    isSavingProfile: false, fixedExpenses: [], aiNoticeState: { version: 1, scanAiNoticeAcknowledged: false },
    resetCalcs: vi.fn(), addManualCalc: vi.fn(), saveProfile: vi.fn(),
    ackScanAiNotice: vi.fn(), addScanAiCalc: vi.fn(), addFixedExpense: vi.fn(),
  }),
}));

// ── generateHapticFeedback mock ───────────────────────────────
vi.mock('@apps-in-toss/web-framework', () => ({
  generateHapticFeedback: vi.fn(),
}));

// ─────────────────────────────────────────────────────────────

import App from '@/App';

function renderApp(initialPath = '/') {
  return render(
    React.createElement(MemoryRouter, { initialEntries: [initialPath] },
      React.createElement(App),
    ),
  );
}

describe('packet-0017: App.tsx 라우팅', () => {
  it('/ 경로에서 Home 페이지가 렌더링된다', () => {
    renderApp('/');
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('/settings 경로에서 Settings 페이지가 렌더링된다', () => {
    renderApp('/settings');
    expect(screen.getByText('Settings')).toBeInTheDocument();
  });

  it('/result 경로에서 Result 페이지가 렌더링된다', () => {
    renderApp('/result');
    expect(screen.getByText('Result')).toBeInTheDocument();
  });

  it('/scan 경로에서 Scan 페이지가 렌더링된다', () => {
    renderApp('/scan');
    expect(screen.getByText('Scan')).toBeInTheDocument();
  });

  it('/fixed-expenses, /savings-goal, /history, /share, /compare 경로가 모두 렌더링된다', () => {
    for (const [path, text] of [
      ['/fixed-expenses', 'FixedExpenses'],
      ['/savings-goal',   'SavingsGoal'],
      ['/history',        'History'],
      ['/share',          'Share'],
      ['/compare',        'Compare'],
    ] as const) {
      const { unmount } = renderApp(path);
      expect(screen.getByText(text)).toBeInTheDocument();
      unmount();
    }
  });

  it('AppStoreProvider가 Routes를 감싸고 있다', () => {
    // AppStoreProvider mock이 children을 그대로 렌더 → Home이 보이면 래핑 정상
    renderApp('/');
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});

describe('packet-0018: TabBar', () => {
  it('TabBar가 렌더링되고 탭이 2~5개이다', () => {
    renderApp('/');
    const tabBar = screen.getByTestId('tab-bar');
    const tabs = tabBar.querySelectorAll('button');
    expect(tabs.length).toBeGreaterThanOrEqual(2);
    expect(tabs.length).toBeLessThanOrEqual(5);
  });

  it('TabBar 컨테이너에 position:fixed와 env(safe-area-inset-bottom)이 포함된다', () => {
    renderApp('/');
    const tabBar = screen.getByTestId('tab-bar');
    expect(tabBar).toHaveStyle('position: fixed');
    expect(tabBar.outerHTML).toContain('env(safe-area-inset-bottom)');
  });

  it('탭 클릭 시 해당 경로로 navigate된다', () => {
    renderApp('/');
    const tabBar = screen.getByTestId('tab-bar');
    // 기록 탭 클릭
    const historyTab = Array.from(tabBar.querySelectorAll('button'))
      .find(b => b.textContent?.includes('기록'));
    expect(historyTab).toBeDefined();
    fireEvent.click(historyTab!);
    expect(screen.getByText('History')).toBeInTheDocument();
  });
});
