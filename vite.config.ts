import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    return {
      // Build output configured to `docs/` so GitHub Pages can serve the site from this repo folder.
      build: {
        outDir: 'docs',
        emptyOutDir: true,
      },
      // base is set for GitHub Pages project site. Change or remove if you deploy elsewhere.
      base: '/kominfo-photobooth/',
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
