import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      // 앱인토스 SDK는 런타임에 토스 앱이 주입 — 번들에 포함하면 안 됨
      external: ['@apps-in-toss/web-framework', '@apps-in-toss/framework'],
    },
  },
});
