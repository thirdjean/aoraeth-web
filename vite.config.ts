import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // Important for extension pages
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        whiteboard: './index.html'
      }
    }
  }
})
