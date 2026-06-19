import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: ['daisy-unrumoured-showingly.ngrok-free.dev', '.ngrok-free.dev', '.ngrok-free.app'],
    hmr: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
