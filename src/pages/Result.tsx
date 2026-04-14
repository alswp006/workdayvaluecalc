import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Paragraph, Spacing, Toast, Top } from '@toss/tds-mobile';
import { AdSlot } from '@/components/AdSlot';
import { TossRewardAd } from '@/components/TossRewardAd';
import { useAppStore } from '@/lib/store/AppStore';
import { computeDerived } from '@/lib/domain/calc';
import { formatKRW } from '@/lib/domain/format';
import { animateCountUp } from '@/lib/domain/animate';
import type { RouteState } from '@/lib/types';

export default function Result() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isBootLoading, calcs } = useAppStore();

  const [adFailedToast, setAdFailedToast] = useState(false);
  const [secondsDisplay, setSecondsDisplay] = useState(0);

  if (isBootLoading) {
    return <Paragraph.Text typography="st6">불러오는 중...</Paragraph.Text>;
  }

  const state = location.state as RouteState['/result'] | undefined;
  const calc = state?.calcId ? calcs.find((c) => c.id === state.calcId) : undefined;

  if (!calc) {
    return (
      <>
        <Top title={<Top.TitleParagraph>결과</Top.TitleParagraph>} />
        <Spacing size={32} />
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <Paragraph.Text typography="st6">결과를 찾을 수 없어요</Paragraph.Text>
          <Button variant="weak" size="medium" onClick={() => navigate('/')}>
            홈으로
          </Button>
        </div>
      </>
    );
  }

  const derived = computeDerived(calc.amountKRW, calc.profileSnapshot);
  const hoursNeeded = derived.minutesNeeded / 60;

  const handleRewardComplete = () => {
    animateCountUp({
      from: 0,
      to: Math.round(derived.secondsNeeded),
      durationMs: 800,
      onUpdate: (v) => setSecondsDisplay(v),
      onDone: () => {},
    });
  };

  const summaryText =
    hoursNeeded >= 1
      ? `약 ${hoursNeeded.toFixed(1)}시간 노동값`
      : `약 ${derived.minutesNeeded.toFixed(0)}분 노동값`;

  return (
    <>
      <Top title={<Top.TitleParagraph>결과</Top.TitleParagraph>} />

      <div style={{ padding: '0 20px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <Spacing size={32} />

        {/* 기본 결과 카드 */}
        <div
          style={{
            textAlign: 'center',
            padding: '28px 20px',
            borderRadius: 16,
            background: 'var(--tds-color-background-elevated)',
          }}
        >
          <Paragraph.Text typography="t1">{formatKRW(calc.amountKRW)}</Paragraph.Text>
          <Spacing size={8} />
          <Paragraph.Text typography="t4">{summaryText}</Paragraph.Text>
          <Spacing size={12} />
          <Paragraph.Text typography="st6">
            시급 기준 {formatKRW(derived.hourlyWageKRW)}/시간
          </Paragraph.Text>

          {calc.source === 'SCAN_AI' && (
            <>
              <Spacing size={8} />
              <Paragraph.Text typography="st13">AI가 생성한 결과입니다</Paragraph.Text>
            </>
          )}
        </div>

        <Spacing size={16} />
        <AdSlot adGroupId="result-banner" />
        <Spacing size={16} />

        {/* 상세 섹션 — 리워드 광고 게이트 */}
        <TossRewardAd
          adGroupId="result-unlock"
          onRewarded={handleRewardComplete}
          onAdFailed={() => setAdFailedToast(true)}
        >
          <div
            data-testid="detail-section"
            style={{
              padding: '20px',
              borderRadius: 12,
              background: 'var(--tds-color-background-elevated)',
              textAlign: 'center',
            }}
          >
            <Paragraph.Text typography="st6">더 자세히 보면</Paragraph.Text>
            <Spacing size={8} />
            <Paragraph.Text typography="t3">{secondsDisplay}초</Paragraph.Text>
            <Spacing size={4} />
            <Paragraph.Text typography="st6">
              {derived.minutesNeeded.toFixed(1)}분 노동값
            </Paragraph.Text>
          </div>
        </TossRewardAd>

        <Spacing size={24} />
        <div style={{ display: 'grid' }}>
          <Button variant="weak" size="large" onClick={() => navigate('/')}>
            홈으로
          </Button>
        </div>
      </div>

      <Toast
        open={adFailedToast}
        position="bottom"
        onClose={() => setAdFailedToast(false)}
        text="광고를 불러오지 못했어요"
      />
    </>
  );
}
