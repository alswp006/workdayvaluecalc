import { useState, useCallback } from 'react';
import { loadFullScreenAd, showFullScreenAd } from '@apps-in-toss/web-bridge';

interface UseTossAdOptions {
  adGroupId: string;
}

interface UseTossAdResult {
  isLoading: boolean;
  isShowing: boolean;
  rewarded: boolean;
  loadAndShow: () => Promise<{ rewarded: boolean }>;
}

/**
 * 리워드 광고 훅.
 * loadFullScreenAd로 광고를 로드한 뒤, showFullScreenAd로 재생하고
 * userEarnedReward 이벤트를 감지해 rewarded 상태를 반환한다.
 *
 * 실제 동작은 앱인토스 WebView 환경에서만 가능하다.
 * WebView 외부(dev/test)에서는 loadFullScreenAd가 onError를 호출해 reject된다.
 */
export function useTossAd({ adGroupId }: UseTossAdOptions): UseTossAdResult {
  const [isLoading, setIsLoading] = useState(false);
  const [isShowing, setIsShowing] = useState(false);
  const [rewarded, setRewarded] = useState(false);

  const loadAndShow = useCallback((): Promise<{ rewarded: boolean }> => {
    return new Promise((resolve, reject) => {
      setIsLoading(true);

      const cleanupLoad = loadFullScreenAd({
        options: { adGroupId },
        onEvent: () => {
          // 'loaded' — 광고 로드 완료, 즉시 재생
          setIsLoading(false);
          setIsShowing(true);

          const cleanupShow = showFullScreenAd({
            options: { adGroupId },
            onEvent: (event) => {
              if (event.type === 'userEarnedReward') {
                setRewarded(true);
              } else if (event.type === 'dismissed') {
                setIsShowing(false);
                cleanupShow();
                // dismissed 시점에 rewarded 여부를 최종 전달
                resolve({ rewarded: true });
              } else if (event.type === 'failedToShow') {
                setIsShowing(false);
                cleanupShow();
                reject(new Error('Ad failed to show'));
              }
            },
            onError: (err) => {
              setIsShowing(false);
              cleanupShow();
              reject(err);
            },
          });
        },
        onError: (err) => {
          setIsLoading(false);
          cleanupLoad();
          reject(err);
        },
      });
    });
  }, [adGroupId]);

  return { isLoading, isShowing, rewarded, loadAndShow };
}
