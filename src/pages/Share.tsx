import { useNavigate, useLocation } from 'react-router-dom';
import { Button, Paragraph, Spacing, Top } from '@toss/tds-mobile';
import type { RouteState } from '@/lib/types';

export default function Share() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as RouteState['/share'] | undefined;

  return (
    <>
      <Top title={<Top.TitleParagraph>공유</Top.TitleParagraph>} />
      <Spacing size={32} />
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
        {state?.calcId ? (
          <Paragraph.Text typography="st6">준비 중이에요</Paragraph.Text>
        ) : (
          <>
            <Paragraph.Text typography="st6">공유할 결과가 없어요</Paragraph.Text>
            <Button variant="weak" size="medium" onClick={() => navigate('/')}>홈으로</Button>
          </>
        )}
      </div>
    </>
  );
}
