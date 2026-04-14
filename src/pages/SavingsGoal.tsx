import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Paragraph, Spacing, TextField, Top } from '@toss/tds-mobile';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { useAppStore } from '@/lib/store/AppStore';
import { computeHourlyWageKRW } from '@/lib/domain/calc';
import { formatKRW } from '@/lib/domain/format';
import { getSavingsGoalState, setSavingsGoalState } from '@/lib/storage/savingsGoal';

export default function SavingsGoal() {
  const navigate = useNavigate();
  const { isBootLoading, profile } = useAppStore();

  const saved = getSavingsGoalState();
  const [goalAmount, setGoalAmount] = useState(saved.goalAmountKRW > 0 ? String(saved.goalAmountKRW) : '');
  const [monthlySavings, setMonthlySavings] = useState(saved.monthlySavingsKRW > 0 ? String(saved.monthlySavingsKRW) : '');
  const [monthlySavingsError, setMonthlySavingsError] = useState('');
  const [result, setResult] = useState<{ months: number; workDays: number } | null>(null);

  if (isBootLoading) {
    return (
      <div style={{ padding: '0 20px' }}>
        <Paragraph.Text typography="st6">불러오는 중...</Paragraph.Text>
      </div>
    );
  }

  const handleCalc = () => {
    const goal = Number(goalAmount);
    const monthly = Number(monthlySavings);

    if (!monthlySavings || monthly <= 0) {
      setMonthlySavingsError('매달 저축액을 1원 이상 입력해주세요');
      return;
    }
    setMonthlySavingsError('');

    if (!goalAmount || goal <= 0) return;

    generateHapticFeedback({ type: 'success' });

    setSavingsGoalState({ version: 1, goalAmountKRW: goal, monthlySavingsKRW: monthly });

    const months = goal / monthly;
    const hourlyWage = profile ? computeHourlyWageKRW(profile) : null;
    const workDays = hourlyWage ? (goal / hourlyWage) / 8 : 0;

    setResult({ months, workDays });
  };

  return (
    <>
      <Top title={<Top.TitleParagraph>목표저축</Top.TitleParagraph>} />

      <div style={{ padding: '0 20px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <Spacing size={20} />

        <Paragraph.Text typography="st6">목표 금액</Paragraph.Text>
        <Spacing size={4} />
        <TextField
          variant="box"
          label="0원"
          value={goalAmount}
          inputMode="numeric"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setGoalAmount(e.target.value)}
        />

        <Spacing size={16} />

        <Paragraph.Text typography="st6">매달 저축 금액</Paragraph.Text>
        <Spacing size={4} />
        <TextField
          variant="box"
          label="0원"
          value={monthlySavings}
          inputMode="numeric"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setMonthlySavings(e.target.value); setMonthlySavingsError(''); }}
          help={monthlySavingsError || undefined}
          hasError={!!monthlySavingsError}
        />

        <Spacing size={24} />
        <div style={{ display: 'grid' }}>
          <Button variant="fill" size="large" onClick={handleCalc}>계산하기</Button>
        </div>

        {result && (
          <>
            <Spacing size={32} />
            <div
              style={{
                padding: '24px 20px',
                borderRadius: 16,
                background: 'var(--tds-color-background-elevated)',
                textAlign: 'center',
              }}
            >
              <Paragraph.Text typography="st6">목표까지</Paragraph.Text>
              <Spacing size={8} />
              <Paragraph.Text typography="t1">
                {result.months >= 12
                  ? `${(result.months / 12).toFixed(1)}년`
                  : `${Math.ceil(result.months)}개월`}
              </Paragraph.Text>
              <Spacing size={4} />
              <Paragraph.Text typography="st4">{formatKRW(Number(goalAmount))} 모으기</Paragraph.Text>

              {profile && result.workDays > 0 && (
                <>
                  <Spacing size={16} />
                  <div
                    style={{
                      padding: '12px',
                      borderRadius: 8,
                      background: 'var(--tds-color-background)',
                    }}
                  >
                    <Paragraph.Text typography="st6">
                      총 {result.workDays.toFixed(1)}일치 노동으로 모을 수 있어요
                    </Paragraph.Text>
                  </div>
                </>
              )}

              {!profile && (
                <>
                  <Spacing size={12} />
                  <Button variant="weak" size="medium" onClick={() => navigate('/settings')}>
                    급여 설정하면 노동일수도 볼 수 있어요
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
