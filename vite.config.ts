import path from "path";
import fs from "fs";
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Simple helper to load environment variables from .env.local
const loadEnvLocal = () => {
  try {
    const envPath = path.resolve(__dirname, '.env.local');
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8');
      content.split('\n').forEach(line => {
        const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
        if (match) {
          const key = match[1];
          let value = match[2] || '';
          if (value.startsWith('"') && value.endsWith('"')) {
            value = value.substring(1, value.length - 1);
          }
          process.env[key] = value.trim();
        }
      });
    }
  } catch (e) {
    console.warn('[VITE] Failed to load .env.local:', e);
  }
};
loadEnvLocal();

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
            req.on('end', async () => {
              try {
                const parsed = JSON.parse(body);
                const image = parsed.image || '';
                const fileType = parsed.fileType || 'image/jpeg';
                
                const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
                if (apiKey) {
                  console.log('[VITE] Route calling live Gemini API...');
                  const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
                  const mimeType = image.match(/^data:(image\/\w+);base64,/)?.[1] || fileType;
                  
                  const prompt = "You are an expert financial OCR parser for Kiny Personal Finance OS. Analyze the provided banking transaction screenshot or receipt. Extract the true transaction date, the exact currency amount as a float number, the vendor or beneficiary name, and the transaction narration or memo. Return ONLY a valid JSON object matching this schema, without markdown formatting blocks: { \"vendor\": string, \"amount\": number, \"date\": string, \"memo\": string, \"category_suggestion\": string }";
                  
                  const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      contents: [
                        {
                          parts: [
                            { text: prompt },
                            { inlineData: { mimeType, data: base64Data } }
                          ]
                        }
                      ]
                    })
                  });
                  
                  if (!response.ok) {
                    throw new Error(`Gemini API returned status ${response.status}`);
                  }
                  
                  const result = (await response.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
                  const responseText = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
                  const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
                  const parsedResponse = JSON.parse(cleanJson);
                  
                  res.writeHead(200, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify(parsedResponse));
                } else {
                  console.warn('[VITE] GEMINI_API_KEY not configured. Using fallback mock.');
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
                }
              } catch (e) {
                console.error('[VITE] Live receipt parser middleware error:', e);
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: 'Failed to process receipt image' }));
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
      registerType: 'autoUpdate', // Enforce dynamic auto-registration cycle
      includeAssets: ['favicon.svg', 'robots.txt', 'logo.svg'],
      manifest: {
        name: 'Kiny OS',
        short_name: 'Kiny',
        description: 'Supabase-backed Neubrutalist Personal Finance OS',
        start_url: '/',
        display: 'standalone',
        background_color: '#000000',
        theme_color: '#C6EF4E',
        orientation: 'portrait',
        icons: [
          {
            src: '/logo.svg',
            sizes: '192x192 512x512',
            type: 'image/svg+xml',
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
