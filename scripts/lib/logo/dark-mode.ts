import sharp from 'sharp';

/** 다크모드 로고: 원본 Brightness 60% 조절 */
export async function deriveDarkMode(buffer: Buffer): Promise<Buffer> {
  return sharp(buffer)
    .modulate({ brightness: 0.6 })
    .png()
    .toBuffer();
}
