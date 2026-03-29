import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: '.',
  publicDir: 'public',
  resolve: {
    alias: {
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@engine': path.resolve(__dirname, 'src/engine'),
      '@client': path.resolve(__dirname, 'src/client'),
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3333',
      '/ws': {
        target: 'ws://localhost:3333',
        ws: true,
      },
    },
  },
  build: {
    outDir: 'dist',
  },
});
