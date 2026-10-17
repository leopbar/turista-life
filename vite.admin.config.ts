import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Painel "Turista-Life Administração": mora em admin/ e é servido pelo servidor Python (server/).
// Em desenvolvimento, os pedidos /api vão para o servidor local na porta 8011.
export default defineConfig({
  root: 'admin',
  base: '/',
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: { plugins: ['babel-plugin-macros'] },
    }),
  ],
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    port: Number(process.env.PORT) || 4322,
    strictPort: true,
    proxy: { '/api': 'http://127.0.0.1:8011' },
  },
})
