// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import cloudflare from '@astrojs/cloudflare';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://astro.build/config
export default defineConfig({
  output: 'server',
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@test': path.resolve(__dirname, './test'),
      },
    },
  },
  adapter:
    // eslint-disable-next-line no-undef
    process.env.CLOUDFLARE === 'true'
      ? cloudflare({
          platformProxy: {
            enabled: true,
          },
        })
      : node({
          mode: 'standalone',
        }),
});
