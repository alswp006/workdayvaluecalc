import { useNavigate } from 'react-router-dom';
import { Button, ListRow, Paragraph, Spacing, Top } from '@toss/tds-mobile';
import { generateHapticFeedback } from '@apps-in-toss/web-framework';
import { useAppStore } from '@/lib/store/AppStore';
import { formatKRW } from '@/lib/domain/format';
import type { RouteState } from '@/lib/types';

export default function History() {
  const navigate = useNavigate();
  const { isBootLoading, calcs } = useAppStore();

  if (isBootLoading) {
    return (
      <div style={{ padding: '0 20px' }}>
        <Paragraph.Text typography="st6">불러오는 중...</Paragraph.Text>
      </div>
    );
  }

  const goResult = (calcId: string) => {
    generateHapticFeedback({ type: 'tickWeak' });
    const state: RouteState['/result'] = { calcId };
    navigate('/result', { state });
  };

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <>
      <Top title={<Top.TitleParagraph>계산 기록</Top.TitleParagraph>} />

      <div style={{ padding: '0 20px', paddingBottom: 'calc(80px + env(safe-area-inset-bottom))' }}>
        <Spacing size={8} />

        {calcs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '64px 0', gap: 16 }}>
            <Paragraph.Text typography="t4">🗒</Paragraph.Text>
            <Paragraph.Text typography="st4">아직 계산 기록이 없어요</Paragraph.Text>
            <Paragraph.Text typography="st6">홈에서 금액을 입력해 계산해보세요</Paragraph.Text>
            <Spacing size={8} />
            <div style={{ display: 'grid', width: '100%' }}>
              <Button variant="weak" size="large" onClick={() => navigate('/')}>
                홈으로
              </Button>
            </div>
          </div>
        ) : (
          <>
            <Paragraph.Text typography="st6">총 {calcs.length}개의 기록</Paragraph.Text>
            <Spacing size={8} />
            {calcs.map((item) => (
              <ListRow
                key={item.id}
                onClick={() => goResult(item.id)}
                contents={
                  <ListRow.Texts
                    type="2RowTypeA"
                    top={item.title}
                    bottom={`${formatKRW(item.amountKRW)} · ${formatDate(item.createdAt)}`}
                  />
                }
              />
            ))}
          </>
        )}
      </div>
    </>
  );
}
