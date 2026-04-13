/**
 * UI Review Script
 * 각 라우트의 스크린샷을 찍어 scripts/screenshots/ 에 저장합니다.
 *
 * 사용법:
 *   1. 별도 터미널에서 `npm run dev` 실행
 *   2. `node scripts/ui-review.mjs` 실행
 */

import puppeteer from 'puppeteer';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = 'http://localhost:5173';
const OUT_DIR = join(__dirname, 'screenshots');

mkdirSync(OUT_DIR, { recursive: true });

// 리뷰할 경로와 사전 설정 (localStorage seeding 포함)
const SCENARIOS = [
  {
    name: '01-home-no-profile',
    path: '/',
    description: '홈 — 프로필 미설정 상태',
    setup: async (page) => {
      await page.evaluate(() => localStorage.clear());
    },
  },
  {
    name: '02-home-with-profile',
    path: '/',
    description: '홈 — 프로필 설정 후 상태',
    setup: async (page) => {
      await page.evaluate(() => {
        localStorage.setItem('wdv_profile_v1', JSON.stringify({
          payType: 'monthly',
          payAmount: 3000000,
          workHoursPerDay: 8,
          workDaysPerWeek: 5,
          includeLunchBreak: false,
        }));
      });
    },
  },
  {
    name: '03-settings',
    path: '/settings',
    description: '급여 설정 페이지',
    setup: async () => {},
  },
  {
    name: '04-scan',
    path: '/scan',
    description: '스캔 페이지',
    setup: async (page) => {
      await page.evaluate(() => {
        localStorage.setItem('wdv_ai_notice_v1', JSON.stringify({
          version: 1,
          scanAiNoticeAcknowledged: true,
        }));
      });
    },
  },
  {
    name: '05-result-no-state',
    path: '/result',
    description: '결과 페이지 — calcId 없음 (빈 상태)',
    setup: async () => {},
  },
  {
    name: '06-fixed-expenses',
    path: '/fixed-expenses',
    description: '고정지출 스텁',
    setup: async () => {},
  },
  {
    name: '07-savings-goal',
    path: '/savings-goal',
    description: '목표저축 스텁',
    setup: async () => {},
  },
  {
    name: '08-history',
    path: '/history',
    description: '기록 스텁',
    setup: async () => {},
  },
];

async function run() {
  console.log('🚀 UI Review 시작...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();

  // 토스 앱 모바일 뷰포트 (iPhone 14 기준)
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });

  // SDK 콘솔 에러 수집
  const consoleErrors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  for (const scenario of SCENARIOS) {
    console.log(`📸 ${scenario.name}: ${scenario.description}`);

    // 홈에서 시작해서 localStorage 설정
    await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle0' });
    await scenario.setup(page);

    // 목적 경로로 이동
    await page.goto(`${BASE_URL}${scenario.path}`, { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 300)); // 애니메이션 대기

    const outPath = join(OUT_DIR, `${scenario.name}.png`);
    await page.screenshot({ path: outPath, fullPage: true });
    console.log(`   → 저장됨: scripts/screenshots/${scenario.name}.png`);
  }

  await browser.close();

  if (consoleErrors.length > 0) {
    console.log('\n⚠️  콘솔 에러:');
    consoleErrors.forEach(e => console.log(`   - ${e}`));
  }

  console.log('\n✅ 완료. scripts/screenshots/ 폴더를 확인하세요.');
}

run().catch(console.error);
// Already defined above — this file is complete
