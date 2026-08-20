import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
      manifest: {
        name: 'แอปตรวจสุขาภิบาลภาคสนาม อบต.โป่งน้ำร้อน',
        short_name: 'ตรวจภาคสนาม',
        description: 'แอปตรวจสุขาภิบาลสถานที่สะสมอาหาร อบต.โป่งน้ำร้อน อ.ฝาง จ.เชียงใหม่',
        theme_color: '#059669',
        background_color: '#f0fdf4',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/field',
        shortcuts: [
          {
            name: 'ตรวจภาคสนาม (Field App)',
            short_name: 'ตรวจสนาม',
            description: 'เปิดแอปตรวจสุขาภิบาลภาคสนาม',
            url: '/field',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
          {
            name: 'ระบบคอมพิวเตอร์ (Dashboard)',
            short_name: 'Dashboard',
            description: 'เปิดหน้าจอหลัก Desktop Dashboard',
            url: '/',
            icons: [{ src: 'pwa-192x192.png', sizes: '192x192' }],
          },
        ],
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
        categories: ['government', 'productivity', 'utilities'],
        lang: 'th',
        dir: 'ltr',
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
        // Cache all static assets
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Runtime caching for API calls
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 5 * 60, // 5 minutes
              },
            },
          },
          {
            urlPattern: /^https:\/\/unpkg\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cdn-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 7 * 24 * 60 * 60, // 1 week
              },
            },
          },
        ],
      },
    }),
  ],
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
