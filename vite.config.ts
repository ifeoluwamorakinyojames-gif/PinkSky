import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/',
  server: {
    proxy: {
      '/api/admin': { target: 'http://localhost:8788', changeOrigin: true },
      '/api/bookings': { target: 'http://localhost:8788', changeOrigin: true }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: { maxParallelFileOps: 128 }
  }
});
