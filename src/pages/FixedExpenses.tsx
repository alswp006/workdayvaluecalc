import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertDialog,
  BottomSheet,
  Button,
  ListRow,
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

export default function FixedExpenses() {
  const navigate = useNavigate();
  const { isBootLoading, profile, fixedExpenses, addFixedExpense } = useAppStore();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [nameError, setNameError] = useState('');
  const [amountError, setAmountError] = useState('');
  const [toastOpen, setToastOpen] = useState(false);
  const [quotaDialog, setQuotaDialog] = useState(false);

  if (isBootLoading) {
    return (
      <div style={{ padding: '0 20px' }}>
        <Paragraph.Text typography="st6">불러오는 중...</Paragraph.Text>
      </div>
    );
  }

  const hourlyWage = profile ? computeHourlyWageKRW(profile) : null;

  const formatWorkTime = (monthlyKRW: number) => {
    if (!hourlyWage) return '';
    const hours = monthlyKRW / hourlyWage;
    if (hours >= 8) {
      const days = hours / 8;
      return `매달 ${days.toFixed(1)}일 노동`;
    }
    return `매달 ${hours.toFixed(1)}시간 노동`;
  };

  const handleAdd = () => {
    let valid = true;
    if (!name.trim()) { setNameError('항목명을 입력해주세요'); valid = false; }
    else setNameError('');
    const parsed = Number(amount);
    if (!amount || parsed <= 0) { setAmountError('금액을 1원 이상 입력해주세요'); valid = false; }
    else setAmountError('');
    if (!valid) return;

    generateHapticFeedback({ type: 'success' });
    addFixedExpense({ name: name.trim(), monthlyAmountKRW: parsed });
    setName('');
    setAmount('');
    setSheetOpen(false);
    setToastOpen(true);
  };

  return (
    <>
      <Top title={<Top.TitleParagraph>고정지출</Top.TitleParagraph>} />

      <div style={{ padding: '0 20px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <Spacing size={8} />

        {!profile && (
          <>
            <Spacing size={16} />
            <Paragraph.Text typography="st6">
              💡 급여를 설정하면 매달 며칠치 노동인지 볼 수 있어요
            </Paragraph.Text>
            <Spacing size={8} />
          </>
        )}

        {fixedExpenses.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 0', gap: 12 }}>
            <Paragraph.Text typography="t4">🏠</Paragraph.Text>
            <Paragraph.Text typography="st4">고정지출을 추가해보세요</Paragraph.Text>
            <Paragraph.Text typography="st6">월세, 구독료 등이 매달 며칠치 노동인지 알 수 있어요</Paragraph.Text>
          </div>
        ) : (
          <>
            {fixedExpenses.map((item) => (
              <ListRow
                key={item.id}
                contents={
                  <ListRow.Texts
                    type="2RowTypeA"
                    top={item.name}
                    bottom={`${formatKRW(item.monthlyAmountKRW)}/월 ${formatWorkTime(item.monthlyAmountKRW)}`}
                  />
                }
              />
            ))}
            <Spacing size={16} />
            {hourlyWage && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: 12,
                  background: 'var(--tds-color-background-elevated)',
                  textAlign: 'center',
                }}
              >
                <Paragraph.Text typography="st6">총 고정지출</Paragraph.Text>
                <Spacing size={4} />
                <Paragraph.Text typography="t3">
                  {formatKRW(fixedExpenses.reduce((s, i) => s + i.monthlyAmountKRW, 0))}
                </Paragraph.Text>
                <Spacing size={4} />
                <Paragraph.Text typography="st6">
                  {formatWorkTime(fixedExpenses.reduce((s, i) => s + i.monthlyAmountKRW, 0))}
                </Paragraph.Text>
              </div>
            )}
          </>
        )}

        <Spacing size={24} />
        <div style={{ display: 'grid' }}>
          <Button variant="fill" size="large" onClick={() => setSheetOpen(true)}>
            + 고정지출 추가
          </Button>
        </div>
      </div>

      <BottomSheet open={sheetOpen} onClose={() => setSheetOpen(false)}>
        <BottomSheet.Header>고정지출 추가</BottomSheet.Header>
        <div style={{ padding: '0 20px 32px' }}>
          <Spacing size={16} />
          <Paragraph.Text typography="st6">항목명</Paragraph.Text>
          <Spacing size={4} />
          <TextField
            variant="box"
            label="예) 월세, 넷플릭스"
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setName(e.target.value); setNameError(''); }}
            help={nameError || undefined}
            hasError={!!nameError}
          />
          <Spacing size={16} />
          <Paragraph.Text typography="st6">월 금액</Paragraph.Text>
          <Spacing size={4} />
          <TextField
            variant="box"
            label="0원"
            value={amount}
            inputMode="numeric"
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setAmount(e.target.value); setAmountError(''); }}
            help={amountError || undefined}
            hasError={!!amountError}
          />
          <Spacing size={24} />
          <div style={{ display: 'grid' }}>
            <Button variant="fill" size="large" onClick={handleAdd}>추가하기</Button>
          </div>
        </div>
      </BottomSheet>

      <Toast open={toastOpen} position="bottom" onClose={() => setToastOpen(false)} text="추가했어요" />

      <AlertDialog
        open={quotaDialog}
        title="저장 실패"
        description="저장 공간이 부족해 저장할 수 없어요"
        alertButton={<AlertDialog.AlertButton onClick={() => setQuotaDialog(false)}>닫기</AlertDialog.AlertButton>}
        onClose={() => setQuotaDialog(false)}
      />
    </>
  );
}
