import { useState, useCallback } from 'react';
import { grantPromotionReward } from '@apps-in-toss/web-framework';

interface PromotionRewardRequest {
  /** 앱인토스 콘솔에서 발급받은 프로모션 코드 */
  promotionCode: string;
  /** 지급 포인트 — 1인당 최대 5,000원 제한 */
  amount: number;
}

interface PromotionRewardResult {
  success: boolean;
  error?: string;
}

/**
 * 프로모션 리워드 훅.
 * grantPromotionReward SDK (v2.0.8+)로 유저에게 포인트를 지급한다.
 * amount > 5000 호출 시 즉시 실패를 반환하며 SDK를 호출하지 않는다.
 *
 * 실제 지급은 앱인토스 WebView 환경에서만 동작한다.
 */
export function useTossPromotion() {
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<PromotionRewardResult | null>(null);

  const grantReward = useCallback(async (req: PromotionRewardRequest): Promise<PromotionRewardResult> => {
    if (req.amount > 5000) {
      const result: PromotionRewardResult = { success: false, error: '1인당 최대 5,000원까지 지급 가능합니다' };
      setLastResult(result);
      return result;
    }
    if (req.amount <= 0) {
      const result: PromotionRewardResult = { success: false, error: '지급 금액은 0보다 커야 합니다' };
      setLastResult(result);
      return result;
    }

    setLoading(true);
    try {
      await grantPromotionReward({ params: { promotionCode: req.promotionCode, amount: req.amount } });
      const result: PromotionRewardResult = { success: true };
      setLastResult(result);
      return result;
    } catch (e) {
      const result: PromotionRewardResult = { success: false, error: (e as Error).message };
      setLastResult(result);
      return result;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, lastResult, grantReward };
}
