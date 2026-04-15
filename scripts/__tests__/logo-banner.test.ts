import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { composeBanner } from '../lib/logo/banner.js';
import { composeTemplate } from '../lib/logo/template.js';

async function makeLogo(): Promise<Buffer> {
  return composeTemplate({ appName: 'test-app', englishName: 'TestApp' });
}

describe('composeBanner', () => {
  it('1932×828 PNG 반환', async () => {
    const logo = await makeLogo();
    const banner = await composeBanner({
      logo,
      koreanName: '테스트 앱',
      subtitle: '서브타이틀',
      backgroundColor: '#3182F6',
    });
    const meta = await sharp(banner).metadata();
    expect(meta.width).toBe(1932);
    expect(meta.height).toBe(828);
    expect(meta.format).toBe('png');
  });

  it('backgroundColor 없어도 생성 (기본값 적용)', async () => {
    const logo = await makeLogo();
    const banner = await composeBanner({
      logo,
      koreanName: '노동값 계산기',
      subtitle: '시급과 노동 가치를 계산해요',
    });
    const meta = await sharp(banner).metadata();
    expect(meta.width).toBe(1932);
    expect(meta.height).toBe(828);
  });

  it('결정적 — 동일 입력은 동일 출력', async () => {
    const logo = await makeLogo();
    const cfg = {
      logo,
      koreanName: '테스트',
      subtitle: '서브',
      backgroundColor: '#3182F6',
    };
    const b1 = await composeBanner(cfg);
    const b2 = await composeBanner(cfg);
    expect(b1.equals(b2)).toBe(true);
  });

  it('서로 다른 배경색 → 서로 다른 배경 픽셀', async () => {
    const logo = await makeLogo();
    const banner1 = await composeBanner({ logo, koreanName: 'App', subtitle: 'sub', backgroundColor: '#3182F6' });
    const banner2 = await composeBanner({ logo, koreanName: 'App', subtitle: 'sub', backgroundColor: '#1B9E4B' });

    // Sample top-left corner (10,10) — clear of logo (starts at x=164) and text (x=644)
    const { data: d1, info: i1 } = await sharp(banner1).raw().toBuffer({ resolveWithObject: true });
    const { data: d2 } = await sharp(banner2).raw().toBuffer({ resolveWithObject: true });
    const ch = i1.channels;
    const sampleIdx = (10 * 1932 + 10) * ch; // R channel at (10,10)
    // #3182F6 R=0x31=49, #1B9E4B R=0x1B=27 — clearly different
    expect(d1[sampleIdx]).not.toBe(d2[sampleIdx]);
  });
});
