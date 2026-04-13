import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  Button,
  Paragraph,
  Spacing,
  Switch,
  TextField,
  Toast,
  Top,
} from '@toss/tds-mobile';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { useAppStore } from '@/lib/store/AppStore';
import { formatWithComma, handleNumberChange, parseFormatted, toKoreanUnit } from '@/lib/domain/numberInput';
import type { WorkProfile } from '@/lib/types';

type PayType = WorkProfile['payType'];

const PAY_TYPE_LABELS: Record<PayType, string> = {
  monthly: '월급',
  annual: '연봉',
  hourly: '시급',
};

export default function Settings() {
  const navigate = useNavigate();
  const { isBootLoading, profile, isSavingProfile, saveProfile } = useAppStore();

  const [payType, setPayType] = useState<PayType>(profile?.payType ?? 'monthly');
  const [payAmount, setPayAmount] = useState(
    profile?.payAmount ? formatWithComma(String(profile.payAmount)) : ''
  );
  const [workHoursPerDay, setWorkHoursPerDay] = useState(
    profile?.workHoursPerDay?.toString() ?? '8',
  );
  const [workDaysPerWeek, setWorkDaysPerWeek] = useState(
    profile?.workDaysPerWeek?.toString() ?? '5',
  );
  const [includeLunchBreak, setIncludeLunchBreak] = useState(
    profile?.includeLunchBreak ?? false,
  );

  const [payAmountError, setPayAmountError] = useState('');
  const [workHoursError, setWorkHoursError] = useState('');
  const [quotaDialog, setQuotaDialog] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);

  if (isBootLoading) {
    return (
      <div style={{ padding: '0 20px' }}>
        <Paragraph.Text typography="st6">불러오는 중...</Paragraph.Text>
      </div>
    );
  }

  const handleSave = async () => {
    const parsedPay = parseFormatted(payAmount);
    if (!payAmount || parsedPay <= 0) {
      setPayAmountError('급여를 1원 이상 입력해주세요');
      return;
    }
    if (payType === 'monthly' && parsedPay > 100_000_000) {
      setPayAmountError('월급이 1억원을 초과했어요. 연봉이라면 "연봉"으로 바꿔주세요');
      return;
    }
    setPayAmountError('');

    const parsedHours = Number(workHoursPerDay);
    if (!workHoursPerDay || parsedHours <= 0) {
      setWorkHoursError('하루 근무시간은 1시간 이상이어야 해요');
      return;
    }
    setWorkHoursError('');

    const next: WorkProfile = {
      payType,
      payAmount: parsedPay, // parseFormatted로 이미 숫자로 변환됨
      workHoursPerDay: parsedHours,
      workDaysPerWeek: Number(workDaysPerWeek) || 5,
      includeLunchBreak,
    };

    const result = await saveProfile(next);

    if (!result.ok) {
      if (result.error === 'QUOTA_EXCEEDED') setQuotaDialog(true);
      return;
    }

    generateHapticFeedback({ type: 'success' });
    setToastOpen(true);
    navigate(-1);
  };

  return (
    <>
      <Top title={<Top.TitleParagraph>급여 설정</Top.TitleParagraph>} />

      <div style={{ padding: '0 20px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <Spacing size={20} />

        {/* 급여 유형 선택 */}
        <Paragraph.Text typography="st5">급여 유형</Paragraph.Text>
        <Spacing size={8} />
        <div style={{ display: 'flex', gap: 8 }}>
          {(['monthly', 'annual', 'hourly'] as PayType[]).map((t) => {
            const isSelected = payType === t;
            return (
              <button
                key={t}
                onClick={() => setPayType(t)}
                style={{
                  flex: 1,
                  padding: '10px 0',
                  borderRadius: 12,
                  border: isSelected
                    ? '2px solid var(--tds-color-primary)'
                    : '1px solid var(--tds-color-border)',
                  background: isSelected
                    ? 'var(--tds-color-primary)'
                    : 'var(--tds-color-background-elevated)',
                  color: isSelected
                    ? 'white'
                    : 'var(--tds-color-label-normal)',
                  cursor: 'pointer',
                  fontWeight: isSelected ? 700 : 400,
                  minHeight: 44,
                  fontSize: 15,
                  transition: 'all 0.15s',
                }}
              >
                {PAY_TYPE_LABELS[t]}
              </button>
            );
          })}
        </div>

        <Spacing size={20} />

        <Paragraph.Text typography="st5">
          {payType === 'monthly' ? '월급' : payType === 'annual' ? '연봉' : '시급'}
        </Paragraph.Text>
        <Spacing size={4} />
        <TextField
          variant="box"
          label="급여 금액(원)"
          value={payAmount}
          inputMode="numeric"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setPayAmount(handleNumberChange(e));
            if (payAmountError) setPayAmountError('');
          }}
          help={payAmountError || undefined}
          hasError={!!payAmountError}
        />
        {/* 만원 단위 미리보기 */}
        {payAmount && !payAmountError && (
          <>
            <Spacing size={4} />
            <Paragraph.Text typography="st6">
              = {toKoreanUnit(parseFormatted(payAmount))}
            </Paragraph.Text>
          </>
        )}

        <Spacing size={16} />

        <Paragraph.Text typography="st5">하루 근무시간</Paragraph.Text>
        <Spacing size={4} />
        <TextField
          variant="box"
          label="하루 근무시간"
          value={workHoursPerDay}
          inputMode="numeric"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setWorkHoursPerDay(e.target.value);
            if (workHoursError) setWorkHoursError('');
          }}
          help={workHoursError || undefined}
          hasError={!!workHoursError}
        />

        <Spacing size={16} />

        <Paragraph.Text typography="st5">주 근무일수</Paragraph.Text>
        <Spacing size={4} />
        <TextField
          variant="box"
          label="주 근무일수"
          value={workDaysPerWeek}
          inputMode="numeric"
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setWorkDaysPerWeek(e.target.value)
          }
        />

        <Spacing size={20} />

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 0',
            borderTop: '1px solid var(--tds-color-border)',
            borderBottom: '1px solid var(--tds-color-border)',
          }}
        >
          <div>
            <Paragraph.Text typography="t5">점심시간 제외</Paragraph.Text>
            <Spacing size={2} />
            <Paragraph.Text typography="st6">하루 1시간 점심 제외 후 시급 계산</Paragraph.Text>
          </div>
          <Switch
            checked={includeLunchBreak}
            onChange={() => {
              generateHapticFeedback({ type: 'tickWeak' });
              setIncludeLunchBreak((v) => !v);
            }}
          />
        </div>

        <Spacing size={32} />

        <div style={{ display: 'grid' }}>
          <Button
            variant="fill"
            size="large"
            disabled={isSavingProfile}
            onClick={handleSave}
          >
            {isSavingProfile ? '저장 중...' : '저장'}
          </Button>
        </div>
      </div>

      <Toast
        open={toastOpen}
        position="bottom"
        onClose={() => setToastOpen(false)}
        text="저장했어요"
      />

      <AlertDialog
        open={quotaDialog}
        title="저장 실패"
        description="저장 공간이 부족해 저장할 수 없어요"
        alertButton={
          <AlertDialog.AlertButton onClick={() => setQuotaDialog(false)}>
            닫기
          </AlertDialog.AlertButton>
        }
        onClose={() => setQuotaDialog(false)}
      />
    </>
  );
}
