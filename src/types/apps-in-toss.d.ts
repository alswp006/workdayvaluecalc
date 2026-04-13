// 앱인토스 SDK 타입 선언 — 런타임에 토스 앱이 주입하는 모듈
// vite.config.ts에서 external로 설정되어 번들에 포함되지 않음

declare module '@apps-in-toss/web-framework' {
  export function initApp(config: Record<string, unknown>): void;
  export function getAppInfo(): { appName: string; version: string };

  /**
   * 프로모션 리워드 지급 (SDK v2.0.8+)
   * 앱인토스 콘솔에서 생성한 프로모션 코드로 유저에게 포인트를 지급한다.
   * 1인당 최대 5,000원 제한.
   */
  export function grantPromotionReward(options: {
    params: { promotionCode: string; amount: number };
  }): Promise<void>;
}

declare module '@apps-in-toss/framework' {
  /** 햅틱 피드백 생성 */
  export function generateHapticFeedback(options: {
    type: 'success' | 'tickWeak' | 'tickStrong' | 'warning' | 'error';
  }): void;

  /** 토스 네이티브 스토리지 */
  export function setItem(key: string, value: string): Promise<void>;
  export function getItem(key: string): Promise<string | null>;
  export function removeItem(key: string): Promise<void>;

  /** 토스 네이티브 네비게이션 */
  export function navigate(url: string): void;
  export function close(): void;
}
