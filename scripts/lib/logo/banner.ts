import sharp from 'sharp';

export interface BannerConfig {
  logo: Buffer;
  koreanName: string;
  subtitle: string;
  /** 배경색 HEX (ex. '#3182F6'). 미지정 시 토스 블루. */
  backgroundColor?: string;
}

const BANNER_W = 1932;
const BANNER_H = 828;
const LOGO_SIZE = 400;
const LOGO_LEFT = 164;
const LOGO_TOP = 214; // vertically centered: (828 - 400) / 2 = 214
const TEXT_X = 644;   // logo right edge (164+400) + 80px gap

/**
 * 앱인토스 가로형 배너 생성 (1932×828 PNG).
 * 좌측: 앱 로고(400×400), 우측: 한국어 앱 이름 + 부제
 */
export async function composeBanner(config: BannerConfig): Promise<Buffer> {
  const { logo, koreanName, subtitle, backgroundColor = '#3182F6' } = config;
  const bg = hexToRgb(backgroundColor);

  // 1. Resize logo to LOGO_SIZE×LOGO_SIZE (preserve alpha for circular shape)
  const resizedLogo = await sharp(logo)
    .resize(LOGO_SIZE, LOGO_SIZE, { fit: 'fill' })
    .png()
    .toBuffer();

  // 2. Build SVG text overlay
  const textSvg = Buffer.from(
    `<svg width="${BANNER_W}" height="${BANNER_H}" xmlns="http://www.w3.org/2000/svg">` +
      `<text x="${TEXT_X}" y="340" font-family="sans-serif" font-weight="bold" font-size="96" fill="white">${escapeXml(koreanName)}</text>` +
      `<text x="${TEXT_X}" y="460" font-family="sans-serif" font-size="52" fill="rgba(255,255,255,0.85)">${escapeXml(subtitle)}</text>` +
    `</svg>`,
  );

  // 3. Compose: solid background → logo → text
  return sharp({
    create: {
      width: BANNER_W,
      height: BANNER_H,
      channels: 3,
      background: bg,
    },
  })
    .composite([
      { input: resizedLogo, left: LOGO_LEFT, top: LOGO_TOP },
      { input: textSvg, left: 0, top: 0 },
    ])
    .png()
    .toBuffer();
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.slice(0, 2), 16),
    g: parseInt(clean.slice(2, 4), 16),
    b: parseInt(clean.slice(4, 6), 16),
  };
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
