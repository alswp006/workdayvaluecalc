import { z } from 'zod';

export const AppsInTossManifestSchema = z.object({
  // ── 1스텝: 기본 정보 ──────────────────────────────────────
  koreanName: z.string().min(1).max(20),
  englishName: z.string().min(1).max(30),
  appName: z
    .string()
    .regex(
      /^[a-z0-9]+(-[a-z0-9]+)*$/,
      'appName은 kebab-case여야 합니다 (영문 소문자·숫자·하이픈만)',
    ),
  ageRating: z.enum(['전체', '만 12세 이상', '만 15세 이상', '만 19세 이상']),
  homepage: z.string().url('홈페이지는 유효한 URL이어야 합니다').optional(),
  supportEmail: z.string().email('유효한 이메일 주소여야 합니다'),

  // ── 2스텝: 카테고리 및 노출 ──────────────────────────────
  category: z.object({
    primary: z.string().min(1),
    secondary: z.string().optional(),
    tertiary: z.string().optional(),
  }),
  subtitle: z
    .string()
    .min(1)
    .max(20)
    .refine((s) => !/[!！?？。]/.test(s), '느낌표/물음표 금지')
    .refine((s) => !/(대박|진짜|완전|짱)/.test(s), '비속어/과장 표현 금지'),
  description: z.string().min(50).max(1000),
  searchKeywords: z.array(z.string().min(1).max(20)).min(3).max(10),
});

export type AppsInTossManifest = z.infer<typeof AppsInTossManifestSchema>;

export function validateManifest(data: unknown): AppsInTossManifest {
  const result = AppsInTossManifestSchema.safeParse(data);
  if (!result.success) {
    const lines = result.error.issues.map(
      (e) => `  • ${e.path.length > 0 ? e.path.join('.') : '(root)'}: ${e.message}`,
    );
    throw new Error(`매니페스트 검증 실패:\n${lines.join('\n')}`);
  }
  return result.data;
}
