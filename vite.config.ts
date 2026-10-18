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
  // O twin.macro só cria o import do @emotion/styled ao compilar: sem isto o Vite o descobre com a página
  // já abrindo, re-otimiza no meio e a página fica em branco ("Invalid hook call", dois Reacts).
  // Um cache por porta: o site (4321) e a pré-visualização (4323) rodam juntos com configurações diferentes e,
  // na mesma pasta, um apagava o cache do outro (página em branco, erro 504 "Outdated Optimize Dep").
  cacheDir: `node_modules/.vite/site-${process.env.PORT || 4321}`,
  optimizeDeps: {
    include: ['@emotion/react', '@emotion/react/jsx-runtime', '@emotion/react/jsx-dev-runtime', '@emotion/styled'],
  },
  // Porta fixa: a 5173 padrão costuma estar ocupada pelo Docker nesta máquina.
  server: {
    port: Number(process.env.PORT) || 4321,
    strictPort: true,
    // Conteúdo publicado pelo painel (rodando localmente na porta 8011, launch "painel-api").
    // /api e /site/cms: pré-visualização (BASE_PATH=/site/) aberta direto na 4323, fora do painel.
    proxy: {
      '/cms': { target: 'http://127.0.0.1:8011', rewrite: (p) => `/site${p}` },
      '/site/cms': 'http://127.0.0.1:8011',
      '/api': 'http://127.0.0.1:8011',
    },
  },
})
