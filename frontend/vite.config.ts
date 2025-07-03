import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Use path.resolve to provide an absolute path for the alias
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
});
