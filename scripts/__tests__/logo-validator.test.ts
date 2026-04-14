import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { validateLogo } from '../lib/logo/validator.js';
import { composeTemplate } from '../lib/logo/template.js';

/** 테스트용 픽스처 이미지 생성 헬퍼 */
async function makeFixture(opts: {
  width?: number;
  height?: number;
  r?: number; g?: number; b?: number;
  alpha?: number;
  channels?: 3 | 4;
  circular?: boolean;
}): Promise<Buffer> {
  const {
    width = 600, height = 600,
    r = 59, g = 130, b = 246,
    alpha = 255,
    channels = 4,
    circular = false,
  } = opts;

  if (circular) {
    // 원형 마스크 적용 (모서리 투명)
    const base = await sharp({
      create: { width, height, channels: 4, background: { r, g, b, alpha } },
    }).png().toBuffer();

    const mask = Buffer.from(
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 2}" fill="white"/>
      </svg>`,
    );

    return sharp(base)
      .composite([{ input: mask, blend: 'dest-in' }])
      .png()
      .toBuffer();
  }

  return sharp({
    create: { width, height, channels, background: { r, g, b, alpha } },
  }).png().toBuffer();
}

describe('validateLogo', () => {
  it('정상 템플릿 이미지 → 통과', async () => {
    const buf = await composeTemplate({ appName: 'test-app', englishName: 'TestApp' });
    const result = await validateLogo(buf);
    expect(result.ok).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('정상 원형 600x600 이미지 → 통과', async () => {
    const buf = await makeFixture({ circular: true });
    const result = await validateLogo(buf);
    expect(result.ok).toBe(true);
  });

  it('흰 배경 (HSL L > 85%) → 실패', async () => {
    // 흰색: r=255, g=255, b=255 → L=100%
    const buf = await makeFixture({ circular: true, r: 255, g: 255, b: 255 });
    const result = await validateLogo(buf);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('너무 밝음'))).toBe(true);
  });

  it('사이즈 불일치 (400x400) → 실패', async () => {
    const buf = await makeFixture({ width: 400, height: 400 });
    const result = await validateLogo(buf);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('크기 불일치'))).toBe(true);
  });

  it('알파 채널 없는 PNG → 실패', async () => {
    const buf = await makeFixture({ channels: 3 });
    const result = await validateLogo(buf);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('알파 채널'))).toBe(true);
  });

  it('원형 위반 — 정사각형 (모서리 불투명) → 실패', async () => {
    // 600x600이지만 원형이 아님 (모서리 픽셀 alpha=255)
    const buf = await makeFixture({ circular: false, channels: 4 });
    const result = await validateLogo(buf);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('원형 아이콘 아님'))).toBe(true);
  });

  it('오류 메시지 구체적으로 포함', async () => {
    const buf = await makeFixture({ width: 400, height: 300 });
    const result = await validateLogo(buf);
    expect(result.errors[0]).toMatch(/400x300/);
  });
});
