import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { AppStoreProvider } from '@/lib/store/AppStore';

import Home          from './pages/Home';
import Settings      from './pages/Settings';
import Result        from './pages/Result';
import Scan          from './pages/Scan';
import FixedExpenses from './pages/FixedExpenses';
import SavingsGoal   from './pages/SavingsGoal';
import History       from './pages/History';
import Share         from './pages/Share';
import Compare       from './pages/Compare';

// ── TabBar ────────────────────────────────────────────────────
// TabBar는 TDS에 없으므로 기본 HTML + CSS 변수로 구현
const TABS = [
  { icon: '🏠', label: '홈',  path: '/' },
  { icon: '📋', label: '기록', path: '/history' },
  { icon: '⚙️', label: '설정', path: '/settings' },
] as const;

function TabBar() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div
      data-testid="tab-bar"
      style={{
        position: 'fixed',
        bottom: 0,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 600,
        display: 'flex',
        background: 'var(--tds-color-background-elevated)',
        borderTop: '1px solid var(--tds-color-border)',
        paddingBottom: 'calc(8px + env(safe-area-inset-bottom))',
      }}
    >
      {TABS.map(({ icon, label, path }) => {
        const isActive = location.pathname === path;
        return (
          <button
            key={path}
            onClick={() => {
              generateHapticFeedback({ type: 'tickWeak' });
              navigate(path);
            }}
            style={{
              flex: 1,
              minHeight: 52,
              paddingTop: 8,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              color: isActive
                ? 'var(--tds-color-primary)'
                : 'var(--tds-color-label-alternative)',
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{icon}</span>
            <span style={{
              fontSize: 10,
              fontWeight: isActive ? 600 : 400,
              letterSpacing: '-0.2px',
            }}>{label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <AppStoreProvider>
      <Routes>
        <Route path="/"               element={<Home />} />
        <Route path="/settings"       element={<Settings />} />
        <Route path="/result"         element={<Result />} />
        <Route path="/scan"           element={<Scan />} />
        <Route path="/fixed-expenses" element={<FixedExpenses />} />
        <Route path="/savings-goal"   element={<SavingsGoal />} />
        <Route path="/history"        element={<History />} />
        <Route path="/share"          element={<Share />} />
        <Route path="/compare"        element={<Compare />} />
      </Routes>
      <TabBar />
    </AppStoreProvider>
  );
}
