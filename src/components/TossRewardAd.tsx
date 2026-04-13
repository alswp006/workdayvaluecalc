import { Button, Paragraph, Spacing } from '@toss/tds-mobile';
import { useTossAd } from '@/hooks/useTossAd';
import { useState } from 'react';

interface TossRewardAdProps {
  /** 앱인토스 콘솔에서 발급받은 광고 그룹 ID */
  adGroupId: string;
  /** 광고 시청 완료 후 보여줄 콘텐츠 */
  children: React.ReactNode;
  /** 광고 시청 전 표시할 안내 문구 */
  description?: string;
  /** 광고 버튼 텍스트 */
  buttonText?: string;
  /** 광고 시청 완료 콜백 */
  onRewarded?: () => void;
  /** 광고 로드/재생 실패 콜백 */
  onAdFailed?: () => void;
}

/**
 * 리워드 광고 게이트 컴포넌트.
 * 광고 시청 전까지 children을 숨기고, 시청 완료(또는 실패) 후 노출한다.
 *
 * 실제 광고 재생은 앱인토스 WebView 환경에서만 동작한다.
 * WebView 외부(dev/브라우저)에서는 광고 로드가 실패해 onAdFailed 처리된다.
 */
export function TossRewardAd({
  adGroupId,
  children,
  description = '광고를 시청하면 결과를 확인할 수 있어요',
  buttonText = '광고 보고 확인하기',
  onRewarded,
  onAdFailed,
}: TossRewardAdProps) {
  const { isLoading, isShowing, loadAndShow } = useTossAd({ adGroupId });
  const [unlocked, setUnlocked] = useState(false);

  if (unlocked) {
    return <>{children}</>;
  }

  const handleWatch = async () => {
    try {
      await loadAndShow();
      setUnlocked(true);
      onRewarded?.();
    } catch {
      onAdFailed?.();
    }
  };

  const isBusy = isLoading || isShowing;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Paragraph.Text typography="st6">{description}</Paragraph.Text>
      <Spacing size={16} />
      <Button
        variant="fill"
        size="large"
        disabled={isBusy}
        onClick={handleWatch}
      >
        {isLoading ? '광고 불러오는 중...' : isShowing ? '광고 재생 중...' : buttonText}
      </Button>
    </div>
  );
}
