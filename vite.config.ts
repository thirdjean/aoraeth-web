import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Restored for local development and extension compatibility
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        whiteboard: './index.html'
      }
    }
  }
})
