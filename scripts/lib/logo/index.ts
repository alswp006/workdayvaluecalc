import { composeTemplate } from './template.js';
import { deriveDarkMode } from './dark-mode.js';
import { tryGenerate } from './generator.js';
import { validateLogo } from './validator.js';

export type LogoSource = 'generated' | 'template';

export interface LogoResult {
  logo: Buffer;
  darkLogo: Buffer;
  source: LogoSource;
}

export interface LogoConfig {
  appName: string;
  englishName: string;
  logo: {
    conceptDescription: string;
  };
}

export async function generateLogo(config: LogoConfig): Promise<LogoResult> {
  if (process.env.APPS_IN_TOSS_USE_GENERATOR === 'true') {
    const generated = await tryGenerate({
      englishName: config.englishName,
      conceptDescription: config.logo.conceptDescription,
    });

    if (generated.ok) {
      const validation = await validateLogo(generated.buffer);
      if (validation.ok) {
        return {
          logo: generated.buffer,
          darkLogo: await deriveDarkMode(generated.buffer),
          source: 'generated',
        };
      }
      console.warn('[logo] generated image failed validation — falling back to template');
      console.warn(validation.errors.map((e) => `  • ${e}`).join('\n'));
    }
  }

  const template = await composeTemplate(config);

  // 템플릿은 항상 검증 통과해야 함 — 실패 시 버그
  const validation = await validateLogo(template);
  if (!validation.ok) {
    throw new Error(
      `[logo] 템플릿 검증 실패 (버그):\n${validation.errors.map((e) => `  • ${e}`).join('\n')}`,
    );
  }

  return {
    logo: template,
    darkLogo: await deriveDarkMode(template),
    source: 'template',
  };
}
