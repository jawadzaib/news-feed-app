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
  server: {
    host: true,
    port: 3000, // Ensure this matches your docker-compose.yml host port (it was 3001 previously)
    watch: {
      usePolling: true,
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './vitest.setup.ts',
    css: true,
    deps: {
      inline: ['@testing-library/react'],
    },
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
