import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      react: path.resolve(__dirname, '../node_modules/react'),
      'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
    },
    dedupe: [
      'react',
      'react-dom',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router-dom',
      '@tanstack/react-query',
    ],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-dom/client',
      'react/jsx-runtime',
      'react/jsx-dev-runtime',
      'react-router-dom',
      '@tanstack/react-query',
      'react-hot-toast',
      'react-hook-form',
      'lucide-react',
      '@supabase/supabase-js',
      'primereact/api',
      'primereact/dialog',
      'primereact/button',
      'primereact/inputtext',
      'primereact/dropdown',
      'primereact/datatable',
      'primereact/column',
      'primereact/tooltip',
      'primereact/calendar',
      'primereact/multiselect',
      'primereact/confirmdialog',
      'primereact/chips',
      'driver.js',
      '@dnd-kit/core',
      '@dnd-kit/sortable',
      '@dnd-kit/utilities',
    ],
    holdUntilCrawlEnd: true,
  },
  server: {
    port: 5180,
    proxy: {
      // Proxy hacia el backend Express para evitar CORS en desarrollo
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      external: ['chart.js/auto'],
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (
              id.includes('react-dom') ||
              id.includes('react-router-dom') ||
              /[\\/]react[\\/]/.test(id) ||
              id.includes('react/jsx-runtime') ||
              id.includes('react/jsx-dev-runtime')
            ) {
              return 'vendor-react'
            }
            if (id.includes('primereact')) {
              return 'vendor-primereact'
            }
            if (id.includes('@tanstack')) {
              return 'vendor-query'
            }
            if (id.includes('@supabase')) {
              return 'vendor-supabase'
            }
            if (id.includes('lucide-react')) {
              return 'vendor-icons'
            }
          }
        },
      },
    },
  },
})
