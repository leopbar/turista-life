# Turista Life

Site da Laura Irigoyen ([@turistalife](https://www.youtube.com/@turistalife)), que documenta a construção da sua liberdade geográfica: viagens pelo mundo, guias, e-books e recomendações de quem vive na estrada.

## Stack

- React 18 + TypeScript, Vite
- [twin.macro](https://github.com/ben-rogerson/twin.macro) (Tailwind CSS 3 + Emotion)
- React Router

## Rodando localmente

```bash
npm install
npm run dev
```

Build de produção: `npm run build` (saída em `dist/`). Por ser uma SPA com rotas, a hospedagem precisa redirecionar todas as URLs para `index.html`.

## Onde editar o conteúdo

| Arquivo | Conteúdo |
|---|---|
| `src/content.ts` | Página inicial, menu, links e redes |
| `src/pagesContent.ts` | Produtos, Recomendações e Parcerias (mídia kit) |
| `src/diaryContent.ts` | Diário de bordo: paradas, fechamentos de mês e vídeos |
| `src/aboutContent.ts` | Sobre mim |

O mapa da rota usa contornos do [Natural Earth](https://www.naturalearthdata.com/) (domínio público), gerados por `node scripts/build-map.mjs`.

As fotos são frames dos vídeos do canal da Laura e pertencem a ela.
