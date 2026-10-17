import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // Caminho onde o site é publicado. Local: "/". No servidor: BASE_PATH=/turista-life/ (ver Dockerfile).
  base: process.env.BASE_PATH || '/',
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: { plugins: ['babel-plugin-macros'] },
    }),
  ],
  // Porta fixa: a 5173 padrão costuma estar ocupada pelo Docker nesta máquina.
  server: {
    port: Number(process.env.PORT) || 4321,
    strictPort: true,
    // Conteúdo publicado pelo painel (rodando localmente na porta 8011, launch "painel-api").
    proxy: { '/cms': { target: 'http://127.0.0.1:8011', rewrite: (p) => `/site${p}` } },
  },
})
