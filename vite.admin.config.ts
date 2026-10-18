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
  // O twin.macro só cria o import do @emotion/styled ao compilar (ver vite.config.ts).
  // Cache próprio (o site e a pré-visualização têm os deles; ver vite.config.ts).
  cacheDir: '../node_modules/.vite/painel',
  optimizeDeps: {
    include: ['@emotion/react', '@emotion/react/jsx-runtime', '@emotion/react/jsx-dev-runtime', '@emotion/styled'],
  },
  build: { outDir: 'dist', emptyOutDir: true },
  server: {
    port: Number(process.env.PORT) || 4322,
    strictPort: true,
    // /site é a pré-visualização: em desenvolvimento, o site roda à parte (launch "site-preview", porta 4323).
    proxy: {
      '/api': 'http://127.0.0.1:8011',
      '/site/cms': 'http://127.0.0.1:8011',
      '/site': { target: 'http://localhost:4323', ws: true },
    },
  },
})
