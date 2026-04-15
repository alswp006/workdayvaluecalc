#!/usr/bin/env tsx
/**
 * 앱인토스 미니앱 등록 산출물 생성 스크립트
 *
 * 사용법:
 *   npx tsx scripts/generate-apps-in-toss.ts --dry-run        (기본값)
 *   npx tsx scripts/generate-apps-in-toss.ts --write
 *   npx tsx scripts/generate-apps-in-toss.ts --write --force
 *   npx tsx scripts/generate-apps-in-toss.ts --skip-logo
 *   npx tsx scripts/generate-apps-in-toss.ts --skip-banner
 *   npx tsx scripts/generate-apps-in-toss.ts --config scripts/custom.config.ts
 */

import { existsSync } from 'node:fs';
import fs from 'node:fs/promises';
import nodePath from 'node:path';
import { pathToFileURL } from 'node:url';
import { validateManifest } from './lib/manifest.js';
import { generateLogo } from './lib/logo/index.js';
import { composeBanner } from './lib/logo/banner.js';
import type { AppsInTossManifest } from './lib/manifest.js';
import type { LogoConfig } from './lib/logo/index.js';

// ── 설정 타입 ─────────────────────────────────────────────────────────────────

export interface AppsInTossConfig extends AppsInTossManifest {
  logo: {
    conceptDescription: string;
    /** 배경색 HEX. 미지정 시 appName 해시로 결정. */
    backgroundColor?: string;
  };
}

// ── CLI 인수 파싱 ──────────────────────────────────────────────────────────────

interface CliOptions {
  dryRun: boolean;
  write: boolean;
  force: boolean;
  skipLogo: boolean;
  skipBanner: boolean;
  configPath: string;
}

function parseArgs(argv: string[]): CliOptions {
  const args = argv.slice(2);
  const hasWrite = args.includes('--write');
  const configIdx = args.indexOf('--config');
  return {
    dryRun: !hasWrite,
    write: hasWrite,
    force: args.includes('--force'),
    skipLogo: args.includes('--skip-logo'),
    skipBanner: args.includes('--skip-banner'),
    configPath:
      configIdx >= 0 && args[configIdx + 1]
        ? args[configIdx + 1]
        : 'scripts/apps-in-toss.config.ts',
  };
}

// ── 설정 파일 로드 ─────────────────────────────────────────────────────────────

async function loadConfig(configPath: string): Promise<AppsInTossConfig> {
  const abs = nodePath.resolve(process.cwd(), configPath);
  if (!existsSync(abs)) {
    throw new Error(`설정 파일을 찾을 수 없습니다: ${abs}`);
  }
  const mod = await import(pathToFileURL(abs).href);
  const config = mod.default ?? mod;
  return config as AppsInTossConfig;
}

// ── 복붙용 텍스트 생성 ────────────────────────────────────────────────────────

function buildManifestText(manifest: AppsInTossManifest, logoSource: string): string {
  const LINE = '─────────────────────';
  return [
    `📋 앱인토스 등록 정보 — ${manifest.englishName}`,
    LINE,
    '── 1스텝: 기본 정보',
    `한국어 앱 이름:  ${manifest.koreanName}`,
    `영어 앱 이름:    ${manifest.englishName}`,
    `appName:         ${manifest.appName}`,
    `사용 연령:       ${manifest.ageRating}`,
    `홈페이지:        ${manifest.homepage ?? '(없음)'}`,
    `고객문의 이메일: ${manifest.supportEmail}`,
    LINE,
    '── 2스텝: 카테고리 및 노출',
    `카테고리 (대):   ${manifest.category.primary}`,
    `카테고리 (중):   ${manifest.category.secondary ?? '(없음)'}`,
    `카테고리 (소):   ${manifest.category.tertiary ?? '(없음)'}`,
    `부제:            ${manifest.subtitle}`,
    `상세 설명:`,
    manifest.description,
    `검색 키워드:     ${manifest.searchKeywords.join(' / ')}`,
    LINE,
    `🎨 로고 소스: ${logoSource}`,
    '',
  ].join('\n');
}

// ── 산출물 파일 목록 ─────────────────────────────────────────────────────────

interface OutputFile {
  path: string;
  description: string;
}

function listOutputFiles(skipLogo: boolean, skipBanner: boolean): OutputFile[] {
  const files: OutputFile[] = [
    { path: 'artifacts/apps-in-toss-manifest.json', description: '매니페스트 JSON' },
    { path: 'artifacts/apps-in-toss-manifest.txt', description: '복붙용 텍스트' },
    { path: 'artifacts/assets-meta.json', description: '에셋 생성 메타데이터' },
  ];
  if (!skipLogo) {
    files.push(
      { path: 'artifacts/logo.png', description: '앱 로고 (600×600 PNG)' },
      { path: 'artifacts/logo-dark.png', description: '다크모드 로고 (600×600 PNG)' },
    );
  }
  if (!skipBanner) {
    files.push({ path: 'artifacts/banner.png', description: '가로형 배너 (1932×828 PNG)' });
  }
  return files;
}

// ── 메인 ─────────────────────────────────────────────────────────────────────

async function main() {
  const opts = parseArgs(process.argv);
  const cwd = process.cwd();
  const artifactsDir = nodePath.join(cwd, 'artifacts');

  // 1. 설정 로드 및 검증
  console.log(`\n⚙️  설정 로드: ${opts.configPath}`);
  const rawConfig = await loadConfig(opts.configPath);
  const manifest = validateManifest(rawConfig);
  console.log('✓ 매니페스트 검증 통과');

  const outputFiles = listOutputFiles(opts.skipLogo, opts.skipBanner);

  // 2. Dry-run: 계획 출력 (로고 생성 포함해서 검증)
  if (opts.dryRun) {
    let logoSource = 'skipped';
    if (!opts.skipLogo) {
      console.log('\n🎨 로고 생성 중 (미리보기)...');
      const logoConfig: LogoConfig = {
        appName: manifest.appName,
        englishName: manifest.englishName,
        logo: rawConfig.logo,
      };
      const lr = await generateLogo(logoConfig);
      logoSource = lr.source;
      console.log(`✓ 로고 생성 완료 (소스: ${lr.source})`);

      if (!opts.skipBanner) {
        console.log('🖼️  배너 생성 중 (미리보기)...');
        await composeBanner({
          logo: lr.logo,
          koreanName: manifest.koreanName,
          subtitle: manifest.subtitle,
          backgroundColor: rawConfig.logo.backgroundColor,
        });
        console.log('✓ 배너 생성 완료');
      }
    }
    const manifestTxt = buildManifestText(manifest, logoSource);
    console.log('\n🔍 Dry-run 모드 — 생성될 파일 목록:');
    for (const f of outputFiles) {
      const exists = existsSync(nodePath.join(cwd, f.path));
      const tag = exists ? '[충돌! --force 필요]' : '[새 파일]';
      console.log(`  ${tag} ${f.path}  (${f.description})`);
    }
    console.log('\n--- 매니페스트 미리보기 ---');
    console.log(manifestTxt);
    console.log('💡 실제 생성하려면 --write 플래그를 추가하세요');
    return;
  }

  // 3. Write 모드: 파일 충돌 체크 (로고 생성 전)
  await fs.mkdir(artifactsDir, { recursive: true });

  for (const f of outputFiles) {
    const abs = nodePath.join(cwd, f.path);
    if (existsSync(abs) && !opts.force) {
      console.error(`\n❌ 파일이 이미 존재합니다: ${f.path}`);
      console.error('   덮어쓰려면 --force 플래그를 추가하세요');
      process.exit(1);
    }
  }

  // 4. 로고 생성
  let logoResult: Awaited<ReturnType<typeof generateLogo>> | null = null;
  if (!opts.skipLogo) {
    console.log('\n🎨 로고 생성 중...');
    const logoConfig: LogoConfig = {
      appName: manifest.appName,
      englishName: manifest.englishName,
      logo: rawConfig.logo,
    };
    logoResult = await generateLogo(logoConfig);
    console.log(`✓ 로고 생성 완료 (소스: ${logoResult.source})`);
  }

  // 5. 배너 생성
  let bannerBuffer: Buffer | null = null;
  if (!opts.skipBanner && logoResult) {
    console.log('\n🖼️  배너 생성 중...');
    bannerBuffer = await composeBanner({
      logo: logoResult.logo,
      koreanName: manifest.koreanName,
      subtitle: manifest.subtitle,
      backgroundColor: rawConfig.logo.backgroundColor,
    });
    console.log('✓ 배너 생성 완료');
  }

  // 6. 파일 쓰기
  const logoSource = logoResult?.source ?? 'skipped';
  const manifestJson = JSON.stringify(manifest, null, 2);
  const manifestTxt = buildManifestText(manifest, logoSource);
  const assetsMeta = JSON.stringify(
    {
      logoSource,
      hasBanner: bannerBuffer !== null,
      generatedAt: new Date().toISOString(),
      appName: manifest.appName,
    },
    null,
    2,
  );

  await fs.writeFile(nodePath.join(artifactsDir, 'apps-in-toss-manifest.json'), manifestJson, 'utf8');
  await fs.writeFile(nodePath.join(artifactsDir, 'apps-in-toss-manifest.txt'), manifestTxt, 'utf8');
  await fs.writeFile(nodePath.join(artifactsDir, 'assets-meta.json'), assetsMeta, 'utf8');

  if (logoResult) {
    await fs.writeFile(nodePath.join(artifactsDir, 'logo.png'), logoResult.logo);
    await fs.writeFile(nodePath.join(artifactsDir, 'logo-dark.png'), logoResult.darkLogo);
  }

  if (bannerBuffer) {
    await fs.writeFile(nodePath.join(artifactsDir, 'banner.png'), bannerBuffer);
  }

  console.log('\n✅ 산출물 생성 완료:');
  for (const f of outputFiles) {
    console.log(`  ${f.path}`);
  }
  console.log('\n' + manifestTxt);
}

main().catch((err) => {
  console.error('\n❌ 오류:', (err as Error).message);
  process.exit(1);
});
