import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/aoraeth-web/', // Set base to repo name for GitHub Pages
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        whiteboard: './index.html'
      }
    }
  }
})
