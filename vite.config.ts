import path from "path";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'mock-api',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url === '/api/parser/receipt' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => {
              body += chunk;
            });
            req.on('end', () => {
              try {
                const parsed = JSON.parse(body);
                const image = parsed.image || '';
                const isPocketOrScreenshot = image.length > 50000;
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  vendor: isPocketOrScreenshot ? "Ikeja Electric Prepaid (@pocket_power)" : "INGESTED_MERCHANT",
                  amount: isPocketOrScreenshot ? 3500.00 : 120.00,
                  date: isPocketOrScreenshot ? "2026-05-26" : new Date().toISOString().split('T')[0],
                  memo: isPocketOrScreenshot 
                    ? "Bill payment for Ikeja Electricity recharge (pocket_p2p_2866688638339669)" 
                    : "Parsed from screen snapshot",
                  category_suggestion: isPocketOrScreenshot ? "utilities" : "general"
                }));
              } catch {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Invalid JSON request payload' }));
              }
            });
            return;
          }
          next();
        });
      }
    },
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.js',
      registerType: 'prompt', // Never auto-update service worker
      includeAssets: ['favicon.svg', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Kiny — Personal Finance OS',
        short_name: 'Kiny',
        description: 'Supabase-backed Neubrutalist Personal Finance OS',
        theme_color: '#000000',
        background_color: '#EAECDF',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.(?:googleapis|gstatic)\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
