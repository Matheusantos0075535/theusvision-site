import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Publicado no GitHub Pages em theusvision.com.br/hub/
export default defineConfig({
  base: '/hub/',
  plugins: [react()],
})
