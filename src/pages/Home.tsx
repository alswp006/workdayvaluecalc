import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  Button,
  Paragraph,
  Spacing,
  TextField,
  Toast,
  Top,
} from '@toss/tds-mobile';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { useAppStore } from '@/lib/store/AppStore';
import { computeHourlyWageKRW } from '@/lib/domain/calc';
import { formatKRW } from '@/lib/domain/format';
import { handleNumberChange, parseFormatted, toKoreanUnit } from '@/lib/domain/numberInput';
import type { RouteState } from '@/lib/types';

type DialogType = 'no_profile' | 'parse_error' | null;

export default function Home() {
  const navigate = useNavigate();
  const {
    isBootLoading,
    profile,
    calcsParseError,
    resetCalcs,
    addManualCalc,
  } = useAppStore();

  const [amount, setAmount] = useState('');
  const [title, setTitle] = useState('');
  const [amountError, setAmountError] = useState('');
  const [dialog, setDialog] = useState<DialogType>(calcsParseError ? 'parse_error' : null);
  const [toastOpen, setToastOpen] = useState(false);
  const amountRef = useRef<HTMLInputElement>(null);

  if (calcsParseError && dialog !== 'parse_error') {
    setDialog('parse_error');
  }

  if (isBootLoading) {
    return (
      <div style={{ padding: '0 20px' }}>
        <Spacing size={32} />
        <Paragraph.Text typography="st6">불러오는 중...</Paragraph.Text>
      </div>
    );
  }

  const handleCalc = () => {
    generateHapticFeedback({ type: 'success' });

    if (!profile) {
      setDialog('no_profile');
      return;
    }

    const parsed = parseFormatted(amount);
    if (!amount || parsed <= 0) {
      setAmountError('금액을 1원 이상 입력해주세요');
      return;
    }
    setAmountError('');

    const calcId = addManualCalc({ title: title || formatKRW(parsed), amountKRW: parsed });
    if (!calcId) return;

    const state: RouteState['/result'] = { calcId };
    navigate('/result', { state });
  };

  const handleReset = () => {
    generateHapticFeedback({ type: 'error' });
    resetCalcs();
    setDialog(null);
  };

  // ── 온보딩 (프로필 미설정) ───────────────────────────────────
  if (!profile) {
    return (
      <>
        <Top title={<Top.TitleParagraph>노동값 계산</Top.TitleParagraph>} />

        <div style={{ padding: '0 20px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
          <Spacing size={32} />

          {/* 온보딩 카드 */}
          <div
            style={{
              borderRadius: 20,
              background: 'var(--tds-color-background-elevated)',
              padding: '32px 24px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 48, lineHeight: 1 }}>💰</div>
            <Spacing size={16} />
            <Paragraph.Text typography="t3">이 물건은 내 몇 시간 노동값?</Paragraph.Text>
            <Spacing size={8} />
            <Paragraph.Text typography="st4">
              금액을 입력하면 내 시급 기준으로
            </Paragraph.Text>
            <Spacing size={2} />
            <Paragraph.Text typography="st4">
              몇 시간 일해야 하는지 알 수 있어요
            </Paragraph.Text>
            <Spacing size={24} />
            <div style={{ display: 'grid' }}>
              <Button variant="fill" size="large" onClick={() => navigate('/settings')}>
                시작하기 — 급여 설정
              </Button>
            </div>
          </div>

          <Spacing size={24} />

          {/* 기능 소개 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '📷', title: '사진으로 가격 인식', desc: 'AI가 상품 가격표를 읽어드려요' },
              { icon: '🏠', title: '고정지출 환산', desc: '월세·구독료가 며칠치 노동인지' },
              { icon: '🎯', title: '목표저축 계산', desc: '목표까지 몇 달이 필요한지' },
            ].map(({ icon, title: featureTitle, desc }) => (
              <div
                key={featureTitle}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 16,
                  padding: '16px',
                  borderRadius: 12,
                  background: 'var(--tds-color-background-elevated)',
                }}
              >
                <div style={{ fontSize: 24, flexShrink: 0 }}>{icon}</div>
                <div>
                  <Paragraph.Text typography="st4">{featureTitle}</Paragraph.Text>
                  <Spacing size={2} />
                  <Paragraph.Text typography="st6">{desc}</Paragraph.Text>
                </div>
              </div>
            ))}
          </div>
        </div>

        <AlertDialog
          open={dialog === 'no_profile'}
          title="급여 설정 필요"
          description="먼저 급여/근무조건을 설정해주세요"
          alertButton={
            <AlertDialog.AlertButton onClick={() => navigate('/settings')}>
              설정하러 가기
            </AlertDialog.AlertButton>
          }
          onClose={() => setDialog(null)}
        />
      </>
    );
  }

  // ── 메인 ────────────────────────────────────────────────────
  const parsedAmount = parseFormatted(amount);
  const hourlyWage = computeHourlyWageKRW(profile);

  return (
    <>
      <Top title={<Top.TitleParagraph>노동값 계산</Top.TitleParagraph>} />

      <div style={{ padding: '0 20px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <Spacing size={20} />

        {/* 입력 섹션 */}
        <Paragraph.Text typography="t4">얼마짜리예요?</Paragraph.Text>
        <Spacing size={12} />
        <TextField
          ref={amountRef}
          variant="box"
          label="금액(원)"
          value={amount}
          inputMode="numeric"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setAmount(handleNumberChange(e));
            if (amountError) setAmountError('');
          }}
          onFocus={() => amountRef.current?.scrollIntoView({ block: 'center' })}
          help={amountError || undefined}
          hasError={!!amountError}
        />
        {amount && !amountError && (
          <>
            <Spacing size={4} />
            <Paragraph.Text typography="st6">= {toKoreanUnit(parsedAmount)}</Paragraph.Text>
          </>
        )}
        <Spacing size={8} />
        <TextField
          variant="box"
          label="항목명 (선택)"
          value={title}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
        />

        <Spacing size={12} />

        {/* 빠른 기능 */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: '📷', sub: '사진 인식', to: '/scan' },
            { label: '🏠', sub: '고정지출', to: '/fixed-expenses' },
            { label: '🎯', sub: '목표저축', to: '/savings-goal' },
          ].map(({ label, sub, to }) => (
            <button
              key={to}
              onClick={() => { generateHapticFeedback({ type: 'tickWeak' }); navigate(to); }}
              style={{
                flex: 1,
                padding: '12px 4px',
                borderRadius: 14,
                border: '1px solid var(--tds-color-border)',
                background: 'var(--tds-color-background-elevated)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                minHeight: 60,
              }}
            >
              <span style={{ fontSize: 20 }}>{label}</span>
              <span style={{ fontSize: 11, color: 'var(--tds-color-label-alternative)' }}>{sub}</span>
            </button>
          ))}
        </div>

        <Spacing size={16} />
        <div style={{ display: 'grid' }}>
          <Button variant="fill" size="large" onClick={handleCalc}>
            노동값 계산하기
          </Button>
        </div>

        <Spacing size={20} />

        {/* 내 시급 요약 카드 */}
        <div
          style={{
            borderRadius: 16,
            background: 'var(--tds-color-background-elevated)',
            border: '1px solid var(--tds-color-border)',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            padding: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <Paragraph.Text typography="st6">내 시급 기준</Paragraph.Text>
            <Spacing size={6} />
            <Paragraph.Text typography="t2">{formatKRW(hourlyWage)}<span style={{ fontSize: 14, fontWeight: 400, color: 'var(--tds-color-label-alternative)' }}> / 시간</span></Paragraph.Text>
            <Spacing size={4} />
            <Paragraph.Text typography="st6">
              {profile.payType === 'monthly' ? '월급' : profile.payType === 'annual' ? '연봉' : '시급'} 기준 계산
            </Paragraph.Text>
          </div>
          <button
            onClick={() => navigate('/settings')}
            style={{
              padding: '8px 16px',
              borderRadius: 20,
              border: '1px solid var(--tds-color-border)',
              background: 'var(--tds-color-background)',
              color: 'var(--tds-color-label-alternative)',
              cursor: 'pointer',
              fontSize: 13,
              minHeight: 44,
            }}
          >
            수정
          </button>
        </div>
      </div>

      <Toast
        open={toastOpen}
        position="bottom"
        onClose={() => setToastOpen(false)}
        text=""
      />

      <AlertDialog
        open={dialog === 'parse_error'}
        description="저장된 데이터를 읽을 수 없어요. 초기화할까요?"
        alertButton={
          <AlertDialog.AlertButton onClick={handleReset}>초기화</AlertDialog.AlertButton>
        }
        onClose={() => setDialog(null)}
      />

      <AlertDialog
        open={dialog === 'no_profile'}
        title="급여 설정 필요"
        description="먼저 급여/근무조건을 설정해주세요"
        alertButton={
          <AlertDialog.AlertButton onClick={() => navigate('/settings')}>
            설정하러 가기
          </AlertDialog.AlertButton>
        }
        onClose={() => setDialog(null)}
      />
    </>
  );
}
