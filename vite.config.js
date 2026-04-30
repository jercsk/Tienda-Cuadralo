import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Esta configuración ayuda a Netlify a encontrar tus archivos App.jsx y main.jsx
// aunque no estén dentro de una carpeta "src"
export default defineConfig({
  plugins: [react()],
  root: './', 
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: './index.html',
      },
    },
  },
  resolve: {
    alias: {
      // Esto asegura que las importaciones encuentren los archivos correctamente
      '@': './',
    },
  },
})
