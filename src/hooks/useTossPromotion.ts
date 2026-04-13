import { useState, useCallback } from 'react';

const isTossApp = typeof window !== 'undefined' && !!(window as unknown as Record<string, unknown>).Toss;

/** 프로모션 리워드 요청 파라미터 */
interface PromotionRewardRequest {
  /** 프로모션 코드 (콘솔에서 발급) */
  promotionCode: string;
  /** 지급 포인트 (1인당 최대 5,000원) */
  amount: number;
}

interface PromotionRewardResult {
  success: boolean;
  error?: string;
}

/**
 * 토스 프로모션 리워드 SDK 연동 hook.
 *
 * grantPromotionReward — @apps-in-toss/web-framework SDK v2.0.8+
 * 앱인토스 콘솔에서 생성한 프로모션 코드로 유저에게 포인트를 지급한다.
 * 1인당 최대 5,000원 제한.
 *
 * 참고: https://developers-apps-in-toss.toss.im/bedrock/reference/framework/게임/grantPromotionRewardForGame.html
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

    if (!isTossApp) {
      // 개발 환경: 시뮬레이션
      const result: PromotionRewardResult = { success: true };
      setLastResult(result);
      return result;
    }

    setLoading(true);
    try {
      const { grantPromotionReward } = await import('@apps-in-toss/web-framework');
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
