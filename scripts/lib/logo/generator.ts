/**
 * DALL-E 3 기반 로고 생성 (선택)
 *
 * 활성화 조건:
 *   APPS_IN_TOSS_USE_GENERATOR=true
 *   OPENAI_API_KEY
 *
 * 실패 / API 키 없음 → { ok: false } 반환 → 호출자(index.ts)가 template로 fallback
 */

import sharp from 'sharp';

export type GenerateResult =
  | { ok: true; buffer: Buffer }
  | { ok: false; reason: string };

export interface GenerateConfig {
  englishName: string;
  conceptDescription: string;
  backgroundColor?: string;
}

// ── 프롬프트 ────────────────────────────────────────────────────────────────

function buildPrompt(config: GenerateConfig): string {
  const bgLine = config.backgroundColor
    ? `Solid background color ${config.backgroundColor} filling the entire square.`
    : 'Solid vivid background color filling the entire square.';

  return (
    `A minimalist app icon for "${config.englishName}". ` +
    bgLine + ' ' +
    `Single centered symbol: ${config.conceptDescription}. ` +
    `Symbol is simple, geometric, and clearly recognizable at 40x40px. ` +
    `Flat design, modern Korean fintech app icon style (clean, single focal point). ` +
    `No text, no letters, no numbers, no wordmark anywhere in the image. ` +
    `Square composition.`
  );
}

// ── DALL-E 3 API 호출 ────────────────────────────────────────────────────────

async function callDallE3(prompt: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY 환경변수가 설정되지 않았습니다');

  const res = await fetch('https://api.openai.com/v1/images/generations', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'dall-e-3',
      prompt,
      size: '1024x1024',
      quality: 'standard',
      response_format: 'b64_json',
      n: 1,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`DALL-E 3 오류 ${res.status}: ${body.slice(0, 300)}`);
  }

  const json = (await res.json()) as { data: Array<{ b64_json: string }> };
  return Buffer.from(json.data[0].b64_json, 'base64');
}

// ── 후처리: 1024→600 리사이즈 + 원형 마스크 ─────────────────────────────────

async function postProcess(raw: Buffer): Promise<Buffer> {
  const SIZE = 600;

  const resized = await sharp(raw)
    .resize(SIZE, SIZE, { fit: 'cover' })
    .ensureAlpha()
    .png()
    .toBuffer();

  const circleMask = Buffer.from(
    `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
      <circle cx="${SIZE / 2}" cy="${SIZE / 2}" r="${SIZE / 2}" fill="white"/>
    </svg>`,
  );

  return sharp(resized)
    .composite([{ input: circleMask, blend: 'dest-in' }])
    .png()
    .toBuffer();
}

// ── 메인: 최대 2회 재시도, 실패 시 { ok: false } ────────────────────────────

const MAX_RETRIES = 2;

export async function tryGenerate(config: GenerateConfig): Promise<GenerateResult> {
  const prompt = buildPrompt(config);

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`  [generator] DALL-E 3 시도 ${attempt}/${MAX_RETRIES}...`);
      const raw = await callDallE3(prompt);
      const buffer = await postProcess(raw);
      console.log(`  [generator] 생성 완료 (시도 ${attempt})`);
      return { ok: true, buffer };
    } catch (e) {
      const reason = (e as Error).message;
      console.warn(`  [generator] 시도 ${attempt} 실패: ${reason}`);
      if (attempt === MAX_RETRIES) {
        return { ok: false, reason };
      }
    }
  }

  return { ok: false, reason: '알 수 없는 오류' };
}
