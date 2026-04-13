import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'workdayvaluecalc',
  brand: {
    displayName: '노동값 계산기',
    primaryColor: '#3182F6',
    icon: '',
  },
  web: {
    host: 'localhost',
    port: 5173,
    commands: {
      dev: 'vite --host',
      build: 'vite build',
    },
  },
  permissions: [],
});
