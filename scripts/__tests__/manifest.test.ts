import { describe, it, expect } from 'vitest';
import { AppsInTossManifestSchema, validateManifest } from '../lib/manifest.js';

const VALID = {
  koreanName: '노동값 계산기',
  englishName: 'WorkdayValueCalc',
  appName: 'workdayvaluecalc',
  ageRating: '전체' as const,
  supportEmail: 'support@aifactory.dev',
  category: { primary: '금융/재테크', secondary: '계산기' },
  subtitle: '시급과 노동 가치를 계산해요',
  description:
    '내 시간의 가치가 얼마인지 알고 싶으신가요? 시급·일당·월급을 입력하면 ' +
    '소비 항목의 노동값을 즉시 계산해 드립니다.',
  searchKeywords: ['시급 계산기', '노동 가치', '연봉 계산'],
};

describe('AppsInTossManifestSchema — 1스텝', () => {
  it('유효한 데이터 통과', () => {
    expect(AppsInTossManifestSchema.safeParse(VALID).success).toBe(true);
  });

  it('homepage 없어도 통과', () => {
    expect(AppsInTossManifestSchema.safeParse(VALID).success).toBe(true);
  });

  it('homepage 유효한 URL → 통과', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, homepage: 'https://example.com' }).success,
    ).toBe(true);
  });

  it('homepage 잘못된 URL → 실패', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, homepage: 'not-a-url' }).success,
    ).toBe(false);
  });

  // appName 검증
  it('appName — kebab-case → 통과', () => {
    expect(AppsInTossManifestSchema.safeParse({ ...VALID, appName: 'rent-check' }).success).toBe(true);
  });

  it('appName — PascalCase → 실패', () => {
    expect(AppsInTossManifestSchema.safeParse({ ...VALID, appName: 'RentCheck' }).success).toBe(false);
  });

  it('appName — 언더스코어 포함 → 실패', () => {
    expect(AppsInTossManifestSchema.safeParse({ ...VALID, appName: 'rent_check' }).success).toBe(false);
  });

  it('appName — 공백 포함 → 실패', () => {
    expect(AppsInTossManifestSchema.safeParse({ ...VALID, appName: 'rent check' }).success).toBe(false);
  });

  it('appName — 숫자 포함 kebab-case → 통과', () => {
    expect(AppsInTossManifestSchema.safeParse({ ...VALID, appName: 'app-2go' }).success).toBe(true);
  });

  it('appName — 앞 하이픈 → 실패', () => {
    expect(AppsInTossManifestSchema.safeParse({ ...VALID, appName: '-rent-check' }).success).toBe(false);
  });

  it('appName — 뒤 하이픈 → 실패', () => {
    expect(AppsInTossManifestSchema.safeParse({ ...VALID, appName: 'rent-check-' }).success).toBe(false);
  });

  // ageRating
  it('ageRating — 허용값 외 → 실패', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, ageRating: '만 18세 이상' }).success,
    ).toBe(false);
  });

  it('ageRating — 만 19세 이상 → 통과', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, ageRating: '만 19세 이상' }).success,
    ).toBe(true);
  });

  // supportEmail
  it('supportEmail — 이메일 형식 아님 → 실패', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, supportEmail: 'not-email' }).success,
    ).toBe(false);
  });

  // koreanName 길이
  it('koreanName — 21자 이상 → 실패', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, koreanName: '가'.repeat(21) }).success,
    ).toBe(false);
  });

  it('koreanName — 20자 → 통과', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, koreanName: '가'.repeat(20) }).success,
    ).toBe(true);
  });

  // englishName 길이
  it('englishName — 31자 이상 → 실패', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, englishName: 'A'.repeat(31) }).success,
    ).toBe(false);
  });
});

describe('AppsInTossManifestSchema — 2스텝', () => {
  // subtitle
  it('subtitle — 느낌표(!) 포함 → 실패', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, subtitle: '지금 바로 계산해요!' }).success,
    ).toBe(false);
  });

  it('subtitle — 전각 느낌표(！) 포함 → 실패', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, subtitle: '지금 바로 계산해요！' }).success,
    ).toBe(false);
  });

  it('subtitle — 물음표(?) 포함 → 실패', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, subtitle: '내 시급은 얼마?' }).success,
    ).toBe(false);
  });

  it('subtitle — 비속어(대박) 포함 → 실패', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, subtitle: '대박 시급 계산기' }).success,
    ).toBe(false);
  });

  it('subtitle — 21자 → 실패', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, subtitle: '가'.repeat(21) }).success,
    ).toBe(false);
  });

  it('subtitle — 20자 → 통과', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, subtitle: '가'.repeat(20) }).success,
    ).toBe(true);
  });

  // searchKeywords
  it('searchKeywords — 2개 → 실패 (min 3)', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, searchKeywords: ['키워드1', '키워드2'] }).success,
    ).toBe(false);
  });

  it('searchKeywords — 11개 → 실패 (max 10)', () => {
    expect(
      AppsInTossManifestSchema.safeParse({
        ...VALID,
        searchKeywords: Array.from({ length: 11 }, (_, i) => `키워드${i}`),
      }).success,
    ).toBe(false);
  });

  it('searchKeywords — 21자 항목 포함 → 실패', () => {
    expect(
      AppsInTossManifestSchema.safeParse({
        ...VALID,
        searchKeywords: ['가'.repeat(21), '두번째', '세번째'],
      }).success,
    ).toBe(false);
  });

  it('searchKeywords — 3~10개 → 통과', () => {
    expect(
      AppsInTossManifestSchema.safeParse({
        ...VALID,
        searchKeywords: ['시급', '노동', '계산', '월급', '연봉'],
      }).success,
    ).toBe(true);
  });

  // category
  it('category.primary 없음 → 실패', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, category: { primary: '' } }).success,
    ).toBe(false);
  });

  it('category.secondary 없어도 통과', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, category: { primary: '금융/재테크' } }).success,
    ).toBe(true);
  });

  // description
  it('description — 49자 → 실패 (min 50)', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, description: '가'.repeat(49) }).success,
    ).toBe(false);
  });

  it('description — 50자 → 통과', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, description: '가'.repeat(50) }).success,
    ).toBe(true);
  });

  it('description — 1001자 → 실패 (max 1000)', () => {
    expect(
      AppsInTossManifestSchema.safeParse({ ...VALID, description: 'a'.repeat(1001) }).success,
    ).toBe(false);
  });
});

describe('validateManifest', () => {
  it('유효한 데이터 → 파싱 결과 반환', () => {
    const result = validateManifest(VALID);
    expect(result.appName).toBe('workdayvaluecalc');
  });

  it('2스텝 필드 포함 검증 → category/subtitle 반환', () => {
    const result = validateManifest(VALID);
    expect(result.category.primary).toBe('금융/재테크');
    expect(result.subtitle).toBe('시급과 노동 가치를 계산해요');
    expect(result.searchKeywords).toHaveLength(3);
  });

  it('잘못된 데이터 → 어떤 필드가 왜 실패했는지 명확히 출력', () => {
    expect(() =>
      validateManifest({ ...VALID, appName: 'BadName', supportEmail: 'bad' }),
    ).toThrowError(/appName|supportEmail/);
  });

  it('subtitle 느낌표 → 에러 메시지에 subtitle 포함', () => {
    expect(() =>
      validateManifest({ ...VALID, subtitle: '계산해요!' }),
    ).toThrowError(/subtitle/);
  });
});
