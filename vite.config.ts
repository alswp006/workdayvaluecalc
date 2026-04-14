import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const scanApiOrigin = env.VITE_SCAN_API_ORIGIN;

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    // VITE_SCAN_API_ORIGIN이 설정된 경우에만 /api 프록시 활성화 (CORS 완화)
    server: scanApiOrigin
      ? {
          proxy: {
            '/api': {
              target: scanApiOrigin,
              changeOrigin: true,
            },
          },
        }
      : {},
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        // 앱인토스 SDK는 런타임에 토스 앱이 주입 — 번들에 포함하면 안 됨
        external: ['@apps-in-toss/web-framework', '@apps-in-toss/framework'],
      },
    },
  };
});
