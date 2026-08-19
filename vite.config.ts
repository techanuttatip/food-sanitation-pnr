import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/line-api': {
        target: 'https://api.line.me',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/line-api/, ''),
        secure: false,
      },
      '/webhook-site': {
        target: 'https://webhook.site',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/webhook-site/, ''),
        secure: false,
      },
    },
  },
});
