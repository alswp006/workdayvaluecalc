import { z } from 'zod';

export const AppsInTossManifestSchema = z.object({
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
