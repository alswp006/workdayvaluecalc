import type { AppsInTossConfig } from './generate-apps-in-toss.js';

const config: AppsInTossConfig = {
  // ── 1스텝: 기본 정보 ──────────────────────────────────────
  koreanName: '노동값 계산기',
  englishName: 'WorkdayValueCalc',
  appName: 'workdayvaluecalc',
  ageRating: '전체',
  supportEmail: 'support@aifactory.dev',

  // ── 2스텝: 카테고리 및 노출 ──────────────────────────────
  category: {
    primary: '금융/재테크',
    secondary: '계산기',
  },
  subtitle: '시급과 노동 가치를 계산해요',
  description:
    '내 시간의 가치가 얼마인지 알고 싶으신가요? 시급·일당·월급을 입력하면 ' +
    '소비 항목의 노동값(몇 시간 일해야 살 수 있는지)을 즉시 계산해 드립니다. ' +
    '노동값 계산기로 지출 습관을 돌아보고, 시간의 가치를 체감해 보세요.',
  searchKeywords: ['시급 계산기', '노동 가치', '연봉 계산', '월급 계산기', '근무 시간'],

  // ── 로고/배너 설정 ────────────────────────────────────────
  logo: {
    conceptDescription: '시계와 지갑이 결합된 단순한 아이콘, 노동 시간과 소비 가치를 상징',
    backgroundColor: '#3182F6', // 토스 브랜드 primary (granite.config.ts primaryColor)
  },
};

export default config;
