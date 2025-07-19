import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
    // Bun optimizations
    hmr: {
      port: 5173,
    },
  },
  build: {
    outDir: 'dist/client',
    // Bun optimizations
    minify: 'esbuild',
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          auth: ['./src/client/context/auth-context'],
          utils: ['./src/client/services/bun-cache'],
        },
      },
    },
  },
  // Enable Bun optimizations
  esbuild: {
    jsx: 'automatic',
    jsxDev: true,
  },
  // Optimize for Bun runtime
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom'],
    esbuildOptions: {
      target: 'esnext',
    },
  },
});
