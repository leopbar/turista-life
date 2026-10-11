import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: '@emotion/react',
      babel: { plugins: ['babel-plugin-macros'] },
    }),
  ],
  // Porta fixa: a 5173 padrão costuma estar ocupada pelo Docker nesta máquina.
  server: { port: Number(process.env.PORT) || 4321, strictPort: true },
})
