import sharp from 'sharp';

export interface ValidationResult {
  ok: boolean;
  errors: string[];
}

/**
 * 앱인토스 로고 가이드 검증:
 * - 600x600 PNG + 알파 채널
 * - 배경 밝기 HSL L ≤ 85% (흰색/미색 금지)
 * - 원형 아이콘: 모서리 픽셀 투명
 */
export async function validateLogo(buffer: Buffer): Promise<ValidationResult> {
  const errors: string[] = [];
  const meta = await sharp(buffer).metadata();

  // 1. Size
  if (meta.width !== 600 || meta.height !== 600) {
    errors.push(`크기 불일치: ${meta.width}x${meta.height} (600x600 필요)`);
    return { ok: false, errors };
  }

  // 2. Format
  if (meta.format !== 'png') {
    errors.push(`포맷 불일치: ${meta.format} (PNG 필요)`);
  }

  // 3. Alpha
  if (!meta.hasAlpha) {
    errors.push('알파 채널 없음 (PNG with alpha 필요)');
  }

  if (meta.format === 'png' && meta.hasAlpha) {
    const channels = meta.channels ?? 4;
    const { data } = await sharp(buffer).raw().toBuffer({ resolveWithObject: true });

    // 4. Background brightness — sample top of circle (300, 100): within circle, above text area
    // (300, 300) 중앙은 이니셜 텍스트에 가려져 흰색일 수 있음 → 텍스트 위 영역 샘플링
    const centerIdx = (100 * 600 + 300) * channels;
    const r = data[centerIdx];
    const g = data[centerIdx + 1];
    const b = data[centerIdx + 2];
    const rn = r / 255, gn = g / 255, bn = b / 255;
    const l = (Math.max(rn, gn, bn) + Math.min(rn, gn, bn)) / 2;

    if (l > 0.85) {
      errors.push(
        `배경이 너무 밝음 (HSL L=${(l * 100).toFixed(1)}%, 85% 이하 필요) — 흰색/미색 배경 금지`,
      );
    }

    // 5. Circular: corner pixel (0,0) must be transparent
    // (0,0) is at distance √(300²+300²) ≈ 424 > 300 from center → outside inscribed circle
    const cornerAlpha = data[0 * channels + 3];
    if (cornerAlpha > 0) {
      errors.push(
        `원형 아이콘 아님: 모서리 픽셀(0,0)이 투명하지 않음 (alpha=${cornerAlpha})`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}
