import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import vercel from '@astrojs/vercel';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  site: 'https://built-with-agents.vercel.app',
  output: 'static',
  adapter: vercel({ webAnalytics: { enabled: true } }),
  integrations: [mdx(), react(), sitemap()],
  vite: { plugins: [tailwindcss()] },
});
