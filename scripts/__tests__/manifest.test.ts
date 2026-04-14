import { describe, it, expect } from 'vitest';
import { AppsInTossManifestSchema, validateManifest } from '../lib/manifest.js';

const VALID = {
  koreanName: '노동값 계산기',
  englishName: 'WorkdayValueCalc',
  appName: 'workdayvaluecalc',
  ageRating: '전체' as const,
  supportEmail: 'support@aifactory.dev',
};

describe('AppsInTossManifestSchema', () => {
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

describe('validateManifest', () => {
  it('유효한 데이터 → 파싱 결과 반환', () => {
    const result = validateManifest(VALID);
    expect(result.appName).toBe('workdayvaluecalc');
  });

  it('잘못된 데이터 → 어떤 필드가 왜 실패했는지 명확히 출력', () => {
    expect(() =>
      validateManifest({ ...VALID, appName: 'BadName', supportEmail: 'bad' }),
    ).toThrowError(/appName|supportEmail/);
  });
});
