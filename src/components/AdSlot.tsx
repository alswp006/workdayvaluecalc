import { useEffect, useRef } from 'react';
import { TossAds } from '@apps-in-toss/web-bridge';

interface AdSlotProps {
  /** 앱인토스 콘솔에서 발급받은 광고 그룹 ID */
  adGroupId: string;
}

/**
 * 배너 광고 슬롯 컴포넌트.
 * TossAds.initialize() 후 TossAds.attachBanner()로 지정 DOM 요소에 배너를 부착한다.
 *
 * 실제 광고는 앱인토스 WebView 환경에서만 렌더링된다.
 * WebView 외부에서는 빈 div로 렌더링된다.
 */
export function AdSlot({ adGroupId }: AdSlotProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const target = containerRef.current;

    TossAds.initialize({});

    const result = TossAds.attachBanner(adGroupId, target);

    return () => {
      result?.destroy();
    };
  }, [adGroupId]);

  return <div ref={containerRef} style={{ width: '100%' }} />;
}
