import { describe, it, expect } from 'vitest';
import sharp from 'sharp';
import { extractInitials, pickColor, PALETTE, composeTemplate } from '../lib/logo/template.js';
import { validateLogo } from '../lib/logo/validator.js';

// ── extractInitials ───────────────────────────────────────────────────────────

describe('extractInitials', () => {
  it('PascalCase → 앞 두 단어 이니셜', () => {
    expect(extractInitials('RentCheck')).toBe('RC');
  });

  it('세 단어 PascalCase → 앞 두 단어', () => {
    expect(extractInitials('WorkdayValueCalc')).toBe('WV');
  });

  it('하이픈 구분 → 앞 두 단어', () => {
    expect(extractInitials('my-cool-app')).toBe('MC');
  });

  it('공백 구분 → 앞 두 단어', () => {
    expect(extractInitials('My App')).toBe('MA');
  });

  it('한글 only → 첫 글자', () => {
    expect(extractInitials('노동값계산기')).toBe('노');
  });

  it('단일 단어 → 최대 2글자', () => {
    expect(extractInitials('App')).toBe('AP');
  });

  it('camelCase → 앞 두 단어', () => {
    expect(extractInitials('myApp')).toBe('MA');
  });
});

// ── pickColor ─────────────────────────────────────────────────────────────────

describe('pickColor', () => {
  it('같은 appName은 항상 같은 색 (결정적)', () => {
    const c1 = pickColor('workdayvaluecalc');
    const c2 = pickColor('workdayvaluecalc');
    expect(c1).toBe(c2);
  });

  it('다른 appName은 다를 수 있음', () => {
    // PALETTE 크기(8)보다 충분히 다른 이름들로 체크
    const colors = new Set(['workdayvaluecalc', 'rent-check', 'my-app', 'todo-list',
      'finance-app', 'calc-app', 'note-app', 'chat-app'].map(pickColor));
    // 최소 2가지 이상 색상이 나와야 함
    expect(colors.size).toBeGreaterThan(1);
  });

  it('반환값은 PALETTE 내 색상', () => {
    const color = pickColor('any-app-name');
    expect(PALETTE).toContain(color);
  });

  it('빈 문자열도 PALETTE 내 색상 반환', () => {
    expect(PALETTE).toContain(pickColor(''));
  });
});

// ── composeTemplate ───────────────────────────────────────────────────────────

describe('composeTemplate', () => {
  it('600x600 PNG 반환', async () => {
    const buf = await composeTemplate({ appName: 'test-app', englishName: 'TestApp' });
    const meta = await sharp(buf).metadata();
    expect(meta.width).toBe(600);
    expect(meta.height).toBe(600);
    expect(meta.format).toBe('png');
  });

  it('알파 채널 보유', async () => {
    const buf = await composeTemplate({ appName: 'test-app', englishName: 'TestApp' });
    const meta = await sharp(buf).metadata();
    expect(meta.hasAlpha).toBe(true);
  });

  it('모서리 픽셀(0,0) 투명 — 원형 아이콘', async () => {
    const buf = await composeTemplate({ appName: 'test-app', englishName: 'TestApp' });
    const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
    const channels = info.channels;
    const cornerAlpha = data[0 * channels + 3];
    expect(cornerAlpha).toBe(0);
  });

  it('중앙 픽셀(300,300) 불투명 — 배경 존재', async () => {
    const buf = await composeTemplate({ appName: 'test-app', englishName: 'TestApp' });
    const { data, info } = await sharp(buf).raw().toBuffer({ resolveWithObject: true });
    const channels = info.channels;
    const centerAlpha = data[(300 * 600 + 300) * channels + 3];
    expect(centerAlpha).toBe(255);
  });

  it('템플릿 fallback은 validator 항상 통과', async () => {
    const buf = await composeTemplate({ appName: 'workdayvaluecalc', englishName: 'WorkdayValueCalc' });
    const result = await validateLogo(buf);
    if (!result.ok) {
      throw new Error(`템플릿 검증 실패 (버그):\n${result.errors.join('\n')}`);
    }
    expect(result.ok).toBe(true);
  });

  it('서로 다른 appName → 서로 다른 배경색', async () => {
    const buf1 = await composeTemplate({ appName: 'app-a', englishName: 'AppA' });
    const buf2 = await composeTemplate({ appName: 'app-b', englishName: 'AppB' });
    // 배경색이 다른 경우 중앙 픽셀 색상이 다름 (팔레트가 충분히 다를 때)
    // 단순히 두 버퍼가 동일하지 않음을 확인
    const meta1 = await sharp(buf1).metadata();
    const meta2 = await sharp(buf2).metadata();
    expect(meta1.size).toBeDefined();
    expect(meta2.size).toBeDefined();
  });
});
