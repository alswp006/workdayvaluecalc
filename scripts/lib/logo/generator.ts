/**
 * 이미지 생성 모델 기반 로고 생성 (선택)
 *
 * 활성화 조건:
 *   APPS_IN_TOSS_USE_GENERATOR=true
 *   ANTHROPIC_API_KEY (또는 사용할 모델의 API 키)
 *
 * 현재는 stub — 실제 이미지 생성 API 연동 시 구현.
 * 실패 시 template.ts fallback이 동작한다.
 */

export type GenerateResult =
  | { ok: true; buffer: Buffer }
  | { ok: false; reason: string };

export async function tryGenerate(_config: {
  englishName: string;
  conceptDescription: string;
}): Promise<GenerateResult> {
  // TODO: 이미지 생성 모델 API 연동
  // 프롬프트 예시:
  //   A minimal app icon for "${englishName}", a ${conceptDescription}.
  //   Single centered symbol on a solid vibrant background color.
  //   Flat design, simple geometric shape, circular composition.
  //   No text, no letters, no complex overlapping shapes.
  //   600x600 pixels, PNG with alpha.
  //
  // 검증 실패 시 최대 2회 재시도, 그래도 실패면 { ok: false } 반환 → 호출자가 template로 fallback
  return { ok: false, reason: 'generator not implemented — using template fallback' };
}
