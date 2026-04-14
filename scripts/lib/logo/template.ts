import sharp from 'sharp';

export const PALETTE = [
  '#3B82F6', // blue-500
  '#8B5CF6', // violet-500
  '#EC4899', // pink-500
  '#F59E0B', // amber-500
  '#10B981', // emerald-500
  '#06B6D4', // cyan-500
  '#EF4444', // red-500
  '#6366F1', // indigo-500
] as const;

/** appName 해시로 팔레트 색상 결정 (결정적) */
export function pickColor(appName: string): string {
  let hash = 0;
  for (const ch of appName) {
    hash = ((hash * 31) + ch.charCodeAt(0)) >>> 0;
  }
  return PALETTE[hash % PALETTE.length];
}

/**
 * 영어 이름에서 이니셜 추출 (최대 2글자)
 * - 한글만 있으면 첫 글자
 * - camelCase / 하이픈 / 공백 경계에서 단어 분리 → 앞 두 단어의 첫 글자
 */
export function extractInitials(englishName: string): string {
  if (/^[가-힣]/.test(englishName)) {
    return englishName[0];
  }

  const words = englishName
    .replace(/([a-z])([A-Z])/g, '$1 $2')    // camelCase 분리
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2') // 연속 대문자 분리
    .replace(/[-_]+/g, ' ')                  // 하이픈/언더스코어 → 공백
    .split(/\s+/)
    .filter(Boolean);

  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return words[0].slice(0, 2).toUpperCase();
}

/**
 * 600×600 원형 PNG 아이콘 합성
 * 1. SVG로 배경색 + 이니셜 텍스트 레이어 생성
 * 2. 원형 마스크를 dest-in 합성 → 모서리 투명
 */
export async function composeTemplate(config: {
  appName: string;
  englishName: string;
}): Promise<Buffer> {
  const SIZE = 600;
  const bg = pickColor(config.appName);
  const initials = extractInitials(config.englishName);
  const fontSize = Math.round(SIZE * 0.38);

  // Step 1: 배경 + 텍스트 SVG → PNG
  const baseSvg = Buffer.from(
    `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
      <rect width="${SIZE}" height="${SIZE}" fill="${bg}"/>
      <text
        x="${SIZE / 2}"
        y="${SIZE / 2}"
        font-family="Arial,Helvetica,sans-serif"
        font-weight="bold"
        font-size="${fontSize}"
        fill="white"
        text-anchor="middle"
        dominant-baseline="central"
      >${initials}</text>
    </svg>`,
  );

  const base = await sharp(baseSvg).ensureAlpha().png().toBuffer();

  // Step 2: 원형 마스크 (dest-in → 원 외부 투명)
  const circleMask = Buffer.from(
    `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="white"/>
    </svg>`,
  );

  return sharp(base)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}
