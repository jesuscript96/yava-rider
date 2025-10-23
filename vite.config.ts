import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          maps: ['@googlemaps/js-api-loader'],
          calendar: ['react-big-calendar', 'moment']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
